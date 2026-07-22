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

Skills for "make it like these." Compiler for keeping it traceable.

## One-sentence description

Soroe is a skills-first agent framework that gives AI coding agents three focused skills — Design, Build, and Verify — backed by an offline, deterministic compiler that keeps selected reference facets traceable from source evidence to implementation targets and checks.

## The problem

Handing a set of reference sites to an AI coding agent usually sounds like:

> "Make it like these sites, but ours."

That intent gets lost. The agent copies colors it shouldn't, misses the exact interaction pattern the user wanted, and produces something the user has to review pixel-by-pixel. There is no auditable trace from the original reference to the final code.

The problem is not that agents lack browser tools or coding ability. It is that nobody teaches them *how* to observe references precisely, implement from a contract instead of a vibe, or verify their work honestly.

## What it does

Soroe gives agents three focused skills, each backed by a deterministic compiler:

1. **Soroe Design** — observe references using whatever browser tools are available, author a recipe of evidence and facets, compile a traceable design system.
2. **Soroe Build** — implement from the compiled Facet Pack using whatever frontend stack the target project uses.
3. **Soroe Verify** — check the built site against the verification plan using whatever testing tools are available, and report honestly.

Soroe is not a browser automation product. It does not crawl, scrape, or screenshot sites. It teaches agents to use their own tools with structure and discipline.

## How it works

```
references + evidence + facets
        ↓
    recipe.json
        ↓
   soroe design  →  facet-pack.json        ← Design skill
                   REFERENCE_GRAPH.md
                   DESIGN_BRIEF.md
                   tokens.css
        ↓
   soroe build   →  IMPLEMENTATION_BRIEF.md ← Build skill
                   verification.plan.json
        ↓
   soroe verify  →  results scaffold
   Verify skill  →  pass / fail / blocked using available tools
```

## Key features

- **Three focused skills** — Design, Build, and Verify skills teach agents the workflow, not prescribe the tools.
- **Evidence-addressed facets** — every design choice points to a reference and a specific observation.
- **Anti-copy guardrails** — each facet declares what to include *and* exclude, preventing accidental plagiarism.
- **Deterministic compiler** — sorted keys, UTF-8/LF, and SHA-256 digests mean byte-identical results across runs.
- **Honest verification** — the Verify skill teaches agents to report what passed, what failed, and what could not be tested. A blocked check is never a passed check.
- **Tool-agnostic** — works with whatever browser, framework, and testing tools the agent has. No vendor lock-in.
- **Offline** — zero runtime network calls, zero external dependencies.

## How we built it

- Vanilla Node.js 20+ with no production dependencies.
- JSON Schema + runtime validators for `soroe.recipe/v1` and `soroe.pack/v1`.
- Deterministic writers that canonicalize JSON and produce SHA-256 digests.
- Three focused Agent Skills (`skills/design/`, `skills/build/`, `skills/verify/`) that guide agents through the full workflow.
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
soroe verify ./site --plan ./build/verification.plan.json \
  --out ./verification-results.json
```

See the full demo script in [`scripts/demo.sh`](./scripts/demo.sh).

## Tech stack

- Node.js 20+ (ES modules)
- JSON Schema
- GitHub Actions CI
- MIT License

## Challenges we ran into

1. **Determinism is hard.** We had to canonicalize JSON (sorted keys, LF line endings) and compute SHA-256 digests so the same recipe always produced the same output. This makes caching, diffing, and CI verification possible.
2. **Agents need skills, not documentation.** Early drafts described the workflow in prose paragraphs. Agents ignored them. We restructured Soroe as three focused skills — Design, Build, and Verify — that teach agents the workflow step by step, using whatever tools they have.
3. **Anti-copy by default.** It is easy to tell an agent "make it like Stripe." It is harder to ensure it does not copy Stripe's actual copy, colors, or layout. Guardrails (`include` / `exclude`) are now required for every facet.
4. **Honest verification.** Agents want to report success. The Verify skill explicitly teaches them that a check they could not run is `blocked`, not `passed`, and that partial matches are failures with notes.

## Accomplishments

- Three focused Agent Skills (Design, Build, Verify) that make the full workflow agent-native.
- A complete CLI with `init`, `design`, `build`, `verify`, and `validate`.
- 24 tests covering validation, design, build, verification contracts, and CLI end-to-end.
- Deterministic, byte-identical output verified by SHA-256 digests.
- Public GitHub repo with CI and open-source docs.

## What we learned

- AI agents build best from skills and contracts, not vibes. A structured recipe with evidence and guardrails is a far better input than a paragraph of adjectives.
- Verification must be designed into the process from the start. If you cannot check it, you cannot ship it. And if you could not check it, say so.
- Skills-first beats tools-first. Teaching agents *how* to observe, implement, and verify is more portable than building a browser automation product they may not be able to use.
- Dogfooding works. Running Soroe on a real rebuild (`kuros-querencia`) exposed gaps in the schema and CLI that unit tests did not.

## What's next

- Richer verification tooling: headless browser runners for DOM, computed-style, interaction, and screenshot checks.
- Framework-specific build references (React, Vue, Svelte, etc.).
- Web UI for authoring recipes and reviewing reference graphs.
- Deeper integration with coding agents as a native skill pack.

## Links

- GitHub: https://github.com/ken-kuro/soroe
- Benchmark: https://github.com/ken-kuro/kuros-querencia/tree/rebuild
- License: MIT

## Video script

See [`assets/DEMO_SCRIPT.md`](./assets/DEMO_SCRIPT.md) for a 2-minute demo video script and storyboard.

## Thumbnail

See [`assets/soroe-poster.svg`](./assets/soroe-poster.svg) for the submission thumbnail.
