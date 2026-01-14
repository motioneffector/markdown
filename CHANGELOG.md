# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-13

### Added
- Initial release
- CommonMark compliant markdown parser
- GitHub Flavored Markdown (GFM) support
  - Tables with alignment
  - Strikethrough
  - Task lists
  - Autolinks
- XSS protection with automatic HTML sanitization
- Flexible HTML stripping with four presets (plaintext, inline, safe, prose)
- Custom tag filtering with allowlist/blocklist configuration
- Full TypeScript support with complete type definitions
- Comprehensive test suite with 226+ tests
- Zero runtime dependencies
