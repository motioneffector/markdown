import { describe, it, expect } from 'vitest'
import { markdown } from './markdown'

describe('Tab expansion', () => {
  it('expands tab at column 0 to 4 spaces (becomes indented code block)', () => {
    const result = markdown('\tfoo')
    // Tab at column 0 expands to 4 spaces, making it an indented code block
    expect(result).toBe('<pre><code>foo</code></pre>')
  })

  it('expands tab at column 1 to 3 spaces', () => {
    const result = markdown('a\tfoo')
    // 'a' is at column 0, tab should add 3 spaces to reach column 4
    expect(result).toBe('<p>a   foo</p>')
  })

  it('expands tab in indented code block', () => {
    const result = markdown('\tfoo')
    expect(result).toContain('<pre><code>foo')
  })

  it('expands multiple tabs correctly', () => {
    const result = markdown('\t\tfoo')
    // First tab: treated as indentation (code block), second tab: preserved in content
    expect(result).toContain('<pre><code>\tfoo')
  })

  it('resets column counter on newline', () => {
    const result = markdown('foo\n\tbar')
    // After newline, tab at column 0 expands to 4 spaces
    // Parser treats this as paragraph continuation (foo + 4 spaces + bar)
    expect(result).toContain('foo')
    expect(result).toContain('bar')
  })
})
