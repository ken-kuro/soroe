import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { canonicalJson, digest, normalizeRecipe } from './canonical.js'
import {
  COMPILER_NAME,
  COMPILER_VERSION,
  DESIGN_OUTPUT_FILES,
  BUILD_OUTPUT_FILES,
  OUTPUT_FILES,
  PACK_SCHEMA_VERSION,
  VERIFICATION_SCHEMA_VERSION,
} from './constants.js'

function compareNodes(left, right) {
  return left.id.localeCompare(right.id)
}

function compareEdges(left, right) {
  return (
    left.from.localeCompare(right.from) ||
    left.relation.localeCompare(right.relation) ||
    left.to.localeCompare(right.to)
  )
}

function markdown(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>')
}

function bulletLines(values) {
  return values.map((value) => `- ${value}`).join('\n')
}

function buildVerification(recipe) {
  const compositionsByFacet = new Map()
  for (const composition of recipe.composition) {
    for (const facetId of composition.facets) {
      const current = compositionsByFacet.get(facetId) ?? []
      current.push(composition.id)
      compositionsByFacet.set(facetId, current)
    }
  }

  const checks = recipe.facets.flatMap((facet) =>
    facet.verification.map((check) => ({
      ...check,
      facetId: facet.id,
      compositionIds: [...(compositionsByFacet.get(facet.id) ?? [])].sort(),
      implementationTargets: [...facet.implementation.targets],
      source: { ...facet.source },
    })),
  )

  checks.sort(compareNodes)
  return {
    schemaVersion: VERIFICATION_SCHEMA_VERSION,
    checks,
  }
}

function buildGraph(recipe, verification) {
  const nodes = []
  const edges = []
  const nodeIds = new Set()

  function node(id, kind, label, data = {}) {
    if (nodeIds.has(id)) return
    nodeIds.add(id)
    nodes.push({ id, kind, label, ...data })
  }

  function edge(from, relation, to) {
    edges.push({ from, relation, to })
  }

  const projectNode = `project:${recipe.project.id}`
  node(projectNode, 'project', recipe.project.title, { intent: recipe.project.intent })

  for (const reference of recipe.references) {
    const referenceNode = `reference:${reference.id}`
    node(referenceNode, 'reference', reference.title, { url: reference.url, role: reference.role })
    for (const evidence of reference.evidence) {
      const evidenceNode = `evidence:${reference.id}/${evidence.id}`
      node(evidenceNode, 'evidence', evidence.id, {
        locator: evidence.locator,
        observation: evidence.observation,
      })
      edge(referenceNode, 'contains', evidenceNode)
    }
  }

  for (const composition of recipe.composition) {
    const compositionNode = `composition:${composition.id}`
    node(compositionNode, 'composition', composition.purpose, { route: composition.route })
    edge(projectNode, 'contains', compositionNode)
  }

  for (const facet of recipe.facets) {
    const facetNode = `facet:${facet.id}`
    node(facetNode, 'facet', facet.selection.summary, { category: facet.category })
    edge(
      `evidence:${facet.source.referenceId}/${facet.source.evidenceId}`,
      'grounds',
      facetNode,
    )

    for (const target of facet.implementation.targets) {
      const targetNode = `implementation:${target}`
      node(targetNode, 'implementation', target)
      edge(facetNode, 'realized_at', targetNode)
    }
  }

  for (const composition of recipe.composition) {
    for (const facetId of composition.facets) {
      edge(`facet:${facetId}`, 'composed_in', `composition:${composition.id}`)
    }
  }

  for (const check of verification.checks) {
    const verificationNode = `verification:${check.id}`
    node(verificationNode, 'verification', check.expectation, {
      method: check.method,
      subject: check.subject,
      ...(check.viewport ? { viewport: check.viewport } : {}),
      ...(check.preferences ? { preferences: check.preferences } : {}),
    })
    edge(`facet:${check.facetId}`, 'verified_by', verificationNode)
    for (const compositionId of check.compositionIds) {
      edge(`composition:${compositionId}`, 'verified_by', verificationNode)
    }
  }

  nodes.sort(compareNodes)
  edges.sort(compareEdges)

  const dangling = edges.filter((item) => !nodeIds.has(item.from) || !nodeIds.has(item.to))
  if (dangling.length > 0) {
    throw new Error(`Compiler generated ${dangling.length} dangling graph edge(s).`)
  }

  return { nodes, edges }
}

function renderGraphMarkdown(pack) {
  const lines = [
    '# Reference Graph',
    '',
    `Recipe digest: \`${pack.recipe.digest}\``,
    '',
    '## Nodes',
    '',
    '| ID | Kind | Label |',
    '| --- | --- | --- |',
    ...pack.graph.nodes.map(
      (node) => `| \`${markdown(node.id)}\` | ${markdown(node.kind)} | ${markdown(node.label)} |`,
    ),
    '',
    '## Edges',
    '',
    '| From | Relation | To |',
    '| --- | --- | --- |',
    ...pack.graph.edges.map(
      (edge) =>
        `| \`${markdown(edge.from)}\` | ${markdown(edge.relation)} | \`${markdown(edge.to)}\` |`,
    ),
    '',
  ]
  return lines.join('\n')
}

function renderDesignBrief(pack) {
  const references = new Map(pack.references.map((reference) => [reference.id, reference]))
  const facets = new Map(pack.facets.map((facet) => [facet.id, facet]))
  const lines = [
    `# ${pack.recipe.project.title} — design brief`,
    '',
    pack.recipe.project.intent,
    '',
    `Recipe digest: \`${pack.recipe.digest}\``,
    '',
    '## Project guardrails',
    '',
    bulletLines(pack.guardrails),
    '',
    '## Composition',
    '',
  ]

  for (const composition of pack.composition) {
    lines.push(`### ${composition.route} — ${composition.purpose}`, '')
    for (const facetId of composition.facets) {
      const facet = facets.get(facetId)
      lines.push(`- \`${facetId}\` — ${facet.selection.summary}`)
    }
    if (composition.decisions?.length) {
      lines.push('', 'Decisions:', '')
      for (const decision of composition.decisions) {
        lines.push(`- **${decision.summary}:** ${decision.resolution}`)
      }
    }
    lines.push('')
  }

  lines.push('## Facet instructions', '')
  for (const facet of pack.facets) {
    const reference = references.get(facet.source.referenceId)
    const evidence = reference.evidence.find((item) => item.id === facet.source.evidenceId)
    lines.push(
      `### ${facet.id} — ${facet.selection.summary}`,
      '',
      `Source: [${reference.title}](${reference.url}) → \`${evidence.id}\` (${evidence.locator})`,
      '',
      `Observed: ${evidence.observation}`,
      '',
      `Adaptation intent: ${facet.adaptation.intent}`,
      '',
      'Selected properties:',
      '',
      ...facet.selection.properties.map(
        (property) => `- \`${property.name}\`: ${property.value}`,
      ),
      '',
      'Directives:',
      '',
      bulletLines(facet.adaptation.directives),
      '',
      'Must include:',
      '',
      bulletLines(facet.guardrails.include),
      '',
      'Must exclude:',
      '',
      bulletLines(facet.guardrails.exclude),
      '',
      `Implementation targets: ${facet.implementation.targets.map((target) => `\`${target}\``).join(', ')}`,
      '',
      'Implementation hints:',
      '',
      bulletLines(facet.implementation.hints),
      '',
      'Verification:',
      '',
      ...facet.verification.map(
        (check) => {
          const viewport = check.viewport
            ? ` [${check.viewport.width}×${check.viewport.height}]`
            : ''
          const preferences = check.preferences
            ? ` [${Object.entries(check.preferences)
                .map(([key, value]) => `${key}=${value}`)
                .join(', ')}]`
            : ''
          return `- \`${check.id}\` [${check.method}]${viewport}${preferences} ${check.subject} — ${check.expectation}`
        },
      ),
      '',
    )
  }

  return `${lines.join('\n').trimEnd()}\n`
}

function renderImplementationBrief(pack) {
  const lines = [
    `# ${pack.recipe.project.title} — implementation brief`,
    '',
    pack.recipe.project.intent,
    '',
    `Recipe digest: \`${pack.recipe.digest}\``,
    '',
    '## Implementation targets',
    '',
  ]

  const targets = new Set()
  for (const facet of pack.facets) {
    for (const target of facet.implementation.targets) {
      targets.add(target)
    }
  }
  for (const target of [...targets].sort()) {
    lines.push(`- \`${target}\``)
  }

  lines.push('', '## Verification plan', '')
  for (const check of pack.verification.checks) {
    lines.push(`- \`${check.id}\` [${check.method}] ${check.subject} — ${check.expectation}`)
  }

  lines.push('', '## Guardrails', '', ...pack.guardrails.map((rule) => `- ${rule}`), '')

  return `${lines.join('\n').trimEnd()}\n`
}

function renderTokens(tokens) {
  const entries = Object.entries(tokens)
  if (entries.length === 0) return '/* Soroe recipe declares no CSS tokens. */\n'
  return `:root {\n${entries.map(([name, value]) => `  --${name}: ${value};`).join('\n')}\n}\n`
}

export function compileRecipe(recipe) {
  const normalized = normalizeRecipe(recipe)
  const recipeDigest = digest(normalized)
  const verification = buildVerification(normalized)
  const graph = buildGraph(normalized, verification)
  const pack = {
    schemaVersion: PACK_SCHEMA_VERSION,
    compiler: {
      name: COMPILER_NAME,
      version: COMPILER_VERSION,
    },
    recipe: {
      schemaVersion: normalized.schemaVersion,
      digest: recipeDigest,
      project: normalized.project,
    },
    references: normalized.references,
    facets: normalized.facets,
    composition: normalized.composition,
    tokens: normalized.tokens,
    guardrails: normalized.guardrails,
    graph,
    verification,
  }

  const outputs = {
    'facet-pack.json': canonicalJson(pack),
    'REFERENCE_GRAPH.md': renderGraphMarkdown(pack),
    'DESIGN_BRIEF.md': renderDesignBrief(pack),
    'IMPLEMENTATION_BRIEF.md': renderImplementationBrief(pack),
    'verification.plan.json': canonicalJson(verification),
    'tokens.css': renderTokens(normalized.tokens),
  }

  return { pack, outputs }
}

export function designRecipe(recipe) {
  const { pack, outputs } = compileRecipe(recipe)
  const designOutputs = {}
  for (const filename of DESIGN_OUTPUT_FILES) {
    designOutputs[filename] = outputs[filename]
  }
  return { pack, outputs: designOutputs }
}

export function buildPack(pack) {
  const outputs = {
    'IMPLEMENTATION_BRIEF.md': renderImplementationBrief(pack),
    'verification.plan.json': canonicalJson(pack.verification ?? { schemaVersion: VERIFICATION_SCHEMA_VERSION, checks: [] }),
  }
  return { pack, outputs }
}

export async function writeOutputs(directory, outputs, fileList = OUTPUT_FILES) {
  await mkdir(directory, { recursive: true })
  await Promise.all(
    fileList.map((filename) => writeFile(join(directory, filename), outputs[filename], 'utf8')),
  )
}

export async function checkOutputs(directory, outputs, fileList = OUTPUT_FILES) {
  const stale = []
  for (const filename of fileList) {
    try {
      const actual = await readFile(join(directory, filename), 'utf8')
      if (actual !== outputs[filename]) stale.push({ file: filename, reason: 'content differs' })
    } catch (cause) {
      if (cause?.code === 'ENOENT') {
        stale.push({ file: filename, reason: 'missing' })
      } else {
        throw cause
      }
    }
  }
  return stale
}
