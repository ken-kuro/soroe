# Devpost submission — Soroe

## Project name

Soroe

## Tagline

Design by reference. Build with traceability.

## One-sentence description

Soroe turns visual references into a structured design system, then compiles that design system into a deterministic implementation contract that AI coding agents can build and verify.

## What it does

Designers and developers often lose intent when handing off references to AI agents. “Make it like these sites, but ours” is too vague. Soroe replaces that with a traceable, two-phase compiler:

1. **Soroe Design** takes URLs and evidence and outputs a Facet Pack, Reference Graph, Design Brief, and tokens.
2. **Soroe Build** takes the Facet Pack and outputs an Implementation Brief and Verification Plan.
3. **Soroe Verify** checks the built site against the plan.

Every decision maps back to a source reference and evidence, so the result is auditable and original.

## How we built it

- The compiler is written in vanilla Node.js with zero runtime dependencies.
- Recipes are validated against JSON Schema and runtime invariants.
- Outputs are deterministic: sorted keys, sorted collections, UTF-8/LF, and SHA-256 digests.
- We dogfood Soroe on the `kuros-querencia` rebuild as a benchmark task.

## Key features

- Evidence-addressed facets with adaptation and anti-copy guardrails.
- Reference Graph tracing every decision from project → reference → evidence → facet → target.
- Deterministic, byte-identical output.
- Offline CLI with no network calls.
- GitHub Actions CI.

## What's next

- Browser-based verifier for DOM, computed-style, interaction, and screenshot checks.
- Skill-scaffolded implementation targets.
- Web UI for authoring recipes.

## Links

- GitHub: https://github.com/ken-kuro/soroe
- Benchmark: https://github.com/ken-kuro/kuros-querencia/tree/rebuild
