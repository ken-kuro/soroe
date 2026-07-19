# Soroe demo video script

Target length: 2 minutes.

## Frame 1 — Hook (0:00–0:15)

**Visual:** Terminal screen recording. Fade in from black.

**Narration:**
> “You want an AI coding agent to build a site that feels like your favorite references. But ‘make it like these sites’ is too vague — the agent misses details, copies things it shouldn't, and you end up reviewing every pixel.”

**On-screen text:**

```
Make it like these sites, but ours.
```

## Frame 2 — Introduce Soroe (0:15–0:30)

**Visual:** Show the Soroe logo/poster.

**Narration:**
> “Soroe is a design compiler. It turns references into a structured design system, then into an implementation contract the agent can build and verify.”

**On-screen text:**

```
Soroe
Design by reference. Build with traceability.
```

## Frame 3 — The recipe (0:30–0:55)

**Visual:** Run `soroe init` in the terminal. Show the generated `recipe.json`.

**Narration:**
> “Start with a recipe: the references, the evidence you noticed, and the facets you want to keep. Soroe validates the recipe against a schema so the agent cannot skip required guardrails.”

**Commands:**

```bash
soroe init --id my-site --title "My Site" \
  --references sharlee:https://itssharl.ee/,enscribe:https://enscribe.dev/ \
  --out ./recipe.json
soroe validate ./recipe.json
```

## Frame 4 — Design phase (0:55–1:15)

**Visual:** Run `soroe design`. Show the generated files: `facet-pack.json`, `REFERENCE_GRAPH.md`, `DESIGN_BRIEF.md`, `tokens.css`.

**Narration:**
> “Soroe Design compiles the recipe into a canonical design system. Every decision is traceable back to a reference and a piece of evidence.”

**Commands:**

```bash
soroe design ./recipe.json --out ./design
```

## Frame 5 — Build phase (1:15–1:30)

**Visual:** Run `soroe build`. Show `IMPLEMENTATION_BRIEF.md` and `verification.plan.json`.

**Narration:**
> “Soroe Build turns the design system into an implementation brief and a verification plan. The agent knows exactly what to implement and how to check it.”

**Commands:**

```bash
soroe build ./design/facet-pack.json --out ./build
```

## Frame 6 — Verify (1:30–1:45)

**Visual:** Run `soroe verify`. Show the summary output.

**Narration:**
> “After the agent builds the site, Soroe Verify checks it against the plan. Static checks run immediately; browser checks are reported as pending for a headless runner.”

**Commands:**

```bash
soroe verify ./site --plan ./build/verification.plan.json
```

## Frame 7 — Closing (1:45–2:00)

**Visual:** GitHub repo page and the Soroe poster.

**Narration:**
> “Soroe is open source, offline, and built for AI agents. Try it at github.com/ken-kuro/soroe.”

**On-screen text:**

```
Soroe
Design by reference. Build with traceability.
github.com/ken-kuro/soroe
```
