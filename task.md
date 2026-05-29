# 🧠 AI Agent Prompt: Life OS Planner — Full-Stack Build Spec

## CONTEXT & GOAL

You are building a **Life OS Planner** — a personal productivity command center — on top of an existing React + Vite + Tailwind + Firebase + MongoDB task manager app (already has auth, drag-and-drop task board with To-Do/In Progress/Done columns, and a REST API).

The user has a critical productivity problem: **they intend to do things but end up scrolling reels instead**. This app must actively fight that pattern through smart friction, time-awareness nudges, and dopamine-loop design (visible streaks, completion rings, satisfying micro-interactions). Every design decision must answer: *does this help the user stay on their intended path?*

---

## ARCHITECTURE OVERVIEW

Extend the existing app with a new **`/planner`** route. The planner is a self-contained module with its own sidebar navigation. All planner data lives in MongoDB under a `planner_data` collection, keyed by `userId`. The existing task board stays untouched.

**Tech stack (already in project):**
- React + Vite, Tailwind CSS + DaisyUI use shadcn must  good ui
- Firebase Auth (already working)
- Axios for API calls
- MongoDB via Express backend on Vercel

**New dependencies to install:**
```bash
npm install dayjs react-circular-progressbar react-confetti framer-motion
```

---

## DATABASE SCHEMA

```js
// MongoDB: planner_data collection
{
  userId: String,           // from Firebase UID
  
  yearly: {
    year: Number,
    vision: String,         // 1-line yearly theme/vision
    goals: [                // max 12 goals, one per month
      { month: Number, goal: String, achieved: Boolean }
    ],
    quarterReviews: [       // Q1–Q4
      { quarter: Number, note: String }
    ]
  },
  
  monthly: [
    {
      month: Number,        // 1–12
      year: Number,
      intentions: [String], // max 5 intentions for the month
      habits: [             // habit tracker grid
        { name: String, days: [Boolean] } // 28/30/31 booleans
      ],
      gratitude: String,
      reflection: String
    }
  ],
  
  budget: {
    monthly: [
      {
        month: Number,
        year: Number,
        income: Number,
        categories: [
          { name: String, planned: Number, actual: Number, emoji: String }
        ],
        savingsGoal: Number,
        notes: String
      }
    ],
    daily: [
      {
        date: String,       // "YYYY-MM-DD"
        entries: [
          { label: String, amount: Number, type: "income"|"expense", category: String }
        ]
      }
    ]
  },
  
  weekly: [                 // 25 entries
    {
      weekNumber: Number,   // 1–25
      startDate: String,    // "YYYY-MM-DD" (Monday)
      theme: String,
      topPriorities: [String],   // max 3
      days: {
        mon: [String], tue: [String], wed: [String],
        thu: [String], fri: [String], sat: [String], sun: [String]
      },
      reflection: String,
      winOfTheWeek: String
    }
  ],
  
  growth: [                 // daily performance log
    {
      date: String,         // "YYYY-MM-DD"
      energyLevel: Number,  // 1–5
      moodLevel: Number,    // 1–5
      productivityScore: Number, // 1–10
      deepWorkHours: Number,
      screenTime: Number,   // in minutes (self-reported)
      habits: {             // checkboxes
        exercised: Boolean,
        readBook: Boolean,
        noReels: Boolean,   // 🔑 KEY METRIC — tracks the core problem
        meditatedOrPrayed: Boolean,
        sleptWell: Boolean
      },
      todayWin: String,
      tomorrowFocus: String
    }
  ],
  
  daily: [                  // 200 entries, 25 weeks
    {
      date: String,         // "YYYY-MM-DD"
      topTask: String,      // the ONE most important thing
      schedule: [           // time-blocked schedule
        { time: String, task: String, done: Boolean }  // e.g. "09:00"
      ],
      notes: String,
      completionPercent: Number  // auto-calculated
    }
  ],
  
  notebook: [               // 12 pages
    {
      pageNumber: Number,
      title: String,
      content: String,      // markdown supported
      tags: [String],
      createdAt: String,
      updatedAt: String
    }
  ]
}
```

---

## BACKEND API ROUTES

Add these to `personalized-task-manager-server/routes/planner.js`:

```js
// All routes protected by Firebase token middleware (verifyToken)
GET    /api/planner/:userId              → fetch full planner_data doc
PATCH  /api/planner/:userId/yearly       → update yearly section
PATCH  /api/planner/:userId/monthly/:month → update one month
PATCH  /api/planner/:userId/budget/monthly/:month → update monthly budget
POST   /api/planner/:userId/budget/daily → add daily expense entry
PATCH  /api/planner/:userId/weekly/:weekNumber → update one week
POST   /api/planner/:userId/growth       → upsert today's growth log
PATCH  /api/planner/:userId/daily/:date  → update/create daily page
PATCH  /api/planner/:userId/notebook/:pageNumber → update notebook page

// All PATCH/POST use MongoDB upsert on userId field
// Return 200 with updated document section
```

---

## FRONTEND STRUCTURE

```
src/
├── pages/
│   └── Planner/
│       ├── PlannerLayout.jsx        ← sidebar + outlet
│       ├── YearlyPlanner.jsx
│       ├── MonthlyPlanner.jsx
│       ├── BudgetPlanner.jsx
│       ├── WeeklyPlanner.jsx
│       ├── GrowthTracker.jsx
│       ├── DailyPlanner.jsx
│       ├── Notebook.jsx
│       └── PlannerCalendar.jsx
└── components/planner/
    ├── PlannerSidebar.jsx
    ├── CompletionRing.jsx           ← circular progress
    ├── HabitGrid.jsx
    ├── TimeBlock.jsx
    ├── BudgetBar.jsx
    ├── StreakCounter.jsx
    └── MoodSelector.jsx
```

---

## SIDEBAR NAVIGATION (`PlannerSidebar.jsx`)

Left sidebar (collapsible on mobile). Show active week number and today's date at the top. Navigation items:

```js
const navItems = [
  { icon: "🗓️", label: "Yearly",   path: "/planner/yearly"   },
  { icon: "📅", label: "Monthly",  path: "/planner/monthly"  },
  { icon: "💰", label: "Budget",   path: "/planner/budget"   },
  { icon: "📆", label: "Weekly",   path: "/planner/weekly"   },
  { icon: "📈", label: "Growth",   path: "/planner/growth"   },
  { icon: "📝", label: "Daily",    path: "/planner/daily"    },
  { icon: "📓", label: "Notebook", path: "/planner/notebook" },
  { icon: "🗺️", label: "Calendar", path: "/planner/calendar" },
];
```

At the very bottom of sidebar: **"No Reels Today? 🔥"** — shows today's `noReels` streak count. If streak is 0, show a gentle nudge: *"You've got this!"*

---

## PAGE-BY-PAGE SPECS

---

### 1. YEARLY PLANNER (`YearlyPlanner.jsx`)
**1 page, big picture**

**Layout:**
- Top: Large year display (e.g. "2025") with a one-line "Year Vision" text input (e.g. *"Year of Deep Work"*)
- Middle: 12-month goal grid (3 columns × 4 rows). Each cell = month name + one-line goal + a checkbox for "achieved". Achieved cells animate with a checkmark and a green glow.
- Bottom: Q1–Q4 quarterly review text areas. Only unlock after month 3, 6, 9, 12 respectively (show a lock icon otherwise).
- Right panel: Completion ring (react-circular-progressbar) showing % of yearly goals achieved. Updates in real-time as user checks off goals.

**HCI notes:**
- Auto-save with 800ms debounce on every input
- Smooth Framer Motion entrance animation when page loads

---

### 2. MONTHLY PLANNER (`MonthlyPlanner.jsx`)
**6 pages (months) in a horizontal scroll carousel**

**Each month card contains:**
- Month + year header with a color-coded accent (each month gets its own DaisyUI color)
- **Intentions** — 5 max bullet inputs (add/remove dynamically)
- **Habit Tracker Grid** — `HabitGrid.jsx` component: show habit names as rows, days as columns. Tap a cell to toggle. Color fills build up like a heatmap (more days done = darker cell).
- **Monthly Reflection** — two small textareas: "What worked?" / "What to improve?"
- **Gratitude note** — one-line

**HCI notes:**
- Swipe gesture support for mobile (use `touch-action: pan-x` on the carousel)
- Month selector at top: show all 6 months as pill tabs
- Completed habits get a ✅ glow in the grid; 21+ days in a row triggers a confetti burst (react-confetti)

---

### 3. BUDGET PLANNER (`BudgetPlanner.jsx`)
**Monthly overview + daily log**

**Monthly Budget Tab:**
- Income input at top
- Category rows: emoji + category name + planned amount + actual amount input + a horizontal BudgetBar showing planned vs actual (green if under, red if over)
- Default categories: 🍚 Food, 🏠 Rent, 🚌 Transport, 📱 Phone/Internet, 🎮 Entertainment, 💊 Health, 📚 Learning, 💳 Other
- Savings goal input + auto-calculated savings amount
- Month summary card: Total Planned vs Total Actual vs Variance

**Daily Budget Tab:**
- Date picker (defaults to today)
- Quick-add entry: label + amount + income/expense toggle + category dropdown
- List of today's entries (swipe to delete on mobile)
- Running daily total

**HCI notes:**
- When actual > planned in any category, that row turns red with a gentle shake animation
- Budget summary shows a spending health score (0–100) based on variance

---

### 4. WEEKLY PLANNER (`WeeklyPlanner.jsx`)
**25 weeks, paginated**

**Week selector:**
- Horizontal scrollable week chips at top (W1, W2 ... W25)
- Auto-jump to current week on load

**Each week page:**
- Week number + date range header
- **Week Theme** — one-line input (e.g. *"Ship MVP, no distractions"*)
- **Top 3 Priorities** — exactly 3 input fields (no more, no less — enforces focus)
- **Day-by-Day Grid** — Mon to Sun, each day is an expandable accordion with a textarea for tasks/notes
- **Win of the Week** — one special highlight field with a 🏆 icon
- **Weekly Reflection** textarea

**HCI notes:**
- Prev/Next week buttons with smooth slide transition (Framer Motion)
- Completion bar at top of each week: % of day tasks completed

---

### 5. GROWTH TRACKER (`GrowthTracker.jsx`)
**Daily performance log — the MOST IMPORTANT screen**

**Today's log (always shows today by default):**

```
[ Energy Level ]  1–5 emoji selector (😴 😑 🙂 😊 ⚡)
[ Mood Level ]    1–5 emoji selector (😢 😕 😐 😊 🤩)
[ Productivity ]  1–10 slider
[ Deep Work hrs ] number input (0–12)
[ Screen Time ]   number input in minutes (self-reported)

[ Habits Today ]
  ☐ Exercised
  ☐ Read a book (not reels)
  ☐ NO REELS TODAY 🔥    ← highlighted with special styling, center-stage
  ☐ Meditated / Prayed
  ☐ Slept well

[ Today's Win ]   textarea, 1-3 sentences
[ Tomorrow's Focus ] textarea, 1 sentence — the ONE thing
```

**Growth Dashboard (below the log):**
- **No-Reels Streak** — big display counter. If streak ≥ 7: fire animation 🔥🔥🔥. Breaking the streak shows a sad emoji with a reset prompt.
- Last 7 days: mini bar chart of productivity scores (hand-coded SVG bars)
- Last 7 days: energy + mood sparkline
- Habit completion rate for the last 30 days (shown as a heatmap grid similar to GitHub contributions)

**HCI notes:**
- When user logs "NO REELS TODAY = true" for the first time: confetti + toast "🔥 Keep the streak alive!"
- Screen time input: if user enters > 180 minutes, show a gentle nudge: *"That's 3+ hours. Tomorrow, try 90?"*
- Auto-save on every input change

---

### 6. DAILY PLANNER (`DailyPlanner.jsx`)
**200 pages, 25 weeks — one per day**

**Date navigation:**
- Calendar week strip at top (Mon–Sun for current week)
- Prev/Next day arrows
- Jump-to-date datepicker

**Each daily page:**
- **Date header** with day name (e.g. *"Thursday, 12 June"*)
- **⭐ Top Task** — one prominent input. Label it "The ONE thing I must do today". Styled larger and bolder than everything else.
- **Time-Block Schedule** — `TimeBlock.jsx`:
  - Pre-loaded rows from 06:00 to 23:00 in 1-hour slots
  - Each slot: time label + task text input + done checkbox
  - Done slots get a strikethrough and a light green background
  - Drag-to-reorder the tasks (use @dnd-kit, already installed)
- **Notes** textarea at the bottom
- **Completion ring** (top right): shows % of time blocks marked done

**HCI notes:**
- Incomplete Top Task at end of day (after 9 PM): push a browser notification if permission granted: *"Your top task isn't done yet. Still time! 💪"*
- Completed days show a ✅ on the week strip

---

### 7. NOTEBOOK (`Notebook.jsx`)
**12 pages, freeform**

- Left panel: list of 12 notebook pages with title + tag badges
- Right panel: selected page editor
- Editor: title input + tag input (comma-separated) + large textarea (support basic markdown preview toggle)
- Each page shows "Last edited: X time ago"
- Filter/search by tag at top

**HCI notes:**
- Markdown preview toggle (edit vs read mode)
- Tags auto-complete from previously used tags
- Auto-save with visual indicator ("Saved ✓" or "Saving...")

---

### 8. PLANNER CALENDAR (`PlannerCalendar.jsx`)
**6-month journey overview**

A full 6-month calendar grid (use dayjs to generate). Each date cell shows:
- Dot color indicators:
  - 🟢 Green dot = daily planner entry exists
  - 🔵 Blue dot = growth log entry exists
  - 🟡 Yellow dot = had a budget entry
  - 🔴 Red dot = screen time > 180 min that day (pulled from growth log)
- Click any past date → shows a popover/drawer with that day's summary (top task, productivity score, noReels status)
- Current day is highlighted with a pulsing ring

**HCI notes:**
- Month navigation (prev/next) with slide animation
- Streaks are visualized as a colored line connecting consecutive no-reels days

---

## GLOBAL HCI DESIGN RULES

These apply to every screen:

1. **Dark mode first** — use DaisyUI `data-theme="dark"` as default. User can toggle in settings.

2. **Micro-interactions on every action:**
   - Checkbox toggle → scale bounce animation
   - Streak increment → number counter animation (count up)
   - Save → brief green border flash
   - Goal achieved → confetti burst

3. **Anti-scroll-doom design patterns:**
   - No infinite scroll anywhere
   - Page limit is enforced (25 weeks = 25 pages, not infinite)
   - "Today" is always reachable in one click from anywhere

4. **Focus mode:** A full-screen button on Daily Planner that hides everything except the Top Task and time blocks. Dimmed background, no sidebar.

5. **Progress visibility:**
   - Every section has a completion metric visible at all times
   - The sidebar shows today's completion ring for the daily planner
   - Growth streak is always visible in the sidebar footer

6. **Gentle nudges (not guilt-tripping):**
   - Use warm, encouraging language in empty states
   - Empty daily planner: *"What's the one thing that would make today great?"*
   - Empty growth log: *"How are you feeling today? Let's track it."*
   - Never say "You failed" — say "New day, fresh start 🌱"

7. **Mobile-first layout:**
   - Sidebar collapses to bottom nav bar on screens < 768px
   - All forms are thumb-friendly (large tap targets, 48px min height)
   - Time block schedule is scrollable vertically without affecting page scroll

---

## STATE MANAGEMENT

Use React Context (`PlannerContext`) to hold all planner data in memory. Fetch once on planner mount (`/api/planner/:userId`), then PATCH individual sections on change. Keep a `isDirty` flag per section to batch saves.

```jsx
// PlannerContext shape
{
  plannerData: { yearly, monthly, budget, weekly, growth, daily, notebook },
  loading: Boolean,
  updateSection: (section, data) => Promise,
  getTodayGrowth: () => Object,
  getCurrentWeek: () => Object,
  getNoReelsStreak: () => Number
}
```

---

## IMPLEMENTATION ORDER

Build in this order (each phase is independently deployable):

**Phase 1 — Shell & Daily (core anti-scroll feature)**
1. PlannerLayout + sidebar
2. PlannerContext + API routes
3. DailyPlanner (most important page)
4. GrowthTracker (especially the No-Reels tracker)

**Phase 2 — Planning layers**
5. WeeklyPlanner
6. MonthlyPlanner
7. YearlyPlanner

**Phase 3 — Support tools**
8. BudgetPlanner
9. Notebook
10. PlannerCalendar

---

## ANTI-PATTERNS TO AVOID

- ❌ Do NOT use any external calendar library — build the calendar grid manually with dayjs
- ❌ Do NOT add pagination that requires more than 2 clicks to reach today
- ❌ Do NOT use modals for primary data entry (use inline editing instead)
- ❌ Do NOT show empty state errors — show encouraging prompts instead
- ❌ Do NOT save on every keystroke — debounce 800ms
- ❌ Do NOT make the Growth Tracker feel like surveillance — frame it as self-reflection, not monitoring

---

## FILE NAMING CONVENTIONS

- Components: PascalCase (`DailyPlanner.jsx`)
- Hooks: camelCase with `use` prefix (`usePlannerData.js`)
- API routes: kebab-case (`planner-routes.js`)
- CSS: Tailwind utility classes only, no separate CSS files
- Constants: SCREAMING_SNAKE_CASE (`MAX_WEEKLY_PRIORITIES = 3`)

---

## ENVIRONMENT VARIABLES NEEDED

```env
# Frontend (.env)
VITE_API_BASE_URL=https://your-backend.vercel.app

# Backend (.env)
MONGODB_URI=...           # already exists
FIREBASE_PROJECT_ID=...   # already exists
```

---

## SAMPLE API CALL PATTERN (Frontend)

```js
// usePlannerData.js
const updateGrowthLog = async (date, data) => {
  const token = await auth.currentUser.getIdToken();
  await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/api/planner/${user.uid}/growth`,
    { date, ...data },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
```

---

## SUCCESS CRITERIA

The app is done when the user can:
1. Open the app and see today's Daily Planner instantly (< 1 click)
2. Log their "No Reels" status in under 5 seconds
3. See their current no-reels streak at all times
4. Block out their day in time slots with drag-to-reorder
5. Navigate between any planner section without losing their place
6. See their 6-month journey on the calendar in one view

The app has solved its purpose if, after 2 weeks of use, the user's Growth Tracker shows:
- Increasing `noReels` streak
- Increasing `productivityScore`
- Decreasing `screenTime`

---

## 🛠️ BUDGET PLANNER REFACTORING PROGRESS

- [x] **Backend Controller Refactoring**
    - [x] Implement server-side category recalculation helper
    - [x] Refactor `addDailyBudgetEntry` and `deleteBudgetEntry`
    - [x] Integrate validators for new income sources
- [x] **Frontend State Management Cleanup**
    - [x] Remove client-side total recalculations
    - [x] Update `BudgetPlanner.jsx` to reflect aggregated income
- [x] **UI Component Modernization**
    - [x] Create `BudgetIncomeSourceList.jsx` for multi-stream tracking
    - [x] Enhance `BudgetCategoryList.jsx` with progress bars and income-share %
    - [x] Fix `BudgetPlanner.jsx` layout for better data hierarchy
- [x] **UX Refinement & Polish**
    - [x] Final premium touches to `BudgetLedger.jsx`
    - [x] Real-time category health alerts and pulse animations
- [x] **Verification**
    - [x] Full integration of multi-income sources and backend-driven totals