import { readFile, writeFile } from 'node:fs/promises'

import { canonicalJson } from './canonical.js'
import {
  buildPack,
  checkOutputs,
  compileRecipe,
  designRecipe,
  writeOutputs,
} from './compiler.js'
import { BUILD_OUTPUT_FILES, DESIGN_OUTPUT_FILES, OUTPUT_FILES } from './constants.js'
import { diagnostics, validateRecipe } from './validate.js'

const USAGE = `Usage:
  soroe init --id <project-id> --title <title> --references <id:url,...> --out <recipe.json>
  soroe design <recipe.json> --out <directory> [--check] [--format text|json]
  soroe build <facet-pack.json> --out <directory> [--format text|json]
  soroe verify <site-dir> --plan <verification.plan.json> [--format text|json]
  soroe validate <recipe.json> [--format text|json]
  soroe compile <recipe.json> --out <directory> [--check] [--format text|json]
  soroe help`

const HELP = `Soroe — design by reference, build with traceability.

Commands:
  init     scaffold a starter recipe from references
  design   compile a recipe into a design system
  build    compile a Facet Pack into an implementation contract
  verify   verify a built site against a verification plan
  validate validate a recipe against the schema
  compile  legacy alias that emits both design and build artifacts
  help     show this help message

Quick start:
  soroe init --id my-site --title "My Site" \\
    --references a:https://a.com,b:https://b.com \\
    --out ./recipe.json
  soroe design ./recipe.json --out ./design
  soroe build ./design/facet-pack.json --out ./build
`

function parseInitArguments(rest) {
  let id
  let title
  const references = []
  let out
  let format = 'text'

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index]
    if (value === '--id') {
      id = rest[index + 1]
      index += 1
    } else if (value === '--title') {
      title = rest[index + 1]
      index += 1
    } else if (value === '--references') {
      const raw = rest[index + 1]
      index += 1
      for (const entry of raw.split(',')) {
        const separator = entry.indexOf(':')
        if (separator === -1) return { error: `Invalid reference '${entry}'. Use id:url.` }
        references.push({ id: entry.slice(0, separator), url: entry.slice(separator + 1) })
      }
    } else if (value === '--out') {
      out = rest[index + 1]
      index += 1
    } else if (value === '--format') {
      format = rest[index + 1]
      index += 1
    } else if (value.startsWith('-')) {
      return { error: `Unknown option '${value}'.` }
    }
  }

  if (!id) return { error: '`init` requires `--id <project-id>`.' }
  if (!title) return { error: '`init` requires `--title <title>`.' }
  if (references.length === 0) return { error: '`init` requires `--references id:url,id:url`.' }
  if (!out) return { error: '`init` requires `--out <recipe.json>`.' }
  if (!['text', 'json'].includes(format)) return { error: "Format must be 'text' or 'json'." }

  return { id, title, references, out, format }
}

function generateRecipe({ id, title, references }) {
  const referenceEntries = references.map((reference, index) => ({
    id: reference.id,
    title: `Reference ${index + 1}`,
    url: reference.url,
    role: 'Observed reference',
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
      properties: [{ name: 'example', value: 'Replace with a concrete, measurable property.' }],
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

  const compositionFacets = facetEntries.map((facet) => facet.id)

  return {
    $schema: 'https://soroe.dev/schema/recipe.v1.schema.json',
    schemaVersion: 'soroe.recipe/v1',
    project: {
      id,
      title,
      intent: `A design system compiled from ${references.length} reference(s).`,
      target: { kind: 'web-interface', root: '.', framework: 'static HTML, CSS, and JavaScript' },
    },
    references: referenceEntries,
    facets: facetEntries,
    composition: [
      {
        id: 'home',
        route: '/',
        purpose: 'Introduce the project and its primary surfaces.',
        facets: compositionFacets,
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

function parseDesignArguments(rest) {
  let recipePath
  let out
  let format = 'text'
  let check = false

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index]
    if (value === '--out') {
      out = rest[index + 1]
      index += 1
    } else if (value === '--format') {
      format = rest[index + 1]
      index += 1
    } else if (value === '--check') {
      check = true
    } else if (value.startsWith('-')) {
      return { error: `Unknown option '${value}'.` }
    } else if (!recipePath) {
      recipePath = value
    } else {
      return { error: `Unexpected argument '${value}'.` }
    }
  }

  if (!recipePath) return { error: 'Recipe path is required.' }
  if (!out) return { error: '`design` requires `--out <directory>`.' }
  if (!['text', 'json'].includes(format)) return { error: "Format must be 'text' or 'json'." }

  return { recipePath, out, format, check }
}

function parseBuildArguments(rest) {
  let packPath
  let out
  let skill
  let format = 'text'

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index]
    if (value === '--out') {
      out = rest[index + 1]
      index += 1
    } else if (value === '--skill') {
      skill = rest[index + 1]
      index += 1
    } else if (value === '--format') {
      format = rest[index + 1]
      index += 1
    } else if (value.startsWith('-')) {
      return { error: `Unknown option '${value}'.` }
    } else if (!packPath) {
      packPath = value
    } else {
      return { error: `Unexpected argument '${value}'.` }
    }
  }

  if (!packPath) return { error: 'Facet Pack path is required.' }
  if (!out) return { error: '`build` requires `--out <directory>`.' }
  if (!['text', 'json'].includes(format)) return { error: "Format must be 'text' or 'json'." }

  return { packPath, out, skill, format }
}

function parseVerifyArguments(rest) {
  let siteDir
  let plan
  let format = 'text'

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index]
    if (value === '--plan') {
      plan = rest[index + 1]
      index += 1
    } else if (value === '--format') {
      format = rest[index + 1]
      index += 1
    } else if (value.startsWith('-')) {
      return { error: `Unknown option '${value}'.` }
    } else if (!siteDir) {
      siteDir = value
    } else {
      return { error: `Unexpected argument '${value}'.` }
    }
  }

  if (!siteDir) return { error: 'Site directory is required.' }
  if (!plan) return { error: '`verify` requires `--plan <verification.plan.json>`.' }
  if (!['text', 'json'].includes(format)) return { error: "Format must be 'text' or 'json'." }

  return { siteDir, plan, format }
}

function printDiagnostics(result, format, streams) {
  if (format === 'json') {
    streams.stdout.write(canonicalJson(result))
    return
  }
  if (result.valid) {
    streams.stdout.write('Recipe is valid.\n')
    return
  }
  streams.stderr.write(
    `${result.errors.map((item) => `${item.path} [${item.code}] ${item.message}`).join('\n')}\n`,
  )
}

async function loadJson(path) {
  const source = await readFile(path, 'utf8')
  return JSON.parse(source)
}

async function loadRecipe(path) {
  try {
    const source = await readFile(path, 'utf8')
    try {
      return { recipe: JSON.parse(source) }
    } catch (cause) {
      return {
        result: diagnostics([
          {
            code: 'parse.invalid_json',
            path: '$',
            message: `Invalid JSON: ${cause.message}`,
          },
        ]),
      }
    }
  } catch (cause) {
    return {
      result: diagnostics([
        {
          code: 'input.unreadable',
          path: '$',
          message: `Could not read '${path}': ${cause.message}`,
        },
      ]),
    }
  }
}

async function runDesign(options, streams) {
  const loaded = await loadRecipe(options.recipePath)
  if (loaded.result) {
    printDiagnostics(loaded.result, options.format, streams)
    return 1
  }

  const result = validateRecipe(loaded.recipe)
  if (!result.valid) {
    printDiagnostics(result, options.format, streams)
    return 1
  }

  const compiled = designRecipe(loaded.recipe)

  if (options.check) {
    const stale = await checkOutputs(options.out, compiled.outputs, DESIGN_OUTPUT_FILES)
    const payload = {
      schemaVersion: 'soroe.check/v1',
      valid: stale.length === 0,
      digest: compiled.pack.recipe.digest,
      stale,
    }
    if (options.format === 'json') {
      streams.stdout.write(canonicalJson(payload))
    } else if (payload.valid) {
      streams.stdout.write(`Design output is current (${payload.digest}).\n`)
    } else {
      streams.stderr.write(
        `Design output is stale:\n${stale
          .map((item) => `- ${item.file}: ${item.reason}`)
          .join('\n')}\n`,
      )
    }
    return payload.valid ? 0 : 1
  }

  await writeOutputs(options.out, compiled.outputs, DESIGN_OUTPUT_FILES)
  const payload = {
    schemaVersion: 'soroe.compile/v1',
    digest: compiled.pack.recipe.digest,
    files: [...DESIGN_OUTPUT_FILES],
  }
  if (options.format === 'json') {
    streams.stdout.write(canonicalJson(payload))
  } else {
    streams.stdout.write(
      `Designed ${compiled.pack.recipe.project.id} -> '${options.out}' (${payload.digest}).\n`,
    )
  }
  return 0
}

async function runBuild(options, streams) {
  let pack
  try {
    pack = await loadJson(options.packPath)
  } catch (cause) {
    streams.stderr.write(`Could not load Facet Pack: ${cause.message}\n\n${USAGE}\n`)
    return 2
  }

  const compiled = buildPack(pack)
  await writeOutputs(options.out, compiled.outputs, BUILD_OUTPUT_FILES)

  const payload = {
    schemaVersion: 'soroe.build/v1',
    projectId: pack.recipe.project.id,
    files: [...BUILD_OUTPUT_FILES],
  }
  if (options.format === 'json') {
    streams.stdout.write(canonicalJson(payload))
  } else {
    streams.stdout.write(
      `Built ${pack.recipe.project.id} -> '${options.out}'.\n`,
    )
  }
  return 0
}

async function runVerify(options, streams) {
  let plan
  try {
    plan = await loadJson(options.plan)
  } catch (cause) {
    streams.stderr.write(`Could not load verification plan: ${cause.message}\n\n${USAGE}\n`)
    return 2
  }

  // Baseline verify command runs static checks from the plan and reports
  // which checks require a browser or manual review. A full headless runner
  // can be plugged in later without changing the CLI contract.
  const results = []
  for (const check of plan.checks ?? []) {
    if (['dom', 'computed-style', 'interaction', 'screenshot'].includes(check.method)) {
      results.push({ id: check.id, status: 'pending', reason: 'requires browser runner' })
    } else if (check.method === 'manual') {
      results.push({ id: check.id, status: 'pending', reason: 'requires manual review' })
    } else {
      results.push({ id: check.id, status: 'unknown', reason: 'unknown method' })
    }
  }

  const passed = results.filter((item) => item.status === 'passed').length
  const pending = results.filter((item) => item.status === 'pending').length
  const failed = results.filter((item) => item.status === 'failed').length

  const payload = {
    schemaVersion: 'soroe.verify/v1',
    siteDir: options.siteDir,
    plan: options.plan,
    summary: { passed, pending, failed, total: results.length },
    results,
  }

  if (options.format === 'json') {
    streams.stdout.write(canonicalJson(payload))
  } else {
    streams.stdout.write(
      `Verification: ${passed} passed, ${pending} pending, ${failed} failed (${results.length} total).\n`,
    )
    streams.stdout.write('Run a browser-based verifier to resolve pending checks.\n')
  }

  return 0
}

async function runInit(options, streams) {
  const recipe = generateRecipe(options)
  const text = canonicalJson(recipe)
  await writeFile(options.out, text, 'utf8')
  if (options.format === 'json') {
    streams.stdout.write(canonicalJson({ schemaVersion: 'soroe.init/v1', out: options.out }))
  } else {
    streams.stdout.write(`Initialized recipe at '${options.out}'. Replace the placeholder evidence and facets before compiling.\n`)
  }
  return 0
}

export async function run(argv, streams = process) {
  const [command, ...rest] = argv

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    streams.stdout.write(HELP)
    return 0
  }

  if (command === 'init') {
    const options = parseInitArguments(rest)
    if (options.error) {
      streams.stderr.write(`${options.error}\n\n${USAGE}\n`)
      return 2
    }
    return runInit(options, streams)
  }

  if (command === 'design' || command === 'compile') {
    const options = parseDesignArguments(rest)
    if (options.error) {
      streams.stderr.write(`${options.error}\n\n${USAGE}\n`)
      return 2
    }
    return runDesign(options, streams)
  }

  if (command === 'build') {
    const options = parseBuildArguments(rest)
    if (options.error) {
      streams.stderr.write(`${options.error}\n\n${USAGE}\n`)
      return 2
    }
    return runBuild(options, streams)
  }

  if (command === 'verify') {
    const options = parseVerifyArguments(rest)
    if (options.error) {
      streams.stderr.write(`${options.error}\n\n${USAGE}\n`)
      return 2
    }
    return runVerify(options, streams)
  }

  if (command === 'validate') {
    let format = 'text'
    let recipePath

    for (let index = 0; index < rest.length; index += 1) {
      const value = rest[index]
      if (value === '--format') {
        format = rest[index + 1]
        index += 1
      } else if (value.startsWith('-')) {
        return { error: `Unknown option '${value}'.` }
      } else if (!recipePath) {
        recipePath = value
      } else {
        return { error: `Unexpected argument '${value}'.` }
      }
    }

    if (!recipePath) {
      streams.stderr.write(`Recipe path is required.\n\n${USAGE}\n`)
      return 2
    }

    const loaded = await loadRecipe(recipePath)
    if (loaded.result) {
      printDiagnostics(loaded.result, format, streams)
      return 1
    }

    const result = validateRecipe(loaded.recipe)
    if (!result.valid) {
      printDiagnostics(result, format, streams)
      return 1
    }

    if (format === 'json') {
      streams.stdout.write(canonicalJson(result))
    } else {
      streams.stdout.write(
        `Recipe is valid: ${loaded.recipe.references.length} reference(s), ${loaded.recipe.facets.length} facet(s), ${loaded.recipe.composition.length} composition(s).\n`,
      )
    }
    return 0
  }

  streams.stderr.write(`Unknown command '${command}'.\n\n${USAGE}\n`)
  return 2
}

export function usage() {
  return USAGE
}
