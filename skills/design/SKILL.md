---
name: soroe-design
description: Observe visual references, author a versioned Soroe recipe, and compile a traceable design system (Facet Pack, Reference Graph, design brief, tokens). Use when a user says "make it like these sites," wants to combine specific parts of several interfaces, or needs a grounded, shareable design system before implementation.
---

# Soroe Design

Turn "use this part from each reference" into a structured, traceable design system. You observe references using whatever browser or inspection tools are available; Soroe validates and compiles the recipe deterministically.

## When to use this skill

- The user points at two or more interfaces and says "take this part from each."
- The user wants a design system grounded in real evidence, not adjectives.
- The user needs an auditable trace from reference → decision → design artifact.

## Workflow

### 1. Establish scope

Ask the user:

- What is the target project? (name, framework, routes)
- Which references? (URLs, screenshots, or described interfaces)
- What specifically from each reference? (not "the vibe" — exact properties)
- What must not be copied? (brands, copy, assets, code, exact layouts)

Keep target-owned identity, prose, media, and code in the target repository. The recipe captures reusable design decisions only.

### 2. Observe references

Use whatever browser, screenshot, or visual-inspection tools you have available. For each reference:

- Navigate to the exact route, viewport, and state the user selected.
- Record what is visible or what happens as a factual observation.
- Write a locator a reviewer can reproduce: `/ at 1280px, first viewport` or `/work, card hover`.

Do not phrase observations as aesthetic verdicts. Prefer "four named grid columns at 1280px" over "great bento layout."

Record each observation as evidence:

```json
{
  "id": "bento-grid",
  "locator": "/ at 1280px, project section",
  "observation": "Four named grid areas with deliberately varied column spans and card aspect ratios."
}
```

### 3. Select facets

Create one facet per independently adoptable decision. For every facet:

1. Point to one reference and one evidence item.
2. State the selected properties precisely with measurable names and values.
3. Explain the target-specific adaptation intent.
4. Add implementation directives.
5. Declare what must survive (`include`) and what must not leak (`exclude`).
6. Name logical implementation targets (e.g. `hero.identity`, `nav.terminal`).
7. Attach at least one observable verification check.

Split a facet when its properties could be accepted or rejected independently. Never use "the whole page" or "overall vibe" as a facet.

Read [recipe-authoring.md](references/recipe-authoring.md) for field-level guidance and sizing examples.

### 4. Compose and resolve conflicts

Group facet IDs into target routes or surfaces. When selected facets compete for density, hierarchy, motion, space, or interaction priority, add an explicit decision that names the winner, scope, and fallback.

Do not silently average incompatible references.

### 5. Scaffold, validate, compile

```bash
# Scaffold a starter recipe
soroe init --id my-site --title "My Site" \
  --references ref1:https://a.com,ref2:https://b.com \
  --out ./recipe.json

# Validate
soroe validate ./recipe.json

# Compile the design system
soroe design ./recipe.json --out ./design
```

When Soroe is not installed globally, use `node ./bin/soroe.js` from the Soroe repository.

Stop on validation errors. Fix the recipe field identified by the diagnostic path and code. Do not edit compiler output by hand.

### 6. Deliver design artifacts

The design phase produces:

| Artifact | Purpose |
| --- | --- |
| `facet-pack.json` | Canonical machine-readable design system |
| `REFERENCE_GRAPH.md` | Reviewable provenance: reference → evidence → facet → target |
| `DESIGN_BRIEF.md` | Designer-facing rationale and constraints |
| `tokens.css` | Deterministic `:root` custom properties |

Hand these to the **Soroe Build** skill for implementation.

## Boundaries

- This skill does not implement code. It produces the design contract.
- This skill does not fetch URLs or download assets. Observations are authored by you or the user.
- Recipes must exclude copied logos, names, prose, media, proprietary assets, and source code.
- Do not claim visual equivalence, originality, or copyright clearance.

## Dogfood rule

If you discover a reusable limitation in the recipe schema, compiler, or diagnostics, fix Soroe first and cover it with a fixture or test. Only then work around a truly site-specific concern in the target.
