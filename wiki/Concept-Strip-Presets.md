# Strip Presets

Different contexts need different HTML. A chat message shouldn't contain `<h1>` tags. A notification shouldn't contain any HTML. An article needs full formatting. Strip presets give you ready-made configurations for common scenarios.

## How It Works

The `markdownStrip()` function takes HTML (or markdown) and filters it through a preset. Each preset defines which tags survive:

| Preset | Allowed Tags | Use Case |
|--------|--------------|----------|
| `plaintext` | None | Search indexing, notifications, excerpts |
| `inline` | `strong`, `em`, `code`, `a`, `br` | Chat messages, comments, inline content |
| `safe` | Block elements, no links/images | User comments, forum posts |
| `prose` | Rich text, no code blocks | Articles, blog posts, emails |

Presets are shortcuts. Use them when they match your needs, or define [custom filtering](Concept-Custom-Tag-Filtering) when they don't.

## Basic Usage

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown(`
# Title

**Bold** and *italic* with a [link](url).

\`\`\`
code block
\`\`\`
`)

// Different outputs for different contexts
const plain = markdownStrip(html, 'plaintext')  // No HTML at all
const chat = markdownStrip(html, 'inline')      // Only inline elements
const comment = markdownStrip(html, 'safe')     // Blocks but no links
const article = markdownStrip(html, 'prose')    // Rich text, no code
```

## Key Points

- **Markdown or HTML input** - `markdownStrip()` accepts either. Markdown is converted first, then filtered.
- **Content preserved by default** - When a tag is stripped, its content stays. `<h1>Title</h1>` becomes `Title`, not empty.
- **Dangerous tags always removed** - Scripts, iframes, and other dangerous elements are removed regardless of preset.
- **Presets are immutable** - You can't modify a preset. Use custom filtering for variations.

## Examples

### Plaintext for Search Indexing

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown('# Product\n\n**Best** widget for your needs.')
const searchText = markdownStrip(html, 'plaintext')

// Result: 'Product\n\nBest widget for your needs.'
// Perfect for full-text search indexing
```

### Inline for Chat Messages

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown('# Hello\n\nThis is **important**!')
const chatHtml = markdownStrip(html, 'inline')

// Result: 'Hello\n\nThis is <strong>important</strong>!'
// Headings stripped, bold preserved
```

### Safe for User Comments

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown('Check [this](http://spam.com)!\n\n**Great** product.')
const commentHtml = markdownStrip(html, 'safe')

// Result: '<p>Check this!</p>\n<p><strong>Great</strong> product.</p>'
// Links removed (spam prevention), formatting preserved
```

### Prose for Articles

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown('# Title\n\n```js\ncode\n```\n\nRead [more](url).')
const articleHtml = markdownStrip(html, 'prose')

// Result: '<h1>Title</h1>\n<p>code</p>\n<p>Read <a href="url">more</a>.</p>'
// Code blocks stripped (they need special rendering), links preserved
```

## Preset Details

### plaintext

Removes all HTML tags. Output is pure text with whitespace preserved.

Allowed: Nothing

### inline

Keeps only inline formatting elements.

Allowed: `strong`, `em`, `code`, `a`, `br`

### safe

Keeps structural elements but removes links and images (common attack vectors).

Allowed: `p`, `strong`, `em`, `code`, `pre`, `ul`, `ol`, `li`, `blockquote`, `h1`-`h6`

### prose

Keeps rich text suitable for articles but removes code blocks (which typically need syntax highlighting).

Allowed: `p`, `strong`, `em`, `a`, `blockquote`, `h1`-`h6`, `ul`, `ol`, `li`, `br`

## Related

- **[Custom Tag Filtering](Concept-Custom-Tag-Filtering)** - Create your own allowlists
- **[Filtering HTML Output](Guide-Filtering-HTML-Output)** - Step-by-step filtering guide
- **[Stripping API](API-Stripping)** - Full API documentation
