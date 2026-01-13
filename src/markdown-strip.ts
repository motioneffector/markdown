import type { StripPreset, StripConfig } from './types'
import { markdown } from './markdown'

const PRESETS: Record<StripPreset, string[]> = {
  plaintext: [],
  inline: ['strong', 'em', 'code', 'a', 'br'],
  safe: ['p', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  prose: ['p', 'strong', 'em', 'a', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'br'],
}

const DANGEROUS_TAGS = ['script', 'style', 'iframe', 'object', 'embed']

/**
 * Strip HTML tags from markdown output with preset or custom configuration
 *
 * @param input - Markdown or HTML string
 * @param config - Preset name or custom configuration
 * @returns HTML string with tags stripped according to configuration
 *
 * @example
 * ```typescript
 * // Using preset
 * const text = markdownStrip(html, 'plaintext')
 *
 * // Custom configuration
 * const safe = markdownStrip(html, { allow: ['p', 'strong', 'em'] })
 * ```
 */
export function markdownStrip(
  input: string,
  config?: StripPreset | StripConfig
): string {
  if (!input) return ''

  // Parse input as markdown first if it doesn't look like HTML
  let html = input
  if (!/<[a-z][\s\S]*>/i.test(input)) {
    html = markdown(input)
  }

  // Determine configuration
  let allowedTags: string[]
  let unwrap = true

  if (!config) {
    // No config = allow everything
    return html
  }

  if (typeof config === 'string') {
    // Preset
    allowedTags = PRESETS[config]
  } else {
    // Custom config
    if (config.allow && config.strip) {
      throw new Error('Cannot use both "allow" and "strip" options')
    }

    unwrap = config.unwrap ?? true

    if (config.allow) {
      allowedTags = config.allow
    } else if (config.strip) {
      // Get all common HTML tags and remove the strip list
      const allTags = [
        'p', 'div', 'span', 'br', 'hr',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'em', 'b', 'i', 'u', 'del', 'code', 'pre',
        'a', 'img',
        'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'blockquote',
      ]
      const stripList = config.strip
      allowedTags = allTags.filter(tag => !stripList.includes(tag))
    } else {
      // No allow or strip specified, but still need to remove dangerous tags
      // Use a permissive list that includes most tags
      allowedTags = [
        'p', 'div', 'span', 'br', 'hr',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'em', 'b', 'i', 'u', 'del', 'code', 'pre',
        'a', 'img',
        'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'blockquote',
      ]
    }
  }

  // Strip tags
  return stripTags(html, allowedTags, unwrap)
}

function stripTags(html: string, allowedTags: string[], unwrap: boolean): string {
  let result = html

  // Always remove dangerous tags entirely
  for (const tag of DANGEROUS_TAGS) {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi')
    result = result.replace(regex, '')
    result = result.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '')
  }

  // Remove or unwrap disallowed tags
  const tagRegex = /<\/?([a-z][a-z0-9]*)[^>]*>/gi
  const tags = new Set<string>()

  // Find all tags in the HTML
  let match
  while ((match = tagRegex.exec(html)) !== null) {
    const tagName = match[1]
    if (tagName) {
      tags.add(tagName.toLowerCase())
    }
  }

  // Process each tag
  for (const tag of tags) {
    if (DANGEROUS_TAGS.includes(tag)) continue // already handled
    if (allowedTags.includes(tag)) continue // allowed

    // Tag should be stripped
    if (unwrap) {
      // Remove tags but keep content
      const openRegex = new RegExp(`<${tag}[^>]*>`, 'gi')
      const closeRegex = new RegExp(`</${tag}>`, 'gi')
      result = result.replace(openRegex, '')
      result = result.replace(closeRegex, '')
    } else {
      // Remove tags and content
      const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gi')
      result = result.replace(regex, '')
      // Self-closing tags
      result = result.replace(new RegExp(`<${tag}[^>]*/>`, 'gi'), '')
    }
  }

  // Special handling for images (always remove entirely if not allowed)
  if (!allowedTags.includes('img')) {
    result = result.replace(/<img[^>]*>/gi, '')
  }

  return result
}
