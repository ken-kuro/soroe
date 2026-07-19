# Devpost submission — Soroe

## Submission checklist

- [x] Project name and tagline
- [x] One-sentence description
- [x] What it does
- [x] How we built it
- [x] Demo link / GitHub repo
- [x] Tech stack
- [x] Challenges we ran into
- [x] Accomplishments
- [x] What we learned
- [x] What's next
- [x] Thumbnail/poster image (`assets/soroe-poster.svg`)
- [x] Demo video script (`scripts/demo.sh` + `DEMO_SCRIPT.md`)

## Project name

Soroe

## Tagline

Design by reference. Build with traceability.

## One-sentence description

Soroe is an offline, deterministic design compiler that turns visual references into a structured design system and an implementation contract AI coding agents can build and verify.

## The problem

Handing a set of reference sites to an AI coding agent usually sounds like:

> “Make it like these sites, but ours.”

That intent gets lost. The agent copies colors it shouldn't, misses the exact interaction pattern the user wanted, and produces something the user has to review pixel-by-pixel. There is no auditable trace from the original reference to the final code.

## What it does

Soroe replaces the vague handoff with a traceable, two-phase compiler:

1. **Soroe Design** takes a recipe (references + evidence + facets) and outputs a canonical design system.
2. **Soroe Build** turns that design system into an implementation contract.
3. **Soroe Verify** checks the built site against the contract.

Every decision maps back to a source reference and a piece of evidence, so the result is auditable and original.

## How it works

```
references + evidence + facets
        ↓
    recipe.json
        ↓
   soroe design  →  facet-pack.json
                   REFERENCE_GRAPH.md
                   DESIGN_BRIEF.md
                   tokens.css
        ↓
   soroe build   →  IMPLEMENTATION_BRIEF.md
                   verification.plan.json
        ↓
   soroe verify  →  pass / pending / fail
```

## Key features

- **Evidence-addressed facets** — every design choice points to a reference and a specific observation.
- **Anti-copy guardrails** — each facet declares what to include *and* exclude, preventing accidental plagiarism.
- **Deterministic output** — sorted keys, UTF-8/LF, and SHA-256 digests mean byte-identical results across runs.
- **Agent-native** — `AGENTS.md`, recipe prompts, and a JavaScript API let Claude, Codex, and other agents drive the workflow.
- **Offline** — zero runtime network calls, zero external dependencies.

## How we built it

- Vanilla Node.js 20+ with no production dependencies.
- JSON Schema + runtime validators for `soroe.recipe/v1` and `soroe.pack/v1`.
- Deterministic writers that canonicalize JSON and produce SHA-256 digests.
- A benchmark site (`kuros-querencia`) dogfoods the full design → build → verify flow.
- GitHub Actions CI runs `npm test` and `npm run check` on every push.

## Demo

Run the full pipeline in seconds:

```bash
# 1. Scaffold a recipe
npx soroe init \
  --id my-site \
  --title "My Site" \
  --references sharlee:https://itssharl.ee/,enscribe:https://enscribe.dev/ \
  --out ./recipe.json

# 2. Compile the design system
soroe design ./recipe.json --out ./design

# 3. Compile the implementation contract
soroe build ./design/facet-pack.json --out ./build

# 4. Verify the built site
soroe verify ./site --plan ./build/verification.plan.json
```

See the full demo script in [`scripts/demo.sh`](./scripts/demo.sh).

## Tech stack

- Node.js 20+ (ES modules)
- JSON Schema
- GitHub Actions CI
- MIT License

## Challenges we ran into

1. **Determinism is hard.** We had to canonicalize JSON (sorted keys, LF line endings) and compute SHA-256 digests so the same recipe always produced the same output. This makes caching, diffing, and CI verification possible.
2. **Agents need structure, not prose.** Early drafts described the workflow in paragraphs. Agents ignored them. We switched to a schema-driven recipe format, example prompts, and a programmatic API.
3. **Anti-copy by default.** It is easy to tell an agent “make it like Stripe.” It is harder to ensure it does not copy Stripe’s actual copy, colors, or layout. Guardrails (`include` / `exclude`) are now required for every facet.

## Accomplishments

- A complete CLI with `init`, `design`, `build`, `verify`, and `validate`.
- 16+ tests covering validation, design, build, and CLI end-to-end.
- Deterministic, byte-identical output verified by SHA-256 digests.
- Public GitHub repo with CI and open-source docs.

## What we learned

- AI agents build best from contracts, not vibes. A structured recipe with evidence and guardrails is a far better input than a paragraph of adjectives.
- Verification must be designed into the process from the start. If you cannot check it, you cannot ship it.
- Dogfooding works. Running Soroe on a real rebuild (`kuros-querencia`) exposed gaps in the schema and CLI that unit tests did not.

## What's next

- Browser-based verifier for DOM, computed-style, interaction, and screenshot checks.
- More skill scaffolds (React, Vue, Svelte, etc.).
- Web UI for authoring recipes and reviewing reference graphs.
- Integration with coding agents as a native tool/plugin.

## Links

- GitHub: https://github.com/ken-kuro/soroe
- Benchmark: https://github.com/ken-kuro/kuros-querencia/tree/rebuild
- License: MIT

## Video script

See [`assets/DEMO_SCRIPT.md`](./assets/DEMO_SCRIPT.md) for a 2-minute demo video script and storyboard.

## Thumbnail

See [`assets/soroe-poster.svg`](./assets/soroe-poster.svg) for the submission thumbnail.
