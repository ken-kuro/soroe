export const COMPILER_NAME = 'soroe'
export const COMPILER_VERSION = '0.1.0'
export const RECIPE_SCHEMA_VERSION = 'soroe.recipe/v1'
export const PACK_SCHEMA_VERSION = 'soroe.pack/v1'
export const DIAGNOSTICS_SCHEMA_VERSION = 'soroe.diagnostics/v1'
export const VERIFICATION_SCHEMA_VERSION = 'soroe.verification/v1'

export const OUTPUT_FILES = [
  'facet-pack.json',
  'REFERENCE_GRAPH.md',
  'IMPLEMENTATION_BRIEF.md',
  'verification.plan.json',
  'tokens.css',
]

export const CATEGORIES = new Set([
  'identity',
  'layout',
  'interaction',
  'typography',
  'color',
  'motion',
  'imagery',
  'content',
])

export const TARGET_KINDS = new Set([
  'web-interface',
  'native-interface',
  'design-system',
  'prototype',
])

export const VERIFICATION_METHODS = new Set([
  'dom',
  'computed-style',
  'interaction',
  'screenshot',
  'manual',
])

export const ID_PATTERN = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/
