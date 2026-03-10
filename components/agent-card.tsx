import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Agent } from "@/lib/agents";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40",
    purple: "bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40",
    green: "bg-green-500/10 border-green-500/20 hover:border-green-500/40",
    red: "bg-red-500/10 border-red-500/20 hover:border-red-500/40",
    orange: "bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40",
    yellow: "bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/40",
    pink: "bg-pink-500/10 border-pink-500/20 hover:border-pink-500/40",
    teal: "bg-teal-500/10 border-teal-500/20 hover:border-teal-500/40",
  };

  const iconColorClasses: Record<string, string> = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    green: "text-green-600",
    red: "text-red-600",
    orange: "text-orange-600",
    yellow: "text-yellow-600",
    pink: "text-pink-600",
    teal: "text-teal-600",
  };

  const cardClass = colorClasses[agent.color] || colorClasses.blue;
  const iconClass = iconColorClasses[agent.color] || iconColorClasses.blue;

  return (
    <Link
      href={`/agent/${agent.slug}`}
      className={`group flex flex-col rounded-xl border p-5 transition-all duration-200 hover:shadow-md ${cardClass}`}
    >
      <div className="mb-3 flex items-start justify-between">
        <h4 className="text-lg font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))]">
          {agent.name}
        </h4>
        <ArrowRight
          className={`h-5 w-5 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 ${iconClass}`}
        />
      </div>
      {agent.description && (
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          {agent.description}
        </p>
      )}
    </Link>
  );
}
