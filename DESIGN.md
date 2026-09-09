---
name: Gastly
description: Finanzas personales que crecen en la penumbra — lima ácida sobre tinta casi negra.
colors:
  acid: "#d4ff3f"
  on-acid: "#050505"
  ink-canvas: "#050505"
  ink-surface: "#101010"
  ink-card: "#161616"
  ink-rule: "#242424"
  chalk: "#f7f7f2"
  chalk-muted: "#8a8a82"
  chalk-soft: "#c9c9c2"
  acid-deep: "#8fb414"
  acid-shadow: "#4b5f0b"
  alert: "#ff4a1c"
  paper: "#f7f7f2"
  paper-raised: "#ffffff"
  paper-muted: "#e9e9e2"
  paper-accent: "#e1e1d9"
  paper-rule: "#d6d6ce"
  olive: "#536b00"
typography:
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
  mono:
    fontFamily: "Space Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
rounded:
  sm: "2.4px"
  md: "3.2px"
  lg: "4px"
  xl: "5.6px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.acid}"
    textColor: "{colors.on-acid}"
    rounded: "{rounded.lg}"
    padding: "8px 10px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.ink-canvas}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.lg}"
    padding: "8px 10px"
    height: "32px"
  card-surface:
    backgroundColor: "{colors.ink-card}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input-field:
    backgroundColor: "{colors.ink-canvas}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
---

# Design System: Gastly

## Overview

**Creative North Star: "The Greenhouse"**

Gastly is a personal-finance dashboard that behaves like a greenhouse at night: the canvas is near-black ink, surfaces step up through charcoal layers, and a single acid-lime accent marks what is alive — the primary action, the active state, the number that matters. Nothing shouts. The lime is a grow-light, not a party streamer: it appears where money moves and is absent everywhere else.

The system is built on shadcn/ui (radix-nova) tokens, mapped to a two-world palette — ink dark (default) and paper light (optional). Density is sober: 32px controls, 14px body text, hairline rings instead of borders, generous whitespace around headings. The mood is calm competence with one vivid pulse.

**Key Characteristics:**
- Dark-first; lime `#d4ff3f` is the only saturated hue in the interface
- Surfaces stack tonally (canvas → surface → card); depth comes from a 1px ambient ring, not heavy shadows
- Archivo carries every word; Space Mono carries every number and code
- Edges are barely rounded (4–5.6px); the interface reads engineered, not toyed
- Motion is quiet: state transitions only, no entrance theater

## Colors

One accent, two worlds (ink and paper), and a neutral ramp warm enough to feel cultivated rather than sterile.

### Primary
- **Acid Lime** (`#d4ff3f`): The single voice of action — primary buttons, active nav indicators, focus rings in dark mode, key chart series. Rarity is the point.
- **On Acid** (`#050505`): Text and icons sitting on lime; never white on lime.

### Secondary
- **Deep Grow Green** (`#8fb414` / shadow green `#4b5f0b`): Chart series and tinted states that need "green family" without a second lime shout.

### Tertiary
- **Alert Vermilion** (`#ff4a1c`): Errors, destructive actions, negative balances. Never decorative.
- **Grove Olive** (`#536b00`): The light-world stand-in for lime when text or focus rings need contrast on paper.

### Neutral
- **Ink Canvas** (`#050505`): Dark page background.
- **Ink Surface** (`#101010`): Secondary fills — muted blocks, sidebar.
- **Ink Card** (`#161616`): Cards, popovers, raised panels.
- **Ink Rule** (`#242424`): Hairline borders, inputs, grid lines in dark.
- **Chalk** (`#f7f7f2`): Primary text in dark; also the light-world paper.
- **Chalk Soft** (`#c9c9c2`): Secondary text, muted chart series.
- **Chalk Muted** (`#8a8a82`): Tertiary/meta text in both worlds.
- **Paper Raised** (`#ffffff`): Cards/popovers in light world only.
- **Paper Muted / Accent** (`#e9e9e2` / `#e1e1d9`): Light-world fills.
- **Paper Rule** (`#d6d6ce`): Light-world hairlines.

### Named Rules
**The One Voice Rule.** Lime appears on at most one primary action per view plus focus rings. If two elements compete in lime, one is wrong.
**The Grow-Light Rule.** Color is information, not decoration: lime means "act / active / alive", vermilion means "broken / negative", olive means "lime's contrast-safe cousin".

## Typography

**Display/Headline Font:** Archivo (system-ui fallback)
**Body Font:** Archivo
**Label/Mono Font:** Space Mono

**Character:** Archivo is a workhorse grotesque with just enough warmth for money talk; Space Mono turns amounts and codes into data, not prose. No expanded wdth axis — the voice stays plain and dense.

### Hierarchy
- **Headline** (700, 1.5–2rem, tracking -0.02em): Page titles, auth h1.
- **Title** (600, 1.25rem): Card titles, section headers.
- **Body** (400, 0.875rem, line-height 1.5): Everything readable; cards base at `text-sm`.
- **Label** (600, 0.75rem, 0.05em, uppercase): Form field labels, table headers, eyebrows of state.
- **Mono** (400/700, 0.875rem): Amounts, dates, IDs, tokens, tabular data (`tabular-nums`).

### Named Rules
**The Numbers Are Mono Rule.** Every currency figure and identifier renders in Space Mono with tabular figures; prose never borrows it for style.

## Layout

- Shell: fixed sidebar (`--sidebar` ink surface) + content column; auth pages use a centered single column at `max-w-sm` (384px).
- Base rhythm is the Tailwind 4px scale; form groups ride `gap-5` (20px), card internals `gap-4` (16px), header-to-content separation is deliberately larger than any internal gap.
- Density is "sobrio y contenido": 32px controls, 12–14px text, tables comfortable-not-cramped.
- Responsive is structural: sidebar collapses to a trigger at `md`, grids collapse to single columns, the auth column never widens past 384px; touch targets stay ≥32px visible with adequate padding.

## Elevation & Depth

Hybrid: tonal layering is the primary depth language (canvas → surface → card), and a 1px ambient ring (`ring-foreground/10`) draws the edge. Soft shadcn shadows (`shadow-sm` … `shadow-md`) appear only on floating layers — popovers, menus, sheets. The brand's one atmospheric gesture is the auth hero wash: a top gradient `from-primary/15` fading to transparent (plus a matching `bg-primary/5` header band on the dashboard).

### Shadow Vocabulary
- **Ambient ring** (`ring-1 ring-foreground/10`): Every card and panel, at rest.
- **Float** (`shadow-sm`/`shadow-md` + ring): Popovers, dropdowns, sheets — things above the page.
- **Grow-light wash** (linear-gradient `primary/15 → transparent`): Top-of-viewport brand atmosphere on auth and header zones only.

### Named Rules
**The Ring Not Shadow Rule.** Cards never carry drop shadows; a floating surface earns one. Two elevation languages on one surface is noise.

## Shapes

Edges are subtly cut: the radius token is 0.25rem, so `rounded-lg` (4px) is the default control and `rounded-xl` (~5.6px) the default card. Nothing pill-like except small controls (badges, segmented thumbs). Hairlines are always 1px; no thick borders, no colored `border-left` accents, no clipping masks. The logo mark is a 4px-radius lime square holding a chalk-dark "G".

## Components

### Buttons
- **Shape:** Barely rounded (4px, `rounded-lg`), 32px tall at default (`h-8`, `text-sm font-medium`).
- **Primary:** Lime field, ink text (`{colors.acid}` / `{colors.on-acid}`), padding `8px 10px` (icon-adjusted).
- **Hover / Focus:** Hover dims lime to 80%; focus draws `ring-3 ring-ring/50` plus ring-colored border; press nudges 1px down.
- **Secondary / Ghost / Outline:** Neutral ink fills or transparent with `border-border`; outline inputs get `bg-input/30` in dark.
- **Destructive:** Soft mode — 10–20% vermilion tint with vermilion text, never a solid red slab.

### Cards / Containers
- **Corner Style:** Gentle (5.6px, `rounded-xl`).
- **Background:** `--card` (ink card / paper raised).
- **Shadow Strategy:** Ambient ring only; footer zones may tint `bg-muted/50` with `border-t`.
- **Border:** None separate — the ring is the border.
- **Internal Padding:** 16px (`px-4 py-4`), headers `gap-1`.

### Inputs / Fields
- **Style:** 32px tall, 4px radius, `border-input`, transparent background; icon variants wrap in an `InputGroup` with leading mail/lock glyph and trailing reveal button.
- **Focus:** `ring-3 ring-ring/50` (lime in dark, olive in light).
- **Error:** `border-destructive` + `ring-destructive/20` + inline `FieldError` under the control; labels are 12px semibold uppercase tracking 0.05em.

### Navigation
- Sidebar on ink surface (`#0a0a0a` dark) with lime active indicator and chalk text; header band carries the grow-light wash. Mobile: sidebar becomes a sheet trigger.

### Logo Mark
- Lime square (`bg-primary`), 4px corner, ink "G" (Archivo 700); scales via size prop, text scales with it.

## Do's and Don'ts

### Do:
- **Do** keep one lime primary action per view; everything else neutral.
- **Do** render amounts, dates and IDs in Space Mono with `tabular-nums`.
- **Do** separate surfaces with the ambient ring and tonal steps, and reserve drop shadows for floating layers.
- **Do** use uppercase 12px semibold labels for form fields and table headers.
- **Do** check both worlds: dark canvas `#050505` first, paper `#f7f7f2` must stay AA-compliant (olive `#536b00` replaces lime for text on paper).

### Don't:
- **Don't** put white text on lime; the pairing is ink-on-lime only.
- **Don't** add new saturated hues — the only non-neutrals are acid, its greens, and vermilion.
- **Don't** round beyond ~6px or use pills for large surfaces.
- **Don't** stack card-in-card or give cards heavy shadows; the ghost-card (border + wide shadow) is banned.
- **Don't** use blur/glass as surface material; the only gradient is the grow-light wash.
