// Dashboard JavaScript pour Dodje

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

// ==================== FONCTION POUR METTRE À JOUR LE MENU MOBILE ====================
// Fonction pour mettre à jour le menu mobile spécifiquement
function updateMobileUserInfo(userData, referralsText = null, flappyText = null) {
    console.log('🔄 Mise à jour menu mobile avec:', userData);
    
    const mobileEmailEl = document.getElementById('mobile-user-email');
    const mobileUsernameEl = document.getElementById('mobile-user-username');
    const mobileFounderCodeEl = document.getElementById('mobile-user-founder-code');
    const mobileRegistrationEl = document.getElementById('mobile-user-registration-date');
    const mobileReferralsEl = document.getElementById('mobile-user-referrals-info');
    const mobileFlappyEl = document.getElementById('mobile-user-flappy-info');
    
    console.log('📱 Éléments trouvés:', {
        email: !!mobileEmailEl,
        username: !!mobileUsernameEl,
        founderCode: !!mobileFounderCodeEl,
        registration: !!mobileRegistrationEl,
        referrals: !!mobileReferralsEl,
        flappy: !!mobileFlappyEl
    });
    
    if (mobileEmailEl) {
        mobileEmailEl.textContent = userData.email || '--';
        console.log('✅ Email mis à jour:', userData.email);
    }
    if (mobileUsernameEl) {
        mobileUsernameEl.textContent = userData.username || '--';
        console.log('✅ Username mis à jour:', userData.username);
    }
    if (mobileFounderCodeEl) {
        const founderCode = userData.generatedFounderCode || userData.founderCode || userData.code || '--';
        mobileFounderCodeEl.textContent = founderCode;
        console.log('✅ Code fondateur mis à jour:', founderCode, 'from userData:', userData);
    }
    if (mobileRegistrationEl) {
        let formattedDate = '--';
        
        console.log('🔍 Debug date - userData.timestamp:', userData.timestamp, 'type:', typeof userData.timestamp);
        
        // Essayer différentes sources de date
        const timestamp = userData.timestamp || userData.registrationDate || userData.createdAt || userData.date;
        
        if (timestamp) {
            try {
                if (typeof timestamp === 'object' && timestamp.seconds) {
                    // Format Firestore timestamp
                    formattedDate = new Date(timestamp.seconds * 1000).toLocaleDateString('fr-FR');
                    console.log('📅 Date formatée depuis Firestore timestamp:', formattedDate);
                } else if (typeof timestamp === 'string') {
                    // Format string
                    const date = new Date(timestamp);
                    if (!isNaN(date.getTime())) {
                        formattedDate = date.toLocaleDateString('fr-FR');
                        console.log('📅 Date formatée depuis string:', formattedDate);
                    }
                } else if (typeof timestamp === 'number') {
                    // Format number (timestamp en millisecondes)
                    const date = new Date(timestamp);
                    if (!isNaN(date.getTime())) {
                        formattedDate = date.toLocaleDateString('fr-FR');
                        console.log('📅 Date formatée depuis number:', formattedDate);
                    }
                }
                
                // Si on a toujours pas de date, essayer avec la fonction formatDate du scope parent
                if (formattedDate === '--' && typeof window !== 'undefined' && window.formatDate) {
                    formattedDate = window.formatDate(timestamp);
                    console.log('📅 Date formatée avec window.formatDate:', formattedDate);
                }
            } catch (error) {
                console.error('❌ Erreur lors du formatage de la date:', error);
                formattedDate = '--';
            }
        } else {
            console.log('⚠️ Aucun timestamp trouvé dans les données');
        }
        
        mobileRegistrationEl.textContent = formattedDate;
        console.log('✅ Date inscription mise à jour:', formattedDate);
    }
    
    // Nouvelles informations
    if (mobileReferralsEl && referralsText) {
        mobileReferralsEl.textContent = referralsText;
        console.log('✅ Parrainages mis à jour:', referralsText);
    }
    if (mobileFlappyEl && flappyText) {
        mobileFlappyEl.textContent = flappyText;
        console.log('✅ Flappy Bird mis à jour:', flappyText);
    }
}

// Fonction pour obtenir l'utilisateur depuis le cache
function getUserFromCache() {
    const userData = localStorage.getItem('dodje_user');
    return userData ? JSON.parse(userData) : null;
}

// Fonction pour ouvrir le menu mobile
async function openMobileMenu() {
    mobileMenu.classList.add('active');
    mobileMenuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Mettre à jour les données du menu mobile à l'ouverture
    const cachedUser = getUserFromCache();
    if (cachedUser) {
        console.log('🔄 Mise à jour menu mobile à l\'ouverture avec cache:', cachedUser);
        
        try {
            // Récupérer les données actualisées depuis Firestore
            const userDoc = await db.collection('preinscription_public').doc(cachedUser.username).get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Calculer les classements pour le mobile
                const referralsCount = userData.referralsCount || 0;
                const flappyScore = userData.bestFlappyBirdScore || 0;
                
                const referralsRanking = await getReferralsRanking(referralsCount);
                const mobileMenuReferralsText = `${referralsCount} (${referralsRanking.position}/${referralsRanking.total})`;
                
                const flappyRanking = flappyScore > 0 ? await getFlappyRanking(flappyScore) : null;
                const mobileMenuFlappyText = flappyScore > 0 ? 
                    `${flappyScore} pts (${flappyRanking.position}/${flappyRanking.total})` : 
                    'Pas encore joué';
                
                updateMobileUserInfo(userData, mobileMenuReferralsText, mobileMenuFlappyText);
            } else {
                updateMobileUserInfo(cachedUser);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour mobile:', error);
            updateMobileUserInfo(cachedUser);
        }
    }
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

// Fermer le menu mobile sur escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && mobileMenu.classList.contains('active')) {
        closeMobileMenu();
    }
});

// ==================== FIREBASE ET DASHBOARD ====================
document.addEventListener('DOMContentLoaded', function() {
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
    const db = firebase.firestore();
    
    // ==================== CHARGEMENT IMMÉDIAT DU COMPTEUR ====================
    // Charger le compteur dès que Firebase est prêt (avant toute autre logique)
    async function loadPreregistrationCountImmediate() {
        try {
            const snapshot = await db.collection('preinscription_public').get();
            const count = snapshot.size;
            const counterElement = document.getElementById('preregistration-count');
            if (counterElement) {
                counterElement.textContent = count.toLocaleString('fr-FR');
                console.log('✅ Compteur chargé immédiatement:', count);
            } else {
                console.log('⚠️ Élément compteur pas encore disponible, retry dans 100ms');
                // Retry si l'élément n'est pas encore dans le DOM
                setTimeout(() => {
                    const retryElement = document.getElementById('preregistration-count');
                    if (retryElement) {
                        retryElement.textContent = count.toLocaleString('fr-FR');
                        console.log('✅ Compteur chargé au retry:', count);
                    }
                }, 100);
            }
        } catch (error) {
            console.error('❌ Erreur chargement compteur immédiat:', error);
        }
    }
    
    // Lancer le chargement immédiatement
    loadPreregistrationCountImmediate();
    
        // ==================== GESTION DU CACHE ====================
    function saveUserToCache(userData) {
        localStorage.setItem('dodje_user', JSON.stringify(userData));
    }
    
    function clearUserCache() {
        localStorage.removeItem('dodje_user');
        // Nettoyer aussi le cache du jeu
        localStorage.removeItem('dodje_bird_best_score');
    }
    
    // ==================== REDIRECTION ET AUTHENTIFICATION ====================
    function checkUserAuth() {
        try {
            const user = getUserFromCache();
            console.log('Vérification auth dashboard:', user);
            
            if (!user || !user.email || !user.username || !user.founderCode) {
                console.log('Données utilisateur manquantes ou invalides, redirection vers landing page');
                clearUserCache();
                window.location.href = '/';
                return false;
            }
            
            // Mettre à jour la date de dernière connexion
            user.lastLogin = new Date().toISOString();
            saveUserToCache(user);
            
            return user;
        } catch (error) {
            console.error('Erreur lors de la vérification auth:', error);
            clearUserCache();
            window.location.href = '/';
            return false;
        }
    }
    
    // ==================== FONCTIONS UTILITAIRES ====================
    function formatDate(timestamp) {
        if (!timestamp) return '--';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
    
    // Fonction globale pour le countdown
    window.updateCountdown = function() {
        try {
            const countdownElements = {
                days: document.querySelector('#days-mini'),
                hours: document.querySelector('#hours-mini'),
                minutes: document.querySelector('#minutes-mini'),
                seconds: document.querySelector('#seconds-mini')
            };

            // Vérifier que tous les éléments existent
            if (!countdownElements.days || !countdownElements.hours || 
                !countdownElements.minutes || !countdownElements.seconds) {
                console.warn('⚠️ Éléments du countdown manquants');
                return;
            }

            const launchDate = new Date('2025-09-24T16:00:00');
            const now = new Date().getTime();
            const distance = launchDate.getTime() - now;

            if (distance > 0) {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                countdownElements.days.textContent = days.toString().padStart(2, '0');
                countdownElements.hours.textContent = hours.toString().padStart(2, '0');
                countdownElements.minutes.textContent = minutes.toString().padStart(2, '0');
                countdownElements.seconds.textContent = seconds.toString().padStart(2, '0');
            } else {
                // Si la date est dépassée
                countdownElements.days.textContent = '00';
                countdownElements.hours.textContent = '00';
                countdownElements.minutes.textContent = '00';
                countdownElements.seconds.textContent = '00';
            }
        } catch (error) {
            console.error('❌ Erreur dans updateCountdown:', error);
        }
    };
    
    // ==================== SYSTÈME DE NIVEAUX ====================
    const BATTLE_PASS_LEVELS = [
        { level: 1, requirement: 1, title: "Graine de Fondateur", icon: "seedling", color: "#22c55e" },
        { level: 2, requirement: 5, title: "Étoile Montante", icon: "star", color: "#3b82f6" },
        { level: 3, requirement: 15, title: "Flamme du Succès", icon: "fire", color: "#f59e0b" },
        { level: 4, requirement: 30, title: "Diamant Fondateur", icon: "gem", color: "#8b5cf6" },
        { level: 5, requirement: 50, title: "Roi des Fondateurs", icon: "crown", color: "#ef4444" },
        { level: 6, requirement: 100, title: "Légende Éternelle", icon: "dragon", color: "#06d001" }
    ];
    
    function getCurrentLevel(referralsCount) {
        let currentLevel = BATTLE_PASS_LEVELS[0];
        
        for (let i = BATTLE_PASS_LEVELS.length - 1; i >= 0; i--) {
            if (referralsCount >= BATTLE_PASS_LEVELS[i].requirement) {
                currentLevel = BATTLE_PASS_LEVELS[i];
                break;
            }
        }
        
        return currentLevel;
    }
    
    function getNextLevel(currentLevel) {
        const currentIndex = BATTLE_PASS_LEVELS.findIndex(level => level.level === currentLevel.level);
        return currentIndex < BATTLE_PASS_LEVELS.length - 1 ? BATTLE_PASS_LEVELS[currentIndex + 1] : null;
    }
    
    function calculateProgress(referralsCount, currentLevel, nextLevel) {
        if (referralsCount === 0) return 0; // Si 0 parrainage, progression à 0%
        if (!nextLevel) return 100; // Niveau max atteint
        
        const currentLevelReq = currentLevel.requirement;
        const nextLevelReq = nextLevel.requirement;
        const progressInLevel = referralsCount - currentLevelReq;
        const totalRequiredForLevel = nextLevelReq - currentLevelReq;
        
        return Math.min(100, (progressInLevel / totalRequiredForLevel) * 100);
    }
    
    function updateBattlePass(referralsCount) {
        const currentLevel = getCurrentLevel(referralsCount);
        const nextLevel = getNextLevel(currentLevel);
        const progress = calculateProgress(referralsCount, currentLevel, nextLevel);
        
        // Mise à jour du niveau actuel
        document.getElementById('current-level').textContent = currentLevel.level;
        
        // Mise à jour du score d'avancement
        const referralsCountElement = document.getElementById('referrals-count');
        if (referralsCountElement) {
            referralsCountElement.textContent = referralsCount;
        }
        
        // Mise à jour de la barre de progression
        const battlePassFill = document.getElementById('battle-pass-fill');
        battlePassFill.style.width = `${progress}%`;
        battlePassFill.style.backgroundColor = currentLevel.color;
        
        // Mise à jour des récompenses
        updateRewardItems(currentLevel.level);
        
        // Mise à jour du badge utilisateur
        updateUserBadge(currentLevel);
        
        console.log(`Niveau actuel: ${currentLevel.level} (${currentLevel.title})`);
        console.log(`Progression: ${progress.toFixed(1)}%`);
    }
    
    function updateRewardItems(currentLevel) {
        const rewardItems = document.querySelectorAll('.reward-item');
        
        rewardItems.forEach(item => {
            const itemLevel = parseInt(item.dataset.level);
            const rewardIcon = item.querySelector('.reward-icon');
            const rewardInfo = item.querySelector('.reward-info');
            
            if (itemLevel <= currentLevel) {
                // Récompense débloquée
                item.classList.add('unlocked');
                item.classList.remove('locked');
                rewardIcon.style.color = BATTLE_PASS_LEVELS[itemLevel - 1].color;
                
                // Animation pour les nouvelles récompenses
                if (itemLevel === currentLevel) {
                    item.classList.add('newly-unlocked');
                    setTimeout(() => {
                        item.classList.remove('newly-unlocked');
                    }, 2000);
                }
            } else {
                // Récompense verrouillée
                item.classList.add('locked');
                item.classList.remove('unlocked');
                rewardIcon.style.color = '#6b7280';
            }
        });
    }
    
    function updateUserBadge(currentLevel) {
        const statusBadge = document.getElementById('user-status');
        if (statusBadge) {
            statusBadge.textContent = currentLevel.title;
            statusBadge.style.background = currentLevel.color;
            statusBadge.style.color = '#000';
        }
    }

    // ==================== GESTION DES STATISTIQUES ====================
    async function getReferralsCount(founderCode) {
        try {
                    const query = await db.collection('preinscription_public')
            .where('generatedFounderCode', '==', founderCode)
            .get();

            if (!query.empty) {
                const userData = query.docs[0].data();
                return userData.referralsCount || 0;
            }
            return 0;
        } catch (error) {
            console.error('Erreur lors de la récupération des parrainages:', error);
            return 0;
        }
    }
    
    async function getTotalUsers() {
        try {
            const snapshot = await db.collection('preinscription_public').get();
            return snapshot.size || 1;
        } catch (error) {
            console.error('Erreur lors de la récupération du total des utilisateurs:', error);
            return 1;
        }
    }
    
    // ==================== COMPTEUR DE PRÉINSCRIPTIONS ====================
    let preregistrationListener = null;
    
    function updatePreregistrationCounter(count) {
        const counterElement = document.getElementById('preregistration-count');
        if (counterElement) {
            counterElement.textContent = count.toLocaleString('fr-FR');
        }
    }
    
    function startPreregistrationListener() {
        preregistrationListener = db.collection('preinscription_public')
            .onSnapshot((snapshot) => {
                updatePreregistrationCounter(snapshot.size);
            });
    }
    
    function stopPreregistrationListener() {
        if (preregistrationListener) {
            preregistrationListener();
            preregistrationListener = null;
            console.log('🛑 Écoute temps réel des préinscriptions arrêtée');
        }
    }
    
    async function getUserRank(referralsCount) {
        try {
            const snapshot = await db.collection('preinscription_public').get();
            
            if (snapshot.empty) return 100;
            
            const allCounts = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.generatedFounderCode) {
                    allCounts.push(data.referralsCount || 0);
                }
            });
            
            if (allCounts.length === 0) return 100;
            
            const betterThanCount = allCounts.filter(count => count < referralsCount).length;
            const rankPercentage = Math.round((betterThanCount / allCounts.length) * 100);
            
            return Math.max(rankPercentage, 1);
        } catch (error) {
            console.error('Erreur lors du calcul du rang:', error);
            return 50;
        }
    }
    
    // ==================== FONCTIONS POUR CLASSEMENTS ====================
    async function getReferralsRanking(userReferrals) {
        try {
            // Récupérer TOUS les utilisateurs, pas seulement ceux avec referralsCount > 0
            const snapshot = await db.collection('preinscription_public').get();

            const allCounts = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // Inclure tous les utilisateurs avec leur nombre de parrainages (0 par défaut)
                allCounts.push(data.referralsCount || 0);
            });

            // Trier du plus grand au plus petit
            allCounts.sort((a, b) => b - a);
            
            if (allCounts.length === 0) {
                return { position: 1, total: 1 };
            }

            // Trouver la position de l'utilisateur
            const position = allCounts.findIndex(count => count <= userReferrals) + 1;
            
            return {
                position: position > 0 ? position : allCounts.length,
                total: allCounts.length
            };
        } catch (error) {
            console.error('Erreur lors du calcul du rang parrainages:', error);
            return { position: 1, total: 1 };
        }
    }
    
    async function getFlappyRanking(userScore) {
        try {
            const snapshot = await db.collection('preinscription_public')
                .where('bestFlappyBirdScore', '>', 0)
                .get();

            const allScores = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                allScores.push(data.bestFlappyBirdScore || 0);
            });

            allScores.sort((a, b) => b - a);
            
            if (allScores.length === 0) {
                return { position: 1, total: 1 };
            }

            const position = allScores.findIndex(score => score <= userScore) + 1;
            return {
                position: position || allScores.length + 1,
                total: allScores.length
            };
        } catch (error) {
            console.error('Erreur lors du calcul du rang Flappy:', error);
            return { position: 1, total: 1 };
        }
    }
    
    // ==================== MISE À JOUR DE L'INTERFACE ====================
    async function updateUserInfo(user) {
        try {
            // Récupérer les données directement depuis Firestore
            const userDoc = await db.collection('preinscription_public').doc(user.username).get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Informations de base
                document.getElementById('user-email').textContent = user.email || '--'; // Email depuis le cache
                document.getElementById('user-username').textContent = userData.username || '--';
                document.getElementById('user-founder-code').textContent = userData.generatedFounderCode || '--';
                document.getElementById('user-founder-code-popup').textContent = userData.generatedFounderCode || '--';
                document.getElementById('user-registration-date').textContent = formatDate(userData.timestamp);
                
                // Calcul des classements
                const referralsCount = userData.referralsCount || 0;
                const flappyScore = userData.bestFlappyBirdScore || 0;
                
                // Classement parrainages (toujours calculer, même pour 0)
                const referralsRanking = await getReferralsRanking(referralsCount);
                const referralsText = `${referralsCount} (${referralsRanking.position}/${referralsRanking.total})`;
                document.getElementById('user-referrals-info').textContent = referralsText;
                
                // Classement Flappy Bird
                const flappyRanking = flappyScore > 0 ? await getFlappyRanking(flappyScore) : null;
                const flappyText = flappyScore > 0 ? 
                    `${flappyScore} pts (${flappyRanking.position}/${flappyRanking.total})` : 
                    'Pas encore joué';
                document.getElementById('user-flappy-info').textContent = flappyText;
                
                // Mise à jour des informations dans le menu mobile
                updateMobileUserInfo(userData, referralsText, flappyText);
                
                // Statistiques
                document.getElementById('referrals-count').innerHTML = `<span class="count-number">${referralsCount}</span>`;
                
                // Mise à jour de la passe de combat
                updateBattlePassProgress(referralsCount);
                
                // Rang
                const rank = await getUserRank(referralsCount);
                const rankElement = document.getElementById('rank-percentage');
                if (rankElement) {
                    rankElement.textContent = rank;
                }
                
                // Barre de progression (basée sur le rang)
                const progressFill = document.getElementById('progress-fill');
                if (progressFill) {
                    progressFill.style.width = `${rank}%`;
                    
                    // Couleur de la barre selon le rang
                    if (rank >= 80) {
                        progressFill.style.backgroundColor = 'var(--secondary-green)';
                    } else if (rank >= 50) {
                        progressFill.style.backgroundColor = 'var(--accent-light-green)';
                    } else {
                        progressFill.style.backgroundColor = 'var(--accent-yellow)';
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des informations utilisateur:', error);
        }
    }

    // Supprimer la fonction updateUserStats car elle est maintenant intégrée dans updateUserInfo
    
    function updateBattlePassProgress(referralsCount) {
        console.log('Mise à jour de la progression -', referralsCount, 'parrainages');
        
        // Mettre à jour le score d'avancement
        const referralsCountElement = document.getElementById('referrals-count');
        if (referralsCountElement) {
            referralsCountElement.textContent = referralsCount;
        }
        
        const requirements = [1, 5, 10, 25, 50, 100];
        let currentLevel = 1;
        let nextRequirement = 5;
        let progress = 0;

        // Si 0 parrainage, forcer la progression à 0
        if (referralsCount === 0) {
            progress = 0;
            currentLevel = 1;
            nextRequirement = 1;
        } else {
            // Trouver le niveau actuel et le prochain palier
            for (let i = 0; i < requirements.length - 1; i++) {
                if (referralsCount >= requirements[i] && referralsCount < requirements[i + 1]) {
                    currentLevel = i + 1;
                    nextRequirement = requirements[i + 1];
                    progress = ((referralsCount - requirements[i]) / (requirements[i + 1] - requirements[i])) * 100;
                    break;
                } else if (referralsCount >= requirements[requirements.length - 1]) {
                    currentLevel = requirements.length;
                    nextRequirement = requirements[requirements.length - 1];
                    progress = 100;
                }
            }
        }

        // Mettre à jour l'affichage du nombre de parrainages et du prochain palier
        const currentReferralsElement = document.getElementById('current-referrals');
        const nextRequirementElement = document.getElementById('next-level-requirement');
        
        if (currentReferralsElement) {
            currentReferralsElement.textContent = referralsCount;
        }
        if (nextRequirementElement) {
            nextRequirementElement.textContent = nextRequirement;
        }

        // Mettre à jour la barre de progression
        const progressBar = document.getElementById('battle-pass-fill');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        // Mettre à jour l'état des récompenses
        const rewardItems = document.querySelectorAll('.reward-item');
        rewardItems.forEach((item, index) => {
            const currentRequirement = requirements[index];
            
            if (referralsCount === 0 && index === 0) {
                // Premier niveau avec 0 parrainage : non débloqué
                item.classList.add('locked');
                item.classList.remove('unlocked', 'current-level');
            } else if (referralsCount >= currentRequirement) {
                // Niveau complètement débloqué
                item.classList.add('unlocked');
                item.classList.remove('locked', 'current-level');
            } else if (index > 0 && referralsCount >= requirements[index - 1]) {
                // Niveau en cours
                item.classList.add('locked', 'current-level');
                item.classList.remove('unlocked');
            } else {
                // Niveau verrouillé
                item.classList.add('locked');
                item.classList.remove('unlocked', 'current-level');
            }
        });

        console.log(`Progression mise à jour - Niveau ${currentLevel}, Progression: ${progress}%, Prochain palier: ${nextRequirement}`);
    }
    
    // ==================== FONCTIONS D'INTERACTION ====================
    window.copyFounderCode = function() {
        const codeElement = document.getElementById('user-founder-code');
        const code = codeElement.textContent;
        
        navigator.clipboard.writeText(code).then(() => {
            const button = document.querySelector('.copy-button');
            const originalText = button.innerHTML;
            
            button.innerHTML = '<i class="fas fa-check"></i> Copié !';
            button.style.backgroundColor = 'var(--secondary-green)';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.backgroundColor = '';
            }, 2000);
        }).catch(err => {
            console.error('Erreur lors de la copie:', err);
        });
    };
    
    window.logout = function() {
        clearUserCache();
        window.location.href = '/';
    };
    
    // Fonction utilitaire pour déboguer le cache
    window.debugCache = function() {
        const user = getUserFromCache();
        console.log('État du cache:', user);
        console.log('localStorage dodje_user:', localStorage.getItem('dodje_user'));
        return user;
    };

    // Fonction utilitaire pour redémarrer le countdown
    window.restartCountdown = function() {
        try {
            if (window.countdownInterval) {
                clearInterval(window.countdownInterval);
                console.log('🛑 Ancien timer arrêté');
            }
            
            updateCountdown();
            window.countdownInterval = setInterval(() => {
                try {
                    updateCountdown();
                } catch (error) {
                    console.error('❌ Erreur dans le timer countdown:', error);
                }
            }, 1000);
            
            console.log('✅ Countdown redémarré avec succès');
            return true;
        } catch (error) {
            console.error('❌ Erreur lors du redémarrage du countdown:', error);
            return false;
        }
    };
    
    // ==================== GESTION DE LA VIDÉO ====================
    const backgroundVideo = document.getElementById('background-video');
    if (backgroundVideo) {
        // Configuration spéciale pour mobile
        backgroundVideo.playsInline = true;
        backgroundVideo.webkitPlaysInline = true;
        backgroundVideo.setAttribute('playsinline', '');
        backgroundVideo.setAttribute('webkit-playsinline', '');
        
        // Empêcher le mode plein écran sur mobile
        backgroundVideo.style.webkitTransform = 'translateZ(0)';
        backgroundVideo.style.transform = 'translateZ(0)';
        
        // Désactiver les contrôles et interactions
        backgroundVideo.controls = false;
        backgroundVideo.disablePictureInPicture = true;
        
        // Empêcher le clic droit et les interactions
        backgroundVideo.addEventListener('contextmenu', e => e.preventDefault());
        backgroundVideo.addEventListener('touchstart', e => e.preventDefault());
        backgroundVideo.addEventListener('touchend', e => e.preventDefault());
        
        // Forcer le redimensionnement correct
        const resizeVideo = () => {
            backgroundVideo.style.width = '100vw';
            backgroundVideo.style.height = '100vh';
            backgroundVideo.style.objectFit = 'cover';
        };
        
        // Appeler au chargement et redimensionnement
        backgroundVideo.addEventListener('loadedmetadata', resizeVideo);
        window.addEventListener('resize', resizeVideo);
        window.addEventListener('orientationchange', () => {
            setTimeout(resizeVideo, 100);
        });
        
        // Démarrer la vidéo
        backgroundVideo.play().catch(e => {
            console.log('Autoplay bloqué:', e);
        });
        
        // Redémarrer la vidéo en boucle
        backgroundVideo.addEventListener('ended', function() {
            this.currentTime = 0;
            this.play();
        });
        
        // Surveiller les changements de mode plein écran
        const exitFullscreenHandler = () => {
            if (document.fullscreenElement === backgroundVideo || 
                document.webkitFullscreenElement === backgroundVideo) {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }
        };
        
        backgroundVideo.addEventListener('fullscreenchange', exitFullscreenHandler);
        backgroundVideo.addEventListener('webkitfullscreenchange', exitFullscreenHandler);
    }

    async function toggleInfoPopup() {
        const popup = document.getElementById('infoPopup');
        const isOpening = !popup.classList.contains('active');
        
        if (isOpening) {
            // Mettre à jour les informations quand on ouvre la popup
            const user = getUserFromCache();
            if (user) {
                await updateUserInfoForPopup(user);
            }
        }
        
        popup.classList.toggle('active');
    }

    // ==================== MISE À JOUR POPUP INFO ====================
    async function updateUserInfoForPopup(user) {
        try {
            console.log('🔄 Mise à jour popup info pour:', user.email);
            
            // Récupérer les données actualisées depuis Firestore
            const userDoc = await db.collection('preinscription_public').doc(user.username).get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log('📊 Données utilisateur récupérées:', userData);
                
                // Informations de base
                document.getElementById('user-email').textContent = user.email || '--'; // Email depuis le cache
                document.getElementById('user-username').textContent = userData.username || '--';
                document.getElementById('user-founder-code-popup').textContent = userData.generatedFounderCode || '--';
                document.getElementById('user-registration-date').textContent = formatDate(userData.timestamp);
                
                // Calcul des classements
                const referralsCount = userData.referralsCount || 0;
                const flappyScore = userData.bestFlappyBirdScore || 0;
                
                console.log('📈 Stats utilisateur:', { referralsCount, flappyScore });
                
                // Classement parrainages (toujours calculer, même pour 0)
                const referralsRanking = await getReferralsRanking(referralsCount);
                const popupReferralsText = `${referralsCount} (${referralsRanking.position}/${referralsRanking.total})`;
                document.getElementById('user-referrals-info').textContent = popupReferralsText;
                console.log('✅ Parrainages popup mis à jour:', popupReferralsText);
                
                // Classement Flappy Bird
                if (flappyScore > 0) {
                    const flappyRanking = await getFlappyRanking(flappyScore);
                    const flappyText = `${flappyScore} pts (${flappyRanking.position}/${flappyRanking.total})`;
                    document.getElementById('user-flappy-info').textContent = flappyText;
                    console.log('✅ Flappy Bird popup mis à jour:', flappyText);
                } else {
                    document.getElementById('user-flappy-info').textContent = 'Pas encore joué';
                    console.log('✅ Pas encore joué à Flappy Bird');
                }
                
            } else {
                console.log('❌ Aucun document utilisateur trouvé');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour popup info:', error);
            
            // Fallback avec les données du cache
            document.getElementById('user-email').textContent = user.email || '--';
            document.getElementById('user-username').textContent = user.username || '--';
            document.getElementById('user-founder-code-popup').textContent = user.founderCode || '--';
            document.getElementById('user-referrals-info').textContent = '--';
            document.getElementById('user-flappy-info').textContent = '--';
        }
    }

    // Rendre la fonction accessible globalement
    window.toggleInfoPopup = toggleInfoPopup;

    // Fermer la popup en cliquant en dehors
    document.addEventListener('click', (e) => {
        const popup = document.getElementById('infoPopup');
        const infoButton = document.querySelector('.info-button');
        
        if (!popup.contains(e.target) && !infoButton.contains(e.target) && popup.classList.contains('active')) {
            popup.classList.remove('active');
        }
    });
    
    // ==================== NETTOYAGE ====================
    // Nettoyer les listeners quand l'utilisateur quitte la page
    window.addEventListener('beforeunload', () => {
        stopPreregistrationListener();
    });
    
    // Nettoyer aussi quand la page devient invisible (onglet en arrière-plan)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopPreregistrationListener();
        } else {
            // Redémarrer quand la page redevient visible
            setTimeout(() => {
                startPreregistrationListener();
            }, 1000);
        }
    });
    
    // ==================== INITIALISATION ====================
    async function init() {
        try {
            // Vérifier l'authentification
            const user = checkUserAuth();
            if (!user) return;

            // Recharger le score du jeu pour l'utilisateur actuel
            if (gameState.canvas) {
                gameState.bestScore = 0;
                updateScoreDisplay();
                await loadBestScoreFromFirebase();
            }

            // Récupérer les données utilisateur depuis Firestore
            const userDoc = await db.collection('preinscription_public').doc(user.username).get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Mettre à jour les informations de base
                document.getElementById('user-email').textContent = user.email || '--'; // Email depuis le cache
                document.getElementById('user-username').textContent = userData.username || '--';
                document.getElementById('user-founder-code').textContent = userData.generatedFounderCode || '--';
                document.getElementById('user-founder-code-popup').textContent = userData.generatedFounderCode || '--';
                document.getElementById('user-registration-date').textContent = formatDate(userData.timestamp);

                // Calcul des classements pour la popup info
                const referralsCount = userData.referralsCount || 0;
                const flappyScore = userData.bestFlappyBirdScore || 0;
                
                console.log('📊 Calcul classements - Parrainages:', referralsCount, 'Flappy:', flappyScore);

                // Classement parrainages (toujours calculer, même pour 0)
                const referralsRanking = await getReferralsRanking(referralsCount);
                const referralsText = `${referralsCount} (${referralsRanking.position}/${referralsRanking.total})`;
                document.getElementById('user-referrals-info').textContent = referralsText;
                console.log('✅ Parrainages init:', referralsText);
                
                // Classement Flappy Bird
                if (flappyScore > 0) {
                    const flappyRanking = await getFlappyRanking(flappyScore);
                    const flappyText = `${flappyScore} pts (${flappyRanking.position}/${flappyRanking.total})`;
                    document.getElementById('user-flappy-info').textContent = flappyText;
                    console.log('✅ Flappy Bird init:', flappyText);
                } else {
                    document.getElementById('user-flappy-info').textContent = 'Pas encore joué';
                }

                // Mise à jour du menu mobile avec les classements
                const mobileReferralsText = document.getElementById('user-referrals-info').textContent;
                const mobileFlappyText = document.getElementById('user-flappy-info').textContent;
                updateMobileUserInfo(userData, mobileReferralsText, mobileFlappyText);

                console.log('Nombre de parrainages:', referralsCount);

                // Mettre à jour le score d'avancement
                const referralsCountElement = document.getElementById('referrals-count');
                if (referralsCountElement) {
                    referralsCountElement.textContent = referralsCount;
                }

                // Mettre à jour la progression du passe de combat
                updateBattlePassProgress(referralsCount);

                // Mettre à jour le rang
                const rank = await getUserRank(referralsCount);
                const rankElement = document.getElementById('rank-percentage');
                if (rankElement) {
                    rankElement.textContent = rank;
                }

                // Mettre à jour la barre de progression du rang
                const progressFill = document.getElementById('progress-fill');
                if (progressFill) {
                    progressFill.style.width = `${rank}%`;
                    if (rank >= 80) {
                        progressFill.style.backgroundColor = 'var(--secondary-green)';
                    } else if (rank >= 50) {
                        progressFill.style.backgroundColor = 'var(--accent-light-green)';
                    } else {
                        progressFill.style.backgroundColor = 'var(--accent-yellow)';
                    }
                }

                // Configurer un écouteur en temps réel pour les mises à jour
                const docRef = userDoc.docs[0].ref;
                docRef.onSnapshot((doc) => {
                    if (doc.exists) {
                        const updatedData = doc.data();
                        const newReferralsCount = updatedData.referralsCount || 0;
                        console.log('Mise à jour en temps réel - Parrainages:', newReferralsCount);
                        
                        // Mettre à jour l'interface avec les nouvelles données
                        if (referralsElement) {
                            referralsElement.textContent = newReferralsCount;
                        }
                        updateBattlePassProgress(newReferralsCount);
                    }
                });
            }

            // Démarrer le countdown avec gestion d'erreur
            try {
                updateCountdown();
                // Utiliser une variable globale pour pouvoir arrêter/redémarrer le timer si nécessaire
                if (window.countdownInterval) {
                    clearInterval(window.countdownInterval);
                }
                window.countdownInterval = setInterval(() => {
                    try {
                        updateCountdown();
                    } catch (error) {
                        console.error('❌ Erreur dans le timer countdown:', error);
                        // Redémarrer le timer après une erreur
                        setTimeout(() => {
                            if (!window.countdownInterval) {
                                window.countdownInterval = setInterval(updateCountdown, 1000);
                            }
                        }, 2000);
                    }
                }, 1000);
                console.log('⏰ Countdown démarré avec succès');
            } catch (error) {
                console.error('❌ Erreur lors du démarrage du countdown:', error);
            }

            // Démarrer l'écoute en temps réel du compteur (chargement initial déjà fait)
            startPreregistrationListener();

            console.log('🚀 Dashboard Dodje chargé avec succès');
            
            // Vérification supplémentaire que le countdown fonctionne après 3 secondes
            setTimeout(() => {
                if (!window.countdownInterval) {
                    console.warn('⚠️ Countdown non démarré, tentative de redémarrage...');
                    window.restartCountdown();
                }
            }, 3000);
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            // Essayer de démarrer au moins le countdown même si le reste échoue
            setTimeout(() => {
                try {
                    window.restartCountdown();
                } catch (err) {
                    console.error('❌ Impossible de démarrer le countdown:', err);
                }
            }, 1000);
        }
    }

    function updateBattlePassProgress(referralsCount) {
        console.log('Mise à jour de la progression -', referralsCount, 'parrainages');
        
        // Mettre à jour le score d'avancement
        const referralsCountElement = document.getElementById('referrals-count');
        if (referralsCountElement) {
            referralsCountElement.textContent = referralsCount;
        }
        
        const requirements = [1, 5, 10, 25, 50, 100];
        let currentLevel = 1;
        let nextRequirement = 5;
        let progress = 0;

        // Si 0 parrainage, forcer la progression à 0
        if (referralsCount === 0) {
            progress = 0;
            currentLevel = 1;
            nextRequirement = 1;
        } else {
            // Trouver le niveau actuel et le prochain palier
            for (let i = 0; i < requirements.length - 1; i++) {
                if (referralsCount >= requirements[i] && referralsCount < requirements[i + 1]) {
                    currentLevel = i + 1;
                    nextRequirement = requirements[i + 1];
                    progress = ((referralsCount - requirements[i]) / (requirements[i + 1] - requirements[i])) * 100;
                    break;
                } else if (referralsCount >= requirements[requirements.length - 1]) {
                    currentLevel = requirements.length;
                    nextRequirement = requirements[requirements.length - 1];
                    progress = 100;
                }
            }
        }

        // Mettre à jour l'affichage du nombre de parrainages et du prochain palier
        const currentReferralsElement = document.getElementById('current-referrals');
        const nextRequirementElement = document.getElementById('next-level-requirement');
        
        if (currentReferralsElement) {
            currentReferralsElement.textContent = referralsCount;
        }
        if (nextRequirementElement) {
            nextRequirementElement.textContent = nextRequirement;
        }

        // Mettre à jour la barre de progression
        const progressBar = document.getElementById('battle-pass-fill');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        // Mettre à jour l'état des récompenses
        const rewardItems = document.querySelectorAll('.reward-item');
        rewardItems.forEach((item, index) => {
            const currentRequirement = requirements[index];
            
            if (referralsCount === 0 && index === 0) {
                // Premier niveau avec 0 parrainage : non débloqué
                item.classList.add('locked');
                item.classList.remove('unlocked', 'current-level');
            } else if (referralsCount >= currentRequirement) {
                // Niveau complètement débloqué
                item.classList.add('unlocked');
                item.classList.remove('locked', 'current-level');
            } else if (index > 0 && referralsCount >= requirements[index - 1]) {
                // Niveau en cours
                item.classList.add('locked', 'current-level');
                item.classList.remove('unlocked');
            } else {
                // Niveau verrouillé
                item.classList.add('locked');
                item.classList.remove('unlocked', 'current-level');
            }
        });

        console.log(`Progression mise à jour - Niveau ${currentLevel}, Progression: ${progress}%, Prochain palier: ${nextRequirement}`);
    }
    
    // ==================== FLAPPY BIRD GAME ==================== 
    let gameState = {
        isPlaying: false,
        isPaused: false,
        score: 0,
        bestScore: 0,
        bird: {
            x: 80,
            y: 200,
            width: 30,
            height: 30,
            velocity: 0,
            gravity: 0.4,
            jump: -9,
            color: '#06D001'
        },
        pipes: [],
        canvas: null,
        ctx: null,
        gameLoop: null,
        frameCount: 0,
        trunkImage: null,
        backgroundVideo: null,
        lastDeathTime: 0,
        clickDelay: 500
    };

    function initGame() {
        gameState.canvas = document.getElementById('gameCanvas');
        gameState.ctx = gameState.canvas.getContext('2d');
        
        // Charger l'image du tronc
        gameState.trunkImage = new Image();
        gameState.trunkImage.src = 'assets/Tronc.png';
        
        // Créer et configurer la vidéo d'arrière-plan
        gameState.backgroundVideo = document.createElement('video');
        gameState.backgroundVideo.src = 'assets/anime/FondAnime.mp4';
        gameState.backgroundVideo.loop = true;
        gameState.backgroundVideo.muted = true;
        gameState.backgroundVideo.autoplay = true;
        gameState.backgroundVideo.playsinline = true;
        
        // Démarrer la vidéo
        gameState.backgroundVideo.play().catch(e => {
            console.log('Impossible de démarrer la vidéo d\'arrière-plan:', e);
        });
        
        // Réinitialiser le score au démarrage
        gameState.bestScore = 0;
        updateScoreDisplay();
        
        // Toujours charger le meilleur score depuis Firebase en temps réel
        loadBestScoreFromFirebase();
        
        // Événements de contrôle
        gameState.canvas.addEventListener('click', jump);
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                
                // Vérifier si le délai après la mort est respecté
                const currentTime = Date.now();
                if (currentTime - gameState.lastDeathTime < gameState.clickDelay) {
                    return;
                }
                
                if (gameState.isPlaying) {
                    jump();
                } else {
                    // Démarrer le jeu si il n'est pas lancé
                    window.startGame();
                }
            }
        });
        
        draw();
    }

    function jump() {
        // Vérifier si le délai après la mort est respecté
        const currentTime = Date.now();
        if (currentTime - gameState.lastDeathTime < gameState.clickDelay) {
            return;
        }
        
        if (!gameState.isPlaying) return;
        gameState.bird.velocity = gameState.bird.jump;
    }

    function createPipe() {
        // Calcul de la difficulté basée sur le score
        const difficulty = getDifficultySettings(gameState.score);
        
        const gap = difficulty.gap;
        const minHeight = 50;
        const maxHeight = gameState.canvas.height - gap - minHeight;
        const height = Math.random() * (maxHeight - minHeight) + minHeight;
        
        return {
            x: gameState.canvas.width,
            topHeight: height,
            bottomY: height + gap,
            bottomHeight: gameState.canvas.height - (height + gap),
            width: 50,
            passed: false,
            speed: difficulty.pipeSpeed // Ajouter la vitesse individuelle
        };
    }

    // Fonction pour calculer les paramètres de difficulté basés sur le score
    function getDifficultySettings(score) {
        // Vitesse de base des tuyaux
        const basePipeSpeed = 2.5;
        // Augmentation de la vitesse tous les 5 points (max +2.5)
        const speedIncrease = Math.min(2.5, Math.floor(score / 5) * 0.3);
        
        // Gap de base entre les tuyaux
        const baseGap = 180;
        // Réduction du gap tous les 10 points (max -30 pixels)
        const gapReduction = Math.min(30, Math.floor(score / 10) * 5);
        
        // Fréquence de base d'apparition (tous les 110 frames)
        const baseFrequency = 110;
        // Augmentation de la fréquence tous les 8 points (max -30 frames)
        const frequencyReduction = Math.min(30, Math.floor(score / 8) * 4);
        
        // Gravité de base
        const baseGravity = 0.4;
        // Augmentation de la gravité tous les 15 points (max +0.15)
        const gravityIncrease = Math.min(0.15, Math.floor(score / 15) * 0.02);
        
        return {
            pipeSpeed: basePipeSpeed + speedIncrease,
            gap: baseGap - gapReduction,
            spawnFrequency: baseFrequency - frequencyReduction,
            gravity: baseGravity + gravityIncrease
        };
    }

    function updateGame() {
        if (!gameState.isPlaying) return;
        
        gameState.frameCount++;
        
        // Calculer la difficulté actuelle
        const difficulty = getDifficultySettings(gameState.score);
        
        // Mise à jour de l'oiseau avec gravité progressive
        gameState.bird.velocity += difficulty.gravity;
        gameState.bird.y += gameState.bird.velocity;
        
        // Générer des tuyaux avec fréquence variable
        if (gameState.frameCount % difficulty.spawnFrequency === 0) {
            gameState.pipes.push(createPipe());
        }
        
        // Mise à jour des tuyaux avec vitesse individuelle
        gameState.pipes = gameState.pipes.filter(pipe => {
            // Utiliser la vitesse individuelle du tuyau ou la vitesse actuelle si pas définie
            const pipeSpeed = pipe.speed || difficulty.pipeSpeed;
            pipe.x -= pipeSpeed;
            
            // Vérifier le score
            if (!pipe.passed && pipe.x + pipe.width < gameState.bird.x) {
                pipe.passed = true;
                gameState.score++;
                updateScoreDisplay();
            }
            
            return pipe.x + pipe.width > 0;
        });
        
        // Vérifier les collisions
        checkCollisions();
    }

    function checkCollisions() {
        // Collision avec le sol ou le plafond
        if (gameState.bird.y + gameState.bird.height > gameState.canvas.height || 
            gameState.bird.y < 0) {
            gameOver();
            return;
        }
        
        // Collision avec les tuyaux
        gameState.pipes.forEach(pipe => {
            if (gameState.bird.x < pipe.x + pipe.width &&
                gameState.bird.x + gameState.bird.width > pipe.x) {
                
                if (gameState.bird.y < pipe.topHeight ||
                    gameState.bird.y + gameState.bird.height > pipe.bottomY) {
                    gameOver();
                }
            }
        });
    }

    function draw() {
        // Effacer le canvas
        gameState.ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
        
        // Dessiner l'arrière-plan vidéo
        if (gameState.backgroundVideo && gameState.backgroundVideo.readyState >= 2) {
            gameState.ctx.drawImage(
                gameState.backgroundVideo,
                0, 0, gameState.canvas.width, gameState.canvas.height
            );
        } else {
            // Fallback : gradient si la vidéo n'est pas prête
            const gradient = gameState.ctx.createLinearGradient(0, 0, 0, gameState.canvas.height);
            gradient.addColorStop(0, '#001122');
            gradient.addColorStop(1, '#002244');
            gameState.ctx.fillStyle = gradient;
            gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
        }
        
        // Dessiner les étoiles uniquement si la vidéo n'est pas disponible
        if (!gameState.backgroundVideo || gameState.backgroundVideo.readyState < 2) {
            drawStars();
        }
        
        // Dessiner les tuyaux
        gameState.pipes.forEach(pipe => {
            drawPipe(pipe);
        });
        
        // Dessiner l'oiseau
        drawBird();
        
        // Dessiner le score pendant le jeu
        if (gameState.isPlaying) {
            drawScore();
        }
    }

    function drawStars() {
        gameState.ctx.fillStyle = '#9BEC00';
        for (let i = 0; i < 50; i++) {
            const x = (i * 163) % gameState.canvas.width;
            const y = (i * 97) % gameState.canvas.height;
            gameState.ctx.beginPath();
            gameState.ctx.arc(x, y, 1, 0, Math.PI * 2);
            gameState.ctx.fill();
        }
    }

    function drawPipe(pipe) {
        if (!gameState.trunkImage || !gameState.trunkImage.complete) {
            // Fallback : dessiner des rectangles si l'image n'est pas chargée
            const topGradient = gameState.ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
            topGradient.addColorStop(0, '#06D001');
            topGradient.addColorStop(1, '#9BEC00');
            gameState.ctx.fillStyle = topGradient;
            gameState.ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
            
            const bottomGradient = gameState.ctx.createLinearGradient(pipe.x, pipe.bottomY, pipe.x + pipe.width, pipe.bottomY + pipe.bottomHeight);
            bottomGradient.addColorStop(0, '#06D001');
            bottomGradient.addColorStop(1, '#9BEC00');
            gameState.ctx.fillStyle = bottomGradient;
            gameState.ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight);
            return;
        }
        
        // Tuyau du haut
        gameState.ctx.save();
        gameState.ctx.translate(pipe.x + pipe.width/2, pipe.topHeight/2);
        gameState.ctx.rotate(-Math.PI/2); // Rotation de -90 degrés
        
        // Créer un clipping pour ne pas dépasser
        gameState.ctx.beginPath();
        gameState.ctx.rect(-pipe.topHeight/2, -pipe.width/2, pipe.topHeight, pipe.width);
        gameState.ctx.clip();
        
        // Dessiner l'image du tronc tournée
        gameState.ctx.drawImage(
            gameState.trunkImage,
            -pipe.topHeight/2, -pipe.width/2, pipe.topHeight, pipe.width
        );
        
        gameState.ctx.restore();
        
        // Tuyau du bas
        gameState.ctx.save();
        gameState.ctx.translate(pipe.x + pipe.width/2, pipe.bottomY + pipe.bottomHeight/2);
        gameState.ctx.rotate(-Math.PI/2); // Rotation de -90 degrés
        
        // Créer un clipping pour ne pas dépasser
        gameState.ctx.beginPath();
        gameState.ctx.rect(-pipe.bottomHeight/2, -pipe.width/2, pipe.bottomHeight, pipe.width);
        gameState.ctx.clip();
        
        // Dessiner l'image du tronc tournée
        gameState.ctx.drawImage(
            gameState.trunkImage,
            -pipe.bottomHeight/2, -pipe.width/2, pipe.bottomHeight, pipe.width
        );
        
        gameState.ctx.restore();
    }

    function drawBird() {
        // Corps de l'oiseau
        const birdGradient = gameState.ctx.createRadialGradient(
            gameState.bird.x + gameState.bird.width/2, 
            gameState.bird.y + gameState.bird.height/2, 
            0, 
            gameState.bird.x + gameState.bird.width/2, 
            gameState.bird.y + gameState.bird.height/2, 
            gameState.bird.width/2
        );
        birdGradient.addColorStop(0, '#9BEC00');
        birdGradient.addColorStop(1, '#06D001');
        
        gameState.ctx.fillStyle = birdGradient;
        gameState.ctx.beginPath();
        gameState.ctx.arc(
            gameState.bird.x + gameState.bird.width/2, 
            gameState.bird.y + gameState.bird.height/2, 
            gameState.bird.width/2, 
            0, 
            Math.PI * 2
        );
        gameState.ctx.fill();
        
        // Contour de l'oiseau
        gameState.ctx.strokeStyle = '#F3FF90';
        gameState.ctx.lineWidth = 2;
        gameState.ctx.stroke();
        
        // Oeil
        gameState.ctx.fillStyle = '#000000';
        gameState.ctx.beginPath();
        gameState.ctx.arc(
            gameState.bird.x + gameState.bird.width/2 + 5, 
            gameState.bird.y + gameState.bird.height/2 - 5, 
            3, 
            0, 
            Math.PI * 2
        );
        gameState.ctx.fill();
    }

    function drawScore() {
        gameState.ctx.font = '36px Arboria, Arial, sans-serif';
        gameState.ctx.fillStyle = '#F3FF90';
        gameState.ctx.textAlign = 'center';
        gameState.ctx.fillText(gameState.score, gameState.canvas.width / 2, 50);
    }

    function updateScoreDisplay() {
        document.getElementById('current-score').textContent = gameState.score;
        document.getElementById('best-score').textContent = gameState.bestScore;
        console.log('Score affiché - Current:', gameState.score, 'Best:', gameState.bestScore);
    }

    function gameOver() {
        gameState.isPlaying = false;
        
        // Enregistrer le timestamp de la mort pour le délai
        gameState.lastDeathTime = Date.now();
        
        // Sauvegarder le meilleur score
        if (gameState.score > gameState.bestScore) {
            gameState.bestScore = gameState.score;
            localStorage.setItem('dodje_bird_best_score', gameState.bestScore);
            saveBestScoreToFirebase(gameState.bestScore);
        }
        
        // Afficher l'écran de fin
        document.getElementById('finalScore').textContent = gameState.score;
        document.getElementById('finalBestScore').textContent = gameState.bestScore;
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'block';
        document.getElementById('gameOverlay').style.display = 'flex';
        
        if (gameState.gameLoop) {
            clearInterval(gameState.gameLoop);
        }
    }

    function resetGame() {
        gameState.bird.x = 80;
        gameState.bird.y = 200;
        gameState.bird.velocity = 0;
        gameState.pipes = [];
        gameState.score = 0;
        gameState.frameCount = 0;
        updateScoreDisplay();
    }

    async function saveBestScoreToFirebase(score) {
        try {
            const user = getUserFromCache();
            if (!user || !user.username) return;
            
            await db.collection('preinscription_public').doc(user.username).update({
                bestFlappyBirdScore: score,
                lastGamePlayed: new Date().toISOString()
            });
            console.log('Score sauvegardé dans Firebase:', score);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du score:', error);
        }
    }

    async function loadBestScoreFromFirebase() {
        try {
            const user = getUserFromCache();
            if (!user || !user.username) return;
            
            const userDoc = await db.collection('preinscription_public').doc(user.username).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const firebaseScore = userData.bestFlappyBirdScore || 0;
                
                // Toujours mettre à jour avec le score Firebase de l'utilisateur actuel
                gameState.bestScore = firebaseScore;
                localStorage.setItem('dodje_bird_best_score', gameState.bestScore);
                updateScoreDisplay();
                
                console.log('Score Firebase chargé pour', user.username, ':', firebaseScore);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du score:', error);
        }
    }

    // Fonctions globales pour les boutons
    window.startGame = async function() {
        // Vérifier si le délai après la mort est respecté
        const currentTime = Date.now();
        if (currentTime - gameState.lastDeathTime < gameState.clickDelay) {
            return;
        }
        
        // Vérifier l'utilisateur avant de commencer
        await refreshUserScore();
        
        resetGame();
        gameState.isPlaying = true;
        document.getElementById('gameOverlay').style.display = 'none';
        
        gameState.gameLoop = setInterval(() => {
            updateGame();
            draw();
        }, 1000 / 60); // 60 FPS
    };

    window.restartGame = function() {
        // Vérifier si le délai après la mort est respecté
        const currentTime = Date.now();
        if (currentTime - gameState.lastDeathTime < gameState.clickDelay) {
            return;
        }
        
        window.startGame();
    };

    // ==================== LEADERBOARD FUNCTIONS ====================
    async function loadLeaderboard() {
        try {
            const snapshot = await db.collection('preinscription_public')
                .where('bestFlappyBirdScore', '>', 0)
                .orderBy('bestFlappyBirdScore', 'desc')
                .limit(50)
                .get();

            const scores = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                scores.push({
                    username: data.username,
                    score: data.bestFlappyBirdScore
                });
            });

            return scores;
        } catch (error) {
            console.error('Erreur lors du chargement du leaderboard:', error);
            return [];
        }
    }

    // ==================== REFERRALS LEADERBOARD FUNCTIONS ====================
    async function loadReferralsLeaderboard() {
        try {
            const snapshot = await db.collection('preinscription_public')
                .where('referralsCount', '>', 0)
                .orderBy('referralsCount', 'desc')
                .limit(50)
                .get();

            const scores = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                scores.push({
                    username: data.username,
                    referralsCount: data.referralsCount
                });
            });

            return scores;
        } catch (error) {
            console.error('Erreur lors du chargement du leaderboard des parrainages:', error);
            return [];
        }
    }

    async function displayReferralsLeaderboard() {
        const leaderboardLoading = document.getElementById('referralsLeaderboardLoading');
        const leaderboardList = document.getElementById('referralsLeaderboardList');
        
        leaderboardLoading.style.display = 'block';
        leaderboardList.innerHTML = '';
        
        try {
            const referrals = await loadReferralsLeaderboard();
            const currentUser = getUserFromCache();
            
            leaderboardLoading.style.display = 'none';
            
            if (referrals.length === 0) {
                leaderboardList.innerHTML = '<div class="leaderboard-empty">Aucun parrainage enregistré</div>';
                return;
            }
            
            referrals.forEach((referral, index) => {
                const item = document.createElement('div');
                item.className = 'leaderboard-item';
                
                if (currentUser && referral.email === currentUser.email) {
                    item.classList.add('current-user');
                }
                
                const rank = index + 1;
                let rankClass = '';
                if (rank === 1) rankClass = 'gold';
                else if (rank === 2) rankClass = 'silver';
                else if (rank === 3) rankClass = 'bronze';
                
                const plural = referral.referralsCount > 1 ? 's' : '';
                
                item.innerHTML = `
                    <span class="leaderboard-rank ${rankClass}">${rank}</span>
                    <span class="leaderboard-username">${referral.username}</span>
                    <span class="leaderboard-score">${referral.referralsCount} parrainage${plural}</span>
                `;
                
                leaderboardList.appendChild(item);
            });
            
        } catch (error) {
            leaderboardLoading.style.display = 'none';
            leaderboardList.innerHTML = '<div class="leaderboard-error">Erreur lors du chargement</div>';
        }
    }

    async function displayLeaderboard() {
        const leaderboardLoading = document.getElementById('leaderboardLoading');
        const leaderboardList = document.getElementById('leaderboardList');
        
        leaderboardLoading.style.display = 'block';
        leaderboardList.innerHTML = '';
        
        try {
            const scores = await loadLeaderboard();
            const currentUser = getUserFromCache();
            
            leaderboardLoading.style.display = 'none';
            
            if (scores.length === 0) {
                leaderboardList.innerHTML = '<div class="leaderboard-empty">Aucun score enregistré</div>';
                return;
            }
            
            scores.forEach((score, index) => {
                const item = document.createElement('div');
                item.className = 'leaderboard-item';
                
                if (currentUser && score.username === currentUser.username) {
                    item.classList.add('current-user');
                }
                
                const rank = index + 1;
                let rankClass = '';
                if (rank === 1) rankClass = 'gold';
                else if (rank === 2) rankClass = 'silver';
                else if (rank === 3) rankClass = 'bronze';
                
                item.innerHTML = `
                    <span class="leaderboard-rank ${rankClass}">${rank}</span>
                    <span class="leaderboard-username">${score.username}</span>
                    <span class="leaderboard-score">${score.score}</span>
                `;
                
                leaderboardList.appendChild(item);
            });
            
        } catch (error) {
            leaderboardLoading.style.display = 'none';
            leaderboardList.innerHTML = '<div class="leaderboard-error">Erreur lors du chargement</div>';
        }
    }



    window.toggleLeaderboard = function() {
        const leaderboardPopup = document.getElementById('leaderboardPopup');
        
        // Afficher la popup
        leaderboardPopup.style.display = 'flex';
        
        // Charger les données
        displayLeaderboard();
    };

    window.closeLeaderboard = function() {
        const leaderboardPopup = document.getElementById('leaderboardPopup');
        
        leaderboardPopup.style.display = 'none';
    };

    // ==================== REFERRALS LEADERBOARD POPUP FUNCTIONS ====================
    window.toggleReferralsLeaderboard = function() {
        const referralsLeaderboardPopup = document.getElementById('referralsLeaderboardPopup');
        
        // Afficher la popup
        referralsLeaderboardPopup.style.display = 'flex';
        
        // Charger les données
        displayReferralsLeaderboard();
    };

    window.closeReferralsLeaderboard = function() {
        const referralsLeaderboardPopup = document.getElementById('referralsLeaderboardPopup');
        
        referralsLeaderboardPopup.style.display = 'none';
    };

    // Fermer les popups en cliquant en dehors
    document.addEventListener('click', function(e) {
        const leaderboardPopup = document.getElementById('leaderboardPopup');
        const referralsLeaderboardPopup = document.getElementById('referralsLeaderboardPopup');
        
        // Fermer popup du jeu
        if (e.target === leaderboardPopup) {
            closeLeaderboard();
        }
        
        // Fermer popup des parrainages
        if (e.target === referralsLeaderboardPopup) {
            closeReferralsLeaderboard();
        }
    });

    // Fermer les popups avec la touche Échap
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const leaderboardPopup = document.getElementById('leaderboardPopup');
            const referralsLeaderboardPopup = document.getElementById('referralsLeaderboardPopup');
            
            if (leaderboardPopup.style.display === 'flex') {
                closeLeaderboard();
            }
            
            if (referralsLeaderboardPopup.style.display === 'flex') {
                closeReferralsLeaderboard();
            }
        }
    });



    // Variable pour tracker l'utilisateur actuel
    let currentGameUser = null;

    // Fonction pour recharger le meilleur score de l'utilisateur actuel
    async function refreshUserScore() {
        const user = getUserFromCache();
        if (!user || !user.email) return;
        
        // Vérifier si l'utilisateur a changé
        if (currentGameUser !== user.email) {
            console.log('Changement d\'utilisateur détecté:', currentGameUser, '->', user.email);
            currentGameUser = user.email;
            
            // Réinitialiser le score et charger depuis Firebase
            gameState.bestScore = 0;
            updateScoreDisplay();
            await loadBestScoreFromFirebase();
        }
    }

    // Rendre la fonction disponible globalement
    window.refreshUserScore = refreshUserScore;

    // Initialiser le jeu quand la page se charge
    setTimeout(() => {
        initGame();
        refreshUserScore();
        
        // Vérifier périodiquement les changements d'utilisateur
        setInterval(() => {
            refreshUserScore();
        }, 5000); // Vérifier toutes les 5 secondes
    }, 1000);
    
    // Démarrer l'application
    init();
});

// ==================== SHARE FUNCTIONALITY ====================

// Variables globales pour le partage
let shareData = {
    username: '',
    founderCode: '',
    referralsCount: 0,
    flappyScore: 0
};

// Fonction pour ouvrir/fermer la popup de partage
async function toggleShareCard() {
    const sharePopup = document.getElementById('sharePopup');
    const isOpening = !sharePopup.classList.contains('active');
    
    // Si on ouvre la popup de partage depuis le menu mobile, fermer le menu mobile
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    if (isOpening && mobileMenu && mobileMenu.classList.contains('active')) {
        console.log('🔄 Fermeture du menu mobile avant ouverture popup partage');
        mobileMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (isOpening) {
        sharePopup.style.display = 'flex';
        
        // Essayer de récupérer les données depuis la popup info si elle a déjà été ouverte
        const existingReferrals = document.getElementById('user-referrals-info')?.textContent;
        const existingFlappy = document.getElementById('user-flappy-info')?.textContent;
        
        console.log('🔍 Données existantes popup info:', { existingReferrals, existingFlappy });
        
        // Initialiser avec des données par défaut avant de récupérer les vraies données
        const user = getUserFromCache();
        if (user) {
            shareData.username = user.username || 'Gland Anonyme';
            shareData.founderCode = user.generatedFounderCode || user.founderCode || 'N/A';
            
            // Si les données de la popup info existent, les extraire avec classements
            if (existingReferrals && existingReferrals !== '--') {
                const referralsMatch = existingReferrals.match(/^(\d+)/);
                shareData.referralsCount = referralsMatch ? parseInt(referralsMatch[1]) : 0;
                shareData.referralsRanking = existingReferrals; // Garder le texte complet avec classement
            } else {
                shareData.referralsCount = 0;
                shareData.referralsRanking = '0';
            }
            
            if (existingFlappy && existingFlappy !== '--' && existingFlappy !== 'Pas encore joué') {
                const flappyMatch = existingFlappy.match(/^(\d+) pts/);
                shareData.flappyScore = flappyMatch ? parseInt(flappyMatch[1]) : 0;
                shareData.flappyRanking = existingFlappy; // Garder le texte complet avec classement
            } else {
                shareData.flappyScore = 0;
                shareData.flappyRanking = 'Pas encore joué';
            }
            
            console.log('📊 Données initiales extraites:', shareData);
            updateShareCardDisplay();
        }
        
        // S'assurer que les données utilisateur sont chargées
        if (user && (!existingReferrals || existingReferrals === '--')) {
            console.log('🔄 Forcer le chargement initial des données utilisateur...');
            // Au lieu d'appeler updateUserInfoForPopup, on va juste forcer updateShareDataFromSameSource
        }
        
        // Mettre à jour les données de partage depuis Firestore
        await updateShareDataFromSameSource();
        
        // Ouvrir la popup avec animation
        setTimeout(() => {
            sharePopup.classList.add('active');
        }, 10);
    } else {
        // Fermer la popup avec animation
        sharePopup.classList.remove('active');
        setTimeout(() => {
            sharePopup.style.display = 'none';
        }, 300);
    }
}

// Fonction pour mettre à jour les données de partage
async function updateShareData() {
    try {
        const user = getUserFromCache();
        if (!user) {
            console.log('❌ Aucun utilisateur en cache');
            return;
        }

        console.log('🔄 Mise à jour des données de partage...', user);
        
        // Récupérer les données actualisées depuis Firestore
        const userDoc = await db.collection('preinscription_public').doc(user.username).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('📋 Données Firestore récupérées complètes:', userData);
            console.log('🔍 Clés disponibles dans userData:', Object.keys(userData));
            
            // Mettre à jour shareData en cherchant tous les noms de champs possibles
            shareData.username = userData.username || user.username || 'Gland Anonyme';
            shareData.founderCode = userData.generatedFounderCode || userData.founderCode || user.generatedFounderCode || user.founderCode || 'N/A';
            
            // Chercher le nombre de parrainages sous différents noms
            shareData.referralsCount = userData.referralsCount || userData.referrals || userData.parrainagesCount || userData.parrainages || 0;
            
            // Chercher le score Flappy sous différents noms  
            shareData.flappyScore = userData.bestFlappyBirdScore || userData.flappyScore || userData.bestScore || userData.maxScore || userData.flappyBirdScore || 0;
            
            console.log('📊 Données de partage mises à jour depuis Firestore:', shareData);
            console.log('🎯 Champs testés pour parrainages:', {
                referralsCount: userData.referralsCount,
                referrals: userData.referrals,
                parrainagesCount: userData.parrainagesCount,
                parrainages: userData.parrainages
            });
            console.log('🎮 Champs testés pour Flappy:', {
                bestFlappyBirdScore: userData.bestFlappyBirdScore,
                flappyScore: userData.flappyScore,
                bestScore: userData.bestScore,
                maxScore: userData.maxScore,
                flappyBirdScore: userData.flappyBirdScore
            });
            
            // Mettre à jour l'affichage dans la card de partage
            updateShareCardDisplay();
        } else {
            console.log('❌ Aucun document utilisateur trouvé, utilisation des données du cache');
            // Utiliser les données du cache si disponibles
            shareData.username = user.username || 'Gland Anonyme';
            shareData.founderCode = user.generatedFounderCode || user.founderCode || 'N/A';
            shareData.referralsCount = user.referralsCount || 0;
            shareData.flappyScore = user.bestFlappyBirdScore || user.flappyScore || 0;
            
            console.log('📊 Données de partage mises à jour depuis le cache:', shareData);
            updateShareCardDisplay();
        }
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des données de partage:', error);
        
        // Fallback avec les données du cache
        const user = getUserFromCache();
        if (user) {
            shareData.username = user.username || 'Gland Anonyme';
            shareData.founderCode = user.generatedFounderCode || user.founderCode || 'N/A';
            shareData.referralsCount = 0;
            shareData.flappyScore = 0;
            updateShareCardDisplay();
        }
    }
}

// Fonction pour mettre à jour l'affichage de la card de partage
function updateShareCardDisplay() {
    console.log('🔄 Mise à jour affichage card avec:', shareData);
    
    const usernameEl = document.getElementById('share-username');
    const referralsEl = document.getElementById('share-referrals');
    const flappyEl = document.getElementById('share-flappy-score');
    const founderCodeEl = document.getElementById('share-founder-code');
    
    console.log('🎯 Éléments DOM trouvés:', {
        username: !!usernameEl,
        referrals: !!referralsEl,
        flappy: !!flappyEl,
        founderCode: !!founderCodeEl
    });
    
    if (usernameEl) {
        usernameEl.textContent = shareData.username || 'Utilisateur';
        console.log('✅ Username mis à jour:', shareData.username);
    }
    if (referralsEl) {
        const referralsText = shareData.referralsRanking || shareData.referralsCount || '0';
        referralsEl.textContent = referralsText;
        console.log('✅ Parrainages mis à jour:', referralsText);
    }
    if (flappyEl) {
        const flappyText = shareData.flappyRanking || (shareData.flappyScore === 0 ? 'Pas encore joué' : `${shareData.flappyScore} pts`);
        flappyEl.textContent = flappyText;
        console.log('✅ Flappy score mis à jour:', flappyText);
    }
    if (founderCodeEl) {
        founderCodeEl.textContent = shareData.founderCode || 'N/A';
        console.log('✅ Code fondateur mis à jour:', shareData.founderCode);
    }
    
    console.log('✅ Affichage card mis à jour complètement');
}

// Fonction pour mettre à jour les données de partage avec la même logique que la popup info
async function updateShareDataFromSameSource() {
    try {
        const user = getUserFromCache();
        if (!user) {
            console.log('❌ Aucun utilisateur en cache pour le partage');
            return;
        }

        console.log('🔄 Mise à jour données partage avec même source que popup info...', user.email);
        
        // Utiliser exactement la même requête que updateUserInfoForPopup
        const userDoc = await db.collection('preinscription_public').doc(user.username).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('📋 Données Firestore pour partage (même source):', userData);
            
            // Utiliser exactement les mêmes champs que updateUserInfoForPopup
            shareData.username = userData.username || user.username || 'Gland Anonyme';
            shareData.founderCode = userData.generatedFounderCode || user.generatedFounderCode || user.founderCode || 'N/A';
            
            // Récupérer les scores bruts
            const referralsCount = userData.referralsCount || 0;
            const flappyScore = userData.bestFlappyBirdScore || 0;
            
            console.log('📈 Stats brutes:', { referralsCount, flappyScore });
            
            // Calculer les classements comme dans updateUserInfoForPopup
            const referralsRanking = await getReferralsRanking(referralsCount);
            shareData.referralsCount = referralsCount;
            shareData.referralsRanking = `${referralsCount} (${referralsRanking.position}/${referralsRanking.total})`;
            
            if (flappyScore > 0) {
                const flappyRanking = await getFlappyRanking(flappyScore);
                shareData.flappyScore = flappyScore;
                shareData.flappyRanking = `${flappyScore} pts (${flappyRanking.position}/${flappyRanking.total})`;
            } else {
                shareData.flappyScore = 0;
                shareData.flappyRanking = 'Pas encore joué';
            }
            
            console.log('📊 Données de partage avec classements:', shareData);
            
            // Mettre à jour l'affichage
            updateShareCardDisplay();
        } else {
            console.log('❌ Aucun document utilisateur trouvé pour le partage');
            // Garder les données déjà extraites de la popup info si disponibles
        }
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour partage (même source):', error);
        // Garder les données déjà extraites de la popup info si disponibles
    }
}

// Fonction principale de partage en tant qu'image
async function shareAsImage(platform) {
    try {
        console.log(`📸 Génération de l'image pour ${platform}...`);
        showLoadingFeedback(platform);
        
        // Créer une image de la card
        const canvas = await generateShareImage();
        
        // Convertir le canvas en blob
        canvas.toBlob(async (blob) => {
            const file = new File([blob], `dodje-stats-${shareData.username}.png`, { type: 'image/png' });
            
            // Essayer le partage natif moderne d'abord (iOS/Android)
            if (await tryNativeShare(file, platform)) {
                hideLoadingFeedback(platform);
                return;
            }
            
            // Copier l'image dans le presse-papier si possible
            await copyImageToClipboard(canvas, platform);
            
            // Ouvrir directement le réseau social avec instructions
            await openSocialWithInstructions(platform, blob);
            
            hideLoadingFeedback(platform);
            
        }, 'image/png');
        
    } catch (error) {
        console.error('❌ Erreur lors du partage:', error);
        hideLoadingFeedback(platform);
        showErrorMessage('Erreur lors de la génération de l\'image. Veuillez réessayer.');
    }
}

// Essayer le partage natif moderne
async function tryNativeShare(file, platform) {
    if (!navigator.share) return false;
    
    try {
        // Vérifier si le partage de fichiers est supporté
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            const shareText = generatePlatformSpecificText(platform);
            await navigator.share({
                title: 'Mes stats Dodje',
                text: shareText,
                files: [file]
            });
            console.log('✅ Partage natif réussi !');
            return true;
        }
        
        // Fallback : partage texte seulement si fichiers non supportés
        const shareText = generatePlatformSpecificText(platform);
        await navigator.share({
            title: 'Mes stats Dodje',
            text: shareText + '\n\n🖼️ Image disponible dans le presse-papier',
            url: 'https://dodje.xyz'
        });
        console.log('✅ Partage texte natif réussi !');
        return true;
        
    } catch (error) {
        console.log('🔄 Partage natif échoué:', error);
        return false;
    }
}

// Copier l'image dans le presse-papier si possible
async function copyImageToClipboard(canvas, platform) {
    try {
        // Vérifier si l'API Clipboard est disponible
        if (!navigator.clipboard || !navigator.clipboard.write) {
            console.log('📋 API Clipboard non disponible');
            return false;
        }
        
        // Convertir le canvas en blob
        return new Promise((resolve) => {
            canvas.toBlob(async (blob) => {
                try {
                    const clipboardItem = new ClipboardItem({ 'image/png': blob });
                    await navigator.clipboard.write([clipboardItem]);
                    console.log('✅ Image copiée dans le presse-papier !');
                    
                    // Feedback visuel rapide
                    showToast(`📋 Image copiée ! Ouvre ${getPlatformName(platform)} et colle-la`);
                    resolve(true);
                } catch (error) {
                    console.log('📋 Échec copie presse-papier:', error);
                    resolve(false);
                }
            }, 'image/png');
        });
        
    } catch (error) {
        console.log('📋 Erreur presse-papier:', error);
        return false;
    }
}

// Ouvrir le réseau social avec instructions optimisées
async function openSocialWithInstructions(platform, blob) {
    const shareText = generatePlatformSpecificText(platform);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    switch (platform) {
        case 'twitter':
            await handleTwitterShare(shareText, isMobile, blob);
            break;
            
        case 'discord':
            await handleDiscordShare(isMobile, blob);
            break;
            
        case 'instagram':
            await handleInstagramShare(isMobile, blob);
            break;
    }
}

// Gestion spécifique Twitter
async function handleTwitterShare(shareText, isMobile, blob) {
    const encodedText = encodeURIComponent(shareText);
    
    // Toujours ouvrir Twitter avec le texte pré-rempli
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    
    if (isMobile) {
        // Sur mobile, essayer l'app d'abord
        try {
            window.location.href = `twitter://post?message=${encodedText}`;
            // Fallback web après délai
            setTimeout(() => {
                window.open(twitterUrl, '_blank');
            }, 1500);
        } catch {
            window.open(twitterUrl, '_blank');
        }
    } else {
        // Desktop : ouvrir directement
        window.open(twitterUrl, '_blank');
    }
    
         // Instructions claires
     showInstructionModal('Twitter', 
         '📝 Texte pré-rempli !', 
         isMobile ? 
         'Le texte est prêt. Clique sur l\'icône photo/média pour ajouter l\'image depuis ton presse-papier ou galerie.' :
         'Le texte est prêt. Utilise Ctrl+V pour coller ton image, ou clique sur l\'icône photo pour l\'ajouter.'
     );
}

// Gestion spécifique Discord  
async function handleDiscordShare(isMobile, blob) {
    if (isMobile) {
        try {
            // Essayer d'ouvrir l'app Discord
            window.location.href = 'discord://';
            setTimeout(() => {
                window.open('https://discord.com/channels/@me', '_blank');
            }, 1500);
        } catch {
            window.open('https://discord.com/channels/@me', '_blank');
        }
    } else {
        // Desktop : ouvrir Discord web directement
        window.open('https://discord.com/channels/@me', '_blank');
    }
    
    showInstructionModal('Discord',
        '🎮 Prêt à partager !',
        isMobile ?
        'Va dans ton serveur ou conversation. L\'image est dans ton presse-papier - colle-la avec un appui long ou utilise l\'icône +.' :
        'Va dans ton serveur ou conversation. Utilise Ctrl+V pour coller l\'image ou clique sur + pour l\'ajouter.'
    );
}

// Gestion spécifique Instagram
async function handleInstagramShare(isMobile, blob) {
    if (isMobile) {
        try {
            // Essayer d'ouvrir la caméra Instagram pour story
            window.location.href = 'instagram://camera';
            setTimeout(() => {
                window.open('https://www.instagram.com/', '_blank');
            }, 1500);
        } catch {
            window.open('https://www.instagram.com/', '_blank');
        }
        
        showInstructionModal('Instagram',
            '📸 Prêt pour ta story !',
            'L\'image est dans ton presse-papier. Va dans tes stories, clique sur l\'icône galerie et sélectionne ton image.'
        );
    } else {
        // Desktop : télécharger l'image d'abord
        downloadImageForDesktop(blob, 'instagram');
        
        setTimeout(() => {
            window.open('https://www.instagram.com/', '_blank');
        }, 1000);
        
        showInstructionModal('Instagram', 
            '💻 Image téléchargée !',
            'L\'image a été téléchargée. Va sur Instagram web et utilise-la pour créer ton post ou story.'
        );
    }
}

// Fonctions utilitaires pour le partage
function getPlatformName(platform) {
    switch (platform) {
        case 'twitter': return 'Twitter';
        case 'discord': return 'Discord';
        case 'instagram': return 'Instagram';
        default: return platform;
    }
}

function generatePlatformSpecificText(platform) {
    const referralsText = shareData.referralsRanking || `${shareData.referralsCount} parrainages`;
    const flappyText = shareData.flappyRanking || (shareData.flappyScore === 0 ? 'pas encore joué' : `${shareData.flappyScore} pts`);
    
    switch (platform) {
        case 'twitter':
            return `🌰 Mes stats #Dodje !
👥 ${referralsText}  
🎮 Flappy Dodje: ${flappyText}
👑 Code: ${shareData.founderCode}

Rejoins-moi sur dodje.xyz ! 🚀 #FinanceSimple`;

        case 'discord':
            return `**🌰 Mes stats Dodje !**
👥 Parrainages: **${referralsText}**
🎮 Flappy Dodje: **${flappyText}**
👑 Code fondateur: \`${shareData.founderCode}\`

Rejoins-moi sur **dodje.xyz** ! 🚀`;

        case 'instagram':
            return `🌰 Mes stats Dodje !
👥 ${referralsText}
🎮 ${flappyText}  
👑 ${shareData.founderCode}

Rejoins-moi ! 🚀
#Dodje #Finance #Stats`;

        default:
            return generateSimpleShareText();
    }
}

// Toast notification simple
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #06D001, #9BEC00);
        color: #000000;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10002;
        box-shadow: 0 4px 15px rgba(6, 208, 1, 0.3);
        font-size: 14px;
        max-width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Animation d'entrée
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Animation de sortie et suppression
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Modal d'instructions avancée
function showInstructionModal(platform, title, message) {
    // Supprimer toute modal existante
    const existingModal = document.getElementById('shareInstructionModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'shareInstructionModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10003;
        backdrop-filter: blur(5px);
        animation: fadeIn 0.3s ease;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: linear-gradient(135deg, #001122, #002244);
        border: 2px solid #06D001;
        border-radius: 16px;
        padding: 2rem;
        max-width: 400px;
        margin: 1rem;
        text-align: center;
        color: #F3FF90;
        box-shadow: 0 20px 40px rgba(6, 208, 1, 0.2);
    `;
    
    modalContent.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 1rem;">
            ${platform === 'twitter' ? '🐦' : platform === 'discord' ? '🎮' : '📸'}
        </div>
        <h3 style="color: #06D001; margin: 0 0 1rem 0; font-size: 1.5rem;">${title}</h3>
        <p style="line-height: 1.6; margin-bottom: 2rem; color: #F3FF90;">${message}</p>
        <button id="closeInstructionModal" style="
            background: linear-gradient(135deg, #06D001, #9BEC00);
            color: #000000;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-size: 1rem;
            transition: transform 0.2s ease;
        ">Compris !</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Styles d'animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        #closeInstructionModal:hover {
            transform: scale(1.05);
        }
    `;
    document.head.appendChild(style);
    
    // Event listeners
    document.getElementById('closeInstructionModal').addEventListener('click', () => {
        modal.remove();
        style.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            style.remove();
        }
    });
    
    // Auto-fermeture après 10 secondes
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
            style.remove();
        }
    }, 10000);
}

// Téléchargement pour desktop
function downloadImageForDesktop(blob, platform) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `dodje-stats-${shareData.username}-${platform}.png`;
    link.href = url;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Feedback de chargement sur les boutons
function showLoadingFeedback(platform) {
    const button = document.querySelector(`.share-btn.${platform}`);
    if (button) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Préparation...';
        button.disabled = true;
    }
}

function hideLoadingFeedback(platform) {
    const button = document.querySelector(`.share-btn.${platform}`);
    if (button && button.dataset.originalText) {
        button.innerHTML = button.dataset.originalText;
        button.disabled = false;
        delete button.dataset.originalText;
    }
}

// Message d'erreur amélioré
function showErrorMessage(message) {
    showToast(`❌ ${message}`);
}

// Générer l'image de la card de partage
async function generateShareImage() {
    try {
        // Utiliser html2canvas pour convertir la card en image
        const { default: html2canvas } = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm');
        
        // Capturer uniquement la card (le carré)
        const shareCard = document.getElementById('shareCard');
        
        console.log('📸 Capture de la card uniquement...');
        
        // Options simples
        const options = {
            backgroundColor: null,
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true
        };
        
        // Générer le canvas
        const canvas = await html2canvas(shareCard, options);
        
        console.log('✅ Card capturée:', canvas.width, 'x', canvas.height);
        
        return canvas;
        
    } catch (error) {
        console.error('❌ Erreur génération image:', error);
        throw error;
    }
}

// Générer un texte de partage simplifié
function generateSimpleShareText() {
    const referralsText = shareData.referralsRanking || `${shareData.referralsCount} parrainages`;
    const flappyText = shareData.flappyRanking || (shareData.flappyScore === 0 ? 'pas encore joué' : `${shareData.flappyScore} pts`);
    
    return `🌰 Mes stats Dodje !
👥 ${referralsText}
🎮 Flappy Dodje: ${flappyText}
👑 Code fondateur: ${shareData.founderCode}

Rejoins-moi sur dodje.xyz ! 🚀
#Dodje #FinanceSimple`;
}

// Fonction pour télécharger la card comme image
async function downloadShareCard() {
    try {
        console.log('📥 Téléchargement de l\'image...');
        
        // Générer l'image de la card
        const canvas = await generateShareImage();
        
        // Télécharger l'image
        const link = document.createElement('a');
        link.download = `dodje-stats-${shareData.username}.png`;
        link.href = canvas.toDataURL('image/png');
        
        // Déclencher le téléchargement
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Image téléchargée avec succès !');
        
        // Feedback visuel avec notification
        showPlatformMessage('Téléchargement', 'Image sauvegardée avec succès !');
        
        // Feedback visuel sur le bouton
        const downloadBtn = document.querySelector('.share-btn.download');
        if (downloadBtn) {
            const originalText = downloadBtn.innerHTML;
            downloadBtn.innerHTML = '<i class="fas fa-check"></i> Téléchargé !';
            downloadBtn.style.background = 'linear-gradient(135deg, #06D001, #9BEC00)';
            downloadBtn.style.color = '#000000';
            
            setTimeout(() => {
                downloadBtn.innerHTML = originalText;
                downloadBtn.style.background = '';
                downloadBtn.style.color = '';
            }, 2500);
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du téléchargement:', error);
        showPlatformMessage('Erreur', 'Impossible de télécharger l\'image. Réessayez.');
    }
}

// Fonction de debug pour vérifier les données utilisateur
window.debugUserData = async function() {
    const user = getUserFromCache();
    if (!user) {
        console.log('❌ Aucun utilisateur en cache');
        return;
    }
    
    console.log('👤 Utilisateur en cache:', user);
    
    try {
        const userDoc = await db.collection('preinscription_public').doc(user.username).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('📋 Données Firestore complètes:', userData);
            console.log('🔍 Toutes les clés disponibles:', Object.keys(userData));
            console.log('📊 referralsCount:', userData.referralsCount);
            console.log('🎮 bestFlappyBirdScore:', userData.bestFlappyBirdScore);
        } else {
            console.log('❌ Aucun document trouvé dans Firestore');
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
};



// Rendre les fonctions accessibles globalement
window.toggleShareCard = toggleShareCard;
window.shareAsImage = shareAsImage;
window.downloadShareCard = downloadShareCard;

// Fermer la popup de partage en cliquant en dehors
document.addEventListener('click', (e) => {
    const sharePopup = document.getElementById('sharePopup');
    const shareButton = document.querySelector('.share-button');
    
    if (sharePopup && !sharePopup.querySelector('.share-popup-content').contains(e.target) && 
        !shareButton?.contains(e.target) && sharePopup.classList.contains('active')) {
        toggleShareCard();
    }
}); 