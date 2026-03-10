"use client";

import type { Category } from "@/lib/agents";

interface CategoryNavProps {
  categories: Category[];
}

export function CategoryNav({ categories }: CategoryNavProps) {
  const handleClick = (slug: string) => {
    const element = document.getElementById(slug);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="mb-12 flex flex-wrap items-center justify-center gap-2">
      {categories.map((category) => (
        <button
          key={category.slug}
          onClick={() => handleClick(category.slug)}
          className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--primary))]"
        >
          {category.name}
        </button>
      ))}
    </nav>
  );
}
