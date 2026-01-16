# GFM Extensions

GitHub Flavored Markdown (GFM) adds practical features beyond the CommonMark standard. Tables, strikethrough, task lists, and extended autolinks are all enabled by default because they're what users expect from a modern markdown parser.

## How It Works

GFM extends CommonMark with syntax that GitHub popularized:

| Feature | Syntax | Output |
|---------|--------|--------|
| Tables | `\| A \| B \|` | HTML `<table>` |
| Strikethrough | `~~text~~` | `<del>text</del>` |
| Task lists | `- [x] Done` | Checkbox inputs |
| Autolinks | `https://...` | Clickable links |

These features are part of the GFM specification and widely supported. The library enables them by default to match user expectations.

## Basic Usage

```typescript
import { markdown } from '@motioneffector/markdown'

const content = markdown(`
| Feature | Status |
|---------|--------|
| Tables | Done |
| ~~Old feature~~ | Removed |

- [x] Completed task
- [ ] Pending task

Visit https://example.com for more.
`)
```

All GFM features work automatically.

## Key Points

- **Enabled by default** - The `gfm` option is `true` by default. Most users want these features.
- **Safe to disable** - Set `gfm: false` for strict CommonMark compliance. Tables become paragraphs, strikethrough becomes literal tildes.
- **Tables need headers** - GFM tables require a header row and separator row. Rows without headers render as paragraphs.
- **Autolinks are smart** - Bare URLs only become links when they start with `http://`, `https://`, or `www.`. Email addresses are also detected.

## Examples

### Tables with Alignment

```typescript
import { markdown } from '@motioneffector/markdown'

const table = markdown(`
| Left | Center | Right |
|:-----|:------:|------:|
| A    | B      | C     |
| D    | E      | F     |
`)

// Produces <table> with text-align styles on cells
```

The colon position in the separator row controls alignment:
- `:---` = left align
- `:---:` = center align
- `---:` = right align

### Task Lists

```typescript
import { markdown } from '@motioneffector/markdown'

const tasks = markdown(`
- [x] Write documentation
- [x] Add tests
- [ ] Release v1.0
`)

// Produces <ul> with checkbox inputs (disabled by default)
```

Task list items get the `task-list-item` class for styling.

### Strikethrough

```typescript
import { markdown } from '@motioneffector/markdown'

const content = markdown('This is ~~wrong~~ correct.')

// Output: '<p>This is <del>wrong</del> correct.</p>'
```

### Disabling GFM

For strict CommonMark compliance:

```typescript
import { markdown } from '@motioneffector/markdown'

const strict = markdown('| Not | A | Table |', { gfm: false })

// Output: '<p>| Not | A | Table |</p>'
// Table syntax treated as plain text
```

## Related

- **[Rendering Tables](Guide-Rendering-Tables)** - Complete guide to table formatting
- **[Parsing API](API-Parsing)** - Documentation of the `gfm` option
- **[Safety by Default](Concept-Safety-By-Default)** - How GFM features interact with sanitization
