ALTER TABLE tasks DROP CONSTRAINT tasks_attempt_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_attempt_check CHECK (attempt BETWEEN 0 AND 3);
ALTER TABLE agent_runs DROP CONSTRAINT agent_runs_attempt_check;
ALTER TABLE agent_runs ADD CONSTRAINT agent_runs_attempt_check CHECK (attempt BETWEEN 1 AND 3);

ALTER TABLE workflow_runs ADD COLUMN quality_policy jsonb;
ALTER TABLE evaluations ADD COLUMN quality_threshold numeric NOT NULL DEFAULT 7.5
  CHECK (quality_threshold BETWEEN 0 AND 10);
ALTER TABLE evaluations DROP CONSTRAINT evaluations_check;
ALTER TABLE evaluations ADD CONSTRAINT evaluations_check CHECK (
  (overall_score >= quality_threshold AND verdict = 'PASS') OR
  (overall_score < quality_threshold AND verdict = 'REVISE')
);
