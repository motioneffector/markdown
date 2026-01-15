# Custom Tag Filtering

When presets don't match your needs, define exactly which tags survive. Use an allowlist to permit only specific tags, or a blocklist to remove specific tags while keeping everything else.

## How It Works

Instead of a preset name, pass a configuration object to `markdownStrip()`:

```typescript
// Allowlist: only these tags permitted
markdownStrip(html, { allow: ['p', 'strong', 'em'] })

// Blocklist: these tags removed, others kept
markdownStrip(html, { strip: ['img', 'a'] })
```

You can't use both `allow` and `strip` in the same call. Pick one approach.

## Basic Usage

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown(`
# Title

**Bold** with a [link](url) and ![image](img.png).

- List item
`)

// Allow only paragraph and basic formatting
const filtered = markdownStrip(html, {
  allow: ['p', 'strong', 'em', 'ul', 'li']
})

// Result: Headings unwrapped, links/images removed, lists preserved
```

## Key Points

- **Allowlist is exclusive** - Only tags in the `allow` array survive. Everything else is stripped.
- **Blocklist is inclusive** - Only tags in the `strip` array are removed. Everything else survives.
- **Can't combine both** - Using `allow` and `strip` together throws an error. Pick one.
- **Dangerous tags always removed** - Scripts, iframes, etc. are removed regardless of your configuration.
- **Content preserved by default** - When a tag is stripped, its inner content stays (controlled by `unwrap`).

## Examples

### Custom Allowlist

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown('# Title\n\n**Bold** and `code` here.')

const result = markdownStrip(html, {
  allow: ['strong', 'em']  // Only these survive
})

// Result: 'Title\n\n<strong>Bold</strong> and code here.'
// Heading unwrapped, code unwrapped, strong preserved
```

### Custom Blocklist

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown('[Link](url) and **bold** text.')

const result = markdownStrip(html, {
  strip: ['a']  // Only links removed
})

// Result: '<p>Link and <strong>bold</strong> text.</p>'
// Link tag removed but text kept, everything else preserved
```

### Removing Content Entirely

By default, stripped tags keep their inner content. Use `unwrap: false` to remove both:

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown('Text with `code` inline.')

// Default: unwrap content
const unwrapped = markdownStrip(html, {
  strip: ['code'],
  unwrap: true  // default
})
// Result: '<p>Text with code inline.</p>'

// Remove entirely
const removed = markdownStrip(html, {
  strip: ['code'],
  unwrap: false
})
// Result: '<p>Text with  inline.</p>'
```

### Extending a Preset's Logic

Presets can't be modified, but you can replicate and extend:

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown('# Title\n\n**Bold** [link](url)')

// "safe" preset allows these, but we also want tables
const customSafe = markdownStrip(html, {
  allow: [
    // Original "safe" tags
    'p', 'strong', 'em', 'code', 'pre',
    'ul', 'ol', 'li', 'blockquote',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Plus tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ]
})
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allow` | `string[]` | - | Only these tags permitted |
| `strip` | `string[]` | - | These tags removed |
| `unwrap` | `boolean` | `true` | Keep inner content when stripping |

## Related

- **[Strip Presets](Concept-Strip-Presets)** - Built-in presets for common cases
- **[Filtering HTML Output](Guide-Filtering-HTML-Output)** - Step-by-step guide
- **[Stripping API](API-Stripping)** - Full API reference
