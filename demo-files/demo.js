import { markdown, markdownStrip } from 'https://esm.sh/@motioneffector/markdown@latest'

// ============================================
// EXAMPLE DATA
// ============================================

const blockExamples = {
  'kitchen-sink': `# Welcome to the Demo

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

Visit https://example.com for more.`,

  'nested-lists': `# Nested List Demo

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
2. Second`,

  'tables': `# Table Alignment Demo

| Left | Center | Right | Default |
|:-----|:------:|------:|---------|
| A    | B      | C     | D       |
| Long text | Medium | X | Y |
| 1 | 2 | 3 | 4 |

Toggle GFM off to see this become plain text.`,

  'code': `# Code Block Demo

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
    }`,

  'task-lists': `# Project Checklist

- [x] Set up repository
- [x] Write initial code
- [ ] Add tests
- [ ] Write documentation
  - [x] API reference
  - [ ] User guide
  - [ ] Examples
- [ ] Release v1.0`,

  'minimal': `# Hello World

This is a simple paragraph with **bold** and *italic* text.`
}

const attacks = {
  'script-tag': `Nice site! <script>alert('XSS')</script>`,
  'event-handler': `<img src=x onerror="stealCookies()"> Great product!`,
  'bad-url': `Check [this link](javascript:alert('xss')) out!`,
  'nested': `<scr<script>ipt>alert('nested')</script>`,
  'iframe': `<iframe src="https://evil.com"></iframe> Welcome!`,
  'data-url': `<a href="data:text/html,<script>alert(1)</script>">Click</a>`,
  'style': `<style>body{background:url('javascript:alert(1)')}</style>`,
  'multi-vector': `<script>steal()</script>
<img src=x onerror="hack()">
[click](javascript:alert(1))
<iframe src="evil.com"></iframe>
<style>@import 'evil.css'</style>`
}

const contentExamples = {
  'blog-post': `# Getting Started with TypeScript

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
> — Microsoft`,

  'user-comment': `**Great article!** I especially liked the part about *type inference*.

One question: how does this compare to [Flow](https://flow.org)?

<script>alert('trying to hack')</script>`,

  'chat-message': `Hey! Did you see **this**?

Check https://example.com/cool-stuff

*Amazing* right?`,

  'code-docs': `# API Reference

## \`createClient(options)\`

Creates a new client instance.

\`\`\`javascript
const client = createClient({ apiKey: 'xxx' })
\`\`\`

| Option | Type | Description |
|--------|------|-------------|
| apiKey | string | Your API key |
| timeout | number | Request timeout |`,

  'email': `# Weekly Newsletter

Dear subscriber,

This week we're excited to announce **three new features**:

1. Enhanced search
2. Better notifications
3. Dark mode

> "The best update yet!" — User feedback

Visit [our blog](https://blog.example.com) for details.

Best regards,
*The Team*`,

  'minimal': `# Simple Example

A paragraph with **bold** and a [link](https://example.com).`
}

const presets = {
  plaintext: { allow: [] },
  inline: { allow: ['strong', 'em', 'code', 'a', 'br'] },
  safe: { allow: ['p', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
  prose: { allow: ['p', 'strong', 'em', 'a', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'br'] },
  custom: { allow: [] }
}

const allTags = ['p', 'strong', 'em', 'code', 'pre', 'a', 'img', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'br', 'hr']

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

function parseHtmlToBlocks(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  return extractBlocks(doc.body.firstChild)
}

function extractBlocks(element, depth = 0) {
  const blocks = []
  if (!element || !element.childNodes) return blocks

  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim()
      if (text) {
        blocks.push({ type: 'text', content: text, depth })
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase()
      const block = {
        type: tagName,
        content: getDirectText(node),
        depth,
        children: extractBlocks(node, depth + 1)
      }
      blocks.push(block)
    }
  }
  return blocks
}

function getDirectText(element) {
  let text = ''
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent
    }
  }
  return text.trim()
}

function countElements(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  return doc.body.firstChild.querySelectorAll('*').length
}

function getElementTypes(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const types = new Map()
  doc.body.firstChild.querySelectorAll('*').forEach(el => {
    const tag = el.tagName.toLowerCase()
    types.set(tag, (types.get(tag) || 0) + 1)
  })
  return types
}

// ============================================
// EXHIBIT 1: BLOCK BUILDER
// ============================================

const blockState = {
  currentExample: 'kitchen-sink',
  gfm: true,
  breaks: false,
  slowmo: false
}

function renderBlockVisual(html) {
  const container = document.getElementById('block-visual')
  const blocks = parseHtmlToBlocks(html)
  container.innerHTML = renderBlocks(blocks)
  updateBlockState(html)
}

function renderBlocks(blocks, maxDepth = 5) {
  if (!blocks.length) return '<div class="text-muted">No blocks</div>'

  return blocks.map(block => {
    if (block.type === 'text') {
      return `<span class="visual-block-content">${escapeHtml(block.content)}</span>`
    }

    const tagClass = getTagClass(block.type)
    const hasChildren = block.children && block.children.length > 0
    const childrenHtml = hasChildren && block.depth < maxDepth
      ? `<div class="visual-block-children">${renderBlocks(block.children, maxDepth)}</div>`
      : ''

    const contentHtml = block.content
      ? `<span class="visual-block-content">${formatContent(block.content)}</span>`
      : ''

    return `
      <div class="visual-block ${tagClass}" title="<${block.type}>">
        <span class="visual-block-tag">${block.type}</span>
        ${contentHtml}
        ${childrenHtml}
      </div>
    `
  }).join('')
}

function getTagClass(tag) {
  const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
  if (headings.includes(tag)) return tag
  const known = ['p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'table', 'hr']
  if (known.includes(tag)) return tag
  return 'p'
}

function formatContent(content) {
  return escapeHtml(content)
    .replace(/\*\*([^*]+)\*\*/g, '<span class="inline-emphasis">$1</span>')
    .replace(/\*([^*]+)\*/g, '<span class="inline-emphasis">$1</span>')
}

function updateBlockState(html) {
  const types = getElementTypes(html)
  const parts = []
  const order = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'table']

  for (const tag of order) {
    const count = types.get(tag)
    if (count) {
      parts.push(`${count} ${tag}${count > 1 ? 's' : ''}`)
    }
  }

  const stateEl = document.getElementById('block-state')
  stateEl.textContent = parts.length ? parts.join(', ') : 'No blocks'
}

function initBlockBuilder() {
  const sourceEl = document.getElementById('block-source')
  const exampleBtns = document.querySelectorAll('#block-examples .example-btn')

  // Set initial content
  sourceEl.value = blockExamples['kitchen-sink']
  updateBlockBuilder()

  // Example button clicks
  exampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      exampleBtns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      blockState.currentExample = btn.dataset.example
      sourceEl.value = blockExamples[btn.dataset.example]
      updateBlockBuilder()
    })
  })

  // Source input changes
  sourceEl.addEventListener('input', () => {
    updateBlockBuilder()
  })

  // Toggle changes
  document.getElementById('gfm-toggle').addEventListener('change', (e) => {
    blockState.gfm = e.target.checked
    updateBlockBuilder()
  })

  document.getElementById('breaks-toggle').addEventListener('change', (e) => {
    blockState.breaks = e.target.checked
    updateBlockBuilder()
  })

  document.getElementById('slowmo-toggle').addEventListener('change', (e) => {
    blockState.slowmo = e.target.checked
  })
}

function updateBlockBuilder() {
  const source = document.getElementById('block-source').value
  const html = markdown(source, {
    gfm: blockState.gfm,
    breaks: blockState.breaks
  })
  renderBlockVisual(html)
}

// ============================================
// EXHIBIT 2: XSS ASSAULT COURSE
// ============================================

const xssState = {
  shieldOn: true,
  attempted: 0,
  blocked: 0,
  success: 0,
  quarantine: []
}

function initXssAssault() {
  const attackInput = document.getElementById('attack-input')
  const attackBtns = document.querySelectorAll('#attack-examples .example-btn')

  // Set initial attack
  attackInput.value = attacks['script-tag']
  launchAttack()

  // Attack button clicks
  attackBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      attackBtns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      attackInput.value = attacks[btn.dataset.attack]
      launchAttack()
    })
  })

  // Shield toggle
  document.getElementById('shield-toggle').addEventListener('change', (e) => {
    xssState.shieldOn = e.target.checked
    updateShieldUI()
  })

  // Launch attack button
  document.getElementById('launch-attack').addEventListener('click', launchAttack)

  // Rapid fire button
  document.getElementById('rapid-fire').addEventListener('click', rapidFire)

  // Reset button
  document.getElementById('reset-xss').addEventListener('click', resetXss)
}

function launchAttack() {
  const input = document.getElementById('attack-input').value
  const victimComment = document.getElementById('victim-comment')
  const shieldIcon = document.getElementById('shield-icon')

  xssState.attempted++

  if (xssState.shieldOn) {
    // Shield is on - sanitize and block
    const safeHtml = markdown(input, { sanitize: true })
    victimComment.innerHTML = safeHtml

    // Flash shield
    shieldIcon.classList.add('flash')
    setTimeout(() => shieldIcon.classList.remove('flash'), 150)

    // Detect blocked threats
    const threats = detectThreats(input)
    if (threats.length > 0) {
      xssState.blocked++
      threats.forEach(threat => addToQuarantine(threat))
    }
  } else {
    // Shield is off - show "successful" attack
    xssState.success++

    // Check if there's a script or event handler
    if (input.includes('<script') || input.includes('onerror') || input.includes('onclick') || input.includes('javascript:')) {
      showFakeAlert()
    }

    // Show raw (but still escaped for demo safety)
    const unsafeHtml = markdown(input, { sanitize: false })
    victimComment.innerHTML = unsafeHtml
  }

  updateXssStats()
}

function detectThreats(input) {
  const threats = []
  if (/<script/i.test(input)) threats.push({ type: 'script', label: '<script>' })
  if (/on\w+\s*=/i.test(input)) threats.push({ type: 'handler', label: 'event handler' })
  if (/javascript:/i.test(input)) threats.push({ type: 'url', label: 'javascript: URL' })
  if (/<iframe/i.test(input)) threats.push({ type: 'iframe', label: '<iframe>' })
  if (/<style/i.test(input)) threats.push({ type: 'style', label: '<style>' })
  if (/data:/i.test(input)) threats.push({ type: 'data', label: 'data: URL' })
  return threats
}

function addToQuarantine(threat) {
  const container = document.getElementById('quarantine-items')

  // Remove empty message
  const empty = container.querySelector('.quarantine-empty')
  if (empty) empty.remove()

  // Check if this threat type already exists
  const existing = container.querySelector(`[data-threat="${threat.type}"]`)
  if (existing) return

  const item = document.createElement('div')
  item.className = 'quarantine-item'
  item.dataset.threat = threat.type
  item.innerHTML = `<span class="threat-icon">&#9760;</span><span>${escapeHtml(threat.label)}</span>`
  item.title = `Blocked: ${threat.label}`
  container.appendChild(item)

  xssState.quarantine.push(threat)
}

function updateShieldUI() {
  const shieldIcon = document.getElementById('shield-icon')
  const shieldStatus = document.getElementById('shield-status')
  const victimPage = document.getElementById('victim-page')
  const warningContainer = document.getElementById('warning-container')

  if (xssState.shieldOn) {
    shieldIcon.className = 'shield-icon active'
    shieldStatus.className = 'shield-status on'
    shieldStatus.textContent = 'PROTECTED'
    victimPage.classList.remove('vulnerable')
    warningContainer.innerHTML = ''
  } else {
    shieldIcon.className = 'shield-icon inactive'
    shieldStatus.className = 'shield-status off'
    shieldStatus.textContent = 'VULNERABLE'
    victimPage.classList.add('vulnerable')
    warningContainer.innerHTML = '<div class="warning-banner mb-md">PROTECTION DISABLED - DEMONSTRATION ONLY</div>'
  }
}

function updateXssStats() {
  document.getElementById('stat-attempted').textContent = xssState.attempted
  document.getElementById('stat-blocked').textContent = xssState.blocked
  document.getElementById('stat-success').textContent = xssState.success
}

async function rapidFire() {
  const attackBtns = document.querySelectorAll('#attack-examples .example-btn')
  const attackInput = document.getElementById('attack-input')

  for (const btn of attackBtns) {
    attackBtns.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    attackInput.value = attacks[btn.dataset.attack]
    launchAttack()
    await new Promise(r => setTimeout(r, 100))
  }
}

function resetXss() {
  xssState.attempted = 0
  xssState.blocked = 0
  xssState.success = 0
  xssState.quarantine = []

  document.getElementById('quarantine-items').innerHTML = '<span class="quarantine-empty">No threats intercepted yet</span>'
  document.getElementById('victim-comment').innerHTML = ''
  updateXssStats()

  // Reset to first attack
  const attackBtns = document.querySelectorAll('#attack-examples .example-btn')
  attackBtns.forEach(b => b.classList.remove('active'))
  attackBtns[0].classList.add('active')
  document.getElementById('attack-input').value = attacks['script-tag']
}

function showFakeAlert() {
  const container = document.getElementById('fake-alert-container')
  container.innerHTML = `
    <div class="fake-alert">
      <div class="fake-alert-title">XSS Attack Succeeded!</div>
      <div class="fake-alert-message">This is what happens when protection is disabled.</div>
      <button class="fake-alert-btn" onclick="this.parentElement.remove()">OK</button>
    </div>
  `
  setTimeout(() => {
    const alert = container.querySelector('.fake-alert')
    if (alert) alert.remove()
  }, 3000)
}

// ============================================
// EXHIBIT 3: FILTER PIPELINE
// ============================================

const filterState = {
  currentContent: 'blog-post',
  currentPreset: 'safe',
  allowedTags: [...presets.safe.allow],
  unwrap: true,
  animate: true
}

function initFilterPipeline() {
  const contentBtns = document.querySelectorAll('#content-examples .example-btn')
  const presetBtns = document.querySelectorAll('#preset-buttons .preset-btn')

  // Set initial state
  updateFilterPipeline()

  // Content example clicks
  contentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      contentBtns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      filterState.currentContent = btn.dataset.content
      updateFilterPipeline()
    })
  })

  // Preset clicks
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      filterState.currentPreset = btn.dataset.preset
      if (btn.dataset.preset !== 'custom') {
        filterState.allowedTags = [...(presets[btn.dataset.preset].allow || [])]
      }
      updateFilterBins()
      updateFilterPipeline()
    })
  })

  // Unwrap toggle
  document.getElementById('unwrap-toggle').addEventListener('change', (e) => {
    filterState.unwrap = e.target.checked
    updateFilterPipeline()
  })

  // Animate toggle
  document.getElementById('animate-toggle').addEventListener('change', (e) => {
    filterState.animate = e.target.checked
  })

  // Initialize bins
  updateFilterBins()
  initDragDrop()
}

function updateFilterBins() {
  const allowChips = document.getElementById('allow-chips')
  const blockChips = document.getElementById('block-chips')

  allowChips.innerHTML = filterState.allowedTags.map(tag =>
    `<div class="tag-chip" data-tag="${tag}" draggable="true">${tag}</div>`
  ).join('')

  const blockedTags = allTags.filter(t => !filterState.allowedTags.includes(t))
  blockChips.innerHTML = blockedTags.map(tag =>
    `<div class="tag-chip" data-tag="${tag}" draggable="true">${tag}</div>`
  ).join('')

  // Re-init drag handlers
  initDragDrop()
}

function initDragDrop() {
  const chips = document.querySelectorAll('.tag-chip')
  const allowBin = document.getElementById('allow-bin')
  const blockBin = document.getElementById('block-bin')

  chips.forEach(chip => {
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', chip.dataset.tag)
      chip.classList.add('dragging')
    })

    chip.addEventListener('dragend', () => {
      chip.classList.remove('dragging')
    })
  })

  ;[allowBin, blockBin].forEach(bin => {
    bin.addEventListener('dragover', (e) => {
      e.preventDefault()
      bin.classList.add('drag-over')
    })

    bin.addEventListener('dragleave', () => {
      bin.classList.remove('drag-over')
    })

    bin.addEventListener('drop', (e) => {
      e.preventDefault()
      bin.classList.remove('drag-over')
      const tag = e.dataTransfer.getData('text/plain')

      if (bin.id === 'allow-bin') {
        if (!filterState.allowedTags.includes(tag)) {
          filterState.allowedTags.push(tag)
        }
      } else {
        filterState.allowedTags = filterState.allowedTags.filter(t => t !== tag)
      }

      // Switch to custom preset
      const presetBtns = document.querySelectorAll('#preset-buttons .preset-btn')
      presetBtns.forEach(b => b.classList.remove('active'))
      document.querySelector('[data-preset="custom"]').classList.add('active')
      filterState.currentPreset = 'custom'

      updateFilterBins()
      updateFilterPipeline()
    })
  })
}

function updateFilterPipeline() {
  const content = contentExamples[filterState.currentContent]
  const inputHtml = markdown(content, { gfm: true })

  // Render input elements
  renderInputElements(inputHtml)

  // Apply filter
  let outputHtml
  if (filterState.allowedTags.length === 0) {
    outputHtml = markdownStrip(inputHtml, 'plaintext')
  } else {
    outputHtml = markdownStrip(inputHtml, {
      allow: filterState.allowedTags,
      unwrap: filterState.unwrap
    })
  }

  // Render output
  document.getElementById('output-content').innerHTML = outputHtml || '<span class="text-muted">(empty)</span>'

  // Update counts
  const inputCount = countElements(inputHtml)
  const outputCount = countElements(outputHtml)
  document.getElementById('input-count').textContent = `(${inputCount} elements)`
  document.getElementById('output-count').textContent = `(${outputCount} elements${inputCount !== outputCount ? `, ${inputCount - outputCount} filtered` : ''})`

  // Update config display
  updateFilterConfig()
}

function renderInputElements(html) {
  const container = document.getElementById('input-elements')
  const types = getElementTypes(html)

  container.innerHTML = Array.from(types.entries()).map(([tag, count]) => {
    const isAllowed = filterState.allowedTags.includes(tag)
    return `<div class="flow-element tag-${tag} ${isAllowed ? 'allowed' : 'blocked'}">${tag}${count > 1 ? ` x${count}` : ''}</div>`
  }).join('')
}

function updateFilterConfig() {
  const configEl = document.getElementById('filter-config')
  if (filterState.currentPreset === 'plaintext') {
    configEl.textContent = `markdownStrip(html, 'plaintext')`
  } else if (filterState.currentPreset !== 'custom') {
    configEl.textContent = `markdownStrip(html, '${filterState.currentPreset}')`
  } else {
    configEl.textContent = `markdownStrip(html, { allow: [${filterState.allowedTags.map(t => `'${t}'`).join(', ')}]${!filterState.unwrap ? ', unwrap: false' : ''} })`
  }
}

// ============================================
// TEST RUNNER
// ============================================

const testRunner = {
  tests: [],
  results: [],
  running: false,

  register(name, fn) {
    this.tests.push({ name, fn })
  },

  async run() {
    if (this.running) return
    this.running = true
    this.results = []

    const output = document.getElementById('test-output')
    const progressFill = document.getElementById('progress-fill')
    const progressText = document.getElementById('progress-text')
    const summary = document.getElementById('test-summary')
    const passedCount = document.getElementById('passed-count')
    const failedCount = document.getElementById('failed-count')
    const skippedCount = document.getElementById('skipped-count')
    const runBtn = document.getElementById('run-tests')

    runBtn.disabled = true
    output.innerHTML = ''
    summary.classList.add('hidden')
    progressFill.style.width = '0%'
    progressFill.className = 'test-progress-fill'

    let passed = 0
    let failed = 0

    for (let i = 0; i < this.tests.length; i++) {
      const test = this.tests[i]
      const progress = ((i + 1) / this.tests.length) * 100

      progressFill.style.width = `${progress}%`
      progressText.textContent = `Running: ${test.name}`

      try {
        await test.fn()
        passed++
        this.results.push({ name: test.name, passed: true })
        output.innerHTML += `
          <div class="test-item">
            <span class="test-icon pass">&#10003;</span>
            <span class="test-name">${escapeHtml(test.name)}</span>
          </div>
        `
      } catch (e) {
        failed++
        this.results.push({ name: test.name, passed: false, error: e.message })
        output.innerHTML += `
          <div class="test-item">
            <span class="test-icon fail">&#10007;</span>
            <div>
              <div class="test-name">${escapeHtml(test.name)}</div>
              <div class="test-error">${escapeHtml(e.message)}</div>
            </div>
          </div>
        `
      }

      output.scrollTop = output.scrollHeight
      await new Promise(r => setTimeout(r, 20))
    }

    progressFill.classList.add(failed === 0 ? 'success' : 'failure')
    progressText.textContent = `Complete: ${passed}/${this.tests.length} passed`

    passedCount.textContent = passed
    failedCount.textContent = failed
    skippedCount.textContent = 0
    summary.classList.remove('hidden')

    runBtn.disabled = false
    this.running = false
  }
}

// ============================================
// REGISTER TESTS
// ============================================

// Basic parsing tests
testRunner.register('converts heading to h1', () => {
  const result = markdown('# Hello')
  if (!result.includes('<h1>')) throw new Error(`Expected <h1>, got: ${result}`)
})

testRunner.register('converts ## to h2', () => {
  const result = markdown('## World')
  if (!result.includes('<h2>')) throw new Error(`Expected <h2>, got: ${result}`)
})

testRunner.register('converts paragraph', () => {
  const result = markdown('Hello world')
  if (!result.includes('<p>')) throw new Error(`Expected <p>, got: ${result}`)
})

testRunner.register('converts bold text', () => {
  const result = markdown('**bold**')
  if (!result.includes('<strong>')) throw new Error(`Expected <strong>, got: ${result}`)
})

testRunner.register('converts italic text', () => {
  const result = markdown('*italic*')
  if (!result.includes('<em>')) throw new Error(`Expected <em>, got: ${result}`)
})

testRunner.register('converts inline code', () => {
  const result = markdown('`code`')
  if (!result.includes('<code>')) throw new Error(`Expected <code>, got: ${result}`)
})

testRunner.register('converts links', () => {
  const result = markdown('[text](url)')
  if (!result.includes('<a href="url">')) throw new Error(`Expected link, got: ${result}`)
})

testRunner.register('converts unordered list', () => {
  const result = markdown('- item')
  if (!result.includes('<ul>') || !result.includes('<li>')) throw new Error(`Expected list, got: ${result}`)
})

testRunner.register('converts ordered list', () => {
  const result = markdown('1. item')
  if (!result.includes('<ol>') || !result.includes('<li>')) throw new Error(`Expected ordered list, got: ${result}`)
})

testRunner.register('converts blockquote', () => {
  const result = markdown('> quote')
  if (!result.includes('<blockquote>')) throw new Error(`Expected blockquote, got: ${result}`)
})

testRunner.register('converts fenced code block', () => {
  const result = markdown('```\ncode\n```')
  if (!result.includes('<pre>') || !result.includes('<code>')) throw new Error(`Expected code block, got: ${result}`)
})

testRunner.register('converts horizontal rule', () => {
  const result = markdown('---')
  if (!result.includes('<hr')) throw new Error(`Expected hr, got: ${result}`)
})

// GFM tests
testRunner.register('converts GFM tables', () => {
  const result = markdown('| A | B |\n|---|---|\n| 1 | 2 |')
  if (!result.includes('<table>')) throw new Error(`Expected table, got: ${result}`)
})

testRunner.register('converts strikethrough', () => {
  const result = markdown('~~deleted~~')
  if (!result.includes('<del>')) throw new Error(`Expected del, got: ${result}`)
})

testRunner.register('converts task list', () => {
  const result = markdown('- [x] done')
  if (!result.includes('checked')) throw new Error(`Expected checked checkbox, got: ${result}`)
})

testRunner.register('autolinks URLs', () => {
  const result = markdown('Visit https://example.com today')
  if (!result.includes('<a href="https://example.com">')) throw new Error(`Expected autolink, got: ${result}`)
})

// Security tests
testRunner.register('removes script tags', () => {
  const result = markdown('<script>alert(1)</script>')
  if (result.includes('<script>')) throw new Error(`Script tag not removed: ${result}`)
})

testRunner.register('removes event handlers', () => {
  const result = markdown('<img src=x onerror="alert(1)">')
  if (result.includes('onerror')) throw new Error(`Event handler not removed: ${result}`)
})

testRunner.register('blocks javascript: URLs', () => {
  const result = markdown('[click](javascript:alert(1))')
  if (result.includes('javascript:')) throw new Error(`JavaScript URL not blocked: ${result}`)
})

testRunner.register('removes iframe tags', () => {
  const result = markdown('<iframe src="evil.com"></iframe>')
  if (result.includes('<iframe>')) throw new Error(`iframe not removed: ${result}`)
})

testRunner.register('removes style tags', () => {
  const result = markdown('<style>body{}</style>')
  if (result.includes('<style>')) throw new Error(`Style tag not removed: ${result}`)
})

testRunner.register('removes data: URLs in links', () => {
  const result = markdown('[click](data:text/html,<script>alert(1)</script>)')
  if (result.includes('data:')) throw new Error(`Data URL not blocked: ${result}`)
})

testRunner.register('handles nested script attempts', () => {
  const result = markdown('<scr<script>ipt>alert(1)</script>')
  if (result.includes('<script>')) throw new Error(`Nested script not blocked: ${result}`)
})

// Strip tests
testRunner.register('plaintext preset strips all tags', () => {
  const html = '<p><strong>Bold</strong></p>'
  const result = markdownStrip(html, 'plaintext')
  if (result.includes('<')) throw new Error(`Tags not stripped: ${result}`)
})

testRunner.register('inline preset keeps strong', () => {
  const html = '<p><strong>Bold</strong></p>'
  const result = markdownStrip(html, 'inline')
  if (!result.includes('<strong>')) throw new Error(`Strong tag stripped: ${result}`)
})

testRunner.register('safe preset blocks links', () => {
  const html = '<p><a href="url">Link</a></p>'
  const result = markdownStrip(html, 'safe')
  if (result.includes('<a')) throw new Error(`Link not stripped: ${result}`)
})

testRunner.register('custom allow config works', () => {
  const html = '<p><strong>Bold</strong><em>Italic</em></p>'
  const result = markdownStrip(html, { allow: ['strong'] })
  if (!result.includes('<strong>') || result.includes('<em>')) {
    throw new Error(`Custom allow failed: ${result}`)
  }
})

testRunner.register('unwrap option keeps content', () => {
  const html = '<p><strong>Bold</strong></p>'
  const result = markdownStrip(html, { allow: [], unwrap: true })
  if (!result.includes('Bold')) throw new Error(`Content not preserved: ${result}`)
})

testRunner.register('dangerous tags always removed from strip', () => {
  const html = '<script>alert(1)</script>'
  const result = markdownStrip(html, { allow: ['script'] })
  if (result.includes('<script>')) throw new Error(`Script not removed: ${result}`)
})

// Options tests
testRunner.register('gfm option controls tables', () => {
  const md = '| A |\n|---|\n| 1 |'
  const withGfm = markdown(md, { gfm: true })
  const withoutGfm = markdown(md, { gfm: false })
  if (!withGfm.includes('<table>')) throw new Error('GFM should enable tables')
  if (withoutGfm.includes('<table>')) throw new Error('GFM off should disable tables')
})

testRunner.register('breaks option adds br tags', () => {
  const md = 'Line 1\nLine 2'
  const withBreaks = markdown(md, { breaks: true })
  const withoutBreaks = markdown(md, { breaks: false })
  if (!withBreaks.includes('<br')) throw new Error('Breaks should add br tags')
  if (withoutBreaks.includes('<br')) throw new Error('No breaks should not add br')
})

testRunner.register('linkTarget option adds target attribute', () => {
  const result = markdown('[link](url)', { linkTarget: '_blank' })
  if (!result.includes('target="_blank"')) throw new Error(`Target not added: ${result}`)
})

// Edge cases
testRunner.register('handles empty input', () => {
  const result = markdown('')
  if (result !== '') throw new Error(`Expected empty, got: ${result}`)
})

testRunner.register('handles whitespace only', () => {
  const result = markdown('   \n\n   ')
  if (result.trim() !== '') throw new Error(`Expected empty, got: ${result}`)
})

testRunner.register('handles nested emphasis', () => {
  const result = markdown('***bold italic***')
  if (!result.includes('<strong>') || !result.includes('<em>')) {
    throw new Error(`Nested emphasis failed: ${result}`)
  }
})

testRunner.register('handles deeply nested lists', () => {
  const result = markdown('- a\n  - b\n    - c\n      - d')
  const liCount = (result.match(/<li>/g) || []).length
  if (liCount !== 4) throw new Error(`Expected 4 list items, got: ${liCount}`)
})

testRunner.register('preserves code block content exactly', () => {
  const result = markdown('```\n<script>alert(1)</script>\n```')
  if (!result.includes('&lt;script&gt;')) throw new Error(`Code block content not escaped: ${result}`)
})

testRunner.register('handles reference links', () => {
  const result = markdown('[text][ref]\n\n[ref]: url')
  if (!result.includes('<a href="url">')) throw new Error(`Reference link failed: ${result}`)
})

testRunner.register('handles images', () => {
  const result = markdown('![alt](src)')
  if (!result.includes('<img')) throw new Error(`Image not created: ${result}`)
})

testRunner.register('handles setext headings', () => {
  const result = markdown('Heading\n======')
  if (!result.includes('<h1>')) throw new Error(`Setext heading failed: ${result}`)
})

document.getElementById('run-tests').addEventListener('click', () => testRunner.run())

// Fuzz test runner
const fuzzRunner = {
  running: false,
  iterations: 0,
  maxIterations: 1000,

  generateRandomInput() {
    const chars = 'abcdefghijklmnopqrstuvwxyz \n#*_`[]()|-<>!@$%^&=+{}\\/'
    const length = Math.floor(Math.random() * 500) + 1
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
  },

  async run() {
    if (this.running) return
    this.running = true
    this.iterations = 0

    const output = document.getElementById('test-output')
    const progressFill = document.getElementById('progress-fill')
    const progressText = document.getElementById('progress-text')
    const summary = document.getElementById('test-summary')
    const runBtn = document.getElementById('run-fuzz')

    runBtn.disabled = true
    output.innerHTML = ''
    summary.classList.add('hidden')
    progressFill.style.width = '0%'
    progressFill.className = 'test-progress-fill'

    let passed = 0
    let failed = 0

    for (let i = 0; i < this.maxIterations; i++) {
      this.iterations = i + 1
      const progress = ((i + 1) / this.maxIterations) * 100
      progressFill.style.width = `${progress}%`

      const input = this.generateRandomInput()

      try {
        markdown(input)
        markdownStrip(markdown(input), 'safe')
        passed++
      } catch (e) {
        failed++
        output.innerHTML += `
          <div class="test-item">
            <span class="test-icon fail">&#10007;</span>
            <div>
              <div class="test-name">Fuzz iteration ${i + 1}</div>
              <div class="test-error">${escapeHtml(e.message)}</div>
              <div class="test-error">Input: ${escapeHtml(input.substring(0, 100))}...</div>
            </div>
          </div>
        `
      }

      if (i % 100 === 0) {
        progressText.textContent = `Fuzz testing: ${i + 1}/${this.maxIterations} (${failed} failures)`
        await new Promise(r => setTimeout(r, 1))
      }
    }

    progressFill.classList.add(failed === 0 ? 'success' : 'failure')
    progressText.textContent = `Fuzz complete: ${passed}/${this.maxIterations} passed`

    document.getElementById('passed-count').textContent = passed
    document.getElementById('failed-count').textContent = failed
    document.getElementById('skipped-count').textContent = 0
    summary.classList.remove('hidden')

    if (failed === 0) {
      output.innerHTML = `
        <div class="test-item">
          <span class="test-icon pass">&#10003;</span>
          <span class="test-name">All ${this.maxIterations} fuzz iterations passed</span>
        </div>
      `
    }

    runBtn.disabled = false
    this.running = false
  }
}

document.getElementById('run-fuzz').addEventListener('click', () => fuzzRunner.run())

// ============================================
// INITIALIZE
// ============================================

initBlockBuilder()
initXssAssault()
initFilterPipeline()
