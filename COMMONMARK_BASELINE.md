# CommonMark Compliance Baseline

**Date:** 2026-01-13
**Spec Version:** CommonMark 0.31.2
**Total Spec Tests:** 652

## Current Status: 251/652 (38.5%)

✅ **Passing:** 251 tests
❌ **Failing:** 401 tests

---

## Breakdown by Section

### ✅ Fully Passing Sections (100%)
| Section | Tests | Pass Rate |
|---------|-------|-----------|
| Precedence | 1/1 | 100% |
| Blank lines | 1/1 | 100% |
| Inlines | 1/1 | 100% |
| Textual content | 3/3 | 100% |

**Total:** 6 tests (0.9% of spec)

### 🟢 Strong Sections (50-99%)
| Section | Tests | Pass Rate | Status |
|---------|-------|-----------|--------|
| ATX headings | 12/18 | 67% | Good |
| Thematic breaks | 12/19 | 63% | Good |
| Setext headings | 17/27 | 63% | Good |
| Raw HTML | 11/20 | 55% | Decent |
| Paragraphs | 4/8 | 50% | Decent |
| Emphasis and strong emphasis | 66/132 | 50% | Decent |
| Images | 11/22 | 50% | Decent |
| Soft line breaks | 1/2 | 50% | Decent |

**Total:** 134 passing / 248 tests (21.4% of spec)

### 🟡 Weak Sections (25-49%)
| Section | Tests | Pass Rate | Status |
|---------|-------|-----------|--------|
| Block quotes | 12/25 | 48% | Needs work |
| Hard line breaks | 7/15 | 47% | Needs work |
| Links | 41/90 | 46% | Needs work |
| Code spans | 8/22 | 36% | Needs work |
| Entity and numeric character references | 6/17 | 35% | Needs work |
| Link reference definitions | 9/27 | 33% | Needs work |
| Autolinks | 6/19 | 32% | Needs work |
| Backslash escapes | 4/13 | 31% | Needs work |

**Total:** 93 passing / 228 tests (14.3% of spec)

### 🔴 Critical Sections (<25%)
| Section | Tests | Pass Rate | Status |
|---------|-------|-----------|--------|
| List items | 9/48 | 19% | ⚠️ Critical |
| Tabs | 2/11 | 18% | ⚠️ Critical |
| Fenced code blocks | 3/29 | 10% | ⚠️ Critical |
| Lists | 2/26 | 8% | ⚠️ Critical |
| HTML blocks | 2/44 | 5% | ⚠️ Critical |
| **Indented code blocks** | **0/12** | **0%** | 🚨 **FAILING ALL** |

**Total:** 18 passing / 170 tests (2.8% of spec)

---

## Major Issues Found

### 1. 🚨 Indented Code Blocks (0% pass rate)
**Problem:** Complete failure - not recognizing tabs as indentation for code blocks

Example failure:
```markdown
Input: "\tfoo\tbaz\t\tbim\n"
Expected: <pre><code>foo\tbaz\t\tbim\n</code></pre>
Actual:   <p>foo\tbaz\t\tbim</p>
```

**Root cause:** Our parser requires exactly 4 spaces for indented code blocks, but the spec requires tab character to count as indentation to the next tab stop (column 4, 8, 12, etc.)

### 2. 🚨 Tab Handling (18% pass rate)
**Problem:** Tabs not properly converted to spaces per CommonMark spec

**Spec requirement:** A tab character should be treated as 1-4 spaces, advancing to the next tab stop (column 4, 8, 12, 16, etc.)

**Our implementation:** Tabs are passed through as-is without conversion

### 3. 🚨 Lists (8% pass rate)
**Problem:** List parsing has major issues with:
- Tab indentation in list items
- Nested list detection
- Loose vs tight list distinction
- Task list markers

Example failure:
```markdown
Input: " - foo\n   - bar\n\t - baz\n"
Expected: <ul><li>foo<ul><li>bar<ul><li>baz</li></ul></li></ul></li></ul>
Actual:   <p>- foo\n   - bar\n\t - baz</p>
```

### 4. ⚠️ Backslash Escapes (31% pass rate)
**Problem:** Not properly handling backslash escapes

Example failure:
```markdown
Input: "\\!\\\"\\#\\$\\%\\&\\'\\(\\)\\*\\+\\,\\-\\.\\/\\:\\;\\<\\=\\>\\?\\@\\[\\\\\\]\\^\\_\\`\\{\\|\\}\\~\n"
Expected: <p>!&quot;#$%&amp;'()*+,-./:;&lt;=&gt;?@[\]^_`{|}~</p>
Actual:   <p>!\"#\$\%\&'()*+\,-./\:\;\<\=\>\?\@[\]\^_`{|}~</p>
```

**Root cause:** We're not escaping many ASCII punctuation characters that should be escapable

### 5. ⚠️ HTML Blocks (5% pass rate)
**Problem:** HTML block detection is very basic

Our parser has limited HTML block support - we only handle very basic cases.

### 6. ⚠️ Fenced Code Blocks (10% pass rate)
**Problem:**
- Info string parsing issues
- Whitespace handling
- Tab handling in code blocks

---

## What We're Doing Well

### ✅ Emphasis and Strong Emphasis (50%)
We've specifically optimized this and it shows! We pass **66/132** emphasis tests, which is exactly 50%.

**Known working:**
- Basic emphasis: `*foo*`, `**foo**`, `***foo***`
- Nested emphasis: `*foo **bar** baz*`
- Complex nesting: `**bold with *italic***`
- Most delimiter precedence rules

**Known failing:**
- Probably edge cases with underscores `_`
- Intraword emphasis rules
- Complex delimiter run interactions

### ✅ Basic Block Elements
- **ATX headings (67%):** `# Heading` style works well
- **Setext headings (63%):** Underline-style headings mostly work
- **Thematic breaks (63%):** `---`, `***`, `___` mostly recognized
- **Paragraphs (50%):** Basic paragraph detection works

### ✅ Basic Inline Elements
- **Links (46%):** Basic link syntax works, edge cases fail
- **Images (50%):** Basic image syntax works
- **Code spans (36%):** Basic `` `code` `` works, edge cases fail

---

## Analysis: Why 38.5%?

### Our 206 Tests vs CommonMark's 652 Tests

Our 206 tests focus on:
- Common use cases
- Features we intentionally support (GFM extensions)
- Edge cases we discovered during development

CommonMark's 652 tests focus on:
- Every edge case in the spec
- Precise whitespace handling
- Tab character handling (which we ignore)
- HTML block rules (which we barely implement)
- Backslash escape rules (which we partially implement)
- Exact output formatting (trailing newlines, etc.)

### Areas of Intentional Non-Compliance

1. **Tab handling:** We never implemented tab-to-space conversion
2. **HTML blocks:** Deliberately kept simple (security/complexity trade-off)
3. **Exact whitespace:** We normalize output differently than the spec

### Areas of Accidental Non-Compliance

1. **Backslash escapes:** Should be easy to fix
2. **List parsing:** Our implementation has bugs
3. **Indented code blocks:** Tab handling breaks this completely
4. **Code span edge cases:** Likely fixable

---

## Realistic Path to Full Compliance

### Quick Wins (2-4 hours)
Fix these to get to ~55% pass rate:

1. **Implement tab-to-space conversion (1-2 hours)**
   - Add preprocessing step to convert tabs to spaces
   - This alone would fix indented code blocks (0% → likely 80%+)
   - Would help lists, fenced code blocks, and many other sections

2. **Fix backslash escapes (1-2 hours)**
   - Add proper escape character handling
   - Should fix 31% → 90%+ in that section

**Estimated gain:** 401 failing → ~300 failing (55% pass rate)

### Medium Effort (8-12 hours)
Fix these to get to ~75% pass rate:

3. **Fix list parsing edge cases (4-6 hours)**
   - Proper indentation handling (now easier with tab conversion)
   - Nested list detection
   - Loose/tight list distinction
   - Would fix Lists: 8% → 70%+, List items: 19% → 60%+

4. **Fix code span edge cases (2-3 hours)**
   - Whitespace handling
   - Nested backticks
   - Would fix: 36% → 80%+

5. **Fix link/image edge cases (2-3 hours)**
   - Title parsing
   - Whitespace handling
   - Reference links
   - Would fix Links: 46% → 70%+, Images: 50% → 80%+

**Estimated gain:** ~300 failing → ~165 failing (75% pass rate)

### Hard Work (12-20 hours)
Fix these to get to 90%+ pass rate:

6. **Implement proper HTML block rules (8-12 hours)**
   - 7 different HTML block types per spec
   - Complex state machine
   - Would fix: 5% → 80%+

7. **Fix remaining emphasis edge cases (2-4 hours)**
   - Underscore handling
   - Intraword emphasis
   - Would fix: 50% → 90%+

8. **Polish all remaining edge cases (2-4 hours)**
   - Entity references
   - Hard line breaks
   - Various whitespace issues

**Estimated gain:** ~165 failing → ~50 failing (92% pass rate)

### Perfectionism (8-15 hours)
Get to 100%:

9. **Fix last 50 edge cases one by one**
   - Exact whitespace matching
   - Obscure precedence rules
   - Corner cases of corner cases

---

## Recommendation

**For "CommonMark compliant" in good faith:**
- **Minimum:** 90%+ (589/652 passing) - requires ~25-35 hours
- **Strong claim:** 95%+ (620/652 passing) - requires ~35-45 hours
- **Perfect:** 100% (652/652 passing) - requires ~45-60 hours

**Current state (38.5%):**
We can honestly say:
- ✅ "Supports CommonMark syntax"
- ✅ "CommonMark-inspired"
- ✅ "Passes CommonMark tests for emphasis, headings, and basic blocks"
- ❌ **Cannot claim:** "CommonMark compliant" or "CommonMark compatible"

**With tab handling + backslash escapes (~55%):**
We could say:
- ✅ "CommonMark-compatible for common use cases"
- ✅ "Supports core CommonMark features"
- ❌ Still cannot claim full compliance

**With quick wins + medium effort (~75%):**
We could say:
- ✅ "CommonMark-compatible"
- ✅ "Passes majority of CommonMark spec tests"
- ⚠️ Could claim "CommonMark compliant" with asterisk about HTML blocks

**With 90%+:**
We could confidently say:
- ✅ "CommonMark 0.31.2 compliant"
- ✅ "Passes CommonMark spec test suite"

---

## Next Steps

1. **Decide on target:** What compliance level do we need?
   - 55%: 2-4 hours (tab handling + escapes)
   - 75%: 12-16 hours (+ lists, code spans, links)
   - 90%: 25-35 hours (+ HTML blocks)
   - 100%: 45-60 hours (everything)

2. **Start with tab handling:** This is the biggest bang for buck
   - Fixes indented code blocks entirely
   - Helps lists, fenced code blocks, and many other sections
   - Relatively straightforward to implement

3. **Then backslash escapes:** Quick win, helps many sections

4. **Then prioritize by ROI:** Fix sections with most failing tests

---

**Baseline established:** 251/652 passing (38.5%)
**Quick win target:** 359/652 passing (55%) with 2-4 hours work
**Full compliance:** 652/652 passing (100%) with 45-60 hours work
