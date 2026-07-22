# Recipe authoring reference

## Field map

| Field | Purpose | Authoring rule |
| --- | --- | --- |
| `schemaVersion` | Select parser contract | Use `soroe.recipe/v1` exactly. |
| `project` | Describe the target | Keep identity/content in the target recipe, not Soroe fixtures. |
| `references[]` | Name sources | Use canonical HTTP(S) URLs and distinct lowercase IDs. |
| `references[].evidence[]` | Ground observations | Include route, viewport/state, and factual observation. |
| `facets[]` | Select decisions | Keep each facet independently accept/rejectable. |
| `selection.properties[]` | Make selection measurable | Use stable names and concrete string values. |
| `adaptation` | Explain translation | Describe target intent and implementation directives. |
| `guardrails.include` | Define invariants | State what must survive implementation. |
| `guardrails.exclude` | Prevent copying/drift | Name brands, assets, copy, code, or unselected treatments to avoid. |
| `implementation.targets` | Connect to target architecture | Use logical IDs such as `hero.identity`, not local absolute paths. |
| `verification[]` | Make claims observable | Give each check a globally unique ID, method, subject, expectation, and structured viewport/preferences when applicable. |
| `composition[]` | Combine facets | Map facets to routes and resolve conflicts explicitly. |
| `tokens` | Emit CSS variables | Use lowercase kebab names and single-line CSS values without semicolons or braces. |
| root `guardrails` | Protect the whole project | Include ownership, accessibility, and motion boundaries as applicable. |

## Facet sizing examples

Good facets:

- formal-name → familiar-name identity reveal;
- four-column named bento areas at desktop, one column at mobile;
- command input with help, history, and unknown-command feedback;
- a specific background/accent token relationship;
- hover elevation plus a reduced-motion fallback.

Oversized facets to split:

- "the whole homepage";
- "the design system";
- "make it feel like Reference A";
- "all animations";
- "copy this card."

## Evidence quality

Write evidence so another reviewer can reproduce the observation without guessing.

Weak:

```text
The hero is cool and 3D.
```

Strong:

```text
/ at 1440px, first viewport: a full-viewport spatial stage sits behind two identity lines;
the content remains readable while the scene moves independently.
```

## Conflict decisions

Add a composition decision when:

- one source favors open space and another favors dense information;
- two interactions compete for the same input or shortcut;
- a motion treatment conflicts with reduced-motion or performance goals;
- card proportions compete with reading order;
- reference typography conflicts with target identity.

State the winner, scope, and fallback. Avoid compromise language that cannot be verified.

## Compiler diagnostics

Use the diagnostic JSON path as the edit location. Common codes:

- `field.unknown`: remove or correct a misspelled field;
- `id.duplicate`: rename the later ID and all of its references;
- `reference.unknown`: point the facet to a declared reference;
- `evidence.unknown`: add or correct evidence on that reference;
- `facet.unknown`: correct the composition facet ID;
- `facet.unused`: add the facet to a composition or delete it;
- `verification.method`: choose a supported method;
- `schema.unsupported`: migrate the recipe instead of guessing compatibility.
