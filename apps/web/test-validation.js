// Test validation function
function isAmbiguousLocationName(rawName) {
  if (!rawName) return true
  const name = String(rawName).trim()
  if (name.length < 2) return true

  const lower = name.toLowerCase()

  // Clearly ambiguous or generated placeholders
  const patterns = [
    /\b(border|checkpoint|crossing)\b/i,
    /^intermediate(?:\s|-)?city(?:\s*\d+)?$/i,
    /^city\s*\d+$/i,
    /(waypoint|stop)\s*\d+/i,
    /^(unknown|tbd|unspecified)$/i,
    /^intermediate\s*$/i,
    /^destination\s*$/i,
    // CRITICAL: Only block if it STARTS with these patterns (not contains)
    /^(travel|way|go|route|trip|journey)\s+(to|from|via)\s+/i,
  ]

  if (patterns.some((re) => re.test(name))) return true

  // Extremely generic labels without specificity
  const genericOnly = [
    'border', 'the border', 'checkpoint', 'crossing',
    'intermediate city', 'intermediate', 'waypoint', 'stop',
    'unknown', 'tbd', 'unspecified',
  ]
  if (genericOnly.includes(lower)) return true

  return false
}

// Test cases
const testCases = [
  // Should PASS (not ambiguous)
  { name: 'Toulouse, Haute-Garonne, Occitania, Metropolitan France, France, France', expected: false },
  { name: 'Broadway, New York', expected: false },
  { name: 'Parkway Drive', expected: false },
  { name: 'Gateway Arch', expected: false },
  { name: 'Paris', expected: false },
  { name: 'London', expected: false },
  
  // Should FAIL (ambiguous)
  { name: 'Travel to Golden', expected: true },
  { name: 'Way to Paris', expected: true },
  { name: 'Go to London', expected: true },
  { name: 'Route to Berlin', expected: true },
  { name: 'Trip to Tokyo', expected: true },
  { name: 'border', expected: true },
  { name: 'checkpoint', expected: true },
  { name: 'waypoint 1', expected: true },
  { name: 'intermediate city', expected: true },
]

console.log('Testing location validation...\n')
let passed = 0
let failed = 0

testCases.forEach(({ name, expected }) => {
  const result = isAmbiguousLocationName(name)
  const status = result === expected ? '✅ PASS' : '❌ FAIL'
  
  if (result === expected) {
    passed++
  } else {
    failed++
    console.log(`${status}: "${name}"`)
    console.log(`  Expected: ${expected ? 'AMBIGUOUS' : 'VALID'}`)
    console.log(`  Got: ${result ? 'AMBIGUOUS' : 'VALID'}\n`)
  }
})

console.log(`\nResults: ${passed}/${testCases.length} passed, ${failed} failed`)

if (failed === 0) {
  console.log('✅ All tests passed!')
} else {
  console.log('❌ Some tests failed!')
  process.exit(1)
}

