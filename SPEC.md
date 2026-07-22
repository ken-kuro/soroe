# Soroe specification

Status: **Build Week baseline**
Normative recipe schema: `soroe.recipe/v1`
Normative pack schema: `soroe.pack/v1`

## Product statement

> Skills for "make it like these." Compiler for keeping it traceable.

Soroe is a skills-first agent framework. It gives AI coding agents three focused skills — Design, Build, and Verify — backed by an offline, deterministic compiler. A human or agent observes source interfaces using whatever tools are available and writes a recipe. The compiler validates that every selection is grounded, composed, targeted, and verifiable, then emits stable design artifacts and implementation contracts. The skills teach agents how to observe, implement, and verify; the compiler keeps them honest.

## Users

- designers handing several references to a coding agent;
- developers who need an auditable alternative to "make it like these sites";
- AI coding agents (Claude, Codex, Copilot, etc.) that load the Design, Build, and Verify skills to drive the full workflow;
- coding-agent harnesses that need implementation constraints and verification checks in machine-readable form;
- reviewers who need to trace a rendered decision back to its source evidence.

## Two-phase model

### Phase 1: Soroe Design

Input: a recipe with references, evidence, and facets.
Output: a design system.

Emits:

- `facet-pack.json` — canonical machine-readable design system;
- `REFERENCE_GRAPH.md` — reviewable node/edge tables;
- `DESIGN_BRIEF.md` — designer-facing rationale and constraints;
- `tokens.css` — deterministic `:root` custom properties, or a comment when none are declared;
- `assets/` — optional manifest of extracted or referenced visual assets (colors, type scales, grid definitions).

### Phase 2: Soroe Build

Input: the Facet Pack plus the coding agent's available frontend skills and target-repository context.
Output: an implementation contract.

Emits:

- `IMPLEMENTATION_BRIEF.md` — route- and facet-oriented instructions;
- `verification.plan.json` — flattened checks with source and target traceability;
- `target-map.json` with logical targets, contributing facets, hints, and agent-owned concrete mappings.

## Terms

- **Reference:** a named external source with a stable URL.
- **Evidence:** an addressable observation within a reference: a route, viewport, element, state, or interaction.
- **Facet:** one deliberately selected property or pattern, plus adaptation and anti-copy guardrails.
- **Composition:** a target route or surface that combines facets and resolves conflicts.
- **Implementation target:** a logical destination such as `hero.identity` or `navigation.terminal`.
- **Verification:** an observable assertion attached to a facet.
- **Facet Pack:** the normalized, content-hashed compiler output from the design phase.
- **Reference Graph:** the derived graph connecting project, sources, selections, targets, and checks.
- **Skill set:** a frontend technology profile that maps implementation targets to concrete components and conventions.

## Design-phase workflow

1. Observe each reference at the relevant route, viewport, and state.
2. Record evidence without copying source assets or code.
3. Select facets and state both the intended adaptation and exclusions.
4. Compose facets into target routes and resolve conflicts explicitly.
5. Validate the recipe.
6. Compile the Facet Pack and design artifacts.

## Build-phase workflow

1. Load the Facet Pack, target repository, and relevant frontend skills available to the agent.
2. Map each implementation target to skill-specific conventions.
3. Emit the implementation brief and verification plan.
4. Implement from the brief.
5. Execute DOM, computed-style, interaction, screenshot, and manual checks from the verification plan.
6. Run `soroe verify --out <results.json>` to initialize the evidence record, then use the Verify skill to execute and reconcile every check.

## CLI

```text
soroe design <recipe.json> --out <directory> [--check] [--format text|json]
soroe build <facet-pack.json> --out <directory> [--format text|json]
soroe verify <site-dir> --plan <verification.plan.json> [--out <results.json>] [--format text|json]

# Legacy aliases for the implementation compiler
soroe validate <recipe.json> [--format text|json]
soroe compile <recipe.json> --out <directory> [--check] [--format text|json]
```

`soroe compile` is a legacy alias of the design command. New integrations should use the explicit Design and Build phases.

Exit codes:

- `0`: success;
- `1`: invalid recipe, stale compiled output, or unreadable input;
- `2`: invalid CLI invocation or unexpected compiler failure.

The CLI performs no network access. Recipe authorship may use browser tools, but validation and compilation must be fully offline.

## Recipe invariants

A valid `soroe.recipe/v1` recipe must satisfy all of the following:

1. IDs are unique in their scope and use stable lowercase dot/hyphen notation.
2. Every facet points to an existing reference and evidence item.
3. Every facet declares a concrete selection, adaptation directives, inclusion constraints, exclusion constraints, at least one implementation target, and at least one verification check.
4. Every facet participates in at least one composition.
5. Every composition points only to existing facets.
6. Verification IDs are globally unique.
7. Screenshot checks declare a structured viewport; environment-sensitive checks declare structured preferences.
8. CSS token values cannot contain statement delimiters, braces, or line breaks.
9. Reference and evidence descriptions record observations, not claims of ownership or permission.
10. Unknown fields are rejected so typos cannot silently change meaning.

## Determinism

For semantically equivalent valid input, the compiler must emit byte-identical files across runs and machines.

- Object keys are sorted recursively.
- ID-addressed collections are normalized by ID.
- Set-like string collections are sorted and deduplicated.
- Output uses UTF-8, LF newlines, and a final newline.
- No timestamps, absolute paths, host data, random IDs, or network results enter compiled artifacts.
- The recipe digest is SHA-256 over the canonical normalized recipe.
- `--check` compares the expected bytes for every declared output without rewriting files.

## Outputs

Design phase writes exactly these owned artifacts:

- `facet-pack.json`;
- `REFERENCE_GRAPH.md`;
- `DESIGN_BRIEF.md`;
- `tokens.css`;
- `assets/` (when assets are declared).

Build phase writes exactly these owned artifacts:

- `IMPLEMENTATION_BRIEF.md`;
- `verification.plan.json`;
- optional skill-scaffolded implementation targets.

`compile` (legacy single-phase alias) writes all of the above.

Existing unrelated files in the output directory are never removed.

## Reference Graph model

The graph contains these node kinds:

```text
project, reference, evidence, facet, composition, implementation, verification
```

The graph contains these directed relations:

```text
project --contains--> composition
reference --contains--> evidence
evidence --grounds--> facet
facet --composed_in--> composition
facet --realized_at--> implementation
facet --verified_by--> verification
composition --verified_by--> verification
```

All edge endpoints must exist. Nodes and edges are sorted deterministically.

## Diagnostics

Machine diagnostics use `soroe.diagnostics/v1`:

```json
{
  "schemaVersion": "soroe.diagnostics/v1",
  "valid": false,
  "errors": [
    {
      "code": "reference.unknown",
      "path": "$.facets[0].source.referenceId",
      "message": "Unknown reference 'missing'."
    }
  ]
}
```

Diagnostics are sorted by JSON path, code, and message. Human output is a projection of the same diagnostics.

## Compatibility

Schema versions are explicit strings, not inferred from package versions. A compiler must reject unknown major schema versions. Backward-compatible fields require a new compiler release; breaking recipe or pack changes require a new schema version.

## Security and copyright posture

Soroe receipts describe design decisions; they are not proof of copyright clearance, visual originality, accessibility, or implementation correctness. URLs and observations are untrusted data. The compiler never fetches them. Recipes must exclude copied logos, names, prose, media, proprietary assets, and source code unless the adopter separately has permission.

## Acceptance criteria

- the JSON Schema and runtime validator accept the same shipped valid fixtures;
- all failure classes have stable codes and JSON paths;
- reordered object keys compile byte-identically;
- graph edges never dangle;
- `--check` detects a modified or missing artifact;
- the Agent Skill passes structural validation;
- a downstream benchmark site is implemented from a compiled three-reference recipe;
- dogfood-discovered reusable defects are fixed in Soroe before benchmark workarounds.

## Agent Skills

Soroe ships three focused Agent Skills that teach coding agents the full workflow:

- **Design** (`skills/design/SKILL.md`) — observe references, author a recipe, compile a design system. Tool-agnostic: uses whatever browser or inspection tools the agent has.
- **Build** (`skills/build/SKILL.md`) — implement from the Facet Pack using whatever frontend stack the target project uses. Maps logical implementation targets to concrete components, files, and selectors.
- **Verify** (`skills/verify/SKILL.md`) — verify the built site against the verification plan using whatever testing tools are available. Reconciles external evidence honestly: a check that could not run is `blocked`, not `passed`.

Each skill is self-contained and references the compiler CLI. Skills do not prescribe specific tools, frameworks, or browser automation libraries.

## Non-goals

No browser crawler, screenshot capture service, asset downloader, code generator, component library, framework adapter, hosted registry, Figma plugin, similarity score, taste score, copyright oracle, or deployment system in the baseline release. Soroe is not a browser automation product; the skills teach agents to use their own tools.
