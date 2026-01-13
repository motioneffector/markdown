/**
 * Utility functions for the markdown parser
 */

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Unescape HTML entities
 */
export function unescapeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
}

/**
 * Check if a string is a valid URL with http/https protocol
 */
export function isSafeUrl(url: string): boolean {
  const lower = url.toLowerCase().trim()
  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('/') ||
    lower.startsWith('#') ||
    lower.startsWith('mailto:')
  )
}

/**
 * Check if URL is dangerous (javascript:, data:, vbscript:, etc)
 */
export function isDangerousUrl(url: string): boolean {
  const lower = url.toLowerCase().trim()
  return (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    (lower.startsWith('data:') && !lower.startsWith('data:image/'))
  )
}

/**
 * Sanitize URL by removing dangerous protocols
 */
export function sanitizeUrl(url: string): string {
  if (isDangerousUrl(url)) {
    return ''
  }
  return url
}

/**
 * Check if tag is a dangerous HTML tag
 */
export function isDangerousTag(tag: string): boolean {
  const lower = tag.toLowerCase()
  return ['script', 'style', 'iframe', 'object', 'embed'].includes(lower)
}

/**
 * Trim leading and trailing whitespace from lines
 */
export function trimLines(text: string): string {
  return text
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim()
}

/**
 * Check if a line is blank (empty or whitespace only)
 */
export function isBlankLine(line: string): boolean {
  return /^\s*$/.test(line)
}

/**
 * Count leading spaces in a line
 */
export function countLeadingSpaces(line: string): number {
  const match = line.match(/^( *)/)
  return match ? match[1].length : 0
}

/**
 * Remove up to N leading spaces from a line
 */
export function removeLeadingSpaces(line: string, count: number): string {
  let removed = 0
  let index = 0
  while (removed < count && index < line.length && line[index] === ' ') {
    removed++
    index++
  }
  return line.slice(index)
}
