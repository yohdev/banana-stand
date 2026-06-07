# Live resources — read these to stay current

The bundled reference files are a fast, offline snapshot. When you have web
access (especially in Mode B on claude.ai), **prefer the live links below** —
they're the source of truth and stay correct as the API and our resources
evolve. Fetch `/docs` to confirm parameters, styles, and limits before you rely
on the static copies here.

## Canonical links

| Resource | URL | What it's for |
|---|---|---|
| Live instance | https://bananastandai.com | The running service; try URLs here |
| API docs | https://bananastandai.com/docs | **Source of truth** for params, styles, JSON API, access control, limits |
| Contributors & roadmap | https://bananastandai.com/contributors | Who's building it; what's next (incl. the planned MCP server) |
| Test page | https://bananastandai.com/test | Interactive sandbox for prompts/sizes |
| GitHub repo | https://github.com/yohdev/banana-stand | Code, issues, README; `lib/prompts.ts` defines the styles |

## How to use them

- **Mode B (no shell):** fetch `/docs` to verify the current parameter names and
  style list, then construct the precise `/i/...` URL and snippet for the user.
- **Both modes:** if something here disagrees with the live `/docs`, the live
  docs win — and update these reference files when you notice drift.

## Resources we'll add here as we publish them

This list is meant to grow. As the team ships more, add the links so the skill
keeps finding them:

- A curated prompt/style gallery or "looks" playbook.
- The internal Confluence overview for non-technical YohDev folks.
- The `.skill` bundle download / install instructions.
- The MCP server endpoint (which will let no-shell surfaces mint directly).
