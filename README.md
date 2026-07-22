# Soroe

> Skills for "make it like these." Compiler for keeping it traceable.

Soroe (揃え) is a skills-first agent framework for turning visual references into buildable, verifiable interfaces. It gives AI coding agents three focused skills — **Design**, **Build**, and **Verify** — backed by an offline, deterministic compiler that keeps every selected facet traceable from source evidence to implementation target and verification check.

Soroe is not a browser automation product. It does not crawl, scrape, or screenshot sites. Instead, it teaches agents how to use whatever browser, coding, and testing tools they already have to observe references, implement from a design contract, and verify the result honestly.

## The three skills

### Soroe Design

Observe visual references using whatever browser or inspection tools are available. Author a recipe of evidence and facets. Compile a traceable design system.

```bash
soroe init --id my-site --title "My Site" \
  --references sharlee:https://itssharl.ee/,enscribe:https://enscribe.dev/ \
  --out ./recipe.json
soroe design ./recipe.json --out ./design
```

Output: `facet-pack.json`, `REFERENCE_GRAPH.md`, `DESIGN_BRIEF.md`, `tokens.css`

→ [`skills/design/SKILL.md`](./skills/design/SKILL.md)

### Soroe Build

Implement from the compiled Facet Pack using whatever frontend stack the target project uses. Map logical targets to concrete components, files, and selectors.

```bash
soroe build ./design/facet-pack.json --out ./build
```

Output: `IMPLEMENTATION_BRIEF.md`, `verification.plan.json`

→ [`skills/build/SKILL.md`](./skills/build/SKILL.md)

### Soroe Verify

Verify the built site against the verification plan using whatever browser, testing, and inspection tools are available. Reconcile every check honestly — report what passed, what failed, and what could not be tested.

```bash
soroe verify ./site --plan ./build/verification.plan.json
```

→ [`skills/verify/SKILL.md`](./skills/verify/SKILL.md)

## The compiler

The skills guide agents; the compiler keeps them honest. Soroe's offline CLI validates recipes, compiles design systems, and emits implementation contracts with deterministic, byte-identical output.

- **Zero runtime dependencies.** No network calls, no API keys, no accounts.
- **Deterministic.** Sorted keys, UTF-8/LF, SHA-256 digests. Same recipe → same bytes, every time.
- **Traceable.** Every facet maps to a reference and evidence. Every check maps to a facet. The Reference Graph makes the full chain reviewable.

```bash
# Validate a recipe
soroe validate ./recipe.json

# Compile design system
soroe design ./recipe.json --out ./design

# Compile implementation contract
soroe build ./design/facet-pack.json --out ./build

# Initialize an evidence-results record; the Verify skill resolves blocked checks
soroe verify ./site --plan ./build/verification.plan.json \
  --out ./verification-results.json
```

## Install and test

Soroe supports Node.js 20 or newer on macOS, Linux, and WSL.

```bash
git clone https://github.com/ken-kuro/soroe.git
cd soroe
npm install

# Run the test suite
npm test

# Exercise validate → design → build → verify end to end
npm run check
```

To make the `soroe` command available while working from a clone, run `npm link`.
The fastest judge test is `npm run check`; it uses the included recipe and fixtures,
so no account, API key, network request, or sample-data download is required.

## Who is Soroe for?

- **Designers** who want to hand references to a coding agent and get a traceable design system back.
- **Developers** who need an auditable contract from "make it like these sites" to real code.
- **AI agents** (Claude, Codex, Copilot, etc.) that need structured skills for reference-driven design, implementation, and verification.

## Why skills-first?

Most handoffs from designer to developer (or from human to AI agent) lose the original intent in prose. "Make it like Stripe, but friendlier" is not actionable.

Soroe replaces that ambiguity with three skills that meet agents where they are:

- **Design** teaches agents to observe references and record exact, evidence-grounded selections — not copy whole pages.
- **Build** teaches agents to implement from a contract using whatever frontend stack they have — not prescribe a framework.
- **Verify** teaches agents to check their work honestly — report what passed, what failed, and what they couldn't test.

The compiler is the deterministic backbone: it validates the recipe, compiles the design system, and emits the verification plan. The skills are how agents actually use it.

## For AI agents

Soroe is built to be driven by coding agents. Each skill is a self-contained `SKILL.md` that an agent loads to learn the workflow:

1. Load the **Design** skill. Interview the user, observe references, author a recipe, compile the design system.
2. Load the **Build** skill. Read the Facet Pack, map targets to the frontend stack, implement.
3. Load the **Verify** skill. Run checks using available tools, reconcile honestly, report.

See [`AGENTS.md`](./AGENTS.md) for the programmatic API and integration guide.

## Example recipe

See [`examples/observatory.recipe.json`](./examples/observatory.recipe.json) for a complete three-reference example.

## CLI reference

```bash
soroe init     --id <project-id> --title <title> --references <id:url,...> --out <recipe.json>
soroe design   <recipe.json> --out <directory> [--check]
soroe build    <facet-pack.json> --out <directory>
soroe verify   <site-dir> --plan <verification.plan.json> [--out <results.json>]
soroe validate <recipe.json> [--format text|json]
```

## Development

```bash
npm test
npm run check
```

Node.js 20 or newer is required.

## Built with Codex and GPT-5.6

Codex was the primary implementation partner during OpenAI Build Week. We used it
to iterate on the CLI commands, compiler structure, schemas, fixtures, tests,
documentation, and repository cleanup. GPT-5.6 helped us refine the recipe
structure, anti-copy guardrails, verification model, and the product language used
in prompts and generated briefs. Key design decisions stayed reviewable through
the repository's tests, deterministic outputs, and Git history.

## License

MIT
