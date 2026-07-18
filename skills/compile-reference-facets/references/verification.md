# Verification reference

## Method routing

| Method | Use for | Evidence |
| --- | --- | --- |
| `dom` | semantic order, labels, roles, content presence | DOM snapshot or focused locator assertions |
| `computed-style` | grid columns, colors, type, spacing, visibility | computed values at a declared viewport |
| `interaction` | commands, keyboard flow, focus, hover/click states | executed input plus visible resulting state |
| `screenshot` | composition, hierarchy, cropping, spatial balance | target-owned screenshots at declared viewports |
| `manual` | originality, content accuracy, subjective review | named reviewer decision and concise note |

Do not substitute screenshots for interaction checks or visual inspection for DOM semantics.

Put screenshot dimensions in `viewport.width` and `viewport.height`; do not bury them only in `subject`. Put reduced-motion and color-scheme requirements in `preferences` so an agent can configure the environment before evaluating the expectation.

## Execution order

1. Build and run the target with its documented production-like command.
2. Check for build, console, and runtime errors.
3. Execute DOM and interaction checks at the default viewport.
4. Execute computed-style and screenshot checks at every declared breakpoint.
5. Test keyboard-only navigation.
6. Enable reduced motion and repeat affected checks.
7. Record manual decisions without presenting them as automated proof.
8. Run Soroe `compile --check`.

## Failure handling

Classify a failed check before editing:

- **Recipe defect:** the subject or expectation is ambiguous or not observable. Fix Soroe/recipe reuse first when the problem generalizes.
- **Implementation defect:** the compiled direction is clear but the target does not satisfy it. Fix downstream code.
- **Environment defect:** the target cannot build or run. Report the blocked check; do not mark it passed.
- **Intent change:** the desired result changed. Update the recipe, recompile, review the diff, then implement.

## Visual-review discipline

- Compare only the selected facet, never whole-page similarity.
- Confirm that excluded brand marks, copy, imagery, and exact layouts did not leak into the target.
- Prefer an original target-owned spatial motif over a substitute copied asset.
- Check narrow mobile widths for card reordering and horizontal overflow.
- Check that a terminal treatment remains an operable interface rather than decoration.
- Check that 3D or motion effects preserve text contrast and reduced-motion behavior.
