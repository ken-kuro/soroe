---
name: soroe-build
description: Implement a site from a compiled Soroe Facet Pack using whatever frontend tools, frameworks, and coding surfaces are available. Use after Soroe Design has produced a facet-pack.json and the user is ready to build the interface.
---

# Soroe Build

Implement a traceable interface from a compiled Soroe design system. You use whatever coding tools, frameworks, and file surfaces are available; the Facet Pack tells you what to build and why.

## When to use this skill

- Soroe Design has produced a `facet-pack.json` (and optionally `DESIGN_BRIEF.md`, `tokens.css`).
- The user is ready to implement the interface.
- You need structured constraints instead of freeform "make it look like this."

## Inputs

| Artifact | Where | Purpose |
| --- | --- | --- |
| `facet-pack.json` | design output | Canonical design system: facets, guardrails, tokens, graph |
| `DESIGN_BRIEF.md` | design output | Designer-facing rationale and per-facet instructions |
| `tokens.css` | design output | Deterministic `:root` custom properties |
| `IMPLEMENTATION_BRIEF.md` | build output | Route- and target-oriented coding instructions |
| `verification.plan.json` | build output | Checks the implementation must satisfy |
| `target-map.json` | build output | Logical targets with facet associations; fill in `mapping` |

If you only have the Facet Pack, compile the build artifacts first:

```bash
soroe build ./design/facet-pack.json --out ./build
```

## Workflow

### 1. Read the contract before writing code

1. Read `DESIGN_BRIEF.md` for project guardrails and composition decisions.
2. Read `IMPLEMENTATION_BRIEF.md` for the target list and verification plan.
3. Read `tokens.css` for the exact token values.
4. Identify every implementation target (e.g. `hero.identity`, `nav.terminal`, `home.bento`).

Do not start coding until you understand which facets map to which targets and what the guardrails exclude.

### 2. Map targets to your frontend stack

Read `target-map.json` from the build output. Each entry has a logical `id`, the `facets` that map to it, structural `hints`, and a `mapping` field that starts as `null`.

Fill in each target's `mapping` with the concrete location in the target project:

```json
{
  "id": "hero.identity",
  "facets": ["spatial-hero-stage", "identity-reveal-sequence"],
  "hints": ["Use a full-viewport container..."],
  "mapping": {
    "file": "src/components/Hero.tsx",
    "component": "Hero",
    "selector": "#hero"
  }
}
```

The mapping depends on the framework and tools available:

| Target kind | Static HTML/CSS | React / Next.js | Vue / Nuxt | Svelte | Other |
| --- | --- | --- | --- | --- | --- |
| `hero.identity` | `index.html` section + CSS | `Hero.tsx` component | `Hero.vue` | `Hero.svelte` | Use the project's component convention |
| `nav.terminal` | `index.html` + `terminal.js` | `Terminal.tsx` | `Terminal.vue` | `Terminal.svelte` | Follow existing patterns |
| Token application | `tokens.css` import | CSS modules / styled | `<style>` / CSS vars | `<style>` | Import `tokens.css` or inline vars |

If the project already has a component structure, follow it. If not, create one that matches the framework's conventions.

Save the filled-in target map in the target repository (for example, `.soroe/target-map.json`) so a later compiler run cannot overwrite the agent-owned mappings and the Verify skill can cross-reference them.

### 3. Implement from the Facet Pack

For each facet:

1. Read the facet's `selection.properties` for what to build.
2. Read `adaptation.directives` for how to adapt it.
3. Read `guardrails.include` for what must survive.
4. Read `guardrails.exclude` for what must not leak in.
5. Read `implementation.hints` for structural suggestions.
6. Implement using the project's framework, tokens, and conventions.

Rules:

- Use the exact token values from `tokens.css`. Do not invent new colors or spacing that conflict with declared tokens.
- Preserve semantic HTML and non-script fallbacks unless the recipe explicitly says otherwise.
- Respect `prefers-reduced-motion` and visible keyboard focus.
- Keep target-owned content (names, contact info, project copy, images) in the target repository. The Facet Pack provides structure, not content.
- Do not copy source brands, copy, assets, or code from references.

### 4. Resolve composition conflicts

When multiple facets share a route or surface, the composition `decisions` in the Facet Pack tell you which facet dominates and where. Follow them. If a decision is ambiguous, ask the user rather than guessing.

### 5. Compile the verification plan

If you have not already:

```bash
soroe build ./design/facet-pack.json --out ./build
```

This emits `verification.plan.json` — the checks your implementation must satisfy. Hand this to the **Soroe Verify** skill.

### 6. Report what you built

Summarize:

- Which implementation targets were realized and in which files/components.
- Which facets were implemented and where.
- Any deviations from the brief and why.
- Which target-specific choices stayed downstream (content, assets, copy).

## Boundaries

- This skill does not observe references or author recipes. Use **Soroe Design** for that.
- This skill does not run verification checks. Use **Soroe Verify** for that.
- This skill does not prescribe a specific framework. Use what the target project uses.
- Do not claim visual equivalence, originality, or copyright clearance.

## Dogfood rule

If implementation exposes a gap in the Facet Pack structure, implementation brief, or verification plan, fix Soroe first and cover it with a fixture or test. Only then work around a truly site-specific concern in the target.
