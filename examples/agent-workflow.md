# Agent workflow example

This is how a coding agent (Claude, Codex, etc.) uses Soroe's three skills — Design, Build, and Verify — to build a site from references.

## Conversation

**User:** Build me a personal site that feels like Sharlee and Enscribe.

**Agent:**

1. Scaffold a recipe with the references.

```bash
soroe init \
  --id my-site \
  --title "My Personal Site" \
  --references sharlee:https://itssharl.ee/,enscribe:https://enscribe.dev/ \
  --out ./recipe.json
```

2. Ask the user clarifying questions.

- What is your name and role?
- What sections do you need? (home, about, work, contact)
- Do you have any images or assets to use?
- Are there any brands, colors, or copy you want to avoid?

3. Update the recipe with real evidence and facets.

The agent opens each reference, observes specific elements, and fills in the recipe:

```json
{
  "id": "sharlee",
  "title": "Sharlee",
  "url": "https://itssharl.ee/",
  "role": "Dual identity and spatial staging",
  "evidence": [
    {
      "id": "dual-identity",
      "locator": "/ at desktop, first viewport identity copy",
      "observation": "Two consecutive statements introduce the formal name and then the familiar name before the role description."
    }
  ]
}
```

```json
{
  "id": "identity.dual-name",
  "category": "identity",
  "source": { "referenceId": "sharlee", "evidenceId": "dual-identity" },
  "selection": {
    "summary": "Formal name followed by chosen name and role",
    "properties": [
      { "name": "copy-sequence", "value": "Formal name → chosen name → role" }
    ]
  },
  "adaptation": {
    "intent": "Present the legal and familiar identities as complementary.",
    "directives": [
      "Keep both identity lines in the primary h1.",
      "Use the chosen name as the emphatic final beat."
    ]
  },
  "guardrails": {
    "include": ["Formal name, chosen name, and role in the first viewport."],
    "exclude": ["Sharlee's names, wording, font files, colors, and layout measurements."]
  },
  "implementation": {
    "targets": ["home.identity"],
    "hints": ["Use one semantic h1 with two block spans."]
  },
  "verification": [
    {
      "id": "home.identity-order",
      "method": "dom",
      "subject": "[data-target='home.identity']",
      "expectation": "Formal name precedes chosen name and role paragraph follows the h1."
    }
  ]
}
```

4. Validate and compile the design system.

```bash
soroe validate ./recipe.json
soroe design ./recipe.json --out ./design
```

5. Compile the implementation contract.

```bash
soroe build ./design/facet-pack.json --out ./build
```

6. Implement the site from `build/IMPLEMENTATION_BRIEF.md` and `build/verification.plan.json`.

7. Verify.

```bash
soroe verify ./site --plan ./build/verification.plan.json
```

## Agent integration with code

```javascript
import { designRecipe, buildPack, validateRecipe } from 'soroe'

const recipe = /* recipe object */
const validation = validateRecipe(recipe)
if (!validation.valid) throw new Error(validation.errors)

const { pack, outputs: designOutputs } = designRecipe(recipe)
const { outputs: buildOutputs } = buildPack(pack)
```

## Rules for the agent

- Never copy source assets, copy, brands, or code.
- Always record the source reference and evidence for each facet.
- Ask the user before finalizing ambiguous adaptation decisions.
- Run `soroe validate` before `soroe design`.
- Treat a stale Facet Pack as a failed verification.
