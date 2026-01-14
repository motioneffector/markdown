# Final Optimization Plan: Achieving <10ms Target

**⚠️ CRITICAL: COMMIT AFTER EVERY SINGLE STEP. NO EXCEPTIONS. NO BATCHING.**

---

## Executive Summary

**Current State:**
- Performance: 18.5ms average (Min: 18.18ms, Median: 18.53ms, Max: 19.32ms)
- Target: <10ms
- Gap: 46% improvement needed (1.9x too slow)
- Tests: 206/206 passing ✅

**Required Improvement:** ~8.5ms reduction (46% faster)

**Strategy:** Profile-first approach, then targeted optimizations

**Estimated Timeline:** 8-12 hours of focused work

**⚠️ NEVER COMMIT OPTIMIZATION_PLAN.md OR THIS FILE - WORKING DOCUMENTS ONLY**

---

## Phase 0: Profiling & Baseline (MANDATORY FIRST STEP)

**⚠️ DO NOT PROCEED TO OPTIMIZATIONS UNTIL PROFILING IS COMPLETE**

This phase identifies where time is actually spent, preventing wasted effort.

---

### Step 0.1: Set Up Profiling Infrastructure

**⚠️ COMMIT THIS STEP BEFORE PROCEEDING TO 0.2**

#### What to Create

Create `profile.ts` in project root:

```typescript
import { markdown } from './src/markdown'
import { readFileSync } from 'fs'

// Generate realistic markdown document
function generateLargeDoc(): string {
  const sections = []

  // Mix of content types
  for (let i = 0; i < 100; i++) {
    sections.push(`# Section ${i}`)
    sections.push('')
    sections.push(`This is paragraph ${i} with *emphasis* and **bold** text.`)
    sections.push('')
    sections.push(`Here's some \`code\` and a [link](https://example.com).`)
    sections.push('')

    if (i % 5 === 0) {
      sections.push('```javascript')
      sections.push('function example() {')
      sections.push('  return 42')
      sections.push('}')
      sections.push('```')
      sections.push('')
    }

    if (i % 7 === 0) {
      sections.push('| Header 1 | Header 2 |')
      sections.push('|----------|----------|')
      sections.push('| Cell 1   | Cell 2   |')
      sections.push('')
    }

    if (i % 3 === 0) {
      sections.push('- List item 1')
      sections.push('  - Nested item')
      sections.push('- List item 2')
      sections.push('')
    }
  }

  return sections.join('\n')
}

const doc = generateLargeDoc()
console.log(`Document size: ${doc.length} bytes`)

// Warmup
for (let i = 0; i < 10; i++) {
  markdown(doc)
}

// Profile run
const iterations = 1000
console.log(`\nProfiling ${iterations} iterations...`)
console.log('Run with: node --prof --no-logfile-per-isolate profile.js')
console.log('Then: node --prof-process isolate-*.log > profile.txt\n')

const start = performance.now()
for (let i = 0; i < iterations; i++) {
  markdown(doc)
}
const end = performance.now()

console.log(`Total: ${end - start}ms`)
console.log(`Average: ${(end - start) / iterations}ms`)
```

#### Implementation Steps

1. Create `profile.ts` in project root with above content
2. Update `tsconfig.json` if needed to include profile.ts
3. Test it runs: `npx tsx profile.ts`

#### Testing

```bash
npx tsx profile.ts
# Should output: "Document size: ~95000 bytes" and timing info
```

**Expected:** Script runs without errors, shows timing

#### Commit

```bash
git add profile.ts
git commit -m "perf: add profiling infrastructure for optimization work"
```

**⚠️ STOP. DO NOT PROCEED UNTIL STEP 0.1 IS COMMITTED.**

---

### Step 0.2: Run Profiling and Analyze

**⚠️ YOU MUST HAVE COMMITTED STEP 0.1 BEFORE STARTING THIS**

#### What to Do

1. Build the TypeScript: `npm run build` (if needed)
2. Run profiling:
   ```bash
   npx tsx --prof profile.ts
   node --prof-process isolate-*.log > profile-report.txt
   ```

3. Analyze `profile-report.txt`:
   - Look for functions taking >5% of total time
   - Identify hotspots in `src/markdown.ts`
   - Note specific functions: `parseEmphasis`, `processInlineSinglePass`, `parseBlocks`, etc.

4. Create `PROFILE_ANALYSIS.md`:
   ```markdown
   # Profile Analysis - [DATE]

   ## Top Hotspots (>5% of total time)

   1. [Function name] - X% of time
      - Line numbers: [start-end]
      - Reason: [why is this slow?]

   2. [Function name] - Y% of time
      - Line numbers: [start-end]
      - Reason: [why is this slow?]

   ## Optimization Priority Order

   Based on actual profiling data:
   1. [Highest impact optimization]
   2. [Second highest impact]
   3. [Third highest impact]

   ## Key Findings

   - [Finding 1]
   - [Finding 2]
   ```

#### Expected Results

**Common hotspots to look for:**
- `parseEmphasis()` - recursive, complex delimiter matching
- `processInlineSinglePass()` - called frequently
- `parseBlocks()` - splits and iterates all lines
- Regex operations (`.match()`, `.test()`)
- String operations (`.slice()`, `.indexOf()`)

#### Commit

```bash
git add PROFILE_ANALYSIS.md profile-report.txt
git commit -m "perf: add profile analysis results"
```

**⚠️ STOP. DO NOT PROCEED UNTIL STEP 0.2 IS COMMITTED.**

---

### Step 0.3: Prioritize Optimizations Based on Profile

**⚠️ YOU MUST HAVE COMMITTED STEP 0.2 BEFORE STARTING THIS**

#### What to Do

Based on profile results, reorder the optimizations below. The plan is structured assuming:

**Likely profile results:**
1. **Inline parsing (emphasis, links)** - 40-50% of time
2. **Block parsing** - 20-30% of time
3. **Regex operations** - 10-20% of time
4. **String operations** - 10-15% of time

#### Decision Tree

**If `parseEmphasis()` is >15% of time:**
→ Prioritize Phase 1 (Optimization 9)

**If `parseBlocks()` is >15% of time:**
→ Prioritize Phase 2 (Optimization 8.2-8.5)

**If regex operations dominate:**
→ Prioritize Phase 3 (Regex caching)

**If nothing is >10%:**
→ No silver bullet; need multiple small optimizations

#### Document Decision

Update `PROFILE_ANALYSIS.md` with:
```markdown
## Optimization Execution Order

Based on profiling, we will execute in this order:

1. **Phase [X]** - [Function name] is [Y]% of time, expected gain: [Z]%
2. **Phase [X]** - [Function name] is [Y]% of time, expected gain: [Z]%
3. **Phase [X]** - [Function name] is [Y]% of time, expected gain: [Z]%

Target: Achieve <10ms (currently 18.5ms, need 46% improvement)
```

#### Commit

```bash
git add PROFILE_ANALYSIS.md
git commit -m "perf: prioritize optimizations based on profile data"
```

**⚠️ STOP. DO NOT PROCEED UNTIL STEP 0.3 IS COMMITTED.**

**✅ PHASE 0 COMPLETE - PROFILING DONE, PROCEED TO OPTIMIZATIONS**

---

## Phase 1: Optimization 9 Revisited - Simplified Emphasis Parsing

**Risk:** Medium | **Expected Impact:** 20-30% | **Priority:** HIGH (if profile confirms)

**⚠️ ONLY START THIS PHASE IF PROFILE SHOWS parseEmphasis() IS A HOTSPOT (>10% time)**

**Strategy:** Learn from failed attempt. Use simpler algorithm, handle edge cases separately.

---

### Step 9A.1: Add Performance Test for Emphasis Only

**⚠️ COMMIT THIS STEP BEFORE PROCEEDING TO 9A.2**

#### Purpose

Isolated performance test for emphasis parsing to measure impact directly.

#### What to Add

Create `benchmark-emphasis.ts`:

```typescript
import { markdown } from './src/markdown'

const testCases = [
  '*simple italic*',
  '**simple bold**',
  '***simple both***',
  '*italic with **bold** inside*',
  '**bold with *italic* inside**',
  '*foo **bar** baz*',
  'text with *emphasis* and **bold** and ***both***',
  '***really **deeply *nested* emphasis** here***',
]

// Generate document with lots of emphasis
const doc = testCases.map(tc => {
  return Array(100).fill(tc).join(' ')
}).join('\n\n')

console.log(`Document size: ${doc.length} bytes`)
console.log(`Focus: Emphasis parsing\n`)

// Warmup
for (let i = 0; i < 10; i++) {
  markdown(doc)
}

// Benchmark
const iterations = 100
const start = performance.now()
for (let i = 0; i < iterations; i++) {
  markdown(doc)
}
const end = performance.now()

const avg = (end - start) / iterations
console.log(`Average: ${avg.toFixed(2)}ms`)
console.log(`Target contribution: <2ms for emphasis parsing`)
```

#### Implementation

1. Create `benchmark-emphasis.ts`
2. Run baseline: `npx tsx benchmark-emphasis.ts`
3. Record the baseline time in `PROFILE_ANALYSIS.md`

#### Testing

```bash
npx tsx benchmark-emphasis.ts
# Record the output
```

#### Commit

```bash
git add benchmark-emphasis.ts PROFILE_ANALYSIS.md
git commit -m "perf: add emphasis-specific performance benchmark"
```

**⚠️ STOP. DO NOT PROCEED UNTIL STEP 9A.1 IS COMMITTED.**

---

### Step 9A.2: Implement Fast Path for Simple Emphasis

**⚠️ YOU MUST HAVE COMMITTED STEP 9A.1 BEFORE STARTING THIS**

#### Strategy

Add a fast path that handles 80% of cases (simple `*text*` and `**text**`) quickly, falling back to existing algorithm for complex cases.

#### Current Code Location

`parseEmphasis()` at line ~1194

#### What to Add

Add fast path at the beginning of `parseEmphasis()`:

```typescript
function parseEmphasis(
  text: string,
  start: number,
  opts: Required<MarkdownOptions>,
  definitions: LinkDefinitions
): InlineParseResult {
  const char = text[start]
  if (char !== '*' && char !== '_') return null

  // FAST PATH: Try simple case first (most common)
  // Simple case: *text* or **text** with no nesting
  {
    let delimCount = 0
    let i = start
    while (i < text.length && text[i] === char && delimCount < 3) {
      delimCount++
      i++
    }

    // Only try fast path for 1 or 2 delimiters
    if (delimCount <= 2) {
      // Must have non-whitespace after opening
      if (i < text.length && !/\s/.test(text[i])) {
        // Find matching closer (no nesting check)
        const closerPattern = char.repeat(delimCount)
        let searchPos = i

        while (searchPos < text.length) {
          const closeIdx = text.indexOf(closerPattern, searchPos)
          if (closeIdx === -1) break

          // Check it's a valid closer (non-whitespace before)
          const beforeCloser = text[closeIdx - 1]
          if (beforeCloser && !/\s/.test(beforeCloser)) {
            // Check there are no nested delimiters in content
            const content = text.slice(i, closeIdx)
            const hasNested = content.includes(char)

            if (!hasNested) {
              // FAST PATH SUCCESS - simple case
              const processedContent = processInlineSinglePass(content, opts, definitions)
              const html = delimCount === 2
                ? `<strong>${processedContent}</strong>`
                : `<em>${processedContent}</em>`
              return { html, endIndex: closeIdx + delimCount }
            }
          }

          searchPos = closeIdx + 1
        }
      }
    }
  }

  // SLOW PATH: Complex case, use existing algorithm
  let openCount = 0
  let i = start
  while (i < text.length && text[i] === char) {
    openCount++
    i++
  }

  // ... rest of existing parseEmphasis() implementation ...
```

#### Implementation Steps

1. Read current `parseEmphasis()` function
2. Add fast path at the beginning (before existing logic)
3. Keep ALL existing logic as slow path fallback
4. Test extensively

#### Testing

```bash
# Run full test suite
npm test -- --run

# Run emphasis benchmark
npx tsx benchmark-emphasis.ts

# Run main benchmark
npx tsx benchmark.ts
```

**Expected:**
- All 206 tests pass
- Emphasis benchmark shows improvement
- Main benchmark shows 5-15% improvement

**If tests fail:**
- Debug the fast path logic
- May need to adjust nesting detection
- DO NOT COMMIT until all tests pass

#### Commit (ONLY if all tests pass)

```bash
git add src/markdown.ts
git commit -m "perf: add fast path for simple emphasis cases"
```

**⚠️ STOP. DO NOT PROCEED UNTIL STEP 9A.2 IS COMMITTED.**

---

### Step 9A.3: Optimize Slow Path - Cache Delimiter Positions

**⚠️ YOU MUST HAVE COMMITTED STEP 9A.2 BEFORE STARTING THIS**

#### Current Issue

The slow path in `parseEmphasis()` scans for closing delimiters multiple times.

#### Optimization

Cache all delimiter positions in one pass:

```typescript
// In the slow path section, replace the delimiter finding loop:

// BEFORE (current):
while (searchFrom < text.length) {
  const closeIndex = text.indexOf(char, searchFrom)
  if (closeIndex === -1) break
  // ... process each one ...
  searchFrom = closeIndex + closeCount
}

// AFTER (optimized):
// Pre-collect ALL delimiter positions in one pass
const allDelimiters: Array<{pos: number, count: number}> = []
{
  let scanPos = contentStart
  while (scanPos < text.length) {
    const delimIdx = text.indexOf(char, scanPos)
    if (delimIdx === -1) break

    let count = 0
    let k = delimIdx
    while (k < text.length && text[k] === char) {
      count++
      k++
    }

    allDelimiters.push({ pos: delimIdx, count })
    scanPos = delimIdx + count
  }
}

// Now iterate cached delimiters instead of searching repeatedly
for (const delim of allDelimiters) {
  const closeIndex = delim.pos
  const closeCount = delim.count

  // ... rest of validation logic ...
}
```

#### Implementation

1. Locate the slow path delimiter finding loop in `parseEmphasis()`
2. Replace with pre-collection approach above
3. Adjust the rest of the loop logic accordingly

#### Testing

```bash
npm test -- --run
npx tsx benchmark-emphasis.ts
npx tsx benchmark.ts
```

**Expected:**
- All 206 tests pass
- Another 2-5% improvement in emphasis-heavy content

#### Commit

```bash
git add src/markdown.ts
git commit -m "perf: cache delimiter positions in emphasis slow path"
```

**⚠️ STOP. DO NOT PROCEED UNTIL STEP 9A.3 IS COMMITTED.**

---

### Step 9A.4: Profile Again and Verify Impact

**⚠️ YOU MUST HAVE COMMITTED STEP 9A.3 BEFORE STARTING THIS**

#### What to Do

1. Run profiling again:
   ```bash
   npx tsx profile.ts
   ```

2. Compare to baseline from Step 0.2

3. Update `PROFILE_ANALYSIS.md`:
   ```markdown
   ## After Optimization 9A (Steps 9A.1-9A.3)

   - Baseline emphasis time: [X]% of total
   - After optimization: [Y]% of total
   - Improvement: [Z]%

   - Baseline overall: 18.5ms
   - After optimization: [A]ms
   - Overall improvement: [B]%
   ```

4. Run main benchmark:
   ```bash
   npx tsx benchmark.ts
   ```

#### Decision Point

**If average is now <12ms:**
→ Continue to Phase 2 (Optimization 8)

**If average is still >15ms:**
→ Consider Step 9A.5 (more aggressive emphasis optimization)

**If average is 12-15ms:**
→ Profile again, decide based on where time is spent

#### Commit

```bash
git add PROFILE_ANALYSIS.md
git commit -m "perf: document optimization 9A impact"
```

**⚠️ STOP. DO NOT PROCEED UNTIL STEP 9A.4 IS COMMITTED.**

**✅ OPTIMIZATION 9A COMPLETE - PROCEED TO PHASE 2 OR 9B**

---

### Step 9B: Optional - More Aggressive Emphasis Optimization

**⚠️ ONLY DO THIS IF STEP 9A.4 SHOWS parseEmphasis STILL >10% OF TIME**

**Skip this section if emphasis is no longer a hotspot after 9A.**

#### Step 9B.1: Eliminate Recursion in Content Processing

**Current issue:** `processInlineSinglePass()` is called recursively for emphasis content.

**Optimization:** Pre-process content in single pass before building HTML.

**Approach:**
1. Parse all inline elements in content without emphasis
2. Mark emphasis boundaries
3. Build HTML in single pass

**Expected gain:** 5-10% additional

**Complexity:** High - requires refactoring inline processing

**Time estimate:** 3-4 hours

**Commit after implementing and testing.**

---

## Phase 2: Optimization 8 - Complete Block Parsing Optimization

**Risk:** Medium-High | **Expected Impact:** 5-7% | **Priority:** MEDIUM

**⚠️ ONLY START THIS IF PROFILE SHOWS parseBlocks() IS A HOTSPOT (>10% time)**

**Strategy:** Complete remaining steps 8.2-8.5 from original plan.

---

### Step 8.2: Optimize Heading Parsing

**⚠️ COMMIT THIS STEP BEFORE PROCEEDING TO 8.3**

#### Current Code Location

Lines 157-208 in `parseBlocks()`

#### Current Approach

- Setext headings: Loops through headingLines array
- ATX headings: Uses regex match

#### Optimization

For Setext headings, avoid building `headingLines` array:

```typescript
// Setext Headings - optimized
{
  let foundSetextHeading = false
  let j = i
  let headingStart = -1
  let headingEnd = -1

  while (j < lines.length) {
    const currentLine = lines[j]
    if (!currentLine || isBlankLine(currentLine)) break

    if (headingStart === -1) {
      headingStart = j
    }

    // Check for underline
    if (/^=+\s*$/.test(currentLine) && headingStart !== -1 && j > headingStart) {
      // Build heading text from tracked indices
      const headingLines = lines.slice(headingStart, j)
      blocks.push({
        type: 'heading',
        level: 1,
        text: headingLines.join('\n').trim(),
      })
      i = j + 1
      foundSetextHeading = true
      break
    }

    // Similar for level 2 (---) ...

    headingEnd = j
    j++
  }

  if (foundSetextHeading) continue
}
```

#### Alternative: Keep current implementation if not a hotspot

If profiling shows heading parsing is <2% of time, **skip this optimization**.

#### Testing

```bash
npm test -- --run
npx tsx benchmark.ts
```

**Expected:** All tests pass, 0.5-1% improvement

#### Commit

```bash
git add src/markdown.ts
git commit -m "perf: optimize setext heading parsing (opt 8.2)"
```

**⚠️ STOP. DO NOT PROCEED UNTIL STEP 8.2 IS COMMITTED.**

---

### Step 8.3: Optimize Code Block Parsing

**⚠️ YOU MUST HAVE COMMITTED STEP 8.2 BEFORE STARTING THIS**

#### Current Code Location

Lines 210-259 in `parseBlocks()`

#### Current Approach

- Builds `codeLines` array
- Trims trailing blank lines

#### Optimization

Track start/end indices instead:

```typescript
// Indented code blocks - optimized
if (/^ {4}/.test(line)) {
  const codeStart = i
  while (i < lines.length) {
    const currentLine = lines[i]
    if (!currentLine) break
    if (!/^ {4}/.test(currentLine) && !isBlankLine(currentLine)) break
    i++
  }

  // Find last non-blank line
  let codeEnd = i - 1
  while (codeEnd > codeStart && isBlankLine(lines[codeEnd])) {
    codeEnd--
  }

  // Build code string from slice
  const codeLines = lines.slice(codeStart, codeEnd + 1).map(l =>
    /^ {4}/.test(l) ? l.slice(4) : ''
  )

  blocks.push({
    type: 'code',
    language: '',
    code: codeLines.join('\n'),
  })
  continue
}
```

#### Testing

```bash
npm test -- --run
npx tsx benchmark.ts
```

**Expected:** All tests pass, 0.5-1% improvement

#### Commit

```bash
git add src/markdown.ts
git commit -m "perf: optimize code block parsing (opt 8.3)"
```

**⚠️ STOP. DO NOT PROCEED UNTIL STEP 8.3 IS COMMITTED.**

---

### Step 8.4: Optimize Table Parsing (GFM)

**⚠️ YOU MUST HAVE COMMITTED STEP 8.3 BEFORE STARTING THIS**

#### Current Code Location

Lines 321-386 in `parseBlocks()`

#### Current Issue

`splitTableCells()` function creates arrays and does multiple passes.

#### Optimization

Optimize cell splitting with single-pass algorithm:

```typescript
// Inside splitTableCells function, optimize:
const splitTableCells = (row: string): string[] => {
  const cells: string[] = []
  let current = ''
  let escaped = false

  for (let j = 0; j < row.length; j++) {
    const char = row[j]

    if (escaped) {
      if (char === '|') current += '|'
      else current += '\\' + char
      escaped = false
    } else if (char === '\\') {
      escaped = true
    } else if (char === '|') {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  if (escaped) current += '\\'
  cells.push(current.trim())

  // Filter empty leading/trailing
  return cells.filter((c, idx) => c || (idx > 0 && idx < cells.length - 1))
}
```

#### Testing

```bash
npm test -- --run
npx tsx benchmark.ts
```

**Expected:** All tests pass, 0.5-1% improvement

#### Commit

```bash
git add src/markdown.ts
git commit -m "perf: optimize table cell splitting (opt 8.4)"
```

**⚠️ STOP. DO NOT PROCEED UNTIL STEP 8.4 IS COMMITTED.**

---

### Step 8.5: Optimize List Parsing (MOST COMPLEX)

**⚠️ YOU MUST HAVE COMMITTED STEP 8.4 BEFORE STARTING THIS**

**⚠️ WARNING: This is the most complex optimization. May require 2-3 hours.**

#### Current Code Location

`parseList()` function at line ~441

#### Current Approach

- Recursively processes nested lists
- Multiple array operations
- Complex indentation tracking

#### Optimization Strategy

**Option A: Skip if not a hotspot**
If profiling shows `parseList()` is <5% of time, **skip this step entirely**.

**Option B: Incremental optimization**
If list parsing is a hotspot:

1. Cache indentation calculations
2. Reduce array allocations
3. Optimize `getLine()` calls

#### Implementation (if needed)

This is highly complex. Break into sub-steps:

**8.5a:** Cache indentation levels (commit)
**8.5b:** Optimize nested list handling (commit)
**8.5c:** Reduce array operations (commit)

**Each sub-step must be committed separately.**

#### Testing

```bash
npm test -- --run
npx tsx benchmark.ts
```

**Expected:** All tests pass, 1-2% improvement

#### Commit (for each sub-step)

```bash
git add src/markdown.ts
git commit -m "perf: optimize list parsing [sub-step description] (opt 8.5)"
```

**⚠️ STOP. DO NOT PROCEED UNTIL STEP 8.5 IS COMMITTED.**

**✅ OPTIMIZATION 8 COMPLETE - ALL BLOCK PARSING OPTIMIZED**

---

## Phase 3: Micro-Optimizations (If Still Not at <10ms)

**Priority:** LOW | **Expected Impact:** 2-5% each | **Do ONLY if needed**

---

### Step 10.1: Cache More Regex Patterns

**⚠️ COMMIT THIS STEP BEFORE PROCEEDING TO 10.2**

#### What to Do

Find regex patterns that are compiled on every call:

```bash
grep -n "new RegExp\\|\/.*\/" src/markdown.ts | grep -v "^//"
```

Cache commonly used patterns:

```typescript
// At top of file, add more cached patterns:
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/
const FENCE_PATTERN = /^(`{3,}|~{3,})(.*)$/
const THEMATIC_BREAK_PATTERN = /^(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/
// etc.

// Then use these instead of inline regex
```

#### Testing

```bash
npm test -- --run
npx tsx benchmark.ts
```

**Expected:** 1-2% improvement

#### Commit

```bash
git add src/markdown.ts
git commit -m "perf: cache additional regex patterns"
```

**⚠️ STOP. DO NOT PROCEED UNTIL STEP 10.1 IS COMMITTED.**

---

### Step 10.2: Optimize String Concatenation

**⚠️ YOU MUST HAVE COMMITTED STEP 10.1 BEFORE STARTING THIS**

#### What to Do

Find string concatenation in hot paths:

```bash
grep -n "\\+= \\|concat" src/markdown.ts
```

Replace with array join where beneficial:

```typescript
// BEFORE:
let html = ''
html += '<p>'
html += content
html += '</p>'

// AFTER:
const html = ['<p>', content, '</p>'].join('')
```

#### Testing

```bash
npm test -- --run
npx tsx benchmark.ts
```

**Expected:** 0.5-1% improvement

#### Commit

```bash
git add src/markdown.ts
git commit -m "perf: optimize string concatenation in hot paths"
```

**⚠️ STOP. DO NOT PROCEED UNTIL STEP 10.2 IS COMMITTED.**

---

## Phase 4: Final Verification and Decision Point

---

### Step FINAL.1: Run Complete Benchmark Suite

**⚠️ ALL PREVIOUS STEPS MUST BE COMMITTED**

#### What to Run

```bash
# Full test suite
npm test -- --run

# Main benchmark
npx tsx benchmark.ts

# Emphasis benchmark
npx tsx benchmark-emphasis.ts

# Profile again
npx tsx profile.ts
```

#### Document Results

Update `PROFILE_ANALYSIS.md` with final results:

```markdown
## Final Results After All Optimizations

### Performance
- Starting: 18.5ms average
- After all optimizations: [X]ms average
- Total improvement: [Y]%
- Target: <10ms

### Status
- ✅ Target achieved: [YES/NO]
- Tests: 206/206 passing

### Commit History
[List all commits from this session]

### Profile Comparison
- Before: [key hotspots]
- After: [key hotspots]
```

#### Commit

```bash
git add PROFILE_ANALYSIS.md
git commit -m "perf: document final optimization results"
```

**⚠️ STOP. EVALUATE RESULTS BEFORE PROCEEDING.**

---

### Step FINAL.2: Decision Point - Did We Achieve <10ms?

**Evaluate the results from FINAL.1:**

---

#### ✅ IF AVERAGE < 10ms: SUCCESS!

**Actions:**

1. Remove `.fails()` marker from performance test:
   ```bash
   # Edit src/edge-cases.test.ts line 51
   # Change: it.fails('meets performance target...
   # To: it('meets performance target...
   ```

2. Run tests to verify performance test now passes:
   ```bash
   npm test -- --run
   ```

3. Commit:
   ```bash
   git add src/edge-cases.test.ts
   git commit -m "perf: remove .fails() marker - <10ms target achieved!"
   ```

4. Create success summary:
   ```bash
   echo "# SUCCESS: <10ms Target Achieved" > SUCCESS.md
   echo "" >> SUCCESS.md
   echo "Final average: [X]ms" >> SUCCESS.md
   echo "Total commits: [N]" >> SUCCESS.md
   echo "Total improvement: [Y]% from baseline" >> SUCCESS.md

   git add SUCCESS.md
   git commit -m "perf: document successful completion of optimization work"
   ```

**✅ OPTIMIZATION WORK COMPLETE!**

---

#### ⚠️ IF AVERAGE 10-12ms: CLOSE BUT NOT QUITE

**Analysis needed:**

1. Profile one more time - where is remaining time?
2. Estimate remaining work to close the 0-2ms gap
3. Options:
   - **A)** Accept 10-12ms as "good enough" (92-88% of target)
   - **B)** Continue with aggressive micro-optimizations
   - **C)** Consider architectural changes

**Document the decision:**

```markdown
# Status: Close to Target (10-12ms)

Current: [X]ms average
Target: <10ms
Gap: [Y]ms ([Z]%)

## Options

### Option A: Accept Current Performance
- Pros: [list]
- Cons: [list]

### Option B: Continue Micro-Optimizations
- Estimated time: [X] hours
- Expected gain: [Y]%
- Risk: Diminishing returns

### Option C: Architectural Changes
- Examples: Streaming parser, pre-tokenization
- Estimated time: [X] days
- Expected gain: [Y]%

## Recommendation
[Your recommendation here]
```

Save as `NEAR_TARGET_ANALYSIS.md` and commit.

---

#### ❌ IF AVERAGE >12ms: MORE WORK NEEDED

**Deep analysis required:**

1. Compare profile before/after - what didn't improve?
2. Identify remaining hotspots
3. Consider these options:

**Option 1: More Aggressive Inline Optimization**
- Completely rewrite `processInlineSinglePass()` as state machine
- Expected gain: 10-15%
- Time: 4-6 hours

**Option 2: Architectural Change - Streaming Parser**
- Parse in chunks, not full document
- Expected gain: 20-30%
- Time: 2-3 days
- Risk: High - major refactor

**Option 3: WebAssembly Hot Paths**
- Rewrite hottest functions in Rust/C++
- Expected gain: 50-100%
- Time: 3-5 days
- Risk: High - requires Wasm toolchain

**Option 4: Accept Current Performance**
- Document reasons <10ms is difficult
- Propose revised target (e.g., <15ms)

**Document analysis:**

Create `REMAINING_WORK_ANALYSIS.md`:

```markdown
# Remaining Work Analysis

Current: [X]ms average
Target: <10ms
Gap: [Y]ms ([Z]%)

## What We've Tried
[List all optimizations completed]

## Why We're Still Not at <10ms
[Analysis of remaining bottlenecks]

## Options Going Forward

### Option 1: [Name]
- Description: [details]
- Expected gain: [X]%
- Time: [Y] hours
- Risk: [Low/Medium/High]
- Recommendation: [Yes/No]

[Repeat for each option]

## Final Recommendation
[Your recommendation]
```

Commit this analysis.

---

## Rollback Strategy

**If any step breaks tests or makes performance worse:**

### Immediate Actions

1. **DO NOT use `git checkout` to discard changes**
2. **DO NOT continue to next step**
3. Review the test failures or performance regression

### Options

**Option A: Fix the Issue**
- Debug and fix the implementation
- Re-test
- Commit the fix with message: `fix: [description] (opt X.Y fix)`
- Continue

**Option B: Revert the Commit**
```bash
git revert HEAD
git push  # if you pushed the broken commit
```
- Document why in `OPTIMIZATION_NOTES.md`
- Continue to next optimization

**Option C: Investigate Further**
- If unclear why it broke, pause optimization work
- Profile the broken version to understand regression
- May discover better optimization approach

### Emergency Rollback

**If multiple commits are broken:**

```bash
# Find last known good commit
git log --oneline

# Create new branch from good commit
git branch emergency-rollback [good-commit-hash]

# Document what happened
echo "Emergency rollback from commits X-Y" > ROLLBACK_NOTES.md
echo "Reason: [description]" >> ROLLBACK_NOTES.md

git add ROLLBACK_NOTES.md
git commit -m "docs: document emergency rollback"
```

---

## Success Criteria

### Minimum Success
- ✅ All 206 tests passing
- ✅ No performance regression from 18.5ms
- ✅ Profiling data collected
- ✅ Clear documentation of attempts

### Target Success
- ✅ All 206 tests passing
- ✅ Average <10ms
- ✅ Performance test `.fails()` marker removed
- ✅ All optimizations committed

### Stretch Success
- ✅ Average <8ms
- ✅ Comprehensive optimization documentation
- ✅ Reusable profiling infrastructure
- ✅ Clear roadmap for future optimization

---

## Time Estimates

### Pessimistic (Everything is Hard)
- Phase 0 (Profiling): 2 hours
- Phase 1 (Opt 9): 6 hours
- Phase 2 (Opt 8): 8 hours
- Phase 3 (Micro): 3 hours
- **Total: 19 hours**

### Realistic (Some Challenges)
- Phase 0 (Profiling): 1 hour
- Phase 1 (Opt 9): 4 hours
- Phase 2 (Opt 8): 4 hours
- Phase 3 (Micro): 2 hours
- **Total: 11 hours**

### Optimistic (Profile Shows Clear Wins)
- Phase 0 (Profiling): 1 hour
- Phase 1 (Opt 9): 2 hours
- Phase 2 (Opt 8): 2 hours (skip low-impact steps)
- Phase 3 (Micro): 1 hour
- **Total: 6 hours**

**Most likely:** 8-12 hours over 2-3 focused work sessions

---

## Key Learnings from Previous Attempt

### What Worked
✅ Commit after every step
✅ Comprehensive testing
✅ Granular progress tracking
✅ Documentation of attempts

### What Didn't Work
❌ Implementing complex algorithm without testing incrementally
❌ Trying to handle all edge cases at once
❌ Not using profiling to guide optimization priority

### Applying Learnings
✅ Profile FIRST before optimizing
✅ Fast path + slow path fallback strategy
✅ Test each sub-step independently
✅ Accept working code over theoretical perfection

---

## Critical Reminders

**⚠️ COMMIT AFTER EVERY SINGLE STEP**

**⚠️ NEVER COMMIT THIS FILE (FINAL_OPTIMIZATION_PLAN.md)**

**⚠️ NEVER COMMIT OPTIMIZATION_PLAN.md**

**⚠️ IF TESTS FAIL, STOP AND FIX BEFORE CONTINUING**

**⚠️ IF PERFORMANCE REGRESSES, INVESTIGATE BEFORE CONTINUING**

**⚠️ PROFILE BEFORE OPTIMIZING**

**⚠️ FAST PATH + SLOW PATH = SAFE OPTIMIZATION**

---

## Summary Checklist

**Before Starting:**
- [ ] Read this entire plan
- [ ] Understand the profile-first strategy
- [ ] Have benchmark.ts, profile.ts ready
- [ ] Current performance baseline documented

**Phase 0 (Profiling):**
- [ ] Step 0.1: Profiling infrastructure (commit)
- [ ] Step 0.2: Run profile and analyze (commit)
- [ ] Step 0.3: Prioritize optimizations (commit)

**Phase 1 (Optimization 9):**
- [ ] Step 9A.1: Emphasis benchmark (commit)
- [ ] Step 9A.2: Fast path for simple emphasis (commit)
- [ ] Step 9A.3: Cache delimiter positions (commit)
- [ ] Step 9A.4: Profile and verify (commit)
- [ ] Step 9B: Optional aggressive optimization (commit if done)

**Phase 2 (Optimization 8):**
- [ ] Step 8.2: Heading parsing (commit)
- [ ] Step 8.3: Code block parsing (commit)
- [ ] Step 8.4: Table parsing (commit)
- [ ] Step 8.5: List parsing (commit per sub-step)

**Phase 3 (Micro-optimizations):**
- [ ] Step 10.1: Cache regex patterns (commit)
- [ ] Step 10.2: Optimize string concatenation (commit)

**Phase 4 (Final):**
- [ ] Step FINAL.1: Complete benchmark suite (commit)
- [ ] Step FINAL.2: Evaluate and decide (commit)

**Expected Total Commits:** 12-20 (depending on sub-steps)

**Expected Total Time:** 8-12 hours

---

**⚠️ FINAL REMINDER: COMMIT AFTER EVERY SINGLE STEP. NO EXCEPTIONS.**

Ready to execute when you are ready to continue optimization work.
