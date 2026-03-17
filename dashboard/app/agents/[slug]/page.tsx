import { getAllAgents, getAgentBySlug } from '@/lib/agents';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export async function generateStaticParams() {
  const agents = getAllAgents();
  return agents.map((agent) => ({ slug: agent.slug }));
}

const COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 text-blue-900',
  green: 'bg-green-50 border-green-200 text-green-900',
  purple: 'bg-purple-50 border-purple-200 text-purple-900',
  red: 'bg-red-50 border-red-200 text-red-900',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  orange: 'bg-orange-50 border-orange-200 text-orange-900',
};

function headerBg(color: string) {
  return COLOR_CLASSES[color] ?? 'bg-gray-50 border-gray-200 text-gray-900';
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);
  if (!agent) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Agent header card */}
        <div className={`mb-8 rounded-2xl border p-6 ${headerBg(agent.color)}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              {agent.description && (
                <p className="mt-2 text-sm leading-relaxed opacity-80">
                  {agent.description}
                </p>
              )}
            </div>
            <span className="flex-shrink-0 rounded-full border border-current bg-white/60 px-3 py-1 text-xs font-medium opacity-80">
              {agent.category}
            </span>
          </div>
        </div>

        {/* Markdown content */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="prose prose-gray max-w-none prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-a:text-blue-600 prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-pre:rounded-xl prose-pre:bg-gray-900 prose-pre:text-gray-100">
            <ReactMarkdown>{agent.content}</ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  );
}
