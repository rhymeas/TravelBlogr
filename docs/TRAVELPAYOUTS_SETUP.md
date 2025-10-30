# Travelpayouts Affiliate Integration Setup

## Overview

TravelBlogr uses **Travelpayouts** as the affiliate platform for monetizing trip bookings. This provides a single integration point for:

- 🏨 **Hotels:** Booking.com, Agoda, Hotels.com
- ✈️ **Flights:** Aviasales, Skyscanner, Kiwi.com
- 🏠 **Airbnb:** Vacation rentals
- 🚗 **Car Rentals:** Rentalcars.com, Discover Cars
- 🎫 **Activities:** GetYourGuide, Viator

## Setup Steps

### 1. Sign Up for Travelpayouts

1. Go to https://www.travelpayouts.com/
2. Click "Sign Up" and create an account
3. Complete the registration process

### 2. Get Your Credentials

After signing up, you'll receive:

- **Marker ID** (also called Partner ID or Affiliate ID)
- **API Token** (for API access)

Find these in your Travelpayouts dashboard:
- Dashboard → Settings → API Access

### 3. Add Credentials to Environment Variables

Add to `.env.local`:

```bash
# Travelpayouts Affiliate Credentials
NEXT_PUBLIC_TRAVELPAYOUTS_MARKER=your_marker_id_here
NEXT_PUBLIC_TRAVELPAYOUTS_TOKEN=your_api_token_here
```

**Important:** 
- Replace `your_marker_id_here` with your actual Marker ID
- Replace `your_api_token_here` with your actual API Token
- Restart your dev server after adding these

### 4. Verify Integration

The booking widgets will automatically use your credentials. Test by:

1. Opening any trip page
2. Clicking on booking buttons (Hotels, Flights, etc.)
3. Verifying the URL contains your marker ID
4. Making a test booking (optional)

## How It Works

### Booking Widgets

The `TripBookingWidgets` component generates affiliate links for each location in a trip:

```tsx
import { TripBookingWidgets } from '@/components/trips/TripBookingWidgets'

<TripBookingWidgets
  location="Paris, France"
  checkIn={new Date('2025-06-01')}
  checkOut={new Date('2025-06-05')}
  previousLocation="London, UK"  // For flight origin
  nextLocation="Rome, Italy"     // For flight destination
/>
```

### Compact Version (Sidebar)

For sidebars or smaller spaces:

```tsx
import { TripBookingWidgetsCompact } from '@/components/trips/TripBookingWidgets'

<TripBookingWidgetsCompact
  location="Paris, France"
  checkIn={new Date('2025-06-01')}
  checkOut={new Date('2025-06-05')}
/>
```

### Generated Links

The service automatically:
- Extracts city names from locations
- Converts cities to IATA codes for flights
- Pre-fills dates from trip itinerary
- Adds your affiliate marker to all links
- Calculates nights for hotel bookings

## Revenue Model

### Commission Structure

Travelpayouts uses a **revenue share model**:

- You earn **40-70%** of Travelpayouts' commission
- Travelpayouts earns commission from providers (Booking.com, etc.)
- Your share depends on your traffic volume

### Example Earnings

If a user books:
- **Hotel:** $500 → Booking.com pays 4% ($20) → You earn 50% ($10)
- **Flight:** $300 → Aviasales pays 2% ($6) → You earn 50% ($3)
- **Car Rental:** $200 → Rentalcars pays 5% ($10) → You earn 50% ($5)

**Total from one trip:** $18 commission

### Tracking

Travelpayouts automatically tracks:
- Clicks on affiliate links
- Bookings made through your links
- Commission earned
- Conversion rates

View stats in: Dashboard → Statistics

## Supported Providers

### Hotels & Accommodations
- Booking.com
- Agoda
- Hotels.com
- Airbnb
- Hostelworld

### Flights
- Aviasales
- Skyscanner
- Kiwi.com
- 1200+ airlines

### Car Rentals
- Rentalcars.com
- Discover Cars
- Economy Bookings

### Activities & Tours
- GetYourGuide
- Viator
- Tiqets

## Best Practices

### 1. Strategic Placement

Place booking widgets:
- ✅ On trip detail pages (high intent)
- ✅ In trip templates (inspiration → booking)
- ✅ In location detail pages
- ❌ Not on homepage (low intent)

### 2. Pre-fill Data

Always pre-fill:
- City/destination
- Check-in/check-out dates
- Number of travelers
- Flight origin/destination

This increases conversion rates significantly.

### 3. Multiple Options

Offer multiple booking options:
- Hotels (Booking.com)
- Airbnb (alternative)
- Flights (if applicable)
- Car rentals (road trips)
- Activities (tours)

Users appreciate choice and you earn from any option they pick.

### 4. Mobile Optimization

Ensure booking buttons work well on mobile:
- Large tap targets
- Clear labels
- Fast loading
- External link indicators

## Troubleshooting

### Links Don't Contain Marker ID

**Problem:** Affiliate links missing `marker=` parameter

**Solution:**
1. Check `.env.local` has correct `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER`
2. Restart dev server
3. Clear browser cache
4. Verify environment variable is loaded: `console.log(process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER)`

### No Commissions Showing

**Problem:** Clicks tracked but no commissions

**Possible causes:**
1. **Cookie blocking:** User has ad blockers
2. **Booking window:** Commissions take 24-48 hours to appear
3. **Cancellations:** Booking was cancelled
4. **Validation period:** Some providers have 30-90 day validation

**Solution:** Wait 48 hours, check Travelpayouts dashboard for pending commissions

### IATA Code Not Found

**Problem:** Flight links fail for certain cities

**Solution:**
1. Add city to `getCityIATA()` mapping in `lib/services/travelpayouts.ts`
2. Or use Travelpayouts API to fetch accurate IATA codes dynamically

## API Reference

### `generateHotelLink(params)`

Generate hotel search link (Booking.com via Travelpayouts)

```typescript
generateHotelLink({
  city: 'Paris',
  checkIn: new Date('2025-06-01'),
  checkOut: new Date('2025-06-05'),
  adults: 2,
  children: 0
})
// Returns: https://search.hotellook.com?marker=...&destination=Paris&...
```

### `generateFlightLink(params)`

Generate flight search link (Aviasales via Travelpayouts)

```typescript
generateFlightLink({
  origin: 'PAR',  // IATA code
  destination: 'ROM',  // IATA code
  departDate: new Date('2025-06-01'),
  returnDate: new Date('2025-06-05'),
  adults: 1
})
// Returns: https://www.aviasales.com/search?marker=...&origin_iata=PAR&...
```

### `generateCarRentalLink(params)`

Generate car rental link (Rentalcars via Travelpayouts)

```typescript
generateCarRentalLink({
  location: 'Paris',
  pickupDate: new Date('2025-06-01'),
  dropoffDate: new Date('2025-06-05')
})
// Returns: https://www.rentalcars.com/SearchResults.do?affiliateCode=...
```

### `generateActivityLink(params)`

Generate activity/tour link (GetYourGuide via Travelpayouts)

```typescript
generateActivityLink({
  city: 'Paris',
  query: 'Eiffel Tower'  // Optional
})
// Returns: https://www.getyourguide.com/s/Paris?partner_id=...
```

## Next Steps

1. ✅ Sign up for Travelpayouts
2. ✅ Add credentials to `.env.local`
3. ✅ Test booking widgets on trip pages
4. 📊 Monitor conversions in Travelpayouts dashboard
5. 💰 Optimize placement for higher conversion rates

## Resources

- **Travelpayouts Dashboard:** https://www.travelpayouts.com/
- **API Documentation:** https://www.travelpayouts.com/developers/api
- **Support:** support@travelpayouts.com
- **Affiliate Tips:** https://www.travelpayouts.com/blog/

