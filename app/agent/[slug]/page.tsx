import { getAllAgents, getAgentBySlug } from "@/lib/agents";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AgentContent } from "@/components/agent-content";

interface AgentPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const agents = getAllAgents();
  return agents.map((agent) => ({
    slug: agent.slug,
  }));
}

export async function generateMetadata({ params }: AgentPageProps) {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);

  if (!agent) {
    return {
      title: "Agent Not Found",
    };
  }

  return {
    title: `${agent.name} - The Agency`,
    description: agent.description,
  };
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);

  if (!agent) {
    notFound();
  }

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    green: "bg-green-500/10 text-green-600 border-green-500/20",
    red: "bg-red-500/10 text-red-600 border-red-500/20",
    orange: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    yellow: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    pink: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    teal: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  };

  const badgeClass = colorClasses[agent.color] || colorClasses.blue;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="sticky top-0 z-10 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/60">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Agents
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${badgeClass}`}
            >
              {agent.category.replace("-", " ")}
            </span>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-[hsl(var(--foreground))]">
            {agent.name}
          </h1>
          {agent.description && (
            <p className="text-lg text-[hsl(var(--muted-foreground))]">
              {agent.description}
            </p>
          )}
        </div>

        <div className="prose">
          <AgentContent content={agent.content} />
        </div>
      </main>
    </div>
  );
}
