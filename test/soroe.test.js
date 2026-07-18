import assert from 'node:assert/strict'
import { readFile, writeFile, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import { canonicalJson } from '../src/canonical.js'
import { buildPack, checkOutputs, compileRecipe, designRecipe, writeOutputs } from '../src/compiler.js'
import { run } from '../src/cli.js'
import { DESIGN_OUTPUT_FILES, OUTPUT_FILES } from '../src/constants.js'
import { validateRecipe } from '../src/validate.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(root, relativePath), 'utf8'))
}

function reverseObjectKeys(value) {
  if (Array.isArray(value)) return value.map(reverseObjectKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .reverse()
        .map(([key, item]) => [key, reverseObjectKeys(item)]),
    )
  }
  return value
}

function streams() {
  let stdout = ''
  let stderr = ''
  return {
    stdout: { write: (value) => (stdout += value) },
    stderr: { write: (value) => (stderr += value) },
    read: () => ({ stdout, stderr }),
  }
}

test('valid fixture satisfies runtime invariants', async () => {
  const recipe = await readJson('fixtures/valid/minimal.recipe.json')
  assert.deepEqual(validateRecipe(recipe), {
    schemaVersion: 'soroe.diagnostics/v1',
    valid: true,
    errors: [],
  })
})

test('dangling reference has stable code and JSON path', async () => {
  const recipe = await readJson('fixtures/invalid/dangling-reference.recipe.json')
  const result = validateRecipe(recipe)
  assert.equal(result.valid, false)
  assert.ok(
    result.errors.some(
      (item) =>
        item.code === 'reference.unknown' &&
        item.path === '$.facets[0].source.referenceId',
    ),
  )
})

test('unknown fields are rejected instead of ignored', async () => {
  const recipe = await readJson('fixtures/valid/minimal.recipe.json')
  recipe.facets[0].selction = recipe.facets[0].selection
  const result = validateRecipe(recipe)
  assert.ok(result.errors.some((item) => item.code === 'field.unknown'))
})

test('screenshot checks require structured viewports', async () => {
  const recipe = await readJson('fixtures/valid/minimal.recipe.json')
  recipe.facets[0].verification[0].method = 'screenshot'
  const result = validateRecipe(recipe)
  assert.ok(
    result.errors.some(
      (item) =>
        item.code === 'verification.viewport_required' &&
        item.path === '$.facets[0].verification[0].viewport',
    ),
  )
})

test('CSS token delimiters are rejected before compilation', async () => {
  const recipe = await readJson('fixtures/valid/minimal.recipe.json')
  recipe.tokens['color-accent'] = '#fff; } body { display: none'
  const result = validateRecipe(recipe)
  assert.ok(result.errors.some((item) => item.code === 'token.unsafe_value'))
})

test('object key order does not change compiled bytes', async () => {
  const recipe = await readJson('examples/observatory.recipe.json')
  const original = compileRecipe(recipe)
  const reordered = compileRecipe(reverseObjectKeys(recipe))
  assert.deepEqual(original.outputs, reordered.outputs)
  assert.equal(original.pack.recipe.digest, reordered.pack.recipe.digest)
})

test('compiled graph has no dangling endpoints', async () => {
  const recipe = await readJson('examples/observatory.recipe.json')
  const { pack } = compileRecipe(recipe)
  const nodeIds = new Set(pack.graph.nodes.map((node) => node.id))
  for (const edge of pack.graph.edges) {
    assert.ok(nodeIds.has(edge.from), `missing graph source ${edge.from}`)
    assert.ok(nodeIds.has(edge.to), `missing graph target ${edge.to}`)
  }
})

test('compiled JSON is canonical and ends with one newline', async () => {
  const recipe = await readJson('fixtures/valid/minimal.recipe.json')
  const { pack, outputs } = compileRecipe(recipe)
  assert.equal(outputs['facet-pack.json'], canonicalJson(pack))
  assert.match(outputs['facet-pack.json'], /\n$/)
  assert.doesNotMatch(outputs['facet-pack.json'], /\n\n$/)
})

test('--check detects missing and modified compiler-owned outputs', async () => {
  const recipe = await readJson('examples/observatory.recipe.json')
  const { outputs } = compileRecipe(recipe)
  const directory = await mkdtemp(join(tmpdir(), 'soroe-test-'))

  let stale = await checkOutputs(directory, outputs)
  assert.deepEqual(
    stale.map((item) => item.file),
    OUTPUT_FILES,
  )

  await writeOutputs(directory, outputs)
  assert.deepEqual(await checkOutputs(directory, outputs), [])

  await writeFile(join(directory, 'tokens.css'), 'tampered\n', 'utf8')
  stale = await checkOutputs(directory, outputs)
  assert.deepEqual(stale, [{ file: 'tokens.css', reason: 'content differs' }])
})

test('CLI emits machine-readable validation diagnostics', async () => {
  const io = streams()
  const code = await run(
    ['validate', join(root, 'fixtures/invalid/dangling-reference.recipe.json'), '--format', 'json'],
    io,
  )
  const output = io.read()
  assert.equal(code, 1)
  assert.equal(output.stderr, '')
  assert.equal(JSON.parse(output.stdout).schemaVersion, 'soroe.diagnostics/v1')
})

test('shipped schemas declare the implemented versions', async () => {
  const recipeSchema = await readJson('schema/recipe.v1.schema.json')
  const packSchema = await readJson('schema/facet-pack.v1.schema.json')
  assert.equal(recipeSchema.properties.schemaVersion.const, 'soroe.recipe/v1')
  assert.equal(packSchema.properties.schemaVersion.const, 'soroe.pack/v1')
})

test('design phase emits only design artifacts', async () => {
  const recipe = await readJson('fixtures/valid/minimal.recipe.json')
  const { outputs } = designRecipe(recipe)
  assert.deepEqual(Object.keys(outputs).sort(), [...DESIGN_OUTPUT_FILES].sort())
  assert.ok(outputs['DESIGN_BRIEF.md'].includes('design brief'))
})

test('build phase emits implementation brief and verification plan', async () => {
  const recipe = await readJson('fixtures/valid/minimal.recipe.json')
  const { pack } = compileRecipe(recipe)
  const { outputs } = buildPack(pack)
  assert.ok(outputs['IMPLEMENTATION_BRIEF.md'].includes('implementation brief'))
  assert.ok(outputs['verification.plan.json'].includes('soroe.verification/v1'))
})

test('CLI design and build commands run end to end', async () => {
  const designDir = await mkdtemp(join(tmpdir(), 'soroe-design-'))
  const io = streams()
  const code = await run(['design', join(root, 'examples/observatory.recipe.json'), '--out', designDir], io)
  assert.equal(code, 0)
  const pack = JSON.parse(await readFile(join(designDir, 'facet-pack.json'), 'utf8'))
  assert.equal(pack.schemaVersion, 'soroe.pack/v1')

  const buildDir = await mkdtemp(join(tmpdir(), 'soroe-build-'))
  const io2 = streams()
  const code2 = await run(['build', join(designDir, 'facet-pack.json'), '--out', buildDir], io2)
  assert.equal(code2, 0)
  const plan = JSON.parse(await readFile(join(buildDir, 'verification.plan.json'), 'utf8'))
  assert.equal(plan.schemaVersion, 'soroe.verification/v1')
})
