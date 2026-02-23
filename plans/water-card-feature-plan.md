# Water Card Feature Plan

## Overview

Implement an interactive water tracking card on the Dashboard that allows users to quickly log water intake using their configured quick-add sizes, as well as input custom amounts.

## Current State Analysis

### Existing Infrastructure

1. **[`waterService.js`](frontend/src/services/waterService.js)**
   - `logWater(amountMl, date)` - Logs water in ml
   - `getDailyWaterTotal(date)` - Returns `{ total_ml, total_oz }`
   - `getWaterByDate(date)` - Returns array of water logs
   - Conversion utilities: `mlToOz()`, `ozToMl()`

2. **[`settingsService.js`](frontend/src/services/settingsService.js)**
   - `getQuickWaterSizes()` - Returns `{ size1, size2, size3, unit }` (sizes in ml)
   - `convertWater(value, fromUnit, toUnit)` - Converts between oz/ml

3. **[`store.js`](frontend/src/state/store.js)**
   - `userSettings.quickWaterSize1/2/3` - Sizes stored in ml
   - `userSettings.waterUnit` - User's preferred unit ('oz' or 'ml')
   - `getQuickWaterSizes()` - Returns array with `{ ml, display, unit }`

4. **[`Dashboard.js`](frontend/src/views/Dashboard.js)**
   - Currently has a static placeholder water card showing "0 oz"
   - No water data fetching
   - No interactivity

### Database Schema

From [`water-weight-migration.sql`](Supabase/water-weight-migration.sql):
- `water_logs` table: `id`, `user_id`, `amount_ml`, `date`, `created_at`
- `daily_water_summary` view: Aggregates daily totals

## Proposed Implementation

### 1. Dashboard Data Fetching Updates

Add water data to the Dashboard's `fetchData()` method:

```javascript
// In Dashboard.fetchData()
const waterTotal = await waterService.getDailyWaterTotal(date).catch(() => ({ total_ml: 0, total_oz: 0 }))
this.waterTotal = waterTotal
```

### 2. Water Card UI Design

```
┌─────────────────────────────────────────┐
│  💧 Water                               │
│                                         │
│     0 oz                          [+]   │  <- Total display with add icon
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐   │  <- Quick-add buttons
│  │ 8oz │  │ 16oz│  │ 24oz│  │ ... │   │
│  └─────┘  └─────┘  └─────┘  └─────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- Large total display with user's preferred unit
- Three quick-add buttons using configured sizes
- "..." button opens custom input modal/bottom sheet
- Visual feedback on successful log (toast + animation)

### 3. Component Structure

#### Water Card Rendering

```javascript
renderWaterCard() {
  const unit = store.getState().userSettings.waterUnit
  const total = unit === 'oz' 
    ? Math.round(this.waterTotal?.total_oz || 0)
    : Math.round(this.waterTotal?.total_ml || 0)
  
  const sizes = store.getQuickWaterSizes()
  
  return `
    <div class="tracker-card water" id="water-card">
      <div class="tracker-header">
        <span class="tracker-icon">💧</span>
        <span class="tracker-label">Water</span>
      </div>
      <div class="tracker-value">
        ${total} <span class="tracker-unit">${unit}</span>
      </div>
      <div class="water-quick-add">
        ${sizes.map((size, i) => `
          <button class="water-quick-btn" data-ml="${size.ml}" data-index="${i}">
            ${size.display}${size.unit}
          </button>
        `).join('')}
        <button class="water-quick-btn custom" id="water-custom-btn">
          ...
        </button>
      </div>
    </div>
  `
}
```

### 4. Event Handlers

#### Quick Add Button Click

```javascript
async handleQuickAddWater(ml) {
  try {
    await waterService.logWater(ml, store.getSelectedDateString())
    // Refresh water total
    this.waterTotal = await waterService.getDailyWaterTotal(store.getSelectedDateString())
    this.mount(document.getElementById('main-view'))
    // Show toast
    this.showToast(`Added ${this.formatWaterAmount(ml)}`)
  } catch (error) {
    console.error('Failed to log water:', error)
    this.showToast('Failed to log water')
  }
}
```

#### Custom Amount Input

Two options for custom input:

**Option A: Simple Prompt (Recommended for MVP)**
```javascript
handleCustomWater() {
  const input = prompt('Enter water amount (in your preferred unit):')
  if (input) {
    const amount = parseFloat(input)
    if (!isNaN(amount) && amount > 0) {
      const unit = store.getState().userSettings.waterUnit
      const ml = unit === 'oz' ? amount * 29.5735 : amount
      this.handleQuickAddWater(ml)
    }
  }
}
```

**Option B: Bottom Sheet (Better UX)**
- Create a small bottom sheet with number input
- Include unit display
- Add/Cancel buttons

### 5. CSS Styling

```css
.tracker-card.water {
  position: relative;
  overflow: visible;
}

.water-quick-add {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--md-divider);
}

.water-quick-btn {
  flex: 1;
  padding: 8px 4px;
  border: 1px solid var(--md-outline);
  border-radius: 8px;
  background: transparent;
  color: var(--md-primary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.water-quick-btn:hover {
  background: var(--md-primary-container);
  border-color: var(--md-primary);
}

.water-quick-btn:active {
  transform: scale(0.95);
}

.water-quick-btn.custom {
  font-size: 1rem;
  min-width: 44px;
}
```

### 6. Integration Points

#### Store Updates

The store already has the necessary data:
- `userSettings.waterUnit` - for display
- `userSettings.quickWaterSize1/2/3` - for quick buttons
- `getQuickWaterSizes()` - helper method

#### Water Service Usage

```javascript
import { waterService } from '../services/waterService.js'

// Log water
await waterService.logWater(amountMl, date)

// Get total
const total = await waterService.getDailyWaterTotal(date)
```

## Implementation Steps

1. **Update Dashboard.js imports**
   - Add `waterService` import
   - Add `waterTotal` to constructor state

2. **Update fetchData()**
   - Fetch daily water total alongside other data

3. **Create renderWaterCard() method**
   - Replace static water card HTML with dynamic rendering
   - Use store's quick water sizes
   - Display total in user's preferred unit

4. **Add event listeners**
   - Quick-add button clicks
   - Custom amount button

5. **Implement water logging handlers**
   - `handleQuickAddWater(ml)`
   - `handleCustomWater()` (prompt or bottom sheet)

6. **Add CSS styles**
   - Quick-add button styling
   - Hover/active states
   - Responsive layout

7. **Add visual feedback**
   - Toast notification on successful log
   - Optional: Animate total update

## Future Enhancements (Out of Scope)

- Water progress toward daily goal
- View water log history (tap card to expand)
- Delete water entries
- Water intake graph/chart
- Hydration reminders

## Files to Modify

| File | Changes |
|------|---------|
| [`frontend/src/views/Dashboard.js`](frontend/src/views/Dashboard.js) | Add water fetching, rendering, and event handling |
| [`frontend/src/styles/main.css`](frontend/src/styles/main.css) | Add water card button styles |

## Testing Checklist

- [ ] Water total displays correctly on load
- [ ] Quick-add buttons show correct sizes from settings
- [ ] Quick-add logs water to database
- [ ] Total updates after logging
- [ ] Unit displays correctly (oz vs ml)
- [ ] Custom amount input works
- [ ] Toast notification shows on log
- [ ] Works offline (if applicable)
