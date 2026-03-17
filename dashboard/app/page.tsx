import { getAllAgents, getUniqueCategories } from '@/lib/agents';
import AgentGrid from '@/components/AgentGrid';

export default function Home() {
  const agents = getAllAgents();
  const categories = getUniqueCategories(agents);

  // Serialize only the fields needed by the client (omit heavy `content`)
  const agentSummaries = agents.map(({ slug, name, description, color, category }) => ({
    slug,
    name,
    description,
    color,
    category,
    content: '',
    filePath: '',
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🤖 The Agency
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Browse {agents.length} specialized AI agent personalities
              </p>
            </div>
            <a
              href="https://github.com/Chr1sM1nas/agenticcollective-agency-agents"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              GitHub →
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AgentGrid agents={agentSummaries} categories={categories} />
      </main>
    </div>
  );
}
