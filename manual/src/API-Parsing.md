# Parsing API

Functions and types for converting markdown to HTML.

---

## `markdown()`

Convert markdown text to safe HTML.

**Signature:**

```typescript
function markdown(
  input: string,
  options?: MarkdownOptions
): string
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `string` | Yes | Markdown text to convert |
| `options` | `MarkdownOptions` | No | Parsing options. Default: all safety features enabled |

**Returns:** `string` — HTML output with all markdown converted and dangerous content removed.

**Example:**

```typescript
import { markdown } from '@motioneffector/markdown'

// Basic usage
const html = markdown('# Hello **world**')
// => '<h1>Hello <strong>world</strong></h1>'

// With options
const html = markdown('[Link](url)', {
  linkTarget: '_blank',
  gfm: true,
  sanitize: true,
  breaks: false
})
```

---

## Types

### `MarkdownOptions`

Configuration options for the `markdown()` function.

```typescript
interface MarkdownOptions {
  gfm?: boolean
  sanitize?: boolean
  breaks?: boolean
  linkTarget?: string
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `gfm` | `boolean` | No | Enable GitHub Flavored Markdown (tables, strikethrough, task lists, autolinks). Default: `true` |
| `sanitize` | `boolean` | No | Sanitize dangerous HTML content (scripts, event handlers, dangerous URLs). Default: `true` |
| `breaks` | `boolean` | No | Convert single line breaks to `<br>` tags. Default: `false` |
| `linkTarget` | `string` | No | Add `target` attribute to links. Example: `'_blank'`. Default: none |

---

## Option Details

### `gfm`

Enables GitHub Flavored Markdown extensions.

```typescript
import { markdown } from '@motioneffector/markdown'

// Enabled (default)
markdown('| A | B |\n|---|---|\n| 1 | 2 |')
// => '<table>...</table>'

// Disabled
markdown('| A | B |\n|---|---|\n| 1 | 2 |', { gfm: false })
// => '<p>| A | B |...</p>'
```

GFM features:
- Tables with alignment
- Strikethrough (`~~text~~`)
- Task lists (`- [x] done`)
- Extended autolinks (bare URLs)

### `sanitize`

Controls URL sanitization. Dangerous tags are always removed regardless of this setting.

```typescript
import { markdown } from '@motioneffector/markdown'

// Enabled (default)
markdown('[Click](javascript:alert(1))')
// => '<p>Click</p>' (dangerous URL removed)

// Disabled (for trusted content only)
markdown('<div class="custom">text</div>', { sanitize: false })
// => '<p><div class="custom">text</div></p>'
```

Even with `sanitize: false`:
- `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>` are always removed
- Event handlers (`onclick`, etc.) are always removed

### `breaks`

Controls how single line breaks are handled.

```typescript
import { markdown } from '@motioneffector/markdown'

// Disabled (default) - CommonMark behavior
markdown('Line 1\nLine 2')
// => '<p>Line 1\nLine 2</p>' (soft break)

// Enabled - every newline becomes <br>
markdown('Line 1\nLine 2', { breaks: true })
// => '<p>Line 1<br />\nLine 2</p>'
```

Without `breaks: true`, use two spaces + newline or backslash + newline for hard breaks.

### `linkTarget`

Adds a `target` attribute to all links.

```typescript
import { markdown } from '@motioneffector/markdown'

markdown('[Link](https://example.com)', { linkTarget: '_blank' })
// => '<p><a href="https://example.com" target="_blank">Link</a></p>'
```

Common values:
- `'_blank'` - Open in new tab
- `'_self'` - Open in same frame
- `'_parent'` - Open in parent frame
- `'_top'` - Open in full window

---

## Supported Markdown

### Block Elements

| Element | Syntax | Output |
|---------|--------|--------|
| ATX Heading | `# H1` to `###### H6` | `<h1>` to `<h6>` |
| Setext Heading | `Heading\n===` | `<h1>`, `<h2>` |
| Paragraph | Text separated by blank lines | `<p>` |
| Blockquote | `> quoted` | `<blockquote>` |
| Unordered List | `- item` or `* item` | `<ul><li>` |
| Ordered List | `1. item` | `<ol><li>` |
| Fenced Code | ` ```lang ``` ` | `<pre><code>` |
| Indented Code | 4 spaces | `<pre><code>` |
| Thematic Break | `---` or `***` | `<hr />` |
| Table (GFM) | `\| A \| B \|` | `<table>` |

### Inline Elements

| Element | Syntax | Output |
|---------|--------|--------|
| Bold | `**text**` or `__text__` | `<strong>` |
| Italic | `*text*` or `_text_` | `<em>` |
| Bold + Italic | `***text***` | `<strong><em>` |
| Code | `` `code` `` | `<code>` |
| Link | `[text](url)` | `<a href>` |
| Image | `![alt](src)` | `<img>` |
| Strikethrough (GFM) | `~~text~~` | `<del>` |
| Autolink | `<url>` or bare URL | `<a href>` |
| Hard Break | Two spaces + newline | `<br />` |
