// Optimized script for better performance

// Supabase client instance
let supabase = null;
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
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
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
    if (!supabase) {
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

        const { error } = await supabase
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

// Load visitor data from Supabase
async function loadVisitorData() {
    if (!supabase) {
        console.warn('Supabase not initialized, using sample data');
        // Return sample data as fallback
        return [
            { lat: 35.7796, lng: -78.6382, size: 1, color: '#3b82f6', visits: 5 },
            { lat: 40.7128, lng: -74.0060, size: 0.8, color: '#3b82f6', visits: 3 },
            { lat: 51.5074, lng: -0.1278, size: 0.6, color: '#60a5fa', visits: 2 },
            { lat: 35.6762, lng: 139.6503, size: 1, color: '#3b82f6', visits: 4 },
        ];
    }

    try {
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tableName)
            .select('lat, lng, city, country');

        if (error) {
            console.error('Error loading visitor data:', error);
            return [];
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

        console.log(`Loaded ${visitorData.length} visitor locations`);
        return visitorData;
    } catch (error) {
        console.error('Error in loadVisitorData:', error);
        return [];
    }
}

// Polling-based updates (works with free Supabase tier)
let lastCheckTime = new Date();
let pollingInterval = null;

async function checkForNewVisitors(globe) {
    if (!supabase) {
        return;
    }

    try {
        // Check for visitors added since last check
        const { data, error } = await supabase
            .from(SUPABASE_CONFIG.tableName)
            .select('id, timestamp')
            .gt('timestamp', lastCheckTime.toISOString())
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('Error checking for new visitors:', error);
            return;
        }

        if (data && data.length > 0) {
            console.log(`${data.length} new visitor(s) detected, updating globe...`);
            lastCheckTime = new Date(data[0].timestamp);

            // Reload all data and update globe
            const visitorData = await loadVisitorData();
            globe.pointsData(visitorData);
        }
    } catch (error) {
        console.error('Error in checkForNewVisitors:', error);
    }
}

function startPolling(globe, intervalMs = 30000) {
    if (!supabase) {
        console.warn('Supabase not initialized, polling disabled');
        return;
    }

    // Clear any existing interval
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }

    // Start polling for new visitors
    pollingInterval = setInterval(() => {
        checkForNewVisitors(globe);
    }, intervalMs);

    console.log(`Started polling for new visitors every ${intervalMs/1000} seconds`);
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log('Stopped polling for new visitors');
    }
}

// 3D Globe Initialization
async function initGlobe() {
    const container = document.getElementById('globe-container');

    if (!container) {
        console.warn('Globe container not found');
        return;
    }

    // Check if Globe library is loaded
    if (typeof Globe === 'undefined') {
        console.error('Globe.gl library not loaded. Retrying in 500ms...');
        setTimeout(initGlobe, 500);
        return;
    }

    console.log('Initializing globe...');

    try {
        // Initialize Supabase if config is available
        const supabaseReady = typeof SUPABASE_CONFIG !== 'undefined' &&
                               SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL';

        if (supabaseReady) {
            initSupabase();
            // Track current visitor
            await trackVisitor();
        }

        // Load visitor data (from Supabase or use sample data)
        const visitorData = await loadVisitorData();

        // Create the globe
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
            .width(container.offsetWidth)
            .height(280)
            .pointLabel(d => `
                <div style="background: rgba(0,0,0,0.8); padding: 8px; border-radius: 4px; color: white;">
                    <strong>${d.city}, ${d.country}</strong><br/>
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

        // Start polling for updates if Supabase is ready (works with free tier)
        if (supabaseReady && supabase) {
            // Poll every 30 seconds (you can adjust this)
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

// Load sidebar content dynamically
function loadSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Load sidebar from template (defined in sidebar-template.js)
    if (typeof sidebarTemplate !== 'undefined') {
        sidebar.innerHTML = sidebarTemplate;

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
    loadSidebar();

    // Initialize 3D globe after sidebar is loaded
    setTimeout(() => {
        console.log('Attempting to initialize globe...');
        initGlobe();
    }, 500);

    // Set up theme toggle button after sidebar is loaded
    setTimeout(() => {
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
        }
    }, 100);

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
