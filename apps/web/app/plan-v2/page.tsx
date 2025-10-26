'use client'

export const dynamic = 'force-dynamic'


/**
 * Trip Planner V2 - Experimental Progressive Workflow
 * /plan-v2
 * 
 * This is a test page for experimenting with a new trip planning flow
 * that progressively gathers information through contextual steps.
 */

import { TripPlannerV2 } from '@/components/trip-planner-v2/TripPlannerV2'

export default function PlanV2Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TripPlannerV2 />
    </div>
  )
}

