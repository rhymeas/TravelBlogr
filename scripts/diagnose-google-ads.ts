/**
 * Google Ads Diagnostic Script
 * 
 * Checks if Google AdSense is properly configured and identifies issues
 */

console.log('🔍 Google Ads Diagnostic Report\n')
console.log('=' .repeat(60))

// 1. Check environment variables
console.log('\n📋 Environment Variables:')
console.log('-'.repeat(60))

const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID
console.log(`NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID: ${clientId || '❌ NOT SET'}`)

if (!clientId) {
  console.log('❌ ERROR: AdSense Client ID not set!')
  console.log('   Fix: Add NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID to .env.local')
} else if (clientId === 'ca-pub-your_adsense_client_id_here') {
  console.log('⚠️  WARNING: Using placeholder Client ID!')
  console.log('   Fix: Replace with your actual AdSense Client ID')
} else {
  console.log('✅ AdSense Client ID is configured')
}

// 2. Check if it's a valid format
if (clientId && !clientId.startsWith('ca-pub-')) {
  console.log('❌ ERROR: Invalid Client ID format!')
  console.log('   Expected format: ca-pub-XXXXXXXXXXXXXXXX')
}

// 3. List pages with ads
console.log('\n📄 Pages with Google Ads:')
console.log('-'.repeat(60))

const pagesWithAds = [
  { page: 'Homepage', path: '/app/page.tsx', component: 'HorizontalBannerAd' },
  { page: 'Locations Grid', path: '/components/locations/LocationsGrid.tsx', component: 'InFeedAd' },
  { page: 'Location Detail', path: '/components/locations/LocationDetailTemplate.tsx', component: 'SidebarAd + HorizontalBannerAd' },
  { page: 'Trips Library', path: '/app/trips-library/page.tsx', component: 'HorizontalBannerAd' },
  { page: 'Trip Template Detail', path: '/app/trips-library/[slug]/page.tsx', component: 'HorizontalBannerAd' },
  { page: 'Blog Posts', path: '/components/blog/BlogPostTemplate.tsx', component: 'HorizontalAd + RectangularAd' },
  { page: 'Dashboard', path: '/components/dashboard/DashboardLanding.tsx', component: 'Inline AdSense' },
]

pagesWithAds.forEach(({ page, path, component }) => {
  console.log(`✅ ${page}`)
  console.log(`   Path: ${path}`)
  console.log(`   Component: ${component}`)
})

// 4. Check ad visibility logic
console.log('\n🔒 Ad Visibility Logic:')
console.log('-'.repeat(60))
console.log('Ads are hidden for:')
console.log('  - Pro subscribers (subscription_tier = "pro")')
console.log('  - When AdSense is not configured')
console.log('')
console.log('Ads are shown for:')
console.log('  - Free users')
console.log('  - Guest users (not signed in)')

// 5. Common issues
console.log('\n⚠️  Common Issues & Solutions:')
console.log('-'.repeat(60))

const issues = [
  {
    issue: 'Ads not showing in production',
    causes: [
      'NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID not set in Railway',
      'AdSense account not approved yet',
      'Ad blockers enabled',
      'User is a Pro subscriber',
    ],
    solutions: [
      'Add env var to Railway: Settings → Variables',
      'Wait for Google AdSense approval (can take 1-2 weeks)',
      'Test with ad blocker disabled',
      'Test with free/guest account',
    ],
  },
  {
    issue: 'Ads showing blank space',
    causes: [
      'Invalid ad slot IDs',
      'AdSense script not loaded',
      'Ad units not created in AdSense dashboard',
    ],
    solutions: [
      'Create ad units in Google AdSense dashboard',
      'Copy actual slot IDs and replace placeholders',
      'Check browser console for AdSense errors',
    ],
  },
  {
    issue: 'Ads not showing locally',
    causes: [
      'NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID not in .env.local',
      'Development mode restrictions',
    ],
    solutions: [
      'Add to .env.local and restart dev server',
      'Test in production environment',
    ],
  },
]

issues.forEach(({ issue, causes, solutions }, index) => {
  console.log(`\n${index + 1}. ${issue}`)
  console.log('   Possible Causes:')
  causes.forEach(cause => console.log(`     - ${cause}`))
  console.log('   Solutions:')
  solutions.forEach(solution => console.log(`     ✓ ${solution}`))
})

// 6. Next steps
console.log('\n🚀 Next Steps:')
console.log('-'.repeat(60))
console.log('1. Verify AdSense Client ID is set in Railway')
console.log('2. Create ad units in Google AdSense dashboard')
console.log('3. Replace placeholder slot IDs with actual slot IDs')
console.log('4. Test with ad blocker disabled')
console.log('5. Check browser console for errors')
console.log('6. Wait for AdSense approval if account is new')

console.log('\n' + '='.repeat(60))
console.log('✅ Diagnostic complete!\n')

