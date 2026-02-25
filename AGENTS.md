# AGENTS.md

## Purpose
This repository has two related front-end tracks:
- A main chord analysis app (`index.html`, `js/`, `lib/default.css`)
- A pure HTML guitar chord notation system (`demo.html`, `songs-simple.html`, `examples/`, `lib/chord-simple.*`, `lib/chord-fingerings.js`)

Primary product direction:
- Build and maintain an extensive, guitar-focused chord notation layout that is easy to read and easy to write directly in HTML.

## Scope Rules
- Ignore quiz-related files unless explicitly requested:
  - `quiz.html`
  - `js/quiz.js`
  - `js/modules/QuizLogic.js`
- Prefer changes in the notation stack for notation requests:
  - `lib/chord-simple.css`
  - `lib/chord-simple.js`
  - `demo.html`
  - `README.md`

## Architecture Snapshot
- No build step; static front-end app.
- Main app is ES modules (`js/app.js`, `js/modules/*`).
- Notation system is standalone/custom-tag based and loaded directly with:
  - `lib/chord-simple.css`
  - `lib/chord-simple.js` (IIFE, global init on DOM ready)
  - optional `lib/chord-fingerings.js` + VexChords for diagrams.

## Notation System: Supported Features
Custom tags and attributes already in use:
- `<song>`, `<song-meta>`, `<chord>`, `<sep>`, `<riff>`
- `<chord alt>`: dashed alternative chord
- `<chord half>`: half-width/passing chord
- `<chord bass="A">C</chord>`: split bass layout
- `<chord half bass="A">C</chord>`: half-width split passing chord
- `<chord oct="1|2">`, `<chord shell="1|2">`: technique icons
- `<chord up>`: legacy up-arrow
- Inline subtext: `<chord>C <em>note</em></chord>`

Behavior implemented in JS/CSS:
- Auto `data-chord` parsing from chord text
- Split bass DOM transform with `.main-box` and `.bass-box`
- Technique icon mapping to `data-technique-icon`
- Tooltip generation from chord/bass/voicing/fret
- Click-to-open chord diagram modal (via `getChordFingering` + VexChords)
- Responsive and print-specific chord sizing

## Coding Standards

### General
- Keep it front-end only and dependency-light.
- Preserve existing naming and attribute conventions (`data-*`, `bass`, `half`, `oct`, `shell`, `up`).
- Prefer minimal, targeted changes over rewrites.
- Keep comments concise and only where behavior is non-obvious.

### JavaScript
- Match file style:
  - `lib/chord-simple.js`: IIFE + `'use strict'`, DOM-first utilities.
  - `js/modules/*`: ES classes/modules.
- Use guard clauses and explicit null checks for DOM safety.
- Keep parser behavior deterministic:
  - first direct text node is primary chord token
  - accidental normalization supports `#`, `b`, `♯`, `♭`
- When adding notation attributes, wire both:
  - parser/attribute handling in `lib/chord-simple.js` (if needed)
  - corresponding visual rules in `lib/chord-simple.css`

### CSS
- Prefer extending existing selectors and media blocks over new styling systems.
- Keep size parity across base/mobile/print when adding chord layout variants.
- Maintain readability first:
  - chord text remains legible at small widths
  - spacing changes should not break line flow for song sheets.

### HTML/Docs
- Keep notation authoring simple and explicit in markup.
- Any new notation should be documented in:
  - `README.md` (special notations list)
  - `demo.html` (feature list + concrete usage snippet)

## Main App Standards (Chord Analyzer UI)
- Keep accessibility attributes intact (`aria-*`, labels, keyboard flows).
- Preserve resilience patterns:
  - error handling and minimal-mode fallback in `js/app.js`
  - debounced formatting/analysis in `UIManager`
- Do not couple analyzer UI changes to notation stack unless required.

## Guitar-Focused Data Notes
- Chord diagrams are sourced from `lib/chord-fingerings.js`.
- Aliases (flat/sharp mappings) should continue to resolve recursively.
- If adding new chord shapes, keep structure consistent:
  - `chord`, `position`, optional `barres`, optional `alias`.

## Change Checklist
- Implement feature in the correct layer (notation vs analyzer).
- Verify no quiz files were touched.
- Verify responsive + print behavior for chord layout changes.
- Update `README.md` and `demo.html` when notation syntax changes.
- Keep examples musician-friendly and practical for real chord sheets.
