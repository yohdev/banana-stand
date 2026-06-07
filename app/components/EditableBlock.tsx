"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import CopyButton from "./CopyButton";

/**
 * A code block whose contents are editable. It follows `template` (which can
 * change when the instance URL changes) until the user edits it; after that the
 * user's text is preserved and a Reset link regenerates from the current
 * template. Copy always copies whatever is currently in the box.
 */
export default function EditableBlock({
  template,
  ariaLabel,
  copyLabel = "Copy",
  style,
}: {
  template: string;
  ariaLabel: string;
  copyLabel?: string;
  style?: React.CSSProperties;
}) {
  const [value, setValue] = useState(template);
  const [edited, setEdited] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  // Follow the template (e.g. on instance-URL change) until the user takes over.
  useEffect(() => {
    if (!edited) setValue(template);
  }, [template, edited]);

  // Grow to fit the content so there's no inner scrollbar.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  function reset() {
    setValue(template);
    setEdited(false);
  }

  return (
    <div className="codeblock editable" style={style}>
      <div className="editable-bar">
        <span className="editable-hint">
          {edited ? "Edited" : "Editable — tweak before copying"}
        </span>
        <div className="editable-actions">
          {edited && (
            <button type="button" className="reset-link" onClick={reset}>
              Reset
            </button>
          )}
          <CopyButton text={value} label={copyLabel} />
        </div>
      </div>
      <textarea
        ref={ref}
        className="mono"
        aria-label={ariaLabel}
        spellCheck={false}
        value={value}
        rows={1}
        onChange={(e) => {
          setValue(e.target.value);
          setEdited(true);
        }}
      />
    </div>
  );
}
