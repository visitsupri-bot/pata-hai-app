# Samavaya Niramaya — Design Spec
**समवाय निरामय** · *Holistic Wellness Through Union*

**Date:** 2026-07-29  
**Type:** Vanilla-CSS PWA (Progressive Web App)  
**Baseline:** Built in the same pattern as `pata-hai-app` — single HTML/CSS/JS, JSON data, service worker, installable on mobile.

---

## 1. Purpose & Audience

A **personal business tool** for a Yoga & Sound Meditation practitioner. It serves two parallel goals:

1. **Operations** — manage class schedule, attendance, and invoicing day-to-day.
2. **Intelligence** — understand market trends, find new venue/client opportunities, and stay grounded in the wisdom of the texts.

The app is for **the teacher's own use**, not for students/participants.

---

## 2. Visual Identity

| Token | Value | Use |
|-------|-------|-----|
| `--saffron` | `#e07b1a` | Primary actions, active tab, hero accents |
| `--turmeric` | `#c9860d` | Secondary labels, gold-tier cards |
| `--gold` | `#d4a017` | Nav active state, highlight chips |
| `--forest` | `#1e4d2b` | Header, bottom nav background |
| `--moss` | `#3a6b3e` | Green card accents, Ayurveda theme |
| `--sage` | `#6b8f6b` | Inactive nav labels, muted text |
| `--cream` | `#fdf6ee` | App background |
| `--bark` | `#78350f` | Devanagari verse text, dark accents |
| `--muted` | `#7c6a52` | Secondary body text |

**Typography:** System font stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`).  
**Corner radius:** 12–16px cards, 99px chips/badges.  
**Card accent:** Left 4px border in tab colour (saffron / moss / gold / blue / red).

---

## 3. App Structure

### 3.1 Shell
- **Header** (sticky): App logo "🪷 Samavaya Niramaya" + today's date (right)
- **Main content area**: Tab panels, only one visible at a time
- **Bottom nav** (fixed, 6 tabs): forest green background, saffron top border, gold active state
- **Skeleton loader**: shown while JSON data loads
- **Offline screen**: shown when fetch fails

### 3.2 Tab Bar

| Position | Icon | Label | Panel ID |
|----------|------|-------|----------|
| 1 | 📅 | Schedule | `panel-schedule` |
| 2 | ✅ | Attendance | `panel-attend` |
| 3 | 🧘 | Class Plan | `panel-plan` |
| 4 | 🌿 | Tip | `panel-tip` |
| 5 | 📡 | Opportunity | `panel-opp` |
| 6 | 📖 | Wisdom | `panel-wisdom` |

---

## 4. Tab Specifications

### Tab 1 — Schedule

**Purpose:** See and manage all upcoming classes in one view.

**Content:**
- Week selector (current week by default, swipe/arrow to next/prev)
- Legend: ● Fixed (green) · ● Drop-in (orange) · ● Event (gold)
- Class rows, each showing:
  - Time + day
  - Coloured dot (class type)
  - Class name + venue
  - Enrolled count badge
- Highlighted gold border for Events/Workshops
- "Next Week Preview" section below
- **"+ Add Class" button** (top right): opens a simple form to add a new class with fields: name, date, time, venue, type (Fixed / Drop-in / Event), rate, capacity

**Data model per class:**
```json
{
  "id": "cls_001",
  "name": "Morning Hatha",
  "type": "fixed",           // fixed | dropin | event
  "day": "Monday",
  "time": "07:00",
  "venue": "Greenleaf Studio, Bandra",
  "capacity": 10,
  "enrolled": 6,
  "rate_type": "monthly",    // monthly | dropin | flat_event
  "rate": 4800
}
```

---

### Tab 2 — Attendance & Invoicing

**Purpose:** Mark attendance for each class session, track billing status, and generate invoices.

**Content — Attendance section:**
- Class selector at top (dropdown to pick which class/session to mark)
- Attendance table columns: Participant · Plan · Present (✓/✗ toggle) · Sessions Remaining
- Warning indicator (⚠️) when a participant has ≤1 session remaining on their package
- Participants on Drop-in plan show "—" for sessions remaining

**Content — Invoicing section:**
- Invoice list rows: Name · Plan summary · Amount · Status badge (Paid / Pending / Draft)
- Three billing modes supported:
  - **Monthly package** (e.g. ×8 or ×12 sessions per month at fixed price)
  - **Drop-in** (per-session rate, billed immediately on attendance mark)
  - **Flat-fee event** (single invoice for the whole event, e.g. ₹1,500/head × attendees)
- "📄 Generate All Pending Invoices" button at bottom
- Invoice generation produces a simple printable/shareable PDF-style card with: participant name, class details, sessions attended, amount due, UPI QR placeholder

**Data model per participant:**
```json
{
  "id": "par_001",
  "name": "Ananya S.",
  "plan": "monthly",         // monthly | dropin | event
  "sessions_total": 12,
  "sessions_attended": 11,
  "rate": 4800,
  "invoice_status": "paid"   // paid | pending | draft
}
```

---

### Tab 3 — Class Plan

**Purpose:** Plan the week's teaching content — themes, sequences, pranayama, sound layers.

**Content:**
- **Week theme card** (gold): weekly Yogic theme (e.g. "Ishvara Pranidhana — Surrender & Trust") with pranayama focus and sound frequency
- **2-column day grid**: each day shows class name, focus, duration. Today's card highlighted in saffron.
- **Today's Sequence card** (green): full pose sequence from warm-up → peak → counter-pose, with chips for pranayama and savasana duration
- **Sound Layer card**: frequency (e.g. 432 Hz), chakra association, instrument, duration
- **"Edit Sequence" button**: inline editor to reorder or swap poses
- **"Plan Sequence →" button** on upcoming events: jump to planning view for that event

**Week theme is AI-suggested** based on the month, season (Ritu), and lunar cycle — teacher can override.

---

### Tab 4 — Tip of the Day

**Purpose:** Yoga + Ayurveda guidance targeting psychosomatic conditions and everyday ailments.

**Content:**
- **Hero card** (forest green gradient): today's featured condition/ailment with brief framing
- **Ailment selector chips**: tappable chips to switch focus condition. Initial set:
  - Lower Back Pain · Anxiety · Insomnia · Digestive Issues · Migraine
  - Hypertension · Fatigue · Knee Pain · Hormonal Balance · Grief / Loss
  - Sinusitis · Skin Issues · Eye Strain · Frozen Shoulder · Diabetes Management
- Per selected condition, three cards appear:
  - **Yoga Rx** (saffron): specific asanas, cautions, duration
  - **Ayurvedic Rx** (green): herbs, oils, therapies, timing
  - **Sattvic Diet** (gold): foods to favour, foods to avoid, recipe suggestion
- Content sourced from daily JSON; teacher can also use this tab to inspire what they share with students

---

### Tab 5 — Opportunity (Market Intelligence)

**Purpose:** Business intelligence radar — trends, venue prospecting, differentiation strategy.

**Content sections:**

#### 5a. Market Radar Hero
- Gradient dark-forest hero card with headline trend insight + sparkline bar chart
- Updated daily from JSON (manually curated or AI-generated weekly digest)

#### 5b. Trending Right Now 🔥
- 2–3 cards showing social/search trends:
  - Platform tag (Instagram India / YouTube Global / Google Trends)
  - Headline insight + relevant hashtags/keywords
  - Opportunity framing ("gap identified: barely offered in X city")

#### 5c. Venues to Approach 📍
- Venue rows with: icon (🏨🏢🏡🌴🏛️) · name · city · badge (High Value / Corporate / Govt / Growing)
- Brief opportunity note per venue
- **Geographic scope:**
  - 🇮🇳 **India:** Bangalore · Pune · Mumbai
    - Luxury hotels & resorts (5-star properties)
    - Corporate campuses & co-working spaces
    - Studios & wellness centres
    - **Government connects:** Ministries, Defence establishments (Army/Navy/Air Force wellness), PSU campuses, Municipal corporations, NCC/NSSO wellness programs, Ayush Ministry tie-ups
  - 🇦🇪 **Middle East:** Dubai, Abu Dhabi, Riyadh, Doha — expat wellness communities, luxury hotels, corporate
  - 🇬🇧🇩🇪🇳🇱 **Europe:** London, Amsterdam, Berlin — South Asian diaspora yoga market, retreat centres
  - 🌏 **Asia:** Singapore, Bali, Bangkok — wellness tourism, retreat market
- "📍 Add Venue" button to log a prospect manually with status (To Approach / Pitched / In Discussion / Converted)

#### 5d. Your Differentiation Edge ✨
- 2–3 gold-background insight cards
- Frames the teacher's unique positioning vs. competitors:
  - e.g. "Nada Yoga + Ayurvedic dosha sequencing = no one else in India offers this system"
  - e.g. "Therapeutic/condition-specific yoga is underpriced in India vs. London/NYC"
  - e.g. "Government Ayush programs actively seeking certified teachers — low competition, high credibility"
- Updated weekly; teacher can pin favourite insights

---

### Tab 6 — Wisdom

**Purpose:** Daily study from classical Yogic and Vedantic texts, with multi-teacher commentary.

**Content:**
- **Text source selector** (horizontal scrollable pill buttons):
  - Patanjali Yoga Sutras · Bhagavad Gita · Upanishads · Hatha Yoga Pradipika
  - Selection persists in localStorage
- **2–3 verse cards** per selected text, each containing:
  - Source reference (e.g. "Yoga Sutras · 1.2")
  - Devanagari verse (large, readable, bark-brown colour)
  - English transliteration + translation
  - 2–3 commentary blocks from mixed classical + modern teachers:
    - Classical: Swami Vivekananda, B.K.S. Iyengar, Sri Aurobindo
    - Modern: Sadhguru, Osho, Thich Nhat Hanh, Mooji
  - Each commentary attributed with teacher name (moss green label)
- Verses rotate daily (keyed to date in JSON)
- "🔖 Save to favourites" button per verse (stored in localStorage)

---

## 5. Data Architecture

### 5.1 Data source
Same pattern as `pata-hai-app`: daily JSON fetched from Google Cloud Storage.

```
GCS_BASE = 'https://storage.googleapis.com/samavaya-niramaya/daily'
Fetch: ${GCS_BASE}/${YYYY-MM-DD}.json
```

### 5.2 Daily JSON structure
```json
{
  "date": "2026-07-29",
  "sections": {
    "schedule": { "classes": [...] },
    "tip": {
      "featured_condition": "Lower Back Pain",
      "conditions": {
        "lower_back_pain": {
          "yoga_rx": { "asanas": [...], "cautions": [...], "duration": "35 min" },
          "ayurveda_rx": { "therapy": "...", "herb": "...", "timing": "..." },
          "sattvic_diet": { "favour": [...], "avoid": [...], "recipe": "..." }
        }
      }
    },
    "class_plan": {
      "week_theme": "...",
      "week_ref": "Yoga Sutras 1.14",
      "pranayama": "Bhramari + Nadi Shodhana",
      "sound_frequency": "432 Hz",
      "days": [...]
    },
    "opportunity": {
      "market_headline": "...",
      "trend_data": [25, 35, 40, 50, 58, 72, 80, 100],
      "trends": [...],
      "venues": [...],
      "differentiation": [...]
    },
    "wisdom": {
      "yoga_sutras": [ { "ref": "1.2", "devanagari": "...", "translation": "...", "commentary": [...] } ],
      "bhagavad_gita": [...],
      "upanishads": [...],
      "hatha_yoga_pradipika": [...]
    }
  }
}
```

### 5.3 Local persistence (localStorage)
- `sn_participants` — participant roster + plan details (added by teacher)
- `sn_attendance` — attendance records keyed by `classId + date`
- `sn_invoices` — invoice records + payment status
- `sn_venues` — manually added venue prospects + pipeline status
- `sn_wisdom_favourites` — bookmarked verses
- `sn_active_tab` — last active tab
- `sn_wisdom_source` — last selected text source

---

## 6. Technical Architecture

| Concern | Approach |
|---------|----------|
| Framework | Vanilla HTML + CSS + JS (zero dependencies) |
| Styling | Vanilla CSS with CSS custom properties |
| Data | Daily JSON from GCS (same as pata-hai-app) |
| Persistence | localStorage for operational data (participants, attendance, invoices) |
| Offline | Service worker caches last JSON + shell assets |
| PWA | `manifest.json` + apple-touch-icon, installable on iOS/Android |
| Invoice output | Print-to-PDF via `window.print()` with a dedicated `@media print` stylesheet |
| Icons | Generated via `gen_icons.py` script (same as pata-hai-app) |

---

## 7. Files to Create

```
samavaya-niramaya-app/
├── index.html          — App shell + all 6 tab panels
├── app.js              — All logic: data fetch, render, localStorage ops
├── style.css           — All styles (palette, components, tabs, print)
├── manifest.json       — PWA manifest
├── service-worker.js   — Offline caching
├── gen_icons.py        — Icon generator
├── icons/              — icon-192.png, icon-512.png, apple-touch-icon.png
└── sample-data/
    └── 2026-07-29.json — Sample daily JSON for development
```

---

## 8. Out of Scope (v1)

- Student-facing app or portal
- Real-time payment processing / UPI integration (invoices are generated for manual collection)
- Cloud sync of attendance/invoice data (localStorage only in v1)
- Push notifications
- Multi-teacher / team support
- Audio playback of sound frequencies

---

## 9. Success Criteria

- All 6 tabs load and render correctly on mobile (375px width minimum)
- Schedule, attendance and invoice data persists across sessions via localStorage
- Daily JSON fetch works; graceful offline fallback shown when unavailable
- App is installable as PWA on iOS and Android
- Invoice "Generate" action produces a clean printable card
- Wisdom tab remembers selected text source across sessions
