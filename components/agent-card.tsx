import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAgentColorClass, getCategoryColor } from "@/lib/agent-categories";
import type { AgentSummary } from "@/lib/agents";
import { ChevronRight } from "lucide-react";

interface AgentCardProps {
  agent: AgentSummary;
  usageCount?: number;
  isActive?: boolean;
}

export function AgentCard({ agent, usageCount = 0, isActive = false }: AgentCardProps) {
  return (
    <Link
      href={`/agents/${agent.slug}`}
      className="group block"
    >
      <article
        className={cn(
          "relative h-full p-5 rounded-xl border border-border bg-card",
          "transition-all duration-200",
          "hover:border-primary/50 hover:bg-card/80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        {/* Status indicator */}
        {isActive && (
          <div className="absolute top-3 right-3">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green" />
            </span>
          </div>
        )}

        {/* Color bar */}
        <div
          className={cn(
            "w-10 h-1 rounded-full mb-4",
            getAgentColorClass(agent.color)
          )}
        />

        {/* Content */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-balance">
              {agent.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {agent.categoryName}
            </p>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {agent.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <span
              className={cn(
                "text-xs px-2 py-1 rounded-md border",
                getCategoryColor(agent.color)
              )}
            >
              {agent.color}
            </span>

            <div className="flex items-center gap-2">
              {usageCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {usageCount} uses
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
