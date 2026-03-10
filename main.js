// ========================================
// THREE.JS 3D PARTICLE BACKGROUND
// ========================================

function initThreeBackground() {
    const canvas = document.getElementById('bg-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 5;

    // Create particle system
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.015,
        color: 0x00f5ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Create connecting lines between nearby particles
    const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x00f5ff,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending
    });

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Mobile gyroscope interaction
    window.addEventListener('deviceorientation', (event) => {
        // gamma is the left-to-right tilt in degrees, where right is positive (-90 to 90)
        // beta is the front-to-back tilt in degrees, where front is positive (-180 to 180)
        if (typeof event.gamma === 'number' && typeof event.beta === 'number') {
            // clamp for a reasonable range (-45 to 45 degree tilt)
            let gamma = Math.max(-45, Math.min(45, event.gamma));
            let beta = Math.max(-45, Math.min(45, event.beta));

            mouseX = gamma / 45;
            mouseY = -(beta / 45); // negative because tilting forward should tilt camera down
        }
    });

    // Mobile touch interaction fallback
    document.addEventListener('touchmove', (event) => {
        if (event.touches.length > 0) {
            mouseX = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        // Rotate particles
        particlesMesh.rotation.y += 0.0005;
        particlesMesh.rotation.x += 0.0002;

        // Mouse parallax effect
        particlesMesh.rotation.x += (mouseY * 0.1 - particlesMesh.rotation.x) * 0.05;
        particlesMesh.rotation.y += (mouseX * 0.1 - particlesMesh.rotation.y) * 0.05;

        renderer.render(scene, camera);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ========================================
// TYPED TEXT EFFECT
// ========================================

function initTypedText() {
    const typedElement = document.querySelector('.typed-text');
    const texts = [
        'Creating Immersive VR Experiences',
        'Building AR Solutions',
        'Training the Next Generation',
        'Innovating with Extended Reality'
    ];

    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function type() {
        const currentText = texts[textIndex];

        if (isDeleting) {
            typedElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            typedElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }

        if (!isDeleting && charIndex === currentText.length) {
            isDeleting = true;
            typingSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typingSpeed = 500;
        }

        setTimeout(type, typingSpeed);
    }

    type();
}

// ========================================
// NAVIGATION
// ========================================

function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Smooth scroll and active link
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const offset = 80; // Navbar height
                const targetPosition = targetSection.offsetTop - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');

                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Update active link on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('.section');

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;

            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// ========================================
// GSAP SCROLL ANIMATIONS
// ========================================

function initScrollAnimations() {
    // Safety check: ensure ScrollTrigger is available before using it
    if (typeof ScrollTrigger === 'undefined') {
        console.warn('ScrollTrigger not loaded — skipping scroll animations');
        return;
    }

    try {
        gsap.registerPlugin(ScrollTrigger);

        // Timeline items animation
        gsap.utils.toArray('.timeline-item').forEach((item, index) => {
            gsap.from(item, {
                opacity: 0,
                x: -50,
                duration: 0.8,
                delay: index * 0.15,
                scrollTrigger: {
                    trigger: item,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                }
            });
        });

        // Project cards stagger animation
        gsap.from('.project-card', {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.08,
            scrollTrigger: {
                trigger: '.projects-grid',
                start: 'top 90%',
                toggleActions: 'play none none none'
            }
        });

        // Skills animation
        gsap.from('.skill-item', {
            opacity: 0,
            scale: 0.9,
            duration: 0.5,
            stagger: 0.1,
            scrollTrigger: {
                trigger: '.skills-grid',
                start: 'top 90%',
                toggleActions: 'play none none none'
            }
        });

        // Training cards animation
        gsap.from('.training-card', {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.12,
            scrollTrigger: {
                trigger: '.training-grid',
                start: 'top 90%',
                toggleActions: 'play none none none'
            }
        });

        // Stats counter animation
        const stats = document.querySelectorAll('.stat-number');
        stats.forEach(stat => {
            ScrollTrigger.create({
                trigger: stat,
                start: 'top 85%',
                onEnter: () => {
                    const numericValue = parseInt(stat.textContent.replace('+', ''));
                    gsap.from(stat, {
                        textContent: 0,
                        duration: 2,
                        snap: { textContent: 1 },
                        onUpdate: function () {
                            stat.textContent = Math.ceil(this.targets()[0].textContent) + '+';
                        }
                    });
                },
                once: true
            });
        });

        // Fallback safety net: if any elements got stuck at opacity:0, reset them after 4s
        setTimeout(() => {
            document.querySelectorAll('.project-card, .skill-item, .training-card, .timeline-item').forEach(el => {
                if (parseFloat(window.getComputedStyle(el).opacity) < 0.1) {
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                }
            });
        }, 4000);

    } catch (err) {
        // If GSAP/ScrollTrigger throws any error, ensure all elements are visible
        console.warn('GSAP animation error — making all elements visible:', err);
        document.querySelectorAll('.project-card, .skill-item, .training-card, .timeline-item').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }
}

// ========================================
// PROJECT MODAL (Future Enhancement)
// ========================================

function initProjectModals() {
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        card.addEventListener('click', () => {
            // Add pulse effect on click
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 200);

            // Future: Open detailed project modal
            // For now, just add visual feedback
        });
    });
}

// ========================================
// CUSTOM CURSOR (Optional Enhancement)
// ========================================

function initCustomCursor() {
    const cursor = document.querySelector('.custom-cursor');
    const follower = document.querySelector('.cursor-follower');

    if (!cursor || !follower) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let followerX = 0;
    let followerY = 0;

    // Only show and enable on desktop/pointing devices
    if (window.matchMedia("(pointer: fine)").matches) {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Smooth animation loop
        function moveCursor() {
            // Smoothly interpolate cursor and follower positions
            cursorX += (mouseX - cursorX) * 0.2;
            cursorY += (mouseY - cursorY) * 0.2;
            followerX += (mouseX - followerX) * 0.1;
            followerY += (mouseY - followerY) * 0.1;

            cursor.style.left = `${cursorX}px`;
            cursor.style.top = `${cursorY}px`;
            follower.style.left = `${followerX}px`;
            follower.style.top = `${followerY}px`;

            requestAnimationFrame(moveCursor);
        }
        moveCursor();

        // Hover states
        const interactive = document.querySelectorAll('a, button, .project-card, .dot, .tag');
        interactive.forEach(el => {
            el.addEventListener('mouseenter', () => {
                document.body.classList.add('cursor-active');
            });
            el.addEventListener('mouseleave', () => {
                document.body.classList.remove('cursor-active');
            });
        });

        // Hide when leaving window
        document.addEventListener('mouseleave', () => {
            cursor.style.opacity = '0';
            follower.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            cursor.style.opacity = '1';
            follower.style.opacity = '1';
        });
    } else {
        // Disable on touch devices
        cursor.style.display = 'none';
        follower.style.display = 'none';
        document.body.style.cursor = 'auto';
    }
}

// ========================================
// INTERSECTION OBSERVER FOR PERFORMANCE
// ========================================

function initLazyEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.glass').forEach(el => {
        observer.observe(el);
    });
}

// ========================================
// LOGO ANIMATION (SP -> XR)
// ========================================

function initLogoAnimation() {
    const logoChars = document.getElementById('logo-chars');
    if (!logoChars) return;

    // Start sequence after 5 seconds
    setTimeout(() => {
        // Step 1: Delete "SP" backwards
        logoChars.textContent = "S";
        setTimeout(() => {
            logoChars.textContent = "";

            // Step 2: Type "XR" with glow
            setTimeout(() => {
                logoChars.textContent = "X";
                setTimeout(() => {
                    logoChars.textContent = "XR";
                    // Add glow effect class to text
                    logoChars.classList.add('xr-glow');
                }, 300); // type R
            }, 600); // pause before typing X
        }, 300); // delete S
    }, 5000); // Initial interval before animation starts
}

// ========================================
// INITIALIZE ALL
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if Three.js is loaded
    if (typeof THREE !== 'undefined') {
        initThreeBackground();
    } else {
        console.warn('Three.js not loaded');
    }

    // Check if GSAP is loaded
    if (typeof gsap !== 'undefined') {
        initScrollAnimations();
    } else {
        console.warn('GSAP not loaded');
    }

    // Initialize other features
    initTypedText();
    initNavigation();
    initProjectModals();
    initLazyEffects();

    // Custom cursor (XR Style)
    initCustomCursor();

    // Logo SP -> XR transition
    initLogoAnimation();

    // Direct Resume Download Fallback
    const resumeBtns = document.querySelectorAll('a[href$="resume.pdf"]');
    resumeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            console.log('Resume download triggered for:', btn.href);
            // We don't preventDefault here, but we can force it if needed
        });
    });

    console.log('🚀 XR Portfolio initialized successfully!');
});

// ========================================
// PAGE VISIBILITY API - Pause animations when tab not visible
// ========================================

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause heavy animations when tab is not visible
        console.log('Tab hidden - animations paused');
    } else {
        console.log('Tab visible - animations resumed');
    }
});
