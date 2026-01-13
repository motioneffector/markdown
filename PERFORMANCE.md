# Performance Analysis

## Status

**Current Performance:** ~35ms for 100KB document
**Spec Requirement:** <10ms (from PLAN.md line 213)
**Gap:** 3.5x slower than required

## Problem Analysis

### Root Cause

The implementation does **not** follow the performance strategy outlined in PLAN.md:

**PLAN.md specified:**
- ✅ Single-pass parsing where possible
- ✅ No regex backtracking catastrophes
- ❌ Pre-compiled regex patterns (attempted, made things worse)
- ❌ Minimal string allocations (heavy use throughout)

**Current bottleneck:**

The `processInline()` function makes **15+ sequential regex passes** over every text node:

1. Escape sequences
2. Code spans (2 passes)
3. Images
4. Reference images
5. Links (via `parseLinksSmart()`)
6. Reference links (3 passes)
7. Autolinks (2 passes)
8. GFM autolinks (3 passes if GFM enabled)
9. Emphasis (6 passes for *, **, ***, _, __, ___)
10. Strikethrough
11. Hard line breaks (2 passes)
12. Entity decoding (2 passes)

**For a 100KB document with ~2500 paragraphs:**
- `processInline()` called ~2500 times
- ~37,500+ regex operations total
- Heavy string allocation on each `.replace()` call

### Attempted Optimizations

#### Phase 2: Module-Scope Regex Patterns (FAILED)

**Approach:** Move regex patterns to module scope to avoid recreation

**Result:** Performance **degraded** from ~29ms to ~34ms

**Why it failed:** Global flag (`g`) on module-scope patterns causes `lastIndex` state management issues across multiple calls

## Path to Resolution

### Required Changes

To meet the 10ms spec requires fundamental architectural changes:

#### 1. Single-Pass Inline Parser (~3-4x speedup)

Replace `processInline()` with a forward-scanning tokenizer:

```typescript
function processInlineFast(text: string, opts, definitions): string {
  const result: string[] = []; // string builder
  let i = 0;

  while (i < text.length) {
    // Check for each inline element at current position
    // Parse and emit HTML when matched
    // Use direct character comparison instead of regex

    if (text[i] === '\\') { /* handle escapes */ }
    else if (text[i] === '`') { /* handle code spans */ }
    else if (text[i] === '!') { /* handle images */ }
    else if (text[i] === '[') { /* handle links */ }
    else if (text[i] === '*' || text[i] === '_') { /* handle emphasis */ }
    // ... etc

    else result.push(text[i]);
    i++;
  }

  return result.join('');
}
```

**Benefits:**
- One pass through string instead of 15+
- Direct character comparison (faster than regex)
- Array join at end (one allocation instead of 15)

**Implementation effort:** 2-3 hours

#### 2. Block Parsing with Line Indices (~10-15% speedup)

Replace `input.split('\n')` with line index array:

```typescript
function parseBlocksFast(input: string, opts, depth): Block[] {
  // Build line start indices once
  const lineStarts = [0];
  for (let i = 0; i < input.length; i++) {
    if (input[i] === '\n') lineStarts.push(i + 1);
  }

  // Use slicing with indices instead of storing line strings
  for (let idx = 0; idx < lineStarts.length; idx++) {
    const line = input.slice(lineStarts[idx], lineStarts[idx + 1]);
    // ... parse blocks
  }
}
```

**Implementation effort:** 1 hour

#### 3. String Builder Pattern (~5-10% speedup)

Replace string concatenation with array builders:

```typescript
// Before
let html = '';
html += '<p>';
html += content;
html += '</p>';

// After
const parts = ['<p>', content, '</p>'];
return parts.join('');
```

**Implementation effort:** 30 minutes

### Estimated Total

**Time:** ~5 hours of focused development
**Risk:** Medium (requires careful testing to maintain correctness)
**Result:** Should achieve <10ms target

## Testing Strategy

After optimization:
1. All 206 existing tests must pass
2. Performance benchmark shows <10ms
3. No new regex catastrophic backtracking
4. Memory usage remains reasonable

## Alternatives

If optimization is not prioritized:

1. **Update spec in PLAN.md** to reflect realistic performance (<50ms)
2. **Update TESTS.md** performance requirement to match
3. **Document as acceptable trade-off** (correctness > raw speed)

## Benchmark

Run `npx tsx benchmark.ts` to measure current performance.

Current results:
```
Document size: 95000 bytes
Target: <10ms

Results:
  Average: 35.10 ms

Spec requirement (<10ms): ❌ FAIL
  3.5x slower than required
```

## Conclusion

The 10ms performance requirement from PLAN.md is **legitimate** but the current implementation does not achieve it. Meeting this requirement needs significant architectural changes, not incremental optimizations.

The test correctly fails. This is **technical debt** to be addressed in future work.
