document.addEventListener('DOMContentLoaded', () => {
    const categoryFilter = document.getElementById('categoryFilter');
    const competitionsGrid = document.getElementById('competitionsGrid');
    const noResultsMessage = document.getElementById('noResultsCompMessage');

    // --- Filtering Logic ---
    function filterCompetitions() {
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        const cards = competitionsGrid ? competitionsGrid.querySelectorAll('.competition-card-wrapper') : [];
        let visibleCount = 0;

        cards.forEach(card => {
            const cardCategory = card.dataset.category || '';
            const isVisible = !selectedCategory || cardCategory === selectedCategory;

            // Animate filtering (optional)
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            if (isVisible) {
                card.style.display = '';
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
                visibleCount++;
            } else {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                // Use setTimeout to hide after animation
                setTimeout(() => { card.style.display = 'none'; }, 300);
            }
        });

        // Show/hide no results message
        if (noResultsMessage) {
            noResultsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    // Add event listener for category filter
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterCompetitions);
    }

    // --- Modal Handling Logic ---
    const registrationModalElement = document.getElementById('registrationModal');
    let registrationModalInstance = null;
    if (registrationModalElement) {
        registrationModalInstance = new bootstrap.Modal(registrationModalElement);
    }
    const modalEventNameElement = document.getElementById('modalEventName');
    const confirmRegistrationBtn = document.getElementById('confirmRegistrationBtn');
    let currentEventIdForModal = null;

    // Add event listeners to all register buttons
    competitionsGrid.addEventListener('click', (event) => {
        if (event.target.classList.contains('register-btn') || event.target.closest('.register-btn')) {
            const button = event.target.closest('.register-btn');
            currentEventIdForModal = button.dataset.eventId;
            if (modalEventNameElement) {
                modalEventNameElement.textContent = button.dataset.eventName || 'this competition';
            }
            if (registrationModalInstance) {
                registrationModalInstance.show();
            } else {
                console.error("Registration modal instance not found");
            }
        }
    });

    // Handle confirm registration button click
    if (confirmRegistrationBtn) {
        confirmRegistrationBtn.addEventListener('click', async () => {
            if (!currentEventIdForModal) {
                alert('Error: No event selected.');
                return;
            }

            // --- !!! Replace this alert with your actual API call !!! ---
            console.log(`Attempting to register for event ID: ${currentEventIdForModal}`);
            alert(`Placeholder: Registration confirmed for event ID ${currentEventIdForModal}. Implement actual API call.`);
            // Example API call structure:
            /*
            try {
                const response = await fetch('/api/register-event', { // Adjust endpoint
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add authorization headers if needed
                    },
                    body: JSON.stringify({ eventId: currentEventIdForModal })
                });

                if (response.ok) {
                    alert('Registration successful!');
                    if (registrationModalInstance) registrationModalInstance.hide();
                    // Optionally update UI or redirect
                } else {
                    const errorData = await response.json();
                    alert(`Registration failed: ${errorData.message || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Registration API call failed:', error);
                alert('An error occurred during registration.');
            }
            */
            // --- End of API call placeholder ---

            if (registrationModalInstance) registrationModalInstance.hide();
        });
    }

    // Initial filter on page load
    if (competitionsGrid) { // Check if the grid exists before filtering
        filterCompetitions();
    } else {
        console.warn("Competitions grid not found on this page.");
    }
});
