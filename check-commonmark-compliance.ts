import { markdown } from './src/markdown'
import * as fs from 'fs'

interface SpecTest {
  markdown: string
  html: string
  example: number
  start_line: number
  end_line: number
  section: string
}

// Load the spec
let specTests: SpecTest[]
try {
  specTests = JSON.parse(
    fs.readFileSync('./commonmark-spec-0.31.2.json', 'utf-8')
  )
} catch (err) {
  console.error(`Failed to load spec file: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
}

console.log(`\nCommonMark 0.31.2 Compliance Check`)
console.log(`Total spec tests: ${specTests.length}\n`)

// Track results
let totalPassed = 0
let totalFailed = 0
const failuresBySection = new Map<string, number>()
const passesBySection = new Map<string, number>()
const failures: Array<{
  example: number
  section: string
  markdown: string
  expected: string
  actual: string
}> = []

// Run all tests
for (const test of specTests) {
  const actual = markdown(test.markdown, { gfm: false })
  const expected = test.html

  // Normalize whitespace for comparison (CommonMark spec is very specific about whitespace)
  const actualNormalized = actual.trim()
  const expectedNormalized = expected.trim()

  const passed = actualNormalized === expectedNormalized

  if (passed) {
    totalPassed++
    passesBySection.set(test.section, (passesBySection.get(test.section) || 0) + 1)
  } else {
    totalFailed++
    failuresBySection.set(test.section, (failuresBySection.get(test.section) || 0) + 1)

    // Store failure details (only first 50 to avoid overwhelming output)
    if (failures.length < 50) {
      failures.push({
        example: test.example,
        section: test.section,
        markdown: test.markdown,
        expected: expectedNormalized,
        actual: actualNormalized
      })
    }
  }
}

// Calculate percentage
const passRate = ((totalPassed / specTests.length) * 100).toFixed(1)

// Print summary
console.log(`Results:`)
console.log(`✅ Passed: ${totalPassed} / ${specTests.length} (${passRate}%)`)
console.log(`❌ Failed: ${totalFailed} / ${specTests.length}\n`)

// Get all unique sections
const allSections = [...new Set(specTests.map(t => t.section))]

// Print by section
console.log(`Breakdown by Section:\n`)
for (const section of allSections) {
  const passed = passesBySection.get(section) || 0
  const failed = failuresBySection.get(section) || 0
  const total = passed + failed
  const sectionPassRate = total > 0 ? ((passed / total) * 100).toFixed(0) : '0'

  const status = failed === 0 ? '✅' : passed === 0 ? '❌' : '⚠️ '
  console.log(`${status} ${section.padEnd(35)} ${passed}/${total} (${sectionPassRate}%)`)
}

// Print first 10 failures as examples
if (failures.length > 0) {
  console.log(`\n\nFirst 10 Failures (for debugging):\n`)
  for (let i = 0; i < Math.min(10, failures.length); i++) {
    const f = failures[i]
    console.log(`Example ${f.example} - ${f.section}`)
    console.log(`Input: ${JSON.stringify(f.markdown)}`)
    console.log(`Expected: ${JSON.stringify(f.expected)}`)
    console.log(`Actual:   ${JSON.stringify(f.actual)}`)
    console.log(`---`)
  }

  if (failures.length > 10) {
    console.log(`\n... and ${failures.length - 10} more failures\n`)
  }
}

// Summary recommendation
console.log(`\n${'='.repeat(60)}`)
if (totalPassed === specTests.length) {
  console.log(`🎉 FULLY COMMONMARK COMPLIANT!`)
} else if (totalPassed >= specTests.length * 0.9) {
  console.log(`⚠️  Very close! ${totalFailed} tests to fix for full compliance.`)
} else if (totalPassed >= specTests.length * 0.7) {
  console.log(`⚠️  Good coverage. ${totalFailed} tests to fix for full compliance.`)
} else {
  console.log(`⚠️  Significant work needed. ${totalFailed} tests to fix.`)
}
console.log(`${'='.repeat(60)}\n`)

// Exit code: 0 if all pass, 1 if any fail
process.exit(totalFailed > 0 ? 1 : 0)
