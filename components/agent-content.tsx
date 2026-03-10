"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AgentContentProps {
  content: string;
}

export function AgentContent({ content }: AgentContentProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}
