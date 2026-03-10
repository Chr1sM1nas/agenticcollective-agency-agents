"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  activateAgent,
  deactivateAgent,
  getAgentUsage,
  type UsageData,
} from "@/lib/usage-tracking";
import { Zap, ZapOff, Check } from "lucide-react";

interface ActivationButtonProps {
  agentId: string;
  agentName: string;
}

export function ActivationButton({ agentId, agentName }: ActivationButtonProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    setUsage(getAgentUsage(agentId));
  }, [agentId]);

  const handleActivate = () => {
    const updated = activateAgent(agentId);
    setUsage(updated);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 2000);
  };

  const handleDeactivate = () => {
    const updated = deactivateAgent(agentId);
    setUsage(updated);
  };

  const isActive = usage?.isActive ?? false;

  return (
    <div className="space-y-3">
      <button
        onClick={isActive ? handleDeactivate : handleActivate}
        className={cn(
          "relative w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200",
          isActive
            ? "bg-green/20 text-green border border-green/30 hover:bg-green/30"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {showFeedback ? (
          <>
            <Check className="w-5 h-5" />
            <span>Activated!</span>
          </>
        ) : isActive ? (
          <>
            <ZapOff className="w-5 h-5" />
            <span>Deactivate {agentName}</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            <span>Activate {agentName}</span>
          </>
        )}
      </button>

      {usage && usage.activationCount > 0 && (
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>
            Activated {usage.activationCount} time
            {usage.activationCount !== 1 ? "s" : ""}
          </span>
          {usage.lastActivated && (
            <span>
              Last: {new Date(usage.lastActivated).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
