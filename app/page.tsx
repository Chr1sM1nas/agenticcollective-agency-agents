import { Dashboard } from "@/components/dashboard";
import { getAllAgents, getAgentCount } from "@/lib/agents";

export default function HomePage() {
  const agents = getAllAgents();
  const agentCounts = getAgentCount();

  return <Dashboard agents={agents} agentCounts={agentCounts} />;
}
