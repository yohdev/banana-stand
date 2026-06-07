"use client";

import EditableBlock from "./EditableBlock";
import { useInstance } from "./InstanceProvider";
import { buildClaudePrompt } from "../instance";

export default function PromptBlock() {
  const { base } = useInstance();

  return (
    <EditableBlock
      template={buildClaudePrompt(base)}
      ariaLabel="Claude Code prompt"
      copyLabel="Copy prompt"
      style={{ marginTop: 20 }}
    />
  );
}
