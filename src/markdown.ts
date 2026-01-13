import type { MarkdownOptions } from './types'
import { escapeHtml, sanitizeUrl, isBlankLine } from './utils'

// Maximum nesting depth to prevent stack overflow and OOM
const MAX_DEPTH = 32

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
// Link definition map type
type LinkDefinitions = Map<string, { url: string; title?: string }>

/**
 * Helper to safely access array elements. Since split('\n') never produces undefined elements
 * but TypeScript's noUncheckedIndexedAccess treats all array access as potentially undefined,
 * this helper provides a type-safe way to access elements we know exist.
 */
function getLine(lines: string[], index: number): string {
  return lines[index] ?? ''
}

export function markdown(input: string, options?: MarkdownOptions): string {
  const opts: Required<MarkdownOptions> = {
    gfm: options?.gfm ?? true,
    sanitize: options?.sanitize ?? true,
    breaks: options?.breaks ?? false,
    linkTarget: options?.linkTarget ?? '',
  }

  if (input === '') {
    return ''
  }

  // Extract link definitions first (two-pass approach for reference links)
  const { text: cleanedInput, definitions } = extractLinkDefinitions(input)

  // Parse blocks with depth tracking
  const blocks = parseBlocks(cleanedInput, opts, 0)

  // Render blocks to HTML with depth tracking
  return blocks.map(block => renderBlock(block, opts, definitions, 0)).join('\n')
}

/**
 * Internal markdown function that tracks recursion depth for blockquotes
 */
function markdownInternal(
  input: string,
  opts: Required<MarkdownOptions>,
  definitions: LinkDefinitions,
  depth: number
): string {
  if (input === '' || depth >= MAX_DEPTH) {
    return depth >= MAX_DEPTH ? `<p>${escapeHtml(input)}</p>` : ''
  }

  // Parse blocks with current depth
  const blocks = parseBlocks(input, opts, depth)

  // Render blocks to HTML
  return blocks.map(block => renderBlock(block, opts, definitions, depth)).join('\n')
}

/**
 * Extract link definitions from the input and return cleaned input
 * Link definitions: [ref]: url "optional title"
 */
function extractLinkDefinitions(input: string): { text: string; definitions: LinkDefinitions } {
  const definitions: LinkDefinitions = new Map()
  const lines = input.split('\n')
  const outputLines: string[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line) {
      outputLines.push(line ?? '')
      i++
      continue
    }
    // Match link definition: [ref]: url or [ref]: url "title"
    const match = line.match(/^\[([^\]]+)\]:\s*(\S+)(?:\s+"([^"]+)")?$/)
    if (match?.[1] && match[2]) {
      const ref = match[1].toLowerCase()
      const url = match[2]
      const title = match[3]
      if (title) {
        definitions.set(ref, { url, title })
      } else {
        definitions.set(ref, { url })
      }
      i++
      continue
    }
    outputLines.push(line)
    i++
  }

  return { text: outputLines.join('\n'), definitions }
}

interface Block {
  type: string
  [key: string]: unknown
}

function parseBlocks(input: string, opts: Required<MarkdownOptions>, depth: number = 0): Block[] {
  // Prevent excessive nesting - stop parsing if too deep
  if (depth >= MAX_DEPTH) {
    return [{ type: 'paragraph', text: input }]
  }

  const lines = input.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line) {
      i++
      continue
    }

    // Skip blank lines at document start/between blocks
    if (isBlankLine(line)) {
      i++
      continue
    }

    // Setext Headings: Check for === or --- underline ahead
    // Multi-line content is allowed before the underline
    {
      let foundSetextHeading = false
      let j = i
      const headingLines: string[] = []
      while (j < lines.length) {
        const currentLine = lines[j]
        if (!currentLine || isBlankLine(currentLine)) break

        // Check if this line is the underline
        if (/^=+\s*$/.test(currentLine) && headingLines.length > 0) {
          blocks.push({
            type: 'heading',
            level: 1,
            text: headingLines.join('\n').trim(),
          })
          i = j + 1
          foundSetextHeading = true
          break
        }
        const firstHeadingLine = headingLines[0]
        // Check if first line is a thematic break pattern (---, ***, ___)
        const isThematicBreak = firstHeadingLine && /^(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/.test(firstHeadingLine)
        if (/^-+\s*$/.test(currentLine) && headingLines.length > 0 &&
            firstHeadingLine && !/^[*\-+]\s/.test(firstHeadingLine) && !/^\d+\.\s/.test(firstHeadingLine) && !isThematicBreak) {
          blocks.push({
            type: 'heading',
            level: 2,
            text: headingLines.join('\n').trim(),
          })
          i = j + 1
          foundSetextHeading = true
          break
        }
        headingLines.push(currentLine)
        j++
      }
      if (foundSetextHeading) continue
    }

    // ATX Headings: # Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/)
    if (headingMatch?.[1] && headingMatch[2]) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      })
      i++
      continue
    }

    // Indented code blocks (4 spaces)
    if (/^ {4}/.test(line)) {
      const codeLines: string[] = []
      while (i < lines.length) {
        const currentLine = lines[i]
        if (!currentLine) break
        if (!/^ {4}/.test(currentLine) && !isBlankLine(currentLine)) break

        if (/^ {4}/.test(currentLine)) {
          codeLines.push(currentLine.slice(4))
        } else {
          codeLines.push('')
        }
        i++
      }
      // Trim trailing blank lines
      while (codeLines.length > 0 && codeLines[codeLines.length - 1] === '') {
        codeLines.pop()
      }
      blocks.push({
        type: 'code',
        language: '',
        code: codeLines.join('\n'),
      })
      continue
    }

    // Fenced code blocks
    const fenceMatch = line.match(/^(`{3,}|~{3,})(.*)$/)
    if (fenceMatch?.[1] && fenceMatch[2] !== undefined) {
      const fence = fenceMatch[1]
      const fenceChar = fence[0]
      const fenceLen = fence.length
      const language = fenceMatch[2].trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length) {
        const codeLine = getLine(lines, i)
        if (fenceChar && codeLine.startsWith(fenceChar.repeat(fenceLen))) break
        codeLines.push(codeLine)
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
    if (/^[*\-+]\s/.test(line)) {
      const { block: listBlock, consumed } = parseList(lines, i, opts, 'ul', depth + 1)
      blocks.push(listBlock)
      i += consumed
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const { block: listBlock, consumed } = parseList(lines, i, opts, 'ol', depth + 1)
      blocks.push(listBlock)
      i += consumed
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length) {
        const quoteLine = getLine(lines, i)

        // Explicit marker: always include and strip the marker
        if (quoteLine.startsWith('> ') || quoteLine.startsWith('>')) {
          quoteLines.push(quoteLine.replace(/^>\s?/, ''))
          i++
          continue
        }

        // Blank line: end blockquote
        if (isBlankLine(quoteLine)) {
          break
        }

        // Indented code block (4 spaces): no lazy continuation
        if (/^ {4}/.test(quoteLine)) {
          break
        }

        // Block structure marker: no lazy continuation
        if (isBlockStart(quoteLine, opts)) {
          break
        }

        // Otherwise: lazy continuation of paragraph
        quoteLines.push(quoteLine)
        i++
      }
      const quoteContent = quoteLines.join('\n')
      blocks.push({ type: 'blockquote', content: quoteContent })
      continue
    }

    // GFM Table
    if (opts.gfm && /\|/.test(line) && i + 1 < lines.length) {
      const nextLine = getLine(lines, i + 1)
      if (nextLine && /^\|?[\s\-:|]+\|?$/.test(nextLine)) {
        // Split table cells, respecting escaped pipes
        const splitTableCells = (row: string): string[] => {
          const cells: string[] = []
          let current = ''
          let j = 0
          while (j < row.length) {
            if (row[j] === '\\' && j + 1 < row.length && row[j + 1] === '|') {
              // Escaped pipe - keep the pipe as literal
              current += '|'
              j += 2
            } else if (row[j] === '|') {
              cells.push(current.trim())
              current = ''
              j++
            } else {
              const char = row[j]
              if (char !== undefined) current += char
              j++
            }
          }
          cells.push(current.trim())
          // Filter out empty leading/trailing cells from the split
          return cells.filter((c, idx) => c || (idx > 0 && idx < cells.length - 1))
        }

        const headerCells = splitTableCells(line)

        // Parse alignment from the separator row
        const alignCells = nextLine
          .split('|')
          .filter(c => c.trim())
          .map(c => c.trim())

        const alignments: ('left' | 'center' | 'right' | null)[] = alignCells.map((cell: string) => {
          const left = cell.startsWith(':')
          const right = cell.endsWith(':')
          if (left && right) return 'center'
          if (right) return 'right'
          if (left) return 'left'
          return null
        })

        const rows: string[][] = []

        i += 2 // skip header and alignment rows
        while (i < lines.length) {
          const rowLine = getLine(lines, i)
          if (!/\|/.test(rowLine)) break
          const cells = splitTableCells(rowLine)
          rows.push(cells)
          i++
        }

        blocks.push({
          type: 'table',
          header: headerCells,
          alignments,
          rows,
        })
        continue
      }
    }

    // Paragraph - collect consecutive non-blank lines
    const paraLines: string[] = []
    while (i < lines.length) {
      const paraLine = getLine(lines, i)
      if (isBlankLine(paraLine) || isBlockStart(paraLine, opts)) break
      paraLines.push(paraLine)
      i++
    }

    if (paraLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: paraLines.join('\n'),
      })
    } else {
      // Safety: if no block type matched and paraLines is empty,
      // consume the current line as a paragraph to prevent infinite loops
      // (can happen with malformed input like tables without proper separators)
      const currentLine = getLine(lines, i)
      if (currentLine && !isBlankLine(currentLine)) {
        blocks.push({
          type: 'paragraph',
          text: currentLine,
        })
      }
      i++
    }
  }

  return blocks
}

function isBlockStart(line: string, opts: Required<MarkdownOptions>): boolean {
  return (
    /^#{1,6}\s/.test(line) || // heading
    /^[`~]{3,}/.test(line) || // code fence
    /^[*\-+]\s/.test(line) || // ul
    /^\d+\.\s/.test(line) || // ol
    line.startsWith('> ') || // blockquote
    /^(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/.test(line) || // hr
    (opts.gfm && /\|/.test(line)) // table
  )
}

interface ListItem {
  content: string
  children?: Block[]
  checked?: boolean
}

/**
 * Parse a list (ordered or unordered) with support for nesting and loose/tight modes
 */
function parseList(
  lines: string[],
  startIndex: number,
  opts: Required<MarkdownOptions>,
  listType: 'ul' | 'ol',
  depth: number = 0
): { block: Block; consumed: number } {
  const items: ListItem[] = []
  let i = startIndex
  let isLoose = false
  let isTaskList = false
  let startNum = 1

  // Determine list marker pattern
  const isOrderedList = listType === 'ol'
  const listMarkerRegex = isOrderedList ? /^(\d+)\.\s(.*)$/ : /^[*\-+]\s(.*)$/

  // Get the indent for nested content (content under a list item)
  const baseIndent = isOrderedList ? 3 : 2

  while (i < lines.length) {
    const line = getLine(lines, i)

    // Check for list item
    const match = line.match(listMarkerRegex)
    if (match && (isOrderedList ? match[2] !== undefined : match[1] !== undefined)) {
      // Start a new item
      let itemText = isOrderedList ? (match[2] ?? '') : (match[1] ?? '')
      if (isOrderedList && items.length === 0 && match[1]) {
        startNum = parseInt(match[1], 10)
      }

      // Check for task list syntax
      const taskMatch = itemText.match(/^\[([ xX])\]\s(.*)$/)
      let checked: boolean | undefined
      if (taskMatch?.[1] && taskMatch[2]) {
        isTaskList = true
        checked = taskMatch[1].toLowerCase() === 'x'
        itemText = taskMatch[2]
      }

      // Collect content for this item (including continuation lines and nested content)
      const itemLines: string[] = [itemText]
      i++

      // Collect continuation lines and nested content
      while (i < lines.length) {
        const nextLine = getLine(lines, i)

        // Blank line might indicate loose list or end of item
        if (isBlankLine(nextLine)) {
          // Check if there's more content for this item after the blank line
          if (i + 1 < lines.length) {
            const afterBlank = getLine(lines, i + 1)
            // If next non-blank line is indented enough, it's continuation
            const afterIndent = afterBlank.match(/^(\s*)/)?.[1]?.length ?? 0
            if (afterIndent >= baseIndent) {
              isLoose = true
              itemLines.push('')
              i++
              continue
            }
            // If next line is another list item at same level, mark as loose and break
            if (listMarkerRegex.test(afterBlank)) {
              isLoose = true
              i++ // skip the blank line
              break
            }
          }
          break
        }

        // Check if line is indented (continuation or nested)
        const leadingSpaces = nextLine.match(/^(\s*)/)?.[1]?.length ?? 0
        if (leadingSpaces >= baseIndent) {
          // This is continuation content or nested list
          itemLines.push(nextLine.slice(baseIndent))
          i++
          continue
        }

        // Check if this is a new list item at the same level
        if (listMarkerRegex.test(nextLine)) {
          break
        }

        // Not part of this list anymore
        break
      }

      // Parse nested content (could contain nested lists) - but avoid infinite recursion
      const nestedContent = itemLines.join('\n')
      let nestedBlocks: Block[] = []
      if (nestedContent.trim() && nestedContent !== line && depth < MAX_DEPTH) {
        nestedBlocks = parseBlocks(nestedContent, opts, depth + 1)
      }

      items.push({
        content: nestedContent,
        children: nestedBlocks,
        ...(checked !== undefined && { checked }),
      })

      continue
    }

    // Not a list item - end of list
    break
  }

  // Ensure we consumed at least one line to prevent infinite loops
  const consumed = Math.max(1, i - startIndex)

  return {
    block: {
      type: listType,
      items,
      start: startNum,
      isLoose,
      isTaskList,
    },
    consumed,
  }
}

function renderBlock(block: Block, opts: Required<MarkdownOptions>, definitions: LinkDefinitions = new Map(), depth: number = 0): string {
  switch (block.type) {
    case 'heading': {
      const level = block.level
      const text = block.text
      if (typeof level !== 'number' || typeof text !== 'string') return ''
      return `<h${String(level)}>${processInline(text, opts, definitions)}</h${String(level)}>`
    }

    case 'paragraph': {
      const text = block.text
      if (typeof text !== 'string') return ''
      return `<p>${processInline(text.trim(), opts, definitions)}</p>`
    }

    case 'code': {
      const language = block.language
      const code = block.code
      if (typeof code !== 'string') return ''
      const lang = typeof language === 'string' ? language : ''
      const className = lang ? ` class="language-${lang}"` : ''
      return `<pre><code${className}>${escapeHtml(code)}</code></pre>`
    }

    case 'hr':
      return '<hr />'

    case 'ul': {
      const isLoose = Boolean(block.isLoose)
      const items = Array.isArray(block.items) ? (block.items as ListItem[]).map(item => {
        let content: string

        // Render nested blocks if they exist
        if (item.children?.length) {
          const childHtml = item.children.map(child => renderBlock(child, opts, definitions)).join('\n')
          // For loose lists, wrap in <p> tags; for tight lists, just use content
          if (isLoose) {
            content = childHtml
          } else {
            // For tight lists, if there's only a paragraph, unwrap it
            const firstChild = item.children[0]
            if (item.children.length === 1 && firstChild?.type === 'paragraph') {
              const paragraphText = firstChild.text
              content = typeof paragraphText === 'string' ? processInline(paragraphText, opts, definitions) : childHtml
            } else {
              content = childHtml
            }
          }
        } else {
          content = processInline(item.content, opts, definitions)
        }

        // Add checkbox for task list items
        if (item.checked !== undefined) {
          const checkedAttr = item.checked ? ' checked' : ''
          const checkbox = `<input type="checkbox" disabled${checkedAttr} />`
          content = `${checkbox} ${content}`
        }

        const className = item.checked !== undefined ? ' class="task-list-item"' : ''
        return `<li${className}>${content}</li>`
      }) : []
      return `<ul>\n${items.join('\n')}\n</ul>`
    }

    case 'ol': {
      const isLoose = Boolean(block.isLoose)
      const start = typeof block.start === 'number' ? block.start : 1
      const startAttr = start !== 1 ? ` start="${String(start)}"` : ''
      const items = Array.isArray(block.items) ? (block.items as ListItem[]).map(item => {
        let content: string

        // Render nested blocks if they exist
        if (item.children?.length) {
          const childHtml = item.children.map(child => renderBlock(child, opts, definitions)).join('\n')
          // For loose lists, wrap in <p> tags; for tight lists, just use content
          if (isLoose) {
            content = childHtml
          } else {
            // For tight lists, if there's only a paragraph, unwrap it
            const firstChild = item.children[0]
            if (item.children.length === 1 && firstChild?.type === 'paragraph') {
              const paragraphText = firstChild.text
              content = typeof paragraphText === 'string' ? processInline(paragraphText, opts, definitions) : childHtml
            } else {
              content = childHtml
            }
          }
        } else {
          content = processInline(item.content, opts, definitions)
        }

        return `<li>${content}</li>`
      }) : []
      return `<ol${startAttr}>\n${items.join('\n')}\n</ol>`
    }

    case 'blockquote': {
      const content = block.content
      if (typeof content !== 'string') return ''
      // Prevent excessive recursion - if at max depth, escape content
      if (depth >= MAX_DEPTH) {
        return `<blockquote>\n<p>${escapeHtml(content)}</p>\n</blockquote>`
      }
      return `<blockquote>\n${markdownInternal(content, opts, definitions, depth + 1)}\n</blockquote>`
    }

    case 'table': {
      const alignments = Array.isArray(block.alignments) ? (block.alignments as (string | null)[]) : []
      const headerCells = Array.isArray(block.header) ? (block.header as string[]) : []
      const header = headerCells
        .map((cell, i) => {
          const align = alignments[i]
          const alignStr = typeof align === 'string' ? align : null
          const style = alignStr ? ` style="text-align: ${alignStr}"` : ''
          return `<th${style}>${processInline(cell, opts, definitions)}</th>`
        })
        .join('')
      const rowsData = Array.isArray(block.rows) ? (block.rows as string[][]) : []
      const rows = rowsData
        .map(row => {
          const cells = row
            .map((cell, i) => {
              const align = alignments[i]
              const alignStr = typeof align === 'string' ? align : null
              const style = alignStr ? ` style="text-align: ${alignStr}"` : ''
              return `<td${style}>${processInline(cell, opts, definitions)}</td>`
            })
            .join('')
          return `<tr>${cells}</tr>`
        })
        .join('\n')
      return `<table>\n<thead>\n<tr>${header}</tr>\n</thead>\n<tbody>\n${rows}\n</tbody>\n</table>`
    }

    default:
      return ''
  }
}

function processInline(text: string, opts: Required<MarkdownOptions>, definitions: LinkDefinitions = new Map()): string {
  let result = text

  // Step 1: Handle escape sequences FIRST (before any other processing)
  // Store escaped characters temporarily
  const escapes: string[] = []
  result = result.replace(/\\([\\`*_{}[\]()#+\-.!|])/g, (_match: string, char: string) => {
    escapes.push(char)
    return `\x00ESCAPE${String(escapes.length - 1)}\x00`
  })

  // Step 2: Code spans (to protect their content from other processing)
  // Handle double backticks first (can contain single backticks)
  result = result.replace(/``(.+?)``/g, (_match: string, code: string) => {
    // Strip single leading/trailing space if present
    const trimmed = code.replace(/^ (.+) $/, '$1')
    return `<code>${escapeHtml(trimmed)}</code>`
  })
  // Then single backticks (cannot contain backticks)
  result = result.replace(/`([^`]+)`/g, (_match: string, code: string) => {
    // Strip single leading/trailing space if present
    const trimmed = code.replace(/^ (.+) $/, '$1')
    return `<code>${escapeHtml(trimmed)}</code>`
  })

  // Step 3: Images: ![alt](src) or ![alt](src "title")
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_fullMatch: string, alt: string, srcPart: string) => {
    const match = srcPart.match(/^<?([^>\s]+)>?(?:\s+"([^"]+)")?/)
    if (!match?.[1]) return ''
    const src = match[1]
    const title = match[2]
    const safeSrc = opts.sanitize ? sanitizeUrl(src.trim()) : src.trim()
    if (!safeSrc) return ''
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
    return `<img src="${escapeHtml(safeSrc)}" alt="${escapeHtml(alt)}"${titleAttr} />`
  })

  // Step 3b: Reference-style images: ![alt][ref] or ![alt][]
  result = result.replace(/!\[([^\]]*)\]\[([^\]]*)\]/g, (match: string, alt: string, ref: string) => {
    const refKey = (ref || alt).toLowerCase()
    const def = definitions.get(refKey)
    if (!def) return match
    const safeSrc = opts.sanitize ? sanitizeUrl(def.url.trim()) : def.url.trim()
    if (!safeSrc) return match
    const titleAttr = def.title ? ` title="${escapeHtml(def.title)}"` : ''
    return `<img src="${escapeHtml(safeSrc)}" alt="${escapeHtml(alt)}"${titleAttr} />`
  })

  // Step 4: Links: [text](url) or [text](url "title")
  // Handle balanced parentheses in URLs using a function-based approach
  result = parseLinksSmart(result, opts)

  // Step 4b: Reference-style links: [text][ref], [text][], or [text] (shortcut)
  // [text][ref] - explicit reference
  result = result.replace(/\[([^\]]+)\]\[([^\]]+)\]/g, (match: string, linkText: string, ref: string) => {
    const refKey = ref.toLowerCase()
    const def = definitions.get(refKey)
    if (!def) return match
    const safeUrl = opts.sanitize ? sanitizeUrl(def.url.trim()) : def.url.trim()
    if (!safeUrl) return match
    const target = opts.linkTarget ? ` target="${opts.linkTarget}"` : ''
    const titleAttr = def.title ? ` title="${escapeHtml(def.title)}"` : ''
    return `<a href="${escapeHtml(safeUrl)}"${target}${titleAttr}>${linkText}</a>`
  })

  // [text][] - collapsed reference (use text as ref)
  result = result.replace(/\[([^\]]+)\]\[\]/g, (match: string, linkText: string) => {
    const refKey = linkText.toLowerCase()
    const def = definitions.get(refKey)
    if (!def) return match
    const safeUrl = opts.sanitize ? sanitizeUrl(def.url.trim()) : def.url.trim()
    if (!safeUrl) return match
    const target = opts.linkTarget ? ` target="${opts.linkTarget}"` : ''
    const titleAttr = def.title ? ` title="${escapeHtml(def.title)}"` : ''
    return `<a href="${escapeHtml(safeUrl)}"${target}${titleAttr}>${linkText}</a>`
  })

  // [text] - shortcut reference (use text as ref, only if definition exists)
  result = result.replace(/\[([^\]]+)\](?!\[|\()/g, (match: string, linkText: string) => {
    const refKey = linkText.toLowerCase()
    const def = definitions.get(refKey)
    if (!def) return match
    const safeUrl = opts.sanitize ? sanitizeUrl(def.url.trim()) : def.url.trim()
    if (!safeUrl) return match
    const target = opts.linkTarget ? ` target="${opts.linkTarget}"` : ''
    const titleAttr = def.title ? ` title="${escapeHtml(def.title)}"` : ''
    return `<a href="${escapeHtml(safeUrl)}"${target}${titleAttr}>${linkText}</a>`
  })

  // Step 5: Autolinks: <url> and <email>
  result = result.replace(/<(https?:\/\/[^>]+)>/g, '<a href="$1">$1</a>')
  result = result.replace(
    /<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g,
    '<a href="mailto:$1">$1</a>'
  )

  // Step 6: GFM Extended autolinks (plain URLs without <>)
  if (opts.gfm) {
    // Match URLs but stop at punctuation
    // Simple approach: only match URLs at word boundaries, not inside attributes
    result = result.replace(
      /(^|[\s(])(https?:\/\/[^\s<>"]+?)([.,;:!?)\]]*(?=\s|$))/gm,
      (_match: string, prefix: string, url: string, trailing: string) => {
        return `${prefix}<a href="${url}">${url}</a>${trailing}`
      }
    )
    result = result.replace(/(^|[\s(])(www\.[^\s<>"]+?)([.,;:!?)\]]*(?=\s|$))/gm, (_match: string, prefix: string, url: string, trailing: string) => {
      return `${prefix}<a href="http://${url}">${url}</a>${trailing}`
    })
    // Email autolinks at word boundaries
    result = result.replace(
      /(^|[\s(])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?=[\s.,;:!?)\]]|$)/gm,
      (_match: string, prefix: string, email: string) => {
        return `${prefix}<a href="mailto:${email}">${email}</a>`
      }
    )
  }

  // Step 7: Bold and Italic (process *** first, then **, then *)
  // Guard against pathological input (excessive delimiters)
  const asteriskCount = (result.match(/\*/g) ?? []).length
  const underscoreCount = (result.match(/_/g) ?? []).length

  // Only process emphasis if delimiter counts are reasonable
  if (asteriskCount < 1000 && underscoreCount < 1000) {
    // ***text*** -> <strong><em>text</em></strong>
    result = result.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    result = result.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>')

    // **text** or __text__ -> <strong>text</strong>
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    result = result.replace(/__(.+?)__/g, '<strong>$1</strong>')

    // *text* or _text_ -> <em>text</em>
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')
    result = result.replace(/_(.+?)_/g, '<em>$1</em>')
  }

  // Step 8: GFM Strikethrough: ~~text~~
  if (opts.gfm) {
    result = result.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  }

  // Step 9: Hard line breaks
  if (opts.breaks) {
    result = result.replace(/\n/g, '<br />\n')
  } else {
    result = result.replace(/ {2}\n/g, '<br />\n')
    result = result.replace(/\\\n/g, '<br />\n')
  }

  // Step 10: Restore escaped characters
  // eslint-disable-next-line no-control-regex -- Using null bytes as safe placeholders
  result = result.replace(/\x00ESCAPE(\d+)\x00/g, (_match: string, index: string) => {
    return escapes[parseInt(index, 10)] ?? ''
  })

  // Step 11: HTML entity decoding (convert &amp; etc)
  result = result.replace(/&#(\d+);/g, (_match: string, code: string) => String.fromCharCode(parseInt(code, 10)))
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_match: string, code: string) =>
    String.fromCharCode(parseInt(code, 16))
  )

  // Step 12: Sanitize HTML if needed
  if (opts.sanitize) {
    result = sanitizeHtml(result)
  }

  // Step 13: Always remove GFM-disallowed tags (script, style, etc)
  // When sanitizing, remove content entirely. When not sanitizing, preserve content.
  result = removeDangerousTags(result, !opts.sanitize)

  return result
}

function sanitizeHtml(html: string): string {
  // Remove event handlers
  html = html.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
  return html
}

function removeDangerousTags(html: string, preserveContent: boolean = true): string {
  // Remove GFM-disallowed tags (always, even with sanitize:false)
  // But preserve the content between tags when preserveContent is true
  const dangerous = ['script', 'style', 'iframe', 'object', 'embed']
  for (const tag of dangerous) {
    if (preserveContent) {
      // Replace opening and closing tags but keep content
      html = html.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '')
      html = html.replace(new RegExp(`</${tag}>`, 'gi'), '')
    } else {
      // Remove tags and content entirely
      const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis')
      html = html.replace(regex, '')
      html = html.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '')
    }
  }
  return html
}

/**
 * Parse inline links with balanced parentheses support
 */
function parseLinksSmart(text: string, opts: Required<MarkdownOptions>): string {
  let result = ''
  let i = 0

  while (i < text.length) {
    // Look for link start: [
    if (text[i] === '[') {
      // Find the closing ]
      let j = i + 1
      let bracketDepth = 1
      while (j < text.length && bracketDepth > 0) {
        if (text[j] === '[') bracketDepth++
        else if (text[j] === ']') bracketDepth--
        j++
      }

      if (bracketDepth === 0 && j < text.length && text[j] === '(') {
        // Found [text]( - now find the closing ) with balanced parens
        const linkText = text.slice(i + 1, j - 1)
        let k = j + 1
        let parenDepth = 1
        let inQuote = false
        let quoteChar = ''

        while (k < text.length && parenDepth > 0) {
          const char = text[k]
          if (!inQuote) {
            if (char === '"' || char === "'") {
              inQuote = true
              quoteChar = char
            } else if (char === '(') {
              parenDepth++
            } else if (char === ')') {
              parenDepth--
            }
          } else {
            if (char === quoteChar) {
              inQuote = false
            }
          }
          k++
        }

        if (parenDepth === 0) {
          // Extract URL and title from the content between ( and )
          const urlPart = text.slice(j + 1, k - 1)
          let url = ''
          let title = ''

          // Handle angle bracket URLs
          if (urlPart.startsWith('<')) {
            const closeAngle = urlPart.indexOf('>')
            if (closeAngle > 0) {
              url = urlPart.slice(1, closeAngle)
              const rest = urlPart.slice(closeAngle + 1).trim()
              const titleMatch = rest.match(/^["']([^"']*)["']/)
              if (titleMatch?.[1]) title = titleMatch[1]
            }
          } else {
            // Parse URL (stops at space or quote)
            let urlEnd = 0
            for (urlEnd = 0; urlEnd < urlPart.length; urlEnd++) {
              const c = urlPart[urlEnd]
              if (c === ' ' || c === '"' || c === "'") break
            }
            url = urlPart.slice(0, urlEnd)
            const rest = urlPart.slice(urlEnd).trim()
            const titleMatch = rest.match(/^["']([^"']*)["']/)
            if (titleMatch?.[1]) title = titleMatch[1]
          }

          const safeUrl = opts.sanitize ? sanitizeUrl(url.trim()) : url.trim()
          if (safeUrl) {
            const target = opts.linkTarget ? ` target="${opts.linkTarget}"` : ''
            const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
            result += `<a href="${escapeHtml(safeUrl)}"${target}${titleAttr}>${linkText}</a>`
            i = k
            continue
          } else {
            // URL was sanitized away (dangerous protocol) - just output the link text
            result += linkText
            i = k
            continue
          }
        }
      }
    }

    const char = text[i]
    if (char) result += char
    i++
  }

  return result
}
