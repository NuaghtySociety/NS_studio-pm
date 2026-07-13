# Naughty Society Studio PM

A sleek, editorial-style project management board for creative teams.

## 🚀 Getting Started (Instant Local Run)

We have added a robust **Offline Mock Mode** to the application so you can run it instantly without setting up any database or server!

1. Open `index.html` in your browser (either by double-clicking the file locally or running a local server like `python -m http.server`).
2. Type in any email (e.g., `you@studio.com`) and any password.
3. Click **Sign In**.
4. The board will load immediately with fully interactive features, task creation, project views, and persistent state across page reloads via `localStorage`!

---

## 🔗 Connecting Real Supabase (Live Sync)

If you want to use a real Supabase database so your entire team can collaborate live on the same board, follow these steps:

1. Create a Supabase project and get your **Project URL** and **Anon Key**.
2. Create a table named `tasks` in your public schema with the following columns:
   - `id` (text, primary key)
   - `project_id` (text)
   - `phase` (int8)
   - `title` (text)
   - `assignee` (text)
   - `due_date` (text)
   - `status` (text)
   - `training_status` (text)
   - `fields` (jsonb)
3. Set your credentials by running this simple helper function in your browser's Developer Tools Console (`F12`):
   ```javascript
   setSupabaseConfig('YOUR_SUPABASE_PROJECT_URL', 'YOUR_SUPABASE_ANON_KEY');
   ```
4. The page will reload and automatically connect to your live Supabase database!
5. To switch back to Local Mock Mode at any time, run:
   ```javascript
   setSupabaseConfig(null, null);
   ```

---

## 🛠️ What We Fixed

1. **Missing `supabase-client.js`:** The repository originally only had `index.html` and was missing the actual Supabase client module. We created a highly robust `supabase-client.js` that implements a dual-mode strategy:
   - **Offline Mode:** Uses a mock client with full database, auth, and realtime event simulation stored inside the browser's `localStorage` so the app is always fully functional out of the box.
   - **Online Mode:** Automatically imports and connects to the official `@supabase/supabase-js` library from CDN if your credentials are set.
2. **Dynamic Import in Blob Context:** The bundler un-packages the code inside a **blob URL**. Relative imports like `import('./supabase-client.js')` inside blob URLs resolve relative to `blob:http://...` which breaks and crashes. We patched `index.html` to dynamically resolve `supabase-client.js` absolute path relative to the active `window.location.href`.
