"use client";

import { cn } from "@/lib/utils";
import { categories, getCategoryColor, type Category } from "@/lib/agent-categories";
import {
  Code2,
  Palette,
  Megaphone,
  Lightbulb,
  FolderKanban,
  TestTube2,
  Headset,
  Glasses,
  Gamepad2,
  Sparkles,
  X,
  Menu,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  agentCounts: Record<string, number>;
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2,
  Palette,
  Megaphone,
  Lightbulb,
  FolderKanban,
  TestTube2,
  HeadsetIcon: Headset,
  Glasses,
  Gamepad2,
  Sparkles,
};

function CategoryIcon({ iconName, className }: { iconName: string; className?: string }) {
  const Icon = iconMap[iconName];
  if (!Icon) return null;
  return <Icon className={className} />;
}

export function Sidebar({ agentCounts, selectedCategory, onSelectCategory }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const totalAgents = Object.values(agentCounts).reduce((sum, count) => sum + count, 0);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-card border-r border-border flex flex-col transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">The Agency</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {totalAgents} AI Agents
              </p>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 hover:bg-secondary rounded"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            {/* All Agents */}
            <button
              onClick={() => {
                onSelectCategory(null);
                setIsMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                selectedCategory === null
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <span>All Agents</span>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  selectedCategory === null
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {totalAgents}
              </span>
            </button>

            {/* Category divider */}
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Divisions
              </p>
            </div>

            {/* Categories */}
            {categories.map((category) => (
              <CategoryButton
                key={category.id}
                category={category}
                count={agentCounts[category.id] || 0}
                isSelected={selectedCategory === category.id}
                onClick={() => {
                  onSelectCategory(category.id);
                  setIsMobileOpen(false);
                }}
              />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Agentic Collective
          </p>
        </div>
      </aside>
    </>
  );
}

function CategoryButton({
  category,
  count,
  isSelected,
  onClick,
}: {
  category: Category;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isSelected
          ? cn("border", getCategoryColor(category.color))
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      <CategoryIcon iconName={category.icon} className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 text-left truncate">{category.name}</span>
      <span
        className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          isSelected ? "bg-white/10" : "bg-secondary text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  );
}
