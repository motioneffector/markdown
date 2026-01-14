# @motioneffector/markdown

A lightweight, standards-compliant markdown parser supporting CommonMark and GitHub Flavored Markdown (GFM), with built-in XSS protection and flexible HTML stripping utilities.

[![npm version](https://img.shields.io/npm/v/@motioneffector/markdown.svg)](https://www.npmjs.com/package/@motioneffector/markdown)
[![license](https://img.shields.io/npm/l/@motioneffector/markdown.svg)](https://github.com/motioneffector/markdown/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Installation

```bash
npm install @motioneffector/markdown
```

## Quick Start

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

// Convert markdown to HTML
const html = markdown('# Hello **world**!')
// => '<h1>Hello <strong>world</strong>!</h1>'

// Strip HTML to plain text
const plain = markdownStrip(html, 'plaintext')
// => 'Hello world!'
```

## Features

- **CommonMark + GFM compliant** - Supports tables, strikethrough, task lists, and autolinks
- **XSS protection built-in** - Automatically sanitizes dangerous HTML by default
- **Flexible HTML stripping** - Four presets plus custom configuration for converting HTML to text
- **Zero dependencies** - Minimal bundle size, no external runtime dependencies
- **Full TypeScript support** - Complete type definitions included
- **Tree-shakeable ESM build** - Import only what you need

## API Reference

### `markdown(source, options?)`

Converts markdown source text to HTML.

**Parameters:**
- `source` (string) - The markdown text to parse
- `options` (MarkdownOptions, optional) - Configuration options

**Options:**
- `gfm` (boolean, default: `true`) - Enable GitHub Flavored Markdown extensions
- `sanitize` (boolean, default: `true`) - Strip dangerous HTML (scripts, styles, event handlers)
- `breaks` (boolean, default: `false`) - Convert single line breaks to `<br>` tags
- `linkTarget` (string, optional) - Add target attribute to links (e.g., `'_blank'`)

**Returns:** `string` - The generated HTML

**Example:**

```typescript
import { markdown } from '@motioneffector/markdown'

// Basic usage
markdown('**bold** and *italic*')
// => '<p><strong>bold</strong> and <em>italic</em></p>'

// With options
markdown('[link](url)', { linkTarget: '_blank' })
// => '<p><a href="url" target="_blank">link</a></p>'

// GFM table
markdown(`
| Feature | Supported |
|---------|-----------|
| Tables  | Yes       |
| Tasks   | Yes       |
`)
// => '<table>...'

// Disable sanitization (use with caution)
markdown('<div onclick="alert()">text</div>', { sanitize: false })
// => '<div onclick="alert()">text</div>' (dangerous!)
```

### `markdownStrip(html, preset)`

Removes or filters HTML tags from markdown-generated HTML.

**Parameters:**
- `html` (string) - The HTML string to process
- `preset` (string | StripConfig) - Preset name or custom configuration

**Presets:**
- `'plaintext'` - Remove all HTML tags, keep text content only
- `'inline'` - Allow inline formatting only (strong, em, code, a, br)
- `'safe'` - Allow common safe elements (inline + lists, blockquotes, headings)
- `'prose'` - Allow most formatting but strip scripts and dangerous elements

**Returns:** `string` - The processed HTML/text

**Example:**

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown('# Heading\n\n**bold** and [link](url)')

// Plain text output
markdownStrip(html, 'plaintext')
// => 'Heading\nbold and link'

// Keep inline formatting only
markdownStrip(html, 'inline')
// => '<strong>bold</strong> and <a href="url">link</a>'

// Keep safe block elements
markdownStrip(html, 'safe')
// => '<h1>Heading</h1><strong>bold</strong> and <a href="url">link</a>'
```

### `markdownStrip(html, config)`

Custom configuration for selective tag stripping.

**Parameters:**
- `html` (string) - The HTML string to process
- `config` (StripConfig) - Custom configuration object

**StripConfig:**
- `allow` (string[], optional) - Allowlist of permitted tag names (cannot use with `strip`)
- `strip` (string[], optional) - Blocklist of tags to remove (cannot use with `allow`)
- `unwrap` (boolean, default: `true`) - Keep inner content when removing tags

**Example:**

```typescript
import { markdownStrip } from '@motioneffector/markdown'

const html = '<p>Text with <strong>bold</strong> and <em>italic</em></p>'

// Allow only specific tags
markdownStrip(html, { allow: ['strong'] })
// => 'Text with <strong>bold</strong> and italic'

// Strip specific tags
markdownStrip(html, { strip: ['em'] })
// => '<p>Text with <strong>bold</strong> and italic</p>'

// Remove tags and their content
markdownStrip(html, { strip: ['strong'], unwrap: false })
// => '<p>Text with  and <em>italic</em></p>'
```

## Error Handling

The library exports three error types for specific error conditions:

```typescript
import { MarkdownError, ValidationError, ParseError } from '@motioneffector/markdown'

try {
  // Invalid configuration
  markdownStrip(html, { allow: ['p'], strip: ['em'] })
} catch (e) {
  if (e instanceof ValidationError) {
    console.error('Configuration error:', e.message)
  }
}

try {
  // Parsing error (rare - most inputs handled gracefully)
  markdown(malformedInput)
} catch (e) {
  if (e instanceof ParseError) {
    console.error('Parse error:', e.message)
  }
}
```

## Demo

[Try the interactive demo](https://motioneffector.github.io/markdown/demo.html)

## Supported Markdown Features

### CommonMark

- Headings (ATX `#` and Setext)
- Paragraphs and line breaks
- Emphasis and strong emphasis (`*` and `_`)
- Code spans and fenced code blocks
- Links and images (inline and reference style)
- Blockquotes
- Lists (ordered and unordered, nested)
- Horizontal rules
- HTML blocks (with sanitization)
- Escaping with backslash

### GitHub Flavored Markdown (GFM)

- Tables with alignment
- Strikethrough (`~~text~~`)
- Task lists (`- [x]` and `- [ ]`)
- Autolinks (URLs and email addresses)
- Disallowed raw HTML (when sanitize enabled)

## Browser Support

Works in all modern browsers supporting ES2022+. For older environments, use a transpiler like Babel or SWC.

## License

MIT © [motioneffector](https://github.com/motioneffector)
