import type { MarkdownOptions } from './types'
import { escapeHtml, sanitizeUrl, isDangerousTag, isBlankLine } from './utils'

/**
 * Convert markdown text to HTML
 *
 * @param input - Markdown text to parse
 * @param options - Parsing options
 * @returns HTML string
 *
 * @example
 * ```typescript
 * const html = markdown('# Hello **world**')
 * // <h1>Hello <strong>world</strong></h1>
 * ```
 */
export function markdown(input: string, options?: MarkdownOptions): string {
  const opts: Required<MarkdownOptions> = {
    gfm: options?.gfm !== undefined ? options.gfm : true,
    sanitize: options?.sanitize !== undefined ? options.sanitize : true,
    breaks: options?.breaks !== undefined ? options.breaks : false,
    linkTarget: options?.linkTarget || '',
  }

  if (input === '') {
    return ''
  }

  // Parse blocks
  const blocks = parseBlocks(input, opts)

  // Render blocks to HTML
  return blocks.map(block => renderBlock(block, opts)).join('\n')
}

interface Block {
  type: string
  [key: string]: unknown
}

function parseBlocks(input: string, opts: Required<MarkdownOptions>): Block[] {
  const lines = input.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Skip blank lines at document start/between blocks
    if (isBlankLine(line)) {
      i++
      continue
    }

    // ATX Headings: # Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/)
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      })
      i++
      continue
    }

    // Fenced code blocks
    const fenceMatch = line.match(/^(`{3,}|~{3,})(.*)$/)
    if (fenceMatch) {
      const fence = fenceMatch[1]
      const language = fenceMatch[2].trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith(fence[0].repeat(fence.length))) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push({
        type: 'code',
        language,
        code: codeLines.join('\n'),
      })
      i++ // skip closing fence
      continue
    }

    // Thematic break: ---, ***, ___
    if (/^(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/.test(line)) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // Unordered list
    if (/^[\*\-\+]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[\*\-\+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[\*\-\+]\s/, ''))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      const firstNum = parseInt(line.match(/^(\d+)\./)![1], 10)
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      blocks.push({ type: 'ol', items, start: firstNum })
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i].startsWith('>'))) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      const quoteContent = quoteLines.join('\n')
      blocks.push({ type: 'blockquote', content: quoteContent })
      continue
    }

    // GFM Table
    if (opts.gfm && /\|/.test(line) && i + 1 < lines.length) {
      const nextLine = lines[i + 1]
      if (/^\|?[\s\-:|]+\|?$/.test(nextLine)) {
        const headerCells = line
          .split('|')
          .filter(c => c.trim())
          .map(c => c.trim())
        const alignRow = nextLine
        const rows: string[][] = []

        i += 2 // skip header and alignment rows
        while (i < lines.length && /\|/.test(lines[i])) {
          const cells = lines[i]
            .split('|')
            .filter(c => c.trim())
            .map(c => c.trim())
          rows.push(cells)
          i++
        }

        blocks.push({
          type: 'table',
          header: headerCells,
          alignRow,
          rows,
        })
        continue
      }
    }

    // Paragraph - collect consecutive non-blank lines
    const paraLines: string[] = []
    while (i < lines.length && !isBlankLine(lines[i]) && !isBlockStart(lines[i], opts)) {
      paraLines.push(lines[i])
      i++
    }

    if (paraLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: paraLines.join('\n'),
      })
    }
  }

  return blocks
}

function isBlockStart(line: string, opts: Required<MarkdownOptions>): boolean {
  return (
    /^#{1,6}\s/.test(line) || // heading
    /^[`~]{3,}/.test(line) || // code fence
    /^[\*\-\+]\s/.test(line) || // ul
    /^\d+\.\s/.test(line) || // ol
    line.startsWith('> ') || // blockquote
    /^(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/.test(line) || // hr
    (opts.gfm && /\|/.test(line)) // table
  )
}

function renderBlock(block: Block, opts: Required<MarkdownOptions>): string {
  switch (block.type) {
    case 'heading': {
      const level = block.level as number
      const text = processInline(block.text as string, opts)
      return `<h${level}>${text}</h${level}>`
    }

    case 'paragraph': {
      const text = processInline(block.text as string, opts)
      return `<p>${text}</p>`
    }

    case 'code': {
      const language = block.language as string
      const code = escapeHtml(block.code as string)
      const className = language ? ` class="language-${language}"` : ''
      return `<pre><code${className}>${code}</code></pre>`
    }

    case 'hr':
      return '<hr />'

    case 'ul': {
      const items = (block.items as string[]).map(item => {
        const content = processInline(item, opts)
        return `<li>${content}</li>`
      })
      return `<ul>\n${items.join('\n')}\n</ul>`
    }

    case 'ol': {
      const start = block.start as number
      const startAttr = start !== 1 ? ` start="${start}"` : ''
      const items = (block.items as string[]).map(item => {
        const content = processInline(item, opts)
        return `<li>${content}</li>`
      })
      return `<ol${startAttr}>\n${items.join('\n')}\n</ol>`
    }

    case 'blockquote': {
      const content = markdown(block.content as string, opts)
      return `<blockquote>\n${content}\n</blockquote>`
    }

    case 'table': {
      const header = (block.header as string[]).map(cell => `<th>${processInline(cell, opts)}</th>`).join('')
      const rows = (block.rows as string[][])
        .map(row => {
          const cells = row.map(cell => `<td>${processInline(cell, opts)}</td>`).join('')
          return `<tr>${cells}</tr>`
        })
        .join('\n')
      return `<table>\n<thead>\n<tr>${header}</tr>\n</thead>\n<tbody>\n${rows}\n</tbody>\n</table>`
    }

    default:
      return ''
  }
}

function processInline(text: string, opts: Required<MarkdownOptions>): string {
  let result = text

  // Code spans first (to protect their content from other processing)
  result = result.replace(/`([^`]+)`/g, (_, code) => {
    return `<code>${escapeHtml(code)}</code>`
  })

  // Images: ![alt](src)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const safeSrc = opts.sanitize ? sanitizeUrl(src.trim()) : src.trim()
    if (!safeSrc) return ''
    return `<img src="${escapeHtml(safeSrc)}" alt="${escapeHtml(alt)}" />`
  })

  // Links: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const safeUrl = opts.sanitize ? sanitizeUrl(url.trim()) : url.trim()
    if (!safeUrl) return text
    const target = opts.linkTarget ? ` target="${opts.linkTarget}"` : ''
    return `<a href="${escapeHtml(safeUrl)}"${target}>${processInline(text, opts)}</a>`
  })

  // Bold: **text** or __text__
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>')

  // Italic: *text* or _text_
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  result = result.replace(/_([^_]+)_/g, '<em>$1</em>')

  // GFM Strikethrough: ~~text~~
  if (opts.gfm) {
    result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  }

  // Hard line breaks
  if (opts.breaks) {
    result = result.replace(/\n/g, '<br />\n')
  } else {
    result = result.replace(/  \n/g, '<br />\n')
    result = result.replace(/\\\n/g, '<br />\n')
  }

  // Autolinks: <url>
  result = result.replace(/<(https?:\/\/[^>]+)>/g, '<a href="$1">$1</a>')
  result = result.replace(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g, '<a href="mailto:$1">$1</a>')

  // GFM Extended autolinks
  if (opts.gfm) {
    result = result.replace(/\b(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')
    result = result.replace(/\b(www\.[^\s<]+)/g, '<a href="http://$1">$1</a>')
  }

  // Escape dangerous HTML if sanitize is enabled
  if (opts.sanitize) {
    result = sanitizeHtml(result)
  }

  return result
}

function sanitizeHtml(html: string): string {
  // Remove dangerous tags even if sanitize:false (GFM requirement)
  const dangerous = ['script', 'style', 'iframe', 'object', 'embed']
  for (const tag of dangerous) {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi')
    html = html.replace(regex, '')
    html = html.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '')
  }

  // Remove event handlers
  html = html.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')

  return html
}
