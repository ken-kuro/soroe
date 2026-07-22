# Changelog

All notable changes to Soroe will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-18

### Added

- Initial release of Soroe, a two-phase design compiler.
- `soroe design` — compile a recipe into a design system (Facet Pack, Reference Graph, Design Brief, tokens).
- `soroe build` — compile a Facet Pack into an implementation contract (Implementation Brief, Verification Plan).
- `soroe verify` — initialize a structured verification-results record for the Verify skill to resolve with available tools.
- `soroe validate` and legacy `soroe compile` aliases.
- JSON Schema and runtime validators for `soroe.recipe/v1` and `soroe.pack/v1`.
- Deterministic, byte-identical output with SHA-256 recipe digest.
- Example recipe, valid/invalid fixtures, and test suite.
- GitHub Actions CI.

## [Unreleased]

- Browser-based verifier for DOM, computed-style, interaction, and screenshot checks.
- Skill-scaffolded implementation targets.
- Asset extraction and manifest generation.
