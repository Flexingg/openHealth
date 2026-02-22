Frontend Implementation Specification: PWAte
1. Architecture & Tech Stack
 * Framework: Vanilla JavaScript (ES6+), HTML5, and CSS3.
 * Styling: Tailwind CSS (via Vite plugin for rapid UI generation and utility-class styling).
 * Build Tool: Vite.
 * PWA Plugin: vite-plugin-pwa (Configured for "standalone" display, generating manifest.json, and caching static assets. Offline database syncing is out of scope for MVP).
 * Backend Client: @supabase/supabase-js (v2).
 * Hosting: GitHub Pages or Vercel (Free Tier).
 * Routing: Client-side Single Page Application (SPA) routing using the History API.
2. Local Storage & Security (IndexedDB)
All sensitive AI configuration must remain strictly on the device. Create a utility class (StorageManager.js) using the browser's native IndexedDB (or a lightweight wrapper like idb-keyval) to store:
 * ai_provider (String: 'openai', 'anthropic', or 'gemini')
 * ai_api_key (String)
 * ai_model_name (String)
 * Security Rule: These values must never be transmitted to the Supabase Postgres database. They are only sent in the HTTP payload directly to the Supabase Edge Functions.
3. Authentication Shell
Create an auth wrapper that listens to supabase.auth.onAuthStateChange.
 * Logged Out State: Show a clean login/signup screen requiring only Email and Password.
 * Logged In State: Mount the main application layout (Top navigation bar with current date selector, bottom tab navigation for mobile).
 * Note: Email confirmation is disabled on the backend. Login should be immediate upon account creation.
4. Core UI Screens (The Views)
View A: The Daily Dashboard
 * Date Context: A sticky date picker at the top. Changing the date updates the state for the entire app.
 * Macro Progress: Fetch the user's goals from user_goals and today's totals from the daily_summary View. Render 4 progress bars (Calories, Protein, Carbs, Fat).
 * Meal Timelines: Fetch data from the meal_time_summary View. Render collapsible sections for Breakfast, Lunch, Dinner, and Snacks showing the macro breakdown for each meal.
 * Action: A floating action button (FAB) or prominent "Add Food" button.
View B: The Logging Hub
A multi-tab interface for adding food to the selected date and meal time.
 * Tab 1: Cloud Search. A text input that fires a .ilike() query against the Supabase foods table. Tapping a result opens a modal to input servings, which then runs an INSERT into the logs table.
 * Tab 2: AI Text Log. A text area for natural language input (e.g., "I ate 3 eggs and a piece of toast"). Submit button triggers a fetch request to the log-food Edge Function, passing the text, date, meal time, and the IndexedDB API credentials.
 * Tab 3: AI Vision Scanner. Opens the native camera via <input type="file" accept="image/*" capture="environment">. Draw the image to a hidden HTML5 <canvas> to compress it to max 800px width. Convert to Base64 and send to the scan-nutrition-label Edge Function. Render the returned JSON in a "Verify Food" form before inserting it into the foods table.
View C: Meals & Recipes Lab
 * List View: Toggle between saved Meals (groupings) and Recipes (custom foods).
 * Create Screen: A UI to search the global foods table and add ingredients to a temporary list.
 * Save Meal: Executes inserts into meals and meal_items.
 * Save Recipe: Calculates total macros from the ingredient list, divides by user-defined "total servings", creates a new item in the foods table, and links the ingredients in recipes and recipe_ingredients.
 * Explode Feature: When viewing a saved recipe, include a button to call the Supabase RPC log_exploded_recipe to break it down into individual logs for the day.
View D: User Settings
 * Goals: Form to update daily macro targets (updates the user_goals table).
 * AI Configuration: Secure inputs to update the provider dropdown, paste the API key, and specify the model name. Saves directly to IndexedDB.
 * Profile: Read-only email address display and a "Log Out" button.
5. Deployment Configuration
 * Ensure a vercel.json or equivalent configuration file is created to rewrite all traffic to index.html so the client-side SPA routing does not return 404 errors on page refresh.
