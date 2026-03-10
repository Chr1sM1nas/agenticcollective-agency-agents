import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { categories } from "./agent-categories";

export interface Agent {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  category: string;
  categoryName: string;
  content: string;
  filePath: string;
}

export interface AgentSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  category: string;
  categoryName: string;
}

const AGENT_DIRECTORIES = [
  "engineering",
  "design",
  "marketing",
  "product",
  "project-management",
  "testing",
  "support",
  "spatial-computing",
  "game-development",
  "specialized",
];

function getCategoryName(categoryId: string): string {
  const cat = categories.find((c) => c.id === categoryId);
  return cat?.name || categoryId;
}

function generateSlug(filePath: string, category: string): string {
  const fileName = path.basename(filePath, ".md");
  return `${category}/${fileName}`;
}

function generateId(filePath: string): string {
  return path.basename(filePath, ".md");
}

export function getAllAgents(): AgentSummary[] {
  const agents: AgentSummary[] = [];
  const projectRoot = process.cwd();

  for (const category of AGENT_DIRECTORIES) {
    const categoryPath = path.join(projectRoot, category);

    if (!fs.existsSync(categoryPath)) {
      continue;
    }

    const files = getAllMarkdownFiles(categoryPath);

    for (const filePath of files) {
      try {
        const fileContents = fs.readFileSync(filePath, "utf8");
        const { data } = matter(fileContents);

        if (data.name && data.description) {
          const relativePath = path.relative(projectRoot, filePath);
          const categoryFromPath = relativePath.split(path.sep)[0];

          agents.push({
            id: generateId(filePath),
            slug: generateSlug(relativePath, categoryFromPath),
            name: data.name,
            description: data.description,
            color: data.color || "cyan",
            category: categoryFromPath,
            categoryName: getCategoryName(categoryFromPath),
          });
        }
      } catch {
        // Skip files that can't be parsed
      }
    }
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

export function getAgentBySlug(slug: string): Agent | null {
  const projectRoot = process.cwd();
  const filePath = path.join(projectRoot, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    if (!data.name) {
      return null;
    }

    const category = slug.split("/")[0];

    return {
      id: generateId(filePath),
      slug,
      name: data.name,
      description: data.description || "",
      color: data.color || "cyan",
      category,
      categoryName: getCategoryName(category),
      content,
      filePath,
    };
  } catch {
    return null;
  }
}

export function getAgentsByCategory(categoryId: string): AgentSummary[] {
  return getAllAgents().filter((agent) => agent.category === categoryId);
}

export function getAgentCount(): Record<string, number> {
  const agents = getAllAgents();
  const counts: Record<string, number> = {};

  for (const cat of categories) {
    counts[cat.id] = 0;
  }

  for (const agent of agents) {
    if (counts[agent.category] !== undefined) {
      counts[agent.category]++;
    }
  }

  return counts;
}
