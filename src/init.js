export function initRecipe({ id, title, references }) {
  const referenceEntries = references.map((reference) => ({
    id: reference.id,
    title: reference.title ?? `Reference`,
    url: reference.url,
    role: reference.role ?? 'Observed reference',
    evidence: [
      {
        id: 'placeholder',
        locator: 'Add route, viewport, and element you observed.',
        observation: 'Replace with a factual observation about what you saw.',
      },
    ],
  }))

  const facetEntries = references.map((reference, index) => ({
    id: `${reference.id}.placeholder`,
    category: 'layout',
    source: { referenceId: reference.id, evidenceId: 'placeholder' },
    selection: {
      summary: 'Replace with the exact property or pattern you want.',
      properties: [
        { name: 'example', value: 'Replace with a concrete, measurable property.' },
      ],
    },
    adaptation: {
      intent: 'Explain how this facet should be adapted for the target project.',
      directives: ['Replace with implementation directives.'],
    },
    guardrails: {
      include: ['State what must survive implementation.'],
      exclude: ['State brands, assets, copy, or code that must not be copied.'],
    },
    implementation: {
      targets: [`target.${index + 1}`],
      hints: ['Map this facet to a logical implementation target.'],
    },
    verification: [
      {
        id: `${reference.id}.placeholder.check`,
        method: 'manual',
        subject: 'Replace with the element or surface to verify.',
        expectation: 'Replace with an observable expectation.',
      },
    ],
  }))

  return {
    $schema: 'https://soroe.dev/schema/recipe.v1.schema.json',
    schemaVersion: 'soroe.recipe/v1',
    project: {
      id,
      title,
      intent: `A design system compiled from ${references.length} reference(s).`,
      target: {
        kind: 'web-interface',
        root: '.',
        framework: 'static HTML, CSS, and JavaScript',
      },
    },
    references: referenceEntries,
    facets: facetEntries,
    composition: [
      {
        id: 'home',
        route: '/',
        purpose: 'Introduce the project and its primary surfaces.',
        facets: facetEntries.map((facet) => facet.id),
        decisions: [],
      },
    ],
    tokens: {
      'color-accent': '#000000',
      'color-canvas': '#ffffff',
      'color-ink': '#000000',
    },
    guardrails: [
      'All identity, copy, links, assets, and source code must belong to the target project.',
      'Do not copy source prose, brands, code, models, textures, or media.',
      'Keep core content and navigation usable without JavaScript.',
      'Respect prefers-reduced-motion and visible keyboard focus.',
    ],
  }
}

export function parseReferences(input) {
  if (!input) return []
  return input.split(',').map((entry) => {
    const separator = entry.indexOf(':')
    if (separator === -1) {
      throw new Error(`Invalid reference '${entry}'. Use id:url.`)
    }
    return { id: entry.slice(0, separator), url: entry.slice(separator + 1) }
  })
}
