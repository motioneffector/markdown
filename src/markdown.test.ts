import { describe, it, expect } from 'vitest'
import { markdown } from './markdown'

describe('markdown()', () => {
  describe('Basic Functionality', () => {
    it('converts simple text to paragraph', () => {
      const result = markdown('Hello world')
      expect(result).toBe('<p>Hello world</p>')
    })

    it('converts heading to h1', () => {
      const result = markdown('# Hello')
      expect(result).toBe('<h1>Hello</h1>')
    })

    it('converts multiple paragraphs', () => {
      const result = markdown('First\n\nSecond')
      expect(result).toContain('<p>First</p>')
      expect(result).toContain('<p>Second</p>')
    })

    it('returns string HTML output', () => {
      const result = markdown('Test')
      expect(typeof result).toBe('string')
    })

    it('handles empty string input', () => {
      const result = markdown('')
      expect(result).toBe('')
    })
  })

  describe('Options', () => {
    it('defaults gfm to true', () => {
      const result = markdown('| A | B |\n|---|---|\n| 1 | 2 |')
      expect(result).toContain('<table>')
    })

    it('defaults sanitize to true', () => {
      const result = markdown('<script>alert("xss")</script>')
      expect(result).not.toContain('<script>')
    })

    it('defaults breaks to false', () => {
      const result = markdown('Line 1\nLine 2')
      expect(result).not.toContain('<br')
    })

    it('respects gfm: false', () => {
      const result = markdown('| A | B |\n|---|---|\n| 1 | 2 |', { gfm: false })
      expect(result).not.toContain('<table>')
    })

    it('respects sanitize: false', () => {
      const result = markdown('<div>content</div>', { sanitize: false })
      expect(result).toContain('<div>')
    })

    it('respects breaks: true', () => {
      const result = markdown('Line 1\nLine 2', { breaks: true })
      expect(result).toContain('<br')
    })

    it('respects linkTarget option', () => {
      const result = markdown('[link](url)', { linkTarget: '_blank' })
      expect(result).toContain('target="_blank"')
    })
  })
})

describe('Block Elements', () => {
  describe('ATX Headings', () => {
    it('parses # as h1', () => {
      const result = markdown('# Heading 1')
      expect(result).toBe('<h1>Heading 1</h1>')
    })

    it('parses ## as h2', () => {
      const result = markdown('## Heading 2')
      expect(result).toBe('<h2>Heading 2</h2>')
    })

    it('parses ### as h3', () => {
      const result = markdown('### Heading 3')
      expect(result).toBe('<h3>Heading 3</h3>')
    })

    it('parses #### as h4', () => {
      const result = markdown('#### Heading 4')
      expect(result).toBe('<h4>Heading 4</h4>')
    })

    it('parses ##### as h5', () => {
      const result = markdown('##### Heading 5')
      expect(result).toBe('<h5>Heading 5</h5>')
    })

    it('parses ###### as h6', () => {
      const result = markdown('###### Heading 6')
      expect(result).toBe('<h6>Heading 6</h6>')
    })

    it('requires space after #', () => {
      const result = markdown('#NoSpace')
      expect(result).not.toContain('<h1>')
      expect(result).toContain('<p>')
    })

    it('allows trailing # characters', () => {
      const result = markdown('# Heading #')
      expect(result).toContain('<h1>')
    })

    it('strips trailing # from content', () => {
      const result = markdown('# Heading ###')
      expect(result).toBe('<h1>Heading</h1>')
    })
  })

  describe('Setext Headings', () => {
    it('parses === underline as h1', () => {
      const result = markdown('Heading\n===')
      expect(result).toBe('<h1>Heading</h1>')
    })

    it('parses --- underline as h2', () => {
      const result = markdown('Heading\n---')
      expect(result).toBe('<h2>Heading</h2>')
    })

    it('underline can be any length', () => {
      const result = markdown('Heading\n=')
      expect(result).toBe('<h1>Heading</h1>')
    })

    it('handles multi-line content before underline', () => {
      const result = markdown('Line 1\nLine 2\n===')
      expect(result).toContain('<h1>')
      expect(result).toContain('Line 1')
      expect(result).toContain('Line 2')
    })
  })

  describe('Paragraphs', () => {
    it('wraps text in p tags', () => {
      const result = markdown('Simple paragraph')
      expect(result).toBe('<p>Simple paragraph</p>')
    })

    it('consecutive lines form single paragraph', () => {
      const result = markdown('Line 1\nLine 2')
      expect(result).toBe('<p>Line 1\nLine 2</p>')
    })

    it('blank line separates paragraphs', () => {
      const result = markdown('Para 1\n\nPara 2')
      expect(result).toContain('<p>Para 1</p>')
      expect(result).toContain('<p>Para 2</p>')
    })

    it('trims leading/trailing whitespace', () => {
      const result = markdown('  Text  ')
      expect(result).toBe('<p>Text</p>')
    })
  })

  describe('Block Quotes', () => {
    it('parses > as blockquote', () => {
      const result = markdown('> Quote')
      expect(result).toContain('<blockquote>')
      expect(result).toContain('Quote')
    })

    it('nested > creates nested blockquotes', () => {
      const result = markdown('> Level 1\n>> Level 2')
      expect(result).toContain('<blockquote>')
      expect(result).toMatch(/<blockquote>[\s\S]*<blockquote>/)
    })

    it('lazy continuation without > works', () => {
      const result = markdown('> Line 1\nLine 2')
      expect(result).toContain('<blockquote>')
      // CommonMark lazy continuation: Line 2 should be inside blockquote
      // Both lines should form a single paragraph within the blockquote
      const expectedPattern = /<blockquote>[\s\S]*<p>[\s\S]*Line 1[\s\S]*Line 2[\s\S]*<\/p>[\s\S]*<\/blockquote>/
      expect(result).toMatch(expectedPattern)
    })

    it('lazy continuation stops at blank line', () => {
      const result = markdown('> Line 1\nLine 2\n\nOutside')
      // Verify Line 1 and Line 2 are in blockquote
      expect(result).toMatch(/<blockquote>[\s\S]*Line 1[\s\S]*Line 2[\s\S]*<\/blockquote>/)
      // Verify "Outside" is separate paragraph after blockquote
      expect(result).toMatch(/<\/blockquote>[\s\S]*<p>Outside<\/p>/)
    })

    it('lazy continuation stops at list marker', () => {
      const result = markdown('> Line 1\n- List item')
      expect(result).toMatch(/<blockquote>[\s\S]*<p>Line 1<\/p>[\s\S]*<\/blockquote>/)
      expect(result).toContain('<ul>')
    })

    it('lazy continuation stops at heading', () => {
      const result = markdown('> Line 1\n# Heading')
      expect(result).toMatch(/<blockquote>[\s\S]*<p>Line 1<\/p>[\s\S]*<\/blockquote>/)
      expect(result).toContain('<h1>Heading</h1>')
    })

    it('multiple lazy continuation lines', () => {
      const result = markdown('> Line 1\nLine 2\nLine 3')
      expect(result).toMatch(/<blockquote>[\s\S]*<p>[\s\S]*Line 1[\s\S]*Line 2[\s\S]*Line 3[\s\S]*<\/p>[\s\S]*<\/blockquote>/)
    })

    it('lazy continuation stops at code fence', () => {
      const result = markdown('> Line 1\n```\ncode\n```')
      expect(result).toMatch(/<blockquote>[\s\S]*<p>Line 1<\/p>[\s\S]*<\/blockquote>/)
      expect(result).toContain('<pre><code>')
    })

    it('lazy continuation stops at thematic break', () => {
      const result = markdown('> Line 1\n***')
      expect(result).toMatch(/<blockquote>[\s\S]*<p>Line 1<\/p>[\s\S]*<\/blockquote>/)
      expect(result).toContain('<hr')
    })

    it('lazy continuation stops at indented code', () => {
      const result = markdown('> Line 1\n    code')
      expect(result).toMatch(/<blockquote>[\s\S]*<p>Line 1<\/p>[\s\S]*<\/blockquote>/)
      expect(result).toContain('<pre><code>')
    })

    it('handles multiple paragraphs in quote', () => {
      const result = markdown('> Para 1\n>\n> Para 2')
      expect(result).toContain('<p>Para 1</p>')
      expect(result).toContain('<p>Para 2</p>')
    })
  })

  describe('Unordered Lists', () => {
    it('parses - items as ul/li', () => {
      const result = markdown('- Item 1\n- Item 2')
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>Item 1</li>')
      expect(result).toContain('<li>Item 2</li>')
    })

    it('parses * items as ul/li', () => {
      const result = markdown('* Item 1\n* Item 2')
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>Item 1</li>')
    })

    it('parses + items as ul/li', () => {
      const result = markdown('+ Item 1\n+ Item 2')
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>Item 1</li>')
    })

    it('handles nested lists', () => {
      const result = markdown('- Item 1\n  - Nested')
      expect(result).toContain('<ul>')
      expect(result).toMatch(/<ul>[\s\S]*<ul>/)
    })

    it('handles multi-paragraph list items', () => {
      const result = markdown('- Para 1\n\n  Para 2')
      expect(result).toContain('<p>Para 1</p>')
      expect(result).toContain('<p>Para 2</p>')
    })

    it('distinguishes tight vs loose lists', () => {
      const tight = markdown('- Item 1\n- Item 2')
      const loose = markdown('- Item 1\n\n- Item 2')
      expect(tight).not.toContain('<p>')
      expect(loose).toContain('<p>')
    })
  })

  describe('Ordered Lists', () => {
    it('parses 1. items as ol/li', () => {
      const result = markdown('1. Item 1\n2. Item 2')
      expect(result).toContain('<ol>')
      expect(result).toContain('<li>Item 1</li>')
    })

    it('parses any number start', () => {
      const result = markdown('5. Item')
      expect(result).toContain('<ol')
    })

    it('sets start attribute for non-1 start', () => {
      const result = markdown('5. Item')
      expect(result).toContain('start="5"')
    })

    it('handles nested ordered lists', () => {
      const result = markdown('1. Item 1\n   1. Nested')
      expect(result).toMatch(/<ol>[\s\S]*<ol>/)
    })

    it('handles mixed ordered/unordered nesting', () => {
      const result = markdown('1. Ordered\n   - Unordered')
      expect(result).toContain('<ol>')
      expect(result).toContain('<ul>')
    })
  })

  describe('Fenced Code Blocks', () => {
    it('parses ``` as code block', () => {
      const result = markdown('```\ncode\n```')
      expect(result).toContain('<pre><code>')
      expect(result).toContain('code')
    })

    it('parses ~~~ as code block', () => {
      const result = markdown('~~~\ncode\n~~~')
      expect(result).toContain('<pre><code>')
    })

    it('captures language hint', () => {
      const result = markdown('```javascript\ncode\n```')
      expect(result).toContain('language-javascript')
    })

    it('adds language-X class to code tag', () => {
      const result = markdown('```python\ncode\n```')
      expect(result).toContain('class="language-python"')
    })

    it('preserves whitespace in code', () => {
      const result = markdown('```\n  indented\n```')
      expect(result).toContain('  indented')
    })

    it('escapes HTML in code content', () => {
      const result = markdown('```\n<div>test</div>\n```')
      expect(result).toContain('&lt;div&gt;')
    })

    it('handles empty code blocks', () => {
      const result = markdown('```\n```')
      expect(result).toContain('<pre><code>')
    })
  })

  describe('Indented Code Blocks', () => {
    it('parses 4-space indent as code', () => {
      const result = markdown('    code line')
      expect(result).toContain('<pre><code>')
      expect(result).toContain('code line')
    })

    it('preserves relative indentation', () => {
      const result = markdown('      indented more')
      expect(result).toContain('  indented more')
    })

    it('consecutive indented lines form single block', () => {
      const result = markdown('    line 1\n    line 2')
      expect(result).toContain('line 1')
      expect(result).toContain('line 2')
    })
  })

  describe('Thematic Breaks', () => {
    it('parses --- as hr', () => {
      const result = markdown('---')
      expect(result).toContain('<hr')
    })

    it('parses *** as hr', () => {
      const result = markdown('***')
      expect(result).toContain('<hr')
    })

    it('parses ___ as hr', () => {
      const result = markdown('___')
      expect(result).toContain('<hr')
    })

    it('requires 3+ characters', () => {
      const result = markdown('--')
      expect(result).not.toContain('<hr')
    })

    it('allows spaces between characters', () => {
      const result = markdown('- - -')
      expect(result).toContain('<hr')
    })
  })

  describe('HTML Blocks', () => {
    it('passes through HTML blocks', () => {
      const result = markdown('<div>content</div>', { sanitize: false })
      expect(result).toContain('<div>content</div>')
    })

    it('recognizes block-level tags', () => {
      const result = markdown('<section>test</section>', { sanitize: false })
      expect(result).toContain('<section>')
    })

    it('handles self-closing tags', () => {
      const result = markdown('<br />', { sanitize: false })
      expect(result).toContain('<br')
    })

    it('sanitizes when sanitize: true', () => {
      const result = markdown('<script>alert(1)</script>')
      expect(result).not.toContain('<script>')
    })
  })
})
