# PWAte - AI-Powered Food Tracking App

A Progressive Web App for food tracking with AI-powered logging capabilities. Built with vanilla JavaScript, Vite, and Supabase.

![PWAte Dashboard](./docs/dashboard-preview.png)

## Features

### Core Features (MVP)
- 🔐 **Authentication** - Email/password login with Supabase Auth
- 🎨 **Material You Theme** - 8 preset accent colors + Light/Dark/AMOLED modes
- 📊 **Hero Dashboard** - Large calorie display with colored macro progress bars
- 📝 **Smart Logging** - AI-powered natural language food logging
- 📷 **Camera Scanning** - Scan nutrition labels with AI extraction
- 📅 **Diary View** - Timeline of foods logged by time
- ⚙️ **Settings** - Theme, nutrition goals, and AI configuration

### UI Components
- **FAB Speed Dial** - Expanding menu with "Scan Label" and "Type Anything" options
- **Bottom Sheet** - Slide-up panel for text input with quick chips
- **AI Modal** - Shows thinking animation then results before logging
- **Pill Navigation** - Active state with filled pill background

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Build Tool**: Vite
- **PWA**: vite-plugin-pwa
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI**: OpenAI, Anthropic, or Google Gemini (user-provided API keys)
- **Storage**: IndexedDB (for AI credentials), Supabase (for user data)

## Project Structure

```
frontend/
├── src/
│   ├── main.js                 # App entry point
│   ├── config/
│   │   └── supabase.js         # Supabase client initialization
│   ├── state/
│   │   └── store.js            # Central state management
│   ├── router/
│   │   └── router.js           # SPA routing
│   ├── theme/
│   │   └── ThemeManager.js     # Material You theming
│   ├── utils/
│   │   ├── StorageManager.js   # IndexedDB for AI config
│   │   ├── dateFormatter.js
│   │   └── macroCalculator.js
│   ├── services/
│   │   ├── foodService.js      # Foods table operations
│   │   ├── logService.js       # Logs table operations
│   │   ├── goalsService.js     # User goals operations
│   │   ├── settingsService.js  # User settings operations
│   │   └── aiService.js        # Edge function calls
│   ├── components/
│   │   ├── auth/
│   │   │   └── AuthScreen.js
│   │   ├── navigation/
│   │   │   ├── TopNavBar.js
│   │   │   └── BottomNav.js
│   │   └── common/
│   │       ├── ProgressBar.js
│   │       ├── FabSpeedDial.js
│   │       ├── BottomSheet.js
│   │       └── AIModal.js
│   ├── views/
│   │   ├── Dashboard.js
│   │   ├── Diary.js
│   │   └── Settings.js
│   └── styles/
│       └── main.css
├── public/
│   └── favicon.svg
├── index.html
├── vite.config.js
├── vercel.json
├── package.json
└── .env
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- AI provider API key (OpenAI, Anthropic, or Google Gemini)

### 1. Clone and Install

```bash
cd frontend
npm install
```

### 2. Environment Setup

Create a `.env` file in the frontend directory:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

### 4. Build for Production

```bash
npm run build
```

## Backend Setup (Supabase)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your Project URL and Anon Key from Settings > API

### 2. Run Database Migrations

Execute the following SQL in the Supabase SQL Editor:

#### Main Tables and Views

```sql
-- Run the contents of Supabase/SQL-Setup.txt
-- This creates: foods, logs, user_goals, meals, meal_items, recipes, recipe_ingredients
-- And views: daily_summary, meal_time_summary
```

#### User Settings Table (for themes)

```sql
-- Run the contents of Supabase/user-settings-migration.sql
-- This creates: user_settings table for theme preferences
```

#### AMOLED Theme Support

```sql
ALTER TABLE user_settings DROP CONSTRAINT user_settings_theme_mode_check;
ALTER TABLE user_settings ADD CONSTRAINT user_settings_theme_mode_check 
  CHECK (theme_mode IN ('system', 'light', 'dark', 'amoled'));
```

### 3. Deploy Edge Functions

Deploy the AI edge functions:

```bash
supabase functions deploy smart-log
supabase functions deploy scan-nutrition-label
```

The edge function code is in `Supabase/smart-log.ts` and `Supabase/scan-nutrition-label.ts`.

> **Note:** The `smart-log` function replaces the older `ai-food-log` function and handles food, water, and weight logging with AI intent classification.

### 4. Configure Authentication

1. Go to Authentication > Providers in Supabase
2. Enable Email provider
3. Disable email confirmation (for MVP) or configure email templates

## AI Configuration

The app supports three AI providers. Configure your choice in Settings:

| Provider | Models | Get API Key |
|----------|--------|-------------|
| OpenAI | gpt-4o-mini, gpt-4o | [platform.openai.com](https://platform.openai.com) |
| Anthropic | claude-3-haiku, claude-3-sonnet | [console.anthropic.com](https://console.anthropic.com) |
| Google Gemini | gemini-1.5-flash, gemini-pro | [aistudio.google.com](https://aistudio.google.com) |

**Important**: API keys are stored locally in IndexedDB and never sent to Supabase.

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Set environment variables in Vercel dashboard

### GitHub Pages

1. Build the project: `npm run build`
2. Deploy the `dist` folder to GitHub Pages
3. Configure SPA routing with 404.html redirect

### Other Platforms

The `vercel.json` file handles SPA routing. For other platforms, ensure all routes redirect to `index.html`.

## Database Schema

### Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `foods` | Global food database | SELECT all, INSERT auth |
| `logs` | User food diary | User's own only |
| `water_logs` | Water intake tracking | User's own only |
| `weight_logs` | Body weight tracking | User's own only |
| `user_goals` | Daily macro targets | User's own only |
| `user_settings` | Theme & preferences | User's own only |
| `meals` | Saved meal groupings | User's own only |
| `meal_items` | Foods within meals | Via meals |
| `recipes` | Custom recipes | User's own only |
| `recipe_ingredients` | Foods in recipes | Via recipes |

### Views

| View | Purpose |
|------|---------|
| `daily_summary` | Aggregated daily macros |
| `meal_time_summary` | Macros per meal time |

### Edge Functions

| Function | Purpose |
|----------|---------|
| `smart-log` | AI-powered intent classification for food, water, and weight logging |
| `scan-nutrition-label` | Vision-based label scanning |

## Security

- **AI API Keys**: Stored in IndexedDB, never sent to Supabase
- **RLS Policies**: All user data protected by `auth.uid()` checks
- **Auth Tokens**: Handled automatically by Supabase client
- **Environment Variables**: Supabase URL and Anon Key are safe to expose

## Roadmap

### Post-MVP Features
- [ ] Food Details/Edit pages
- [ ] Recipe & Meal creation
- [x] Water tracking
- [x] Weight tracking
- [ ] Offline data sync
- [ ] Barcode scanning
- [ ] Food import from USDA/OpenFoodFacts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed description

---

Built with ❤️ using vanilla JavaScript, Vite, and Supabase
