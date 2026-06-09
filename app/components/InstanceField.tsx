"use client";

import { useInstance } from "./InstanceProvider";

export default function InstanceField() {
  const { input, setInput, base, defaultInstance, isCustom } = useInstance();

  return (
    <div className="field">
      <label htmlFor="instance">Your Banana Stand instance</label>
      <div className="field-row">
        <input
          id="instance"
          className="mono"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder={defaultInstance}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-describedby="instance-hint"
        />
        {isCustom && (
          <button type="button" className="btn btn-ghost" onClick={() => setInput("")}>
            Reset
          </button>
        )}
      </div>
      <span id="instance-hint" className="hint">
        {isCustom ? (
          <>
            Snippets now point at <code>{base}</code>.
          </>
        ) : (
          <>Paste your deployed URL — every snippet below updates to match.</>
        )}
      </span>
    </div>
  );
}
