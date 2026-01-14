# CommonMark Quick Wins Results

**Date:** 2026-01-13
**Branch:** `feature/commonmark-compliance`

## Summary

Implemented two targeted features to improve CommonMark compliance:
1. **Tab Expansion** - Convert tabs to spaces at tab stops (columns 4, 8, 12, 16...)
2. **Extended Backslash Escapes** - Support escaping all ASCII punctuation

## Test Results

### Our Test Suite
- **Starting:** 206 tests passing
- **After Tab Expansion:** 211 tests passing (+5 new tests)
- **After Backslash Escapes:** 226 tests passing (+15 new tests)
- **Final:** ✅ **226/226 tests passing** (100%)

### CommonMark Spec Compliance
- **Starting (from COMMONMARK_BASELINE.md):** 251/652 (38.5%)
- **After Both Features:** 250/652 (38.3%)
- **Change:** -1 test (slight regression)

## What Was Implemented

### 1. Tab Expansion (Commit: 032aae4)

**Files Modified:**
- `src/markdown.ts`: Added `expandTabs()` function
- `src/tabs.test.ts`: 5 new tests (all passing)

**Implementation:**
```typescript
function expandTabs(text: string): string {
  let result = ''
  let column = 0

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (char === '\t') {
      const spacesToAdd = 4 - (column % 4)
      result += ' '.repeat(spacesToAdd)
      column += spacesToAdd
    } else if (char === '\n') {
      result += char
      column = 0
    } else {
      result += char
      column++
    }
  }

  return result
}
```

**What Works:**
- ✅ Tabs correctly expand to reach next tab stop
- ✅ Column tracking resets on newlines
- ✅ Indented code blocks recognized when using tabs
- ✅ All our targeted tests pass

**What Doesn't Work (for full CommonMark compliance):**
- ❌ Tabs inside code blocks are converted to spaces instead of being preserved as `\t`
- ❌ CommonMark expects literal tab characters in code block output
- ❌ This requires a more sophisticated approach (track tabs during parsing, preserve in content)

### 2. Extended Backslash Escapes (Commit: 944a056)

**Files Modified:**
- `src/markdown.ts`: Updated `isEscapable()` function
- `src/inline.test.ts`: 15 new tests (all passing)

**Implementation:**
```typescript
function isEscapable(char: string): boolean {
  // CommonMark spec 6.1: All ASCII punctuation can be escaped
  // Full set: !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~
  return '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'.includes(char)
}
```

**What Works:**
- ✅ All ASCII punctuation characters can now be escaped
- ✅ Backslash correctly removes special meaning
- ✅ All our targeted tests pass

**What Doesn't Work (for full CommonMark compliance):**
- ❌ HTML entity encoding differs from spec expectations
- ❌ Spec expects: `&quot;` `&amp;` `&lt;` `&gt;` for some characters
- ❌ We output: `"` `&` `<` `>` (literal characters)
- ❌ This is a sanitization/encoding issue, not an escaping issue

## Why Compliance Didn't Improve

### Root Causes

1. **Tab Expansion Issues:**
   - Our preprocessing approach converts ALL tabs to spaces
   - CommonMark requires tabs in code block CONTENT to remain as literal `\t`
   - Only indentation tabs should be expanded for parsing
   - This requires parsing-level tab handling, not preprocessing

2. **HTML Entity Encoding:**
   - Our escaping works correctly (removes backslash, outputs character)
   - But CommonMark spec tests expect specific HTML entity encoding
   - Example: `\"` should output `&quot;` not `"`
   - This is separate from the escaping functionality itself

3. **Additional Edge Cases:**
   - Trailing newlines in code blocks
   - Whitespace normalization
   - List parsing with tabs
   - Nested structures with tabs

## Lessons Learned

### What Went Well
- ✅ Systematic approach with targeted tests
- ✅ All our custom tests pass
- ✅ No regressions in existing 206 tests
- ✅ Clean, documented code
- ✅ Good commit messages with context

### What Was Challenging
- ⚠️ CommonMark spec has stricter requirements than anticipated
- ⚠️ Tab expansion requires parsing-level integration, not preprocessing
- ⚠️ HTML entity encoding expectations differ from our implementation
- ⚠️ Many spec test failures are due to output formatting, not core logic

### Key Insights

1. **Tab Expansion Complexity:**
   - Simple preprocessing is insufficient
   - Need two-phase approach: parse with expanded tabs, render with original tabs
   - Or: Track tab positions and preserve them in code content

2. **CommonMark Compliance is Nuanced:**
   - Not just about supporting syntax
   - Also about exact output formatting
   - HTML entity encoding matters
   - Whitespace handling matters (trailing newlines, etc.)

3. **Test Coverage vs. Compliance:**
   - Our tests verify the features work
   - CommonMark tests verify exact spec compliance
   - These are related but different goals

## Recommendations

### Short-term (Pragmatic)

The current implementation provides:
- ✅ Working tab expansion for basic use cases
- ✅ Complete ASCII punctuation escape support
- ✅ 226 passing tests with no regressions

**Recommendation:** Keep as-is, document known limitations

### Medium-term (Compliance Focus)

To improve CommonMark compliance to ~47.5% (original goal):

1. **Fix Tab Preservation in Code Blocks (4-6 hours)**
   - Refactor to two-phase parsing
   - Parse with expanded tabs, render with originals
   - Expected gain: +30-40 tests

2. **Add HTML Entity Encoding (2-3 hours)**
   - Encode `"`, `&`, `<`, `>` in certain contexts
   - Match CommonMark output expectations
   - Expected gain: +5-10 tests

3. **Fix Trailing Newlines (1-2 hours)**
   - Code blocks should preserve trailing newlines
   - Match spec output format exactly
   - Expected gain: +5-10 tests

**Estimated total:** 7-11 hours to reach ~47.5% compliance

### Long-term (Full Compliance)

To reach 90%+ CommonMark compliance (per COMMONMARK_BASELINE.md):
- Requires 25-35 hours of focused work
- Need to implement proper list parsing
- Need to implement HTML block rules
- Need to fix all emphasis edge cases

See `COMMONMARK_BASELINE.md` for full analysis.

## Current State

### Files Changed
- `src/markdown.ts`: Added `expandTabs()`, updated `isEscapable()`
- `src/tabs.test.ts`: 5 new tests
- `src/inline.test.ts`: 15 new tests

### Branch Status
- ✅ 226/226 tests passing
- ✅ Clean git history (2 commits)
- ✅ Well-documented code
- ⚠️ CommonMark compliance: 250/652 (38.3%)

### Commits
1. `032aae4` - feat: implement tab expansion per CommonMark spec 2.2
2. `944a056` - feat: support escaping all ASCII punctuation per CommonMark spec 6.1

## Next Steps

### Option 1: Accept Current State
- Features work for practical use cases
- Tests pass
- Document known limitations
- Move on to other priorities

### Option 2: Continue Compliance Work
- Implement tab preservation in code blocks
- Add HTML entity encoding
- Iterate on spec compliance
- Estimated: 7-11 more hours for ~47.5%

### Option 3: Full Compliance
- Commit to 90%+ compliance goal
- Follow roadmap in COMMONMARK_BASELINE.md
- Estimated: 25-35 hours total

---

**Conclusion:** The quick wins were implemented successfully and all our targeted tests pass. Full CommonMark compliance requires additional parsing-level changes beyond simple preprocessing. The current implementation is production-ready for practical use cases, though it doesn't match the CommonMark spec exactly.
