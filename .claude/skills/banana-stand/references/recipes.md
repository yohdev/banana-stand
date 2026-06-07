# Recipes — paste-ready output

Pick the snippet format that matches where the image is going. Default base is
`https://bananastandai.com`.

## HTML `<img>`

```html
<img
  src="https://bananastandai.com/i/1600x700?prompt=sunlit+specialty+coffee+roastery&style=photographic"
  alt="Sunlit specialty coffee roastery"
  width="1600" height="700" />
```

Always write a real `alt`. Set `width`/`height` to avoid layout shift.

## Markdown

```markdown
![Sunlit specialty coffee roastery](https://bananastandai.com/i/1600x700?prompt=sunlit+specialty+coffee+roastery&style=photographic)
```

## CSS background

```css
.hero {
  background-image: url("https://bananastandai.com/i/1920x1080?prompt=abstract+blue+gradient+tech+background&style=abstract");
  background-size: cover;
  background-position: center;
}
```

## A variant ("give me another")

Same prompt, bump the seed:

```
https://bananastandai.com/i/1600x700?prompt=sunlit+specialty+coffee+roastery&style=photographic&seed=2
```

## A coherent page set ("fill this page with images")

Use **one shared seed** across the page and vary only each slot's prompt, so the
images read as one consistent set. Match each size to its slot:

```html
<!-- Hero -->
<img src="https://bananastandai.com/i/1600x700?prompt=sunlit+specialty+coffee+roastery+wide+establishing+shot&style=photographic&seed=7" alt="Coffee roastery" />

<!-- Product close-up -->
<img src="https://bananastandai.com/i/800x600?prompt=fresh+roasted+coffee+beans+close+up&style=photographic&seed=7" alt="Roasted beans" />

<!-- Team / about -->
<img src="https://bananastandai.com/i/800x600?prompt=baristas+working+together+in+a+bright+cafe&style=photographic&seed=7" alt="The team" />
```

## Standardized asset sets

For repeatable, on-brand assets (e.g. a uniform set of feature icons or a themed
gallery), lock **style + seed + dimensions** and change only the subject noun.
That keeps treatment identical across the whole set while each image stays
distinct.

## URL-encoding reminder

Encode spaces as `+` (or `%20`). The prompt is the only field that usually needs
encoding.
