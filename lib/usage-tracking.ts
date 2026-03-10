"use client";

export interface UsageData {
  agentId: string;
  activationCount: number;
  lastActivated: string | null;
  isActive: boolean;
}

const STORAGE_KEY = "agency-agent-usage";

function getStorageData(): Record<string, UsageData> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function setStorageData(data: Record<string, UsageData>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage might be full or disabled
  }
}

export function getAgentUsage(agentId: string): UsageData {
  const data = getStorageData();
  return (
    data[agentId] || {
      agentId,
      activationCount: 0,
      lastActivated: null,
      isActive: false,
    }
  );
}

export function activateAgent(agentId: string): UsageData {
  const data = getStorageData();
  const existing = data[agentId] || {
    agentId,
    activationCount: 0,
    lastActivated: null,
    isActive: false,
  };

  const updated: UsageData = {
    ...existing,
    activationCount: existing.activationCount + 1,
    lastActivated: new Date().toISOString(),
    isActive: true,
  };

  data[agentId] = updated;
  setStorageData(data);

  return updated;
}

export function deactivateAgent(agentId: string): UsageData {
  const data = getStorageData();
  const existing = data[agentId];

  if (!existing) {
    return {
      agentId,
      activationCount: 0,
      lastActivated: null,
      isActive: false,
    };
  }

  const updated: UsageData = {
    ...existing,
    isActive: false,
  };

  data[agentId] = updated;
  setStorageData(data);

  return updated;
}

export function getAllUsageData(): UsageData[] {
  const data = getStorageData();
  return Object.values(data);
}

export function getActiveAgents(): UsageData[] {
  return getAllUsageData().filter((u) => u.isActive);
}

export function getTotalActivations(): number {
  return getAllUsageData().reduce((sum, u) => sum + u.activationCount, 0);
}

export function getMostUsedAgents(limit: number = 5): UsageData[] {
  return getAllUsageData()
    .sort((a, b) => b.activationCount - a.activationCount)
    .slice(0, limit);
}
