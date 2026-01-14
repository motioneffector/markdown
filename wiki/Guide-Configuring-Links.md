# Configuring Links

Customize how links are rendered. Open links in new tabs, use reference-style definitions, and understand URL sanitization.

## Prerequisites

Before starting, you should:

- [Know the basics of markdown conversion](Your-First-Markdown-Render)
- [Understand safety features](Concept-Safety-By-Default)

## Overview

We'll configure links by:

1. Setting the target attribute
2. Using reference-style links
3. Understanding autolinks

## Step 1: Set Link Target

Make links open in new tabs with the `linkTarget` option.

```typescript
import { markdown } from '@motioneffector/markdown'

const html = markdown('[Visit site](https://example.com)', {
  linkTarget: '_blank'
})

// Output: '<p><a href="https://example.com" target="_blank">Visit site</a></p>'
```

Common target values:
- `_blank` - Opens in new tab
- `_self` - Opens in same frame (default browser behavior)
- `_parent` - Opens in parent frame
- `_top` - Opens in full body of window

## Step 2: Use Reference-Style Links

Define URLs once and reference them throughout the document.

```typescript
import { markdown } from '@motioneffector/markdown'

const doc = markdown(`
Check out [our homepage][home] for more info.

Read the [documentation][docs] to get started.

[home]: https://example.com
[docs]: https://example.com/docs "Documentation"
`)
```

Reference definitions:
- `[ref]: url` - Basic definition
- `[ref]: url "title"` - With title attribute

References are case-insensitive and can be defined anywhere in the document.

## Step 3: Understand Autolinks

GFM automatically links bare URLs and email addresses.

```typescript
import { markdown } from '@motioneffector/markdown'

const html = markdown(`
Visit https://example.com for info.

Contact support@example.com for help.

Check www.example.com too.
`)

// URLs and emails become clickable links automatically
```

Autolinks only work when:
- URL starts with `http://`, `https://`, or `www.`
- Email matches standard format
- GFM is enabled (default)

## Complete Example

```typescript
import { markdown } from '@motioneffector/markdown'

const article = markdown(`
# Welcome to Our Site

Visit [our blog][blog] for the latest updates.

For support, email support@example.com or check https://help.example.com.

## Links

- [Home][home]
- [About](./about "About Us")
- [Contact](mailto:hello@example.com)

[blog]: https://blog.example.com "Our Blog"
[home]: https://example.com
`, {
  linkTarget: '_blank'
})

// All links open in new tabs
// Reference links resolved
// Bare URLs and emails linked automatically
```

## Variations

### External Links Only in New Tab

Apply target only to external links (requires post-processing):

```typescript
import { markdown } from '@motioneffector/markdown'

// First render without target
let html = markdown('[Local](./about) and [External](https://other.com)')

// Then add target to external links
html = html.replace(
  /<a href="(https?:\/\/[^"]+)">/g,
  '<a href="$1" target="_blank" rel="noopener">'
)
```

### Links with Titles

Add tooltip text to links:

```typescript
import { markdown } from '@motioneffector/markdown'

const html = markdown('[Hover me](https://example.com "This is the title")')

// Output includes: title="This is the title"
```

### Angle Bracket URLs

URLs with special characters can use angle brackets:

```typescript
import { markdown } from '@motioneffector/markdown'

const html = markdown('[Link](<https://example.com/path with spaces>)')

// Angle brackets protect the URL from markdown parsing
```

## Troubleshooting

### Link Not Rendering

**Symptom:** Link appears as plain text `[text](url)`.

**Cause:** Malformed syntax or dangerous URL.

**Solution:** Check that:
- No space between `]` and `(`
- URL doesn't use `javascript:` or `data:` scheme
- Reference is defined (for reference-style links)

### Dangerous URL Stripped

**Symptom:** Link text appears but not as a link.

**Cause:** URL uses a dangerous scheme.

**Solution:** Use safe URL schemes (`http:`, `https:`, `mailto:`). Dangerous schemes are blocked intentionally. See [Safety by Default](Concept-Safety-By-Default).

### Reference Link Not Found

**Symptom:** Reference-style link appears as literal text.

**Cause:** Reference definition is missing or misspelled.

**Solution:** Ensure the reference is defined somewhere in the document. References are case-insensitive, so `[Home]` matches `[home]: url`.

### Autolinks Not Working

**Symptom:** Bare URLs appear as text, not links.

**Cause:** GFM disabled or URL format not recognized.

**Solution:** Ensure `gfm: true` (default) and URL starts with `http://`, `https://`, or `www.`.

## See Also

- **[Safety by Default](Concept-Safety-By-Default)** - URL sanitization details
- **[GFM Extensions](Concept-GFM-Extensions)** - Autolink behavior
- **[Parsing API](API-Parsing)** - The `linkTarget` option
