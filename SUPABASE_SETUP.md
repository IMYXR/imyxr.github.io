# Supabase Visitor Tracking Setup Guide

This guide will help you set up Supabase to track visitors on your website in real-time.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the details:
   - **Project Name**: Choose a name (e.g., "visitor-tracker")
   - **Database Password**: Create a strong password
   - **Region**: Choose the closest region to you
5. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 2: Create the Visitors Table

1. In your Supabase project dashboard, click on "SQL Editor" in the left sidebar
2. Click "New Query"
3. Paste the following SQL code:

```sql
-- Create visitors table
CREATE TABLE visitors (
    id BIGSERIAL PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    city TEXT,
    country TEXT,
    ip TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (for tracking)
CREATE POLICY "Allow public insert" ON visitors
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Create policy to allow anyone to read (for display)
CREATE POLICY "Allow public read" ON visitors
    FOR SELECT
    TO anon
    USING (true);

-- Create index for faster queries
CREATE INDEX idx_visitors_lat_lng ON visitors(lat, lng);
CREATE INDEX idx_visitors_timestamp ON visitors(timestamp DESC);
```

4. Click "Run" to execute the SQL
5. You should see "Success. No rows returned" message

## Step 3: Get Your Credentials

1. In the left sidebar, click on "Settings" (gear icon at bottom)
2. Click on "API" in the settings menu
3. You'll see two important values:
   - **Project URL**: Something like `https://xxxxx.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`

## Step 4: Configure Your Website

1. Open the `config.js` file in your website folder
2. Replace the placeholder values:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://xxxxx.supabase.co', // Your Project URL
    anonKey: 'eyJhbG...', // Your anon public key
    tableName: 'visitors'
};
```

3. Save the file

## Step 5: Test the Setup

1. Open your website in a browser
2. Open the browser's Developer Console (F12)
3. Refresh the page
4. Look for these console messages:
   - "Supabase initialized successfully"
   - "Visitor tracked successfully: [City], [Country]"
   - "Loaded X visitor locations"
   - "Started polling for new visitors every 30 seconds"

5. Go back to Supabase dashboard
6. Click "Table Editor" in the left sidebar
7. Click on "visitors" table
8. You should see your visit recorded!

## Features

### Automatic Visitor Tracking
- Every visitor's location is automatically detected using their IP address
- Location data (latitude, longitude, city, country) is stored in Supabase
- IP addresses are stored for tracking purposes (consider your privacy policy)

### Automatic Globe Updates
- The globe checks for new visitors every 30 seconds (polling)
- No page refresh needed!
- New visitor locations appear automatically
- **Works with free Supabase tier** (no Realtime/Replication required)

### Aggregate Display
- Multiple visits from the same location are aggregated
- Point size increases with visit count: `size = log10(visits + 1) * 0.5 + 0.3`
- Point color changes based on popularity:
  - **Blue (#3b82f6)**: More than 5 visits
  - **Light Blue (#60a5fa)**: 3-5 visits
  - **Sky Blue (#93c5fd)**: 1-2 visits

### Hover Labels
- Hover over any point to see:
  - City and Country name
  - Total number of visits from that location

## Privacy Considerations

**IMPORTANT**: This setup collects visitor IP addresses and location data. Make sure to:

1. Add a privacy policy to your website
2. Inform visitors that you're collecting location data
3. Comply with GDPR, CCPA, and other privacy regulations
4. Consider anonymizing IP addresses after collection
5. Provide an opt-out mechanism if required

To anonymize IPs, you can modify the tracking function to hash or truncate IPs:

```javascript
// Example: Hash the IP instead of storing it directly
ip: await hashIP(location.ip)  // Implement this function
```

## Troubleshooting

### Issue: "Supabase not initialized"
- Check that `config.js` has the correct URL and anon key
- Make sure the Supabase script is loaded before `script.js`
- Check browser console for specific error messages

### Issue: "Error inserting visitor data"
- Verify RLS policies are correctly set up
- Check that the table structure matches the expected schema
- Look at Supabase logs (Settings → Logs) for detailed errors

### Issue: Updates not working
- The system polls for new visitors every 30 seconds
- Check browser console for error messages
- Verify the table name in config matches your actual table
- Make sure RLS policies allow SELECT queries

### Issue: Geolocation fails
- The IP geolocation service (ipapi.co) has a rate limit
- If it fails, the code defaults to Raleigh, NC
- Consider using a paid service or your own geolocation API

## How It Works (Polling vs Realtime)

This implementation uses **polling** instead of Supabase Realtime, which means:

✅ **Advantages:**
- Works with **free Supabase tier**
- No need to enable Replication (early access feature)
- Simple and reliable
- Lower complexity

⚠️ **Trade-offs:**
- Updates every 30 seconds (not instant)
- Slightly more database queries
- Each client polls independently

### Adjusting Polling Interval

You can change how often the globe checks for new visitors by modifying the interval in `script.js`:

```javascript
// Default: 30 seconds (30000ms)
startPolling(globeInstance, 30000);

// More frequent: 15 seconds
startPolling(globeInstance, 15000);

// Less frequent: 1 minute
startPolling(globeInstance, 60000);
```

**Recommendation:** Keep it at 30-60 seconds to avoid hitting Supabase rate limits on the free tier.

## Optional Enhancements

### 1. Add Visit Count Badge
Show total visitor count somewhere on your page:

```javascript
async function getTotalVisitors() {
    const { count } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true });
    return count;
}
```

### 2. Clean Old Data
Add a function to delete visits older than 30 days:

```sql
-- Run this periodically
DELETE FROM visitors
WHERE timestamp < NOW() - INTERVAL '30 days';
```

### 3. Add Visit Analytics
Query visits by country:

```sql
SELECT country, COUNT(*) as visits
FROM visitors
GROUP BY country
ORDER BY visits DESC
LIMIT 10;
```

## Security Notes

- The `anon` key is safe to expose in client-side code
- Row Level Security (RLS) prevents unauthorized modifications
- Never expose your `service_role` key in client code
- Consider adding rate limiting to prevent abuse

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review Supabase logs in the dashboard
3. Verify all configuration steps were completed
4. Check that your database table structure is correct

Happy tracking! 🌍✨
