import { createHash } from 'node:crypto'

function compareById(left, right) {
  return left.id.localeCompare(right.id)
}

function sortStrings(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

function sortObject(value) {
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]),
  )
}

export function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize)
  }
  if (value && typeof value === 'object') {
    return sortObject(value)
  }
  return value
}

export function normalizeRecipe(recipe) {
  const normalized = structuredClone(recipe)

  normalized.references = normalized.references
    .map((reference) => ({
      ...reference,
      evidence: [...reference.evidence].sort(compareById),
    }))
    .sort(compareById)

  normalized.facets = normalized.facets
    .map((facet) => ({
      ...facet,
      selection: {
        ...facet.selection,
        properties: [...facet.selection.properties].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      },
      adaptation: {
        ...facet.adaptation,
        directives: sortStrings(facet.adaptation.directives),
      },
      guardrails: {
        include: sortStrings(facet.guardrails.include),
        exclude: sortStrings(facet.guardrails.exclude),
      },
      implementation: {
        targets: sortStrings(facet.implementation.targets),
        hints: sortStrings(facet.implementation.hints),
      },
      verification: [...facet.verification].sort(compareById),
    }))
    .sort(compareById)

  normalized.composition = normalized.composition
    .map((composition) => ({
      ...composition,
      facets: sortStrings(composition.facets),
      ...(composition.decisions
        ? {
            decisions: [...composition.decisions].sort((left, right) =>
              left.summary.localeCompare(right.summary),
            ),
          }
        : {}),
    }))
    .sort(compareById)

  normalized.guardrails = sortStrings(normalized.guardrails)
  normalized.tokens = normalized.tokens ?? {}

  return canonicalize(normalized)
}

export function canonicalJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`
}

export function digest(value) {
  const bytes = canonicalJson(value)
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`
}
