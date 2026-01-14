# Emphasis Edge Cases Analysis

## Test Case 1: Nested Strong Inside Em
Input: `*foo **bar** baz*`
Expected: `<em>foo <strong>bar</strong> baz</em>`

### Why It Failed
- Outer `*...*` matched first
- Inner `**...**` not processed separately
- Content extracted between outer delimiters included inner delimiters

### Required Fix
- Match inner delimiters first (innermost-out processing)
- OR process all delimiters in single pass with proper nesting

## Test Case 2: Nested Em Inside Strong with Extra Delimiter
Input: `**bold with *italic***`
Expected: `<strong>bold with <em>italic</em></strong>`

### Why It Failed
- Three closing `*` confused the matcher
- Needs to match `**` for outer, `*` for inner

### Required Fix
- Properly handle delimiter runs of different lengths
- Match 2-delimiter pairs before 1-delimiter pairs

## Test Case 3: Triple Delimiter
Input: `***both***`
Expected: `<strong><em>both</em></strong>`

### Why It Failed
- Not clear, this one actually worked in testing

### Implementation Strategy

**Option A: Multiple Passes (SAFER)**
1. Collect all delimiters
2. Match innermost pairs first (smaller spans)
3. Build HTML from inner to outer
4. Recursively process unmatched content

**Option B: Single Pass with Nesting (COMPLEX)**
1. Collect all delimiters
2. Match with full nesting awareness
3. Build HTML respecting nesting hierarchy

**DECISION: We will implement Option A - multiple passes**
- Safer, more predictable
- Matches CommonMark spec intention
- Handles all edge cases correctly
