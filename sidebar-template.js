// Sidebar template - shared across all pages
const sidebarTemplate = `
<div class="profile-section">
    <div class="avatar">
        <img src="figures/IMG_09021.jpg" alt="Profile Picture" id="profile-img">
    </div>
    <h1 class="name">Xiaoran Yang</h1>
    <p class="title">Second Year PhD Student in <a href="https://csc.ncsu.edu/" target="_blank" rel="noopener noreferrer"><img src="ncstate-brick-2x2-red-max.png" alt="NC State University" class="inline-logo"></a></p>
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
