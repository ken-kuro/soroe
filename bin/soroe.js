#!/usr/bin/env node

import { run } from '../src/cli.js'

try {
  process.exitCode = await run(process.argv.slice(2))
} catch (cause) {
  process.stderr.write(`Unexpected compiler failure: ${cause.stack ?? cause.message}\n`)
  process.exitCode = 2
}
