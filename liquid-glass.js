// Liquid Glass Effects Implementation
// Inspired by liquid-glass-js with enhanced visual effects

class LiquidGlassEffect {
    constructor() {
        this.init();
    }

    init() {
        // Add project icon containers
        this.addProjectIcons();

        // Initialize advanced glass effects
        this.initGlassEffects();

        // Add interactive hover effects
        this.addInteractiveEffects();

        // Coordinate sidebar with projects
        this.coordinateSidebarEffects();
    }

    addProjectIcons() {
        const projectCards = document.querySelectorAll('.project-card');

        projectCards.forEach((card, index) => {
            const projectImage = card.querySelector('.project-image');
            const projectContent = card.querySelector('.project-content');

            // Add icon container with liquid glass effect
            const iconContainer = document.createElement('div');
            iconContainer.className = 'liquid-glass-icon';
            iconContainer.innerHTML = this.getProjectIcon(index);

            // Insert icon before content
            projectContent.insertBefore(iconContainer, projectContent.firstChild);

            // Add glass layers for depth
            this.addGlassLayers(card);
        });
    }

    getProjectIcon(index) {
        const icons = [
            // E-Commerce - Blue Shopping Cart
            `<svg viewBox="0 0 64 64" width="48" height="48">
                <circle cx="32" cy="32" r="28" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.5)" stroke-width="2"/>
                <path d="M20 24h24l-2 16H22l-2-16z" fill="rgba(59, 130, 246, 0.25)" stroke="rgba(59, 130, 246, 0.8)" stroke-width="2"/>
                <circle cx="26" cy="46" r="3" fill="rgba(59, 130, 246, 0.6)"/>
                <circle cx="38" cy="46" r="3" fill="rgba(59, 130, 246, 0.6)"/>
            </svg>`,
            // Task Management - Blue Checklist
            `<svg viewBox="0 0 64 64" width="48" height="48">
                <circle cx="32" cy="32" r="28" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.5)" stroke-width="2"/>
                <path d="M24 20h16v6H24z M24 30h16v6H24z M24 40h10v6H24z" fill="rgba(59, 130, 246, 0.25)" stroke="rgba(59, 130, 246, 0.8)" stroke-width="1.5"/>
            </svg>`,
            // Weather Dashboard - Blue Sun/Cloud
            `<svg viewBox="0 0 64 64" width="48" height="48">
                <circle cx="32" cy="32" r="28" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.5)" stroke-width="2"/>
                <circle cx="32" cy="28" r="8" fill="rgba(59, 130, 246, 0.25)" stroke="rgba(59, 130, 246, 0.8)" stroke-width="2"/>
                <path d="M20 36c0-6 4-8 12-8s12 2 12 8" fill="rgba(59, 130, 246, 0.2)" stroke="rgba(59, 130, 246, 0.7)" stroke-width="2"/>
            </svg>`,
            // Portfolio Builder - Blue Plus in Square
            `<svg viewBox="0 0 64 64" width="48" height="48">
                <circle cx="32" cy="32" r="28" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.5)" stroke-width="2"/>
                <rect x="22" y="22" width="20" height="20" rx="3" fill="rgba(59, 130, 246, 0.25)" stroke="rgba(59, 130, 246, 0.8)" stroke-width="2"/>
                <path d="M28 32h8 M32 28v8" stroke="rgba(59, 130, 246, 0.8)" stroke-width="2" stroke-linecap="round"/>
            </svg>`
        ];

        return icons[index] || icons[0];
    }

    addGlassLayers(card) {
        // Add multiple glass layers for refraction effect
        const glassOverlay = document.createElement('div');
        glassOverlay.className = 'liquid-glass-overlay';

        const glassEdge = document.createElement('div');
        glassEdge.className = 'liquid-glass-edge';

        const glassRim = document.createElement('div');
        glassRim.className = 'liquid-glass-rim';

        card.appendChild(glassOverlay);
        card.appendChild(glassEdge);
        card.appendChild(glassRim);
    }

    initGlassEffects() {
        // Add dynamic glass refraction effect
        const style = document.createElement('style');
        style.textContent = `
            @keyframes liquidShimmer {
                0%, 100% {
                    background-position: 0% 50%;
                    opacity: 0.6;
                }
                50% {
                    background-position: 100% 50%;
                    opacity: 0.8;
                }
            }

            @keyframes liquidPulse {
                0%, 100% { transform: scale(1); opacity: 0.7; }
                50% { transform: scale(1.05); opacity: 0.9; }
            }

            @keyframes glassRefract {
                0%, 100% { filter: hue-rotate(0deg); }
                50% { filter: hue-rotate(10deg); }
            }
        `;
        document.head.appendChild(style);
    }

    addInteractiveEffects() {
        const projectCards = document.querySelectorAll('.project-card');

        // Exact parameters from liquid-glass-js
        const TINT_OPACITY = 0.2;
        const RIM_INTENSITY = 0.05;

        projectCards.forEach(card => {
            // Subtle mouse move effect matching liquid-glass-js behavior
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;

                const overlay = card.querySelector('.liquid-glass-overlay');
                const rim = card.querySelector('.liquid-glass-rim');
                const icon = card.querySelector('.liquid-glass-icon');

                // Subtle tint overlay following mouse
                if (overlay) {
                    const intensity = TINT_OPACITY * (1 + (y - 0.5) * 0.1);
                    overlay.style.background = `rgba(255, 255, 255, ${intensity})`;
                }

                // Rim highlight based on mouse position
                if (rim) {
                    const rimGradient = `radial-gradient(
                        ellipse at ${x * 100}% ${y * 100}%,
                        rgba(255, 255, 255, ${RIM_INTENSITY * 1.5}) 0%,
                        transparent 40%
                    )`;
                    rim.style.background = rimGradient;
                }

                // Subtle icon tilt (reduced from previous values)
                if (icon) {
                    const rotateX = (y - 0.5) * 8;
                    const rotateY = (x - 0.5) * -8;
                    icon.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
                }
            });

            card.addEventListener('mouseleave', () => {
                const overlay = card.querySelector('.liquid-glass-overlay');
                const rim = card.querySelector('.liquid-glass-rim');
                const icon = card.querySelector('.liquid-glass-icon');

                if (overlay) overlay.style.background = '';
                if (rim) rim.style.background = '';
                if (icon) icon.style.transform = '';
            });
        });
    }

    coordinateSidebarEffects() {
        const sidebar = document.querySelector('.sidebar');
        const projectCards = document.querySelectorAll('.project-card');

        // Add scroll-based coordination
        window.addEventListener('scroll', () => {
            const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);

            // Update sidebar glass intensity based on scroll
            if (sidebar) {
                const intensity = 0.1 + (scrollPercent * 0.2);
                sidebar.style.background = `rgba(255, 255, 255, ${intensity})`;
            }

            // Animate project cards as they come into view
            projectCards.forEach((card, index) => {
                const rect = card.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight * 0.8;

                if (isVisible) {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';

                    // Stagger the animation
                    card.style.transitionDelay = `${index * 0.1}s`;
                }
            });
        });

        // Add intersection observer for better performance
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('liquid-glass-active');
                }
            });
        }, { threshold: 0.1 });

        projectCards.forEach(card => observer.observe(card));
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LiquidGlassEffect();
});
