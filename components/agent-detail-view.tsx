"use client";

import { cn } from "@/lib/utils";
import { getAgentColorClass, getCategoryColor } from "@/lib/agent-categories";
import type { Agent } from "@/lib/agents";
import { ActivationButton } from "./activation-button";
import { ArrowLeft, Copy, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface AgentDetailViewProps {
  agent: Agent;
}

export function AgentDetailView({ agent }: AgentDetailViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = async () => {
    const prompt = `You are ${agent.name}. ${agent.description}\n\n${agent.content}`;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-foreground truncate">
                {agent.name}
              </h1>
              <p className="text-sm text-muted-foreground">{agent.categoryName}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Agent Card */}
            <div className="p-6 rounded-xl border border-border bg-card">
              {/* Color bar */}
              <div
                className={cn(
                  "w-full h-2 rounded-full mb-6",
                  getAgentColorClass(agent.color)
                )}
              />

              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {agent.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {agent.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-lg border",
                      getCategoryColor(agent.color)
                    )}
                  >
                    {agent.categoryName}
                  </span>
                  <span
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-lg border",
                      getCategoryColor(agent.color)
                    )}
                  >
                    {agent.color}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-medium text-foreground">Actions</h3>
              
              <ActivationButton agentId={agent.id} agentName={agent.name} />

              <button
                onClick={handleCopyPrompt}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Agent Prompt</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Links */}
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <h3 className="font-medium text-foreground">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View All Agents
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="p-6 lg:p-8 rounded-xl border border-border bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Agent Specification
              </h3>
              <div className="prose prose-invert prose-sm max-w-none">
                <AgentContent content={agent.content} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function AgentContent({ content }: { content: string }) {
  // Parse markdown content into sections
  const sections = content.split(/^## /gm).filter(Boolean);

  return (
    <div className="space-y-8">
      {sections.map((section, index) => {
        const [title, ...bodyLines] = section.split("\n");
        const body = bodyLines.join("\n").trim();

        return (
          <section key={index} className="space-y-4">
            {title && (
              <h4 className="text-base font-semibold text-foreground border-b border-border pb-2">
                {title.replace(/^#+\s*/, "")}
              </h4>
            )}
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              <FormattedContent content={body} />
            </div>
          </section>
        );
      })}
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  // Handle code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
          if (match) {
            const [, lang, code] = match;
            return (
              <pre
                key={index}
                className="bg-background rounded-lg p-4 overflow-x-auto my-4 border border-border"
              >
                <code className="text-xs font-mono text-foreground">{code.trim()}</code>
              </pre>
            );
          }
        }

        // Handle inline formatting
        return (
          <span key={index}>
            {part.split("\n").map((line, lineIndex) => (
              <span key={lineIndex}>
                {line
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/`([^`]+)`/g, "<code>$1</code>")
                  .split(/(<[^>]+>.*?<\/[^>]+>)/g)
                  .map((segment, segIndex) => {
                    if (segment.startsWith("<strong>")) {
                      return (
                        <strong key={segIndex} className="text-foreground font-medium">
                          {segment.replace(/<\/?strong>/g, "")}
                        </strong>
                      );
                    }
                    if (segment.startsWith("<code>")) {
                      return (
                        <code
                          key={segIndex}
                          className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono"
                        >
                          {segment.replace(/<\/?code>/g, "")}
                        </code>
                      );
                    }
                    return segment;
                  })}
                {lineIndex < part.split("\n").length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      })}
    </>
  );
}
