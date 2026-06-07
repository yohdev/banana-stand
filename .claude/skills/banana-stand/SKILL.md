---
name: banana-stand
description: >-
  Get AI-generated placeholder images from Banana Stand by asking in plain
  language — no hand-written URLs. Use whenever someone wants an image,
  placeholder, hero, banner, background, avatar, headshot, illustration,
  product shot, team photo, icon, or "picture of …" for a web page, mockup,
  slide, doc, or README; when they say "Banana Stand", "make/generate/create an
  image of …", "fill this page with images", "I need a photo of …", or ask to
  replace gray placeholder boxes. Turns the request into the right size +
  style + prompt and hands back a ready-to-paste link or snippet. In Claude
  Code it mints the real cached image; on claude.ai it plans the prompt and
  builds the precise URL.
---

# Banana Stand

Banana Stand is YohDev's AI placeholder-image service. You write a URL, it
returns a real, web-ready image — generated once by Gemini, then cached forever
on a CDN so the same URL is stable for everyone.

```
https://bananastandai.com/i/{width}x{height}?prompt={url+encoded+description}&style={style}
```

Your job is to turn a plain-language request ("I need a hero image of a coffee
roastery") into the **right dimensions + style + a concise prompt**, then either
**mint** the image or **hand back a precise URL** depending on the surface.

## Step 0 — detect your mode

- **Mode A — doer (Claude Code / any shell):** you have a shell *and*
  `GEN_TOKEN` is set in the environment → you can mint brand-new images.
- **Mode B — planner/advisor (claude.ai / Cowork, no shell or no token):** you
  cannot mint. You plan the prompt, pick size + style, and return the exact URL
  + snippet, noting how it gets warmed.

Check with: `test -n "$GEN_TOKEN" && echo MINT || echo PLAN` (Mode A only).

## Decision flow

1. **Plan the prompt + size + style.** Read the request and choose:
   - **Dimensions** from the layout slot — see `references/parameters.md` presets.
   - **Style** by mapping plain words ("realistic"→`photographic`, "flat
     illustration"→`illustration`, etc.) — see `references/styles.md`.
   - **A concise prompt** describing the *subject* only. The server already adds
     quality/cleanliness instructions, so don't ask for "no text, high quality,
     4k" — see `references/prompt-coach.md`.

   When you have web access, refresh your understanding of the live API from the
   canonical links in `references/resources.md` (the live `/docs` is the source
   of truth). Ask **one** clarifying question only if the subject or use is
   genuinely unclear — otherwise pick sensible defaults and proceed.

2. **Mode A — mint it.** Run `scripts/generate.sh "<prompt>" <w> <h> [style] [seed]`.
   It POSTs to `/api/generate` with the `X-Gen-Token` header and prints **only**
   the stable cached URL. (Equivalent raw call in `references/api.md`.)

3. **Hand back the result** in the format that matches the context — HTML
   `<img>`, Markdown `![]()`, or CSS `background-image`. See `references/recipes.md`.
   Offer a seed variant for "give me another," and for "fill this page" build a
   coherent set sharing one `seed`.

4. **Mode B — return the URL.** Emit the ready `/i/...` URL + snippet and explain
   that on the gated hosted instance a brand-new prompt needs a one-time warm
   (someone in Claude Code, or the planned MCP server) — but it serves to
   everyone instantly once cached.

## Configuration

- **Base URL:** defaults to `https://bananastandai.com`. Override with
  `BANANA_STAND_BASE_URL` for a self-hosted instance.
- **Token:** read from `GEN_TOKEN`. **Never print, echo, or paste the token** —
  not in snippets, not in explanations, not in commit messages. `generate.sh`
  keeps it out of the transcript. If it's missing, point the user to Passbolt
  (entry "Banana Stand") and fall back to Mode B.

## Voice

Talk to a non-technical user. Explain choices in a sentence ("I went wide and
photographic so it reads as a hero"), don't dump the parameter table, and don't
show raw `curl` unless asked. Give them the link and the snippet.

## Errors (see `references/api.md` for detail)

- **401** — `GEN_TOKEN` missing/wrong; on the hosted instance only the maintainer
  can mint. Fall back to Mode B.
- **400** — bad prompt or dimensions (empty prompt, >1000 chars, non-numeric size).
- **429 / 502** — quota or transient upstream error; retry once or twice, then
  advise trying again shortly.

## Honesty note

Images are AI-generated and carry an invisible SynthID watermark. They're great
placeholders — don't present them as authentic photography.

## References

- `references/prompt-coach.md` — turning a vague idea into a strong prompt.
- `references/parameters.md` — dimensions, presets, the `fmt`/`q` vs `format`/`quality` gotcha.
- `references/styles.md` — the six styles and when to use each.
- `references/recipes.md` — paste-ready snippets and coherent multi-image page sets.
- `references/api.md` — the authenticated call, response shape, health, errors.
- `references/resources.md` — canonical live links to read for the latest API/resources.
