document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // 2. Close mobile menu when a link is clicked
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });

    // 3. Smooth Scrolling for Navigation Links
    const allLinks = document.querySelectorAll('a[href^="#"]');
    allLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            if (href !== '#' && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerHeight =
                        document.querySelector('.navbar').offsetHeight +
                        document.querySelector('.helpline-bar').offsetHeight;
                    
                    const targetPosition = targetElement.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // 4. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        navbar.style.boxShadow =
            scrollTop > 100
                ? '0 8px 20px rgba(0, 0, 0, 0.15)'
                : '0 4px 6px rgba(0, 0, 0, 0.1)';
    });

    // 5. Counter Animation
    const stats = document.querySelectorAll('.stat-card h3');
    if (stats.length > 0) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.animated) {
                    entry.target.dataset.animated = 'true';
                    const number = parseInt(entry.target.innerText.replace(/\D/g, ''));
                    let current = 0;
                    const increment = Math.ceil(number / 50);

                    const updateCount = () => {
                        current += increment;
                        if (current > number) current = number;
                        entry.target.innerText = current + '+';
                        if (current < number) setTimeout(updateCount, 20);
                    };
                    updateCount();
                }
            });
        }, { threshold: 0.5 });

        stats.forEach(stat => statsObserver.observe(stat));
    }

    console.log('Vertex Healthcare Services - Website Initialized');

    // Appointment Modal Event Listeners
    const bookAppointmentBtn = document.getElementById('bookAppointmentBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');

    if (bookAppointmentBtn) {
        bookAppointmentBtn.addEventListener('click', openAppointmentModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeAppointmentModal);
    }
});

/* ========== APPOINTMENT MODAL FUNCTIONS ========== */
function openAppointmentModal() {
    console.log('openAppointmentModal called');
    const modal = document.getElementById('appointmentModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        console.log('Modal opened successfully');
    } else {
        console.error('Modal element not found');
    }
}

function closeAppointmentModal() {
    document.getElementById('appointmentModal').style.display = 'none';
    document.getElementById('appointmentForm').style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('appointmentForm').reset();
}

window.addEventListener('click', function(event) {
    const modal = document.getElementById('appointmentModal');
    if (event.target === modal) closeAppointmentModal();
});

// ==========================
// BOOK APPOINTMENT SUBMIT
// ==========================
document.addEventListener('DOMContentLoaded', function () {
    const appointmentForm = document.getElementById('appointmentForm');

    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = {
                fullName: document.getElementById('fullName').value,
                mobileNumber: document.getElementById('mobileNumber').value,
                emailAddress: document.getElementById('emailAddress').value,
                department: document.getElementById('department').value,
                doctorName: document.getElementById('doctorName').value,
                reasonForVisit: document.getElementById('reasonForVisit').value
            };

            const submitBtn = appointmentForm.querySelector('.btn-submit');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Processing...";
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    appointmentForm.style.display = 'none';
                    document.getElementById('successMessage').style.display = 'block';
                } else {
                    alert("Failed to book appointment");
                }
            } catch (error) {
                alert("Server connection error");
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});
