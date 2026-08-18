---
title: Typography
---

# Typography

Three fonts, one role each. Loaded locally via [Fontsource](https://fontsource.org/) (not a Google Fonts `<link>`/`@import`) — offline-safe (see [[UI-States]], P-5 in [[UX-Principles]]), no network round-trip, works in the no-internet lab case.

> Scope: in-app UI typeface system. The storyboard's promo title font (**Poppins Bold**, Scene 01 title card) is a separate one-off asset — see [[Media-Asset-Register]] and [[ADR-007-Asset-Budget]].

## Roles

| Role | Font | Google Fonts | Weight | Used for |
| --- | --- | --- | --- | --- |
| Heading & button | **Baloo 2** | [specimen](https://fonts.google.com/specimen/Baloo+2) | 500, 600, 700 | Section titles, menu button labels (Desain Skema, Model 3D, Komponen, Pengaturan, Keluar), card headings |
| Body | **Plus Jakarta Sans** | [specimen](https://fonts.google.com/specimen/Plus+Jakarta+Sans) | 400, 500, 700 | Description paragraphs, instructions, learning content, tooltips |
| Mono (technical) | **JetBrains Mono** | [specimen](https://fonts.google.com/specimen/JetBrains+Mono) | 400, 500 | Component labels (R1, C1, VCC, GND), component values, schematic-canvas parameters |

Installed packages: `@fontsource-variable/baloo-2`, `@fontsource-variable/plus-jakarta-sans`, `@fontsource-variable/jetbrains-mono` — each a **variable font**, one file covers the full weight range (400–800 for Baloo 2 / Plus Jakarta Sans, 100–800 for JetBrains Mono). Weight is selected with a normal `font-weight`, no per-weight import needed.

## Why these three

- **Baloo 2** — rounded, playful, bold at high weight. Fits an SMK/teen electronics-learning context; strong contrast as heading/CTA without reading as a corporate sans.
- **Plus Jakarta Sans** — humanist sans, large x-height, reads well on-screen for long instructional paragraphs. Different texture from Baloo 2 (rounded vs. geometric), so heading-vs-body hierarchy stays legible even at a metre's distance (P-3, [[UX-Principles]]).
- **JetBrains Mono** — built for code, uniform character width. Schematic labels (R1, C1, 220Ω, …) need tight alignment and unambiguous glyphs (`0` vs `O`, `1` vs `l`) — misreading a value on the canvas is exactly the mistake the DRC is meant to catch, not cause.

## Setup

### 1. Import (local, via Fontsource)

`src/styles/fonts.css`:

```css
@import '@fontsource-variable/baloo-2';
@import '@fontsource-variable/plus-jakarta-sans';
@import '@fontsource-variable/jetbrains-mono';

:root {
  --font-heading: 'Baloo 2 Variable', 'Baloo 2', sans-serif;
  --font-body: 'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono Variable', 'JetBrains Mono', monospace;
}
```

Imported once from `src/index.css` (`@import './styles/fonts.css';`, first line) — bundled by Vite, no `<link>` tag needed in `index.html`.

### 2. CSS variables

Reused by the global token set (`src/index.css`):

```css
:root {
  --sans: var(--font-body);
  --heading: var(--font-heading);
  --mono: var(--font-mono);
}
```

### 3. Utility classes

```css
.text-heading {
  font-family: var(--font-heading);
  font-weight: 600; /* default SemiBold, override to 500/700 per context */
}

.text-body {
  font-family: var(--font-body);
  font-weight: 400;
}

.text-mono {
  font-family: var(--font-mono);
  font-weight: 400;
}
```

## Usage examples

```html
<!-- Section heading -->
<h2 class="text-heading" style="font-weight: 700;">Desain Skema</h2>

<!-- Menu button -->
<button class="text-heading" style="font-weight: 600;">Model 3D</button>

<!-- Body / educational description -->
<p class="text-body">
  Rangkai resistor dan kapasitor untuk membentuk rangkaian RC sederhana.
</p>

<!-- Tooltip -->
<span class="text-body" style="font-weight: 500; font-size: 0.875rem;">
  Klik komponen untuk melihat detail nilai.
</span>

<!-- Schematic-canvas component labels -->
<text class="text-mono">R1</text>
<text class="text-mono" style="font-weight: 500;">220Ω</text>
<text class="text-mono">VCC</text>
```

```css
.schematic-label {
  font-family: var(--font-mono);
  font-weight: 400;
  font-size: 0.75rem;
  letter-spacing: 0.02em;
}

.card-title {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 1.25rem;
}
```

## Files

- `src/styles/fonts.css` — Fontsource imports + `--font-*` variables + utility classes
- `src/index.css` — global tokens, `@import './styles/fonts.css'` on the first line

## Related

- [[UX-Principles]] (P-3, P-5) · [[UI-States]] · [[Media-Asset-Register]] · [[ADR-007-Asset-Budget]]
