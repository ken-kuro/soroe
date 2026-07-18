# Soroe

Soroe (揃え) is a design compiler. It turns visual references into a structured design system, then turns that design system into a deterministic implementation contract an AI agent can build and verify.

It is built in two phases:

1. **Soroe Design** — select exact facets from references and compile them into a traceable design system: a Facet Pack, Reference Graph, design brief, visual tokens, and an machine-readable asset manifest.
2. **Soroe Build** — take that design system, combine it with a frontend skill set, and emit implementation targets and a verification plan that a coding agent can use to produce the site.

```bash
node ./bin/soroe.js design ./examples/observatory.recipe.json --out ./build/observatory
node ./bin/soroe.js build ./build/observatory/facet-pack.json --skill ./skills/web-static --out ./build/observatory/site
node ./bin/soroe.js verify ./build/observatory/site --plan ./build/observatory/verification.plan.json
```

Both phases are offline and have no runtime dependencies.

## Phase 1: Soroe Design

Designers and agents use Soroe Design when they want to say "make it like these sites, but ours."

Input:

- one or more visual references with stable URLs;
- evidence (what you noticed at a route, viewport, or state);
- selected facets (the exact property or pattern you want);
- adaptation rules and anti-copy guardrails.

Output:

- `facet-pack.json` — canonical machine-readable design system;
- `REFERENCE_GRAPH.md` — reviewable trace from reference → evidence → facet → target;
- `DESIGN_BRIEF.md` — designer-facing rationale and constraints;
- `tokens.css` — deterministic `:root` custom properties;
- `assets/` — extracted or referenced asset manifest (colors, type scales, grid definitions).

## Phase 2: Soroe Build

AI agents and developers use Soroe Build when they need an auditable, traceable contract from the design system to the code.

Input:

- the compiled Facet Pack;
- a frontend skill set (e.g., static HTML/CSS/JS, React, Vue);
- optional project-specific content.

Output:

- `IMPLEMENTATION_BRIEF.md` — route- and facet-oriented instructions;
- `verification.plan.json` — flattened checks with source and target traceability;
- optional scaffolded implementation targets.

## CLI

```bash
# Design phase
soroe design <recipe.json> --out <directory>

# Build phase
soroe build <facet-pack.json> --skill <skill-dir> --out <directory>

# Verification
soroe verify <site-dir> --plan <verification.plan.json>

# Legacy validate/compile aliases still work for the implementation compiler
soroe validate <recipe.json> [--format text|json]
soroe compile <recipe.json> --out <directory> [--check]
```

## Recipe shape

Each facet names:

- the exact reference evidence it is grounded in;
- the property or behavior being selected;
- how it should be adapted for the new project;
- what must and must not survive implementation;
- logical implementation targets;
- observable verification checks.

[`SPEC.md`](./SPEC.md) contains the full product contract. The normative machine contract is [`schema/recipe.v1.schema.json`](./schema/recipe.v1.schema.json).

## Development

```bash
npm test
npm run check
```

Node.js 20 or newer is required.

## License

MIT
