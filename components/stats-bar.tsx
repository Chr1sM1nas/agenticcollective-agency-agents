"use client";

import { useEffect, useState } from "react";
import { getActiveAgents, getTotalActivations, getMostUsedAgents } from "@/lib/usage-tracking";
import { Zap, Activity, TrendingUp } from "lucide-react";

interface StatsBarProps {
  totalAgents: number;
}

export function StatsBar({ totalAgents }: StatsBarProps) {
  const [stats, setStats] = useState({
    activeCount: 0,
    totalActivations: 0,
    topAgent: "",
  });

  useEffect(() => {
    const active = getActiveAgents();
    const total = getTotalActivations();
    const mostUsed = getMostUsedAgents(1);

    setStats({
      activeCount: active.length,
      totalActivations: total,
      topAgent: mostUsed[0]?.agentId || "",
    });
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <StatCard
        icon={<Activity className="w-4 h-4" />}
        label="Total Agents"
        value={totalAgents.toString()}
        color="text-cyan"
      />
      <StatCard
        icon={<Zap className="w-4 h-4" />}
        label="Active Now"
        value={stats.activeCount.toString()}
        color="text-green"
      />
      <StatCard
        icon={<TrendingUp className="w-4 h-4" />}
        label="Total Activations"
        value={stats.totalActivations.toString()}
        color="text-purple"
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3">
        <div className={`${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
