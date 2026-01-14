# Performance Optimization Plan - 9 Incremental Improvements

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

## Current State

- **Performance:** ~17ms average for 100KB document
- **Target:** <10ms (from PLAN.md)
- **Gap:** 1.7x slower than required

The single-pass inline parser has been implemented (50% improvement from ~35ms). This plan covers 9 additional optimizations ordered from **easiest/lowest risk** to **hardest/highest risk**.

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

## Critical Rule

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

**After EACH optimization:**
1. Run tests: `npm test -- --run`
2. Run benchmark: `npx tsx benchmark.ts`
3. Verify all 206 tests pass
4. Commit the change
5. Only then proceed to the next optimization

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

---

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

## Optimization 1: Pre-size Parts Array

**OPERATION 1 HAS BEEN COMPLETED. READ IMPLEMENT_SINGLE_PASS.md NOW AND FOLLOW IT. IMPLEMENT IN ACCORDANCE WITH IMPLEMENT_SINGLE_PASS.md**
**OPERATION 1 HAS BEEN COMPLETED. READ IMPLEMENT_SINGLE_PASS.md NOW AND FOLLOW IT. IMPLEMENT IN ACCORDANCE WITH IMPLEMENT_SINGLE_PASS.md**
**OPERATION 1 HAS BEEN COMPLETED. READ IMPLEMENT_SINGLE_PASS.md NOW AND FOLLOW IT. IMPLEMENT IN ACCORDANCE WITH IMPLEMENT_SINGLE_PASS.md**
**OPERATION 1 HAS BEEN COMPLETED. READ IMPLEMENT_SINGLE_PASS.md NOW AND FOLLOW IT. IMPLEMENT IN ACCORDANCE WITH IMPLEMENT_SINGLE_PASS.md**
**OPERATION 1 HAS BEEN COMPLETED. READ IMPLEMENT_SINGLE_PASS.md NOW AND FOLLOW IT. IMPLEMENT IN ACCORDANCE WITH IMPLEMENT_SINGLE_PASS.md**
**OPERATION 1 HAS BEEN COMPLETED. READ IMPLEMENT_SINGLE_PASS.md NOW AND FOLLOW IT. IMPLEMENT IN ACCORDANCE WITH IMPLEMENT_SINGLE_PASS.md**
**OPERATION 1 HAS BEEN COMPLETED. READ IMPLEMENT_SINGLE_PASS.md NOW AND FOLLOW IT. IMPLEMENT IN ACCORDANCE WITH IMPLEMENT_SINGLE_PASS.md**
**OPERATION 1 HAS BEEN COMPLETED. READ IMPLEMENT_SINGLE_PASS.md NOW AND FOLLOW IT. IMPLEMENT IN ACCORDANCE WITH IMPLEMENT_SINGLE_PASS.md**



**Risk:** None | **Effort:** 5 minutes | **Expected Impact:** 1-3%

### What
Pre-allocate the `parts` array with an estimated size to reduce dynamic array resizing.

### Where
`src/markdown.ts` - `processInlineSinglePass()` function

### Implementation
```typescript
// Change from:
const parts: string[] = []

// To:
const parts: string[] = []
// Note: Pre-sizing with new Array() then using index assignment
// Actually simpler: just keep push() - V8 optimizes this well
// Alternative: reserve capacity hint if available
```

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

Actually, V8's dynamic array growth is highly optimized. A simpler approach:
- Test if pre-sizing actually helps by benchmarking
- If no measurable improvement, skip this optimization

### Checkpoint
```bash
npm test -- --run
npx tsx benchmark.ts
git add -A && git commit -m "perf: pre-size parts array in inline parser"
```

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
---

## Optimization 2: Cache GFM Regex Patterns

**Risk:** Low | **Effort:** 15 minutes | **Expected Impact:** 3-5%

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**


### What
Move GFM autolink regex patterns to module scope to avoid recreation on each call.

### Where
`src/markdown.ts` - near top of file and `parseGfmAutolink()` function

### Implementation
```typescript
// At module scope (near top of file):
const GFM_URL_REGEX = /^(https?:\/\/[^\s<>\[\]]+)/
const GFM_EMAIL_REGEX = /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/

// In parseGfmAutolink(), use these cached patterns
```

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

**Important:** These patterns don't use the global flag, so no `lastIndex` issues.

### Checkpoint
```bash
npm test -- --run
npx tsx benchmark.ts
git add -A && git commit -m "perf: cache GFM regex patterns at module scope"
```

---
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

## Optimization 3: Use indexOf for Delimiter Search

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

**Risk:** Low | **Effort:** 15-30 minutes | **Expected Impact:** 5-10%

### What
Replace character-by-character scanning with `indexOf()` for finding closing delimiters in emphasis/strikethrough.

### Where
`src/markdown.ts` - `parseEmphasis()` and `parseStrikethrough()` functions

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

### Implementation
Already using `indexOf()` for basic cases. Verify and optimize edge cases.

### Checkpoint
```bash
npm test -- --run
npx tsx benchmark.ts
git add -A && git commit -m "perf: optimize delimiter search with indexOf"
```

---

## Optimization 4: Skip GFM Checks Early

**Risk:** Low | **Effort:** 30 minutes | **Expected Impact:** 2-5%

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

### What
When `opts.gfm` is false, completely skip GFM-related checks. Hoist the check outside the loop.

### Where
`src/markdown.ts` - `processInlineSinglePass()` function

### Implementation
```typescript
// At function start:
const checkStrikethrough = opts.gfm
const checkGfmAutolinks = opts.gfm

// In main loop, use these booleans instead of opts.gfm
if (checkStrikethrough && char === '~' && next === '~') { ... }
```

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

### Checkpoint
```bash
npm test -- --run
npx tsx benchmark.ts
git add -A && git commit -m "perf: hoist GFM checks outside main loop"
```

---

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

## Optimization 5: Batch Plain Characters

**Risk:** Low | **Effort:** 30-45 minutes | **Expected Impact:** 15-25%

### What
Instead of pushing one character at a time, scan ahead to find runs of plain text and push them all at once.

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

### Where
`src/markdown.ts` - `processInlineSinglePass()` function, plain character handling section

### Implementation
```typescript
// At the end of the main loop, before single-char handling:
const plainStart = i
while (i < text.length) {
  const c = text[i]
  // Break on any special character
  if (c === '\\' || c === '`' || c === '!' || c === '[' || c === '<' ||
      c === '*' || c === '_' || c === '~' || c === '\n' ||
      c === '&' || c === '<' || c === '>') {
    break
  }
  i++
}
if (i > plainStart) {
  parts.push(text.slice(plainStart, i))
  continue
}

// Fall through to individual special character handling
```

### Checkpoint
```bash
npm test -- --run
npx tsx benchmark.ts
git add -A && git commit -m "perf: batch plain characters in inline parser"
```

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

---

## Optimization 6: Avoid Slice in Parsers

**Risk:** Low | **Effort:** 1-2 hours | **Expected Impact:** 5-10%

### What
Pass start/end indices instead of slicing strings. Only slice when building final HTML output.

### Where
`src/markdown.ts` - helper parser functions

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

### Implementation
Track indices instead of creating intermediate substrings:
```typescript
// Instead of extracting content early:
// const content = text.slice(i, closeIndex)
// processInlineSinglePass(content, ...)

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

// Track indices and slice only at the end:
const contentStart = i
const contentEnd = closeIndex
// ... later ...
const processedContent = processInlineSinglePass(
  text.slice(contentStart, contentEnd), opts, definitions
)
```

### Checkpoint
```bash
npm test -- --run
npx tsx benchmark.ts
git add -A && git commit -m "perf: reduce intermediate string slices in parsers"
```

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

---

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

## Optimization 7: Remove Post-Processing Regex

**Risk:** Low-Medium | **Effort:** 1-2 hours | **Expected Impact:** 10-15%

### What
Handle entity decoding during the single pass instead of as post-processing.

### Where
`src/markdown.ts` - `processInlineSinglePass()` and `decodeNumericEntities()`

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

### Implementation
```typescript
// When encountering '&' in main loop:
if (char === '&') {
  // Check if it's a numeric entity
  const entityMatch = text.slice(i).match(/^&#(\d+);/) ||
                      text.slice(i).match(/^&#x([0-9a-fA-F]+);/)
  if (entityMatch) {
    const code = entityMatch[1].startsWith('x')
      ? parseInt(entityMatch[1], 16)
      : parseInt(entityMatch[1], 10)
    parts.push(String.fromCharCode(code))
    i += entityMatch[0].length
    continue
  }
  parts.push('&amp;')
  i++
  continue
}

// Remove post-processing decodeNumericEntities() call
```


**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

### Checkpoint
```bash
npm test -- --run
npx tsx benchmark.ts
git add -A && git commit -m "perf: handle entities during single pass"
```

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

---

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

## Optimization 8: Block Parsing Optimization

**Risk:** Medium | **Effort:** 2-3 hours | **Expected Impact:** 5-10%

### What
Use line indices instead of splitting the entire document into an array of lines.

### Where
`src/markdown.ts` - block parsing functions

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

### Implementation
```typescript
// Instead of:
const lines = text.split('\n')
for (const line of lines) { ... }

// Use:
let lineStart = 0
while (lineStart < text.length) {
  let lineEnd = text.indexOf('\n', lineStart)
  if (lineEnd === -1) lineEnd = text.length

  // Access line content only when needed
  // Most checks can use text.charAt(lineStart + offset)

  lineStart = lineEnd + 1
}
```

This is a larger refactor affecting multiple functions. Test carefully.

### Checkpoint
```bash
npm test -- --run
npx tsx benchmark.ts
git add -A && git commit -m "perf: use line indices in block parser"
```

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

---

## Optimization 9: Non-Recursive Emphasis

**Risk:** Medium | **Effort:** 2-3 hours | **Expected Impact:** 20-30%

### What
Replace recursive emphasis processing with an iterative stack-based approach.

### Where
`src/markdown.ts` - `parseEmphasis()` and `parseStrikethrough()` functions

### Implementation
Use CommonMark-style delimiter stack:
```typescript
interface Delimiter {
  type: '*' | '_' | '~'
  count: number
  position: number
  canOpen: boolean
  canClose: boolean
}

// First pass: collect all delimiter runs
// Second pass: match openers with closers
// Third pass: build output with proper nesting
```

This is the most complex optimization but targets the highest-impact area (emphasis is common in markdown).

### Checkpoint
```bash
npm test -- --run
npx tsx benchmark.ts
git add -A && git commit -m "perf: implement iterative emphasis with delimiter stack"
```

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

---

## Summary Table

| # | Optimization | Risk | Effort | Impact |
|---|-------------|------|--------|--------|
| 1 | Pre-size parts array | None | 5 min | 1-3% |
| 2 | Cache GFM regex | Low | 15 min | 3-5% |
| 3 | indexOf for delimiters | Low | 30 min | 5-10% |
| 4 | Skip GFM checks early | Low | 30 min | 2-5% |
| 5 | Batch plain characters | Low | 45 min | 15-25% |
| 6 | Avoid slice in parsers | Low | 2 hr | 5-10% |
| 7 | Remove post-processing | Low-Med | 2 hr | 10-15% |
| 8 | Block parsing indices | Medium | 3 hr | 5-10% |
| 9 | Non-recursive emphasis | Medium | 3 hr | 20-30% |

---

## Final Verification

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

After all 9 optimizations:
```bash
npm test -- --run
npx tsx benchmark.ts

# If <10ms achieved:
# Remove .fails() from edge-cases.test.ts line 51
npm test -- --run  # Confirm test passes

git add -A && git commit -m "perf: remove .fails() marker - target achieved"
```

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**

---

## Critical Files

- `src/markdown.ts` - Main implementation
- `src/edge-cases.test.ts:51` - Performance test with `.fails()` marker
- `benchmark.ts` - Performance measurement tool
- `PERFORMANCE.md` - Performance documentation (update after completion)

**CRITICAL: COMMIT AFTER EVERY CHANGE. DO NOT USE `git checkout` ON UNCOMMITTED WORK.**
