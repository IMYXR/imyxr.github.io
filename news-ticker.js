// News Timeline - Vertical Scroll with Auto-Play Animation

class NewsTimeline {
    constructor() {
        this.isAutoScrolling = true;
        this.scrollSpeed = 1; // pixels per frame
        this.pauseDuration = 2000; // pause at each item for 2 seconds
        this.animationFrame = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupTimeline());
        } else {
            this.setupTimeline();
        }
    }

    setupTimeline() {
        const scrollWrapper = document.querySelector('.timeline-scroll-wrapper');
        const timeline = document.querySelector('.timeline');

        if (!timeline || !scrollWrapper) return;

        // Enable auto-scroll
        this.startAutoScroll(scrollWrapper);

        // Add hover pause functionality
        this.addScrollPause(scrollWrapper);

        // Add scroll indicators
        this.addScrollIndicators(scrollWrapper);

        // Observe timeline items for animations
        this.observeTimelineItems();
    }

    startAutoScroll(scrollWrapper) {
        let lastTime = Date.now();
        let pausedUntil = 0;

        const scroll = () => {
            if (!this.isAutoScrolling) {
                this.animationFrame = requestAnimationFrame(scroll);
                return;
            }

            const now = Date.now();

            // Check if we're in pause state
            if (pausedUntil > now) {
                this.animationFrame = requestAnimationFrame(scroll);
                return;
            }

            // Smooth scrolling
            if (now - lastTime > 16) { // ~60fps
                const currentScroll = scrollWrapper.scrollTop;
                const maxScroll = scrollWrapper.scrollHeight - scrollWrapper.clientHeight;

                if (currentScroll >= maxScroll) {
                    // Reset to top with a pause
                    pausedUntil = now + this.pauseDuration;
                    scrollWrapper.scrollTop = 0;
                } else {
                    // Continue scrolling
                    scrollWrapper.scrollTop += this.scrollSpeed;

                    // Check if we've reached a timeline item
                    const items = document.querySelectorAll('.timeline-item');
                    items.forEach(item => {
                        const rect = item.getBoundingClientRect();
                        const wrapperRect = scrollWrapper.getBoundingClientRect();

                        // If item is centered in viewport, pause briefly
                        if (Math.abs(rect.top - wrapperRect.top - 50) < 10) {
                            if (pausedUntil <= now) {
                                pausedUntil = now + this.pauseDuration;
                            }
                        }
                    });
                }

                lastTime = now;
            }

            this.animationFrame = requestAnimationFrame(scroll);
        };

        // Start the animation
        this.animationFrame = requestAnimationFrame(scroll);
    }

    addScrollPause(scrollWrapper) {
        scrollWrapper.addEventListener('mouseenter', () => {
            this.isAutoScrolling = false;
        });

        scrollWrapper.addEventListener('mouseleave', () => {
            this.isAutoScrolling = true;
        });

        // Pause on manual scroll
        let scrollTimeout;
        scrollWrapper.addEventListener('scroll', () => {
            this.isAutoScrolling = false;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.isAutoScrolling = true;
            }, 3000);
        }, { passive: true });
    }

    addScrollIndicators(scrollWrapper) {
        // Add visual indicators for scrollable content
        const updateIndicators = () => {
            const isAtTop = scrollWrapper.scrollTop <= 5;
            const isAtBottom = scrollWrapper.scrollTop >= scrollWrapper.scrollHeight - scrollWrapper.clientHeight - 5;

            scrollWrapper.classList.toggle('at-top', isAtTop);
            scrollWrapper.classList.toggle('at-bottom', isAtBottom);
        };

        scrollWrapper.addEventListener('scroll', updateIndicators, { passive: true });
        updateIndicators();
    }

    observeTimelineItems() {
        const observerOptions = {
            root: document.querySelector('.timeline-scroll-wrapper'),
            threshold: [0, 0.5, 1],
            rootMargin: '-50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                    entry.target.classList.add('in-view');
                } else {
                    entry.target.classList.remove('in-view');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.timeline-item').forEach(item => {
            observer.observe(item);
        });
    }

    // Public methods
    pause() {
        this.isAutoScrolling = false;
    }

    resume() {
        this.isAutoScrolling = true;
    }

    setSpeed(speed) {
        this.scrollSpeed = speed;
    }

    setPauseDuration(duration) {
        this.pauseDuration = duration;
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

// Initialize the timeline
const newsTimeline = new NewsTimeline();

// Export for external use
window.NewsTimeline = NewsTimeline;
window.newsTimelineInstance = newsTimeline;
