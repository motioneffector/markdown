import { markdown, markdownStrip } from 'https://esm.sh/@motioneffector/markdown@latest'

// ============================================
// EXAMPLE DATA
// ============================================

const blockExamples = {
  'kitchen-sink': {
    label: 'Kitchen Sink',
    content: `# Welcome to the Demo

A paragraph with **bold**, *italic*, and ~~strikethrough~~ text.

## Features List

- First item with **emphasis**
- Second item
  - Nested bullet
  - Another nested
    - Deep nesting

1. Ordered item
2. Another ordered

> A blockquote that spans
> multiple lines

| Column A | Column B | Column C |
|:---------|:--------:|---------:|
| Left     | Center   | Right    |

- [x] Completed task
- [ ] Pending task

\`\`\`javascript
const html = markdown('# Hello')
\`\`\`

---

Visit https://example.com for more.`
  },
  'nested-lists': {
    label: 'Nested Lists',
    content: `# Nested List Demo

- Level 1
  - Level 2
    - Level 3
      - Level 4
        - Level 5 (max visual depth)
  - Back to Level 2
- Another Level 1

1. First
   1. Nested ordered
      1. Deep ordered
   2. Second nested
2. Second`
  },
  'tables': {
    label: 'Tables',
    content: `# Table Alignment Demo

| Left | Center | Right | Default |
|:-----|:------:|------:|---------|
| A    | B      | C     | D       |
| Long text | Medium | X | Y |
| 1 | 2 | 3 | 4 |

Toggle GFM off to see this become plain text.`
  },
  'code': {
    label: 'Code Blocks',
    content: `# Code Block Demo

Inline code: \`const x = 1\`

Fenced code block:

\`\`\`typescript
function greet(name: string): string {
  return \\\`Hello, \\\${name}!\\\`
}
\`\`\`

Indented code block:

    function legacy() {
      return 'indented'
    }`
  },
  'task-lists': {
    label: 'Task Lists',
    content: `# Project Checklist

- [x] Set up repository
- [x] Write initial code
- [ ] Add tests
- [ ] Write documentation
  - [x] API reference
  - [ ] User guide
  - [ ] Examples
- [ ] Release v1.0`
  },
  'minimal': {
    label: 'Minimal',
    content: `# Hello World

This is a simple paragraph with **bold** and *italic* text.`
  }
}

const attacks = {
  'script-tag': {
    label: 'Script Tag',
    category: 'Injection',
    content: `Nice site! <script>alert('XSS')</script>`
  },
  'event-handler': {
    label: 'Event Handler',
    category: 'Injection',
    content: `<img src=x onerror="stealCookies()"> Great product!`
  },
  'bad-url': {
    label: 'JavaScript URL',
    category: 'URLs',
    content: `Check [this link](javascript:alert('xss')) out!`
  },
  'nested': {
    label: 'Nested Tags',
    category: 'Evasion',
    content: `<scr<script>ipt>alert('nested')</script>`
  },
  'iframe': {
    label: 'IFrame',
    category: 'Injection',
    content: `<iframe src="https://evil.com"></iframe> Welcome!`
  },
  'data-url': {
    label: 'Data URL',
    category: 'URLs',
    content: `<a href="data:text/html,<script>alert(1)</script>">Click</a>`
  },
  'style': {
    label: 'Style Tag',
    category: 'Injection',
    content: `<style>body{background:url('javascript:alert(1)')}</style>`
  },
  'multi-vector': {
    label: 'Multi-Vector',
    category: 'Combined',
    content: `<script>steal()</script>
<img src=x onerror="hack()">
[click](javascript:alert(1))
<iframe src="evil.com"></iframe>
<style>@import 'evil.css'</style>`
  }
}

const contentExamples = {
  'blog-post': {
    label: 'Blog Post',
    content: `# Getting Started with TypeScript

**TypeScript** adds static typing to JavaScript. Here's why you should use it.

## Benefits

- Catch errors at compile time
- Better IDE support
- Self-documenting code

Check [the official docs](https://typescriptlang.org) for more.

\`\`\`typescript
const greeting: string = "Hello"
\`\`\`

> TypeScript is JavaScript that scales.
> — Microsoft`
  },
  'user-comment': {
    label: 'User Comment',
    content: `**Great article!** I especially liked the part about *type inference*.

One question: how does this compare to [Flow](https://flow.org)?

<script>alert('trying to hack')</script>`
  },
  'chat-message': {
    label: 'Chat Message',
    content: `Hey! Did you see **this**?

Check https://example.com/cool-stuff

*Amazing* right?`
  },
  'code-docs': {
    label: 'Code Docs',
    content: `# API Reference

## \`createClient(options)\`

Creates a new client instance.

\`\`\`javascript
const client = createClient({ apiKey: 'xxx' })
\`\`\`

| Option | Type | Description |
|--------|------|-------------|
| apiKey | string | Your API key |
| timeout | number | Request timeout |`
  },
  'email': {
    label: 'Email',
    content: `# Weekly Newsletter

Dear subscriber,

This week we're excited to announce **three new features**:

1. Enhanced search
2. Better notifications
3. Dark mode

> "The best update yet!" — User feedback

Visit [our blog](https://blog.example.com) for details.

Best regards,
*The Team*`
  }
}

const presetInfo = {
  plaintext: {
    description: 'Removes all HTML, leaving only text content.',
    keeps: 'text only'
  },
  inline: {
    description: 'Keeps basic inline formatting only.',
    keeps: 'strong, em, code, a, br'
  },
  safe: {
    description: 'Keeps block structure without links.',
    keeps: 'p, strong, em, code, pre, ul, ol, li, blockquote, headings'
  },
  prose: {
    description: 'Full prose formatting with links.',
    keeps: 'p, strong, em, a, blockquote, headings, lists, br'
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function scrollToElement(element, offset = 100) {
  const top = element.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top, behavior: 'smooth' })
}

function getBlockType(tagName) {
  const tag = tagName.toLowerCase()
  if (/^h[1-6]$/.test(tag)) return 'heading'
  if (tag === 'p') return 'paragraph'
  if (tag === 'ul' || tag === 'ol' || tag === 'li') return 'list'
  if (tag === 'pre' || tag === 'code') return 'code'
  if (tag === 'blockquote') return 'blockquote'
  if (tag === 'table' || tag === 'tr' || tag === 'td' || tag === 'th') return 'table'
  if (tag === 'hr') return 'hr'
  return 'other'
}

function parseHtmlToVisual(html) {
  const container = document.createElement('div')
  container.innerHTML = html

  function processNode(node, depth = 0) {
    if (depth > 6) return ''

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim()
      if (text) {
        return `<span class="block-text">${escapeHtml(text)}</span>`
      }
      return ''
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase()
      const blockType = getBlockType(tag)
      const children = Array.from(node.childNodes).map(n => processNode(n, depth + 1)).join('')

      return `<div class="visual-block block-${blockType}" data-tag="${tag}">
        <span class="block-tag">&lt;${tag}&gt;</span>
        <div class="block-children">${children}</div>
      </div>`
    }
    return ''
  }

  return Array.from(container.childNodes).map(n => processNode(n)).join('')
}

// ============================================
// EXHIBIT 1: BLOCK BUILDER
// ============================================

let currentBlockExample = 'kitchen-sink'

function initBlockBuilder() {
  const examplesContainer = document.getElementById('block-examples')
  const inputEl = document.getElementById('block-input')
  const outputEl = document.getElementById('block-output')
  const clearBtn = document.getElementById('clear-input')
  const gfmToggle = document.getElementById('opt-gfm')
  const breaksToggle = document.getElementById('opt-breaks')

  // Generate example chips
  examplesContainer.innerHTML = Object.entries(blockExamples).map(([key, ex]) =>
    `<button class="example-chip${key === 'kitchen-sink' ? ' active' : ''}" data-example="${key}">${ex.label}</button>`
  ).join('')

  // Set initial content
  inputEl.value = blockExamples['kitchen-sink'].content
  updateBlockOutput()

  // Example chip clicks
  examplesContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('.example-chip')
    if (!chip) return

    examplesContainer.querySelectorAll('.example-chip').forEach(c => c.classList.remove('active'))
    chip.classList.add('active')
    currentBlockExample = chip.dataset.example
    inputEl.value = blockExamples[chip.dataset.example].content
    updateBlockOutput()
  })

  // Input changes
  inputEl.addEventListener('input', updateBlockOutput)

  // Clear button
  clearBtn.addEventListener('click', () => {
    inputEl.value = ''
    updateBlockOutput()
  })

  // Option toggles
  gfmToggle.addEventListener('change', updateBlockOutput)
  breaksToggle.addEventListener('change', updateBlockOutput)
}

function updateBlockOutput() {
  const inputEl = document.getElementById('block-input')
  const outputEl = document.getElementById('block-output')
  const gfm = document.getElementById('opt-gfm').checked
  const breaks = document.getElementById('opt-breaks').checked

  const html = markdown(inputEl.value, { gfm, breaks })
  outputEl.innerHTML = parseHtmlToVisual(html)
}

// Public function to select a block example (for tour)
function selectBlockExample(key) {
  const examplesContainer = document.getElementById('block-examples')
  const inputEl = document.getElementById('block-input')
  const chip = examplesContainer.querySelector(`[data-example="${key}"]`)

  if (chip) {
    examplesContainer.querySelectorAll('.example-chip').forEach(c => c.classList.remove('active'))
    chip.classList.add('active')
    currentBlockExample = key
    inputEl.value = blockExamples[key].content
    updateBlockOutput()
  }
}

// ============================================
// EXHIBIT 2: XSS ASSAULT COURSE
// ============================================

let attacksBlocked = 0
let vectorsTested = 0

function initXssAssault() {
  const categoriesContainer = document.getElementById('attack-categories')
  const attackInput = document.getElementById('attack-input')
  const attackOutput = document.getElementById('attack-output')
  const attackName = document.getElementById('attack-name')
  const attackStatus = document.getElementById('attack-status')
  const blockedCount = document.getElementById('attacks-blocked')
  const testedCount = document.getElementById('vectors-tested')

  // Generate attack buttons by category
  const categories = {}
  Object.entries(attacks).forEach(([key, attack]) => {
    if (!categories[attack.category]) categories[attack.category] = []
    categories[attack.category].push({ key, ...attack })
  })

  categoriesContainer.innerHTML = Object.entries(categories).map(([cat, items]) => `
    <div class="attack-category">
      <h4 class="category-title">${cat}</h4>
      <div class="attack-buttons">
        ${items.map((item, i) =>
          `<button class="attack-btn${cat === 'Injection' && i === 0 ? ' active' : ''}" data-attack="${item.key}">${item.label}</button>`
        ).join('')}
      </div>
    </div>
  `).join('')

  // Show initial attack
  showAttack('script-tag')

  // Attack button clicks
  categoriesContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.attack-btn')
    if (!btn) return

    categoriesContainer.querySelectorAll('.attack-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    showAttack(btn.dataset.attack)
  })
}

function showAttack(key) {
  const attack = attacks[key]
  const attackInput = document.getElementById('attack-input')
  const attackOutput = document.getElementById('attack-output')
  const attackName = document.getElementById('attack-name')
  const attackStatus = document.getElementById('attack-status')
  const blockedCount = document.getElementById('attacks-blocked')
  const testedCount = document.getElementById('vectors-tested')

  // Show malicious input
  attackInput.textContent = attack.content
  attackName.textContent = attack.label

  // Process through sanitizer
  const safeOutput = markdown(attack.content, { sanitize: true })
  attackOutput.innerHTML = escapeHtml(safeOutput)

  // Update stats
  vectorsTested++
  testedCount.textContent = vectorsTested

  // Check if attack was blocked (any dangerous patterns removed)
  const dangerous = /<script|onerror|onclick|javascript:|<iframe|<style|data:/i
  if (dangerous.test(attack.content) && !dangerous.test(safeOutput)) {
    attacksBlocked++
    blockedCount.textContent = attacksBlocked
    attackStatus.textContent = 'Blocked'
    attackStatus.className = 'status-badge safe'
  } else {
    attackStatus.textContent = 'Safe'
    attackStatus.className = 'status-badge safe'
  }

  // Flash effect
  attackOutput.classList.add('flash')
  setTimeout(() => attackOutput.classList.remove('flash'), 200)
}

// Public function to select an attack (for tour)
function selectAttack(key) {
  const categoriesContainer = document.getElementById('attack-categories')
  const btn = categoriesContainer.querySelector(`[data-attack="${key}"]`)

  if (btn) {
    categoriesContainer.querySelectorAll('.attack-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    showAttack(key)
  }
}

// ============================================
// EXHIBIT 3: FILTER PIPELINE
// ============================================

let currentContent = 'blog-post'
let currentPreset = 'safe'

function initFilterPipeline() {
  const contentContainer = document.getElementById('content-examples')
  const presetContainer = document.getElementById('preset-buttons')
  const presetInfoEl = document.getElementById('preset-info')

  // Generate content chips
  contentContainer.innerHTML = Object.entries(contentExamples).map(([key, ex]) =>
    `<button class="content-chip${key === 'blog-post' ? ' active' : ''}" data-content="${key}">${ex.label}</button>`
  ).join('')

  // Generate preset buttons
  presetContainer.innerHTML = Object.keys(presetInfo).map(key =>
    `<button class="preset-btn${key === 'safe' ? ' active' : ''}" data-preset="${key}">${key}</button>`
  ).join('')

  // Initial render
  updatePipeline()

  // Content chip clicks
  contentContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('.content-chip')
    if (!chip) return

    contentContainer.querySelectorAll('.content-chip').forEach(c => c.classList.remove('active'))
    chip.classList.add('active')
    currentContent = chip.dataset.content
    updatePipeline()
  })

  // Preset button clicks
  presetContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.preset-btn')
    if (!btn) return

    presetContainer.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentPreset = btn.dataset.preset
    updatePipeline()
  })
}

function updatePipeline() {
  const sourceEl = document.getElementById('pipeline-source')
  const outputEl = document.getElementById('pipeline-output')
  const presetLabel = document.getElementById('pipeline-preset')
  const infoEl = document.getElementById('preset-info')

  const content = contentExamples[currentContent].content
  const html = markdown(content, { gfm: true })

  // Show source
  sourceEl.textContent = html.substring(0, 500) + (html.length > 500 ? '...' : '')

  // Apply filter
  const filtered = markdownStrip(html, currentPreset)
  outputEl.textContent = filtered.substring(0, 500) + (filtered.length > 500 ? '...' : '')

  // Update preset label
  presetLabel.textContent = currentPreset

  // Update info
  const info = presetInfo[currentPreset]
  infoEl.innerHTML = `
    <h4 class="info-title">${currentPreset}</h4>
    <p class="info-description">${info.description}</p>
    <div class="info-tags">
      <span class="tag kept">Keeps: ${info.keeps}</span>
    </div>
  `
}

// Public function to select content (for tour)
function selectContent(key) {
  const contentContainer = document.getElementById('content-examples')
  const chip = contentContainer.querySelector(`[data-content="${key}"]`)

  if (chip) {
    contentContainer.querySelectorAll('.content-chip').forEach(c => c.classList.remove('active'))
    chip.classList.add('active')
    currentContent = key
    updatePipeline()
  }
}

// Public function to select preset (for tour)
function selectPreset(key) {
  const presetContainer = document.getElementById('preset-buttons')
  const btn = presetContainer.querySelector(`[data-preset="${key}"]`)

  if (btn) {
    presetContainer.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentPreset = key
    updatePipeline()
  }
}

// ============================================
// DEMO TOUR - Automated walkthrough
// ============================================

let tourRunning = false

async function runDemoTour() {
  if (tourRunning) return
  tourRunning = true

  const tourDelay = 400 // Time between each action (human-perceptible)

  // Highlight function
  function highlight(section) {
    document.querySelectorAll('.exhibit').forEach(s => s.classList.remove('tour-active'))
    section.classList.add('tour-active')
  }

  try {
    // === EXHIBIT 1: Block Builder ===
    const blockSection = document.getElementById('block-builder')
    scrollToElement(blockSection)
    highlight(blockSection)
    await sleep(tourDelay)

    // Cycle through block examples
    const blockKeys = Object.keys(blockExamples)
    for (const key of blockKeys) {
      selectBlockExample(key)
      await sleep(tourDelay)
    }

    // Toggle GFM off and on
    const gfmToggle = document.getElementById('opt-gfm')
    gfmToggle.checked = false
    gfmToggle.dispatchEvent(new Event('change'))
    await sleep(tourDelay)
    gfmToggle.checked = true
    gfmToggle.dispatchEvent(new Event('change'))
    await sleep(tourDelay)

    // === EXHIBIT 2: XSS Assault Course ===
    const xssSection = document.getElementById('xss-assault')
    scrollToElement(xssSection)
    highlight(xssSection)
    await sleep(tourDelay)

    // Fire all attacks
    const attackKeys = Object.keys(attacks)
    for (const key of attackKeys) {
      selectAttack(key)
      await sleep(tourDelay)
    }

    // === EXHIBIT 3: Filter Pipeline ===
    const filterSection = document.getElementById('filter-pipeline')
    scrollToElement(filterSection)
    highlight(filterSection)
    await sleep(tourDelay)

    // Cycle through content examples
    const contentKeys = Object.keys(contentExamples)
    for (const key of contentKeys) {
      selectContent(key)
      await sleep(tourDelay / 2)
    }

    // Cycle through presets
    const presetKeys = Object.keys(presetInfo)
    for (const key of presetKeys) {
      selectPreset(key)
      await sleep(tourDelay)
    }

    // === Scroll to Test Runner ===
    const testSection = document.getElementById('test-runner')
    scrollToElement(testSection)
    highlight(testSection)
    await sleep(tourDelay)

  } finally {
    // Remove highlights
    document.querySelectorAll('.exhibit').forEach(s => s.classList.remove('tour-active'))
    tourRunning = false
  }
}

// ============================================
// TEST RUNNER
// ============================================

const tests = []

function registerTest(name, fn) {
  tests.push({ name, fn })
}

async function runTests() {
  const resultsEl = document.getElementById('test-results')
  const progressBar = document.getElementById('progress-bar')
  const passedCount = document.getElementById('passed-count')
  const failedCount = document.getElementById('failed-count')
  const totalCount = document.getElementById('total-count')
  const runBtn = document.getElementById('run-tests')

  runBtn.disabled = true
  resultsEl.innerHTML = ''
  progressBar.style.width = '0%'

  let passed = 0
  let failed = 0

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i]
    const progress = ((i + 1) / tests.length) * 100
    progressBar.style.width = `${progress}%`

    try {
      await test.fn()
      passed++
      resultsEl.innerHTML += `
        <div class="test-result pass">
          <span class="test-icon">&#10003;</span>
          <span class="test-name">${escapeHtml(test.name)}</span>
        </div>
      `
    } catch (e) {
      failed++
      resultsEl.innerHTML += `
        <div class="test-result fail">
          <span class="test-icon">&#10007;</span>
          <span class="test-name">${escapeHtml(test.name)}</span>
          <span class="test-error">${escapeHtml(e.message)}</span>
        </div>
      `
    }

    // Update counts live
    passedCount.textContent = passed
    failedCount.textContent = failed
    totalCount.textContent = i + 1

    // Small delay for visibility
    await sleep(15)
  }

  progressBar.classList.toggle('success', failed === 0)
  progressBar.classList.toggle('failure', failed > 0)
  runBtn.disabled = false
}

async function runFuzzTests() {
  const resultsEl = document.getElementById('test-results')
  const progressBar = document.getElementById('progress-bar')
  const passedCount = document.getElementById('passed-count')
  const failedCount = document.getElementById('failed-count')
  const totalCount = document.getElementById('total-count')
  const fuzzBtn = document.getElementById('run-fuzz')

  fuzzBtn.disabled = true
  resultsEl.innerHTML = '<div class="fuzz-status">Running 1000 fuzz iterations...</div>'
  progressBar.style.width = '0%'
  progressBar.classList.remove('success', 'failure')

  const chars = 'abcdefghijklmnopqrstuvwxyz \n#*_`[]()|-<>!@$%^&=+{}\\/'
  const iterations = 1000
  let passed = 0
  let failed = 0
  const failures = []

  for (let i = 0; i < iterations; i++) {
    // Generate random input
    const length = Math.floor(Math.random() * 500) + 1
    let input = ''
    for (let j = 0; j < length; j++) {
      input += chars[Math.floor(Math.random() * chars.length)]
    }

    try {
      markdown(input)
      markdownStrip(markdown(input), 'safe')
      passed++
    } catch (e) {
      failed++
      if (failures.length < 5) {
        failures.push({ input: input.substring(0, 100), error: e.message })
      }
    }

    // Update progress every 50 iterations
    if (i % 50 === 0) {
      progressBar.style.width = `${((i + 1) / iterations) * 100}%`
      passedCount.textContent = passed
      failedCount.textContent = failed
      totalCount.textContent = i + 1
      await sleep(1)
    }
  }

  progressBar.style.width = '100%'
  passedCount.textContent = passed
  failedCount.textContent = failed
  totalCount.textContent = iterations

  if (failed === 0) {
    progressBar.classList.add('success')
    resultsEl.innerHTML = `
      <div class="test-result pass">
        <span class="test-icon">&#10003;</span>
        <span class="test-name">All ${iterations} fuzz iterations passed</span>
      </div>
    `
  } else {
    progressBar.classList.add('failure')
    resultsEl.innerHTML = failures.map(f => `
      <div class="test-result fail">
        <span class="test-icon">&#10007;</span>
        <span class="test-name">Fuzz failure</span>
        <span class="test-error">${escapeHtml(f.error)}</span>
      </div>
    `).join('')
  }

  fuzzBtn.disabled = false
}

// ============================================
// REGISTER TESTS
// ============================================

// Basic parsing
registerTest('converts # to h1', () => {
  const result = markdown('# Hello')
  if (!result.includes('<h1>')) throw new Error(`Expected <h1>, got: ${result}`)
})

registerTest('converts ## to h2', () => {
  const result = markdown('## World')
  if (!result.includes('<h2>')) throw new Error(`Expected <h2>`)
})

registerTest('converts paragraph', () => {
  const result = markdown('Hello world')
  if (!result.includes('<p>')) throw new Error(`Expected <p>`)
})

registerTest('converts **bold**', () => {
  const result = markdown('**bold**')
  if (!result.includes('<strong>')) throw new Error(`Expected <strong>`)
})

registerTest('converts *italic*', () => {
  const result = markdown('*italic*')
  if (!result.includes('<em>')) throw new Error(`Expected <em>`)
})

registerTest('converts `code`', () => {
  const result = markdown('`code`')
  if (!result.includes('<code>')) throw new Error(`Expected <code>`)
})

registerTest('converts [link](url)', () => {
  const result = markdown('[text](url)')
  if (!result.includes('<a href="url">')) throw new Error(`Expected link`)
})

registerTest('converts - list items', () => {
  const result = markdown('- item')
  if (!result.includes('<ul>') || !result.includes('<li>')) throw new Error(`Expected list`)
})

registerTest('converts 1. ordered list', () => {
  const result = markdown('1. item')
  if (!result.includes('<ol>') || !result.includes('<li>')) throw new Error(`Expected ordered list`)
})

registerTest('converts > blockquote', () => {
  const result = markdown('> quote')
  if (!result.includes('<blockquote>')) throw new Error(`Expected blockquote`)
})

registerTest('converts fenced code block', () => {
  const result = markdown('```\ncode\n```')
  if (!result.includes('<pre>')) throw new Error(`Expected pre`)
})

registerTest('converts ---', () => {
  const result = markdown('---')
  if (!result.includes('<hr')) throw new Error(`Expected hr`)
})

// GFM features
registerTest('converts GFM tables', () => {
  const result = markdown('| A | B |\n|---|---|\n| 1 | 2 |')
  if (!result.includes('<table>')) throw new Error(`Expected table`)
})

registerTest('converts ~~strikethrough~~', () => {
  const result = markdown('~~deleted~~')
  if (!result.includes('<del>')) throw new Error(`Expected del`)
})

registerTest('converts task lists', () => {
  const result = markdown('- [x] done')
  if (!result.includes('checked')) throw new Error(`Expected checked`)
})

registerTest('autolinks URLs', () => {
  const result = markdown('Visit https://example.com')
  if (!result.includes('<a href="https://example.com">')) throw new Error(`Expected autolink`)
})

// Security tests
registerTest('removes <script> tags', () => {
  const result = markdown('<script>alert(1)</script>')
  if (result.includes('<script>')) throw new Error(`Script not removed`)
})

registerTest('removes onerror handlers', () => {
  const result = markdown('<img src=x onerror="alert(1)">')
  if (result.includes('onerror')) throw new Error(`Handler not removed`)
})

registerTest('blocks javascript: URLs', () => {
  const result = markdown('[click](javascript:alert(1))')
  if (result.includes('javascript:')) throw new Error(`JS URL not blocked`)
})

registerTest('removes <iframe> tags', () => {
  const result = markdown('<iframe src="evil.com"></iframe>')
  if (result.includes('<iframe')) throw new Error(`iframe not removed`)
})

registerTest('removes <style> tags', () => {
  const result = markdown('<style>body{}</style>')
  if (result.includes('<style>')) throw new Error(`Style not removed`)
})

registerTest('blocks data: URLs', () => {
  const result = markdown('[x](data:text/html,<script>)')
  if (result.includes('data:')) throw new Error(`Data URL not blocked`)
})

registerTest('handles nested script attempts', () => {
  const result = markdown('<scr<script>ipt>alert(1)</script>')
  if (result.includes('<script>')) throw new Error(`Nested script not blocked`)
})

// Strip tests
registerTest('plaintext strips all tags', () => {
  const html = '<p><strong>Bold</strong></p>'
  const result = markdownStrip(html, 'plaintext')
  if (result.includes('<')) throw new Error(`Tags not stripped`)
})

registerTest('inline preset keeps strong', () => {
  const html = '<p><strong>Bold</strong></p>'
  const result = markdownStrip(html, 'inline')
  if (!result.includes('<strong>')) throw new Error(`Strong stripped`)
})

registerTest('safe preset blocks links', () => {
  const html = '<p><a href="url">Link</a></p>'
  const result = markdownStrip(html, 'safe')
  if (result.includes('<a')) throw new Error(`Link not stripped`)
})

registerTest('custom allow config', () => {
  const html = '<p><strong>Bold</strong><em>Italic</em></p>'
  const result = markdownStrip(html, { allow: ['strong'] })
  if (!result.includes('<strong>') || result.includes('<em>')) {
    throw new Error(`Custom allow failed`)
  }
})

// Options tests
registerTest('gfm:false disables tables', () => {
  const md = '| A |\n|---|\n| 1 |'
  const result = markdown(md, { gfm: false })
  if (result.includes('<table>')) throw new Error(`Table should be disabled`)
})

registerTest('breaks:true adds br', () => {
  const result = markdown('Line 1\nLine 2', { breaks: true })
  if (!result.includes('<br')) throw new Error(`br not added`)
})

registerTest('linkTarget adds attribute', () => {
  const result = markdown('[link](url)', { linkTarget: '_blank' })
  if (!result.includes('target="_blank"')) throw new Error(`Target not added`)
})

// Edge cases
registerTest('handles empty input', () => {
  const result = markdown('')
  if (result !== '') throw new Error(`Expected empty`)
})

registerTest('handles nested emphasis', () => {
  const result = markdown('***bold italic***')
  if (!result.includes('<strong>') || !result.includes('<em>')) {
    throw new Error(`Nested emphasis failed`)
  }
})

registerTest('handles deeply nested lists', () => {
  const result = markdown('- a\n  - b\n    - c\n      - d')
  const liCount = (result.match(/<li>/g) || []).length
  if (liCount !== 4) throw new Error(`Expected 4 items, got ${liCount}`)
})

registerTest('escapes code block content', () => {
  const result = markdown('```\n<script>\n```')
  if (!result.includes('&lt;script&gt;')) throw new Error(`Code not escaped`)
})

registerTest('handles reference links', () => {
  const result = markdown('[text][ref]\n\n[ref]: url')
  if (!result.includes('<a href="url">')) throw new Error(`Ref link failed`)
})

registerTest('converts images', () => {
  const result = markdown('![alt](src)')
  if (!result.includes('<img')) throw new Error(`Image not created`)
})

registerTest('handles setext headings', () => {
  const result = markdown('Heading\n======')
  if (!result.includes('<h1>')) throw new Error(`Setext heading failed`)
})

// ============================================
// INITIALIZATION
// ============================================

async function runAllTests() {
  const runBtn = document.getElementById('run-tests')
  runBtn.disabled = true

  // First run the actual tests
  runBtn.textContent = 'Running Tests...'
  await runTests()

  // Then run the demo tour as a visual playback
  runBtn.textContent = 'Playing Demo...'
  await runDemoTour()

  runBtn.textContent = 'Run All Tests'
  runBtn.disabled = false
}

function resetPage() {
  window.location.reload()
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  initBlockBuilder()
  initXssAssault()
  initFilterPipeline()

  // Wire up test runner buttons
  document.getElementById('run-tests').addEventListener('click', runAllTests)
  document.getElementById('run-fuzz').addEventListener('click', runFuzzTests)
  document.getElementById('reset-page').addEventListener('click', resetPage)
})
