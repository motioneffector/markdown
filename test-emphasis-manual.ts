import { markdown } from './src/markdown'

const tests: Array<[string, string]> = [
  // CommonMark spec examples
  ['*foo bar*', '<p><em>foo bar</em></p>'],
  ['**foo bar**', '<p><strong>foo bar</strong></p>'],
  ['***foo bar***', '<p><strong><em>foo bar</em></strong></p>'],
  ['*foo **bar** baz*', '<p><em>foo <strong>bar</strong> baz</em></p>'],
  ['**foo *bar* baz**', '<p><strong>foo <em>bar</em> baz</strong></p>'],
  ['***foo* bar**', '<p><strong><em>foo</em> bar</strong></p>'],
  ['**foo *bar***', '<p><strong>foo <em>bar</em></strong></p>'],
  ['*foo *bar* baz*', '<p><em>foo <em>bar</em> baz</em></p>'],

  // Edge cases
  ['foo * bar', '<p>foo * bar</p>'],
  ['foo ** bar', '<p>foo ** bar</p>'],
  ['*foo * bar*', '<p><em>foo * bar</em></p>'],

  // Unmatched
  ['*foo bar', '<p>*foo bar</p>'],
  ['foo bar*', '<p>foo bar*</p>'],

  // Triple delimiter edge case
  ['***both***', '<p><strong><em>both</em></strong></p>'],

  // Nested with shared closing delimiter
  ['**bold with *italic***', '<p><strong>bold with <em>italic</em></strong></p>'],
]

let passed = 0
let failed = 0

for (const [input, expected] of tests) {
  const result = markdown(input).trim()
  const match = result === expected

  if (match) {
    passed++
    console.log(`✓ ${input}`)
  } else {
    failed++
    console.log(`✗ ${input}`)
    console.log(`  Expected: ${expected}`)
    console.log(`  Got:      ${result}`)
  }
}

console.log(`\n${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('\n✅ All CommonMark emphasis tests passing!')
  process.exit(0)
} else {
  console.log(`\n❌ ${failed} test(s) failed`)
  process.exit(1)
}
