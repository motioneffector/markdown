import type { StripPreset, StripConfig } from './types'

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
  // Implementation will be added after tests are written
  return ''
}
