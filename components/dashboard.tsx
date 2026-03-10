"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { AgentGrid } from "./agent-grid";
import type { AgentSummary } from "@/lib/agents";
import { getAllUsageData, type UsageData } from "@/lib/usage-tracking";

interface DashboardProps {
  agents: AgentSummary[];
  agentCounts: Record<string, number>;
}

export function Dashboard({ agents, agentCounts }: DashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [usageData, setUsageData] = useState<UsageData[]>([]);

  useEffect(() => {
    setUsageData(getAllUsageData());
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        agentCounts={agentCounts}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <AgentGrid
        agents={agents}
        usageData={usageData}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
      />
    </div>
  );
}
