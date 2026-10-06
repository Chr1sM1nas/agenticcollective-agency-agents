CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id),
  name text NOT NULL,
  UNIQUE (agency_id, name)
);
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id),
  name text NOT NULL,
  UNIQUE (agency_id, name)
);
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id),
  deployment_id uuid NOT NULL REFERENCES deployments(id),
  brief jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','awaiting_approval','approved','changes_requested','rejected','needs_review','failed')),
  plan jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id uuid NOT NULL REFERENCES workflow_runs(id),
  stage text NOT NULL CHECK (stage IN ('director','research','strategy','critic')),
  position integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','complete','failed')),
  attempt integer NOT NULL DEFAULT 0 CHECK (attempt BETWEEN 0 AND 2),
  agent_id text,
  UNIQUE (workflow_run_id, stage)
);
CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id),
  attempt integer NOT NULL CHECK (attempt BETWEEN 1 AND 2),
  agent_id text NOT NULL,
  agent_name text NOT NULL,
  prompt_hash text NOT NULL,
  prompt_snapshot text NOT NULL,
  input jsonb NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','complete','failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms integer,
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(16,8),
  error text,
  UNIQUE (task_id, attempt)
);
CREATE TABLE IF NOT EXISTS artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id uuid NOT NULL REFERENCES workflow_runs(id),
  agent_run_id uuid REFERENCES agent_runs(id),
  kind text NOT NULL CHECK (kind IN ('director','research','strategy','critic','final')),
  version integer NOT NULL,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workflow_run_id, kind, version)
);
CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id uuid NOT NULL REFERENCES workflow_runs(id),
  critic_artifact_id uuid NOT NULL REFERENCES artifacts(id),
  strategy_artifact_id uuid NOT NULL REFERENCES artifacts(id),
  scores jsonb NOT NULL,
  overall_score numeric NOT NULL CHECK (overall_score BETWEEN 0 AND 10),
  verdict text NOT NULL CHECK (verdict IN ('PASS','REVISE')),
  feedback jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((overall_score >= 7.5 AND verdict = 'PASS') OR (overall_score < 7.5 AND verdict = 'REVISE'))
);
CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id uuid NOT NULL REFERENCES workflow_runs(id),
  artifact_id uuid NOT NULL REFERENCES artifacts(id),
  evaluation_id uuid NOT NULL REFERENCES evaluations(id),
  decision text NOT NULL CHECK (decision IN ('approve','request_changes','reject')),
  feedback text NOT NULL DEFAULT '',
  actor text NOT NULL DEFAULT 'local-human',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workflow_run_id)
);
CREATE INDEX IF NOT EXISTS workflow_queue ON workflow_runs (created_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS artifact_lookup ON artifacts (workflow_run_id, kind, version);
INSERT INTO agencies(name) VALUES ('Agentic Collective') ON CONFLICT (name) DO NOTHING;
INSERT INTO deployments(agency_id, name)
SELECT id, 'Agency Zero' FROM agencies WHERE name = 'Agentic Collective'
ON CONFLICT (agency_id, name) DO NOTHING;