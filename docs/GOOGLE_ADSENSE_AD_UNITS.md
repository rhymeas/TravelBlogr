# 📊 Google AdSense Ad Units - Complete Reference

**Publisher ID:** `ca-pub-5985120367077865`  
**Date Created:** 2025-10-31  
**Status:** ✅ **CONFIGURED**

---

## 🎯 Ad Units Overview

You have created **4 ad units** in Google AdSense:

| Ad Unit | Slot ID | Format | Best For |
|---------|---------|--------|----------|
| **In-Feed Ad** | `1402294778` | Fluid (Layout: `-61+cm+4h-16-10`) | Location grids, trip cards |
| **Display Ad** | `7879791370` | Auto (Responsive) | Homepage, general pages, sidebars |
| **Multiplex Ad** | `1065318624` | Auto-relaxed | Related content, recommendations |
| **In-Article Ad** | `8055777545` | Fluid (In-article) | Blog posts, long-form content |

---

## 📄 Ad Unit Details

### 1. In-Feed Ad (Slot: 1402294778)

**Format:** Fluid  
**Layout Key:** `-61+cm+4h-16-10`  
**Best For:** Native ads that blend with content cards

**AdSense Code:**
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5985120367077865"
     crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-format="fluid"
     data-ad-layout-key="-61+cm+4h-16-10"
     data-ad-client="ca-pub-5985120367077865"
     data-ad-slot="1402294778"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

**Used On:**
- `/locations` - Locations grid (every 4-7 cards)
- Future: Trip cards grid, search results

---

### 2. Display Ad (Slot: 7879791370)

**Format:** Auto (Responsive)  
**Full-Width Responsive:** Yes  
**Best For:** Horizontal banners, sidebar ads, general display

**AdSense Code:**
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5985120367077865"
     crossorigin="anonymous"></script>
<!-- TravelBlogrAds -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-5985120367077865"
     data-ad-slot="7879791370"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

**Used On:**
- `/` - Homepage top banner
- `/` - Homepage mid-page banner
- `/locations/[slug]` - Location detail sidebar
- `/trips-library` - Top banner
- `/trips-library/[slug]` - Trip template mid-content
- `/blog/[slug]` - Blog post sidebar

---

### 3. Multiplex Ad (Slot: 1065318624)

**Format:** Auto-relaxed  
**Best For:** Related content sections, recommendations

**AdSense Code:**
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5985120367077865"
     crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-format="autorelaxed"
     data-ad-client="ca-pub-5985120367077865"
     data-ad-slot="1065318624"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

**Used On:**
- Future: Related locations section
- Future: Related trips section
- Future: "You might also like" sections

---

### 4. In-Article Ad (Slot: 8055777545)

**Format:** Fluid (In-article)  
**Layout:** In-article  
**Best For:** Blog posts, long-form content, location descriptions

**AdSense Code:**
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5985120367077865"
     crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-5985120367077865"
     data-ad-slot="8055777545"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

**Used On:**
- `/locations/[slug]` - Location detail mid-content
- `/blog/[slug]` - Blog posts (2 paragraphs below start)

---

## 🗺️ Ad Placement Map

### Homepage (`/`)
```
┌─────────────────────────────────────┐
│ Hero Section                        │
├─────────────────────────────────────┤
│ Display Ad (7879791370)             │ ← Top Banner
├─────────────────────────────────────┤
│ How It Works                        │
│ Trip Examples                       │
│ Featured Locations                  │
├─────────────────────────────────────┤
│ Display Ad (7879791370)             │ ← Mid-page Banner
├─────────────────────────────────────┤
│ FAQ, Footer                         │
└─────────────────────────────────────┘
```

### Locations Grid (`/locations`)
```
┌─────────────────────────────────────┐
│ Search & Filters                    │
├─────────────────────────────────────┤
│ [Card] [Card] [Card] [Card]         │
│ [Card] [Card] [Card] [Card]         │
│ [In-Feed Ad (1402294778)]           │ ← Every 4-7 cards
│ [Card] [Card] [Card] [Card]         │
│ [Card] [Card] [Card] [Card]         │
│ [In-Feed Ad (1402294778)]           │
│ ...                                 │
└─────────────────────────────────────┘
```

### Location Detail (`/locations/[slug]`)
```
┌──────────────────────┬──────────────┐
│ Hero Image           │              │
│ Description          │ Display Ad   │ ← Sidebar
│ Activities           │ (7879791370) │
│ Experiences          │              │
├──────────────────────┤              │
│ In-Article Ad        │              │ ← Mid-content
│ (8055777545)         │              │
├──────────────────────┤              │
│ Transport            │              │
│ Weather              │              │
│ Comments             │              │
└──────────────────────┴──────────────┘
```

### Blog Post (`/blog/[slug]`)
```
┌──────────────────────┬──────────────┐
│ Title                │              │
│ Paragraph 1          │ Display Ad   │ ← Sidebar
│ Paragraph 2          │ (7879791370) │
├──────────────────────┤              │
│ In-Article Ad        │              │ ← 2 paragraphs below
│ (8055777545)         │              │
├──────────────────────┤              │
│ Paragraph 3          │              │
│ Paragraph 4          │              │
│ ...                  │              │
└──────────────────────┴──────────────┘
```

---

## 🔧 Environment Variables

Add these to Railway:

```bash
# Publisher ID
NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID=ca-pub-5985120367077865

# Ad Unit Slot IDs
NEXT_PUBLIC_ADS_SLOT_LOCATIONS_INFEED=1402294778
NEXT_PUBLIC_ADS_LAYOUT_KEY_INFEED=-61+cm+4h-16-10
NEXT_PUBLIC_ADS_SLOT_DISPLAY_AUTO=7879791370
NEXT_PUBLIC_ADS_SLOT_MULTIPLEX=1065318624
NEXT_PUBLIC_ADS_SLOT_IN_ARTICLE=8055777545

# Page-Specific Assignments
NEXT_PUBLIC_ADS_SLOT_HOMEPAGE_TOP=7879791370
NEXT_PUBLIC_ADS_SLOT_HOMEPAGE_MID=7879791370
NEXT_PUBLIC_ADS_SLOT_LOCATION_DETAIL_MID=8055777545
NEXT_PUBLIC_ADS_SLOT_LOCATION_DETAIL_SIDEBAR=7879791370
NEXT_PUBLIC_ADS_SLOT_TRIPS_LIBRARY_TOP=7879791370
NEXT_PUBLIC_ADS_SLOT_TRIP_TEMPLATE_MID=7879791370
NEXT_PUBLIC_ADS_SLOT_BLOG_IN_ARTICLE=8055777545
NEXT_PUBLIC_ADS_SLOT_BLOG_SIDEBAR=7879791370
NEXT_PUBLIC_ADS_SLOT_RELATED_CONTENT=1065318624
```

---

## ✅ Site Verification

### ads.txt File

**Location:** `/public/ads.txt`  
**URL:** `https://travelblogr.com/ads.txt`

**Content:**
```
google.com, pub-5985120367077865, DIRECT, f08c47fec0942fa0
```

✅ **Already configured!**

### AdSense Code in `<head>`

**Location:** `apps/web/app/layout.tsx`

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5985120367077865"
     crossorigin="anonymous"></script>
```

✅ **Already configured!**

---

## 📈 Performance Optimization

### Ad Loading Strategy

1. **In-Feed Ads** - Load with content (no lazy loading)
2. **Display Ads** - Load immediately (above fold)
3. **In-Article Ads** - Load when scrolled into view (lazy loading)
4. **Multiplex Ads** - Load when section is visible

### Ad Refresh

- **Never refresh ads** - Against AdSense policy
- **New page = new ads** - Each page load gets fresh ads

### Ad Density

- **Homepage:** 2 ads per page
- **Locations Grid:** 1 ad per 4-7 cards
- **Location Detail:** 2 ads (sidebar + mid-content)
- **Blog Posts:** 2 ads (sidebar + in-article)

---

## 🚀 Next Steps

1. **Add environment variables to Railway** (see above)
2. **Push code to trigger rebuild**
3. **Wait for Google AdSense approval** (1-2 weeks)
4. **Monitor AdSense dashboard** for approval status
5. **Test ads on production** after approval

---

## 📞 Support

**Google AdSense Dashboard:** https://www.google.com/adsense  
**AdSense Help:** https://support.google.com/adsense  
**Policy Center:** https://support.google.com/adsense/answer/48182

---

**Last Updated:** 2025-10-31  
**Status:** ✅ All ad units configured and ready for deployment

