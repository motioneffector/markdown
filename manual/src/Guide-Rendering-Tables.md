# Rendering Tables

Convert GFM table syntax to HTML tables with alignment support. Tables are enabled by default as part of GitHub Flavored Markdown.

## Prerequisites

Before starting, you should:

- [Understand GFM extensions](Concept-GFM-Extensions)
- [Know the basics of markdown conversion](Your-First-Markdown-Render)

## Overview

We'll render tables by:

1. Writing GFM table syntax
2. Converting with alignment
3. Styling the output

## Step 1: Write Table Markdown

GFM tables require a header row and a separator row.

```typescript
import { markdown } from '@motioneffector/markdown'

const tableMarkdown = `
| Name  | Role      | Status  |
|-------|-----------|---------|
| Alice | Developer | Active  |
| Bob   | Designer  | Active  |
| Carol | Manager   | Away    |
`

const html = markdown(tableMarkdown)
```

The separator row (`|---|---|---|`) defines column boundaries. Without it, the content renders as a paragraph.

## Step 2: Add Column Alignment

Control text alignment with colons in the separator row.

```typescript
import { markdown } from '@motioneffector/markdown'

const alignedTable = `
| Left   | Center  | Right |
|:-------|:-------:|------:|
| A      | B       | C     |
| D      | E       | F     |
`

const html = markdown(alignedTable)
// Produces cells with text-align styles
```

Alignment syntax:
- `:---` = left align (default)
- `:---:` = center align
- `---:` = right align

## Step 3: Style the Output

The library produces clean HTML. Add CSS for visual styling.

```typescript
import { markdown } from '@motioneffector/markdown'

const html = markdown(`
| Product | Price  |
|---------|-------:|
| Widget  | $10.00 |
| Gadget  | $25.00 |
`)

// Output:
// <table>
// <thead>
// <tr><th>Product</th><th style="text-align: right">Price</th></tr>
// </thead>
// <tbody>
// <tr><td>Widget</td><td style="text-align: right">$10.00</td></tr>
// <tr><td>Gadget</td><td style="text-align: right">$25.00</td></tr>
// </tbody>
// </table>
```

## Complete Example

```typescript
import { markdown } from '@motioneffector/markdown'

const report = markdown(`
## Q4 Sales Report

| Region    | Revenue    | Growth  |
|:----------|----------:|:-------:|
| North     | $1,200,000 | +15%    |
| South     | $890,000   | +8%     |
| East      | $1,450,000 | +22%    |
| West      | $980,000   | +12%    |

*Data as of December 31*
`)

// Full HTML with heading, table (right-aligned numbers, centered growth),
// and emphasized footnote
```

## Variations

### Tables with Inline Formatting

Use emphasis, code, and links inside cells:

```typescript
import { markdown } from '@motioneffector/markdown'

const formattedTable = markdown(`
| Feature     | Status       | Docs                    |
|-------------|--------------|-------------------------|
| **Auth**    | \`stable\`   | [Read more](./auth)     |
| *Payments*  | \`beta\`     | [Read more](./payments) |
`)
```

### Tables with Escaped Pipes

Include literal pipe characters with backslash:

```typescript
import { markdown } from '@motioneffector/markdown'

const escapedTable = markdown(`
| Expression    | Result |
|---------------|--------|
| true \\| false | true   |
| a \\| b        | a or b |
`)
```

### Uneven Rows

Cells automatically fill. Missing cells are empty, extra cells are ignored:

```typescript
import { markdown } from '@motioneffector/markdown'

const unevenTable = markdown(`
| A | B | C |
|---|---|---|
| 1 |   |   |
| 1 | 2 |   |
| 1 | 2 | 3 |
`)
```

## Troubleshooting

### Table Renders as Paragraph

**Symptom:** Table syntax appears as text, not a table.

**Cause:** Missing separator row or malformed syntax.

**Solution:** Ensure the second row contains only `|`, `-`, `:`, and spaces:

```markdown
| Header |
|--------|  <-- Required separator row
| Cell   |
```

### Table Disabled

**Symptom:** Tables never render, even with correct syntax.

**Cause:** GFM is disabled.

**Solution:** Don't pass `gfm: false`, or explicitly enable: `markdown(input, { gfm: true })`.

### Alignment Not Working

**Symptom:** Cells render but without alignment styles.

**Cause:** Colons in wrong position.

**Solution:** Colons must be directly adjacent to the dashes:
- `:---` not `: ---`
- `---:` not `--- :`
- `:---:` not `: --- :`

## See Also

- **[GFM Extensions](Concept-GFM-Extensions)** - All GFM features explained
- **[Parsing API](API-Parsing)** - The `gfm` option
- **[Filtering HTML Output](Guide-Filtering-HTML-Output)** - Allowing tables in stripped output
