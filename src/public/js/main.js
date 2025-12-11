// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenu = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-container')) {
            if (navLinks && window.innerWidth <= 768) {
                navLinks.style.display = 'none';
            }
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navLinks.style.display = 'flex';
        } else {
            navLinks.style.display = 'none';
        }
    });
});

// Fetch Featured Events
async function fetchFeaturedEvents() {
    try {
        const response = await fetch('/api/events/featured');
        const events = await response.json();
        displayFeaturedEvents(events);
    } catch (error) {
        console.error('Error fetching featured events:', error);
    }
}

// Display Featured Events
function displayFeaturedEvents(events) {
    const eventsGrid = document.querySelector('.events-grid');
    if (!eventsGrid) return;

    eventsGrid.innerHTML = events.map(event => `
        <div class="event-card">
            <img src="${event.imageUrl || '/images/default-event.jpg'}" alt="${event.name}">
            <div class="event-content">
                <h3>${event.name}</h3>
                <p>${event.description}</p>
                <div class="event-details">
                    <span><i class="fas fa-calendar"></i> ${new Date(event.date).toLocaleDateString()}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${event.venue}</span>
                </div>
                <a href="/events/${event.id}" class="btn btn-primary">Learn More</a>
            </div>
        </div>
    `).join('');
}

// Fetch Sponsors
async function fetchSponsors() {
    try {
        const response = await fetch('/api/sponsors');
        const sponsors = await response.json();
        displaySponsors(sponsors);
    } catch (error) {
        console.error('Error fetching sponsors:', error);
    }
}

// Display Sponsors
function displaySponsors(sponsors) {
    const sponsorsGrid = document.querySelector('.sponsors-grid');
    if (!sponsorsGrid) return;

    sponsorsGrid.innerHTML = sponsors.map(sponsor => `
        <div class="sponsor-card">
            <img src="${sponsor.logoUrl || '/images/default-sponsor.png'}" alt="${sponsor.name}">
            <h3>${sponsor.name}</h3>
            <p>${sponsor.category}</p>
        </div>
    `).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchFeaturedEvents();
    fetchSponsors();
});

// Smooth Scroll
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

// Dark Mode Toggle
const darkModeToggle = document.createElement('button');
darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
darkModeToggle.className = 'dark-mode-toggle';
document.body.appendChild(darkModeToggle);

darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = darkModeToggle.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
});

// Add dark mode toggle styles
const style = document.createElement('style');
style.textContent = `
    .dark-mode-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary-color);
        color: var(--white);
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        box-shadow: var(--shadow);
    }

    .dark-mode-toggle:hover {
        transform: scale(1.1);
    }
`;
document.head.appendChild(style);

// Notification Bar Navigation
document.addEventListener('DOMContentLoaded', () => {
    const notificationItems = document.querySelectorAll('.notification-item');
    
    notificationItems.forEach(item => {
        item.addEventListener('click', () => {
            const text = item.querySelector('span').textContent.toLowerCase();
            switch(text) {
                case 'schedule':
                    window.location.href = '/schedule';
                    break;
                case 'competitions':
                    window.location.href = '/competitions';
                    break;
                case 'sponsors':
                    window.location.href = '/sponsors';
                    break;
                case 'workshops':
                    window.location.href = '/workshops';
                    break;
                case 'accommodations':
                    window.location.href = '/accommodations';
                    break;
            }
        });
    });
}); 