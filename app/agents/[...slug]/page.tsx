import { notFound } from "next/navigation";
import { getAgentBySlug, getAllAgents } from "@/lib/agents";
import { AgentDetailView } from "@/components/agent-detail-view";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const agent = getAgentBySlug(slugPath);

  if (!agent) {
    return {
      title: "Agent Not Found | The Agency",
    };
  }

  return {
    title: `${agent.name} | The Agency`,
    description: agent.description,
  };
}

export async function generateStaticParams() {
  const agents = getAllAgents();
  return agents.map((agent) => ({
    slug: agent.slug.split("/"),
  }));
}

export default async function AgentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const agent = getAgentBySlug(slugPath);

  if (!agent) {
    notFound();
  }

  return <AgentDetailView agent={agent} />;
}
