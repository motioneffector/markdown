# @motioneffector/markdown

A lightweight, standards-compliant markdown parser for rendering user content safely.

[![npm version](https://img.shields.io/npm/v/@motioneffector/markdown.svg)](https://www.npmjs.com/package/@motioneffector/markdown)
[![license](https://img.shields.io/npm/l/@motioneffector/markdown.svg)](https://github.com/motioneffector/markdown/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**[Try the interactive demo →](https://motioneffector.github.io/markdown/)**

## Features

- **CommonMark Compliant** - Full support for the CommonMark specification
- **GitHub Flavored Markdown** - Tables, strikethrough, task lists, and autolinks
- **XSS Protection** - Automatic sanitization of dangerous HTML elements
- **Flexible HTML Stripping** - Four presets for converting HTML to text
- **Zero Dependencies** - No supply chain risk or bloated bundles
- **Tree-Shakeable ESM** - Import only what you need

[Read the full manual →](https://motioneffector.github.io/markdown/manual/)

## Quick Start

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

// Convert markdown to HTML
const html = markdown('# Hello **world**!')
// => '<h1>Hello <strong>world</strong>!</h1>'

// Strip HTML to plain text
const plain = markdownStrip(html, 'plaintext')
// => 'Hello world!'

// GitHub Flavored Markdown table
const table = markdown(`
| Feature | Status |
|---------|--------|
| Tables  | ✓      |
`)
```

## Testing & Validation

- **Comprehensive test suite** - 255 unit tests covering core functionality
- **Fuzz tested** - Randomized input testing to catch edge cases
- **Strict TypeScript** - Full type coverage with no `any` types
- **Zero dependencies** - No supply chain risk

## License

MIT © [motioneffector](https://github.com/motioneffector)
