# Soroe — context

## Product

Soroe is a skills-first agent framework for turning visual references into buildable, traceable web interfaces. It gives AI coding agents three focused skills — Design, Build, and Verify — backed by an offline, deterministic compiler.

1. **Soroe Design** (skill + compiler phase) — observe references using whatever browser or inspection tools are available, author a recipe of evidence and facets, compile a structured design system (Facet Pack, Reference Graph, design brief, tokens). Tool-agnostic: the skill teaches the agent how to observe, not which browser to use.
2. **Soroe Build** (skill + compiler phase) — implement from the compiled Facet Pack using whatever frontend stack the target project uses. The skill makes the frontend-skill handoff real by mapping logical implementation targets to concrete components, files, and selectors.
3. **Soroe Verify** (skill + CLI) — verify the built site against the verification plan using whatever testing tools are available. The skill reconciles external evidence honestly: a check that could not run is `blocked`, not `passed`.

The compiler is the deterministic core. The skills are how agents actually use it.

## Selection

The homepage-aligned concept is selected, but the former Starterlint product is not. The selected OSS product is **Soroe**, a deterministic reference-to-interface compiler.

Starterlint focused on detecting incomplete personalization after implementation. The deeper reusable problem appears before implementation: people point coding agents at several websites, say “take this part from each,” and lose the exact selection, adaptation boundary, and verification criteria in prose. Soroe makes those choices explicit and compilable.

## Product boundary

Soroe owns:

- a versioned recipe schema;
- deterministic recipe validation and diagnostics;
- compilation into a Facet Pack, Reference Graph, design brief, implementation brief, verification plan, and optional CSS tokens;
- three focused Agent Skills (Design, Build, Verify) that teach agents the workflow using whatever tools they have;
- neutral fixtures, tests, and documentation.

Soroe does not own:

- browser automation, scraping, or screenshot capture (the skills teach agents to use their own tools);
- model calls or subjective similarity scoring;
- copied reference assets, source code, or personal content;
- framework-specific components (the Build skill maps to whatever stack the target uses);
- deployment or a hosted design-reference library.

## Contracts

The compiler emits deterministic artifacts that the skills consume:

- **`target-map.json`** (`soroe.target-map/v1`) — logical implementation targets with facet associations and structural hints. The `mapping` field starts as `null`; the Build skill instructs the agent to fill it with the concrete file, component, and selector.
- **`verification-results.json`** (`soroe.results/v1`) — written by `soroe verify --out`. Each check has a status: `passed`, `failed`, `blocked`, or `manual`. The Verify skill instructs the agent to resolve blocked checks and update the file with evidence.

## Reference ethics

A reference is not a template. Each selected facet must identify concrete evidence, state what is being selected, explain how it will be adapted, name what must not be copied, and declare verification checks. Recipes should select compositional ideas, behavior, information hierarchy, and measurable properties—not reproduce protected expression or brand identity.

## Downstream benchmark

The downstream adopter is `kuros-querencia` on the `rebuild` branch. It is a benchmark task, not the product. Its purpose is to verify that Soroe Build can take a compiled Facet Pack and produce a real site that passes the verification plan.

The benchmark recipe combines:

- Sharlee: the two-name identity reveal and a spatial hero stage, adapted into an original Kuro/querencia 3D language;
- Promptfolio: command-line navigation, status feedback, and keyboard interaction;
- Enscribe: responsive bento composition with deliberately varied grid areas and card aspect ratios.

Personal biography, contact details, project copy, and all site code remain downstream. Soroe contains only the reusable recipe language and neutral examples.

## Fix order

When dogfooding exposes a missing recipe concept, unstable output, weak diagnostic, or ambiguous trace edge, fix Soroe first and cover the issue with a fixture or test. Only then work around a truly site-specific concern in the benchmark.
