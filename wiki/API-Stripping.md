# Stripping API

Functions and types for filtering HTML tags from markdown output.

---

## `markdownStrip()`

Strip HTML tags from markdown or HTML input using presets or custom configuration.

**Signature:**

```typescript
function markdownStrip(
  input: string,
  config?: StripPreset | StripConfig
): string
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `input` | `string` | Yes | Markdown or HTML string to filter |
| `config` | `StripPreset \| StripConfig` | No | Preset name or custom configuration. Default: no stripping |

**Returns:** `string` — HTML string with tags stripped according to configuration.

**Example:**

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown('# Title\n\n**Bold** [link](url)')

// Using preset
const plain = markdownStrip(html, 'plaintext')
// => 'Title\n\nBold link'

// Using custom config
const filtered = markdownStrip(html, {
  allow: ['p', 'strong']
})
// => '<p><strong>Bold</strong> link</p>'
```

**Throws:**

- `ValidationError` — When both `allow` and `strip` options are provided

---

## Types

### `StripPreset`

Built-in preset names for common filtering scenarios.

```typescript
type StripPreset = 'plaintext' | 'inline' | 'safe' | 'prose'
```

| Preset | Allowed Tags | Use Case |
|--------|--------------|----------|
| `plaintext` | None | Search indexing, notifications |
| `inline` | `strong`, `em`, `code`, `a`, `br` | Chat, comments |
| `safe` | Block elements, no links/images | User content |
| `prose` | Rich text, no code blocks | Articles, emails |

### `StripConfig`

Custom configuration for tag filtering.

```typescript
interface StripConfig {
  allow?: string[]
  strip?: string[]
  unwrap?: boolean
}
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `allow` | `string[]` | No | Allowlist - only these tags permitted. Cannot use with `strip`. |
| `strip` | `string[]` | No | Blocklist - these tags removed. Cannot use with `allow`. |
| `unwrap` | `boolean` | No | Keep inner content when stripping tags. Default: `true` |

---

## Preset Details

### `plaintext`

Removes all HTML tags. Output is pure text.

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown('**Bold** and *italic*')
markdownStrip(html, 'plaintext')
// => 'Bold and italic'
```

**Allowed tags:** None

### `inline`

Keeps only inline formatting elements.

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown('# Heading\n\n**Bold** [link](url)')
markdownStrip(html, 'inline')
// => 'Heading\n\n<strong>Bold</strong> <a href="url">link</a>'
```

**Allowed tags:** `strong`, `em`, `code`, `a`, `br`

### `safe`

Keeps structural elements but removes links and images (common attack vectors).

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown('# Title\n\n**Bold** [link](url)')
markdownStrip(html, 'safe')
// => '<h1>Title</h1>\n<p><strong>Bold</strong> link</p>'
```

**Allowed tags:** `p`, `strong`, `em`, `code`, `pre`, `ul`, `ol`, `li`, `blockquote`, `h1`-`h6`

### `prose`

Keeps rich text suitable for articles, removes code blocks.

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown('# Title\n\n```\ncode\n```\n\n[Link](url)')
markdownStrip(html, 'prose')
// => '<h1>Title</h1>\n<p>code</p>\n<p><a href="url">Link</a></p>'
```

**Allowed tags:** `p`, `strong`, `em`, `a`, `blockquote`, `h1`-`h6`, `ul`, `ol`, `li`, `br`

---

## Custom Configuration

### Allowlist

Permit only specific tags. Everything else is stripped.

```typescript
import { markdownStrip } from '@motioneffector/markdown'

markdownStrip(html, {
  allow: ['p', 'strong', 'em']
})
```

### Blocklist

Remove specific tags. Everything else is preserved.

```typescript
import { markdownStrip } from '@motioneffector/markdown'

markdownStrip(html, {
  strip: ['img', 'a']
})
```

### Unwrap Option

Controls whether stripped tags keep their content.

```typescript
import { markdownStrip } from '@motioneffector/markdown'

const html = '<p>Text with <code>code</code> here</p>'

// unwrap: true (default) - keep content
markdownStrip(html, { strip: ['code'], unwrap: true })
// => '<p>Text with code here</p>'

// unwrap: false - remove content too
markdownStrip(html, { strip: ['code'], unwrap: false })
// => '<p>Text with  here</p>'
```

---

## Dangerous Tags

These tags are always removed regardless of configuration:

- `script`
- `style`
- `iframe`
- `object`
- `embed`

```typescript
import { markdownStrip } from '@motioneffector/markdown'

// Even with permissive config, dangerous tags are removed
markdownStrip('<script>alert(1)</script>', { allow: ['script'] })
// => '' (script removed entirely)
```

---

## Input Handling

`markdownStrip()` accepts both markdown and HTML input.

```typescript
import { markdownStrip } from '@motioneffector/markdown'

// HTML input
markdownStrip('<p><strong>Bold</strong></p>', 'plaintext')
// => 'Bold'

// Markdown input (converted first, then stripped)
markdownStrip('**Bold**', 'plaintext')
// => 'Bold'
```

If input doesn't look like HTML (no `<tag>` patterns), it's converted using `markdown()` first.
