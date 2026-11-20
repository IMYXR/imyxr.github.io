# Visitor map: Supabase setup

The visitor globe on the home page is backed by one table in a Supabase project. This note covers creating that table, connecting the site to it, and what the site does with it.

## 1. Create a project

1. Sign in at [supabase.com](https://supabase.com) and click **New Project**.
2. Pick a name, a database password and the region closest to you.
3. Wait a couple of minutes for it to initialise.

## 2. Create the table

Open **SQL Editor → New query**, paste the contents of [`SETUP_RLS.sql`](SETUP_RLS.sql) and run it. It creates the `visitors` table, turns on Row Level Security, and adds the policies and column permissions described in section 5.

## 3. Connect the site

In the Supabase dashboard open **Settings → API** and copy the **Project URL** and the **anon public** key. Put them in `content/config.toml`:

```toml
[visitor_map]
enabled = true
show_globe = true
supabase_url = "https://xxxxx.supabase.co"
supabase_anon_key = "eyJ..."
table = "visitors"
```

- `show_globe = false` hides the globe (it sits in the left column of the home page, below the "Attending" card) while visits are still logged.
- `enabled = false` switches off both the globe and the logging.

## 4. What the site does

**Logging.** Once per page load on the live site, the visitor's browser asks [ipapi.co](https://ipapi.co) for an approximate location and stores one row: latitude, longitude, city, country, IP address, user agent and time. Not recorded:

- visits to `localhost` (local development),
- automated browsers,
- visits where the location lookup fails or is blocked. No placeholder location is stored in that case.

**Display.** The globe loads the 1,000 most recent rows (the default Supabase response limit), groups them by coordinates, and draws one bar per location. Taller, more saturated bars mean more visits; hovering a bar shows the place and its count. Only the globe itself is drawn: no frame, background or caption.

**Updates.** While the page is open the globe checks every 30 seconds for a newer row and reloads if there is one. The interval is `POLL_INTERVAL_MS` in `src/components/visitors/VisitorGlobe.tsx`.

**When the database is unreachable.** Free Supabase projects pause after a period of inactivity. The globe then shows the points it last loaded in that browser (kept in `localStorage`), or no bars at all on a first visit, and it picks up live data again once the project responds.

## 5. Who can read what

The anon key is shipped to every visitor's browser, so anything it is allowed to read is effectively public. `SETUP_RLS.sql` therefore lets it:

- **insert** rows (needed for logging), and
- **read only** `id`, `lat`, `lng`, `city`, `country` and `timestamp` (all the globe needs).

It cannot read `ip` or `user_agent`, and it cannot update or delete anything. You still see every column in the dashboard under **Table Editor**, which is where to look at the full visitor log.

If your table was created with an older version of the script, the anon key can read every column, including IP addresses. To close that, run:

```sql
REVOKE SELECT ON public.visitors FROM anon;
GRANT SELECT (id, lat, lng, city, country, "timestamp") ON public.visitors TO anon;
```

This does not affect the site, which only ever asks for those columns.

## 6. Useful queries

Run these in the SQL Editor.

Visits by country:

```sql
SELECT country, COUNT(*) AS visits
FROM visitors
GROUP BY country
ORDER BY visits DESC
LIMIT 10;
```

Most recent visitors, with the columns the site itself cannot read:

```sql
SELECT timestamp, city, country, ip, user_agent
FROM visitors
ORDER BY timestamp DESC
LIMIT 50;
```

Delete rows older than 90 days:

```sql
DELETE FROM visitors
WHERE timestamp < NOW() - INTERVAL '90 days';
```

## 7. Privacy

This setup stores visitor IP addresses and approximate locations. Depending on where your visitors are, that can bring obligations under laws such as GDPR or CCPA (for example a privacy notice). If you do not need IP addresses, the simplest option is not to store them: remove `ip` from the row built in `recordVisit` in `src/lib/visitors.ts`.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Globe appears but has no bars | The project is paused (open the dashboard to resume it), or the URL / key in `config.toml` is wrong |
| No globe at all | `show_globe` or `enabled` is `false`, or the browser has WebGL turned off |
| Globe works but new visits never appear | The insert policy is missing; re-run `SETUP_RLS.sql`. Also check you are testing on the live site, not `localhost` |
| Requests fail with "permission denied for table visitors" | The anon role lacks column permissions; run the two statements in section 5 |
| Your own visit is not recorded | An ad blocker is blocking the ipapi.co lookup, or ipapi.co is rate-limiting your IP |
