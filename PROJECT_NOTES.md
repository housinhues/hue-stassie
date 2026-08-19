# Hue Stasie — Project Notes

> Keep this short. Update it when a decision, setup detail, or next step changes.

## Current direction

| Area | Decision |
|---|---|
| App | Housing Hues / Hue Stasie |
| Database + users + storage | Supabase |
| Hosting + CDN + domain + edge protection | Cloudflare |
| Source of truth | Supabase (do not duplicate core data in Cloudflare) |

## Setup status

- The Supabase connection works.
- The current Supabase project is inactive, so tables/data could not be checked yet.
- Cloudflare Workers & Pages account is open and ready to create an app.
- Current repo is a private, browser-local dashboard. Backend can be added when ready.

## Simple setup

```text
User → Cloudflare Pages → Hue Stasie app → Supabase
                                      ├─ Auth
                                      ├─ Database + RLS
                                      ├─ Storage
                                      └─ Realtime

Cloudflare Workers: optional rate limits, webhooks, caching, and small secure edge tasks.
```

## Rules

- Keep Supabase service-role keys out of the browser.
- Use Supabase Row Level Security before real user data goes live.
- Use Cloudflare around Supabase, not as a second main database.

## Next

- [ ] Reactivate Supabase project.
- [ ] Check current tables and data model.
- [ ] Create the Cloudflare app from Workers & Pages.
- [ ] Decide the first real feature to move off browser localStorage.

## Useful links

- [Supabase project dashboard](https://supabase.com/dashboard)
- [Cloudflare Workers & Pages](https://dash.cloudflare.com/)
- [Supabase features](https://supabase.com/docs/guides/getting-started/features)
