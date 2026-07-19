# OpenAI Devpost submission — copy/paste guide

Use the content below directly on the Devpost submission form.

## Project name

Soroe

## Tagline

Design by reference. Build with traceability.

## One-sentence description

Soroe is an offline, deterministic design compiler that turns visual references into a structured design system and an implementation contract AI coding agents can build and verify.

## About the project

Handing a set of reference sites to an AI coding agent usually sounds like “make it like these sites, but ours.” That intent gets lost — the agent copies colors it shouldn't, misses the exact interaction pattern the user wanted, and produces something the user has to review pixel-by-pixel.

Soroe replaces the vague handoff with a traceable, two-phase compiler:

1. **Soroe Design** takes a recipe (references + evidence + facets) and outputs a canonical design system.
2. **Soroe Build** turns that design system into an implementation contract.
3. **Soroe Verify** checks the built site against the contract.

Every decision maps back to a source reference and a piece of evidence, so the result is auditable and original.

## How we built it

- Vanilla Node.js 20+ with no production dependencies.
- JSON Schema + runtime validators for `soroe.recipe/v1` and `soroe.pack/v1`.
- Deterministic writers that canonicalize JSON and produce SHA-256 digests.
- A benchmark site (`kuros-querencia`) dogfoods the full design → build → verify flow.
- GitHub Actions CI runs tests and the full compiler pipeline on every push.

## Challenges we ran into

1. **Determinism is hard.** We had to canonicalize JSON (sorted keys, LF line endings) and compute SHA-256 digests so the same recipe always produced the same output. This makes caching, diffing, and CI verification possible.
2. **Agents need structure, not prose.** Early drafts described the workflow in paragraphs. Agents ignored them. We switched to a schema-driven recipe format, example prompts, and a programmatic API.
3. **Anti-copy by default.** It is easy to tell an agent “make it like Stripe.” It is harder to ensure it does not copy Stripe’s actual copy, colors, or layout. Guardrails (`include` / `exclude`) are now required for every facet.

## Accomplishments

- Complete CLI with `init`, `design`, `build`, `verify`, and `validate`.
- 16+ tests covering validation, design, build, and CLI end-to-end.
- Deterministic, byte-identical output verified by SHA-256 digests.
- Public GitHub repo with CI and open-source docs.

## What we learned

- AI agents build best from contracts, not vibes. A structured recipe with evidence and guardrails is a far better input than a paragraph of adjectives.
- Verification must be designed into the process from the start. If you cannot check it, you cannot ship it.
- Dogfooding works. Running Soroe on a real rebuild exposed gaps in the schema and CLI that unit tests did not.

## What's next

- Browser-based verifier for DOM, computed-style, interaction, and screenshot checks.
- More skill scaffolds (React, Vue, Svelte, etc.).
- Web UI for authoring recipes and reviewing reference graphs.
- Integration with coding agents as a native tool/plugin.

## Tech stack

- Node.js 20+ (ES modules)
- JSON Schema
- GitHub Actions CI
- MIT License

## Links

- GitHub: https://github.com/ken-kuro/soroe
- Benchmark: https://github.com/ken-kuro/kuros-querencia/tree/rebuild

## Thumbnail / poster

Use `assets/soroe-poster.png`.

## Demo video

Record a 2-minute walkthrough using `assets/DEMO_SCRIPT.md`.

## Demo script

```bash
# 1. Scaffold a recipe
npx soroe init --id my-site --title "My Site" \
  --references sharlee:https://itssharl.ee/,enscribe:https://enscribe.dev/ \
  --out ./recipe.json

# 2. Compile the design system
soroe design ./recipe.json --out ./design

# 3. Compile the implementation contract
soroe build ./design/facet-pack.json --out ./build

# 4. Verify the built site
soroe verify ./site --plan ./build/verification.plan.json
```
