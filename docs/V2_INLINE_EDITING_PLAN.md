# V2 Trip Planner - Inline Editing Implementation Plan

## Overview
Add comprehensive inline editing capabilities to the V2 Trip Planner results page, allowing users to personalize every aspect of their trip with a beautiful bubbly UI and backend persistence.

## Reusable Component: `InlineEdit`

**Location:** `apps/web/components/ui/InlineEdit.tsx`

**Features:**
- ✅ Bubbly rounded design with soft shadows
- ✅ Light gray hint tags ("Editing...", "Click to edit")
- ✅ Emerald border when editing
- ✅ Hover effects with background tint
- ✅ Support for text, textarea, and number inputs
- ✅ Auto-save on blur or Enter key
- ✅ Customizable variants (title, subtitle, text, small)

**Usage:**
```tsx
import { InlineEdit, InlineEditMultiline, InlineEditNumber } from '@/components/ui/InlineEdit'

<InlineEdit
  value={tripTitle}
  onChange={setTripTitle}
  onSave={handleSaveTitle}
  placeholder="Enter trip title..."
  variant="title"
/>
```

---

## Editable Elements on Results Page

### 1. **Trip Header** (DONE ✅)
- [x] Trip Title (variant: title)
- [x] Trip Subtitle (variant: subtitle)

### 2. **Day Locations**
Each day's location name should be editable:
- [ ] Day location name (e.g., "Munich" → "Munich City Center")
- [ ] Backend: Update `trips.days[].location` in JSONB
- [ ] Variant: `subtitle`
- [ ] Location: Itinerary sidebar day boxes

### 3. **Activity/Stop Titles**
Each activity within a day should be editable:
- [ ] Activity title (e.g., "Visit Marienplatz" → "Explore Marienplatz Square")
- [ ] Backend: Update `trips.days[].items[].title` in JSONB
- [ ] Variant: `text`
- [ ] Location: Day content timeline

### 4. **Accommodation**
Hotel/accommodation details should be editable:
- [ ] Accommodation name (e.g., "Hotel Vier Jahreszeiten" → "Custom Hotel Name")
- [ ] Accommodation price (e.g., "€120" → "€150")
- [ ] Backend: Update `trips.days[].items[]` where type='accommodation'
- [ ] Variant: `text` for name, `small` for price
- [ ] Location: Accommodation card in day content

### 5. **Highlights**
"Don't Miss" highlights should be editable:
- [ ] Highlight text (e.g., "Neuschwanstein Castle" → "Neuschwanstein Castle Tour")
- [ ] Backend: Update `trips.days[].highlights[]` in JSONB
- [ ] Variant: `text`
- [ ] Location: Highlights section in day content

### 6. **Did You Know Facts**
Interesting facts should be editable:
- [ ] Fact text (multi-line)
- [ ] Backend: Update `trips.days[].didYouKnow` in JSONB
- [ ] Variant: `text` with textarea
- [ ] Location: "Did You Know?" card in day content

### 7. **Travel Tips**
General trip tips should be editable:
- [ ] Individual tip text
- [ ] Add new tip button
- [ ] Delete tip button
- [ ] Backend: Update `trips.tips[]` in JSONB
- [ ] Variant: `small`
- [ ] Location: Travel Tips section in right sidebar

### 8. **Location Descriptions**
The 2-3 sentence descriptions under gallery:
- [ ] Description text (multi-line)
- [ ] Backend: Update `trips.days[].description` in JSONB
- [ ] Variant: `text` with textarea
- [ ] Location: Under gallery images in day content

### 9. **Activity Times**
Start times for each activity:
- [ ] Time (e.g., "09:00" → "10:30")
- [ ] Backend: Update `trips.days[].items[].time` in JSONB
- [ ] Variant: `small`
- [ ] Location: Timeline in day content

### 10. **Activity Durations**
Duration for each activity:
- [ ] Duration (e.g., "2h" → "3h")
- [ ] Backend: Update `trips.days[].items[].duration` in JSONB
- [ ] Variant: `small`
- [ ] Location: Timeline in day content

---

## Backend Integration

### Database Schema
All edits save to the `trips` table:

```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT,
  subtitle TEXT,
  days JSONB, -- Contains all day/activity/highlight data
  tips JSONB, -- Array of travel tips
  -- ... other fields
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Endpoints

#### 1. Update Trip Metadata
```typescript
// POST /api/trips/[id]/update-metadata
{
  title?: string
  subtitle?: string
}
```

#### 2. Update Day Data
```typescript
// POST /api/trips/[id]/update-day
{
  dayNumber: number
  location?: string
  description?: string
  didYouKnow?: string
  highlights?: string[]
}
```

#### 3. Update Activity
```typescript
// POST /api/trips/[id]/update-activity
{
  dayNumber: number
  activityIndex: number
  title?: string
  time?: string
  duration?: string
}
```

#### 4. Update Accommodation
```typescript
// POST /api/trips/[id]/update-accommodation
{
  dayNumber: number
  name?: string
  price?: string
}
```

#### 5. Update Tips
```typescript
// POST /api/trips/[id]/update-tips
{
  tips: string[] // Full array replacement
}
```

### Auto-Save Strategy

**Debounced Auto-Save:**
- Wait 1 second after user stops typing
- Show "Saving..." indicator
- Show "Saved ✓" confirmation
- Handle errors gracefully

**Implementation:**
```typescript
const [isSaving, setIsSaving] = useState(false)
const saveTimeoutRef = useRef<NodeJS.Timeout>()

const handleSave = async (field: string, value: any) => {
  // Clear existing timeout
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current)
  }

  // Debounce save
  saveTimeoutRef.current = setTimeout(async () => {
    setIsSaving(true)
    try {
      await fetch(`/api/trips/${tripId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value })
      })
      toast.success('Saved ✓')
    } catch (error) {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, 1000)
}
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [x] Create `InlineEdit` component
- [ ] Create API endpoints for trip updates
- [ ] Add auto-save logic with debouncing
- [ ] Add saving indicators

### Phase 2: Header & Metadata (Week 1)
- [x] Trip title editing
- [x] Trip subtitle editing
- [ ] Wire to backend

### Phase 3: Day-Level Editing (Week 2)
- [ ] Day location names
- [ ] Location descriptions
- [ ] "Did You Know?" facts
- [ ] Highlights

### Phase 4: Activity-Level Editing (Week 2)
- [ ] Activity titles
- [ ] Activity times
- [ ] Activity durations
- [ ] Accommodation details

### Phase 5: Tips & Extras (Week 3)
- [ ] Travel tips editing
- [ ] Add/delete tips
- [ ] Bulk operations

### Phase 6: Polish & Testing (Week 3)
- [ ] Error handling
- [ ] Loading states
- [ ] Undo/redo functionality
- [ ] Keyboard shortcuts
- [ ] Mobile optimization

---

## UI/UX Guidelines

### Visual Design
- **Editing State:** Emerald border, white background, soft shadow
- **Hover State:** Emerald tint background, hint tag fades in
- **Empty State:** Dashed gray border, italic placeholder
- **Hint Tags:** Gray-100 background, gray-500 text, rounded-full

### Interaction Patterns
1. **Click to Edit:** Single click activates editing mode
2. **Auto-Focus:** Input auto-focuses with text selected
3. **Save on Blur:** Clicking away saves changes
4. **Save on Enter:** Pressing Enter saves (except textarea)
5. **Cancel on Escape:** Pressing Escape cancels editing

### Accessibility
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader announcements
- [ ] Focus indicators
- [ ] ARIA labels

---

## Success Metrics

### User Engagement
- % of users who edit at least one field
- Average number of edits per trip
- Time spent editing vs viewing

### Technical Performance
- API response time < 200ms
- Auto-save success rate > 99%
- Zero data loss incidents

### User Satisfaction
- User feedback on editing experience
- Support tickets related to editing
- Feature adoption rate

---

## Future Enhancements

### Advanced Features
- [ ] Collaborative editing (real-time)
- [ ] Version history / undo
- [ ] Templates for common edits
- [ ] AI suggestions for improvements
- [ ] Bulk edit mode
- [ ] Import/export trip data

### Integration
- [ ] Sync with calendar apps
- [ ] Share edited trips
- [ ] Print-friendly view
- [ ] PDF export with edits

