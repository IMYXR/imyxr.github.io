# GitHub API Integration Guide

This guide will help you integrate your real GitHub activity data into your portfolio website.

## Quick Setup (No API Token Required)

### Step 1: Update Your GitHub Username

Open `github-activity.js` and update line 7:

```javascript
const GITHUB_USERNAME = 'YOUR_GITHUB_USERNAME'; // Replace with your actual GitHub username
```

**Example:**
```javascript
const GITHUB_USERNAME = 'imyxr'; // Replace with your actual username
```

### Step 2: Enable Real Data

On line 8, change `USE_REAL_DATA` to `true`:

```javascript
const USE_REAL_DATA = true; // Set to true to use real GitHub API data
```

### Step 3: Test Your Website

Open `about.html` in your browser and you should see your real GitHub contribution data!

---

## Advanced Setup (With API Token for Higher Rate Limits)

GitHub's public API has rate limits (60 requests per hour). If you want higher limits (5,000 requests per hour), you can add a Personal Access Token.

### Step 1: Create a GitHub Personal Access Token

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens > Tokens (classic)](https://github.com/settings/tokens)
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give your token a name (e.g., "Portfolio Website")
4. Select scopes:
   - ✅ `public_repo` (only if you want to show private repo stats)
   - ✅ `read:user` (to read user data)
5. Click **"Generate token"**
6. **Copy the token** (you won't be able to see it again!)

### Step 2: Add Token to Your Code

Open `github-activity.js` and update line 12:

```javascript
const GITHUB_TOKEN = 'ghp_your_token_here'; // Add your personal access token
```

**⚠️ IMPORTANT SECURITY NOTE:**
- **Never commit your token to a public repository!**
- Add `github-activity.js` to your `.gitignore` if you're using git
- Consider using environment variables or a config file that's not tracked

---

## How It Works

### Data Fetched from GitHub API:

1. **Contribution Graph:**
   - Fetches your recent events (commits, pull requests, issues)
   - Displays last 365 days of activity
   - Color-codes by contribution level

2. **Statistics:**
   - **Total Commits**: Sum of all commits in the past year
   - **Day Streak**: Current consecutive days with contributions
   - **Repositories**: Total number of your repositories

### API Endpoints Used:

```javascript
// User events (commits, PRs, issues)
GET https://api.github.com/users/{username}/events

// Repository statistics
GET https://api.github.com/users/{username}/repos
```

---

## Customization

### Change Contribution Levels

Edit the `getContributionLevel()` function in `github-activity.js`:

```javascript
function getContributionLevel(count) {
    if (count === 0) return 0;      // No contributions
    if (count < 5) return 1;        // 1-4 contributions (light)
    if (count < 10) return 2;       // 5-9 contributions (medium)
    if (count < 15) return 3;       // 10-14 contributions (dark)
    return 4;                        // 15+ contributions (darkest)
}
```

### Change Colors

Edit the CSS in `styles.css` (lines 1411-1449 and 1477-1515):

```css
.contribution-day[data-level="4"] {
    background: rgba(59, 130, 246, 0.9); /* Change this color */
}
```

---

## Troubleshooting

### Issue: "Rate limit exceeded"
**Solution:** Add a GitHub Personal Access Token (see Advanced Setup above)

### Issue: Graph shows all zeros
**Solutions:**
1. Check that `GITHUB_USERNAME` is correct
2. Make sure `USE_REAL_DATA = true`
3. Check browser console for errors (F12 → Console)
4. Verify your GitHub account has public activity

### Issue: CORS error
**Solution:** GitHub API supports CORS, but if you're testing locally:
- Use a local server (e.g., `python -m http.server`)
- Or use a browser extension like "CORS Unblock"

### Issue: Empty contribution graph
**Note:** GitHub API only shows the last 90 days of events. For a full year, you'd need to use the GitHub GraphQL API (more complex setup).

---

## Alternative: Using GitHub GraphQL API (Advanced)

For more complete data including a full year of contributions, consider using GitHub's GraphQL API:

```javascript
// Example GraphQL query
const query = `
  query($userName: String!) {
    user(login: $userName) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;
```

This requires more setup but provides accurate contribution counts for the entire year.

---

## Privacy Considerations

- The GitHub API only exposes **public** activity
- Private repository contributions won't be shown (unless you use a token with private repo access)
- You can control what's public in your [GitHub Privacy Settings](https://github.com/settings/profile)

---

## Need Help?

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub GraphQL API Documentation](https://docs.github.com/en/graphql)
- [GitHub Rate Limits](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
