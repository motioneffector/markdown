import * as Library from '../dist/index.js'
window.Library = Library

const { markdown, markdownStrip } = Library

// ============================================
// LIBRARY VERIFICATION
// ============================================

if (typeof markdown === 'undefined' || typeof markdownStrip === 'undefined') {
  throw new Error(
    'Library not loaded. Run `npm run build` first, then serve this directory.'
  )
}

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

  // Set initial content WITHOUT processing it (no auto-play)
  inputEl.value = blockExamples['kitchen-sink'].content
  // Leave output EMPTY - do not call updateBlockOutput() here

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
window.selectBlockExample = function(key) {
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
        ${items.map(item =>
          `<button class="attack-btn" data-attack="${item.key}">${item.label}</button>`
        ).join('')}
      </div>
    </div>
  `).join('')

  // DO NOT show initial attack - leave empty until user clicks

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
window.selectAttack = function(key) {
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

  // DO NOT render initially - leave empty until user clicks

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
window.selectContent = function(key) {
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
window.selectPreset = function(key) {
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
// INITIALIZATION
// ============================================

// Initialize everything WITHOUT auto-play
document.addEventListener('DOMContentLoaded', () => {
  initBlockBuilder()
  initXssAssault()
  initFilterPipeline()

  // Note: Exhibits are initialized with UI elements populated,
  // but NO library functions are called until user interaction
})
