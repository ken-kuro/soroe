import {
  CATEGORIES,
  DIAGNOSTICS_SCHEMA_VERSION,
  ID_PATTERN,
  RECIPE_SCHEMA_VERSION,
  TARGET_KINDS,
  VERIFICATION_METHODS,
} from './constants.js'

const ROOT_KEYS = new Set([
  '$schema',
  'schemaVersion',
  'project',
  'references',
  'facets',
  'composition',
  'tokens',
  'guardrails',
])

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function error(errors, code, path, message) {
  errors.push({ code, path, message })
}

function requiredString(errors, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    error(errors, 'type.non_empty_string', path, 'Expected a non-empty string.')
    return false
  }
  return true
}

function requiredId(errors, value, path) {
  if (!requiredString(errors, value, path)) return false
  if (!ID_PATTERN.test(value)) {
    error(
      errors,
      'id.invalid',
      path,
      'Expected a lowercase dot/hyphen ID such as `hero.identity`.',
    )
    return false
  }
  return true
}

function requiredObject(errors, value, path) {
  if (!isObject(value)) {
    error(errors, 'type.object', path, 'Expected an object.')
    return false
  }
  return true
}

function requiredArray(errors, value, path) {
  if (!Array.isArray(value) || value.length === 0) {
    error(errors, 'type.non_empty_array', path, 'Expected a non-empty array.')
    return false
  }
  return true
}

function requiredInteger(errors, value, path, minimum = Number.MIN_SAFE_INTEGER) {
  if (!Number.isInteger(value) || value < minimum) {
    error(errors, 'type.integer', path, `Expected an integer greater than or equal to ${minimum}.`)
    return false
  }
  return true
}

function unknownKeys(errors, value, allowed, path) {
  if (!isObject(value)) return
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      error(errors, 'field.unknown', `${path}.${key}`, `Unknown field '${key}'.`)
    }
  }
}

function stringSet(errors, value, path) {
  if (!requiredArray(errors, value, path)) return
  const seen = new Set()
  value.forEach((item, index) => {
    if (requiredString(errors, item, `${path}[${index}]`)) {
      if (seen.has(item)) {
        error(errors, 'value.duplicate', `${path}[${index}]`, `Duplicate value '${item}'.`)
      }
      seen.add(item)
    }
  })
}

function registerId(errors, registry, id, path, scope) {
  if (!requiredId(errors, id, path)) return
  if (registry.has(id)) {
    error(errors, 'id.duplicate', path, `Duplicate ${scope} ID '${id}'.`)
    return
  }
  registry.add(id)
}

function validateProject(errors, project) {
  const path = '$.project'
  if (!requiredObject(errors, project, path)) return
  unknownKeys(errors, project, new Set(['id', 'title', 'intent', 'target']), path)
  requiredId(errors, project.id, `${path}.id`)
  requiredString(errors, project.title, `${path}.title`)
  requiredString(errors, project.intent, `${path}.intent`)

  if (requiredObject(errors, project.target, `${path}.target`)) {
    unknownKeys(
      errors,
      project.target,
      new Set(['kind', 'root', 'framework']),
      `${path}.target`,
    )
    if (!TARGET_KINDS.has(project.target.kind)) {
      error(
        errors,
        'project.target_kind',
        `${path}.target.kind`,
        `Expected one of: ${[...TARGET_KINDS].join(', ')}.`,
      )
    }
    requiredString(errors, project.target.root, `${path}.target.root`)
    if (project.target.framework !== undefined) {
      requiredString(errors, project.target.framework, `${path}.target.framework`)
    }
  }
}

function validateReferences(errors, references, referenceIds, evidenceIds) {
  if (!requiredArray(errors, references, '$.references')) return

  references.forEach((reference, index) => {
    const path = `$.references[${index}]`
    if (!requiredObject(errors, reference, path)) return
    unknownKeys(errors, reference, new Set(['id', 'title', 'url', 'role', 'evidence']), path)
    registerId(errors, referenceIds, reference.id, `${path}.id`, 'reference')
    requiredString(errors, reference.title, `${path}.title`)
    requiredString(errors, reference.role, `${path}.role`)
    if (requiredString(errors, reference.url, `${path}.url`)) {
      try {
        const parsed = new URL(reference.url)
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported')
      } catch {
        error(errors, 'reference.url', `${path}.url`, 'Expected an absolute HTTP(S) URL.')
      }
    }

    const localEvidenceIds = new Set()
    if (requiredArray(errors, reference.evidence, `${path}.evidence`)) {
      reference.evidence.forEach((evidence, evidenceIndex) => {
        const evidencePath = `${path}.evidence[${evidenceIndex}]`
        if (!requiredObject(errors, evidence, evidencePath)) return
        unknownKeys(
          errors,
          evidence,
          new Set(['id', 'locator', 'observation']),
          evidencePath,
        )
        registerId(errors, localEvidenceIds, evidence.id, `${evidencePath}.id`, 'evidence')
        requiredString(errors, evidence.locator, `${evidencePath}.locator`)
        requiredString(errors, evidence.observation, `${evidencePath}.observation`)
      })
    }
    if (typeof reference.id === 'string') evidenceIds.set(reference.id, localEvidenceIds)
  })
}

function validateProperties(errors, properties, path) {
  if (!requiredArray(errors, properties, path)) return
  const names = new Set()
  properties.forEach((property, index) => {
    const propertyPath = `${path}[${index}]`
    if (!requiredObject(errors, property, propertyPath)) return
    unknownKeys(errors, property, new Set(['name', 'value']), propertyPath)
    registerId(errors, names, property.name, `${propertyPath}.name`, 'property')
    requiredString(errors, property.value, `${propertyPath}.value`)
  })
}

function validateVerification(errors, checks, path, verificationIds) {
  if (!requiredArray(errors, checks, path)) return
  checks.forEach((check, index) => {
    const checkPath = `${path}[${index}]`
    if (!requiredObject(errors, check, checkPath)) return
    unknownKeys(
      errors,
      check,
      new Set(['id', 'method', 'subject', 'expectation', 'viewport', 'preferences']),
      checkPath,
    )
    registerId(errors, verificationIds, check.id, `${checkPath}.id`, 'verification')
    if (!VERIFICATION_METHODS.has(check.method)) {
      error(
        errors,
        'verification.method',
        `${checkPath}.method`,
        `Expected one of: ${[...VERIFICATION_METHODS].join(', ')}.`,
      )
    }
    requiredString(errors, check.subject, `${checkPath}.subject`)
    requiredString(errors, check.expectation, `${checkPath}.expectation`)

    if (check.method === 'screenshot' && check.viewport === undefined) {
      error(
        errors,
        'verification.viewport_required',
        `${checkPath}.viewport`,
        'Screenshot checks require an explicit viewport.',
      )
    }

    if (check.viewport !== undefined && requiredObject(errors, check.viewport, `${checkPath}.viewport`)) {
      unknownKeys(errors, check.viewport, new Set(['width', 'height']), `${checkPath}.viewport`)
      requiredInteger(errors, check.viewport.width, `${checkPath}.viewport.width`, 240)
      requiredInteger(errors, check.viewport.height, `${checkPath}.viewport.height`, 240)
    }

    if (
      check.preferences !== undefined &&
      requiredObject(errors, check.preferences, `${checkPath}.preferences`)
    ) {
      unknownKeys(
        errors,
        check.preferences,
        new Set(['reducedMotion', 'colorScheme']),
        `${checkPath}.preferences`,
      )
      if (Object.keys(check.preferences).length === 0) {
        error(
          errors,
          'preferences.empty',
          `${checkPath}.preferences`,
          'Expected at least one preference.',
        )
      }
      if (
        check.preferences.reducedMotion !== undefined &&
        typeof check.preferences.reducedMotion !== 'boolean'
      ) {
        error(
          errors,
          'type.boolean',
          `${checkPath}.preferences.reducedMotion`,
          'Expected a boolean.',
        )
      }
      if (
        check.preferences.colorScheme !== undefined &&
        !['light', 'dark'].includes(check.preferences.colorScheme)
      ) {
        error(
          errors,
          'preferences.color_scheme',
          `${checkPath}.preferences.colorScheme`,
          "Expected 'light' or 'dark'.",
        )
      }
    }
  })
}

function validateFacets(
  errors,
  facets,
  facetIds,
  referenceIds,
  evidenceIds,
  verificationIds,
) {
  if (!requiredArray(errors, facets, '$.facets')) return

  facets.forEach((facet, index) => {
    const path = `$.facets[${index}]`
    if (!requiredObject(errors, facet, path)) return
    unknownKeys(
      errors,
      facet,
      new Set([
        'id',
        'category',
        'source',
        'selection',
        'adaptation',
        'guardrails',
        'implementation',
        'verification',
      ]),
      path,
    )
    registerId(errors, facetIds, facet.id, `${path}.id`, 'facet')
    if (!CATEGORIES.has(facet.category)) {
      error(
        errors,
        'facet.category',
        `${path}.category`,
        `Expected one of: ${[...CATEGORIES].join(', ')}.`,
      )
    }

    if (requiredObject(errors, facet.source, `${path}.source`)) {
      unknownKeys(
        errors,
        facet.source,
        new Set(['referenceId', 'evidenceId']),
        `${path}.source`,
      )
      requiredId(errors, facet.source.referenceId, `${path}.source.referenceId`)
      requiredId(errors, facet.source.evidenceId, `${path}.source.evidenceId`)
      if (
        typeof facet.source.referenceId === 'string' &&
        !referenceIds.has(facet.source.referenceId)
      ) {
        error(
          errors,
          'reference.unknown',
          `${path}.source.referenceId`,
          `Unknown reference '${facet.source.referenceId}'.`,
        )
      } else if (
        typeof facet.source.referenceId === 'string' &&
        typeof facet.source.evidenceId === 'string' &&
        !evidenceIds.get(facet.source.referenceId)?.has(facet.source.evidenceId)
      ) {
        error(
          errors,
          'evidence.unknown',
          `${path}.source.evidenceId`,
          `Unknown evidence '${facet.source.evidenceId}' on reference '${facet.source.referenceId}'.`,
        )
      }
    }

    if (requiredObject(errors, facet.selection, `${path}.selection`)) {
      unknownKeys(
        errors,
        facet.selection,
        new Set(['summary', 'properties']),
        `${path}.selection`,
      )
      requiredString(errors, facet.selection.summary, `${path}.selection.summary`)
      validateProperties(errors, facet.selection.properties, `${path}.selection.properties`)
    }

    if (requiredObject(errors, facet.adaptation, `${path}.adaptation`)) {
      unknownKeys(
        errors,
        facet.adaptation,
        new Set(['intent', 'directives']),
        `${path}.adaptation`,
      )
      requiredString(errors, facet.adaptation.intent, `${path}.adaptation.intent`)
      stringSet(errors, facet.adaptation.directives, `${path}.adaptation.directives`)
    }

    if (requiredObject(errors, facet.guardrails, `${path}.guardrails`)) {
      unknownKeys(
        errors,
        facet.guardrails,
        new Set(['include', 'exclude']),
        `${path}.guardrails`,
      )
      stringSet(errors, facet.guardrails.include, `${path}.guardrails.include`)
      stringSet(errors, facet.guardrails.exclude, `${path}.guardrails.exclude`)
    }

    if (requiredObject(errors, facet.implementation, `${path}.implementation`)) {
      unknownKeys(
        errors,
        facet.implementation,
        new Set(['targets', 'hints']),
        `${path}.implementation`,
      )
      if (requiredArray(errors, facet.implementation.targets, `${path}.implementation.targets`)) {
        const targetIds = new Set()
        facet.implementation.targets.forEach((target, targetIndex) => {
          registerId(
            errors,
            targetIds,
            target,
            `${path}.implementation.targets[${targetIndex}]`,
            'implementation target',
          )
        })
      }
      stringSet(errors, facet.implementation.hints, `${path}.implementation.hints`)
    }

    validateVerification(errors, facet.verification, `${path}.verification`, verificationIds)
  })
}

function validateComposition(errors, composition, facetIds, usedFacets) {
  if (!requiredArray(errors, composition, '$.composition')) return
  const compositionIds = new Set()

  composition.forEach((entry, index) => {
    const path = `$.composition[${index}]`
    if (!requiredObject(errors, entry, path)) return
    unknownKeys(errors, entry, new Set(['id', 'route', 'purpose', 'facets', 'decisions']), path)
    registerId(errors, compositionIds, entry.id, `${path}.id`, 'composition')
    requiredString(errors, entry.route, `${path}.route`)
    requiredString(errors, entry.purpose, `${path}.purpose`)
    if (requiredArray(errors, entry.facets, `${path}.facets`)) {
      const localFacets = new Set()
      entry.facets.forEach((facetId, facetIndex) => {
        const facetPath = `${path}.facets[${facetIndex}]`
        if (!requiredId(errors, facetId, facetPath)) return
        if (localFacets.has(facetId)) {
          error(errors, 'value.duplicate', facetPath, `Duplicate facet '${facetId}'.`)
        }
        localFacets.add(facetId)
        if (!facetIds.has(facetId)) {
          error(errors, 'facet.unknown', facetPath, `Unknown facet '${facetId}'.`)
        } else {
          usedFacets.add(facetId)
        }
      })
    }

    if (entry.decisions !== undefined) {
      if (!Array.isArray(entry.decisions)) {
        error(errors, 'type.array', `${path}.decisions`, 'Expected an array.')
      } else {
        entry.decisions.forEach((decision, decisionIndex) => {
          const decisionPath = `${path}.decisions[${decisionIndex}]`
          if (!requiredObject(errors, decision, decisionPath)) return
          unknownKeys(errors, decision, new Set(['summary', 'resolution']), decisionPath)
          requiredString(errors, decision.summary, `${decisionPath}.summary`)
          requiredString(errors, decision.resolution, `${decisionPath}.resolution`)
        })
      }
    }
  })
}

function validateTokens(errors, tokens) {
  if (tokens === undefined) return
  if (!requiredObject(errors, tokens, '$.tokens')) return
  for (const [name, value] of Object.entries(tokens)) {
    if (!/^[a-z][a-z0-9-]*$/.test(name)) {
      error(errors, 'token.name', `$.tokens.${name}`, `Invalid token name '${name}'.`)
    }
    if (requiredString(errors, value, `$.tokens.${name}`) && /[;{}\r\n]/.test(value)) {
      error(
        errors,
        'token.unsafe_value',
        `$.tokens.${name}`,
        'CSS token values cannot contain semicolons, braces, or line breaks.',
      )
    }
  }
}

export function validateRecipe(recipe) {
  const errors = []
  if (!requiredObject(errors, recipe, '$')) return diagnostics(errors)
  unknownKeys(errors, recipe, ROOT_KEYS, '$')

  if (recipe.schemaVersion !== RECIPE_SCHEMA_VERSION) {
    error(
      errors,
      'schema.unsupported',
      '$.schemaVersion',
      `Expected '${RECIPE_SCHEMA_VERSION}'.`,
    )
  }

  if (recipe.$schema !== undefined) requiredString(errors, recipe.$schema, '$.$schema')
  validateProject(errors, recipe.project)

  const referenceIds = new Set()
  const evidenceIds = new Map()
  const facetIds = new Set()
  const verificationIds = new Set()
  const usedFacets = new Set()

  validateReferences(errors, recipe.references, referenceIds, evidenceIds)
  validateFacets(
    errors,
    recipe.facets,
    facetIds,
    referenceIds,
    evidenceIds,
    verificationIds,
  )
  validateComposition(errors, recipe.composition, facetIds, usedFacets)
  validateTokens(errors, recipe.tokens)
  stringSet(errors, recipe.guardrails, '$.guardrails')

  for (const facetId of facetIds) {
    if (!usedFacets.has(facetId)) {
      const index = recipe.facets.findIndex((facet) => facet?.id === facetId)
      error(
        errors,
        'facet.unused',
        `$.facets[${index}].id`,
        `Facet '${facetId}' is not used by any composition.`,
      )
    }
  }

  return diagnostics(errors)
}

export function diagnostics(errors) {
  const sorted = [...errors].sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.code.localeCompare(right.code) ||
      left.message.localeCompare(right.message),
  )
  return {
    schemaVersion: DIAGNOSTICS_SCHEMA_VERSION,
    valid: sorted.length === 0,
    errors: sorted,
  }
}
