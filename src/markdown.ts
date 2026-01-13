import type { MarkdownOptions } from './types'
import { escapeHtml, sanitizeUrl, isBlankLine } from './utils'

// Maximum nesting depth to prevent stack overflow and OOM
const MAX_DEPTH = 32

// GFM autolink patterns - cached at module scope for performance
const GFM_URL_PUNCTUATION = /[.,;:!?)\]]+$/
const GFM_EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/

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
 * Delimiter for emphasis matching (CommonMark algorithm)
 * Used in Optimization 9 for non-recursive emphasis parsing
 */
interface EmphasisDelimiter {
  type: '*' | '_'
  count: number          // How many consecutive delimiters
  position: number       // Position in text
  canOpen: boolean       // Can open emphasis
  canClose: boolean      // Can close emphasis
  matched: number        // How many have been matched (0 to count)
}

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
      return `<h${String(level)}>${processInlineSinglePass(text, opts, definitions)}</h${String(level)}>`
    }

    case 'paragraph': {
      const text = block.text
      if (typeof text !== 'string') return ''
      return `<p>${processInlineSinglePass(text.trim(), opts, definitions)}</p>`
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
              content = typeof paragraphText === 'string' ? processInlineSinglePass(paragraphText, opts, definitions) : childHtml
            } else {
              content = childHtml
            }
          }
        } else {
          content = processInlineSinglePass(item.content, opts, definitions)
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
              content = typeof paragraphText === 'string' ? processInlineSinglePass(paragraphText, opts, definitions) : childHtml
            } else {
              content = childHtml
            }
          }
        } else {
          content = processInlineSinglePass(item.content, opts, definitions)
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
          return `<th${style}>${processInlineSinglePass(cell, opts, definitions)}</th>`
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
              return `<td${style}>${processInlineSinglePass(cell, opts, definitions)}</td>`
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

// ============================================================================
// Single-Pass Inline Parser - Helper Types and Utilities
// ============================================================================

/**
 * Result from inline element parsers
 */
type InlineParseResult = { html: string; endIndex: number } | null

/**
 * Characters that can be escaped with backslash
 */
function isEscapable(char: string): boolean {
  return '\\`*_{}[]()#+-.!|~'.includes(char)
}

/**
 * Find the closing bracket for a bracket that starts at 'start'
 * Handles nested brackets correctly
 */
function findClosingBracket(text: string, start: number): number {
  if (text[start] !== '[') return -1
  let depth = 1
  for (let i = start + 1; i < text.length; i++) {
    if (text[i] === '\\' && i + 1 < text.length) {
      i++ // Skip escaped character
      continue
    }
    if (text[i] === '[') depth++
    else if (text[i] === ']') depth--
    if (depth === 0) return i
  }
  return -1
}

/**
 * Parse URL and optional title from a parenthetical: (url "title")
 */
function parseUrlAndTitle(
  text: string,
  start: number
): { url: string; title?: string; endIndex: number } | null {
  if (text[start] !== '(') return null
  let i = start + 1

  // Skip leading whitespace
  while (i < text.length && /\s/.test(text[i] ?? '')) i++

  // Handle angle bracket URLs: <url>
  let url: string
  if (text[i] === '<') {
    const closeAngle = text.indexOf('>', i)
    if (closeAngle === -1) return null
    url = text.slice(i + 1, closeAngle)
    i = closeAngle + 1
  } else {
    // Regular URL (handle balanced parens)
    const urlStart = i
    let parenDepth = 0
    while (i < text.length) {
      const c = text[i]
      if (c === '(') parenDepth++
      else if (c === ')') {
        if (parenDepth === 0) break
        parenDepth--
      } else if (/\s/.test(c ?? '') && parenDepth === 0) break
      i++
    }
    url = text.slice(urlStart, i)
  }

  // Skip whitespace
  while (i < text.length && /\s/.test(text[i] ?? '')) i++

  // Optional title in quotes
  let title: string | undefined
  if (text[i] === '"' || text[i] === "'") {
    const quote = text[i]
    const titleStart = i + 1
    const titleEnd = text.indexOf(quote ?? '', titleStart)
    if (titleEnd !== -1) {
      title = text.slice(titleStart, titleEnd)
      i = titleEnd + 1
    }
  }

  // Skip whitespace and find closing paren
  while (i < text.length && /\s/.test(text[i] ?? '')) i++
  if (text[i] !== ')') return null

  return { url, title, endIndex: i + 1 }
}

/**
 * Decode numeric HTML entities (&#65; → A, &#x41; → A)
 */
function decodeNumericEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
}

// ============================================================================
// Single-Pass Inline Parser - Element Parsers
// ============================================================================

/**
 * Parse a code span starting at position 'start'
 * Note: String slicing in this function is already optimized -
 * slices only when building final HTML output for escapeHtml()
 */
function parseCodeSpan(text: string, start: number): InlineParseResult {
  let backticks = 0
  let i = start
  while (i < text.length && text[i] === '`') {
    backticks++
    i++
  }
  if (backticks === 0) return null

  const closePattern = '`'.repeat(backticks)
  const closeIndex = text.indexOf(closePattern, i)
  if (closeIndex === -1) return null

  // Verify exact match (not substring of longer run)
  const afterClose = closeIndex + backticks
  if (afterClose < text.length && text[afterClose] === '`') {
    let searchFrom = closeIndex + 1
    while (searchFrom < text.length) {
      const nextClose = text.indexOf(closePattern, searchFrom)
      if (nextClose === -1) return null
      const afterNext = nextClose + backticks
      if (afterNext >= text.length || text[afterNext] !== '`') {
        let code = text.slice(i, nextClose)
        if (code.startsWith(' ') && code.endsWith(' ') && code.length > 2) {
          code = code.slice(1, -1)
        }
        return {
          html: `<code>${escapeHtml(code)}</code>`,
          endIndex: nextClose + backticks,
        }
      }
      searchFrom = nextClose + 1
    }
    return null
  }

  let code = text.slice(i, closeIndex)
  if (code.startsWith(' ') && code.endsWith(' ') && code.length > 2) {
    code = code.slice(1, -1)
  }

  return {
    html: `<code>${escapeHtml(code)}</code>`,
    endIndex: closeIndex + backticks,
  }
}

/**
 * Parse an image: ![alt](src "title") or ![alt][ref]
 * Note: Slicing is necessary to extract alt text and references for HTML generation
 */
function parseImageSinglePass(
  text: string,
  start: number,
  opts: Required<MarkdownOptions>,
  definitions: LinkDefinitions
): InlineParseResult {
  if (text[start] !== '!' || text[start + 1] !== '[') return null

  const altEnd = findClosingBracket(text, start + 1)
  if (altEnd === -1) return null
  const alt = text.slice(start + 2, altEnd)

  // Inline style: ![alt](src)
  if (text[altEnd + 1] === '(') {
    const result = parseUrlAndTitle(text, altEnd + 1)
    if (!result) return null
    const safeSrc = opts.sanitize ? sanitizeUrl(result.url.trim()) : result.url.trim()
    if (!safeSrc) return null
    const titleAttr = result.title ? ` title="${escapeHtml(result.title)}"` : ''
    return {
      html: `<img src="${escapeHtml(safeSrc)}" alt="${escapeHtml(alt)}"${titleAttr} />`,
      endIndex: result.endIndex,
    }
  }

  // Reference style: ![alt][ref]
  if (text[altEnd + 1] === '[') {
    const refEnd = findClosingBracket(text, altEnd + 1)
    if (refEnd === -1) return null
    const ref = text.slice(altEnd + 2, refEnd) || alt
    const def = definitions.get(ref.toLowerCase())
    if (!def) return null
    const safeSrc = opts.sanitize ? sanitizeUrl(def.url.trim()) : def.url.trim()
    if (!safeSrc) return null
    const titleAttr = def.title ? ` title="${escapeHtml(def.title)}"` : ''
    return {
      html: `<img src="${escapeHtml(safeSrc)}" alt="${escapeHtml(alt)}"${titleAttr} />`,
      endIndex: refEnd + 1,
    }
  }

  return null
}

/**
 * Parse a link: [text](url) or [text][ref]
 * If URL is dangerous, outputs just the link text.
 * Note: Slicing is necessary to extract link text and references for HTML generation
 */
function parseLinkSinglePass(
  text: string,
  start: number,
  opts: Required<MarkdownOptions>,
  definitions: LinkDefinitions
): InlineParseResult {
  if (text[start] !== '[') return null

  const textEnd = findClosingBracket(text, start)
  if (textEnd === -1) return null
  const linkText = text.slice(start + 1, textEnd)

  const target = opts.linkTarget ? ` target="${opts.linkTarget}"` : ''

  // Inline style: [text](url)
  if (text[textEnd + 1] === '(') {
    const result = parseUrlAndTitle(text, textEnd + 1)
    if (!result) return null
    const safeUrl = opts.sanitize ? sanitizeUrl(result.url.trim()) : result.url.trim()
    if (!safeUrl) {
      return { html: linkText, endIndex: result.endIndex }
    }
    const titleAttr = result.title ? ` title="${escapeHtml(result.title)}"` : ''
    return {
      html: `<a href="${escapeHtml(safeUrl)}"${target}${titleAttr}>${linkText}</a>`,
      endIndex: result.endIndex,
    }
  }

  // Reference style: [text][ref]
  if (text[textEnd + 1] === '[') {
    const refEnd = findClosingBracket(text, textEnd + 1)
    if (refEnd === -1) return null
    const ref = text.slice(textEnd + 2, refEnd) || linkText
    const def = definitions.get(ref.toLowerCase())
    if (!def) return null
    const safeUrl = opts.sanitize ? sanitizeUrl(def.url.trim()) : def.url.trim()
    if (!safeUrl) {
      return { html: linkText, endIndex: refEnd + 1 }
    }
    const titleAttr = def.title ? ` title="${escapeHtml(def.title)}"` : ''
    return {
      html: `<a href="${escapeHtml(safeUrl)}"${target}${titleAttr}>${linkText}</a>`,
      endIndex: refEnd + 1,
    }
  }

  // Shortcut reference: [text] only
  const def = definitions.get(linkText.toLowerCase())
  if (def) {
    const safeUrl = opts.sanitize ? sanitizeUrl(def.url.trim()) : def.url.trim()
    if (safeUrl) {
      const titleAttr = def.title ? ` title="${escapeHtml(def.title)}"` : ''
      return {
        html: `<a href="${escapeHtml(safeUrl)}"${target}${titleAttr}>${linkText}</a>`,
        endIndex: textEnd + 1,
      }
    }
    return { html: linkText, endIndex: textEnd + 1 }
  }

  return null
}

/**
 * Parse an autolink: <url> or <email>
 */
function parseAutolink(text: string, start: number): InlineParseResult {
  if (text[start] !== '<') return null

  const closeIndex = text.indexOf('>', start + 1)
  if (closeIndex === -1) return null

  const content = text.slice(start + 1, closeIndex)

  if (/^https?:\/\//.test(content)) {
    return {
      html: `<a href="${content}">${content}</a>`,
      endIndex: closeIndex + 1,
    }
  }

  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(content)) {
    return {
      html: `<a href="mailto:${content}">${content}</a>`,
      endIndex: closeIndex + 1,
    }
  }

  return null
}

/**
 * Collect all emphasis delimiter runs in a text range.
 * This is Phase 1 of the CommonMark delimiter stack algorithm.
 */
function collectEmphasisDelimiters(
  text: string,
  start: number,
  end: number
): EmphasisDelimiter[] {
  const delimiters: EmphasisDelimiter[] = []

  let i = start
  while (i < end) {
    const char = text[i]

    // Only interested in * and _
    if (char !== '*' && char !== '_') {
      i++
      continue
    }

    // Count consecutive delimiters
    let count = 0
    const delimStart = i
    while (i < end && text[i] === char) {
      count++
      i++
    }

    // Determine if this delimiter run can open/close emphasis
    // Based on surrounding characters (CommonMark rules)
    const before = delimStart > start ? text[delimStart - 1] : ' '
    const after = i < end ? text[i] : ' '

    const beforeIsWhitespace = /\s/.test(before)
    const afterIsWhitespace = /\s/.test(after)

    // Can open if not followed by whitespace
    const canOpen = !afterIsWhitespace

    // Can close if not preceded by whitespace
    const canClose = !beforeIsWhitespace

    delimiters.push({
      type: char as '*' | '_',
      count,
      position: delimStart,
      canOpen,
      canClose,
      matched: 0
    })
  }

  return delimiters
}

/**
 * Parse emphasis: *, **, ***, _, __, ___
 * Uses "find rightmost valid closer" approach for proper nesting.
 * NOTE: This function will be fully refactored in Optimization 9 (non-recursive emphasis)
 * String slicing optimizations intentionally deferred until that refactor.
 */
function parseEmphasis(
  text: string,
  start: number,
  opts: Required<MarkdownOptions>,
  definitions: LinkDefinitions
): InlineParseResult {
  const char = text[start]
  if (char !== '*' && char !== '_') return null

  let openCount = 0
  let i = start
  while (i < text.length && text[i] === char) {
    openCount++
    i++
  }

  if (i >= text.length || /\s/.test(text[i] ?? '')) return null

  for (let useCount = Math.min(openCount, 3); useCount >= 1; useCount--) {
    const contentStart = start + useCount

    const closers: Array<{ index: number; count: number }> = []
    let searchFrom = contentStart

    while (searchFrom < text.length) {
      const closeIndex = text.indexOf(char, searchFrom)
      if (closeIndex === -1) break

      let closeCount = 0
      let k = closeIndex
      while (k < text.length && text[k] === char) {
        closeCount++
        k++
      }

      const before = text[closeIndex - 1]
      const isValidCloser =
        closeIndex > contentStart &&
        before !== undefined &&
        !/\s/.test(before)

      if (isValidCloser && closeCount >= useCount) {
        closers.push({ index: closeIndex, count: closeCount })
      }

      searchFrom = closeIndex + closeCount
    }

    for (let ci = closers.length - 1; ci >= 0; ci--) {
      const closer = closers[ci]
      if (!closer) continue

      let content = text.slice(contentStart, closer.index)
      if (!content) continue

      const extraClosers = closer.count - useCount
      if (extraClosers > 0) {
        let unbalancedCount = 0
        for (let j = 0; j < content.length; j++) {
          if (content[j] === char) unbalancedCount++
        }
        if (unbalancedCount % 2 === 1 && extraClosers >= 1) {
          content = content + char
        }
      }

      const processedContent = processInlineSinglePass(content, opts, definitions)

      let html: string
      if (useCount === 3) {
        html = `<strong><em>${processedContent}</em></strong>`
      } else if (useCount === 2) {
        html = `<strong>${processedContent}</strong>`
      } else {
        html = `<em>${processedContent}</em>`
      }

      const borrowedClosers = extraClosers > 0 && content.endsWith(char) ? 1 : 0
      return { html, endIndex: closer.index + useCount + borrowedClosers }
    }
  }

  return null
}

/**
 * Parse strikethrough: ~~text~~
 * Note: String slicing is necessary for recursive processing via processInlineSinglePass()
 */
function parseStrikethrough(
  text: string,
  start: number,
  opts: Required<MarkdownOptions>,
  definitions: LinkDefinitions
): InlineParseResult {
  if (text[start] !== '~' || text[start + 1] !== '~') return null

  const closeIndex = text.indexOf('~~', start + 2)
  if (closeIndex === -1) return null

  const content = text.slice(start + 2, closeIndex)
  if (!content) return null

  const processedContent = processInlineSinglePass(content, opts, definitions)

  return {
    html: `<del>${processedContent}</del>`,
    endIndex: closeIndex + 2,
  }
}

/**
 * Parse GFM autolinks (bare URLs)
 */
function parseGfmAutolink(text: string, start: number): InlineParseResult {
  if (text.slice(start, start + 7) === 'http://' || text.slice(start, start + 8) === 'https://') {
    let i = start
    while (i < text.length && !/\s/.test(text[i] ?? '') && text[i] !== '<' && text[i] !== '>') {
      i++
    }

    let url = text.slice(start, i)
    const match = url.match(GFM_URL_PUNCTUATION)
    if (match) {
      url = url.slice(0, -match[0].length)
      i -= match[0].length
    }

    if (url.length > 8) {
      return {
        html: `<a href="${url}">${url}</a>`,
        endIndex: i,
      }
    }
  }

  if (text.slice(start, start + 4) === 'www.') {
    let i = start
    while (i < text.length && !/\s/.test(text[i] ?? '') && text[i] !== '<' && text[i] !== '>') {
      i++
    }

    let url = text.slice(start, i)
    const match = url.match(GFM_URL_PUNCTUATION)
    if (match) {
      url = url.slice(0, -match[0].length)
      i -= match[0].length
    }

    if (url.length > 4) {
      return {
        html: `<a href="http://${url}">${url}</a>`,
        endIndex: i,
      }
    }
  }

  const emailMatch = text.slice(start).match(GFM_EMAIL_PATTERN)
  if (emailMatch) {
    return {
      html: `<a href="mailto:${emailMatch[0]}">${emailMatch[0]}</a>`,
      endIndex: start + emailMatch[0].length,
    }
  }

  return null
}

// ============================================================================
// Single-Pass Inline Parser - Main Function
// ============================================================================

/**
 * Process inline markdown elements using a single-pass character scanner.
 * O(n) instead of O(n × m) multi-pass regex approach.
 */
function processInlineSinglePass(
  text: string,
  opts: Required<MarkdownOptions>,
  definitions: LinkDefinitions = new Map()
): string {
  const parts: string[] = []
  let i = 0

  // Hoist GFM checks outside loop for performance
  const checkStrikethrough = opts.gfm === true
  const checkGfmAutolinks = opts.gfm === true

  while (i < text.length) {
    const char = text[i]
    const next = text[i + 1]

    // 1. ESCAPES
    if (char === '\\' && i + 1 < text.length && isEscapable(next ?? '')) {
      parts.push(next ?? '')
      i += 2
      continue
    }

    // 2. CODE SPANS
    if (char === '`') {
      const result = parseCodeSpan(text, i)
      if (result) {
        parts.push(result.html)
        i = result.endIndex
        continue
      }
    }

    // 3. IMAGES (before links)
    if (char === '!' && next === '[') {
      const result = parseImageSinglePass(text, i, opts, definitions)
      if (result) {
        parts.push(result.html)
        i = result.endIndex
        continue
      }
    }

    // 4. LINKS
    if (char === '[') {
      const result = parseLinkSinglePass(text, i, opts, definitions)
      if (result) {
        parts.push(result.html)
        i = result.endIndex
        continue
      }
    }

    // 5. AUTOLINKS
    if (char === '<') {
      const result = parseAutolink(text, i)
      if (result) {
        parts.push(result.html)
        i = result.endIndex
        continue
      }
    }

    // 6. STRIKETHROUGH (GFM, before emphasis)
    if (checkStrikethrough && char === '~' && next === '~') {
      const result = parseStrikethrough(text, i, opts, definitions)
      if (result) {
        parts.push(result.html)
        i = result.endIndex
        continue
      }
    }

    // 7. EMPHASIS
    if (char === '*' || char === '_') {
      const result = parseEmphasis(text, i, opts, definitions)
      if (result) {
        parts.push(result.html)
        i = result.endIndex
        continue
      }
    }

    // 8. HARD LINE BREAKS
    if (char === '\n') {
      if (parts.length >= 2) {
        const last = parts[parts.length - 1]
        const secondLast = parts[parts.length - 2]
        if (last === ' ' && secondLast === ' ') {
          parts.pop()
          parts.pop()
          parts.push('<br />\n')
          i++
          continue
        }
      }
      if (parts.length >= 1) {
        const last = parts[parts.length - 1]
        if (last === '\\') {
          parts.pop()
          parts.push('<br />\n')
          i++
          continue
        }
      }
      if (opts.breaks) {
        parts.push('<br />\n')
        i++
        continue
      }
    }

    // 9. GFM AUTOLINKS (bare URLs)
    if (checkGfmAutolinks) {
      const prevChar = i > 0 ? text[i - 1] : ''
      if (i === 0 || /\s/.test(prevChar ?? '') || prevChar === '(') {
        const result = parseGfmAutolink(text, i)
        if (result) {
          parts.push(result.html)
          i = result.endIndex
          continue
        }
      }
    }

    // 10. NUMERIC HTML ENTITIES
    if (char === '&') {
      // Check for &#123; or &#xABC; patterns
      const remaining = text.slice(i)
      const decMatch = remaining.match(/^&#(\d+);/)
      const hexMatch = remaining.match(/^&#x([0-9a-fA-F]+);/)

      if (decMatch) {
        const code = parseInt(decMatch[1], 10)
        parts.push(String.fromCharCode(code))
        i += decMatch[0].length
        continue
      }

      if (hexMatch) {
        const code = parseInt(hexMatch[1], 16)
        parts.push(String.fromCharCode(code))
        i += hexMatch[0].length
        continue
      }

      // Not an entity, let it fall through to plain text handling
    }

    // 11. BATCH PLAIN CHARACTERS (scan ahead for runs of plain text)
    const plainStart = i
    while (i < text.length) {
      const c = text[i]
      const n = text[i + 1]

      // Break on any special character
      if (c === '\\' || c === '`' || c === '!' || c === '[' || c === '<') break
      if (c === '*' || c === '_') break
      if (c === '\n') break
      if (c === '&') break  // HTML entities

      // Break on GFM features if enabled
      if (checkStrikethrough && c === '~' && n === '~') break
      if (checkGfmAutolinks) {
        // Break on http://, https://, www. patterns
        if ((c === 'h' || c === 'w')) {
          if (text.slice(i, i + 7) === 'http://' ||
              text.slice(i, i + 8) === 'https://' ||
              text.slice(i, i + 4) === 'www.') break
        }
        // Break after whitespace to allow GFM autolink detection (for emails)
        // Include the space, then break so next iteration starts at alphanumeric char
        if (i > plainStart && c === ' ' && n && /[a-zA-Z0-9]/.test(n)) {
          i++  // Include the space
          break
        }
      }

      // Break on space followed by space or newline (hard line break detection)
      if (c === ' ' && (n === ' ' || n === '\n')) break

      i++
    }

    // Push the entire plain text run at once
    if (i > plainStart) {
      parts.push(text.slice(plainStart, i))
      continue  // Don't increment i again, already moved forward
    }

    // If we didn't advance, push single char (shouldn't happen, but safety)
    parts.push(char ?? '')
    i++
  }

  let result = parts.join('')

  // Post-processing
  if (opts.sanitize) {
    result = sanitizeHtml(result)
  }
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
