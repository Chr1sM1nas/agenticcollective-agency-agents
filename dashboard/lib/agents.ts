import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Root of the repository (one level up from the dashboard)
const REPO_ROOT = path.join(process.cwd(), '..');

const CATEGORY_DIRS = [
  'engineering',
  'design',
  'marketing',
  'product',
  'project-management',
  'testing',
  'support',
  'specialized',
  'spatial-computing',
  'game-development',
];

export type Agent = {
  slug: string;
  name: string;
  description: string;
  color: string;
  category: string;
  content: string;
  filePath: string;
};

// Recursively collect all .md files under a directory
function collectMdFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMdFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function categoryLabel(dir: string): string {
  return dir
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function parseFrontmatter(
  raw: string
): { data: Record<string, string>; content: string } {
  try {
    const { data, content } = matter(raw);
    return { data: data as Record<string, string>, content };
  } catch {
    // Fall back: strip the frontmatter block and return empty data
    const stripped = raw.replace(/^---[\s\S]*?---\n?/, '');
    return { data: {}, content: stripped };
  }
}

export function getAllAgents(): Agent[] {
  const agents: Agent[] = [];

  for (const category of CATEGORY_DIRS) {
    const categoryPath = path.join(REPO_ROOT, category);
    const files = collectMdFiles(categoryPath);

    for (const filePath of files) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = parseFrontmatter(raw);
      const fileName = path.basename(filePath, '.md');

      agents.push({
        slug: fileName,
        name: data.name || fileName.replace(/-/g, ' '),
        description: data.description || '',
        color: data.color || 'blue',
        category: categoryLabel(category),
        content,
        filePath,
      });
    }
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

export function getAgentBySlug(slug: string): Agent | undefined {
  return getAllAgents().find((a) => a.slug === slug);
}

export function getUniqueCategories(agents: Agent[]): string[] {
  return Array.from(new Set(agents.map((a) => a.category))).sort();
}
