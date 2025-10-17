# TravelBlogr Trip Sharing Logic & UX

## Current Implementation Status

### ✅ What's Already Built

1. **Share Links System** (`share_links` table)
   - Subdomain-based URLs: `<tripname>.travelblogr.com`
   - Unique token for backup access
   - Password protection support
   - Expiration dates
   - View count tracking
   - Custom branding/theming
   - Analytics tracking

2. **Subdomain Routing** (`apps/web/app/[subdomain]/page.tsx`)
   - Dynamic subdomain routing already working
   - Password protection UI
   - Expired link handling
   - Custom metadata for SEO

3. **Share Link Manager** (`apps/web/components/share/ShareLinkManager.tsx`)
   - Create/edit/delete share links
   - Copy link to clipboard
   - View analytics
   - Manage multiple share links per trip

4. **API Endpoints**
   - `POST /api/trips/[tripId]/share-links` - Create share link
   - `GET /api/trips/[tripId]/share-links` - List share links
   - `PATCH /api/trips/[tripId]/share-links/[linkId]` - Update share link
   - `DELETE /api/trips/[tripId]/share-links/[linkId]` - Delete share link

---

## Your Requirements

### 1. ✅ Modal with Copy Link (Already Exists!)

**Current Implementation:**
- `ShareLinkManager` component provides UI to create and copy links
- Copy to clipboard functionality already built
- Located in trip dashboard

**What's Missing:**
- Quick "Share Trip" modal from trip view (not just dashboard)
- One-click share button on trip pages

### 2. ✅ Password Protection (Already Exists!)

**Current Implementation:**
- `settings.requirePassword` flag in share_links table
- `settings.passwordHash` stores bcrypt hash
- Password verification on subdomain page
- Password input UI already built

**What's Missing:**
- UI to set password when creating share link (needs to be added to CreateShareLinkModal)

### 3. ✅ Subdomain URLs (Already Exists!)

**Current Implementation:**
- Format: `<subdomain>.travelblogr.com`
- Stored in `share_links.subdomain` column
- Unique constraint ensures no duplicates
- Subdomain availability check before creation

**Example URLs:**
- `paris-2024.travelblogr.com`
- `japan-adventure.travelblogr.com`
- `family-vacation.travelblogr.com`

---

## Database Schema

### `share_links` Table

```sql
CREATE TABLE share_links (
    id UUID PRIMARY KEY,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subdomain VARCHAR(63) UNIQUE NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    customization JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `settings` JSONB Structure

```json
{
  "showLocation": true,
  "showDates": true,
  "showPhotos": true,
  "showComments": true,
  "allowDownload": true,
  "requirePassword": false,
  "passwordHash": null,
  "expiresAt": null,
  "showPersonalInfo": true,
  "showPrivateNotes": false,
  "showExpenses": false,
  "showContacts": true,
  "watermarkPhotos": false,
  "enableAnalytics": true,
  "allowEmbedding": true,
  "seoEnabled": true
}
```

---

## User Flow

### Creating a Share Link

1. User creates a trip
2. User clicks "Share Trip" button
3. Modal opens with options:
   - **Subdomain**: `my-trip` → `my-trip.travelblogr.com`
   - **Title**: Display title for the shared trip
   - **Description**: Optional description
   - **Password**: Optional password protection
   - **Expiration**: Optional expiration date
   - **Privacy Settings**: What to show/hide
4. User clicks "Create Share Link"
5. Link is generated and copied to clipboard
6. User can share the link with anyone

### Accessing a Shared Trip

1. Visitor goes to `<subdomain>.travelblogr.com`
2. System checks:
   - ✅ Does share link exist?
   - ✅ Is it active?
   - ✅ Has it expired?
   - ✅ Does it require password?
3. If password required:
   - Show password input form
   - Verify password on submit
   - Grant access if correct
4. Display trip with custom branding/theme
5. Track view count and analytics

---

## What Needs to Be Added

### 1. Quick Share Modal

**Location:** Trip detail pages, trip dashboard
**Purpose:** One-click share without going to share link manager

**Features:**
- Quick "Share" button on trip pages
- Modal with:
  - Auto-generated subdomain (from trip title)
  - Password toggle (optional)
  - Copy link button
  - Advanced settings link (opens ShareLinkManager)

**Files to Create:**
- `apps/web/components/trips/QuickShareModal.tsx`

### 2. Password Setting UI

**Location:** CreateShareLinkModal
**Purpose:** Allow users to set password when creating share link

**Features:**
- Password input field
- "Require Password" toggle
- Password strength indicator
- Confirm password field

**Files to Modify:**
- `apps/web/components/share/CreateShareLinkModal.tsx`

### 3. Share Button on Trip Pages

**Location:** Trip detail pages
**Purpose:** Easy access to sharing from anywhere

**Features:**
- Floating "Share" button or header button
- Opens QuickShareModal
- Shows existing share links if any

**Files to Modify:**
- `apps/web/app/dashboard/trips/[tripId]/page.tsx`
- `apps/web/app/trips/[slug]/page.tsx`

---

## Implementation Priority

### Phase 1: Quick Share Modal (High Priority)
- [ ] Create QuickShareModal component
- [ ] Add Share button to trip pages
- [ ] Auto-generate subdomain from trip title
- [ ] Copy link to clipboard
- [ ] Show success message

### Phase 2: Password Protection UI (Medium Priority)
- [ ] Add password input to CreateShareLinkModal
- [ ] Hash password with bcrypt before saving
- [ ] Add "Change Password" option to EditShareLinkModal
- [ ] Test password verification flow

### Phase 3: Enhanced UX (Low Priority)
- [ ] Share link preview before creating
- [ ] QR code generation for share links
- [ ] Social media share buttons (Twitter, Facebook, WhatsApp)
- [ ] Email share option
- [ ] Share link templates (public, family, friends)

---

## Technical Notes

### Subdomain Routing

**How it works:**
1. Next.js dynamic route: `apps/web/app/[subdomain]/page.tsx`
2. Extracts subdomain from URL params
3. Queries `share_links` table for matching subdomain
4. Loads trip data and renders with custom theme

**DNS Configuration:**
- Wildcard DNS: `*.travelblogr.com` → Your server IP
- Railway/Vercel handles subdomain routing automatically

### Password Hashing

```typescript
import bcrypt from 'bcryptjs'

// Hash password before saving
const passwordHash = await bcrypt.hash(password, 10)

// Verify password
const isValid = await bcrypt.compare(inputPassword, passwordHash)
```

### URL Generation

```typescript
const subdomain = tripTitle
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, '-')
  .replace(/-+/g, '-')
  .substring(0, 63) // DNS limit

const url = `https://${subdomain}.travelblogr.com`
```

---

## Questions to Clarify

1. **Default Sharing Behavior:**
   - Should trips be shareable by default?
   - Or require explicit share link creation?

2. **Multiple Share Links:**
   - Can one trip have multiple share links? (Currently: Yes)
   - Use case: Different links for family vs. public

3. **Link Expiration:**
   - Should there be a default expiration?
   - Or always permanent unless set?

4. **Password Sharing:**
   - How should users share the password?
   - Include in copy-to-clipboard message?
   - Separate "Copy Password" button?

5. **Subdomain Conflicts:**
   - What if subdomain is taken?
   - Auto-suggest alternatives?
   - Allow custom subdomain input?

---

## Next Steps

Let me know:
1. Which phase to implement first?
2. Any specific UX preferences for the share modal?
3. Should we add a quick share button to the mobile bottom nav?
4. Any other sharing features you want?

