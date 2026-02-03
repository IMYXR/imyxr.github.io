// Optimized script for better performance

// Supabase client instance (use different name to avoid conflict with CDN global)
let supabaseClient = null;
let globeInstance = null;

// Initialize Supabase
function initSupabase() {
    // Check if Supabase library is loaded globally
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
        console.warn('Supabase library not loaded');
        return false;
    }

    if (!SUPABASE_CONFIG) {
        console.warn('Supabase config not loaded');
        return false;
    }

    try {
        // Create Supabase client using the global library
        supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('Supabase initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        return false;
    }
}

// Get visitor's geolocation using IP-based service
async function getVisitorLocation() {
    try {
        // Using ipapi.co for geolocation (free, no API key needed)
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        return {
            lat: data.latitude,
            lng: data.longitude,
            city: data.city,
            country: data.country_name,
            ip: data.ip
        };
    } catch (error) {
        console.error('Error getting visitor location:', error);
        // Return default location (Raleigh, NC) if geolocation fails
        return {
            lat: 35.7796,
            lng: -78.6382,
            city: 'Unknown',
            country: 'Unknown',
            ip: 'Unknown'
        };
    }
}

// Track visitor in Supabase
async function trackVisitor() {
    if (!supabaseClient) {
        console.warn('Supabase not initialized, skipping visitor tracking');
        return;
    }

    try {
        const location = await getVisitorLocation();

        const visitorData = {
            lat: location.lat,
            lng: location.lng,
            city: location.city,
            country: location.country,
            ip: location.ip,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };

        const { error } = await supabaseClient
            .from(SUPABASE_CONFIG.tableName)
            .insert([visitorData]);

        if (error) {
            console.error('Error inserting visitor data:', error);
        } else {
            console.log('Visitor tracked successfully:', location.city, location.country);
        }
    } catch (error) {
        console.error('Error tracking visitor:', error);
    }
}

// Default/fallback visitor data (shown when no cached data available)
const DEFAULT_VISITOR_DATA = [
    { lat: 35.7796, lng: -78.6382, city: 'Raleigh', country: 'USA', size: 1, color: '#3b82f6', visits: 5 },
    { lat: 40.7128, lng: -74.0060, city: 'New York', country: 'USA', size: 0.8, color: '#3b82f6', visits: 3 },
    { lat: 51.5074, lng: -0.1278, city: 'London', country: 'UK', size: 0.6, color: '#60a5fa', visits: 2 },
    { lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'Japan', size: 1, color: '#3b82f6', visits: 4 },
    { lat: 31.2304, lng: 121.4737, city: 'Shanghai', country: 'China', size: 0.7, color: '#60a5fa', visits: 3 },
];

// Track database connection status
let databaseConnected = false;
let retryInterval = null;

// Cache key for localStorage
const VISITOR_CACHE_KEY = 'visitorMapCache';

// Get cached visitor data from localStorage
function getCachedVisitorData() {
    try {
        const cached = localStorage.getItem(VISITOR_CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            console.log('Using cached visitor data from last successful load');
            return data;
        }
    } catch (e) {
        console.warn('Error reading cache:', e);
    }
    return null;
}

// Save visitor data to localStorage cache
function cacheVisitorData(data) {
    try {
        localStorage.setItem(VISITOR_CACHE_KEY, JSON.stringify(data));
        console.log('Visitor data cached successfully');
    } catch (e) {
        console.warn('Error caching visitor data:', e);
    }
}

// Get fallback data (cached first, then default)
function getFallbackData() {
    const cached = getCachedVisitorData();
    return cached || DEFAULT_VISITOR_DATA;
}

// Load visitor data from Supabase
async function loadVisitorData() {
    if (!supabaseClient) {
        console.warn('Supabase not initialized, using fallback data');
        databaseConnected = false;
        return getFallbackData();
    }

    try {
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tableName)
            .select('lat, lng, city, country')
            .limit(1000);

        if (error) {
            console.warn('Database may be paused, using fallback data:', error.message);
            databaseConnected = false;
            return getFallbackData();
        }

        // If we got here, database is connected
        if (!databaseConnected) {
            console.log('Database connection restored!');
            databaseConnected = true;
        }

        // If no data yet, return fallback data
        if (!data || data.length === 0) {
            console.log('No visitor data in database, using fallback data');
            return getFallbackData();
        }

        // Aggregate data by location
        const locationMap = new Map();

        data.forEach(visitor => {
            const key = `${visitor.lat},${visitor.lng}`;
            if (locationMap.has(key)) {
                locationMap.get(key).visits++;
            } else {
                locationMap.set(key, {
                    lat: visitor.lat,
                    lng: visitor.lng,
                    city: visitor.city,
                    country: visitor.country,
                    visits: 1
                });
            }
        });

        // Convert to array and calculate size and color based on visits
        const visitorData = Array.from(locationMap.values()).map(loc => ({
            lat: loc.lat,
            lng: loc.lng,
            city: loc.city,
            country: loc.country,
            visits: loc.visits,
            size: Math.log10(loc.visits + 1) * 0.5 + 0.3,
            color: loc.visits > 5 ? '#3b82f6' : loc.visits > 2 ? '#60a5fa' : '#93c5fd'
        }));

        // Cache the successful data for future use
        cacheVisitorData(visitorData);

        console.log(`Loaded ${visitorData.length} visitor locations from database`);
        return visitorData;
    } catch (error) {
        console.warn('Error loading visitor data, using fallback data:', error.message);
        databaseConnected = false;
        return getFallbackData();
    }
}

// Polling-based updates (works with free Supabase tier)
let lastCheckTime = new Date();
let pollingInterval = null;

async function checkForNewVisitors(globe) {
    if (!supabaseClient) {
        return;
    }

    try {
        // Try to check for visitors - this also serves as a database health check
        const { data, error } = await supabaseClient
            .from(SUPABASE_CONFIG.tableName)
            .select('id, timestamp')
            .order('timestamp', { ascending: false })
            .limit(10);

        if (error) {
            // Database might be paused
            if (databaseConnected) {
                console.warn('Database connection lost, will retry...');
                databaseConnected = false;
            }
            return;
        }

        // Database is connected - check if we just reconnected
        const wasDisconnected = !databaseConnected;
        databaseConnected = true;

        if (wasDisconnected) {
            // Just reconnected! Reload all data
            console.log('Database reconnected! Refreshing visitor data...');
            const visitorData = await loadVisitorData();
            globe.pointsData(visitorData);

            // Also try to track current visitor now
            trackVisitor();
            return;
        }

        // Check for new visitors since last check
        if (data && data.length > 0) {
            const latestTimestamp = new Date(data[0].timestamp);
            if (latestTimestamp > lastCheckTime) {
                const newVisitors = data.filter(v => new Date(v.timestamp) > lastCheckTime);
                if (newVisitors.length > 0) {
                    console.log(`${newVisitors.length} new visitor(s) detected, updating globe...`);
                    lastCheckTime = latestTimestamp;

                    // Reload all data and update globe
                    const visitorData = await loadVisitorData();
                    globe.pointsData(visitorData);
                }
            }
        }
    } catch (error) {
        if (databaseConnected) {
            console.warn('Database check failed:', error.message);
            databaseConnected = false;
        }
    }
}

function startPolling(globe, intervalMs = 30000) {
    // Clear any existing interval
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }

    // Start polling - this will also check for database recovery
    pollingInterval = setInterval(() => {
        checkForNewVisitors(globe);
    }, intervalMs);

    console.log(`Started polling every ${intervalMs/1000} seconds (also checks for database recovery)`);
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log('Stopped polling');
    }
}

// Globe initialization retry counter
let globeRetryCount = 0;
const MAX_GLOBE_RETRIES = 10;

// 3D Globe Initialization
async function initGlobe() {
    const container = document.getElementById('globe-container');

    if (!container) {
        console.warn('Globe container not found');
        return;
    }

    // Check if Globe library is loaded
    if (typeof Globe === 'undefined') {
        globeRetryCount++;
        if (globeRetryCount <= MAX_GLOBE_RETRIES) {
            console.warn(`Globe.gl library not loaded yet. Retry ${globeRetryCount}/${MAX_GLOBE_RETRIES}...`);
            setTimeout(initGlobe, 500);
        } else {
            console.error('Globe.gl library failed to load. The globe requires an internet connection.');
            // Show a message in the container
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">Globe requires internet connection</div>';
        }
        return;
    }

    console.log('Initializing globe...');

    try {
        // Check if Supabase config is available
        const supabaseConfigured = typeof SUPABASE_CONFIG !== 'undefined' &&
                                    SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL';

        if (supabaseConfigured) {
            // Try to initialize Supabase (may fail if database is paused)
            const initialized = initSupabase();
            if (initialized && supabaseClient) {
                // Try to track visitor (won't block globe initialization if it fails)
                trackVisitor().catch(err => {
                    console.warn('Could not track visitor (database may be paused):', err.message);
                });
            }
        }

        // Load visitor data (will use default data if database is unavailable)
        const visitorData = await loadVisitorData();

        // Get container width with fallback
        let containerWidth = container.offsetWidth;
        if (containerWidth <= 0) {
            // Fallback width if container hasn't rendered yet
            containerWidth = container.clientWidth || container.getBoundingClientRect().width || 280;
            console.log('Using fallback width:', containerWidth);
        }

        // If still no width, wait and retry
        if (containerWidth <= 0) {
            console.log('Container has no width yet, retrying in 500ms...');
            setTimeout(initGlobe, 500);
            return;
        }

        // Create the globe - this always works regardless of database status
        globeInstance = Globe()
            (container)
            .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
            .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
            .pointsData(visitorData)
            .pointAltitude('size')
            .pointColor('color')
            .pointRadius(0.6)
            .pointsMerge(true)
            .atmosphereColor('#3b82f6')
            .atmosphereAltitude(0.15)
            .width(containerWidth)
            .height(280)
            .pointLabel(d => `
                <div style="background: rgba(0,0,0,0.8); padding: 8px; border-radius: 4px; color: white;">
                    <strong>${d.city || 'Unknown'}, ${d.country || 'Unknown'}</strong><br/>
                    Visits: ${d.visits || 1}
                </div>
            `);

        // Auto-rotate
        globeInstance.controls().autoRotate = true;
        globeInstance.controls().autoRotateSpeed = 0.5;
        globeInstance.controls().enableZoom = false;

        // Set initial view point (centered on North Carolina)
        globeInstance.pointOfView({ lat: 38, lng: -83, altitude: 2.5 }, 0);

        console.log('Globe initialized successfully!');
        if (!databaseConnected) {
            console.log('Using default visitor data (database may be paused). Will auto-update when database recovers.');
        }

        // Always start polling if Supabase is configured
        // This allows automatic recovery when database comes back online
        if (supabaseConfigured) {
            startPolling(globeInstance, 30000);
        }

        // Handle window resize
        const resizeGlobe = () => {
            if (container.offsetWidth > 0) {
                globeInstance.width(container.offsetWidth);
            }
        };

        window.addEventListener('resize', resizeGlobe);

        // Clean up polling when page is about to unload
        window.addEventListener('beforeunload', () => {
            stopPolling();
        });
    } catch (error) {
        console.error('Error initializing globe:', error);
        // Even if there's an error, try to show a basic globe with default data
        try {
            const fallbackWidth = container.offsetWidth || container.clientWidth || 280;
            globeInstance = Globe()
                (container)
                .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
                .pointsData(DEFAULT_VISITOR_DATA)
                .pointAltitude('size')
                .pointColor('color')
                .pointRadius(0.6)
                .atmosphereColor('#3b82f6')
                .atmosphereAltitude(0.15)
                .width(fallbackWidth)
                .height(280);
            globeInstance.controls().autoRotate = true;
            globeInstance.controls().autoRotateSpeed = 0.5;
            console.log('Globe initialized with fallback data');
        } catch (fallbackError) {
            console.error('Could not initialize globe:', fallbackError);
        }
    }
}

// Theme Management
function initTheme() {
    // Check for saved theme preference or default to 'light'
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update button text and icon
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('.theme-toggle-icon');
        const text = toggleBtn.querySelector('.theme-toggle-text');

        if (newTheme === 'dark') {
            icon.textContent = '☀️';
            text.textContent = 'Light Mode';
        } else {
            icon.textContent = '🌙';
            text.textContent = 'Dark Mode';
        }
    }
}

// Initialize theme before page loads
initTheme();

// Load sidebar content dynamically (only if not already present in HTML)
function loadSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
        console.error('Sidebar element not found');
        return;
    }

    // Check if sidebar already has content (inline HTML)
    if (sidebar.children.length > 0) {
        console.log('Sidebar content already present in HTML');
        return;
    }

    // Load sidebar from template (defined in sidebar-template.js)
    if (typeof sidebarTemplate !== 'undefined') {
        sidebar.innerHTML = sidebarTemplate;
        console.log('Sidebar content loaded from template');

        // Set active navigation button based on current page
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        const navButtons = sidebar.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            const pageName = btn.getAttribute('data-page');
            if (pageName === currentPage) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    } else {
        console.error('Sidebar template not loaded. Make sure sidebar-template.js is included.');
    }
}

// Optimized page load animation - runs once only
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');

    // Load sidebar first
    try {
        loadSidebar();
    } catch (error) {
        console.error('Error loading sidebar:', error);
    }

    // Initialize 3D globe after page is fully loaded
    // Use window.onload to ensure all resources (including CSS) are loaded
    if (document.readyState === 'complete') {
        console.log('Page already loaded, initializing globe...');
        setTimeout(initGlobe, 100);
    } else {
        window.addEventListener('load', () => {
            console.log('Window load event, initializing globe...');
            setTimeout(initGlobe, 100);
        });
    }

    // Set up theme toggle button
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        // Set initial button state based on current theme
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const icon = themeToggleBtn.querySelector('.theme-toggle-icon');
        const text = themeToggleBtn.querySelector('.theme-toggle-text');

        if (currentTheme === 'dark') {
            icon.textContent = '☀️';
            text.textContent = 'Light Mode';
        }

        // Add click event listener
        themeToggleBtn.addEventListener('click', toggleTheme);
        console.log('Theme toggle button initialized');
    } else {
        console.error('Theme toggle button not found');
    }

    // Smooth scroll behavior for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    const cards = document.querySelectorAll('.glass-card');

    // Use CSS classes instead of inline styles for better performance
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.4s ease ${index * 0.05}s, transform 0.4s ease ${index * 0.05}s`;
    });

    // Trigger animation
    requestAnimationFrame(() => {
        cards.forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    });
});

// Throttled parallax effect for better performance
let mouseX = 0;
let mouseY = 0;
let ticking = false;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;

    if (!ticking) {
        requestAnimationFrame(updateOrbPositions);
        ticking = true;
    }
});

function updateOrbPositions() {
    const orbs = document.querySelectorAll('.gradient-orb');

    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 0.015;
        const x = mouseX * 30 * speed;
        const y = mouseY * 30 * speed;
        orb.style.transform = `translate(${x}px, ${y}px)`;
    });

    ticking = false;
}
