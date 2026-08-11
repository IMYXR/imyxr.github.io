// ============================================================================
// SHARED SIDEBAR — edit this file only. index.html, about.html and link.html
// all render from it, so one change here updates every page.
// ============================================================================
//
// HOW IT WORKS
// Each page contains an empty `<aside class="sidebar glass-card">` followed
// immediately by `<script src="sidebar.js"></script>`. Because that script tag
// sits inside the body, it runs *synchronously while the page is still
// parsing* — the sidebar is filled in before the browser's first paint and
// before any DOMContentLoaded handler runs.
//
// That timing is the whole point. The earlier attempt injected the sidebar
// from script.js on DOMContentLoaded, which was too late on both counts:
//   1. the sidebar was empty during the first paint, so the grid column
//      collapsed and the page visibly jumped once the content appeared;
//   2. the inline theme script at the bottom of each page registers its own
//      DOMContentLoaded handler earlier in document order, so it looked for
//      #theme-toggle before the button existed and the dark-mode toggle
//      silently stopped working.
// Injecting during parse means every other script sees exactly the same DOM
// it saw when this markup was hard-coded. Do not switch this to `defer`,
// `async`, fetch(), or a DOMContentLoaded handler.
//
// The active nav button is derived from the `data-page` attribute on the
// <aside> (falling back to the URL), so no per-page markup differences remain.
// ============================================================================

const sidebarHTML = `
            <div class="profile-section">
                <div class="avatar">
                    <img src="figures/IMG_09021.jpg" alt="Profile Picture" id="profile-img">
                </div>
                <h1 class="name">Xiaoran Yang</h1>
                <p class="title">PhD Candidate in<br><a href="https://csc.ncsu.edu/" target="_blank" rel="noopener noreferrer"><img src="ncstate-brick-2x2-red-max.png" alt="NC State University" class="inline-logo"></a></p>
            </div>

            <!-- Navigation Buttons -->
            <nav class="page-navigation">
                <a href="index.html" class="nav-btn glass-btn" data-page="index"><span class="nav-icon">🎓</span><span class="nav-text">Academic</span></a>
                <a href="about.html" class="nav-btn glass-btn" data-page="about"><span class="nav-icon">👤</span><span class="nav-text">About</span></a>
                <a href="link.html" class="nav-btn glass-btn" data-page="link"><span class="nav-icon">🔗</span><span class="nav-text">Link</span></a>
            </nav>

            <div class="info-section">
                <h3>Attending</h3>
                <div class="attending-list">
                    <div class="attending-item">
                        <div class="attending-icon">📅</div>
                        <div class="attending-info">
                            <h4 class="attending-title">ISMAR 2026</h4>
                            <p class="attending-details">Bari, Italy · Oct 5-10</p>
                        </div>
                    </div>
                    <div class="attending-item">
                        <div class="attending-icon">📅</div>
                        <div class="attending-info">
                            <h4 class="attending-title">CHI 2026</h4>
                            <p class="attending-details">Barcelona, Spain · Apr 13-17</p>
                        </div>
                    </div>
                    <div class="attending-item">
                        <div class="attending-icon">📅</div>
                        <div class="attending-info">
                            <h4 class="attending-title">VL/HCC 2025</h4>
                            <p class="attending-details">Raleigh, NC · Oct 7-10</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="info-section">
                <h3>Contact</h3>
                <div class="contact-item">
                    <span class="icon">📧</span>
                    <span>xyang49@ncsu.edu</span>
                </div>
            </div>

            <div class="info-section">
                <h3>Visitor Map</h3>
                <!-- 3D Globe Visualization -->
                <div id="globe-container"></div>
            </div>

            <div class="theme-toggle-container">
                <button class="theme-toggle glass-btn" id="theme-toggle" aria-label="Toggle theme">
                    <span class="theme-toggle-icon">🌙</span>
                    <span class="theme-toggle-text">Dark Mode</span>
                </button>
            </div>
`;

(function renderSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
        console.error('sidebar.js: no .sidebar element found. The script tag must come after <aside class="sidebar">.');
        return;
    }

    sidebar.innerHTML = sidebarHTML;

    // Highlight the current page: prefer the explicit data-page on the <aside>,
    // fall back to the filename so the site root ("/") still resolves to index.
    const currentPage = sidebar.dataset.page ||
        (window.location.pathname.split('/').pop() || 'index').replace('.html', '') ||
        'index';

    sidebar.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === currentPage);
    });
})();
