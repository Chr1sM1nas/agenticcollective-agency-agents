import { getAgentsByCategory } from "@/lib/agents";
import { AgentCard } from "@/components/agent-card";
import { CategoryNav } from "@/components/category-nav";
import { Bot, Github } from "lucide-react";

export default function HomePage() {
  const categories = getAgentsByCategory();
  const totalAgents = categories.reduce((sum, cat) => sum + cat.agents.length, 0);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">The Agency</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">AI Specialists</p>
            </div>
          </div>
          <a
            href="https://github.com/msitarzewski/agency-agents"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">View on GitHub</span>
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] sm:text-5xl">
            A complete AI agency at your fingertips
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-[hsl(var(--muted-foreground))]">
            From frontend wizards to Reddit community ninjas, from whimsy injectors to reality
            checkers. Each agent is a specialized expert with personality, processes, and proven
            deliverables.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-[hsl(var(--muted-foreground))]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[hsl(var(--foreground))]">{totalAgents}</span>
              <span>Agents</span>
            </div>
            <div className="h-4 w-px bg-[hsl(var(--border))]" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[hsl(var(--foreground))]">{categories.length}</span>
              <span>Categories</span>
            </div>
          </div>
        </div>

        <CategoryNav categories={categories} />

        <div className="space-y-16">
          {categories.map((category) => (
            <section key={category.slug} id={category.slug} className="scroll-mt-24">
              <div className="mb-6 flex items-center gap-3">
                <h3 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
                  {category.name}
                </h3>
                <span className="rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  {category.agents.length} agents
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.agents.map((agent) => (
                  <AgentCard key={agent.slug} agent={agent} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <footer className="mt-16 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
            The Agency - AI Specialists Collection.{" "}
            <a
              href="https://github.com/msitarzewski/agency-agents"
              className="text-[hsl(var(--primary))] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
