import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile, mkdtemp } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import { canonicalJson } from '../src/canonical.js'
import { buildPack, checkOutputs, compileRecipe, designRecipe, writeOutputs } from '../src/compiler.js'
import { run } from '../src/cli.js'
import { BUILD_OUTPUT_FILES, DESIGN_OUTPUT_FILES, OUTPUT_FILES } from '../src/constants.js'
import { validateRecipe } from '../src/validate.js'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const tmpRoot = join(root, 'test', 'tmp')
await mkdir(tmpRoot, { recursive: true })

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
  const directory = await mkdtemp(join(tmpRoot, 'soroe-test-'))

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

test('CLI init scaffolds a valid recipe from references', async () => {
  const out = join(tmpRoot, 'soroe-init-recipe.json')
  const io = streams()
  const code = await run(
    ['init', '--id', 'my-site', '--title', 'My Site', '--references', 'a:https://a.com,b:https://b.com', '--out', out],
    io,
  )
  assert.equal(code, 0)
  const recipe = JSON.parse(await readFile(out, 'utf8'))
  assert.equal(recipe.schemaVersion, 'soroe.recipe/v1')
  assert.equal(recipe.references.length, 2)
  assert.equal(recipe.facets.length, 2)
  const validation = validateRecipe(recipe)
  assert.equal(validation.valid, true)
})

test('CLI help prints usage and quick start', async () => {
  const io = streams()
  const code = await run(['help'], io)
  const output = io.read()
  assert.equal(code, 0)
  assert.match(output.stdout, /Soroe/)
  assert.match(output.stdout, /Commands:/)
})

test('CLI design and build commands run end to end', async () => {
  const designDir = await mkdtemp(join(tmpRoot, 'soroe-design-'))
  const io = streams()
  const code = await run(['design', join(root, 'examples/observatory.recipe.json'), '--out', designDir], io)
  assert.equal(code, 0)
  const pack = JSON.parse(await readFile(join(designDir, 'facet-pack.json'), 'utf8'))
  assert.equal(pack.schemaVersion, 'soroe.pack/v1')

  const buildDir = await mkdtemp(join(tmpRoot, 'soroe-build-'))
  const io2 = streams()
  const code2 = await run(['build', join(designDir, 'facet-pack.json'), '--out', buildDir], io2)
  assert.equal(code2, 0)
  const plan = JSON.parse(await readFile(join(buildDir, 'verification.plan.json'), 'utf8'))
  assert.equal(plan.schemaVersion, 'soroe.verification/v1')
})

test('build phase emits target-map.json with logical targets', async () => {
  const recipe = await readJson('fixtures/valid/minimal.recipe.json')
  const { pack } = compileRecipe(recipe)
  const { outputs } = buildPack(pack)
  assert.ok(outputs['target-map.json'], 'target-map.json must be emitted')
  const targetMap = JSON.parse(outputs['target-map.json'])
  assert.equal(targetMap.schemaVersion, 'soroe.target-map/v1')
  assert.ok(Array.isArray(targetMap.targets))
  assert.ok(targetMap.targets.length > 0)
  for (const target of targetMap.targets) {
    assert.ok(target.id, 'target must have an id')
    assert.ok(Array.isArray(target.facets), 'target must have facets array')
    assert.ok(target.facets.length > 0, 'target must reference at least one facet')
    assert.equal(target.mapping, null, 'mapping starts null for the agent to fill in')
  }
})

test('build output files include target-map.json', async () => {
  assert.ok(BUILD_OUTPUT_FILES.includes('target-map.json'))
})

test('CLI build with missing pack path exits 2', async () => {
  const io = streams()
  const code = await run(['build', '/nonexistent/facet-pack.json', '--out', '/tmp/soroe-test-out'], io)
  assert.equal(code, 2)
  const output = io.read()
  assert.match(output.stderr, /Could not load Facet Pack/)
})

test('CLI verify with missing plan path exits 2', async () => {
  const io = streams()
  const code = await run(['verify', '/tmp/some-site', '--plan', '/nonexistent/verification.plan.json'], io)
  assert.equal(code, 2)
  const output = io.read()
  assert.match(output.stderr, /Could not load verification plan/)
})

test('CLI design with missing recipe path exits 1', async () => {
  const io = streams()
  const code = await run(['design', '/nonexistent/recipe.json', '--out', '/tmp/soroe-test-out'], io)
  assert.equal(code, 1)
  const output = io.read()
  assert.match(output.stderr, /input\.unreadable/)
})

test('CLI build rejects --skill as unknown option', async () => {
  const io = streams()
  const code = await run(['build', 'pack.json', '--out', '/tmp/out', '--skill', 'react'], io)
  assert.equal(code, 2)
  const output = io.read()
  assert.match(output.stderr, /Unknown option '--skill'/)
})

test('verify uses blocked status, not pending', async () => {
  const recipe = await readJson('fixtures/valid/minimal.recipe.json')
  const { pack } = compileRecipe(recipe)
  const { outputs } = buildPack(pack)
  const planPath = join(tmpRoot, 'verify-plan.json')
  await writeFile(planPath, outputs['verification.plan.json'], 'utf8')

  const io = streams()
  const code = await run(['verify', tmpRoot, '--plan', planPath, '--format', 'json'], io)
  assert.equal(code, 0)
  const payload = JSON.parse(io.read().stdout)
  assert.equal(payload.schemaVersion, 'soroe.results/v1')
  assert.ok(payload.summary.blocked >= 0)
  assert.equal(payload.summary.pending, undefined, 'pending must not appear in summary')
  for (const result of payload.results) {
    assert.ok(
      ['passed', 'failed', 'blocked', 'manual'].includes(result.status),
      `status must be passed/failed/blocked/manual, got '${result.status}'`,
    )
  }
})

test('verify --out writes results file', async () => {
  const recipe = await readJson('fixtures/valid/minimal.recipe.json')
  const { pack } = compileRecipe(recipe)
  const { outputs } = buildPack(pack)
  const planPath = join(tmpRoot, 'verify-plan-out.json')
  const resultsPath = join(tmpRoot, 'verify-results.json')
  await writeFile(planPath, outputs['verification.plan.json'], 'utf8')

  const io = streams()
  const code = await run(['verify', tmpRoot, '--plan', planPath, '--out', resultsPath], io)
  assert.equal(code, 0)
  const written = JSON.parse(await readFile(resultsPath, 'utf8'))
  assert.equal(written.schemaVersion, 'soroe.results/v1')
  assert.ok(Array.isArray(written.results))
})
