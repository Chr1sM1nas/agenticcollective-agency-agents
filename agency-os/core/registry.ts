import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import type { AgentDefinition } from './contracts.js';

const categories = ['design', 'engineering', 'game-development', 'marketing', 'product', 'project-management', 'spatial-computing', 'specialized', 'support', 'testing'];

export class AgentRegistry {
  private constructor(readonly agents: AgentDefinition[], readonly warnings: string[]) {}

  static async load(root: string): Promise<AgentRegistry> {
    const agents: AgentDefinition[] = [];
    const warnings: string[] = [];
    async function scan(directory: string, category: string): Promise<void> {
      const entries = await readdir(directory, { withFileTypes: true });
      for (const entry of entries.sort((first, second) => first.name.localeCompare(second.name))) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) await scan(file, category);
        else if (entry.isFile() && entry.name.endsWith('.md')) {
          const markdown = await readFile(file, 'utf8');
          const frontmatter = /^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown);
          if (!frontmatter) continue;
          let data: Record<string, unknown>;
          try {
            const parsed: unknown = parse(frontmatter[1], { maxAliasCount: 50 });
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
            data = parsed as Record<string, unknown>;
          }
          catch { warnings.push(`Skipped invalid frontmatter: ${path.relative(root, file)}`); continue; }
          if (typeof data.name !== 'string' || typeof data.description !== 'string') continue;
          agents.push({ id: path.relative(root, file).split(path.sep).join('/'), name: data.name, description: data.description, category, markdown, hash: createHash('sha256').update(markdown).digest('hex') });
        }
      }
    }
    for (const category of categories) {
      try { await scan(path.join(root, category), category); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    }
    if (agents.length === 0) throw new Error('No Markdown agent definitions found. Check AGENT_LIBRARY_ROOT.');
    return new AgentRegistry(agents, warnings);
  }

  candidates(role: 'research' | 'strategy'): AgentDefinition[] {
    const pattern = role === 'research' ? /research|market intelligence|competitive analysis/i : /strategist|strategy|growth hacker|product manager|brand guardian/i;
    return this.agents.filter(agent => ['product', 'marketing', 'design', 'specialized'].includes(agent.category) && pattern.test(`${agent.name} ${agent.description}`));
  }

  select(id: string, role: 'research' | 'strategy'): AgentDefinition {
    const agent = this.candidates(role).find(candidate => candidate.id === id);
    if (!agent) throw new Error(`Director selected an unavailable ${role} agent: ${id}`);
    return agent;
  }
}