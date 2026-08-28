# Visual thesis — The margin becomes a system

## Direction

**Generative geometry, grounded in a teacher's worktable.** Rubric Feedback
Bundles turns repeated comments into an orderly human feedback record. The
visual language begins with ruled paper, margin marks, modular slips, and the
geometry of a rubric grid. Shapes combine, split, and align as feedback is
assembled; the student's language stays on the warm paper plane while controls
recede into ink-blue rails. The interface should feel authored and calm, never
like an AI chat tool or generic admin dashboard.

The product uses one deliberate light treatment. Feedback is commonly printed,
saved as PDF, and read for several minutes; warm paper preserves that mental
model and avoids discrepancies between the editor and exported receipt.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#F6F1E7` | App background and exported sheet |
| Sheet | `#FFFDF7` | Writing and reading surfaces |
| Ink | `#172B34` | Primary copy; 13.5:1 on Paper |
| Muted ink | `#52636A` | Secondary copy; 5.5:1 on Paper |
| Rule | `#B9CFD2` | Dividers and quiet geometric lines |
| Blue pencil | `#225B6A` | Primary actions; white is 7.4:1 |
| Coral pencil | `#B94535` | Active annotations and branded marks |
| Ochre | `#8F6112` | Warnings, always paired with words/icons |
| Leaf | `#2E6B4F` | Saved/exported confirmation |
| Danger | `#A23232` | Destructive actions and errors |

All color-coded states also have a text label or icon. Focus uses a 3px Coral
outline with a 3px Paper offset.

## Type

- **UI and controls:** `InterVariable`, self-hosted WOFF2, with system fallbacks.
- **Student-facing receipt and editorial headings:** `LiterataVariable`,
  self-hosted WOFF2, with Georgia fallback.
- Scale: 16px base; 14px meta; 18px label; 24px section; 34–52px page title.
  Student feedback has 1.58 line height and a 68-character measure.
- Numerals in progress and summaries use tabular figures.

## Spacing and shape

- 4px base rhythm; common spaces are 8, 12, 16, 24, 32, 48, and 64px.
- Corners are clipped rather than uniformly rounded: panels use a subtle
  2px radius plus an 8px folded-corner cut. Pills are reserved for statuses.
- Content width is 1440px. The grading workspace uses a 5/7 split; at 900px it
  stacks, and at 390px navigation becomes a two-row work queue with no hidden
  actions. Touch targets are at least 44px with 8px separation.
- Cards are used only for independent fragments and receipts. Related form
  controls are grouped by proximity and ruled lines.

## Interaction grammar

- **Add a fragment:** its small geometric marker appears beside the criterion
  and the editable copy unfolds directly beneath it.
- **Save progress:** immediate `Saved locally` status; IndexedDB writes are
  debounced and also performed on navigation/unload.
- **Student sequence:** Previous/Next tracks the work queue. Finished items
  gain a filled square; drafts use an outlined diamond. Keyboard shortcuts are
  documented in the interface (`Alt` + arrow; `Ctrl/Cmd` + `Enter`).
- **Destructive actions:** explicit confirmation naming the affected student or
  bundle. Removed fragments offer a short Undo action where practical.
- Empty, offline, update, and error states use small diagrammatic glyphs plus a
  clear next action.

## Motion policy

Geometry settles into place over 180–240ms using ease-out; added feedback opens
from its originating fragment with opacity and a short 6px translation. Save
confirmation cross-fades. No ambient loops. Under `prefers-reduced-motion`, all
translations and smooth scrolling are removed and state changes are immediate.

## Asset plan and provenance

The main illustration is a quiet overhead still life: abstract paper fragments
and translucent ruler geometry converging into one readable feedback sheet. It
explains reuse-with-human-assembly and appears only in the welcome/empty state,
so it never competes with grading.

**Prompt sheet:** overhead editorial still life, modular paper strips and
geometric rubric tiles assembling into one cream feedback sheet, hand-cut paper
and graphite, thin blue ruled lines, one coral annotation stroke, deep ink
shadows, warm north-window light, restrained paper/ink/blue/coral palette,
subtle grain, precise composition, no people, no hands, no readable text, no
letters, no watermark, no logos, no gradients, no device mockup, no UI.

- Generator: Azure AI Foundry, deployment `factory-image` via the factory image
  script.
- Date: 2026-08-28.
- License/provenance: original generated asset commissioned for this product;
  prompt sidecar retained in `assets/src/`.
- Delivery: responsive WebP variants (≤300KB mobile) with explicit dimensions.
- Icons and geometric glyphs are original inline SVG authored for the product.

## Accessibility and performance intent

One `<h1>` names the tool. Editor subviews begin at `<h2>`. Every decorative
line is CSS or `aria-hidden`; the explanatory illustration gets concise alt
text. The shell needs no hero image to operate, and the illustration is loaded
only in the welcome state. Initial JavaScript stays below 200KB and CSS below
50KB; no runtime CDN or analytics is used.
