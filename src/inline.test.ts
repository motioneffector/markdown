import { describe, it, expect } from 'vitest'
import { markdown } from './markdown'

describe('Inline Elements', () => {
  describe('Emphasis', () => {
    it('parses *text* as em', () => {
      const result = markdown('*italic*')
      expect(result).toContain('<em>italic</em>')
    })

    it('parses _text_ as em', () => {
      const result = markdown('_italic_')
      expect(result).toContain('<em>italic</em>')
    })

    it('parses **text** as strong', () => {
      const result = markdown('**bold**')
      expect(result).toContain('<strong>bold</strong>')
    })

    it('parses __text__ as strong', () => {
      const result = markdown('__bold__')
      expect(result).toContain('<strong>bold</strong>')
    })

    it('parses ***text*** as strong+em', () => {
      const result = markdown('***both***')
      expect(result).toContain('<strong>')
      expect(result).toContain('<em>')
    })

    it('handles emphasis in middle of word', () => {
      const result = markdown('un*frigging*believable')
      expect(result).toContain('<em>frigging</em>')
    })

    it('handles nested emphasis', () => {
      const result = markdown('**bold with *italic***')
      expect(result).toContain('<strong>')
      expect(result).toContain('<em>')
    })

    it('handles mismatched delimiters correctly', () => {
      const result = markdown('*text**')
      expect(result).not.toContain('<strong>')
    })
  })

  describe('Code Spans', () => {
    it('parses `code` as code tag', () => {
      const result = markdown('`code`')
      expect(result).toContain('<code>code</code>')
    })

    it('handles backticks inside with double ``', () => {
      const result = markdown('``code with ` tick``')
      expect(result).toContain('code with ` tick')
    })

    it('strips single leading/trailing space', () => {
      const result = markdown('` code `')
      expect(result).toContain('<code>code</code>')
    })

    it('preserves internal whitespace', () => {
      const result = markdown('`a  b`')
      expect(result).toContain('a  b')
    })
  })

  describe('Links', () => {
    it('parses [text](url) as anchor', () => {
      const result = markdown('[link](http://example.com)')
      expect(result).toContain('<a href="http://example.com">link</a>')
    })

    it('parses [text](url "title") with title', () => {
      const result = markdown('[link](url "my title")')
      expect(result).toContain('title="my title"')
    })

    it('handles parentheses in URLs', () => {
      const result = markdown('[link](http://example.com/path(foo))')
      expect(result).toContain('http://example.com/path(foo)')
    })

    it('handles angle bracket URLs <url>', () => {
      const result = markdown('[link](<http://example.com>)')
      expect(result).toContain('http://example.com')
    })

    it('escapes special characters in URL', () => {
      const result = markdown('[link](http://example.com?a=1&b=2)')
      expect(result).toContain('href="http://example.com?a=1&amp;b=2"')
    })
  })

  describe('Reference Links', () => {
    it('parses [text][ref] with definition', () => {
      const result = markdown('[link][ref]\n\n[ref]: http://example.com')
      expect(result).toContain('<a href="http://example.com">link</a>')
    })

    it('parses [text][] with implicit ref', () => {
      const result = markdown('[link][]\n\n[link]: http://example.com')
      expect(result).toContain('<a href="http://example.com">link</a>')
    })

    it('parses [text] with implicit ref', () => {
      const result = markdown('[link]\n\n[link]: http://example.com')
      expect(result).toContain('<a href="http://example.com">link</a>')
    })

    it('link definitions not rendered', () => {
      const result = markdown('[ref]: http://example.com\n\nText')
      expect(result).not.toContain('[ref]')
      expect(result).not.toContain('http://example.com')
    })

    it('case-insensitive reference matching', () => {
      const result = markdown('[LINK]\n\n[link]: http://example.com')
      expect(result).toContain('<a href="http://example.com">LINK</a>')
    })
  })

  describe('Images', () => {
    it('parses ![alt](src) as img', () => {
      const result = markdown('![alt text](image.png)')
      expect(result).toContain('<img')
      expect(result).toContain('src="image.png"')
      expect(result).toContain('alt="alt text"')
    })

    it('parses ![alt](src "title") with title', () => {
      const result = markdown('![alt](img.png "Title")')
      expect(result).toContain('title="Title"')
    })

    it('handles reference-style images', () => {
      const result = markdown('![alt][ref]\n\n[ref]: image.png')
      expect(result).toContain('<img')
      expect(result).toContain('src="image.png"')
    })

    it('escapes alt text', () => {
      const result = markdown('![<script>](img.png)')
      expect(result).toContain('&lt;script&gt;')
    })
  })

  describe('Autolinks', () => {
    it('parses <https://url> as link', () => {
      const result = markdown('<https://example.com>')
      expect(result).toContain('<a href="https://example.com">https://example.com</a>')
    })

    it('parses <email@domain> as mailto link', () => {
      const result = markdown('<user@example.com>')
      expect(result).toContain('<a href="mailto:user@example.com">')
    })
  })

  describe('Hard Line Breaks', () => {
    it('two spaces at line end creates br', () => {
      const result = markdown('Line 1  \nLine 2')
      expect(result).toContain('<br')
    })

    it('backslash at line end creates br', () => {
      const result = markdown('Line 1\\\nLine 2')
      expect(result).toContain('<br')
    })

    it('single space does not create br', () => {
      const result = markdown('Line 1 \nLine 2')
      expect(result).not.toContain('<br')
    })
  })

  describe('Escapes', () => {
    it('backslash escapes special characters', () => {
      const result = markdown('\\*not italic\\*')
      expect(result).not.toContain('<em>')
      expect(result).toContain('*not italic*')
    })

    it('\\* produces literal asterisk', () => {
      const result = markdown('\\*')
      expect(result).toContain('*')
      expect(result).not.toContain('<em>')
    })

    it('\\[ produces literal bracket', () => {
      const result = markdown('\\[not a link\\]')
      expect(result).toContain('[not a link]')
      expect(result).not.toContain('<a')
    })

    it('\\` produces literal backtick', () => {
      const result = markdown('\\`not code\\`')
      expect(result).toContain('`not code`')
      expect(result).not.toContain('<code>')
    })

    it('backslash before non-special is preserved', () => {
      const result = markdown('\\a')
      expect(result).toContain('\\a')
    })
  })

  describe('Backslash escapes - extended ASCII punctuation', () => {
    it('escapes double quote', () => {
      const result = markdown('foo \\"bar\\"')
      expect(result).toBe('<p>foo "bar"</p>')
    })

    it('escapes dollar sign', () => {
      const result = markdown('\\$100')
      expect(result).toBe('<p>$100</p>')
    })

    it('escapes percent', () => {
      const result = markdown('50\\% off')
      expect(result).toBe('<p>50% off</p>')
    })

    it('escapes ampersand', () => {
      const result = markdown('foo \\& bar')
      expect(result).toContain('&')
    })

    it('escapes apostrophe', () => {
      const result = markdown("don\\'t")
      expect(result).toContain("'")
    })

    it('escapes forward slash', () => {
      const result = markdown('path\\/to\\/file')
      expect(result).toBe('<p>path/to/file</p>')
    })

    it('escapes colon', () => {
      const result = markdown('foo\\: bar')
      expect(result).toBe('<p>foo: bar</p>')
    })

    it('escapes semicolon', () => {
      const result = markdown('foo\\; bar')
      expect(result).toBe('<p>foo; bar</p>')
    })

    it('escapes angle brackets', () => {
      const result = markdown('\\<foo\\>')
      expect(result).toContain('<')
      expect(result).toContain('>')
    })

    it('escapes equals', () => {
      const result = markdown('x \\= y')
      expect(result).toBe('<p>x = y</p>')
    })

    it('escapes question mark', () => {
      const result = markdown('foo\\? bar')
      expect(result).toBe('<p>foo? bar</p>')
    })

    it('escapes at sign', () => {
      const result = markdown('foo\\@bar')
      expect(result).toBe('<p>foo@bar</p>')
    })

    it('escapes caret', () => {
      const result = markdown('x\\^2')
      expect(result).toBe('<p>x^2</p>')
    })

    it('escapes comma', () => {
      const result = markdown('one\\, two')
      expect(result).toBe('<p>one, two</p>')
    })

    it('escapes all new ASCII punctuation together', () => {
      const input = '\\"\\ \\$\\%\\&\\\'\\,\\/\\:\\;\\<\\=\\>\\?\\@\\^'
      const result = markdown(input)
      // Should contain unescaped versions of all these characters
      expect(result).toContain('"')
      expect(result).toContain('$')
      expect(result).toContain('%')
      expect(result).toContain('&')
      expect(result).toContain("'")
      expect(result).toContain(',')
      expect(result).toContain('/')
      expect(result).toContain(':')
      expect(result).toContain(';')
      expect(result).toContain('=')
      expect(result).toContain('?')
      expect(result).toContain('@')
      expect(result).toContain('^')
    })
  })

  describe('HTML Entities', () => {
    it('converts &amp; to &', () => {
      const result = markdown('&amp;')
      expect(result).toContain('&')
    })

    it('converts &lt; to <', () => {
      const result = markdown('&lt;')
      expect(result).toContain('&lt;')
    })

    it('converts &gt; to >', () => {
      const result = markdown('&gt;')
      expect(result).toContain('&gt;')
    })

    it('converts numeric entities &#65;', () => {
      const result = markdown('&#65;')
      expect(result).toContain('A')
    })

    it('converts hex entities &#x41;', () => {
      const result = markdown('&#x41;')
      expect(result).toContain('A')
    })

    it('preserves unknown entities', () => {
      const result = markdown('&unknown;')
      expect(result).toContain('&unknown;')
    })
  })
})
