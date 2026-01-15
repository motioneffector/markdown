# Filtering HTML Output

Control exactly which HTML elements appear in your output. Use presets for common scenarios or define custom allowlists and blocklists for specific needs.

## Prerequisites

Before starting, you should:

- [Understand strip presets](Concept-Strip-Presets)
- [Know the basics of markdown conversion](Your-First-Markdown-Render)

## Overview

We'll filter HTML output by:

1. Choosing between presets and custom configuration
2. Applying the appropriate filter
3. Handling edge cases

## Step 1: Choose Your Approach

Decide between a preset or custom configuration.

```typescript
import { markdownStrip } from '@motioneffector/markdown'

// Option A: Use a preset
const result = markdownStrip(html, 'safe')

// Option B: Custom allowlist
const result = markdownStrip(html, { allow: ['p', 'strong'] })

// Option C: Custom blocklist
const result = markdownStrip(html, { strip: ['img', 'a'] })
```

Use presets when they match your needs. Use custom configuration for precise control.

## Step 2: Apply the Filter

Call `markdownStrip()` with your chosen configuration.

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

const html = markdown(`
# Title

**Bold** text with [link](url) and ![image](img.png).

\`\`\`
code block
\`\`\`
`)

// Using preset
const safeHtml = markdownStrip(html, 'safe')
// Result: Heading, bold preserved. Link/image removed.

// Using allowlist
const minimalHtml = markdownStrip(html, {
  allow: ['p', 'strong', 'em']
})
// Result: Only paragraphs and basic formatting.

// Using blocklist
const noMediaHtml = markdownStrip(html, {
  strip: ['img', 'a']
})
// Result: Everything except images and links.
```

## Step 3: Handle Special Cases

Some elements need special consideration.

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

// Images are always removed entirely (not unwrapped)
const withImage = markdown('Text ![alt](img.png) more text.')
const stripped = markdownStrip(withImage, { strip: ['img'] })
// Result: '<p>Text  more text.</p>' (image gone, not "Text alt more text")

// Code blocks need both pre and code
const withCode = markdown('```\ncode\n```')
const allowCode = markdownStrip(withCode, {
  allow: ['pre', 'code']  // Need both tags
})
```

## Complete Example

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

// Content moderation system
type ModerationLevel = 'strict' | 'moderate' | 'permissive'

function moderateContent(input: string, level: ModerationLevel): string {
  const html = markdown(input)

  switch (level) {
    case 'strict':
      // Plain text only
      return markdownStrip(html, 'plaintext')

    case 'moderate':
      // Allow formatting but no links or media
      return markdownStrip(html, {
        allow: ['p', 'strong', 'em', 'code', 'ul', 'ol', 'li', 'blockquote']
      })

    case 'permissive':
      // Allow most content, block only dangerous elements
      return markdownStrip(html, {
        strip: ['img']  // Only remove images
      })
  }
}

// Usage
const userContent = '# Title\n\n**Bold** with [link](url) and ![image](x.png)'

console.log(moderateContent(userContent, 'strict'))
// => 'Title\n\nBold with link and '

console.log(moderateContent(userContent, 'moderate'))
// => '<p><strong>Bold</strong> with link and </p>'

console.log(moderateContent(userContent, 'permissive'))
// => Full HTML without images
```

## Variations

### Allowing Tables

```typescript
import { markdownStrip } from '@motioneffector/markdown'

const withTables = markdownStrip(html, {
  allow: [
    'table', 'thead', 'tbody', 'tr', 'th', 'td',  // Table elements
    'p', 'strong', 'em'  // Basic formatting
  ]
})
```

### Removing Just Links

```typescript
import { markdownStrip } from '@motioneffector/markdown'

const noLinks = markdownStrip(html, {
  strip: ['a'],
  unwrap: true  // Keep link text (default)
})
```

### Removing Content Entirely

```typescript
import { markdownStrip } from '@motioneffector/markdown'

const noCode = markdownStrip(html, {
  strip: ['code', 'pre'],
  unwrap: false  // Remove code content entirely
})
```

### Building on Presets

Presets can't be modified, but you can replicate their logic:

```typescript
import { markdownStrip } from '@motioneffector/markdown'

// "inline" preset plus tables
const inlineWithTables = markdownStrip(html, {
  allow: [
    // From "inline" preset
    'strong', 'em', 'code', 'a', 'br',
    // Plus tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ]
})
```

## Troubleshooting

### Error: Cannot Use Both "allow" and "strip"

**Symptom:** `ValidationError: Cannot use both "allow" and "strip" options`

**Cause:** You passed both options in the same configuration.

**Solution:** Use only one. For "allow everything except X", use `strip`. For "block everything except X", use `allow`.

### Tables Not Rendering

**Symptom:** Table content appears but not as a table.

**Cause:** Missing one of the required table tags.

**Solution:** Include all table-related tags: `table`, `thead`, `tbody`, `tr`, `th`, `td`.

### Content Disappearing

**Symptom:** Stripped tags remove their content too.

**Cause:** `unwrap: false` is set.

**Solution:** Use `unwrap: true` (default) to keep content when removing tags.

## See Also

- **[Strip Presets](Concept-Strip-Presets)** - Built-in preset details
- **[Custom Tag Filtering](Concept-Custom-Tag-Filtering)** - Allowlist vs blocklist concepts
- **[Stripping API](API-Stripping)** - Full API reference
