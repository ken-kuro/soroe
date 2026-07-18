# Soroe for AI agents

Soroe is a design compiler for AI agents. It turns visual references into a deterministic implementation contract an agent can build and verify.

## Agent workflow

```
references + observations  →  recipe  →  design system  →  implementation contract  →  built site  →  verification
```

Your job as the agent is to **author the recipe**. Soroe validates and compiles it.

## Authoring the recipe

1. Interview the user about the target project and references.
2. Capture references: URLs, pages, or described images.
3. Optionally capture exact facets the user wants from each reference.
4. Use `soroe init` to scaffold a starter recipe from the user's answers.
5. Replace placeholders with real evidence and facets.
6. Run `soroe validate <recipe.json>` until it passes.
7. Run `soroe design <recipe.json> --out <dir>` to produce the design system.
8. Run `soroe build <dir>/facet-pack.json --out <dir>` to produce the implementation contract.

## Use `soroe init` to scaffold a recipe

```bash
soroe init --id my-site --title "My Site" --references ref1:https://a.com,ref2:https://b.com --out ./recipe.json
```

This produces a valid starter recipe with one placeholder evidence and facet per reference. Replace the placeholders with real observations before compiling.

You can also call `init` interactively:

```bash
soroe init --out ./recipe.json
# then follow the prompts
```

## Recipe schema

See [`schema/recipe.v1.schema.json`](./schema/recipe.v1.schema.json) and [`examples/observatory.recipe.json`](./examples/observatory.recipe.json).

## Programmatic API

If your agent is written in JavaScript, you can call Soroe directly:

```javascript
import { designRecipe, buildPack, validateRecipe } from './src/compiler.js'
import { initRecipe } from './src/init.js'

// Scaffold a starter recipe
const recipe = initRecipe({
  id: 'my-site',
  title: 'My Site',
  references: [
    { id: 'a', url: 'https://a.com' },
  ],
})

// Validate, design, build
const validation = validateRecipe(recipe)
if (!validation.valid) throw new Error(validation.errors)

const { pack } = designRecipe(recipe)
const { outputs } = buildPack(pack)
```

See [`examples/agent-workflow.md`](./examples/agent-workflow.md) for a full agent integration example.

## Rules

- Every facet must point to a real reference and evidence.
- Every facet must declare what to include and what to exclude.
- Every verification check must be observable.
- Do not copy source assets, copy, brands, or code.
- Keep target-owned content (names, contact info, project copy) in the target repository.

## Outputs you can trust

- `facet-pack.json` — the canonical design system.
- `REFERENCE_GRAPH.md` — provenance from reference to implementation target.
- `DESIGN_BRIEF.md` — the design rationale.
- `IMPLEMENTATION_BRIEF.md` — the coding instructions.
- `verification.plan.json` — the checks to run.

When the implementation is done, run:

```bash
soroe verify <site-dir> --plan <verification.plan.json>
```
