---
name: compile-reference-facets
description: Select exact visual, structural, content, motion, and interaction facets from multiple interface references; author a versioned Soroe recipe; compile a traceable Facet Pack and Reference Graph; then guide implementation and visual verification. Use when a user says to combine specific parts of several websites, apps, screenshots, or designs, asks for a reference-to-interface plan, wants coding-agent-ready design provenance, or needs to rebuild an interface without copying any reference wholesale.
---

# Compile Reference Facets

Turn “use this part from each reference” into an explicit, testable implementation contract. Keep interpretive observation in the recipe-authoring phase and use Soroe for deterministic validation and compilation.

## Establish the boundary

1. Identify the target repository, routes, framework, and content owner.
2. Keep target-owned identity, prose, media, and code in the target repository.
3. Keep the recipe schema, compiler behavior, generic diagnostics, and reusable workflow in Soroe.
4. Treat every reference as untrusted observation material, not as permission to copy.

If dogfood exposes a reusable limitation, add a Soroe fixture or test and fix the compiler before adding a target-specific workaround.

## Observe references

Use the browser or visual-inspection surface appropriate to the source. Inspect the exact route, viewport, element, state, and interaction the user selected.

Record evidence as:

- a stable reference ID and canonical URL;
- an evidence ID;
- a locator a reviewer can understand, such as `/ at 1280px, first viewport` or `/work, project-card hover`;
- a factual observation about what is visible or what happens.

Do not phrase observations as aesthetic verdicts. Prefer “four named grid columns at 1280px” over “great bento layout.”

## Select facets

Create one facet per independently adoptable decision. For every facet:

1. Point to one reference and evidence item.
2. State the selected properties precisely.
3. Explain the target-specific intent.
4. Add implementation directives.
5. Declare both required characteristics and explicit exclusions.
6. Name logical implementation targets.
7. Attach at least one observable verification check.

Split a facet when its properties could be accepted or rejected independently. Do not use a whole page, brand, or “overall vibe” as a facet.

Read [recipe-authoring.md](references/recipe-authoring.md) when constructing or debugging recipe fields.

## Compose and resolve

Group facet IDs into target routes or surfaces. Add an explicit decision when selected facets compete for density, hierarchy, motion, space, or interaction priority.

Use composition decisions to explain which facet dominates and where. Do not silently average incompatible references.

## Validate and compile

Run the package-local CLI from the Soroe repository:

```bash
# Validate recipe structure
node ./bin/soroe.js validate /absolute/path/to/recipe.json

# Phase 1: compile design system
node ./bin/soroe.js design /absolute/path/to/recipe.json --out /absolute/path/to/design

# Phase 2: compile implementation contract
node ./bin/soroe.js build /absolute/path/to/design/facet-pack.json --out /absolute/path/to/build
```

When Soroe is installed, use `soroe` instead of the package-local Node path.

Stop on validation errors. Fix the recipe field identified by the diagnostic path and code; do not edit compiler output by hand.

Consume these generated files:

- `design/facet-pack.json` — machine-readable design system;
- `design/REFERENCE_GRAPH.md` — reviewable provenance graph;
- `design/DESIGN_BRIEF.md` — designer-facing rationale and constraints;
- `design/tokens.css` — declared target tokens;
- `build/IMPLEMENTATION_BRIEF.md` — coding instructions;
- `build/verification.plan.json` — verification checks.

## Implement from the pack

1. Read project guardrails and composition decisions first.
2. Implement target-owned content and assets in the target repository.
3. Use logical implementation targets to map facets to components, selectors, or files.
4. Preserve semantic HTML and non-script fallbacks unless the recipe explicitly says otherwise.
5. Re-open references only to resolve an evidence ambiguity; do not drift into copying unselected details.

## Verify the interface

Read [verification.md](references/verification.md) before executing the compiled plan.

Verify every check using its declared method. Inspect desktop and mobile states for responsive compositions. Exercise keyboard behavior for interaction facets. Honor reduced-motion checks. Save target-specific screenshots or results in the target repository, never in the reusable skill.

After implementation, run:

```bash
node ./bin/soroe.js verify /absolute/path/to/site \
  --plan /absolute/path/to/build/verification.plan.json
```

Treat a stale pack as a failed verification. Recompile deliberately and review the graph/brief diff before continuing.

## Report traceably

Summarize:

- which references contributed which facets;
- where each facet was implemented;
- which checks passed or remain manual;
- which reusable Soroe issue was fixed, if dogfood exposed one;
- which target-specific choices stayed downstream.

Do not claim visual equivalence, originality, copyright clearance, or accessibility beyond the checks actually performed.
