# Quick Wins Plan: 38.5% → 55% Compliance

**Goal:** Fix tab handling and backslash escapes to reach 55% CommonMark compliance
**Estimated Time:** 2-4 hours
**Expected Gain:** +108 passing tests (251 → 359)

---

## Current State

- **Passing:** 251/652 (38.5%)
- **Branch:** feature/commonmark-compliance
- **Last commit:** 0914e6b (baseline report)

---

## Quick Win 1: Tab Handling (1-2 hours)

**Impact:** Fixes 80-100 tests
- Indented code blocks: 0/12 → 10/12 (+10)
- Tabs section: 2/11 → 9/11 (+7)
- Lists: 2/26 → 10/26 (+8)
- List items: 9/48 → 20/48 (+11)
- Fenced code blocks: 3/29 → 10/29 (+7)
- Block quotes: 12/25 → 18/25 (+6)
- Various other sections benefit

**Expected total gain:** ~50-60 tests

---

### Step 1.1: Understand Tab Expansion Rules

**CommonMark Spec Section 2.2:**
> Tabs in lines are not expanded to spaces. However, in contexts where whitespace helps to define block structure, tabs behave as if they were replaced by spaces with a tab stop of 4 characters.

**What this means:**
- A tab advances to the next tab stop (columns 4, 8, 12, 16, etc.)
- Example: `\t` at column 0 → advance to column 4 (= 4 spaces)
- Example: ` \t` at column 1 → advance to column 4 (= 3 spaces)
- Example: `  \t` at column 2 → advance to column 4 (= 2 spaces)
- Example: `   \t` at column 3 → advance to column 4 (= 1 space)
- Example: `    \t` at column 4 → advance to column 8 (= 4 spaces)

**Implementation:**
```typescript
function expandTabs(line: string): string {
  let result = ''
  let column = 0

  for (let i = 0; i < line.length; i++) {
    if (line[i] === '\t') {
      // Advance to next tab stop (multiple of 4)
      const spacesToAdd = 4 - (column % 4)
      result += ' '.repeat(spacesToAdd)
      column += spacesToAdd
    } else {
      result += line[i]
      column++
    }
  }

  return result
}
```

**Action:** Document this understanding (no code yet)

**Commit:** `docs: document tab expansion rules per CommonMark spec`

---

### Step 1.2: Add Tab Expansion Function

**Location:** `src/markdown.ts`, add after helper functions (around line 50)

**Code to add:**
```typescript
/**
 * Expand tabs to spaces according to CommonMark spec.
 * Tabs advance to the next tab stop (multiple of 4).
 *
 * Example: "\t" at column 0 → "    " (4 spaces)
 * Example: " \t" at column 1 → "   " (3 spaces to reach column 4)
 */
function expandTabs(line: string): string {
  if (!line.includes('\t')) {
    return line // Fast path: no tabs
  }

  let result = ''
  let column = 0

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '\t') {
      // Advance to next tab stop (multiple of 4)
      const spacesToAdd = 4 - (column % 4)
      result += ' '.repeat(spacesToAdd)
      column += spacesToAdd
    } else {
      result += char
      column++

      // Newline resets column
      if (char === '\n') {
        column = 0
      }
    }
  }

  return result
}
```

**Action:** Add this function to `src/markdown.ts`

**Testing:**
```typescript
// Manual test
console.log(expandTabs('\tfoo')) // "    foo"
console.log(expandTabs(' \tfoo')) // "   foo"
console.log(expandTabs('  \tfoo')) // "  foo"
console.log(expandTabs('   \tfoo')) // "   foo"
console.log(expandTabs('    \tfoo')) // "        foo"
```

**Commit:** `feat: add tab expansion function per CommonMark spec`

---

### Step 1.3: Apply Tab Expansion in Main markdown() Function

**Location:** `src/markdown.ts`, in the `markdown()` function (line ~1375)

**Current code:**
```typescript
export function markdown(
  input: string,
  options: MarkdownOptions = {}
): string {
  // ... options setup ...

  const blocks = parseBlocks(input, opts)
  return renderBlocks(blocks, opts)
}
```

**Change to:**
```typescript
export function markdown(
  input: string,
  options: MarkdownOptions = {}
): string {
  // ... options setup ...

  // Expand tabs to spaces per CommonMark spec
  const inputWithExpandedTabs = expandTabs(input)

  const blocks = parseBlocks(inputWithExpandedTabs, opts)
  return renderBlocks(blocks, opts)
}
```

**Action:** Apply tab expansion to input before parsing

**Testing:**
```bash
npm test -- --run
npx tsx check-commonmark-compliance.ts 2>&1 | head -50
```

**Expected:**
- All existing tests should still pass (206/206)
- CommonMark compliance should improve:
  - Indented code blocks: 0/12 → ~10/12
  - Tabs: 2/11 → ~9/11
  - Lists should improve
  - Overall: 251/652 → ~300-310/652 (~47%)

**Commit:** `feat: expand tabs to spaces before parsing (CommonMark compliance)`

---

### Step 1.4: Verify Tab Handling Impact

**Action:** Run compliance check and document results

```bash
npx tsx check-commonmark-compliance.ts > tab-handling-results.txt
```

**Review:**
- Which sections improved?
- Which tests are still failing?
- Any unexpected regressions?

**Commit:** `test: document tab handling impact on compliance`

---

## Quick Win 2: Backslash Escapes (1-2 hours)

**Impact:** Fixes 8-10 tests in Backslash escapes section
- Backslash escapes: 4/13 → 12/13 (+8)
- Various other sections benefit

**Expected total gain:** ~10-15 tests

---

### Step 2.1: Understand Backslash Escape Rules

**CommonMark Spec Section 6.1:**
> Any ASCII punctuation character may be backslash-escaped.

**Escapable characters:**
```
! " # $ % & ' ( ) * + , - . / : ; < = > ? @ [ \ ] ^ _ ` { | } ~
```

**Current implementation:** We only escape some of these in inline processing.

**Required:** Escape ALL ASCII punctuation when preceded by backslash.

**Action:** Document which characters need escaping

**Commit:** `docs: document backslash escape requirements per CommonMark`

---

### Step 2.2: Add Comprehensive Escape Handling

**Location:** `src/markdown.ts`, in the inline processing

**Find the escape handling code** (likely in `processInlineSinglePass` around line 850-900)

**Current approach:**
We probably have limited escape handling like:
```typescript
if (char === '\\' && i + 1 < text.length) {
  const next = text[i + 1]
  if (next === '*' || next === '_' || next === '[' || next === ']') {
    // escape it
  }
}
```

**New approach:**
```typescript
// List of ASCII punctuation characters that can be escaped
const ESCAPABLE_CHARS = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

function isEscapableChar(char: string): boolean {
  return ESCAPABLE_CHARS.includes(char)
}
```

**In the inline processor:**
```typescript
// Handle backslash escapes FIRST (before other inline processing)
if (char === '\\' && i + 1 < text.length) {
  const next = text[i + 1]
  if (isEscapableChar(next)) {
    // This is an escape sequence - include the escaped character literally
    result += next
    i += 2 // skip both backslash and escaped char
    continue
  }
}
```

**Key insight:** Backslash escapes need to be handled BEFORE emphasis, links, etc.

---

### Step 2.3: Implement in processInlineSinglePass

**Location:** `src/markdown.ts`, line ~850-900

**Find:**
```typescript
function processInlineSinglePass(
  text: string,
  opts: Required<MarkdownOptions>,
  definitions: LinkDefinitions
): string {
```

**Strategy:**
1. Process backslash escapes FIRST
2. Create a "processed" string with escapes replaced by placeholders
3. Process other inline elements
4. Restore escaped characters

**OR simpler approach:**
1. When encountering `\`, check if next char is escapable
2. If yes, treat it as literal text (don't process it further)

**Implementation:**
```typescript
// At the START of processInlineSinglePass, before the main loop:

// Handle backslash escapes by replacing them with placeholders
const ESCAPE_PLACEHOLDER = '\u0000' // Null character (won't appear in input)
let escapedText = text
const escapeMap = new Map<number, string>()
let escapeIndex = 0

for (let i = 0; i < text.length - 1; i++) {
  if (text[i] === '\\' && isEscapableChar(text[i + 1])) {
    // Store the escaped character
    escapeMap.set(escapeIndex, text[i + 1])
    // Replace with placeholder
    escapedText = escapedText.slice(0, i) + ESCAPE_PLACEHOLDER + escapeIndex + escapedText.slice(i + 2)
    escapeIndex++
  }
}

// Process the text with escapes removed
const result = processInline(escapedText) // ... existing processing ...

// Restore escaped characters
let final = result
for (const [index, char] of escapeMap) {
  final = final.replace(ESCAPE_PLACEHOLDER + index, char)
}

return final
```

**Actually, this is getting complex. Simpler approach:**

**Just handle it in the main parsing loop:**
```typescript
// In processInlineSinglePass, at the START of the main loop:

// Handle backslash escapes
if (char === '\\' && i + 1 < text.length && isEscapableChar(text[i + 1])) {
  result += text[i + 1]
  i += 2
  continue
}

// ... rest of inline processing ...
```

**This needs to be BEFORE any other inline processing** (emphasis, links, etc.)

---

### Step 2.4: Add isEscapableChar Helper

**Location:** `src/markdown.ts`, add near other helper functions

**Code:**
```typescript
/**
 * Characters that can be backslash-escaped per CommonMark spec.
 * Any ASCII punctuation character can be escaped.
 */
const ESCAPABLE_CHARS = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'

/**
 * Check if a character can be backslash-escaped.
 */
function isEscapableChar(char: string): boolean {
  return ESCAPABLE_CHARS.includes(char)
}
```

**Commit:** `feat: add escapable character helper per CommonMark spec`

---

### Step 2.5: Integrate Backslash Escapes into Inline Processing

**Location:** `src/markdown.ts`, in `processInlineSinglePass` function

**Find the main loop** (around line 850-900):
```typescript
let i = 0
while (i < text.length) {
  const char = text[i]

  // ... various inline processors ...
}
```

**Add AT THE VERY START of the loop, BEFORE any other checks:**
```typescript
let i = 0
while (i < text.length) {
  const char = text[i]

  // Handle backslash escapes FIRST (before any other inline processing)
  if (char === '\\' && i + 1 < text.length && isEscapableChar(text[i + 1])) {
    result += text[i + 1]
    i += 2
    continue
  }

  // ... rest of existing inline processing ...
}
```

**Important:** This MUST come before:
- Emphasis parsing
- Link parsing
- Image parsing
- Code span parsing
- Any other inline element

**Commit:** `feat: handle backslash escapes in inline processing (CommonMark compliance)`

---

### Step 2.6: Test and Verify Backslash Escapes

**Testing:**
```bash
npm test -- --run
npx tsx check-commonmark-compliance.ts 2>&1 | grep "Backslash escapes"
```

**Expected:**
- All existing tests pass (206/206)
- Backslash escapes: 4/13 → 12/13 (or close)

**Manual tests:**
```typescript
markdown('\\*not emphasis\\*') // Should be: <p>*not emphasis*</p>
markdown('\\[not a link\\]') // Should be: <p>[not a link]</p>
markdown('\\!\\"\#') // Should be: <p>!"#</p>
```

**Commit:** `test: verify backslash escape handling`

---

### Step 2.7: Final Compliance Check

**Action:** Run full compliance check

```bash
npx tsx check-commonmark-compliance.ts
```

**Expected results:**
- **Starting:** 251/652 (38.5%)
- **After tab handling:** ~300-310/652 (~47%)
- **After backslash escapes:** ~310-320/652 (~48-49%)
- **Potential bonus:** Other sections may improve too

**Actually, let me be more conservative:**
- **Starting:** 251/652 (38.5%)
- **After both quick wins:** ~300-320/652 (~46-49%)

**We might not quite hit 55%, but we'll get close and have easy wins available.**

**Commit:** `test: final compliance check after quick wins`

---

## Step 3: Document Results

**Action:** Update COMMONMARK_BASELINE.md with new results

**Add section:**
```markdown
## After Quick Wins Implementation

**Date:** 2026-01-13
**Passing:** XXX/652 (XX%)
**Improvement:** +XX tests from baseline

### What Was Fixed:
1. ✅ Tab expansion (CommonMark spec 2.2)
   - Tabs now expand to next tab stop (4, 8, 12, 16...)
   - Fixed indented code blocks: 0/12 → X/12
   - Improved lists, fenced code blocks, and more

2. ✅ Backslash escapes (CommonMark spec 6.1)
   - All ASCII punctuation can now be escaped
   - Fixed: 4/13 → X/13

### Sections Most Improved:
- Indented code blocks: 0% → XX%
- Tabs: 18% → XX%
- Backslash escapes: 31% → XX%
- Lists: 8% → XX%

### Time Spent:
- Planning: 30 min
- Tab handling: X hours
- Backslash escapes: X hours
- Testing/verification: X min
- **Total:** X hours

### Next Priorities:
[Based on remaining failures]
```

**Commit:** `docs: update baseline with quick wins results`

---

## Testing Strategy

### After Each Step:
1. **Run existing tests:** `npm test -- --run`
   - Must maintain 206/206 passing
   - Any regressions = stop and fix

2. **Run compliance check:** `npx tsx check-commonmark-compliance.ts`
   - Note the new pass rate
   - Identify which sections improved

3. **Run manual tests:** Test specific examples from CommonMark spec

### Final Verification:
1. Run all tests 3 times to ensure consistency
2. Run compliance check and compare to baseline
3. Document actual results vs. expected results
4. Identify if further quick wins are available

---

## Commit Strategy

**One commit per step:**
1. docs: document tab expansion rules per CommonMark spec
2. feat: add tab expansion function per CommonMark spec
3. feat: expand tabs to spaces before parsing (CommonMark compliance)
4. test: document tab handling impact on compliance
5. docs: document backslash escape requirements per CommonMark
6. feat: add escapable character helper per CommonMark spec
7. feat: handle backslash escapes in inline processing (CommonMark compliance)
8. test: verify backslash escape handling
9. test: final compliance check after quick wins
10. docs: update baseline with quick wins results

**Total: 10 commits**

---

## Expected Final State

### Conservative Estimate:
- **Passing:** 300/652 (46%)
- **Improvement:** +49 tests
- **Time:** 2-3 hours

### Optimistic Estimate:
- **Passing:** 320/652 (49%)
- **Improvement:** +69 tests
- **Time:** 2-3 hours

### Realistic Target:
- **Passing:** 310/652 (47.5%)
- **Improvement:** +59 tests
- **Time:** 2-3 hours

**We might fall short of 55%, but we'll have:**
- ✅ Proper tab handling (foundational for many features)
- ✅ Complete backslash escape support
- ✅ Clear path to further improvements
- ✅ 40+ more tests passing

---

## Risk Assessment

### Low Risk:
- ✅ Tab expansion is straightforward
- ✅ Backslash escapes are well-defined
- ✅ Both are preprocessing/early processing (shouldn't break existing logic)

### Potential Issues:
1. **Tab expansion performance:** `expandTabs()` runs on entire input
   - Mitigation: Fast path for no tabs
   - Impact: Minimal (single pass)

2. **Backslash escape interaction with existing code:**
   - Must be BEFORE other inline processing
   - Could break if not placed correctly
   - Mitigation: Test thoroughly

3. **Whitespace sensitivity:**
   - Tab expansion changes document structure
   - Could affect block detection
   - Mitigation: CommonMark spec is clear about behavior

### Testing Safety:
- All 206 existing tests must continue passing
- If any regression: revert and investigate

---

## Success Criteria

### Must Have:
- ✅ All 206 existing tests still pass
- ✅ Tab expansion implemented correctly
- ✅ Backslash escapes implemented correctly
- ✅ At least +40 CommonMark tests passing

### Nice to Have:
- 🎯 +60 CommonMark tests passing (reaching ~310/652)
- 🎯 Indented code blocks: 0% → 70%+
- 🎯 Tabs: 18% → 70%+
- 🎯 Backslash escapes: 31% → 90%+

### Documentation:
- ✅ Updated COMMONMARK_BASELINE.md
- ✅ Clear commit history
- ✅ Notes on what improved and why

---

**Plan Status:** Ready for execution
**Next Step:** Step 1.1 (document tab expansion rules)
**Estimated Completion:** 2-3 hours from start
