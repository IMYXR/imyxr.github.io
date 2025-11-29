// GitHub Activity Visualization
// This creates a GitHub-style contribution graph with dynamic animations

// ============================================
// CONFIGURATION - Update with your GitHub username
// ============================================
const GITHUB_USERNAME = 'IMYXR'; // Replace with your actual GitHub username
const USE_REAL_DATA = true; // Set to false to use sample data (GitHub API has limitations)

// GitHub API Configuration
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = ''; // Optional: Add your personal access token for higher rate limits

async function generateContributionGraph() {
    const graphContainer = document.getElementById('contribution-graph');
    if (!graphContainer) return;

    // Generate data for all-time activity (show last 2 years for better visibility)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 2); // Show 2 years of data

    let contributionData;

    // Fetch real data from GitHub or use sample data
    if (USE_REAL_DATA && GITHUB_USERNAME !== 'YOUR_GITHUB_USERNAME') {
        try {
            console.log('Fetching GitHub contributions for:', GITHUB_USERNAME);
            contributionData = await fetchGitHubContributions(GITHUB_USERNAME);
            console.log('Fetched contribution data:', contributionData);

            // Check if we got any real data
            const totalContributions = Object.values(contributionData).reduce((sum, val) => sum + val, 0);
            if (totalContributions === 0) {
                console.warn('No contribution data found from API, using sample data');
                contributionData = generateSampleContributions(startDate, today);
            }
        } catch (error) {
            console.error('Error fetching GitHub data:', error);
            console.log('Falling back to sample data');
            contributionData = generateSampleContributions(startDate, today);
        }
    } else {
        // Generate sample contribution data
        console.log('Using sample contribution data');
        contributionData = generateSampleContributions(startDate, today);
    }

    // Create grid of contribution squares
    let currentDate = new Date(startDate);
    let dayIndex = 0;

    while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const contributions = contributionData[dateStr] || 0;
        const level = getContributionLevel(contributions);

        const dayElement = document.createElement('div');
        dayElement.className = 'contribution-day';
        dayElement.setAttribute('data-level', level);
        dayElement.setAttribute('data-date', dateStr);
        dayElement.setAttribute('data-contributions', contributions);
        dayElement.title = `${dateStr}: ${contributions} contributions`;

        // Add animation delay
        dayElement.style.animationDelay = `${dayIndex * 2}ms`;
        dayElement.style.animation = 'fadeIn 0.3s ease-out forwards';

        // Add hover effect to show tooltip
        dayElement.addEventListener('mouseenter', showContributionTooltip);
        dayElement.addEventListener('mouseleave', hideContributionTooltip);

        graphContainer.appendChild(dayElement);

        currentDate.setDate(currentDate.getDate() + 1);
        dayIndex++;
    }

    // Generate month labels
    generateMonthLabels(startDate, today);

    // Animate statistics
    animateStats(contributionData);
}

// ============================================
// Fetch Real GitHub Data
// ============================================
async function fetchGitHubContributions(username) {
    const headers = {
        'Accept': 'application/vnd.github.v3+json'
    };

    if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    // Fetch multiple pages of user events to get more history
    const allEvents = [];
    const maxPages = 10; // Fetch up to 10 pages (300 events max)

    for (let page = 1; page <= maxPages; page++) {
        const eventsUrl = `${GITHUB_API_BASE}/users/${username}/events?per_page=100&page=${page}`;
        console.log(`Fetching page ${page} from:`, eventsUrl);

        const response = await fetch(eventsUrl, { headers });

        if (!response.ok) {
            console.error(`GitHub API error on page ${page}: ${response.status} ${response.statusText}`);
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const events = await response.json();
        console.log(`Page ${page}: Received ${events.length} events`);

        if (events.length === 0) break; // No more events

        allEvents.push(...events);
    }

    console.log(`Total events fetched: ${allEvents.length}`);

    // Process events into contribution counts by date
    const contributions = {};
    const today = new Date();
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 2); // 2 years of data

    // Initialize all dates with 0 contributions
    let current = new Date(startDate);
    while (current <= today) {
        const dateStr = current.toISOString().split('T')[0];
        contributions[dateStr] = 0;
        current.setDate(current.getDate() + 1);
    }

    // Count contributions from events
    allEvents.forEach(event => {
        const eventDate = new Date(event.created_at);
        const dateStr = eventDate.toISOString().split('T')[0];

        if (contributions.hasOwnProperty(dateStr)) {
            // Count different types of events
            if (event.type === 'PushEvent') {
                contributions[dateStr] += event.payload.commits?.length || 1;
            } else if (['PullRequestEvent', 'IssuesEvent', 'IssueCommentEvent'].includes(event.type)) {
                contributions[dateStr] += 1;
            }
        }
    });

    return contributions;
}

// Fetch repository statistics
async function fetchGitHubStats(username) {
    const headers = {
        'Accept': 'application/vnd.github.v3+json'
    };

    if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    try {
        // Fetch user repositories
        const reposUrl = `${GITHUB_API_BASE}/users/${username}/repos?per_page=100`;
        const response = await fetch(reposUrl, { headers });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const repos = await response.json();

        return {
            totalRepos: repos.length,
            publicRepos: repos.filter(r => !r.private).length,
            stars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
            forks: repos.reduce((sum, repo) => sum + repo.forks_count, 0)
        };
    } catch (error) {
        console.error('Error fetching GitHub stats:', error);
        return null;
    }
}

function generateSampleContributions(startDate, endDate) {
    const contributions = {};
    const current = new Date(startDate);

    while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0];
        // Random contribution count (more realistic distribution)
        const random = Math.random();
        if (random < 0.3) {
            contributions[dateStr] = 0; // No contributions
        } else if (random < 0.6) {
            contributions[dateStr] = Math.floor(Math.random() * 5) + 1; // 1-5 contributions
        } else if (random < 0.85) {
            contributions[dateStr] = Math.floor(Math.random() * 10) + 5; // 5-15 contributions
        } else {
            contributions[dateStr] = Math.floor(Math.random() * 20) + 10; // 10-30 contributions
        }
        current.setDate(current.getDate() + 1);
    }

    return contributions;
}

function getContributionLevel(count) {
    if (count === 0) return 0;
    if (count < 5) return 1;
    if (count < 10) return 2;
    if (count < 15) return 3;
    return 4;
}

function generateMonthLabels(startDate, endDate) {
    const monthsContainer = document.getElementById('months-labels');
    if (!monthsContainer) return;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const current = new Date(startDate);
    let lastMonth = -1;

    while (current <= endDate) {
        const month = current.getMonth();
        if (month !== lastMonth) {
            const monthLabel = document.createElement('span');
            monthLabel.textContent = months[month];
            monthLabel.style.flex = '1';
            monthsContainer.appendChild(monthLabel);
            lastMonth = month;
        }
        current.setMonth(current.getMonth() + 1);
    }
}

async function animateStats(contributionData) {
    const totalCommits = Object.values(contributionData).reduce((sum, count) => sum + count, 0);

    // Calculate streak
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    const sortedDates = Object.keys(contributionData).sort().reverse();

    for (const date of sortedDates) {
        if (contributionData[date] > 0) {
            tempStreak++;
            maxStreak = Math.max(maxStreak, tempStreak);
            if (new Date(date).toDateString() === today.toDateString() || currentStreak > 0) {
                currentStreak = tempStreak;
            }
        } else {
            if (currentStreak === 0) break;
            tempStreak = 0;
        }
    }

    // Fetch real repository count if using real data
    let repoCount = Math.floor(Math.random() * 20) + 10;

    if (USE_REAL_DATA && GITHUB_USERNAME !== 'YOUR_GITHUB_USERNAME') {
        try {
            const stats = await fetchGitHubStats(GITHUB_USERNAME);
            if (stats) {
                repoCount = stats.totalRepos;
            }
        } catch (error) {
            console.error('Error fetching repo stats:', error);
        }
    }

    // Animate numbers counting up
    animateValue('total-commits', 0, totalCommits, 2000);
    animateValue('current-streak', 0, currentStreak || maxStreak, 1500);
    animateValue('repositories', 0, repoCount, 1800);
}

function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;

    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            element.textContent = Math.round(end);
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

function showContributionTooltip(event) {
    const day = event.target;
    const contributions = day.getAttribute('data-contributions');
    const date = day.getAttribute('data-date');

    // You can add a custom tooltip here if needed
    day.style.transform = 'scale(1.3)';
}

function hideContributionTooltip(event) {
    const day = event.target;
    day.style.transform = 'scale(1)';
}

// Add fadeIn animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: scale(0);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure the page is fully loaded
    setTimeout(generateContributionGraph, 500);
});
