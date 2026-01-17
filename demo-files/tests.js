// Import library to ensure it is available (also set by demo.js)
import * as Library from '../dist/index.js'
if (!window.Library) window.Library = Library

// ============================================
// DEMO INTEGRITY TESTS
// These tests verify the demo itself is correctly structured.
// They are IDENTICAL across all @motioneffector demos.
// Do not modify, skip, or weaken these tests.
// ============================================

function registerIntegrityTests() {
  // ─────────────────────────────────────────────
  // STRUCTURAL INTEGRITY
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Library is loaded', () => {
    if (typeof window.Library === 'undefined') {
      throw new Error('window.Library is undefined - library not loaded')
    }
  })

  testRunner.registerTest('[Integrity] Library has exports', () => {
    const exports = Object.keys(window.Library)
    if (exports.length === 0) {
      throw new Error('window.Library has no exports')
    }
  })

  testRunner.registerTest('[Integrity] Test runner exists', () => {
    const runner = document.getElementById('test-runner')
    if (!runner) {
      throw new Error('No element with id="test-runner"')
    }
  })

  testRunner.registerTest('[Integrity] Test runner is first section after header', () => {
    const main = document.querySelector('main')
    if (!main) {
      throw new Error('No <main> element found')
    }
    const firstSection = main.querySelector('section')
    if (!firstSection || firstSection.id !== 'test-runner') {
      throw new Error('Test runner must be the first <section> inside <main>')
    }
  })

  testRunner.registerTest('[Integrity] Run All Tests button exists with correct format', () => {
    const btn = document.getElementById('run-all-tests')
    if (!btn) {
      throw new Error('No button with id="run-all-tests"')
    }
    const text = btn.textContent.trim()
    if (!text.includes('Run All Tests')) {
      throw new Error(`Button text must include "Run All Tests", got: "${text}"`)
    }
    const icon = btn.querySelector('.btn-icon')
    if (!icon || !icon.textContent.includes('▶')) {
      throw new Error('Button must have play icon (▶) in .btn-icon element')
    }
  })

  testRunner.registerTest('[Integrity] At least one exhibit exists', () => {
    const exhibits = document.querySelectorAll('.exhibit')
    if (exhibits.length === 0) {
      throw new Error('No elements with class="exhibit"')
    }
  })

  testRunner.registerTest('[Integrity] All exhibits have unique IDs', () => {
    const exhibits = document.querySelectorAll('.exhibit')
    const ids = new Set()
    exhibits.forEach(ex => {
      if (!ex.id) {
        throw new Error('Exhibit missing id attribute')
      }
      if (ids.has(ex.id)) {
        throw new Error(`Duplicate exhibit id: ${ex.id}`)
      }
      ids.add(ex.id)
    })
  })

  testRunner.registerTest('[Integrity] All exhibits registered for walkthrough', () => {
    const exhibitElements = document.querySelectorAll('.exhibit')
    const registeredCount = testRunner.exhibits.length
    // Subtract test runner itself if it has .exhibit class
    const nonTestRunnerExhibits = Array.from(exhibitElements).filter(ex => ex.id !== 'test-runner').length
    if (registeredCount < nonTestRunnerExhibits) {
      throw new Error(
        `Only ${registeredCount} exhibits registered for walkthrough, ` +
        `but ${nonTestRunnerExhibits} .exhibit elements exist`
      )
    }
  })

  testRunner.registerTest('[Integrity] CSS loaded from demo-files/', () => {
    const links = document.querySelectorAll('link[rel="stylesheet"]')
    const hasExternal = Array.from(links).some(link =>
      link.href.includes('demo-files/')
    )
    if (!hasExternal) {
      throw new Error('No stylesheet loaded from demo-files/ directory')
    }
  })

  testRunner.registerTest('[Integrity] No inline style tags', () => {
    const styles = document.querySelectorAll('style')
    if (styles.length > 0) {
      throw new Error(`Found ${styles.length} inline <style> tags - extract to demo-files/demo.css`)
    }
  })

  testRunner.registerTest('[Integrity] No inline onclick handlers', () => {
    const withOnclick = document.querySelectorAll('[onclick]')
    if (withOnclick.length > 0) {
      throw new Error(`Found ${withOnclick.length} elements with onclick - use addEventListener`)
    }
  })

  // ─────────────────────────────────────────────
  // NO AUTO-PLAY VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Output areas are empty on load', () => {
    const outputs = document.querySelectorAll('.exhibit-output, .output, [data-output]')
    outputs.forEach(output => {
      // Allow placeholder text but not actual content
      const hasPlaceholder = output.dataset.placeholder ||
        output.classList.contains('placeholder') ||
        output.querySelector('.placeholder')

      const text = output.textContent.trim()
      const children = output.children.length

      // If it has content that isn't a placeholder, that's a violation
      if ((text.length > 50 || children > 1) && !hasPlaceholder) {
        throw new Error(
          `Output area appears pre-populated: "${text.substring(0, 50)}..." - ` +
          `outputs must be empty until user interaction`
        )
      }
    })
  })

  testRunner.registerTest('[Integrity] No setTimeout calls on module load', () => {
    // This test verifies by checking a flag set during load
    // The test-runner.js must set window.__demoLoadComplete = true after load
    // Any setTimeout from module load would not have completed
    if (window.__suspiciousTimersDetected) {
      throw new Error(
        'Detected setTimeout/setInterval during page load - ' +
        'demos must not auto-run'
      )
    }
  })

  // ─────────────────────────────────────────────
  // REAL LIBRARY VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Library functions are callable', () => {
    const lib = window.Library
    const exports = Object.keys(lib)

    // At least one export must be a function
    const hasFunctions = exports.some(key => typeof lib[key] === 'function')
    if (!hasFunctions) {
      throw new Error('Library exports no callable functions')
    }
  })

  testRunner.registerTest('[Integrity] No mock implementations detected', () => {
    // Check for common mock patterns in window
    const suspicious = [
      'mockParse', 'mockValidate', 'fakeParse', 'fakeValidate',
      'stubParse', 'stubValidate', 'testParse', 'testValidate'
    ]
    suspicious.forEach(name => {
      if (typeof window[name] === 'function') {
        throw new Error(`Detected mock function: window.${name} - use real library`)
      }
    })
  })

  // ─────────────────────────────────────────────
  // VISUAL FEEDBACK VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] CSS includes animation definitions', () => {
    const sheets = document.styleSheets
    let hasAnimations = false

    try {
      for (const sheet of sheets) {
        // Skip cross-origin stylesheets
        if (!sheet.href || sheet.href.includes('demo-files/')) {
          const rules = sheet.cssRules || sheet.rules
          for (const rule of rules) {
            if (rule.type === CSSRule.KEYFRAMES_RULE ||
                (rule.style && (
                  rule.style.animation ||
                  rule.style.transition ||
                  rule.style.animationName
                ))) {
              hasAnimations = true
              break
            }
          }
        }
        if (hasAnimations) break
      }
    } catch (e) {
      // CORS error - assume external sheet has animations
      hasAnimations = true
    }

    if (!hasAnimations) {
      throw new Error('No CSS animations or transitions found - visual feedback required')
    }
  })

  testRunner.registerTest('[Integrity] Interactive elements have hover states', () => {
    const buttons = document.querySelectorAll('button, .btn')
    if (buttons.length === 0) return // No buttons to check

    // Check that enabled buttons have pointer cursor (disabled buttons should have not-allowed)
    const enabledBtn = Array.from(buttons).find(btn => !btn.disabled)
    if (!enabledBtn) return // All buttons are disabled, skip check

    const styles = window.getComputedStyle(enabledBtn)
    if (styles.cursor !== 'pointer') {
      throw new Error('Buttons should have cursor: pointer')
    }
  })

  // ─────────────────────────────────────────────
  // WALKTHROUGH REGISTRATION VERIFICATION
  // ─────────────────────────────────────────────

  testRunner.registerTest('[Integrity] Walkthrough demonstrations are async functions', () => {
    testRunner.exhibits.forEach(exhibit => {
      if (typeof exhibit.demonstrate !== 'function') {
        throw new Error(`Exhibit "${exhibit.name}" has no demonstrate function`)
      }
      // Check if it's async by seeing if it returns a thenable
      const result = exhibit.demonstrate.toString()
      if (!result.includes('async') && !result.includes('Promise')) {
        console.warn(`Exhibit "${exhibit.name}" demonstrate() may not be async`)
      }
    })
  })

  testRunner.registerTest('[Integrity] Each exhibit has required elements', () => {
    const exhibits = document.querySelectorAll('.exhibit')
    exhibits.forEach(exhibit => {
      // Skip test runner
      if (exhibit.id === 'test-runner') return

      // Must have a title
      const title = exhibit.querySelector('.exhibit-title, h2, h3')
      if (!title) {
        throw new Error(`Exhibit ${exhibit.id} missing title element`)
      }

      // Must have an interactive or content area
      const interactive = exhibit.querySelector(
        '.exhibit-interactive, .exhibit-content, [data-interactive]'
      )
      if (!interactive) {
        throw new Error(`Exhibit ${exhibit.id} missing interactive area`)
      }
    })
  })
}

// Call this function at the start of tests.js, before library-specific tests
registerIntegrityTests()

// ============================================
// LIBRARY-SPECIFIC TESTS
// ============================================

// Basic parsing
testRunner.registerTest('converts # to h1', () => {
  const result = window.Library.markdown('# Hello')
  if (!result.includes('<h1>')) throw new Error(`Expected <h1>, got: ${result}`)
})

testRunner.registerTest('converts ## to h2', () => {
  const result = window.Library.markdown('## World')
  if (!result.includes('<h2>')) throw new Error(`Expected <h2>`)
})

testRunner.registerTest('converts paragraph', () => {
  const result = window.Library.markdown('Hello world')
  if (!result.includes('<p>')) throw new Error(`Expected <p>`)
})

testRunner.registerTest('converts **bold**', () => {
  const result = window.Library.markdown('**bold**')
  if (!result.includes('<strong>')) throw new Error(`Expected <strong>`)
})

testRunner.registerTest('converts *italic*', () => {
  const result = window.Library.markdown('*italic*')
  if (!result.includes('<em>')) throw new Error(`Expected <em>`)
})

testRunner.registerTest('converts `code`', () => {
  const result = window.Library.markdown('`code`')
  if (!result.includes('<code>')) throw new Error(`Expected <code>`)
})

testRunner.registerTest('converts [link](url)', () => {
  const result = window.Library.markdown('[text](url)')
  if (!result.includes('<a href="url">')) throw new Error(`Expected link`)
})

testRunner.registerTest('converts - list items', () => {
  const result = window.Library.markdown('- item')
  if (!result.includes('<ul>') || !result.includes('<li>')) throw new Error(`Expected list`)
})

testRunner.registerTest('converts 1. ordered list', () => {
  const result = window.Library.markdown('1. item')
  if (!result.includes('<ol>') || !result.includes('<li>')) throw new Error(`Expected ordered list`)
})

testRunner.registerTest('converts > blockquote', () => {
  const result = window.Library.markdown('> quote')
  if (!result.includes('<blockquote>')) throw new Error(`Expected blockquote`)
})

testRunner.registerTest('converts fenced code block', () => {
  const result = window.Library.markdown('```\ncode\n```')
  if (!result.includes('<pre>')) throw new Error(`Expected pre`)
})

testRunner.registerTest('converts ---', () => {
  const result = window.Library.markdown('---')
  if (!result.includes('<hr')) throw new Error(`Expected hr`)
})

// GFM features
testRunner.registerTest('converts GFM tables', () => {
  const result = window.Library.markdown('| A | B |\n|---|---|\n| 1 | 2 |')
  if (!result.includes('<table>')) throw new Error(`Expected table`)
})

testRunner.registerTest('converts ~~strikethrough~~', () => {
  const result = window.Library.markdown('~~deleted~~')
  if (!result.includes('<del>')) throw new Error(`Expected del`)
})

testRunner.registerTest('converts task lists', () => {
  const result = window.Library.markdown('- [x] done')
  if (!result.includes('checked')) throw new Error(`Expected checked`)
})

testRunner.registerTest('autolinks URLs', () => {
  const result = window.Library.markdown('Visit https://example.com')
  if (!result.includes('<a href="https://example.com">')) throw new Error(`Expected autolink`)
})

// Security tests
testRunner.registerTest('removes <script> tags', () => {
  const result = window.Library.markdown('<script>alert(1)</script>')
  if (result.includes('<script>')) throw new Error(`Script not removed`)
})

testRunner.registerTest('removes onerror handlers', () => {
  const result = window.Library.markdown('<img src=x onerror="alert(1)">')
  if (result.includes('onerror')) throw new Error(`Handler not removed`)
})

testRunner.registerTest('blocks javascript: URLs', () => {
  const result = window.Library.markdown('[click](javascript:alert(1))')
  if (result.includes('javascript:')) throw new Error(`JS URL not blocked`)
})

testRunner.registerTest('removes <iframe> tags', () => {
  const result = window.Library.markdown('<iframe src="evil.com"></iframe>')
  if (result.includes('<iframe')) throw new Error(`iframe not removed`)
})

testRunner.registerTest('removes <style> tags', () => {
  const result = window.Library.markdown('<style>body{}</style>')
  if (result.includes('<style>')) throw new Error(`Style not removed`)
})

testRunner.registerTest('blocks data: URLs', () => {
  const result = window.Library.markdown('[x](data:text/html,<script>)')
  if (result.includes('data:')) throw new Error(`Data URL not blocked`)
})

testRunner.registerTest('handles nested script attempts', () => {
  const result = window.Library.markdown('<scr<script>ipt>alert(1)</script>')
  if (result.includes('<script>')) throw new Error(`Nested script not blocked`)
})

// Strip tests
testRunner.registerTest('plaintext strips all tags', () => {
  const html = '<p><strong>Bold</strong></p>'
  const result = window.Library.markdownStrip(html, 'plaintext')
  if (result.includes('<')) throw new Error(`Tags not stripped`)
})

testRunner.registerTest('inline preset keeps strong', () => {
  const html = '<p><strong>Bold</strong></p>'
  const result = window.Library.markdownStrip(html, 'inline')
  if (!result.includes('<strong>')) throw new Error(`Strong stripped`)
})

testRunner.registerTest('safe preset blocks links', () => {
  const html = '<p><a href="url">Link</a></p>'
  const result = window.Library.markdownStrip(html, 'safe')
  if (result.includes('<a')) throw new Error(`Link not stripped`)
})

testRunner.registerTest('custom allow config', () => {
  const html = '<p><strong>Bold</strong><em>Italic</em></p>'
  const result = window.Library.markdownStrip(html, { allow: ['strong'] })
  if (!result.includes('<strong>') || result.includes('<em>')) {
    throw new Error(`Custom allow failed`)
  }
})

// Options tests
testRunner.registerTest('gfm:false disables tables', () => {
  const md = '| A |\n|---|\n| 1 |'
  const result = window.Library.markdown(md, { gfm: false })
  if (result.includes('<table>')) throw new Error(`Table should be disabled`)
})

testRunner.registerTest('breaks:true adds br', () => {
  const result = window.Library.markdown('Line 1\nLine 2', { breaks: true })
  if (!result.includes('<br')) throw new Error(`br not added`)
})

testRunner.registerTest('linkTarget adds attribute', () => {
  const result = window.Library.markdown('[link](url)', { linkTarget: '_blank' })
  if (!result.includes('target="_blank"')) throw new Error(`Target not added`)
})

// Edge cases
testRunner.registerTest('handles empty input', () => {
  const result = window.Library.markdown('')
  if (result !== '') throw new Error(`Expected empty`)
})

testRunner.registerTest('handles nested emphasis', () => {
  const result = window.Library.markdown('***bold italic***')
  if (!result.includes('<strong>') || !result.includes('<em>')) {
    throw new Error(`Nested emphasis failed`)
  }
})

testRunner.registerTest('handles deeply nested lists', () => {
  const result = window.Library.markdown('- a\n  - b\n    - c\n      - d')
  const liCount = (result.match(/<li>/g) || []).length
  if (liCount !== 4) throw new Error(`Expected 4 items, got ${liCount}`)
})

testRunner.registerTest('escapes code block content', () => {
  const result = window.Library.markdown('```\n<script>\n```')
  if (!result.includes('&lt;script&gt;')) throw new Error(`Code not escaped`)
})

testRunner.registerTest('handles reference links', () => {
  const result = window.Library.markdown('[text][ref]\n\n[ref]: url')
  if (!result.includes('<a href="url">')) throw new Error(`Ref link failed`)
})

testRunner.registerTest('converts images', () => {
  const result = window.Library.markdown('![alt](src)')
  if (!result.includes('<img')) throw new Error(`Image not created`)
})

testRunner.registerTest('handles setext headings', () => {
  const result = window.Library.markdown('Heading\n======')
  if (!result.includes('<h1>')) throw new Error(`Setext heading failed`)
})

// ============================================
// EXHIBIT REGISTRATIONS FOR WALKTHROUGH
// ============================================

testRunner.registerExhibit(
  'Block Builder',
  document.getElementById('block-builder'),
  async () => {
    // Demonstrate block builder
    const examples = ['nested-lists', 'tables', 'code', 'task-lists']
    for (const key of examples) {
      window.selectBlockExample(key)
      await testRunner.delay(800)
    }

    // Toggle GFM
    const gfm = document.getElementById('opt-gfm')
    gfm.checked = false
    gfm.dispatchEvent(new Event('change'))
    await testRunner.delay(600)
    gfm.checked = true
    gfm.dispatchEvent(new Event('change'))
    await testRunner.delay(600)
  }
)

testRunner.registerExhibit(
  'XSS Assault Course',
  document.getElementById('xss-assault'),
  async () => {
    // Cycle through several attacks
    const attacks = ['script-tag', 'event-handler', 'bad-url', 'iframe', 'multi-vector']
    for (const key of attacks) {
      window.selectAttack(key)
      await testRunner.delay(800)
    }
  }
)

testRunner.registerExhibit(
  'Filter Pipeline',
  document.getElementById('filter-pipeline'),
  async () => {
    // Cycle through content examples
    const contentExamples = ['user-comment', 'chat-message', 'email']
    for (const key of contentExamples) {
      window.selectContent(key)
      await testRunner.delay(600)
    }

    // Cycle through presets
    const presets = ['plaintext', 'inline', 'safe', 'prose']
    for (const key of presets) {
      window.selectPreset(key)
      await testRunner.delay(800)
    }
  }
)
