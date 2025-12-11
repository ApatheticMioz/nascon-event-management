document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const errorAlert = document.getElementById('errorAlert');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.querySelector('i').classList.toggle('fa-eye');
            togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // Handle form submission
    if (form) {
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
                console.log('Submitting login form...');
                const formData = {
                    email: form.email.value,
                    password: form.password.value
                };
                console.log('Form data:', { ...formData, password: '***' });

                const response = await fetch('/login', {
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
                    throw new Error(data.error || 'Login failed');
                }

                // Redirect to dashboard or home page
                window.location.href = data.redirect || '/dashboard';
            } catch (error) {
                console.error('Login error:', error);
                errorAlert.textContent = error.message;
                errorAlert.classList.remove('d-none');
            }
        });
    }

    // Check for registration success message
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
        const successAlert = document.getElementById('successAlert');
        if (successAlert) {
            successAlert.classList.remove('d-none');
            setTimeout(() => {
                successAlert.classList.add('d-none');
            }, 5000);
        }
    }
}); 