# Safety by Default

The library treats all input as potentially hostile. Every feature that could enable cross-site scripting (XSS) is disabled or sanitized automatically. You don't need to configure anything to get safe output.

## How It Works

When you call `markdown()`, the parser runs several security layers:

1. **Dangerous tags removed** - `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>` are stripped entirely
2. **Event handlers removed** - Attributes like `onclick`, `onerror`, `onload` are stripped
3. **Dangerous URLs blocked** - `javascript:`, `data:`, and other dangerous schemes are neutralized
4. **HTML entities decoded safely** - Numeric entities are converted without enabling injection

This happens before you receive the output. There's no "unsafe mode" you might accidentally enable.

## Basic Usage

```typescript
import { markdown } from '@motioneffector/markdown'

// Malicious input from user
const userInput = `
Check this out: <script>alert('xss')</script>

Click <a href="javascript:stealData()">here</a>

<img src="x" onerror="malicious()">
`

const html = markdown(userInput)
// Scripts removed, javascript: URLs neutralized, event handlers stripped
// Safe to render directly
```

The output contains only safe HTML elements with safe attributes.

## Key Points

- **Enabled by default** - The `sanitize` option defaults to `true`. You never need to remember to enable it.
- **Cannot be bypassed accidentally** - Dangerous tags are always removed, even with `sanitize: false`. That option only controls URL sanitization for trusted content scenarios.
- **Content preserved when safe** - The library removes threats, not content. `<b>bold</b>` stays as `<b>bold</b>`, while `<script>code</script>` becomes empty.
- **No allowlist required** - Unlike some sanitizers, you don't need to specify which tags are safe. The library knows.

## Examples

### User Comment with Script Injection

```typescript
import { markdown } from '@motioneffector/markdown'

const comment = markdown(`
Great article!

<script>document.cookie</script>

Really enjoyed it.
`)

// Output: '<p>Great article!</p>\n\n<p>Really enjoyed it.</p>'
// Script tag completely removed
```

### Link with JavaScript URL

```typescript
import { markdown } from '@motioneffector/markdown'

const content = markdown('[Click me](javascript:alert("xss"))')

// Output: '<p>Click me</p>'
// Link removed because URL is dangerous, but text preserved
```

### Image with Error Handler

```typescript
import { markdown } from '@motioneffector/markdown'

const content = markdown('![alt](image.png" onerror="steal())')

// Output: '<p><img src="image.png" alt="alt" /></p>'
// Event handler stripped, safe attributes preserved
```

## Disabling for Trusted Content

If you're rendering your own content (not user input), you can disable URL sanitization:

```typescript
import { markdown } from '@motioneffector/markdown'

// Only do this for content you control
const trustedHtml = markdown(myOwnContent, { sanitize: false })
```

Even with `sanitize: false`, dangerous tags like `<script>` are still removed. This option only affects URL scheme validation.

## Related

- **[Handling User Input](Guide-Handling-User-Input)** - Best practices for user-generated content
- **[Parsing API](API-Parsing)** - Full documentation of the `sanitize` option
- **[Stripping API](API-Stripping)** - Additional filtering for context-specific output
