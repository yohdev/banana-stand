"use client";

import CopyButton from "./CopyButton";
import { useInstance } from "./InstanceProvider";
import { buildExampleUrl, buildUrlAnatomy } from "../instance";

export default function UrlExampleBlock() {
  const { base } = useInstance();

  return (
    <div className="codeblock" style={{ marginBottom: 28 }}>
      <div className="copy-affordance">
        <CopyButton text={buildExampleUrl(base)} label="Copy" />
      </div>
      <pre>{buildUrlAnatomy(base)}</pre>
    </div>
  );
}
