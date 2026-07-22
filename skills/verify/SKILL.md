---
name: soroe-verify
description: Verify a built site against a Soroe verification plan using whatever browser, testing, and inspection tools are available. Reconcile each check honestly — report what passed, what failed, and what could not be tested. Use after Soroe Build has produced an implementation and verification.plan.json.
---

# Soroe Verify

Verify a built interface against its Soroe verification plan. You use whatever browser, testing, and inspection tools are available; the plan tells you what to check and what to expect.

## When to use this skill

- Soroe Build has produced an implementation and a `verification.plan.json`.
- The user wants to know whether the built site actually satisfies the design contract.
- You need an honest reconciliation, not a rubber stamp.

## Inputs

| Artifact | Purpose |
| --- | --- |
| `verification.plan.json` | Flattened checks with method, subject, expectation, and traceability |
| `facet-pack.json` | Design system for cross-referencing facet guardrails |
| `DESIGN_BRIEF.md` | Per-facet instructions and exclusions |
| Built site | The running or static implementation to verify |

## Verification methods

| Method | What it checks | Evidence you need |
| --- | --- | --- |
| `dom` | Semantic order, labels, roles, content presence | DOM snapshot or focused locator assertions |
| `computed-style` | Grid columns, colors, type, spacing, visibility | Computed values at a declared viewport |
| `interaction` | Commands, keyboard flow, focus, hover/click states | Executed input plus visible resulting state |
| `screenshot` | Composition, hierarchy, cropping, spatial balance | Captured screenshots at declared viewports |
| `manual` | Originality, content accuracy, subjective review | Named reviewer decision and concise note |

Do not substitute screenshots for interaction checks or visual inspection for DOM semantics. Each method exists because the others cannot cover it.

## Workflow

### 1. Prepare the environment

1. Build and run the target with its documented production-like command.
2. Check for build errors, console errors, and runtime errors before testing anything.
3. If the site cannot build or run, report the blocked checks. Do not mark them passed.

### 2. Execute checks by method

Use whatever tools are available in your environment:

- **Playwright, Puppeteer, or Cypress** for DOM, computed-style, interaction, and screenshot checks.
- **Browser DevTools or MCP browser tools** for manual inspection and computed-style spot checks.
- **curl + HTML parsing** for basic DOM structure checks when no browser is available.
- **Screenshot tools** (browser screenshot, `screencapture`, headless screenshot) for screenshot checks.
- **Your own eyes** for manual checks.

For each check in the plan:

1. Read the `method`, `subject`, and `expectation`.
2. If the check declares a `viewport`, set the browser to that size before evaluating.
3. If the check declares `preferences` (e.g. `reducedMotion: true`, `colorScheme: dark`), configure the environment accordingly.
4. Execute the check using the appropriate tool.
5. Record the result: `passed`, `failed`, or `blocked` (with the reason).

### 3. Execution order

1. DOM and interaction checks at the default viewport.
2. Computed-style and screenshot checks at every declared breakpoint.
3. Keyboard-only navigation for interaction facets.
4. Reduced-motion and color-scheme variations where declared.
5. Manual checks last, with a named reviewer decision.

### 4. Run the Soroe verify command

```bash
soroe verify ./site --plan ./build/verification.plan.json --out ./verification-results.json
```

The CLI reports static checks and marks browser-dependent checks as `blocked`. Your job is to resolve those blocked checks using the tools available to you.

The `--out` flag writes a `verification-results.json` file with the `soroe.results/v1` contract:

```json
{
  "schemaVersion": "soroe.results/v1",
  "siteDir": "./site",
  "plan": "./build/verification.plan.json",
  "summary": { "passed": 0, "failed": 0, "blocked": 12, "total": 12 },
  "results": [
    { "id": "spatial-hero-stage-dom", "status": "blocked", "reason": "requires browser runner" }
  ]
}
```

Update this file as you resolve blocked checks: change `status` to `passed`, `failed`, or `manual`, add an `evidence` field describing what you observed, and recompute the four summary counts before reporting completion.

### 5. Reconcile honestly

For every check, report one of:

| Status | Meaning |
| --- | --- |
| `passed` | The evidence confirms the expectation. |
| `failed` | The evidence contradicts the expectation. State what differs. |
| `blocked` | The check could not be executed (site won't build, no browser, missing asset). State why. |
| `manual` | A human reviewed it. Name the reviewer and the decision. |

**Do not:**

- Mark a check `passed` because it "probably works."
- Mark a check `passed` because a different check passed.
- Omit failed checks from the summary.
- Claim visual equivalence, originality, copyright clearance, or accessibility beyond the checks actually performed.

### 6. Classify failures before fixing

When a check fails, classify it:

- **Recipe defect:** the subject or expectation is ambiguous or not observable. Fix the recipe in Soroe first when the problem generalizes.
- **Implementation defect:** the compiled direction is clear but the target does not satisfy it. Fix downstream code.
- **Environment defect:** the target cannot build or run. Report the blocked check; do not mark it passed.
- **Intent change:** the desired result changed. Update the recipe, recompile, review the diff, then re-implement.

### 7. Check for stale packs

Run:

```bash
soroe design ./recipe.json --out ./design --check
```

If the pack is stale (recipe changed since last compile), treat all verification results as suspect. Recompile deliberately and review the graph/brief diff before continuing.

### 8. Report

Summarize:

- Total checks: passed, failed, blocked, manual.
- For each failed check: the check ID, what was expected, what was observed.
- For each blocked check: the check ID and why it could not run.
- Which facets have all checks passing vs. which have outstanding failures.
- Which excluded brands, copy, imagery, or layouts were confirmed absent.
- Any reusable Soroe issue discovered during verification.

## Visual-review discipline

When performing screenshot or manual checks:

- Compare only the selected facet, never whole-page similarity.
- Confirm that excluded brand marks, copy, imagery, and exact layouts did not leak into the target.
- Check narrow mobile widths for card reordering and horizontal overflow.
- Check that terminal or command treatments remain operable interfaces, not decoration.
- Check that 3D or motion effects preserve text contrast and reduced-motion behavior.

## Boundaries

- This skill does not author recipes or compile design systems. Use **Soroe Design** for that.
- This skill does not implement code. Use **Soroe Build** for that.
- This skill does not prescribe specific testing tools. Use what is available.
- A check you could not run is a blocked check, not a passed check.

## Dogfood rule

If verification exposes a gap in the verification plan schema, method routing, or check traceability, fix Soroe first and cover it with a fixture or test. Only then work around a truly site-specific concern in the target.
