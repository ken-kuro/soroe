# Soroe for AI agents

Soroe is a skills-first framework for "make it like these." Its Design, Build, and Verify skills guide the agent; its offline compiler validates and emits deterministic, traceable artifacts.

## Choose the skill

- Use `skills/design/SKILL.md` to inspect references with available tools, author evidence and facets, and compile the design system.
- Use `skills/build/SKILL.md` to map the Facet Pack into real target-repository components, files, and selectors, then implement it.
- Use `skills/verify/SKILL.md` to execute the verification plan with available browser, testing, screenshot, or manual-review tools and record evidence honestly.

Do not treat Soroe as a browser crawler, screenshot service, code generator, or Playwright wrapper. Those are capabilities the agent may use while following a Soroe skill.

## Compiler workflow

```bash
soroe init --id my-site --title "My Site" \
  --references ref1:https://a.com,ref2:https://b.com \
  --out ./recipe.json
soroe validate ./recipe.json
soroe design ./recipe.json --out ./design
soroe build ./design/facet-pack.json --out ./build
soroe verify ./site --plan ./build/verification.plan.json \
  --out ./verification-results.json
```

Replace every scaffold placeholder with a real observation before compilation. `soroe verify` initializes a results record with tool-dependent checks blocked; the Verify skill resolves those checks and attaches evidence.

## Programmatic API

```javascript
import { buildPack, designRecipe, initRecipe, validateRecipe } from 'soroe'

const recipe = initRecipe({
  id: 'my-site',
  title: 'My Site',
  references: [{ id: 'reference-a', url: 'https://a.com' }],
})

const validation = validateRecipe(recipe)
if (!validation.valid) throw new Error(JSON.stringify(validation.errors))

const { pack, outputs: designOutputs } = designRecipe(recipe)
const { outputs: buildOutputs } = buildPack(pack)
```

## Artifact handoff

- Design emits `facet-pack.json`, `REFERENCE_GRAPH.md`, `DESIGN_BRIEF.md`, and `tokens.css`.
- Build emits `IMPLEMENTATION_BRIEF.md`, `verification.plan.json`, and `target-map.json`.
- The Build skill fills concrete mappings in a target-owned copy of `target-map.json`.
- Verify emits `verification-results.json`; the Verify skill resolves blocked checks and adds evidence.

## Invariants

- Ground every facet in one declared reference and evidence item.
- Declare both inclusion and exclusion guardrails.
- Keep target identity, prose, media, assets, and source code downstream.
- Resolve composition conflicts explicitly.
- Never mark an unexecuted check as passed.
- Do not claim visual equivalence, originality, copyright clearance, or accessibility beyond recorded evidence.
