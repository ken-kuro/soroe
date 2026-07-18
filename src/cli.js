import { readFile } from 'node:fs/promises'

import { canonicalJson } from './canonical.js'
import { checkOutputs, compileRecipe, writeOutputs } from './compiler.js'
import { OUTPUT_FILES } from './constants.js'
import { diagnostics, validateRecipe } from './validate.js'

const USAGE = `Usage:
  soroe design <recipe.json> --out <directory> [--check] [--format text|json]
  soroe build <facet-pack.json> --skill <skill-dir> --out <directory> [--format text|json]
  soroe verify <site-dir> --plan <verification.plan.json> [--format text|json]
  soroe validate <recipe.json> [--format text|json]
  soroe compile <recipe.json> --out <directory> [--check] [--format text|json]`

function parseArguments(argv) {
  const [command, ...rest] = argv
  if (!['validate', 'compile', 'design', 'build', 'verify'].includes(command)) {
    return { error: 'Expected `design`, `build`, `verify`, `validate`, or `compile`.' }
  }

  // Phase 2 commands are not yet implemented in the baseline build.
  if (command === 'build') {
    return {
      error:
        '`soroe build` is planned for Phase 2. Use `soroe design` to compile a Facet Pack from a recipe.',
    }
  }
  if (command === 'verify') {
    return {
      error:
        '`soroe verify` is planned for Phase 2. For now, run the checks in verification.plan.json manually or via the skill.',
    }
  }

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
  if (!['text', 'json'].includes(format)) return { error: "Format must be 'text' or 'json'." }
  if (command === 'compile' && !out) return { error: '`compile` requires `--out <directory>`.' }
  if (command === 'validate' && (out || check)) {
    return { error: '`--out` and `--check` are only valid with `compile`.' }
  }

  return { command, recipePath, out, format, check }
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

export async function run(argv, streams = process) {
  const options = parseArguments(argv)
  if (options.error) {
    streams.stderr.write(`${options.error}\n\n${USAGE}\n`)
    return 2
  }

  // `design` is the Phase 1 command; `compile` is the legacy alias.
  if (options.command === 'design') {
    options.command = 'compile'
  }

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

  if (options.command === 'validate') {
    if (options.format === 'json') {
      streams.stdout.write(canonicalJson(result))
    } else {
      streams.stdout.write(
        `Recipe is valid: ${loaded.recipe.references.length} reference(s), ${loaded.recipe.facets.length} facet(s), ${loaded.recipe.composition.length} composition(s).\n`,
      )
    }
    return 0
  }

  const compiled = compileRecipe(loaded.recipe)
  if (options.check) {
    const stale = await checkOutputs(options.out, compiled.outputs)
    const payload = {
      schemaVersion: 'soroe.check/v1',
      valid: stale.length === 0,
      digest: compiled.pack.recipe.digest,
      stale,
    }
    if (options.format === 'json') {
      streams.stdout.write(canonicalJson(payload))
    } else if (payload.valid) {
      streams.stdout.write(`Compiled output is current (${payload.digest}).\n`)
    } else {
      streams.stderr.write(
        `Compiled output is stale:\n${stale
          .map((item) => `- ${item.file}: ${item.reason}`)
          .join('\n')}\n`,
      )
    }
    return payload.valid ? 0 : 1
  }

  await writeOutputs(options.out, compiled.outputs)
  const payload = {
    schemaVersion: 'soroe.compile/v1',
    digest: compiled.pack.recipe.digest,
    files: [...OUTPUT_FILES],
  }
  if (options.format === 'json') {
    streams.stdout.write(canonicalJson(payload))
  } else {
    streams.stdout.write(
      `Compiled ${loaded.recipe.project.id} to '${options.out}' (${payload.digest}).\n`,
    )
  }
  return 0
}

export function usage() {
  return USAGE
}
