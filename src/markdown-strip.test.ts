import { describe, it, expect } from 'vitest'
import { markdownStrip } from './markdown-strip'
import { markdown } from './markdown'

describe('markdownStrip()', () => {
  describe('Preset: plaintext', () => {
    it('removes all HTML tags', () => {
      const input = markdown('**bold** and *italic*')
      const result = markdownStrip(input, 'plaintext')
      expect(result).not.toContain('<')
      expect(result).not.toContain('>')
    })

    it('keeps text content', () => {
      const input = markdown('**bold** text')
      const result = markdownStrip(input, 'plaintext')
      expect(result).toContain('bold')
      expect(result).toContain('text')
    })

    it('removes images entirely', () => {
      const input = markdown('![alt](img.png)')
      const result = markdownStrip(input, 'plaintext')
      expect(result).not.toContain('alt')
      expect(result).not.toContain('img')
    })

    it('keeps link text, removes href', () => {
      const input = markdown('[text](url)')
      const result = markdownStrip(input, 'plaintext')
      expect(result).toContain('text')
      expect(result).not.toContain('url')
    })
  })

  describe('Preset: inline', () => {
    it('allows strong, em, code, a, br', () => {
      const input = markdown('**bold** *italic* `code` [link](url)')
      const result = markdownStrip(input, 'inline')
      expect(result).toContain('<strong>')
      expect(result).toContain('<em>')
      expect(result).toContain('<code>')
      expect(result).toContain('<a')
    })

    it('strips block elements', () => {
      const input = markdown('# Heading\n\nParagraph')
      const result = markdownStrip(input, 'inline')
      expect(result).not.toContain('<h1>')
      expect(result).not.toContain('<p>')
    })

    it('strips images', () => {
      const input = markdown('![alt](img.png)')
      const result = markdownStrip(input, 'inline')
      expect(result).not.toContain('<img')
    })
  })

  describe('Preset: safe', () => {
    it('allows p, strong, em, code, pre, lists, headings', () => {
      const input = markdown('# H1\n\n**bold** *italic* `code`\n\n- list')
      const result = markdownStrip(input, 'safe')
      expect(result).toContain('<h1>')
      expect(result).toContain('<strong>')
      expect(result).toContain('<em>')
      expect(result).toContain('<code>')
      expect(result).toContain('<ul>')
    })

    it('strips links (no a tag)', () => {
      const input = markdown('[link](url)')
      const result = markdownStrip(input, 'safe')
      expect(result).not.toContain('<a')
      expect(result).toContain('link')
    })

    it('strips images', () => {
      const input = markdown('![alt](img.png)')
      const result = markdownStrip(input, 'safe')
      expect(result).not.toContain('<img')
    })
  })

  describe('Preset: prose', () => {
    it('allows p, strong, em, a, blockquote, headings, lists, br', () => {
      const input = markdown('# H1\n\n**bold** [link](url)\n\n> quote\n\n- item')
      const result = markdownStrip(input, 'prose')
      expect(result).toContain('<h1>')
      expect(result).toContain('<strong>')
      expect(result).toContain('<a')
      expect(result).toContain('<blockquote>')
      expect(result).toContain('<ul>')
    })

    it('strips code, pre, table, img', () => {
      const input = markdown('`code` ![img](url)')
      const result = markdownStrip(input, 'prose')
      expect(result).not.toContain('<code>')
      expect(result).not.toContain('<img')
    })
  })

  describe('Custom Allowlist', () => {
    it('allow option permits only listed tags', () => {
      const input = '<p><strong>bold</strong> <em>italic</em></p>'
      const result = markdownStrip(input, { allow: ['strong'] })
      expect(result).toContain('<strong>')
      expect(result).not.toContain('<em>')
      expect(result).not.toContain('<p>')
    })

    it('unlisted tags are stripped', () => {
      const input = '<div><span>text</span></div>'
      const result = markdownStrip(input, { allow: ['div'] })
      expect(result).toContain('<div>')
      expect(result).not.toContain('<span>')
    })

    it('text content preserved by default', () => {
      const input = '<p><strong>bold</strong></p>'
      const result = markdownStrip(input, { allow: ['p'] })
      expect(result).toContain('bold')
    })
  })

  describe('Custom Blocklist', () => {
    it('strip option removes listed tags', () => {
      const input = '<p><strong>bold</strong> <em>italic</em></p>'
      const result = markdownStrip(input, { strip: ['strong'] })
      expect(result).not.toContain('<strong>')
      expect(result).toContain('<em>')
      expect(result).toContain('<p>')
    })

    it('other tags preserved', () => {
      const input = '<div><span>text</span></div>'
      const result = markdownStrip(input, { strip: ['span'] })
      expect(result).toContain('<div>')
      expect(result).not.toContain('<span>')
    })

    it('cannot use allow and strip together', () => {
      expect(() => {
        markdownStrip('<p>text</p>', { allow: ['p'], strip: ['em'] })
      }).toThrow('Cannot use both')
    })
  })

  describe('Unwrap Option', () => {
    it('unwrap: true keeps inner text (default)', () => {
      const input = '<a href="url">link text</a>'
      const result = markdownStrip(input, { strip: ['a'], unwrap: true })
      expect(result).not.toContain('<a')
      expect(result).toContain('link text')
    })

    it('unwrap: false removes tag and content', () => {
      const input = '<script>alert(1)</script>'
      const result = markdownStrip(input, { strip: ['script'], unwrap: false })
      expect(result).not.toContain('script')
      expect(result).not.toContain('alert')
    })

    it('dangerous tags always removed regardless of unwrap', () => {
      const input = '<script>code</script>'
      const result = markdownStrip(input, { unwrap: true })
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('code')
    })
  })
})

describe('Output Format', () => {
  describe('Clean HTML', () => {
    it('no unnecessary whitespace', () => {
      const result = markdown('**bold**')
      expect(result).not.toMatch(/\s\s+/)
    })

    it('no wrapper div', () => {
      const result = markdown('Text')
      expect(result).not.toContain('<div>')
    })

    it('consistent newlines between blocks', () => {
      const result = markdown('Para 1\n\nPara 2')
      expect(result).toMatch(/<p>Para 1<\/p>\n<p>Para 2<\/p>/)
    })

    it('self-closing void elements (br, hr, img)', () => {
      const br = markdown('Line 1  \nLine 2')
      const hr = markdown('---')
      const img = markdown('![alt](img.png)')
      expect(br).toMatch(/<br\s*\/?>/)
      expect(hr).toMatch(/<hr\s*\/?>/)
      expect(img).toMatch(/<img[^>]*\/?>/)
    })
  })
})
