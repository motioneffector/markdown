/**
 * Base error class for markdown library errors
 */
export class MarkdownError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MarkdownError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends MarkdownError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Error thrown when parsing fails
 */
export class ParseError extends MarkdownError {
  constructor(
    message: string,
    public readonly position?: number,
    public readonly input?: string
  ) {
    super(message)
    this.name = 'ParseError'
  }
}
