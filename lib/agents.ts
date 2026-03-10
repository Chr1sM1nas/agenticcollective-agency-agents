import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface Agent {
  slug: string;
  category: string;
  name: string;
  description: string;
  color: string;
  content: string;
}

export interface Category {
  name: string;
  slug: string;
  agents: Agent[];
}

const AGENT_DIRECTORIES = [
  "design",
  "engineering",
  "marketing",
  "product",
  "project-management",
  "testing",
  "support",
  "spatial-computing",
  "specialized",
  "game-development",
];

function getCategoryName(dir: string): string {
  const names: Record<string, string> = {
    design: "Design",
    engineering: "Engineering",
    marketing: "Marketing",
    product: "Product",
    "project-management": "Project Management",
    testing: "Testing",
    support: "Support",
    "spatial-computing": "Spatial Computing",
    specialized: "Specialized",
    "game-development": "Game Development",
  };
  return names[dir] || dir;
}

function getAllMarkdownFiles(dirPath: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dirPath)) {
    return files;
  }

  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith(".md") && !item.name.startsWith("README")) {
      files.push(fullPath);
    }
  }

  return files;
}

export function getAllAgents(): Agent[] {
  const agents: Agent[] = [];
  const rootDir = process.cwd();

  for (const dir of AGENT_DIRECTORIES) {
    const dirPath = path.join(rootDir, dir);
    const files = getAllMarkdownFiles(dirPath);

    for (const filePath of files) {
      const fileContents = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(fileContents);

      const relativePath = path.relative(rootDir, filePath);
      const slug = relativePath.replace(/\.md$/, "").replace(/\//g, "-");

      agents.push({
        slug,
        category: dir,
        name: data.name || path.basename(filePath, ".md"),
        description: data.description || "",
        color: data.color || "blue",
        content,
      });
    }
  }

  return agents;
}

export function getAgentBySlug(slug: string): Agent | undefined {
  const agents = getAllAgents();
  return agents.find((agent) => agent.slug === slug);
}

export function getAgentsByCategory(): Category[] {
  const agents = getAllAgents();
  const categoryMap = new Map<string, Agent[]>();

  for (const agent of agents) {
    const existing = categoryMap.get(agent.category) || [];
    existing.push(agent);
    categoryMap.set(agent.category, existing);
  }

  const categories: Category[] = [];
  for (const dir of AGENT_DIRECTORIES) {
    const categoryAgents = categoryMap.get(dir);
    if (categoryAgents && categoryAgents.length > 0) {
      categories.push({
        name: getCategoryName(dir),
        slug: dir,
        agents: categoryAgents.sort((a, b) => a.name.localeCompare(b.name)),
      });
    }
  }

  return categories;
}
