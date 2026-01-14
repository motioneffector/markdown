# Error Types

Error classes thrown by the library for different failure scenarios.

---

## `MarkdownError`

Base error class for all library errors. Extends the standard `Error` class.

**Signature:**

```typescript
class MarkdownError extends Error {
  constructor(message: string)
  name: 'MarkdownError'
}
```

**Example:**

```typescript
import { MarkdownError } from '@motioneffector/markdown'

try {
  // library operation
} catch (error) {
  if (error instanceof MarkdownError) {
    console.log('Markdown library error:', error.message)
  }
}
```

Use `MarkdownError` to catch any error from this library.

---

## `ValidationError`

Thrown when input or configuration validation fails.

**Signature:**

```typescript
class ValidationError extends MarkdownError {
  constructor(message: string, field?: string)
  name: 'ValidationError'
  field?: string
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `message` | `string` | Description of the validation failure |
| `field` | `string \| undefined` | Optional name of the invalid field |

**Example:**

```typescript
import { markdownStrip, ValidationError } from '@motioneffector/markdown'

try {
  // This throws because both allow and strip are provided
  markdownStrip(html, { allow: ['p'], strip: ['a'] })
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.message)
    // => 'Cannot use both "allow" and "strip" options'
  }
}
```

**Common causes:**

- Using both `allow` and `strip` options in `markdownStrip()`
- Invalid configuration values

---

## `ParseError`

Thrown when parsing fails due to malformed input.

**Signature:**

```typescript
class ParseError extends MarkdownError {
  constructor(message: string, position?: number, input?: string)
  name: 'ParseError'
  position?: number
  input?: string
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `message` | `string` | Description of the parse failure |
| `position` | `number \| undefined` | Character position where parsing failed |
| `input` | `string \| undefined` | The input that caused the failure |

**Example:**

```typescript
import { ParseError } from '@motioneffector/markdown'

try {
  // parsing operation
} catch (error) {
  if (error instanceof ParseError) {
    console.log('Parse failed at position', error.position)
    console.log('Input was:', error.input)
  }
}
```

**Note:** The library is designed to handle malformed input gracefully rather than throwing. Parse errors are rare and typically indicate internal issues rather than bad user input.

---

## Error Handling Patterns

### Catch All Library Errors

```typescript
import { markdown, MarkdownError } from '@motioneffector/markdown'

function safeRender(input: string): string {
  try {
    return markdown(input)
  } catch (error) {
    if (error instanceof MarkdownError) {
      console.error('Markdown error:', error.message)
      return '' // Fallback to empty string
    }
    throw error // Re-throw unexpected errors
  }
}
```

### Catch Specific Errors

```typescript
import { markdownStrip, ValidationError } from '@motioneffector/markdown'

function filterContent(html: string, config: unknown): string {
  try {
    return markdownStrip(html, config as any)
  } catch (error) {
    if (error instanceof ValidationError) {
      // Handle configuration errors specifically
      console.error('Invalid config:', error.message)
      return markdownStrip(html, 'plaintext') // Fallback to plaintext
    }
    throw error
  }
}
```

### Type-Safe Error Handling

```typescript
import { markdown, MarkdownError, ValidationError, ParseError } from '@motioneffector/markdown'

function processMarkdown(input: string): { html: string; error?: string } {
  try {
    return { html: markdown(input) }
  } catch (error) {
    if (error instanceof ValidationError) {
      return { html: '', error: `Invalid input: ${error.message}` }
    }
    if (error instanceof ParseError) {
      return { html: '', error: `Parse failed: ${error.message}` }
    }
    if (error instanceof MarkdownError) {
      return { html: '', error: `Markdown error: ${error.message}` }
    }
    // Unknown error
    throw error
  }
}
```

---

## Error Hierarchy

```
Error (built-in)
└── MarkdownError
    ├── ValidationError
    └── ParseError
```

All library errors extend `MarkdownError`, which extends the standard `Error`. This means:

- `error instanceof Error` catches all errors
- `error instanceof MarkdownError` catches all library errors
- `error instanceof ValidationError` catches only validation errors
- `error instanceof ParseError` catches only parse errors
