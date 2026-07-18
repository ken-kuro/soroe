# Contributing to Soroe

Thanks for your interest. Soroe is intentionally small and focused. Before opening a PR, please read the product boundary in [`CONTEXT.md`](./CONTEXT.md) and the contract in [`SPEC.md`](./SPEC.md).

## Development setup

```bash
git clone https://github.com/ken-kuro/soroe.git
cd soroe
npm test
npm run check
```

Node.js 20 or newer is required.

## What to work on

- **Phase 1 (Design):** making the design brief, reference graph, and tokens more useful to designers.
- **Phase 2 (Build):** mapping Facet Packs to frontend skills and emitting better implementation contracts.
- **Phase 3 (Verify):** a browser-based runner for the verification plan.

See [`SPEC.md`](./SPEC.md) for non-goals.

## Recipe changes

If you add a new concept to the recipe schema, you must:

1. Update `schema/recipe.v1.schema.json`.
2. Update `schema/facet-pack.v1.schema.json` if it changes the pack shape.
3. Add a fixture under `fixtures/valid/` or `fixtures/invalid/`.
4. Add a test under `test/`.
5. Update `SPEC.md`.

## Determinism

Outputs must be byte-identical across runs. Do not add timestamps, absolute paths, or random IDs to compiled artifacts.

## Commit messages

Use present tense and a concise subject. Examples:

- `feat: add build command for Phase 2`
- `fix: reject unknown fields in recipe tokens`
- `docs: update README with two-phase workflow`
