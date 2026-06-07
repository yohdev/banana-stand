# Prompt coaching

This is the heart of Mode B (claude.ai) and makes Mode A better too: turn a
vague request into a strong prompt + the right size + the right style. Banana
Stand's server already adds quality and cleanliness instructions per style, so
your prompt should be a **short, vivid description of the subject** — nothing
more.

## A good prompt = subject + a little context

Aim for one concrete noun phrase plus 2–4 grounding details:

- **Subject:** what is actually in frame ("a barista pouring latte art").
- **Setting / context:** where ("in a sunlit specialty coffee shop").
- **Mood / lighting:** the feel ("warm morning light, cozy").
- **Optional composition cue:** "wide establishing shot", "close-up", "overhead".

Example evolution:
- ❌ "coffee" → too vague
- ⚠️ "coffee shop" → generic
- ✅ "sunlit specialty coffee shop interior, exposed brick, warm morning light"

Keep it under ~1000 characters (the hard limit), but most great prompts are one
sentence.

## Do NOT include (the style preset already handles these)

- "no text / no watermark / no logo" — already enforced.
- "high quality / 4k / ultra-detailed / professional" — already enforced.
- UI chrome instructions, aspect-ratio words — set size via dimensions instead.

Adding these wastes characters and can fight the preset.

## Choosing the style

Map the user's words (see `styles.md`). If they didn't say, infer from use:
heroes/teams/products → `photographic`; friendly explanatory graphics →
`illustration`; section backdrops → `abstract` or `minimal`; default → `web`.

## Choosing the size

Match the layout slot (see `parameters.md` presets). Wide marketing band →
`1600x700`; content card → `800x600`; profile → `400x400`. Cover-fit crops to
fill, so get the **aspect ratio** right first.

## Seeds: variety and coherence

- **Variants:** same prompt + a different `seed` (1, 2, 3…) → a different image.
  Offer this for "give me another option."
- **Coherence:** to make a set of images on one page feel like they belong
  together (same lighting/era/treatment), keep a **shared `seed`** and vary only
  the per-image prompt. See `recipes.md`.

## When to ask vs. proceed

Ask **one** question only if the subject or use is genuinely ambiguous ("what
should the hero show?"). Otherwise pick sensible defaults, state them briefly,
and deliver — the user can always ask for a tweak or a reseed.
