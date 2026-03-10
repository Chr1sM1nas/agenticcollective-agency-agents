"use client";

import { AgentCard } from "./agent-card";
import { StatsBar } from "./stats-bar";
import type { AgentSummary } from "@/lib/agents";
import type { UsageData } from "@/lib/usage-tracking";
import { Search, SlidersHorizontal } from "lucide-react";

interface AgentGridProps {
  agents: AgentSummary[];
  usageData: UsageData[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
}

export function AgentGrid({
  agents,
  usageData,
  searchQuery,
  onSearchChange,
  selectedCategory,
}: AgentGridProps) {
  const usageMap = new Map(usageData.map((u) => [u.agentId, u]));

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      searchQuery === "" ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === null || agent.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="pl-12 lg:pl-0">
              <h2 className="text-xl font-semibold text-foreground">
                {selectedCategory
                  ? agents.find((a) => a.category === selectedCategory)?.categoryName ||
                    "Agents"
                  : "All Agents"}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {filteredAgents.length} agent{filteredAgents.length !== 1 ? "s" : ""}{" "}
                {searchQuery && "found"}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 px-6 lg:px-8 py-6">
        {/* Stats */}
        {selectedCategory === null && searchQuery === "" && (
          <StatsBar totalAgents={agents.length} />
        )}

        {filteredAgents.length === 0 ? (
          <EmptyState searchQuery={searchQuery} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredAgents.map((agent) => {
              const usage = usageMap.get(agent.id);
              return (
                <AgentCard
                  key={agent.slug}
                  agent={agent}
                  usageCount={usage?.activationCount || 0}
                  isActive={usage?.isActive || false}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
        <SlidersHorizontal className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">No agents found</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {searchQuery
          ? `No agents match "${searchQuery}". Try a different search term.`
          : "No agents available in this category."}
      </p>
    </div>
  );
}
