# Hue Stasie

Hue Stasie is the Housing Hues internal unified workstation dashboard. It remains a static, Vercel-friendly application, but now supports an optional **Supabase-backed local-first persistence layer**.

## What changed

The application continues to work with browser `localStorage` when cloud configuration is absent. When Supabase is configured and a user signs in, Hue Stasie can hydrate the current workspace from the cloud and manually sync local changes back to Supabase. This preserves the existing interface and keeps the app usable when offline.

The cloud adapter currently persists projects, subtasks, calendar events, talent members, active identity settings, Instagram mode, and custom Facebook links. The existing default workspace remains available for a first-run local experience.

## Configure Supabase

1. Create a free Supabase project.
2. Open the Supabase SQL Editor and run [`supabase_schema.sql`](./supabase_schema.sql).
3. Open Project Settings → API and copy the **Project URL** and **anon public key**.
4. Put those values in [`supabase-config.js`](./supabase-config.js):

```js
window.HUESTASIE_SUPABASE = {
  url: 'https://YOUR-PROJECT.supabase.co',
  anonKey: 'YOUR-ANON-PUBLIC-KEY'
};
```

5. In Supabase Authentication → URL Configuration, add the deployed Hue Stasie URL to the allowed redirect URLs.
6. Reload the application, select **Connect cloud**, and request a magic-link sign-in.
7. After signing in, select **Sync** to migrate the current browser workspace into Supabase.

The browser may contain the Supabase anon key. Do **not** place a Supabase service-role key in this repository or in frontend code. The SQL migration enables Row Level Security and grants access only to authenticated users.

## Local-first behavior

Hue Stasie writes every change to `localStorage` immediately. If a signed-in user makes changes, the status changes to `LOCAL CHANGES`; selecting **Sync** uploads the current workspace. If the browser is offline or Supabase is not configured, the local dashboard remains usable.

The first cloud hydration occurs during page load after authentication. If cloud tables contain data, that data is loaded into the local cache. If the cloud workspace is empty, the current local/default workspace is preserved until the user explicitly selects **Sync**.

## Data model

| Table | Purpose |
|---|---|
| `identities` | Agency identities and social links |
| `projects` | Project status, priority, workload, next action, and notes |
| `subtasks` | Work items attached to projects |
| `events` | Calendar events and meeting notes |
| `talent_categories` | Talent grouping metadata |
| `talent_members` | Talent records and social links |
| `app_settings` | Small workspace settings and active identity state |

## Future extensions

The adapter is intentionally isolated in [`supabase-sync.js`](./supabase-sync.js). This makes it possible to add client records, audit reports, opportunity tracking, media references, and role-based team membership without rewriting the dashboard UI. For production collaboration, add an agency membership table and replace the broad authenticated-user policies with workspace-scoped Row Level Security policies.

## Important limitations

The current sync action is a deliberate manual migration/sync step rather than continuous realtime collaboration. It is appropriate for the initial free deployment and avoids unexpected overwrites while the data model is being finalized. A later iteration can add realtime subscriptions, record-level conflict handling, and automated JSON exports for backup.
