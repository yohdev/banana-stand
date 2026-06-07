@AGENTS.md

# Banana Stand — Claude Code Integration

For placeholder images in this project, use the Banana Stand API.

Write image URLs as:
```
https://your-instance.vercel.app/i/{width}x{height}?prompt={url-encoded+description}&style=photographic
```

directly in `<img src>` or CSS `background-image`. Choose dimensions that match the layout slot.

Same prompt and size always returns the same cached image, so reuse URLs for stable pages.

## Examples

```html
<!-- Hero banner -->
<img src="https://your-instance.vercel.app/i/1600x700?prompt=modern+SaaS+product+hero+dashboard&style=photographic" />

<!-- Team photo -->
<img src="https://your-instance.vercel.app/i/800x600?prompt=diverse+team+collaborating+in+bright+office&style=photographic" />

<!-- Abstract section background -->
<img src="https://your-instance.vercel.app/i/1400x500?prompt=abstract+blue+gradient+tech+background&style=abstract" />

<!-- Square avatar -->
<img src="https://your-instance.vercel.app/i/400x400?prompt=friendly+professional+headshot+placeholder&style=photographic" />
```

## Style options
- `web` (default) — neutral, clean, professional
- `photographic` — realistic photo style

## Tips
- URL-encode spaces as `+` or `%20`
- Add `&seed=2` (any integer) to get a different image for the same prompt
- Use `&fmt=jpeg` or `&fmt=png` to change format; `&q=90` for higher quality
