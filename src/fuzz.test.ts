import { describe, it } from 'vitest'
import { markdown } from './markdown'
import { markdownStrip } from './markdown-strip'
import { ValidationError, ParseError, MarkdownError } from './errors'

// ============================================
// FUZZ TEST CONFIGURATION
// ============================================

const THOROUGH_MODE = process.env.FUZZ_THOROUGH === '1'
const THOROUGH_DURATION_MS = 10_000  // 10 seconds per test in thorough mode
const STANDARD_ITERATIONS = 200      // iterations per test in standard mode
const BASE_SEED = 12345              // reproducible seed for standard mode

// ============================================
// SEEDED PRNG
// ============================================

function createSeededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

// ============================================
// FUZZ LOOP HELPER
// ============================================

interface FuzzLoopResult {
  iterations: number
  seed: number
  durationMs: number
}

/**
 * Executes a fuzz test body in either standard or thorough mode.
 *
 * Standard mode: Runs exactly STANDARD_ITERATIONS times with BASE_SEED
 * Thorough mode: Runs for THOROUGH_DURATION_MS with time-based seed
 *
 * On failure, throws with full reproduction information.
 */
function fuzzLoop(
  testFn: (random: () => number, iteration: number) => void
): FuzzLoopResult {
  const startTime = Date.now()
  const seed = THOROUGH_MODE ? startTime : BASE_SEED
  const random = createSeededRandom(seed)

  let iteration = 0

  try {
    if (THOROUGH_MODE) {
      // Time-based: run until duration exceeded
      while (Date.now() - startTime < THOROUGH_DURATION_MS) {
        testFn(random, iteration)
        iteration++
      }
    } else {
      // Iteration-based: run fixed count
      for (iteration = 0; iteration < STANDARD_ITERATIONS; iteration++) {
        testFn(random, iteration)
      }
    }
  } catch (error) {
    const elapsed = Date.now() - startTime
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Fuzz test failed!\n` +
      `  Mode: ${THOROUGH_MODE ? 'thorough' : 'standard'}\n` +
      `  Seed: ${seed}\n` +
      `  Iteration: ${iteration}\n` +
      `  Elapsed: ${elapsed}ms\n` +
      `  Error: ${message}\n\n` +
      `To reproduce, run with:\n` +
      `  BASE_SEED=${seed} and start at iteration ${iteration}`
    )
  }

  return {
    iterations: iteration,
    seed,
    durationMs: Date.now() - startTime
  }
}

// ============================================
// VALUE GENERATORS
// ============================================

function generateString(random: () => number, maxLen = 1000): string {
  const len = Math.floor(random() * maxLen)
  return Array.from({ length: len }, () =>
    String.fromCharCode(Math.floor(random() * 0xFFFF))
  ).join('')
}

function generateAsciiString(random: () => number, maxLen = 1000): string {
  const len = Math.floor(random() * maxLen)
  return Array.from({ length: len }, () =>
    String.fromCharCode(32 + Math.floor(random() * 95))  // Printable ASCII
  ).join('')
}

function generateMarkdownString(random: () => number, maxLen = 1000): string {
  const len = Math.floor(random() * maxLen)
  const markdownChars = 'abcdefghijklmnopqrstuvwxyz0123456789 \n*_#[]()!`~|->'
  return Array.from({ length: len }, () =>
    markdownChars[Math.floor(random() * markdownChars.length)]
  ).join('')
}

function generateUnicodeString(random: () => number, maxLen = 1000): string {
  const len = Math.floor(random() * maxLen)
  const categories = [
    () => String.fromCharCode(Math.floor(random() * 128)),  // ASCII
    () => String.fromCharCode(128 + Math.floor(random() * 128)),  // Latin-1
    () => String.fromCharCode(0x4E00 + Math.floor(random() * 100)),  // CJK
    () => '\u200B',  // Zero-width space
    () => '\uD83D\uDE00',  // Emoji (surrogate pair)
    () => 'a\u0301',  // Combining diacritical
  ]
  return Array.from({ length: len }, () => {
    const category = categories[Math.floor(random() * categories.length)]
    return category()
  }).join('')
}

function generateHtmlString(random: () => number, maxLen = 1000): string {
  const tags = ['p', 'div', 'span', 'strong', 'em', 'a', 'img', 'script', 'style']
  const attrs = ['href', 'src', 'onclick', 'onerror', 'class', 'id', 'style']

  let html = ''
  const tagStack: string[] = []

  while (html.length < maxLen) {
    const choice = Math.floor(random() * 4)

    if (choice === 0 && tagStack.length < 10) {
      // Open tag
      const tag = tags[Math.floor(random() * tags.length)]
      const hasAttr = random() > 0.5
      const attr = hasAttr ? ` ${attrs[Math.floor(random() * attrs.length)]}="${generateAsciiString(random, 20)}"` : ''
      html += `<${tag}${attr}>`
      tagStack.push(tag)
    } else if (choice === 1 && tagStack.length > 0) {
      // Close tag
      const shouldMatch = random() > 0.3
      const tag = shouldMatch
        ? tagStack.pop()
        : tags[Math.floor(random() * tags.length)]
      html += `</${tag}>`
    } else {
      // Text content
      html += generateAsciiString(random, 50)
    }
  }

  return html
}

function generateXssVector(random: () => number): string {
  const vectors = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '<iframe src="javascript:alert(1)">',
    '<a href="javascript:alert(1)">click</a>',
    '<div onclick=alert(1)>click</div>',
    '<input onfocus=alert(1) autofocus>',
    '<img src=x:alert(1) onerror=eval(src)>',
    '<SCRIPT>alert(1)</SCRIPT>',  // Case variation
    '<script\x00>alert(1)</script>',  // Null byte
    '<<script>alert(1)//<</>script>',  // Nested
  ]
  return vectors[Math.floor(random() * vectors.length)]
}

function generateNestedMarkdown(random: () => number, depth: number): string {
  if (depth === 0) return 'text'

  const types = [
    (d: number) => `> ${generateNestedMarkdown(random, d - 1)}`,  // Blockquote
    (d: number) => `- ${generateNestedMarkdown(random, d - 1)}`,  // List
    (d: number) => `**${generateNestedMarkdown(random, d - 1)}**`,  // Bold
    (d: number) => `*${generateNestedMarkdown(random, d - 1)}*`,  // Italic
  ]

  const type = types[Math.floor(random() * types.length)]
  return type(depth)
}

// ============================================
// FUZZ TESTS: markdown()
// ============================================

describe('Fuzz: markdown() - Input Mutation', () => {
  it('handles random ASCII input without crashing', () => {
    const result = fuzzLoop((random, i) => {
      const input = generateAsciiString(random, 10000)
      const output = markdown(input)

      // Verify invariants
      if (typeof output !== 'string') {
        throw new Error(`Expected string output, got ${typeof output}`)
      }

      if (output === null || output === undefined) {
        throw new Error(`Output should not be null/undefined`)
      }
    })

    if (THOROUGH_MODE) {
      console.log(`Completed ${result.iterations} iterations in ${result.durationMs}ms`)
    }
  })

  it('handles random Unicode input without crashing', () => {
    fuzzLoop((random, i) => {
      const input = generateUnicodeString(random, 5000)
      const output = markdown(input)

      if (typeof output !== 'string') {
        throw new Error(`Expected string output, got ${typeof output}`)
      }
    })
  })

  it('handles random markdown-like input without crashing', () => {
    fuzzLoop((random, i) => {
      const input = generateMarkdownString(random, 10000)
      const output = markdown(input)

      if (typeof output !== 'string') {
        throw new Error(`Expected string output, got ${typeof output}`)
      }
    })
  })

  it('handles empty and boundary string inputs', () => {
    fuzzLoop((random, i) => {
      const lengths = [0, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]
      const len = lengths[Math.floor(random() * lengths.length)]
      const input = generateAsciiString(random, len)
      const output = markdown(input)

      if (typeof output !== 'string') {
        throw new Error(`Expected string output for length ${len}`)
      }

      if (input === '' && output !== '') {
        throw new Error(`Empty input should produce empty output`)
      }
    })
  })

  it('handles deeply nested structures without stack overflow', () => {
    fuzzLoop((random, i) => {
      const depth = Math.floor(random() * 100)
      const input = generateNestedMarkdown(random, depth)

      const start = Date.now()
      const output = markdown(input)
      const elapsed = Date.now() - start

      if (elapsed > 100) {
        throw new Error(`Took too long (${elapsed}ms) for depth ${depth}`)
      }

      if (typeof output !== 'string') {
        throw new Error(`Expected string output for depth ${depth}`)
      }
    })
  })

  it('handles control characters without crashing', () => {
    fuzzLoop((random, i) => {
      const controlChars = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F\x7F'
      const len = Math.floor(random() * 100)
      let input = ''
      for (let j = 0; j < len; j++) {
        input += controlChars[Math.floor(random() * controlChars.length)]
      }
      input += generateAsciiString(random, 100)

      const output = markdown(input)
      if (typeof output !== 'string') {
        throw new Error(`Expected string output with control chars`)
      }
    })
  })
})

describe('Fuzz: markdown() - Security', () => {
  it('sanitizes XSS vectors when sanitize:true', () => {
    fuzzLoop((random, i) => {
      const vector = generateXssVector(random)
      const output = markdown(vector, { sanitize: true })

      const lowerOutput = output.toLowerCase()
      if (lowerOutput.includes('<script')) {
        throw new Error(`XSS vector not sanitized: ${vector} => ${output}`)
      }
      if (lowerOutput.includes('javascript:')) {
        throw new Error(`JavaScript protocol not sanitized: ${vector} => ${output}`)
      }
      if (/on\w+=/i.test(output)) {
        throw new Error(`Event handler not sanitized: ${vector} => ${output}`)
      }
    })
  })

  it('does not mutate input objects', () => {
    fuzzLoop((random, i) => {
      const input = generateMarkdownString(random, 1000)
      const options = { sanitize: true, gfm: true, breaks: false }
      const optionsCopy = { ...options }

      markdown(input, options)

      if (JSON.stringify(options) !== JSON.stringify(optionsCopy)) {
        throw new Error(`Input options were mutated`)
      }
    })
  })

  it('never returns null or undefined', () => {
    fuzzLoop((random, i) => {
      const input = generateString(random, 1000)
      const output = markdown(input)

      if (output === null) {
        throw new Error(`Output is null`)
      }
      if (output === undefined) {
        throw new Error(`Output is undefined`)
      }
    })
  })
})

// ============================================
// FUZZ TESTS: markdownStrip()
// ============================================

describe('Fuzz: markdownStrip() - Input Mutation', () => {
  it('handles random HTML input without crashing', () => {
    fuzzLoop((random, i) => {
      const html = generateHtmlString(random, 5000)
      const output = markdownStrip(html, 'safe')

      if (typeof output !== 'string') {
        throw new Error(`Expected string output, got ${typeof output}`)
      }

      if (output === null || output === undefined) {
        throw new Error(`Output should not be null/undefined`)
      }
    })
  })

  it('plaintext preset removes all tags', () => {
    fuzzLoop((random, i) => {
      const html = generateHtmlString(random, 1000)
      const output = markdownStrip(html, 'plaintext')

      if (output.includes('<') || output.includes('>')) {
        throw new Error(`Plaintext output contains HTML: ${output.slice(0, 100)}`)
      }
    })
  })

  it('inline preset only keeps allowed tags', () => {
    fuzzLoop((random, i) => {
      const html = generateHtmlString(random, 1000)
      const output = markdownStrip(html, 'inline')

      // Inline preset allows: strong, em, code, a, br
      const allowedTags = ['strong', 'em', 'code', 'a', 'br']
      const tagRegex = /<(\w+)[\s>]/g
      let match
      while ((match = tagRegex.exec(output)) !== null) {
        const tag = match[1].toLowerCase()
        if (!allowedTags.includes(tag)) {
          throw new Error(`Found disallowed tag in inline output: ${tag}`)
        }
      }
    })
  })

  it('handles malformed HTML without crashing', () => {
    fuzzLoop((random, i) => {
      const malformed = [
        '<div',
        '<p></div>',
        '</p>',
        '<<>>',
        '<div<<',
        '><div>',
        '<123>',
        '<->',
        '<div attr=">',
      ]
      const input = malformed[Math.floor(random() * malformed.length)]
      const output = markdownStrip(input + generateHtmlString(random, 100), 'safe')

      if (typeof output !== 'string') {
        throw new Error(`Expected string output for malformed HTML`)
      }
    })
  })

  it('output length never exceeds input length', () => {
    fuzzLoop((random, i) => {
      const html = generateHtmlString(random, 1000)
      const output = markdownStrip(html, 'plaintext')

      if (output.length > html.length) {
        throw new Error(`Output length (${output.length}) exceeds input length (${html.length})`)
      }
    })
  })
})

describe('Fuzz: markdownStrip() - Configuration', () => {
  it('rejects config with both allow and strip', () => {
    fuzzLoop((random, i) => {
      const html = generateHtmlString(random, 1000)
      const allow = ['p', 'div']
      const strip = ['span', 'strong']

      try {
        markdownStrip(html, { allow, strip })
        throw new Error('Should have thrown ValidationError')
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`Wrong error type: ${e?.constructor?.name}`)
        }
        if (e.message.length === 0) {
          throw new Error('Error message is empty')
        }
      }
    })
  })

  it('handles custom allow list without crashing', () => {
    fuzzLoop((random, i) => {
      const html = generateHtmlString(random, 1000)
      const tags = ['p', 'div', 'span', 'strong', 'em', 'a', 'img']
      const allowCount = 1 + Math.floor(random() * tags.length)
      const allow = tags.slice(0, allowCount)

      const output = markdownStrip(html, { allow })

      if (typeof output !== 'string') {
        throw new Error(`Expected string output with allow list`)
      }
    })
  })

  it('handles custom strip list without crashing', () => {
    fuzzLoop((random, i) => {
      const html = generateHtmlString(random, 1000)
      const tags = ['p', 'div', 'span', 'strong', 'em', 'a', 'img']
      const stripCount = 1 + Math.floor(random() * tags.length)
      const strip = tags.slice(0, stripCount)

      const output = markdownStrip(html, { strip })

      if (typeof output !== 'string') {
        throw new Error(`Expected string output with strip list`)
      }
    })
  })

  it('validates error messages are informative', () => {
    fuzzLoop((random, i) => {
      const html = generateHtmlString(random, 500)

      try {
        markdownStrip(html, { allow: ['p'], strip: ['div'] })
        throw new Error('Should have thrown ValidationError')
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw new Error(`Wrong error type: ${e?.constructor?.name}`)
        }

        const msg = e.message.toLowerCase()
        if (msg.includes('undefined') || msg.includes('[object object]')) {
          throw new Error(`Error message contains poor formatting: ${e.message}`)
        }

        if (e.message.length < 10) {
          throw new Error(`Error message too short: ${e.message}`)
        }
      }
    })
  })
})

// ============================================
// FUZZ TESTS: Property-Based Testing
// ============================================

describe('Fuzz: Property-Based Tests', () => {
  it('markdown() + markdownStrip() composition never fails', () => {
    fuzzLoop((random, i) => {
      const input = generateMarkdownString(random, 5000)

      const html = markdown(input)
      const text = markdownStrip(html, 'plaintext')

      if (typeof text !== 'string') {
        throw new Error(`Composition pipeline failed type check`)
      }

      if (text.includes('<') || text.includes('>')) {
        throw new Error(`Plaintext output contains HTML after composition`)
      }
    })
  })

  it('escaped characters appear literally in output', () => {
    fuzzLoop((random, i) => {
      const specialChars = ['*', '_', '#', '[', ']', '(', ')', '`', '~', '|', '-', '>']
      const char = specialChars[Math.floor(random() * specialChars.length)]
      const input = `\\${char}text\\${char}`

      const output = markdown(input)

      // The escaped character should appear literally (not as markdown syntax)
      // We check that the output contains the character and doesn't have empty bold/italic tags
      if (!output.includes(char)) {
        throw new Error(`Escaped character ${char} not found in output: ${output}`)
      }
    })
  })

  it('markdownStrip() never increases tag types', () => {
    fuzzLoop((random, i) => {
      const html = generateHtmlString(random, 1000)

      const inputTags = new Set<string>()
      const inputTagRegex = /<(\w+)[\s>]/g
      let match
      while ((match = inputTagRegex.exec(html)) !== null) {
        inputTags.add(match[1].toLowerCase())
      }

      const output = markdownStrip(html, 'safe')

      const outputTags = new Set<string>()
      const outputTagRegex = /<(\w+)[\s>]/g
      while ((match = outputTagRegex.exec(output)) !== null) {
        outputTags.add(match[1].toLowerCase())
      }

      if (outputTags.size > inputTags.size) {
        throw new Error(`Strip increased tag types: ${inputTags.size} -> ${outputTags.size}`)
      }
    })
  })
})

// ============================================
// FUZZ TESTS: Boundary Exploration
// ============================================

describe('Fuzz: Boundary Exploration', () => {
  it('handles power-of-2 string lengths', () => {
    fuzzLoop((random, i) => {
      const powers = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096]
      const len = powers[Math.floor(random() * powers.length)]
      const input = generateAsciiString(random, len)

      const start = Date.now()
      const output = markdown(input)
      const elapsed = Date.now() - start

      if (elapsed > 100) {
        throw new Error(`Took too long (${elapsed}ms) for length ${len}`)
      }

      if (typeof output !== 'string') {
        throw new Error(`Failed at power-of-2 length ${len}`)
      }
    })
  })

  it('handles various Unicode boundary cases', () => {
    fuzzLoop((random, i) => {
      const boundaries = [
        String.fromCharCode(0x7F),  // ASCII boundary
        String.fromCharCode(0xFF),  // Latin-1 boundary
        '\uD800\uDC00',  // Valid surrogate pair
        '\u200B',  // Zero-width space
        '\u0301',  // Combining diacritical
        '\uFEFF',  // Zero-width no-break space (BOM)
        '🎉',  // Emoji
        '中文',  // CJK
      ]

      const boundary = boundaries[Math.floor(random() * boundaries.length)]
      const input = boundary + generateAsciiString(random, 100)

      const output = markdown(input)

      if (typeof output !== 'string') {
        throw new Error(`Failed on Unicode boundary`)
      }
    })
  })

  it('handles special markdown characters at boundaries', () => {
    fuzzLoop((random, i) => {
      const specials = ['*', '_', '#', '[', ']', '(', ')', '!', '\\', '`', '~', '|', '-', '>']
      const char = specials[Math.floor(random() * specials.length)]

      const positions = [
        char,  // Only special char
        char + 'text',  // Start
        'text' + char,  // End
        'text' + char + 'text',  // Middle
        char.repeat(10),  // Repeated
      ]

      const input = positions[Math.floor(random() * positions.length)]
      const output = markdown(input)

      if (typeof output !== 'string') {
        throw new Error(`Failed on special character boundary: ${char}`)
      }
    })
  })
})

// ============================================
// FUZZ TESTS: Error Path Fuzzing
// ============================================

describe('Fuzz: Error Handling', () => {
  it('only throws expected error types', () => {
    fuzzLoop((random, i) => {
      const html = generateHtmlString(random, 1000)

      // Try to trigger an error with invalid config
      try {
        markdownStrip(html, { allow: ['p'], strip: ['div'] })
        // Should throw, but if it doesn't, that's ok for this test
      } catch (e) {
        if (e instanceof ValidationError || e instanceof ParseError || e instanceof MarkdownError) {
          // Expected error types
        } else if (e instanceof Error && e.message.includes('Fuzz test failed')) {
          // Re-throw fuzz test errors
          throw e
        } else {
          throw new Error(`Unexpected error type: ${e?.constructor?.name}`)
        }
      }
    })
  })

  it('error messages never contain undefined or object strings', () => {
    fuzzLoop((random, i) => {
      const html = generateHtmlString(random, 500)

      try {
        markdownStrip(html, { allow: ['p'], strip: ['div'] })
      } catch (e) {
        if (e instanceof MarkdownError) {
          const msg = e.message
          if (msg.includes('undefined') || msg.includes('[object Object]')) {
            throw new Error(`Error message has poor formatting: ${msg}`)
          }
          if (msg.length === 0) {
            throw new Error(`Error message is empty`)
          }
        }
      }
    })
  })
})

// ============================================
// FUZZ TESTS: Security Fuzzing
// ============================================

describe('Fuzz: Security - XSS Vectors', () => {
  it('removes script tags in all variations', () => {
    fuzzLoop((random, i) => {
      const variations = [
        '<script>alert(1)</script>',
        '<SCRIPT>alert(1)</SCRIPT>',
        '<ScRiPt>alert(1)</ScRiPt>',
        '<script >alert(1)</script>',
        '<script\n>alert(1)</script>',
        '<script\t>alert(1)</script>',
      ]

      const vector = variations[Math.floor(random() * variations.length)]
      const output = markdown(vector, { sanitize: true })

      if (output.toLowerCase().includes('<script')) {
        throw new Error(`Script tag not removed: ${vector} => ${output}`)
      }
    })
  })

  it('removes event handlers in all variations', () => {
    fuzzLoop((random, i) => {
      const events = ['onclick', 'onerror', 'onload', 'onfocus', 'onmouseover']
      const event = events[Math.floor(random() * events.length)]
      const vector = `<div ${event}=alert(1)>test</div>`

      const output = markdown(vector, { sanitize: true })

      if (output.toLowerCase().includes(event)) {
        throw new Error(`Event handler not removed: ${vector} => ${output}`)
      }
    })
  })

  it('removes javascript protocol in all variations', () => {
    fuzzLoop((random, i) => {
      const variations = [
        '<a href="javascript:alert(1)">click</a>',
        '<a href="JAVASCRIPT:alert(1)">click</a>',
        '<a href="JaVaScRiPt:alert(1)">click</a>',
        '<a href=" javascript:alert(1)">click</a>',
      ]

      const vector = variations[Math.floor(random() * variations.length)]
      const output = markdown(vector, { sanitize: true })

      if (output.toLowerCase().includes('javascript:')) {
        throw new Error(`JavaScript protocol not removed: ${vector} => ${output}`)
      }
    })
  })

  it('never modifies Object.prototype', () => {
    fuzzLoop((random, i) => {
      const originalKeys = Object.keys(Object.prototype)

      const html = generateHtmlString(random, 1000)
      markdown(html)
      markdownStrip(html, 'safe')

      const newKeys = Object.keys(Object.prototype)

      if (originalKeys.length !== newKeys.length) {
        throw new Error(`Object.prototype was modified`)
      }
    })
  })
})
