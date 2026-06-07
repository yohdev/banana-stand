"use client";

import CopyButton from "./CopyButton";
import { useInstance } from "./InstanceProvider";
import { buildClaudePrompt } from "../instance";

export default function PromptBlock() {
  const { base } = useInstance();
  const text = buildClaudePrompt(base);

  return (
    <div className="codeblock" style={{ marginTop: 20 }}>
      <div className="copy-affordance">
        <CopyButton text={text} label="Copy prompt" />
      </div>
      <pre>{text}</pre>
    </div>
  );
}
