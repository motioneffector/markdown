import { markdown } from './src/markdown'

// Create 100KB test document
const largeDoc = '# Heading\n\nSome paragraph text here.\n\n'.repeat(2500)

console.log('Document size:', largeDoc.length, 'bytes')
console.log('Target: <10ms\n')

// Warmup to allow JIT compilation
console.log('Warming up...')
for (let i = 0; i < 20; i++) {
  markdown(largeDoc)
}

// Benchmark
const runs = 100
const times: number[] = []

console.log(`\nRunning ${runs} iterations...`)
for (let i = 0; i < runs; i++) {
  const start = performance.now()
  markdown(largeDoc)
  const end = performance.now()
  times.push(end - start)
}

// Statistics
times.sort((a, b) => a - b)
const avg = times.reduce((a, b) => a + b) / times.length
const median = times[Math.floor(times.length / 2)]
const p95 = times[Math.floor(times.length * 0.95)]
const p99 = times[Math.floor(times.length * 0.99)]

console.log('\nResults:')
console.log('  Min:    ', times[0]?.toFixed(2), 'ms')
console.log('  Median: ', median?.toFixed(2), 'ms')
console.log('  Average:', avg.toFixed(2), 'ms')
console.log('  P95:    ', p95?.toFixed(2), 'ms')
console.log('  P99:    ', p99?.toFixed(2), 'ms')
console.log('  Max:    ', times[times.length - 1]?.toFixed(2), 'ms')

const meetsSpec = avg < 10
console.log('\nSpec requirement (<10ms):', meetsSpec ? '✅ PASS' : '❌ FAIL')
if (!meetsSpec) {
  const slowdown = (avg / 10).toFixed(1)
  console.log(`  ${slowdown}x slower than required`)
}
