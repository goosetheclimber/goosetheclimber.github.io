document.addEventListener('DOMContentLoaded', () => {

    // --- INTERNATIONALIZATION (i18n) ---
    let translations = {};
    const langKoBtn = document.getElementById('lang-ko');
    const langEnBtn = document.getElementById('lang-en');

    // Function to fetch translation files
    const loadTranslations = async (lang) => {
        const response = await fetch(`${lang}.json`);
        translations = await response.json();
        applyTranslations();
    };

    // Function to apply translations to the page
    const applyTranslations = () => {
        document.querySelectorAll('[data-i18n-key]').forEach(element => {
            const key = element.getAttribute('data-i18n-key');
            element.textContent = translations[key] || element.textContent;
        });
    };
    
    // Function to set language and save preference
    const setLanguage = (lang) => {
        localStorage.setItem('language', lang);
        
        // Update button styles
        if (lang === 'ko') {
            langKoBtn.classList.add('bg-gray-900', 'text-white');
            langKoBtn.classList.remove('text-gray-300', 'hover:bg-gray-700');
            langEnBtn.classList.add('text-gray-300', 'hover:bg-gray-700');
            langEnBtn.classList.remove('bg-gray-900', 'text-white');
        } else {
            langEnBtn.classList.add('bg-gray-900', 'text-white');
            langEnBtn.classList.remove('text-gray-300', 'hover:bg-gray-700');
            langKoBtn.classList.add('text-gray-300', 'hover:bg-gray-700');
            langKoBtn.classList.remove('bg-gray-900', 'text-white');
        }

        loadTranslations(lang);
    };

    // Event listeners for language buttons
    if (langKoBtn && langEnBtn) {
        langKoBtn.addEventListener('click', () => setLanguage('ko'));
        langEnBtn.addEventListener('click', () => setLanguage('en'));
    }

    // On page load, check for saved language or default to 'ko'
    const savedLang = localStorage.getItem('language') || 'ko';
    setLanguage(savedLang);


    // --- LEADERBOARD LOGIC (only on leaderboard page) ---
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (leaderboardBody) {
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxp-VBhRuF4erToH21c9BK2x_VxV8KtE_zeTu-EmTeay_NEnvH5gupuvr5NzTHsWuqPuA/exec'; 

        const loginSection = document.getElementById('login-section');
        const welcomeSection = document.getElementById('welcome-section');
        const usernameDisplay = document.getElementById('username-display');
        const setUsernameBtn = document.getElementById('set-username');
        const usernameInput = document.getElementById('username-input');
        const attendButton = document.getElementById('attend-button');
        const achieveButton = document.getElementById('achieve-button');

        let currentUser = localStorage.getItem('clubUsername');

        const setupUser = () => {
            if (currentUser) {
                loginSection.classList.add('hidden');
                welcomeSection.classList.remove('hidden');
                usernameDisplay.textContent = currentUser;
            } else {
                loginSection.classList.remove('hidden');
                welcomeSection.classList.add('hidden');
            }
        };

        const fetchLeaderboard = () => {
            leaderboardBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Loading...</td></tr>';
            fetch(SCRIPT_URL)
                .then(response => response.json())
                .then(data => {
                    // Sort data by achievements (desc), then attendance (desc)
                    data.sort((a, b) => {
                        if (b.achievements !== a.achievements) {
                            return b.achievements - a.achievements;
                        }
                        return b.attendance - a.attendance;
                    });

                    leaderboardBody.innerHTML = '';
                    if (data.length > 0) {
                        data.forEach((row, index) => {
                            const tr = document.createElement('tr');
                            tr.className = 'bg-gray-800 border-b border-gray-700 hover:bg-gray-600';
                            tr.innerHTML = `
                                <td class="py-4 px-6 font-medium text-white">${index + 1}</td>
                                <td class="py-4 px-6">${row.name}</td>
                                <td class="py-4 px-6">${row.attendance}</td>
                                <td class="py-4 px-6">${row.achievements}</td>
                                <td class="py-4 px-6">${new Date(row.lastUpdated).toLocaleDateString()}</td>
                            `;
                            leaderboardBody.appendChild(tr);
                        });
                    } else {
                        leaderboardBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No data available.</td></tr>';
                    }
                })
                .catch(error => {
                    console.error('Error fetching leaderboard:', error);
                    leaderboardBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-400">Error loading data.</td></tr>';
                });
        };
        
        const postData = (action, points = 0) => {
            if (!currentUser) {
                alert('Please set your name first!');
                return;
            }

            const payload = {
                name: currentUser,
                action: action,
                points: points
            };
            
            // Disable buttons to prevent multiple clicks
            attendButton.disabled = true;
            achieveButton.disabled = true;

            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Important for Google Apps Script
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })
            .then(() => {
                 setTimeout(() => {
                    fetchLeaderboard(); // Refresh the leaderboard after a delay
                    // Re-enable buttons
                    attendButton.disabled = false;
                    achieveButton.disabled = false;
                }, 2000); // Wait 2 seconds for sheet to update
            })
            .catch(error => {
                console.error('Error posting data:', error);
                // Re-enable buttons
                attendButton.disabled = false;
                achieveButton.disabled = false;
            });
        };

        if(setUsernameBtn) {
            setUsernameBtn.addEventListener('click', () => {
                const username = usernameInput.value.trim();
                if (username) {
                    currentUser = username;
                    localStorage.setItem('clubUsername', currentUser);
                    setupUser();
                }
            });
        }
        
        if(attendButton) {
            attendButton.addEventListener('click', () => postData('attend'));
        }

        if(achieveButton) {
            achieveButton.addEventListener('click', () => postData('achieve', 10));
        }


        // Initial setup
        setupUser();
        fetchLeaderboard();
    }
});
