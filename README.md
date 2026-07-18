# Soroe

> Design by reference. Build with traceability.

Soroe (揃え) is a design compiler for teams who want to say “make it like these sites, but ours.”

It turns visual references into a structured, shareable design system, then compiles that design system into a deterministic implementation contract that AI coding agents can build and verify.

```bash
# Phase 1 — turn references into a design system
soroe design ./recipe.json --out ./design

# Phase 2 — turn the design system into an implementation contract
soroe build ./design/facet-pack.json --out ./build

# Phase 3 — verify the built site against the plan
soroe verify ./site --plan ./build/verification.plan.json
```

Both phases are offline, deterministic, and have no runtime dependencies.

## Why Soroe?

Most handoffs from designer to developer (or from human to AI agent) lose the original intent in prose. “Make it like Stripe, but friendlier” is not actionable. Soroe replaces that ambiguity with:

- **References** — the actual sites you are learning from.
- **Evidence** — what you noticed and where.
- **Facets** — the exact properties you want to keep, with adaptation and anti-copy rules.
- **Traceability** — every decision maps back to a source, and every output can be verified.

## Two-phase workflow

### Phase 1: Soroe Design

Input: a recipe with references, evidence, and facets.

```bash
soroe design ./recipe.json --out ./design
```

Output:

- `facet-pack.json` — canonical machine-readable design system.
- `REFERENCE_GRAPH.md` — reviewable trace from reference → evidence → facet → target.
- `DESIGN_BRIEF.md` — designer-facing rationale and constraints.
- `tokens.css` — deterministic `:root` custom properties.

### Phase 2: Soroe Build

Input: the compiled Facet Pack plus a frontend skill set.

```bash
soroe build ./design/facet-pack.json --out ./build
```

Output:

- `IMPLEMENTATION_BRIEF.md` — route- and facet-oriented instructions.
- `verification.plan.json` — flattened checks with source and target traceability.

### Phase 3: Verify

```bash
soroe verify ./site --plan ./build/verification.plan.json
```

Static checks run immediately. Browser-based checks (DOM, computed-style, interaction, screenshot) are reported as pending until a headless verifier resolves them.

## Example recipe

See [`examples/observatory.recipe.json`](./examples/observatory.recipe.json) for a complete example.

```json
{
  "schemaVersion": "soroe.recipe/v1",
  "project": { "id": "signal-observatory", "title": "Signal Observatory" },
  "references": [
    {
      "id": "sharlee",
      "title": "Sharlee",
      "url": "https://itssharl.ee/",
      "role": "Dual identity and spatial staging",
      "evidence": [
        {
          "id": "dual-identity",
          "locator": "/ at desktop, first viewport identity copy",
          "observation": "Two consecutive statements introduce Charles Bruyerre and then the familiar name Sharlee before the role description."
        }
      ]
    }
  ],
  "facets": [
    {
      "id": "identity.dual-name",
      "category": "identity",
      "source": { "referenceId": "sharlee", "evidenceId": "dual-identity" },
      "selection": { "summary": "Formal name followed by chosen name and role" },
      "adaptation": { "intent": "Present the legal and familiar identities as complementary." },
      "guardrails": { "include": [...], "exclude": [...] },
      "implementation": { "targets": ["home.identity"] },
      "verification": [{ "id": "home.identity-order", "method": "dom", "subject": "...", "expectation": "..." }]
    }
  ],
  "composition": [...],
  "tokens": { "color-accent": "#b8ff6a", ... }
}
```

## CLI reference

```bash
soroe design  <recipe.json> --out <directory> [--check]
soroe build   <facet-pack.json> --out <directory>
soroe verify  <site-dir> --plan <verification.plan.json>
soroe validate <recipe.json> [--format text|json]
```

## Development

```bash
npm test
npm run check
```

Node.js 20 or newer is required.

## License

MIT
