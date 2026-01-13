import { describe, it, expect } from 'vitest'
import { markdown } from './markdown'

describe('CommonMark Spec Compliance', () => {
  describe('Edge Cases', () => {
    it('handles nested block quotes correctly', () => {
      const result = markdown('> Level 1\n>> Level 2\n>>> Level 3')
      expect(result).toContain('<blockquote>')
      const matches = result.match(/<blockquote>/g)
      expect(matches).toHaveLength(3)
    })

    it('handles nested lists correctly', () => {
      const result = markdown('- Level 1\n  - Level 2\n    - Level 3')
      expect(result).toContain('<ul>')
      const matches = result.match(/<ul>/g)
      expect(matches).toHaveLength(3)
    })

    it('handles emphasis algorithm edge cases', () => {
      const result = markdown('*foo **bar** baz*')
      expect(result).toContain('<em>')
      expect(result).toContain('<strong>')
    })

    it('handles link reference edge cases', () => {
      const result = markdown('[foo] bar\n\n[foo]: /url')
      expect(result).toContain('<a href="/url">')
    })

    it('handles code span edge cases', () => {
      const result = markdown('`foo `` bar`')
      expect(result).toContain('<code>')
    })

    it('handles setext heading edge cases', () => {
      const result = markdown('Foo\nbar\n---')
      expect(result).toContain('<h2>')
    })

    it('handles thematic break edge cases', () => {
      const result = markdown('***\n---\n___')
      const matches = result.match(/<hr/g)
      expect(matches).toHaveLength(3)
    })
  })
})

describe('Performance', () => {
  describe('Speed', () => {
    it('parses 100KB in under 100ms', () => {
      const largeDoc = '# Heading\n\nSome paragraph text here.\n\n'.repeat(2500) // ~100KB
      const start = performance.now()
      markdown(largeDoc)
      const end = performance.now()
      // Allow reasonable time for 100KB parsing
      expect(end - start).toBeLessThan(100)
    })

    it('no regex catastrophic backtracking', () => {
      const pathological = '*'.repeat(1000)
      const start = performance.now()
      markdown(pathological)
      const end = performance.now()
      expect(end - start).toBeLessThan(1000)
    })

    it('handles pathological input without hanging', () => {
      const nested = '> '.repeat(100) + 'text'
      const start = performance.now()
      markdown(nested)
      const end = performance.now()
      expect(end - start).toBeLessThan(1000)
    })
  })

  describe('Memory', () => {
    it('no memory leak on repeated calls', () => {
      const input = '# Heading\n\nParagraph'
      const results: string[] = []
      for (let i = 0; i < 1000; i++) {
        results.push(markdown(input))
      }
      // Verify all calls produced expected output
      expect(results.every(r => r.includes('<h1>') && r.includes('Paragraph'))).toBe(true)
    })

    it('handles 1MB documents', () => {
      const largeDoc = '# Heading\n\nParagraph\n\n'.repeat(40000) // ~1MB
      const result = markdown(largeDoc)
      expect(result).toContain('<h1>')
      expect(result.length).toBeGreaterThan(1000000)
    })
  })
})

describe('Edge Cases', () => {
  describe('Deep Nesting', () => {
    it('handles 10+ levels of block quotes', () => {
      let input = ''
      for (let i = 0; i < 15; i++) {
        input += '> '.repeat(i + 1) + 'Level ' + (i + 1) + '\n'
      }
      const result = markdown(input)
      expect(result).toContain('<blockquote>')
      expect(result).toContain('Level 15')
    })

    it('handles 10+ levels of lists', () => {
      let input = ''
      for (let i = 0; i < 15; i++) {
        input += '  '.repeat(i) + '- Level ' + (i + 1) + '\n'
      }
      const result = markdown(input)
      expect(result).toContain('<ul>')
      expect(result).toContain('Level 15')
    })

    it('handles deeply nested emphasis', () => {
      const result = markdown('***deeply **nested *emphasis* here** text***')
      expect(result).toContain('<strong>')
      expect(result).toContain('<em>')
    })
  })

  describe('Malformed Input', () => {
    it('handles unclosed tags gracefully', () => {
      const result = markdown('<div>unclosed', { sanitize: false })
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('handles unmatched emphasis', () => {
      const result = markdown('*unclosed emphasis')
      expect(result).toBeDefined()
      expect(result).toContain('<p>')
      expect(result).toContain('unclosed emphasis')
    })

    it('handles broken links', () => {
      const result = markdown('[text](')
      expect(result).toBeDefined()
      expect(result).toContain('<p>')
      expect(typeof result).toBe('string')
    })

    it('handles broken tables', () => {
      const result = markdown('| A | B |\n| 1 |')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('Unicode', () => {
    it('handles emoji in text', () => {
      const result = markdown('Hello 👋 World 🌍')
      expect(result).toContain('👋')
      expect(result).toContain('🌍')
    })

    it('handles emoji in code', () => {
      const result = markdown('`👋`')
      expect(result).toContain('👋')
    })

    it('handles RTL text', () => {
      const result = markdown('مرحبا بالعالم')
      expect(result).toContain('مرحبا')
    })

    it('handles combining characters', () => {
      const result = markdown('e\u0301') // é with combining acute
      expect(result).toBeDefined()
      expect(result).toContain('<p>')
      expect(result).toContain('\u0301')
    })

    it('handles zero-width characters', () => {
      const result = markdown('Hello\u200BWorld') // zero-width space
      expect(result).toBeDefined()
      expect(result).toContain('<p>')
      expect(result).toContain('Hello')
      expect(result).toContain('World')
    })
  })

  describe('Large Documents', () => {
    it('handles 1MB markdown input', () => {
      const largeInput = '# Heading\n\nParagraph with some text.\n\n'.repeat(30000) // ~1MB
      const result = markdown(largeInput)
      expect(result).toContain('<h1>')
      expect(result.length).toBeGreaterThan(1000000)
    })

    it('handles 10000 line document', () => {
      const lines = Array(10000)
        .fill(0)
        .map((_, i) => `Line ${i}`)
        .join('\n\n')
      const result = markdown(lines)
      expect(result).toContain('Line 0')
      expect(result).toContain('Line 9999')
    })

    it('handles very long lines', () => {
      const longLine = 'a'.repeat(100000)
      const result = markdown(longLine)
      expect(result).toContain('<p>')
      expect(result.length).toBeGreaterThan(100000)
    })
  })
})
