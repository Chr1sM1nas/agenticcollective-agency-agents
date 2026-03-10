export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const categories: Category[] = [
  {
    id: "engineering",
    name: "Engineering",
    description: "Frontend, backend, DevOps, security, and AI specialists",
    icon: "Code2",
    color: "cyan",
  },
  {
    id: "design",
    name: "Design",
    description: "UI, UX, brand, and visual design experts",
    icon: "Palette",
    color: "purple",
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Growth, content, social media, and SEO specialists",
    icon: "Megaphone",
    color: "orange",
  },
  {
    id: "product",
    name: "Product",
    description: "Sprint planning, feedback, trends, and strategy",
    icon: "Lightbulb",
    color: "yellow",
  },
  {
    id: "project-management",
    name: "Project Management",
    description: "Studio production, project shepherding, and workflow",
    icon: "FolderKanban",
    color: "blue",
  },
  {
    id: "testing",
    name: "Testing",
    description: "QA, accessibility, performance, and API testing",
    icon: "TestTube2",
    color: "green",
  },
  {
    id: "support",
    name: "Support",
    description: "Customer support, finance, legal, and infrastructure",
    icon: "HeadsetIcon",
    color: "teal",
  },
  {
    id: "spatial-computing",
    name: "Spatial Computing",
    description: "XR, visionOS, WebXR, and immersive development",
    icon: "Glasses",
    color: "indigo",
  },
  {
    id: "game-development",
    name: "Game Development",
    description: "Unity, Unreal, Godot, Roblox, and cross-engine",
    icon: "Gamepad2",
    color: "pink",
  },
  {
    id: "specialized",
    name: "Specialized",
    description: "Orchestration, data analytics, identity, and compliance",
    icon: "Sparkles",
    color: "red",
  },
];

export function getCategoryById(id: string): Category | undefined {
  return categories.find((cat) => cat.id === id);
}

export function getCategoryColor(color: string): string {
  const colorMap: Record<string, string> = {
    cyan: "bg-cyan/20 text-cyan border-cyan/30",
    purple: "bg-purple/20 text-purple border-purple/30",
    orange: "bg-orange/20 text-orange border-orange/30",
    yellow: "bg-yellow/20 text-yellow border-yellow/30",
    blue: "bg-blue/20 text-blue border-blue/30",
    green: "bg-green/20 text-green border-green/30",
    teal: "bg-teal/20 text-teal border-teal/30",
    indigo: "bg-indigo/20 text-indigo border-indigo/30",
    pink: "bg-pink/20 text-pink border-pink/30",
    red: "bg-red/20 text-red border-red/30",
  };
  return colorMap[color] || colorMap.cyan;
}

export function getAgentColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    cyan: "bg-cyan",
    purple: "bg-purple",
    orange: "bg-orange",
    yellow: "bg-yellow",
    blue: "bg-blue",
    green: "bg-green",
    teal: "bg-teal",
    indigo: "bg-indigo",
    pink: "bg-pink",
    red: "bg-red",
  };
  return colorMap[color] || colorMap.cyan;
}
