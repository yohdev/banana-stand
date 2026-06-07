"use client";

import CopyButton from "./CopyButton";
import { useInstance } from "./InstanceProvider";
import { buildClaudeMdSnippet } from "../instance";

export default function SnippetBlock() {
  const { base } = useInstance();
  const text = buildClaudeMdSnippet(base);

  return (
    <div className="codeblock" style={{ maxWidth: 760 }}>
      <div className="copy-affordance">
        <CopyButton text={text} label="Copy snippet" />
      </div>
      <pre>{text}</pre>
    </div>
  );
}
