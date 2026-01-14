# Handling User Input

Accept markdown from users and render it safely for different contexts. This guide covers the complete flow from receiving input to displaying output.

## Prerequisites

Before starting, you should:

- [Install the library](Installation)
- [Complete the first render tutorial](Your-First-Markdown-Render)

## Overview

We'll handle user input safely by:

1. Receiving markdown from the user
2. Converting with default safe settings
3. Applying context-appropriate filtering
4. Storing and displaying the result

## Step 1: Receive User Input

Accept markdown from any source: form fields, API requests, database records.

```typescript
import { markdown } from '@motioneffector/markdown'

// From a form submission
const userMarkdown = formData.get('content') as string

// From an API request
const userMarkdown = requestBody.content

// From database
const userMarkdown = post.rawContent
```

Don't sanitize or validate at this stage. The library handles that.

## Step 2: Convert to Safe HTML

Call `markdown()` with default options. Safety is enabled automatically.

```typescript
import { markdown } from '@motioneffector/markdown'

function processUserContent(input: string): string {
  // Safe by default - no configuration needed
  return markdown(input)
}

const safeHtml = processUserContent(userMarkdown)
```

The output is safe to store and render. Scripts, event handlers, and dangerous URLs are already removed.

## Step 3: Apply Context Filtering

Different contexts need different HTML. Use `markdownStrip()` for context-specific output.

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

function processForContext(
  input: string,
  context: 'article' | 'comment' | 'chat' | 'notification'
): string {
  const html = markdown(input)

  switch (context) {
    case 'article':
      return html  // Full HTML for articles
    case 'comment':
      return markdownStrip(html, 'safe')  // No links/images
    case 'chat':
      return markdownStrip(html, 'inline')  // Inline only
    case 'notification':
      return markdownStrip(html, 'plaintext')  // No HTML
  }
}
```

## Step 4: Store and Display

Store the appropriate version for your use case.

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

// Store both for flexibility
interface ProcessedContent {
  raw: string      // Original markdown
  html: string     // Full safe HTML
  plain: string    // For search/notifications
}

function processContent(rawMarkdown: string): ProcessedContent {
  const html = markdown(rawMarkdown)
  return {
    raw: rawMarkdown,
    html,
    plain: markdownStrip(html, 'plaintext')
  }
}
```

## Complete Example

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

// User content processor for a forum
interface ForumPost {
  id: string
  authorId: string
  rawContent: string
  htmlContent: string
  plainContent: string
  createdAt: Date
}

function createForumPost(authorId: string, content: string): ForumPost {
  // Convert markdown to safe HTML
  const htmlContent = markdown(content)

  // Generate plain text for search indexing
  const plainContent = markdownStrip(htmlContent, 'plaintext')

  return {
    id: generateId(),
    authorId,
    rawContent: content,
    htmlContent,
    plainContent,
    createdAt: new Date()
  }
}

// Display in different contexts
function renderPost(post: ForumPost, context: 'full' | 'preview' | 'notification') {
  switch (context) {
    case 'full':
      return post.htmlContent
    case 'preview':
      return markdownStrip(post.htmlContent, 'inline').slice(0, 200) + '...'
    case 'notification':
      return post.plainContent.slice(0, 100) + '...'
  }
}
```

## Variations

### Comments with Link Removal

Prevent link spam in comments:

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

function processComment(input: string): string {
  const html = markdown(input)
  return markdownStrip(html, 'safe')  // Removes <a> and <img> tags
}
```

### Chat Messages with Inline Only

Keep messages simple:

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

function processChatMessage(input: string): string {
  const html = markdown(input)
  return markdownStrip(html, 'inline')  // Only bold, italic, code, links
}
```

### Email-Safe Content

Generate content safe for HTML emails:

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

function processEmailContent(input: string): string {
  const html = markdown(input)
  return markdownStrip(html, 'prose')  // Rich text, no code blocks
}
```

## Troubleshooting

### Content Appears Escaped

**Symptom:** You see `&lt;p&gt;` instead of rendered HTML.

**Cause:** Double-escaping. The HTML is being escaped again during rendering.

**Solution:** Ensure your templating engine knows the content is safe HTML. In React, use `dangerouslySetInnerHTML`. In Vue, use `v-html`.

### Links Missing from Output

**Symptom:** Link text appears but not as clickable links.

**Cause:** You're using the `safe` preset, which removes links.

**Solution:** Use a different preset or custom allowlist that includes `a`.

### Line Breaks Not Working

**Symptom:** Single line breaks in markdown appear as spaces.

**Cause:** CommonMark requires two spaces + newline or backslash + newline for hard breaks.

**Solution:** Enable the `breaks` option: `markdown(input, { breaks: true })`.

## See Also

- **[Safety by Default](Concept-Safety-By-Default)** - How protection works
- **[Strip Presets](Concept-Strip-Presets)** - Available presets explained
- **[Filtering HTML Output](Guide-Filtering-HTML-Output)** - Custom filtering options
- **[Parsing API](API-Parsing)** - Full function reference
