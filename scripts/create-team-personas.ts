/**
 * Script to create TravelBlogr team member personas
 * Run with: npx tsx scripts/create-team-personas.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from apps/web/.env.local
config({ path: resolve(__dirname, '../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const teamPersonas = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'emma.chen@travelblogr.com',
    password: 'TravelBlogr2025!',
    profile: {
      full_name: 'Emma Chen',
      username: 'emma_chen',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      bio: 'Adventure enthusiast and outdoor lover. Always seeking the next adrenaline rush! 🏔️',
      role: 'admin',
      writing_style: {
        tone: 'energetic',
        personality: 'enthusiastic',
        characteristics: ['uses exclamation marks', 'action-oriented', 'motivational'],
        writing_patterns: ['starts with exciting hooks', 'includes personal anecdotes', 'ends with calls to action'],
        vocabulary: ['amazing', 'incredible', 'breathtaking', 'epic', 'unforgettable'],
        sentence_structure: 'short and punchy',
        emoji_usage: 'frequent'
      },
      expertise: ['hiking', 'rock climbing', 'camping', 'budget travel', 'backpacking', 'outdoor adventures'],
      travel_preferences: {
        budget_preference: 'budget',
        travel_style: 'adventurous',
        accommodation: 'hostels and camping',
        favorite_destinations: ['Patagonia', 'Nepal', 'New Zealand', 'Iceland'],
        travel_pace: 'fast-paced'
      }
    }
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'marcus.rodriguez@travelblogr.com',
    password: 'TravelBlogr2025!',
    profile: {
      full_name: 'Marcus Rodriguez',
      username: 'marcus_rodriguez',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
      bio: 'Connoisseur of fine experiences and luxury travel. Life is too short for mediocre wine. 🍷',
      role: 'admin',
      writing_style: {
        tone: 'sophisticated',
        personality: 'refined',
        characteristics: ['detailed descriptions', 'sensory language', 'elegant prose'],
        writing_patterns: ['sets the scene elaborately', 'focuses on quality over quantity', 'includes expert recommendations'],
        vocabulary: ['exquisite', 'refined', 'impeccable', 'sumptuous', 'distinguished'],
        sentence_structure: 'long and flowing',
        emoji_usage: 'minimal and tasteful'
      },
      expertise: ['luxury hotels', 'fine dining', 'wine tourism', 'spa retreats', 'first-class travel', 'gourmet experiences'],
      travel_preferences: {
        budget_preference: 'luxury',
        travel_style: 'leisurely',
        accommodation: '5-star hotels and resorts',
        favorite_destinations: ['French Riviera', 'Tuscany', 'Maldives', 'Dubai'],
        travel_pace: 'slow and immersive'
      }
    }
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'yuki.tanaka@travelblogr.com',
    password: 'TravelBlogr2025!',
    profile: {
      full_name: 'Yuki Tanaka',
      username: 'yuki_tanaka',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki',
      bio: 'Photographer and cultural storyteller. Finding beauty in the everyday moments of travel. 📸',
      role: 'admin',
      writing_style: {
        tone: 'thoughtful',
        personality: 'reflective',
        characteristics: ['storytelling approach', 'cultural insights', 'philosophical observations'],
        writing_patterns: ['begins with a moment or scene', 'weaves in cultural context', 'ends with reflection'],
        vocabulary: ['authentic', 'meaningful', 'profound', 'intimate', 'timeless'],
        sentence_structure: 'varied and rhythmic',
        emoji_usage: 'selective and meaningful'
      },
      expertise: ['photography', 'cultural immersion', 'local traditions', 'street food', 'art and architecture', 'language learning'],
      travel_preferences: {
        budget_preference: 'moderate',
        travel_style: 'cultural',
        accommodation: 'local guesthouses and boutique hotels',
        favorite_destinations: ['Kyoto', 'Morocco', 'Peru', 'India'],
        travel_pace: 'slow and observant'
      }
    }
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    email: 'sophie.laurent@travelblogr.com',
    password: 'TravelBlogr2025!',
    profile: {
      full_name: 'Sophie Laurent',
      username: 'sophie_laurent',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
      bio: 'Mom of three and family travel advocate. Making memories one adventure at a time! 👨‍👩‍👧‍👦',
      role: 'admin',
      writing_style: {
        tone: 'warm',
        personality: 'practical',
        characteristics: ['helpful tips', 'honest advice', 'relatable experiences'],
        writing_patterns: ['starts with a family scenario', 'includes practical tips throughout', 'ends with encouragement'],
        vocabulary: ['family-friendly', 'practical', 'manageable', 'enjoyable', 'stress-free'],
        sentence_structure: 'clear and conversational',
        emoji_usage: 'friendly and relatable'
      },
      expertise: ['family travel', 'kid-friendly activities', 'travel hacks', 'budget planning', 'educational travel', 'theme parks'],
      travel_preferences: {
        budget_preference: 'moderate',
        travel_style: 'family-oriented',
        accommodation: 'family suites and vacation rentals',
        favorite_destinations: ['Orlando', 'Barcelona', 'Tokyo', 'Costa Rica'],
        travel_pace: 'flexible with breaks'
      }
    }
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    email: 'alex.thompson@travelblogr.com',
    password: 'TravelBlogr2025!',
    profile: {
      full_name: 'Alex Thompson',
      username: 'alex_thompson',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      bio: 'Digital nomad and remote work enthusiast. Working from anywhere, living everywhere. 💻🌍',
      role: 'admin',
      writing_style: {
        tone: 'casual',
        personality: 'tech-savvy',
        characteristics: ['productivity tips', 'tech recommendations', 'lifestyle insights'],
        writing_patterns: ['starts with a work-life scenario', 'includes tools and resources', 'ends with actionable advice'],
        vocabulary: ['efficient', 'flexible', 'connected', 'productive', 'sustainable'],
        sentence_structure: 'conversational and direct',
        emoji_usage: 'tech and travel themed'
      },
      expertise: ['remote work', 'coworking spaces', 'digital nomad lifestyle', 'productivity tools', 'visa requirements', 'cost of living'],
      travel_preferences: {
        budget_preference: 'budget to moderate',
        travel_style: 'nomadic',
        accommodation: 'coworking-friendly apartments',
        favorite_destinations: ['Bali', 'Lisbon', 'Chiang Mai', 'Medellín'],
        travel_pace: 'slow (1-3 months per location)'
      }
    }
  }
]

async function createTeamPersonas() {
  console.log('🚀 Creating TravelBlogr team member personas...\n')

  for (const persona of teamPersonas) {
    console.log(`Creating ${persona.profile.full_name} (${persona.profile.username})...`)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: persona.email,
        password: persona.password,
        email_confirm: true,
        user_metadata: {
          full_name: persona.profile.full_name
        }
      })

      if (authError) {
        if (authError.message.includes('already exists') || authError.message.includes('already been registered')) {
          console.log(`  ⚠️  User already exists, updating profile...`)

          // Get user by email to find their ID
          const { data: users } = await supabase.auth.admin.listUsers()
          const existingUser = users?.users.find(u => u.email === persona.email)

          if (!existingUser) {
            console.error(`  ❌ Could not find existing user`)
            continue
          }

          // Update profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: persona.profile.full_name,
              username: persona.profile.username,
              avatar_url: persona.profile.avatar_url,
              bio: persona.profile.bio,
              role: persona.profile.role,
              writing_style: persona.profile.writing_style,
              expertise: persona.profile.expertise,
              travel_preferences: persona.profile.travel_preferences
            })
            .eq('id', existingUser.id)

          if (updateError) {
            console.error(`  ❌ Error updating profile:`, updateError.message)
          } else {
            console.log(`  ✅ Profile updated successfully`)
          }
        } else {
          console.error(`  ❌ Error creating user:`, authError.message)
        }
        continue
      }

      // Profile should be auto-created by trigger, but let's update it with full details
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: persona.profile.full_name,
          username: persona.profile.username,
          avatar_url: persona.profile.avatar_url,
          bio: persona.profile.bio,
          role: persona.profile.role,
          writing_style: persona.profile.writing_style,
          expertise: persona.profile.expertise,
          travel_preferences: persona.profile.travel_preferences
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error(`  ❌ Error updating profile:`, profileError.message)
      } else {
        console.log(`  ✅ Created successfully!`)
      }

    } catch (error) {
      console.error(`  ❌ Unexpected error:`, error)
    }

    console.log('')
  }

  console.log('🎉 Team personas creation complete!\n')
  console.log('📝 Summary:')
  console.log('  - Emma Chen: Adventure Seeker (energetic, budget travel)')
  console.log('  - Marcus Rodriguez: Luxury Traveler (sophisticated, fine dining)')
  console.log('  - Yuki Tanaka: Cultural Explorer (thoughtful, photography)')
  console.log('  - Sophie Laurent: Family Travel Expert (warm, practical tips)')
  console.log('  - Alex Thompson: Digital Nomad (casual, remote work)')
  console.log('\n✨ All personas are ready to create blog posts!')
}

createTeamPersonas().catch(console.error)

