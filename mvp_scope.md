1. MVP Scope
The core loop remains the same, but data now lives in the cloud, allowing for seamless device-hopping.
Core Features:
 * User Accounts: Simple email/password login so users can access their diary from their phone or laptop.
 * Cloud Diary: Daily logs of calories, protein, carbs, and fat, saved directly to Postgres.
 * Server-Side Food Search: Lightning-fast queries against a centralized cloud database, offloading the heavy lifting from the device.
 * BYOK Settings: A secure UI where the user pastes their AI API key. Crucial: This key is saved only to the browser's local storage, never to your Supabase database, to avoid security liabilities.
 * AI Natural Language Logging: The user types "3 large eggs." The client browser calls the AI API using their local key, the AI formats the search, the client queries Supabase, and logs the result.
 * PWA Shell: The app is installable and caches the UI, but requires an internet connection to log foods (we will skip complex offline-syncing for the MVP).
2. Planned Architecture
 * Hosting: GitHub Pages. Because Supabase handles the backend, your app remains a collection of static files.
 * Frontend Stack: Vanilla HTML, CSS, and JavaScript. We will use Vite as the build tool to handle the PWA Service Worker bundling and manage environment variables securely.
 * Backend & Auth: Supabase (Free Tier gives you a 500MB Postgres database, 50k monthly active users, and the required APIs out of the box).
 * AI Integration: Direct client-to-API REST calls using the user's locally stored key.
3. Postgres Database Schema
You will set this up in the Supabase SQL Editor.
Table 1: foods (The global food database)
CREATE TABLE foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand TEXT,
  serving_size NUMERIC NOT NULL,
  serving_unit TEXT NOT NULL,
  calories NUMERIC NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL
);
-- Optional: Add a Full Text Search index here later for typo-tolerance

Table 2: logs (The user's diary)
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL, -- Ties the log to the logged-in user
  food_id UUID REFERENCES foods NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  servings_consumed NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

Note on Security: You will enable Row Level Security (RLS) on the logs table so that user_id = auth.uid(). This guarantees users can only ever fetch or delete their own meals.
4. Step-by-Step Build Guide
Step 1: Initialize Supabase
 * Create a free project on Supabase.
 * Go to the SQL Editor and run the schema queries above to create your foods and logs tables.
 * Add a dozen dummy foods into the foods table manually via the Supabase Table Editor so you have data to test with.
 * Grab your Project URL and Anon Key from the API settings.
Step 2: Initialize the Vite PWA
 * Run npm create vite@latest and select the Vanilla JavaScript template.
 * Install the Supabase JS client: npm install @supabase/supabase-js.
 * Install the Vite PWA plugin: npm install vite-plugin-pwa -D.
 * Create a .env file and add your Supabase credentials (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).
Step 3: Wire Up Authentication & UI
 * In your main.js, initialize the Supabase client.
 * Build a simple login/signup form. Use supabase.auth.signUp() and supabase.auth.signInWithPassword().
 * Write a listener (supabase.auth.onAuthStateChange) that hides the login form and reveals the main app dashboard once a user is authenticated.
Step 4: Implement Cloud Search & Logging
 * Create a search bar. When the user types, fire a query to Supabase:
   supabase.from('foods').select('*').ilike('name', '%' + searchTerm + '%').limit(10)
 * Render the returned array in a dropdown.
 * When a user taps a food, prompt for serving size, then INSERT a new row into the logs table, making sure to pass the current user's ID and the selected date.
 * Write a function to fetch all logs for the currently selected date and calculate the daily macro totals to update the UI progress bars.
Step 5: Build the BYOK AI Feature
 * Create a settings modal with an input for an API key. Save this using localStorage.setItem('ai_key', key).
 * On the diary screen, add an "AI Log" text input.
 * When text is submitted, grab the key from localStorage.
 * Write a standard fetch() request to the Gemini or OpenAI REST API endpoint.
 * Prompt the AI: "Extract the food and quantity from this text: '[USER INPUT]'. Return ONLY a JSON object with 'search_term' and 'servings_multiplier'."
 * Pass the resulting search_term directly into your Supabase search function, do the math with the servings_multiplier, and log it.
