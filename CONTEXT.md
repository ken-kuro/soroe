# Soroe — context

## Product

Soroe is a two-phase design compiler for turning visual references into buildable, traceable web interfaces.

1. **Soroe Design** — the viral, designer-facing phase. Feed it references, evidence, and facets; get a structured design system (Facet Pack, Reference Graph, design brief, tokens, and asset manifest). This is the “Claude Design, but grounded in references” moment.
2. **Soroe Build** — the agent-facing phase. Feed the design system plus a frontend skill set; get implementation targets and a verification plan that a coding agent can execute against.

The current codebase implements the compiler skeleton and the build-phase outputs. The next priority is making the design phase feel as tangible and shareable as the idea deserves.

## Selection

The homepage-aligned concept is selected, but the former Starterlint product is not. The selected OSS product is **Soroe**, a deterministic reference-to-interface compiler.

Starterlint focused on detecting incomplete personalization after implementation. The deeper reusable problem appears before implementation: people point coding agents at several websites, say “take this part from each,” and lose the exact selection, adaptation boundary, and verification criteria in prose. Soroe makes those choices explicit and compilable.

## Product boundary

Soroe owns:

- a versioned recipe schema;
- deterministic recipe validation and diagnostics;
- compilation into a Facet Pack, Reference Graph, design brief, implementation brief, verification plan, and optional CSS tokens;
- an Agent Skill for observing references, authoring recipes, implementing the compiled pack, and verifying the result;
- neutral fixtures, tests, and documentation.

Soroe does not own:

- browser scraping or screenshot capture (input is human/agent-authored evidence);
- model calls or subjective similarity scoring;
- copied reference assets, source code, or personal content;
- framework-specific components;
- deployment or a hosted design-reference library.

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
