# Your First Markdown Render

Convert markdown to safe HTML and control the output format.

By the end of this guide, you'll have markdown rendering working with different output modes for different contexts.

## What We're Building

A simple flow that takes user markdown, converts it to HTML, and produces different outputs for display, notifications, and search indexing:

```
User Input → markdown() → Full HTML
                       → markdownStrip('inline') → Chat-safe HTML
                       → markdownStrip('plaintext') → Plain text
```

## Step 1: Import the Functions

Both functions come from the same package.

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'
```

That's the only import you need. No configuration objects, no setup functions.

## Step 2: Convert Markdown to HTML

Pass any markdown string to `markdown()`. It returns safe HTML.

```typescript
const userInput = `
# Welcome

This is **bold** and this is *italic*.

- List item 1
- List item 2
`

const html = markdown(userInput)
```

The result is safe to render directly. Scripts, event handlers, and dangerous URLs are already removed.

## Step 3: Strip for Different Contexts

Use `markdownStrip()` to filter the HTML for specific contexts.

```typescript
// For notifications or search: plain text only
const plainText = markdownStrip(html, 'plaintext')
// => 'Welcome\n\nThis is bold and this is italic.\n\nList item 1\nList item 2'

// For chat messages: inline formatting only
const chatSafe = markdownStrip(html, 'inline')
// => 'Welcome\n\nThis is <strong>bold</strong> and this is <em>italic</em>...'

// For comments: block elements but no links
const commentSafe = markdownStrip(html, 'safe')
// => Full HTML but <a> tags stripped
```

## The Complete Code

Here's everything together:

```typescript
import { markdown, markdownStrip } from '@motioneffector/markdown'

// User submits markdown content
const userInput = `
# Welcome

Check out [my site](https://example.com)!

- Feature **one**
- Feature *two*
`

// Convert to HTML (safe by default)
const html = markdown(userInput)

// Use different outputs for different contexts
const forDisplay = html                              // Full HTML for articles
const forChat = markdownStrip(html, 'inline')        // Inline only for messages
const forNotification = markdownStrip(html, 'plaintext')  // Plain text for alerts
const forComment = markdownStrip(html, 'safe')       // No links for comments

console.log('Display:', forDisplay)
console.log('Chat:', forChat)
console.log('Notification:', forNotification)
console.log('Comment:', forComment)
```

## What's Next?

Now that you have the basics:

- **[Understand safety](Concept-Safety-By-Default)** - Learn what protections are applied automatically
- **[Filter HTML output](Guide-Filtering-HTML-Output)** - Create custom allowlists for specific needs
- **[Handle user input](Guide-Handling-User-Input)** - Best practices for user-generated content
- **[Explore the API](API-Parsing)** - Full reference for all options
