# Housing Hues — Unified Workstation

Internal dashboard: project tracker, workload chart, calendar, and social feed links (Facebook/Instagram).

## Hosting

This static dashboard is deployed to **GitHub Pages** from the `main` branch. Every push to `main` triggers the workflow in [`.github/workflows/pages.yml`](.github/workflows/pages.yml). The site uses no build step; GitHub Pages serves the repository contents directly.

The expected public URL is:

```text
https://housinhues.github.io/Hue-Stassie/
```

The dashboard stores its current workspace in browser `localStorage`, so data is local to each browser until the optional Supabase foundation is configured.

## Local preview

```bash
python3 -m http.server 4173
```

Then open <http://127.0.0.1:4173/>.

## Optional cloud persistence

The `supabase-foundation` branch contains an optional Supabase-backed local-first persistence layer. It should only be enabled after the Supabase project is active, the SQL schema has been applied, and the public URL and anon key have been configured. Never place a Supabase service-role key in frontend code.

The current static experience remains usable without Supabase.
