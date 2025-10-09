/**
 * Test Script: plan Generation
 * Run: npx tsx scripts/test-plan.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })

import { GenerateplanUseCase } from '../lib/plan/application/use-cases/GenerateplanUseCase'

async function testplanGeneration() {
  console.log('🧪 Testing plan Generation\n')

  const useCase = new GenerateplanUseCase()

  // Test case: Paris to Rome (use future dates)
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() + 30) // 30 days from now
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 5) // 5 days trip

  const command = {
    from: 'paris',
    to: 'rome',
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    interests: ['art', 'food', 'history'],
    budget: 'moderate' as const
  }

  console.log('📋 Test Input:')
  console.log(JSON.stringify(command, null, 2))
  console.log('\n⏳ Generating plan...\n')

  const startTime = Date.now()

  try {
    const result = await useCase.execute(command)

    const duration = Date.now() - startTime

    if (result.success && result.plan) {
      console.log('✅ SUCCESS!\n')
      console.log('📊 Results:')
      console.log(`   Generation time: ${duration}ms`)
      console.log(`   Title: ${result.plan.title}`)
      console.log(`   Total days: ${result.plan.getTotalDays()}`)
      console.log(`   Stay days: ${result.plan.getStayDays()}`)
      console.log(`   Travel days: ${result.plan.getTravelDays()}`)
      console.log(`   Locations: ${result.plan.getLocations().join(', ')}`)
      console.log(`   Activities: ${result.plan.getTotalActivities()}`)
      console.log(`   Meals: ${result.plan.getTotalMeals()}`)
      console.log(`   Estimated cost: $${result.plan.totalCostEstimate}`)
      console.log(`   Cost per day: $${Math.round(result.plan.getAverageCostPerDay())}`)
      console.log('\n📅 Day-by-day breakdown:')
      
      result.plan.days.forEach(day => {
        console.log(`\n   Day ${day.day} (${day.date}) - ${day.location} [${day.type}]`)
        console.log(`   ${day.items.length} items scheduled`)
        day.items.slice(0, 3).forEach(item => {
          console.log(`      ${item.time} - ${item.title} (${item.type})`)
        })
        if (day.items.length > 3) {
          console.log(`      ... and ${day.items.length - 3} more`)
        }
      })

      console.log('\n💡 Tips:')
      result.plan.tips.forEach((tip, i) => {
        console.log(`   ${i + 1}. ${tip}`)
      })

      console.log('\n✅ Test completed successfully!')
      
    } else {
      console.log('❌ FAILED!')
      console.log(`   Error: ${result.error}`)
    }

  } catch (error) {
    console.error('❌ ERROR:', error)
    process.exit(1)
  }
}

// Run test
testplanGeneration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

