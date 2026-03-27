# DESIGN_RULES.md
# Digital Minimalism 2026 for AI / SaaS / Portfolio

Based on analysis of Minimal Gallery archive and design systems research.

## 0. Principles

1. **Minimalism = ideal amount, not emptiness.**
   Every element must be justified by meaning, function, or metric.

2. **Priority: meaning → structure → typography → color → animation.**
   Visual effects cannot fix weak meaning architecture.

3. **Interface is a tool, not a poster.**
   Goal: reduce cognitive noise and enhance sense of control and premium quality.

## 1. Meaning Architecture

### 1.1 Structural Numbering
- **MUST**: Use explicit section numbering: `01`, `02`, `03`… or `00-1`, `00-1.1.2`.
- **SHOULD**: Maintain one numbering scheme across the product (landing, dashboard, documentation).
- **MUST NOT**: Use "creative" section names instead of clear hierarchies.

### 1.2 Information Hierarchy
- **MUST**: Each page has one main question/action (single focus).
- **MUST**: No more than 3 hierarchy levels per screen (heading → subheading → metadata).
- **SHOULD**: Place critical content "above the fold" without carousels/sliders.

## 2. Typography as Main Interface

### 2.1 Role of Font
- **MUST**: Typography plays role of logo and navigation, especially in minimalist interfaces.
- **SHOULD**: Use 1–2 typefaces (primary + monospace for code/metadata).
- **MUST NOT**: Use more than 3 text sizes on one screen, except for error/status states.

### 2.2 Monospace Typography and Code
For AI/engineering products:
- **MUST**: Present "technical honesty" layer: monospace font, terminal symbols, log strings.
- **SHOULD**: Binary/hex sequences, pseudocode, versions (`VER/12433.56`) as visual engineering anchors.
- **MUST NOT**: Hide technical product character behind cartoonish illustration.

## 3. Color and Background

### 3.1 Dark Interfaces by Default
- **SHOULD**: For AI, SaaS and portfolio use dark themes or low-contrast background planes.
- **MUST**: Ensure sufficient text and interactive element contrast (WCAG AA+).
- **MUST NOT**: Use pure white background (`#FFFFFF`) as default without justification.

### 3.2 "Distilled Nature"
- **SHOULD**: Use creamy, dusty, and cloudy shades instead of sterile whiteness.
- **SHOULD**: Palette ≤ 4 working shades + 1–2 signal (success/error/accent).
- **MUST**: All signal colors must be tied to system states (loading, success, error, warning).

## 4. Layout, Grid, Bento-Grids

### 4.1 Base Grid
- **MUST**: Use modular grid with fixed columns and vertical rhythm.
- **SHOULD**: Rely on grid for aligning everything: text, buttons, cards, illustrations.
- **MUST NOT**: Mix multiple alignment logics on one screen.

### 4.2 Bento-Grids (SaaS/products)
- **SHOULD**: Use bento-grids to pack functional blocks (features, scenarios, tariffs).
- **MUST**: Each bento-grid block must have one main meaning and one action.
- **MUST NOT**: Turn bento-grid into mosaic collage without explicit priority.

## 5. Animation and System State

### 5.1 Functional Animation
- **MUST**: Any animation must explain hierarchy or confirm user action.
- **SHOULD**: Use micro-interactions: hover, tap, copy, drag-and-drop with explicit visual feedback.
- **MUST NOT**: Use infinite decorative loops unrelated to user task.

### 5.2 Skeleton Screens and Waiting
- **SHOULD**: For loading use skeleton states instead of spinners.
- **MUST**: Visualize progress/waiting for operations > 300ms.
- **SHOULD**: Keep skeleton structure maximally close to final content.

## 6. AI & "Machine Pragmatism"

### 6.1 Interface as IDE
- **MUST**: For complex AI tools use IDE/CLI patterns: tabs, console, status panels, logs.
- **SHOULD**: Visually bring UI closer to familiar engineer tools: VS Code, terminal, Git UI.
- **MUST NOT**: Hide complexity behind "magical" animations without explainable structure.

### 6.2 Algorithmic Transparency
- **SHOULD**: In interface present elements revealing algorithm flow (step logs, intermediate states, model versions).
- **MUST**: Clearly separate user-content and machine-generated data visually and typographically.
- **MUST NOT**: Create impression of "black box" if product declares transparency.

## 7. SaaS: Functional Reductionism

### 7.1 Focus on Task
- **MUST**: On SaaS landing main screen answers three questions: what, for whom, what result.
- **SHOULD**: Use video/interactive demos instead of long texts to explain product.
- **MUST NOT**: Load first screen with secondary blocks (cases, blog, FAQ).

### 7.2 Invisible Interface
- **SHOULD**: Minimum interface chrome (frames, shadows, fills), maximum meaning.
- **MUST**: Navigation and control elements obvious without tutorial.
- **MUST NOT**: Introduce non-standard UX patterns if they don't give significant gain.

## 8. Personal Portfolio: "Living" Minimalism

### 8.1 Contextualization
- **SHOULD**: Show "living" data: local time, city, weather, current project/track.
- **MUST**: Context data should not distract from works, only "pulse" author presence.
- **MUST NOT**: Make context main content if goal is to show portfolio.

### 8.2 Engineering Aesthetic
- **SHOULD**: Use coordinates, indices, versions, technical metadata.
- **MUST**: Structure works as archive: lists, series, metadata (year, role, stack, status).
- **MUST NOT**: Mix experimental art chaos and strict engineering presentation on same axis.

### 8.3 Code Purism
- **SHOULD**: Consider No-JS/minimal stack where possible (portfolio, promo).
- **MUST**: Maintain high performance (fast load, no excess dependencies).
- **MUST NOT**: Connect heavy frameworks for single effects.

## 9. Content and Metadata

### 9.1 Metadata as Interface
- **SHOULD**: Show technical details: versions, sizes, statuses (in work, completed, sold, available).
- **MUST**: Metadata visually separated from main text (size, monospace, color).
- **MUST NOT**: Hide metadata behind hover if critical for user choice.

### 9.2 Text Rules
- **MUST**: Write short, specific headings: 3–7 words, one action/idea.
- **SHOULD**: Use subheadings and captions instead of long paragraphs.
- **MUST NOT**: Fill interface with marketing clichés without factual content.

## 10. Pre-release Checklist

1. ☐ Does page have clear section hierarchy with numbering?
2. ☐ Can user understand what this product is in 5 seconds?
3. ☐ Does typography perform role of main visual "anchor"?
4. ☐ Are there technical honesty elements (code, logs, versions)?
5. ☐ Do all animations explain or confirm action?
6. ☐ Are bento-blocks (if present) unambiguous by meaning and action?
7. ☐ Does portfolio (if applicable) look like structured archive, not random gallery?
8. ☐ Is there "living" context (for personal sites) and does it not interfere with work perception?
9. ☐ Does codebase lack excess (libraries/frameworks giving no direct value)?
10. ☐ If remove background/color, is interface still readable via grid and typography?

## 11. Rules for AI Agent (Machine Format)

```
RULE-001: EVERY ELEMENT MUST BE JUSTIFIED BY FUNCTION OR MEANING.
RULE-002: ONE PAGE = ONE QUESTION = ONE ACTION.
RULE-003: SECTION NUMBERING IS MANDATORY (01/, 00-1, §02).
RULE-004: TYPOGRAPHY IS THE PRIMARY BRAND CARRIER — MAX 2 TYPEFACES.
RULE-005: FOR AI PRODUCTS — ADD TECHNICAL HONESTY LAYER (MONOSPACE, LOGS, VERSIONS).
RULE-006: MOTION = EXPLAIN HIERARCHY OR CONFIRM ACTION. NEVER DECORATION.
RULE-007: PREFER WARM NEUTRAL BACKGROUNDS OVER PURE WHITE (#FFFFFF BANNED BY DEFAULT).
RULE-008: PORTFOLIOS ARE ARCHIVES WITH METADATA, NOT IMAGE GALLERIES.
RULE-009: BENTO BLOCK = ONE MEANING + ONE ACTION. NO EXCEPTIONS.
RULE-010: LIGHTHOUSE PERFORMANCE ≥ 90 ON MOBILE IS NON-NEGOTIABLE.
RULE-011: CONTEXTUAL DATA (TIME/LOCATION/STATUS) ADDS HUMAN PULSE, NOT REPLACES CONTENT.
RULE-012: NEVER USE MARKETING CLICHÉS WITHOUT FACTUAL PROOF.
```

Sources: Minimal Gallery archive, design systems research, AI/SaaS/UI best practices 2026
Last updated: 2026-03-27
