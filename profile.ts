import { markdown } from './src/markdown'

// Create test document
const largeDoc = '# Heading\n\nSome paragraph text here.\n\n'.repeat(2500)

// Warmup
for (let i = 0; i < 20; i++) {
  markdown(largeDoc)
}

// Profile with console.time
console.time('Total')
for (let i = 0; i < 10; i++) {
  markdown(largeDoc)
}
console.timeEnd('Total')

// Single detailed run
const start = performance.now()
markdown(largeDoc)
const end = performance.now()

console.log(`\nSingle run: ${(end - start).toFixed(2)}ms`)
console.log(`Document: ${largeDoc.length} bytes, ${largeDoc.split('\n').length} lines`)
console.log(`Estimated paragraphs: ~${Math.floor(largeDoc.split('\n\n').length / 2)}`)
