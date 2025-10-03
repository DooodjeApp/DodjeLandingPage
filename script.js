// Simple and clean interactions inspired by Hackathon.dev

document.addEventListener('DOMContentLoaded', function() {
    // ==================== GESTION DU CACHE ====================
    function getUserFromCache() {
        const userData = localStorage.getItem('dodje_user');
        return userData ? JSON.parse(userData) : null;
    }
    
    function saveUserToCache(userData) {
        localStorage.setItem('dodje_user', JSON.stringify(userData));
    }
    
    function clearUserCache() {
        localStorage.removeItem('dodje_user');
    }
    
    // Note: Le dashboard a été retiré car l'application est maintenant disponible
    console.log('Chargement de la landing page Dodje');
    
    // ==================== NAVIGATION DYNAMIQUE ====================
    const navbarMinimal = document.getElementById('navbar-minimal');
    const navbarScroll = document.getElementById('navbar-scroll');
    let navScrollTop = 0;
    const scrollThreshold = 100; // Pixels de scroll avant de changer le header
    
    // Fonction pour gérer l'affichage des headers selon le scroll
    function handleScrollNavigation() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > scrollThreshold) {
            // Masquer le header minimal et afficher le header complet
            if (!navbarMinimal.classList.contains('hidden')) {
                navbarMinimal.classList.add('hidden');
            }
            if (!navbarScroll.classList.contains('visible')) {
                navbarScroll.classList.add('visible');
            }
        } else {
            // Afficher le header minimal et masquer le header complet
            if (navbarMinimal.classList.contains('hidden')) {
                navbarMinimal.classList.remove('hidden');
            }
            if (navbarScroll.classList.contains('visible')) {
                navbarScroll.classList.remove('visible');
            }
        }
        
        navScrollTop = scrollTop;
    }
    
    // Event listener pour le scroll
    window.addEventListener('scroll', handleScrollNavigation, { passive: true });
    
    // Initialiser l'état au chargement
    handleScrollNavigation();
    
    // ==================== MENU MOBILE ====================
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    
    // Fonction pour ouvrir le menu mobile
    function openMobileMenu() {
        mobileMenu.classList.add('active');
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Fonction pour fermer le menu mobile
    function closeMobileMenu() {
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    // Event listeners pour le menu mobile
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', openMobileMenu);
    }
    
    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMobileMenu);
    }
    
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Fermer le menu mobile quand on clique sur un lien
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links .nav-link');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    // Fermer le menu mobile sur escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    // ==================== FIREBASE CONFIGURATION ====================
    const firebaseConfig = {
        apiKey: "AIzaSyDgDWiRJuwuG6jnqwKyIVlNEAiNTTu6jdQ",
        authDomain: "doodje-455f9.firebaseapp.com",
        projectId: "doodje-455f9",
        storageBucket: "doodje-455f9.firebasestorage.app",
        messagingSenderId: "612838674498",
        appId: "1:612838674498:web:ba9f10dd9aa0d0a3d01ddb",
        measurementId: "G-PTCZR9N93R"
    };
    
    // Initialiser Firebase
    firebase.initializeApp(firebaseConfig);
    // Note: Les fonctions de préinscription et d'authentification ont été retirées car l'application est maintenant disponible
    
    // ==================== EXISTING FUNCTIONALITY ====================
    // Gestion de la vidéo d'arrière-plan
    const backgroundVideo = document.getElementById('background-video');
    if (backgroundVideo) {
        // S'assurer que la vidéo démarre bien
        backgroundVideo.play().catch(e => {
            console.log('Autoplay bloqué:', e);
        });
        
        // Redémarrer la vidéo quand elle se termine (double sécurité pour la boucle)
        backgroundVideo.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        });
    }

    // Gestion de la vidéo feature (Bourse monstre)
    const featureVideo = document.querySelector('.feature-video');
    if (featureVideo) {
        // S'assurer que la vidéo démarre bien
        featureVideo.play().catch(e => {
            console.log('Autoplay bloqué pour la vidéo feature:', e);
        });
        
        // Redémarrer la vidéo quand elle se termine (double sécurité pour la boucle)
        featureVideo.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        });
    }

    // Navbar scroll effect
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop;
    }, { passive: true });

    // Phone mockup tilt effect
    const phoneMockup = document.querySelector('.phone-mockup');
    if (phoneMockup) {
        phoneMockup.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            requestAnimationFrame(() => {
                this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            });
        });
        
        phoneMockup.addEventListener('mouseleave', function() {
            requestAnimationFrame(() => {
                this.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
            });
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Form interactions
    const formInputs = document.querySelectorAll('input[type="email"], input[type="text"]');
    const allCtaButtons = document.querySelectorAll('.cta-button');

    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transform = 'scale(1.02)';
            this.style.borderColor = 'var(--secondary-green)';
        });
        
        input.addEventListener('blur', function() {
            this.style.transform = 'scale(1)';
            this.style.borderColor = 'var(--border-subtle)';
        });
    });

    // CTA button hover effects (pour les boutons qui ne sont pas "C'est parti")
    allCtaButtons.forEach(button => {
        if (!button.textContent.includes('C\'est parti')) {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px) scale(1.02)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        }
    });



    // Intersection Observer for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.pillar-card, .feature-card, .benefit, .time-unit');
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(element);
    });

    // About video - contrôles natifs uniquement
    const aboutVideo = document.querySelector('.about-video');
    if (aboutVideo) {
        // Configuration pour mobile - s'assurer que la vidéo utilise les contrôles natifs
        aboutVideo.setAttribute('playsinline', '');
        aboutVideo.setAttribute('webkit-playsinline', '');
        
        // Error handling simple
        aboutVideo.addEventListener('error', function() {
            console.error('Error loading about video');
        });
        
        // Log basique quand la vidéo est prête
        aboutVideo.addEventListener('loadedmetadata', function() {
            console.log('About video loaded successfully');
        });
    }

    // Learning path step interactions
    const stepCircles = document.querySelectorAll('.step-circle');
    stepCircles.forEach(circle => {
        circle.addEventListener('mouseenter', function() {
            if (this.classList.contains('completed') || this.classList.contains('current')) {
                this.style.transform = 'scale(1.1)';
            }
        });
        
        circle.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // Card hover effects
    const cards = document.querySelectorAll('.pillar-card, .feature-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Keyboard navigation improvements
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });

    // Performance optimization: debounce scroll events
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Apply debouncing to scroll events
    const debouncedScrollHandler = debounce(function() {
        // Additional scroll effects can be added here
    }, 16); // ~60fps

    window.addEventListener('scroll', debouncedScrollHandler, { passive: true });

    console.log('🌱 Dodje Landing Page with Firebase loaded successfully');
}); 