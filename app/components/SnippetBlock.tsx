"use client";

import EditableBlock from "./EditableBlock";
import { useInstance } from "./InstanceProvider";
import { buildClaudeMdSnippet } from "../instance";

export default function SnippetBlock() {
  const { base } = useInstance();

  return (
    <EditableBlock
      template={buildClaudeMdSnippet(base)}
      ariaLabel="CLAUDE.md snippet"
      copyLabel="Copy snippet"
      style={{ maxWidth: 760 }}
    />
  );
}
