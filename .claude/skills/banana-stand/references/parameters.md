# Parameters & dimensions

## The two endpoints take parameters differently — this is the #1 gotcha

| Concept | URL endpoint `GET /i/{w}x{h}` | JSON endpoint `POST /api/generate` |
|---|---|---|
| dimensions | in the **path**: `/i/1200x600` | body fields `width`, `height` (numbers) |
| description | `prompt=` (URL-encoded) | `prompt` (string) |
| style | `style=` | `style` |
| seed | `seed=` | `seed` (number) |
| **format** | **`fmt=`** | **`format`** |
| **quality** | **`q=`** | **`quality`** (number) |

So in a browser URL it's `fmt` and `q`; in the JSON body it's `format` and
`quality`. `scripts/generate.sh` uses the JSON body and already maps these
correctly.

## Defaults

| Param | Default |
|---|---|
| `style` | `web` |
| `seed` | `0` |
| format | `webp` |
| quality | `82` |

## Limits (enforced server-side — clamped or rejected)

- **Dimensions:** 64–2048 px per side. Out-of-range values are **clamped**, not
  rejected. Total area is capped at ~4 megapixels (scaled down proportionally if
  exceeded).
- **Prompt:** max **1000 characters**. Empty prompt → 400.
- **format:** `webp` | `jpeg` | `png` (anything else → 400 on the JSON endpoint).
- **quality:** 1–100, clamped. Ignored for `png`.
- Non-numeric `width`/`height` → 400.

## Dimension presets (pick by layout slot)

| Use | Size | Notes |
|---|---|---|
| Full-bleed hero | `1600x700` | Wide marketing banner |
| Standard hero | `1200x600` | 2:1, the common default |
| Wide background | `1920x1080` | CSS `background-image`, 16:9 |
| Feature / card image | `800x600` | 4:3 content block |
| Blog / OG share image | `1200x630` | Social preview ratio |
| Square | `800x800` | Product tile, social square |
| Avatar / headshot | `400x400` | Profile photo |
| Thumbnail | `300x200` | Small list/grid item |

When in doubt, match the actual CSS box. Cover-fit crops to fill, so the aspect
ratio matters more than the exact pixels.
