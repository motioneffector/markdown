import { describe, it, expect } from 'vitest'
import { markdown } from './markdown'

describe('GFM Extensions', () => {
  describe('Tables', () => {
    it('parses pipe table syntax', () => {
      const result = markdown('| A | B |\n|---|---|\n| 1 | 2 |')
      expect(result).toContain('<table>')
    })

    it('creates table, thead, tbody', () => {
      const result = markdown('| Header |\n|--------|\n| Cell   |')
      expect(result).toContain('<thead>')
      expect(result).toContain('<tbody>')
    })

    it('handles header row', () => {
      const result = markdown('| Col1 | Col2 |\n|------|------|\n| A | B |')
      expect(result).toContain('<th>Col1</th>')
      expect(result).toContain('<th>Col2</th>')
    })

    it('handles alignment :---, :---:, ---:', () => {
      const result = markdown('| L | C | R |\n|:---|:---:|---:|\n| 1 | 2 | 3 |')
      expect(result).toContain('text-align')
    })

    it('applies text-align styles', () => {
      const result = markdown('| L | C | R |\n|:---|:---:|---:|\n| 1 | 2 | 3 |')
      expect(result).toMatch(/text-align:\s*left/)
      expect(result).toMatch(/text-align:\s*center/)
      expect(result).toMatch(/text-align:\s*right/)
    })

    it('handles missing cells', () => {
      const result = markdown('| A | B |\n|---|---|\n| 1 |')
      expect(result).toContain('<td>1</td>')
    })

    it('handles extra cells (ignored)', () => {
      const result = markdown('| A |\n|---|\n| 1 | 2 | 3 |')
      expect(result).toContain('<td>1</td>')
    })

    it('handles escaped pipes', () => {
      const result = markdown('| A \\| B |\n|-------|\n| C |')
      expect(result).toContain('A | B')
    })
  })

  describe('Strikethrough', () => {
    it('parses ~~text~~ as del tag', () => {
      const result = markdown('~~deleted~~')
      expect(result).toContain('<del>deleted</del>')
    })

    it('handles strikethrough with other formatting', () => {
      const result = markdown('~~**bold deleted**~~')
      expect(result).toContain('<del>')
      expect(result).toContain('<strong>')
    })
  })

  describe('Task Lists', () => {
    it('parses - [ ] as unchecked checkbox', () => {
      const result = markdown('- [ ] Task')
      expect(result).toContain('<input')
      expect(result).toContain('type="checkbox"')
      expect(result).not.toContain('checked')
    })

    it('parses - [x] as checked checkbox', () => {
      const result = markdown('- [x] Done')
      expect(result).toContain('<input')
      expect(result).toContain('checked')
    })

    it('checkbox is disabled input', () => {
      const result = markdown('- [ ] Task')
      expect(result).toContain('disabled')
    })

    it('adds task-list-item class', () => {
      const result = markdown('- [ ] Task')
      expect(result).toContain('task-list-item')
    })
  })

  describe('Autolinks (Extended)', () => {
    it('parses www.example.com as link', () => {
      const result = markdown('Visit www.example.com')
      expect(result).toContain('<a href="http://www.example.com">www.example.com</a>')
    })

    it('parses https:// URLs without angle brackets', () => {
      const result = markdown('Visit https://example.com')
      expect(result).toContain('<a href="https://example.com">https://example.com</a>')
    })

    it('parses http:// URLs', () => {
      const result = markdown('Visit http://example.com')
      expect(result).toContain('<a href="http://example.com">http://example.com</a>')
    })

    it('parses email addresses', () => {
      const result = markdown('Email user@example.com')
      expect(result).toContain('<a href="mailto:user@example.com">user@example.com</a>')
    })

    it('stops at punctuation correctly', () => {
      const result = markdown('Visit www.example.com.')
      expect(result).toContain('www.example.com</a>.')
    })
  })

  describe('Disallowed Raw HTML', () => {
    it('escapes script tags even when sanitize: false', () => {
      const result = markdown('<script>alert(1)</script>', { sanitize: false })
      expect(result).not.toContain('<script>')
    })

    it('escapes style tags', () => {
      const result = markdown('<style>body{}</style>', { sanitize: false })
      expect(result).not.toContain('<style>')
    })

    it('escapes iframe tags', () => {
      const result = markdown('<iframe src="evil"></iframe>', { sanitize: false })
      expect(result).not.toContain('<iframe>')
    })

    it('escapes object tags', () => {
      const result = markdown('<object data="evil"></object>', { sanitize: false })
      expect(result).not.toContain('<object>')
    })

    it('escapes embed tags', () => {
      const result = markdown('<embed src="evil">', { sanitize: false })
      expect(result).not.toContain('<embed>')
    })
  })
})

describe('Sanitization', () => {
  describe('Dangerous Content Removed', () => {
    it('strips script tags entirely', () => {
      const result = markdown('<script>alert("xss")</script>')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('strips style tags entirely', () => {
      const result = markdown('<style>body { color: red; }</style>')
      expect(result).not.toContain('<style>')
    })

    it('strips event handlers (onclick, etc)', () => {
      const result = markdown('<div onclick="alert(1)">text</div>')
      expect(result).not.toContain('onclick')
    })

    it('strips javascript: URLs', () => {
      const result = markdown('[link](javascript:alert(1))')
      expect(result).not.toContain('javascript:')
    })

    it('strips data: URLs (except safe images)', () => {
      const result = markdown('[link](data:text/html,<script>alert(1)</script>)')
      expect(result).not.toContain('data:text/html')
    })

    it('strips vbscript: URLs', () => {
      const result = markdown('[link](vbscript:msgbox(1))')
      expect(result).not.toContain('vbscript:')
    })

    it('strips on* attributes', () => {
      const result = markdown('<img src="x" onerror="alert(1)">')
      expect(result).not.toContain('onerror')
    })
  })

  describe('Safe Content Allowed', () => {
    it('allows basic formatting tags', () => {
      const result = markdown('<strong>bold</strong>')
      expect(result).toContain('<strong>')
    })

    it('allows structural tags', () => {
      const result = markdown('<div>content</div>', { sanitize: true })
      expect(result).toContain('<div>')
    })

    it('allows list tags', () => {
      const result = markdown('<ul><li>item</li></ul>')
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>')
    })

    it('allows table tags', () => {
      const result = markdown('<table><tr><td>cell</td></tr></table>')
      expect(result).toContain('<table>')
    })

    it('allows links with http/https', () => {
      const result = markdown('[link](https://example.com)')
      expect(result).toContain('<a href="https://example.com">')
    })

    it('allows images with http/https', () => {
      const result = markdown('![img](https://example.com/img.png)')
      expect(result).toContain('<img')
      expect(result).toContain('src="https://example.com/img.png"')
    })

    it('allows headings', () => {
      const result = markdown('# Heading')
      expect(result).toContain('<h1>')
    })

    it('allows blockquotes', () => {
      const result = markdown('> Quote')
      expect(result).toContain('<blockquote>')
    })
  })

  describe('sanitize: false', () => {
    it('passes through all HTML', () => {
      const result = markdown('<custom-element>content</custom-element>', { sanitize: false })
      expect(result).toContain('<custom-element>')
    })

    it('still escapes GFM-disallowed tags', () => {
      const result = markdown('<script>code</script>', { sanitize: false })
      expect(result).not.toContain('<script>')
    })

    it('preserves script content', () => {
      const result = markdown('<script>alert(1)</script>', { sanitize: false })
      expect(result).toContain('alert(1)')
    })
  })
})
