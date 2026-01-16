# @motioneffector/markdown

A safe-by-default markdown parser that converts user content to HTML without worrying about XSS attacks. You don't need to configure security settings, sanitize input, or learn about attack vectors. Just convert markdown and render the result. The library handles CommonMark and GitHub Flavored Markdown out of the box, with flexible output filtering when you need different HTML for different contexts.

## I want to...

| Goal | Where to go |
|------|-------------|
| Get up and running quickly | [Your First Markdown Render](Your-First-Markdown-Render) |
| Understand how safety works | [Safety by Default](Concept-Safety-By-Default) |
| Allow only certain HTML tags | [Filtering HTML Output](Guide-Filtering-HTML-Output) |
| Render user content safely | [Handling User Input](Guide-Handling-User-Input) |
| Enable/disable GFM features | [GFM Extensions](Concept-GFM-Extensions) |
| Look up a specific method | [API Reference](API-Parsing) |

## Key Concepts

### Safety by Default

The library assumes all input is hostile. Scripts, iframes, event handlers, and dangerous URL schemes are automatically removed. You get safe HTML without any configuration.

### Parsing vs Stripping

Two functions handle different needs: `markdown()` converts markdown to HTML, while `markdownStrip()` filters which HTML tags survive in the output. Use parsing for conversion, stripping for context-specific output.

### Strip Presets

Four built-in presets control HTML output: `plaintext` for search indexing, `inline` for chat messages, `safe` for user comments, and `prose` for rich articles. Pick a preset or define custom rules.

## Quick Example

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

// Convert markdown to safe HTML
const html = markdown('# Hello **world**!')
// => '<h1>Hello <strong>world</strong>!</h1>'

// Strip to plain text for notifications
const plain = markdownStrip(html, 'plaintext')
// => 'Hello world!'

// Allow only inline formatting for comments
const comment = markdownStrip(html, 'inline')
// => 'Hello <strong>world</strong>!'
```

---

**[Full API Reference →](API-Parsing)**
