# Styles

Six presets, defined in `lib/prompts.ts`. Each one is a server-side instruction
layer wrapped around your prompt, so you only describe the **subject** — the
preset handles composition, cleanliness ("no text, logos, watermarks"), and
web-readiness. Select with `style=` (URL) or `"style"` (JSON).

| Style | Use it for | What the preset enforces |
|---|---|---|
| `web` *(default)* | Generic placeholders, anything behind overlaid copy | Clean, modern, professional; generous negative space, clear focal point; lighting/color that read well behind text |
| `photographic` | Heroes, team/about photos, product shots, backgrounds | Realistic photography, natural lighting, sharp focus, pro composition |
| `illustration` | Section illustrations, feature graphics, friendly UI art | Flat / semi-flat digital illustration, bold shapes, vibrant-but-professional palette |
| `abstract` | Decorative section backgrounds, gradient/texture fills | Flowing shapes, harmonious palette, interesting but not distracting; no recognizable faces |
| `3d` | Product renders, hero objects, polished modern marketing | Photoreal 3D render, studio lighting, clean background, realistic materials |
| `minimal` | Calm backdrops, elegant whitespace-heavy layouts | Minimalist, ample white space, subtle subject, muted/monochromatic palette |

## Mapping plain words to a style

- "realistic", "photo", "photograph", "real people/office/product" → `photographic`
- "flat", "illustrated", "cartoon", "vector-ish", "drawing" → `illustration`
- "gradient", "texture", "decorative background", "pattern" → `abstract`
- "3d", "render", "rendered object", "claymation/plasticky" → `3d`
- "clean", "simple", "lots of whitespace", "elegant", "understated" → `minimal`
- nothing specified / general placeholder → `web`

## Example prompts per style

- `photographic` — `sunlit+specialty+coffee+roastery+with+sacks+of+beans`
- `illustration` — `friendly+illustration+of+people+collaborating+on+a+project`
- `abstract` — `abstract+blue+to+violet+gradient+with+soft+flowing+shapes`
- `3d` — `3d+render+of+a+stack+of+coins+and+a+credit+card`
- `minimal` — `single+green+leaf+on+a+pale+neutral+background`
- `web` — `modern+dashboard+analytics+interface`
