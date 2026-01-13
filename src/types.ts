/**
 * Options for markdown parsing
 */
export interface MarkdownOptions {
  /**
   * Enable GitHub Flavored Markdown extensions (default: true)
   * Includes tables, strikethrough, task lists, and extended autolinks
   */
  gfm?: boolean

  /**
   * Sanitize dangerous HTML content (default: true)
   * Strips scripts, styles, event handlers, and dangerous URLs
   */
  sanitize?: boolean

  /**
   * Convert single line breaks to <br> tags (default: false)
   * When false, requires two spaces + newline or backslash + newline
   */
  breaks?: boolean

  /**
   * Add target attribute to links (default: undefined)
   * Example: '_blank' opens links in new tab
   */
  linkTarget?: string
}

/**
 * Preset configurations for markdownStrip()
 */
export type StripPreset = 'plaintext' | 'inline' | 'safe' | 'prose'

/**
 * Custom configuration for selective tag stripping
 */
export interface StripConfig {
  /**
   * Allowlist - only these tags are permitted
   * Cannot be used with 'strip' option
   */
  allow?: string[]

  /**
   * Blocklist - these tags are removed
   * Cannot be used with 'allow' option
   */
  strip?: string[]

  /**
   * When true (default), stripped tags keep inner content
   * When false, removed entirely including content
   * Dangerous tags always removed regardless of this setting
   */
  unwrap?: boolean
}
