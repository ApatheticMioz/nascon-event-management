document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const errorAlert = document.getElementById('errorAlert');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorAlert.classList.add('d-none');
        
        // Basic form validation
        if (!form.checkValidity()) {
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }

        try {
            console.log('Submitting registration form...');
            const formData = {
                name: form.name.value,
                email: form.email.value,
                username: form.username.value,
                password: form.password.value,
                contact: form.contact.value,
                roleId: parseInt(form.roleId.value)
            };
            console.log('Form data:', formData);

            const response = await fetch('/register/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                throw new Error(data.details || data.error || 'Registration failed');
            }

            // Show success popup
            const overlay = document.getElementById('overlay');
            const successPopup = document.getElementById('successPopup');
            overlay.classList.add('show');
            successPopup.classList.add('show');

            // Redirect to login page after 3 seconds
            setTimeout(() => {
                window.location.href = '/login?registered=true';
            }, 3000);
        } catch (error) {
            console.error('Registration error:', error);
            errorAlert.textContent = error.message;
            errorAlert.classList.remove('d-none');
        }
    });
}); 