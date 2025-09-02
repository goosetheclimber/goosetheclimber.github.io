// --- CONFIGURATION ---
// PASTE YOUR GOOGLE APPS SCRIPT URL HERE
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxp-VBhRuF4erToH21c9BK2x_VxV8KtE_zeTu-EmTeay_NEnvH5gupuvr5NzTHsWuqPuA/exec'; 
// -------------------


document.addEventListener('DOMContentLoaded', () => {
    const leaderboardBody = document.getElementById('leaderboard-body');
    const attendBtn = document.getElementById('attendBtn');
    const achieveBtn = document.getElementById('achieveBtn');
    const currentUserEl = document.getElementById('currentUser');
    
    let loggedInUser = localStorage.getItem('clubUsername');

    function checkLoginStatus() {
        loggedInUser = localStorage.getItem('clubUsername');
        if (loggedInUser) {
            currentUserEl.textContent = `Logged in as: ${loggedInUser}`;
            attendBtn.disabled = false;
            achieveBtn.disabled = false;
        } else {
            currentUserEl.textContent = 'Not logged in. Log in from the main page to participate.';
            attendBtn.disabled = true;
            achieveBtn.disabled = true;
        }
    }

    async function fetchLeaderboard() {
        if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            leaderboardBody.innerHTML = `<tr><td colspan="4" class="text-center py-10 px-5 text-red-400">Error: Google Apps Script URL is not set in script.js.</td></tr>`;
            return;
        }
        
        leaderboardBody.innerHTML = `<tr><td colspan="4" class="text-center py-10 px-5 text-gray-400">Fetching latest data...</td></tr>`;

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'GET',
                redirect: 'follow',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Sort data: higher attendance first, then higher achievements
            data.sort((a, b) => {
                if (b.attendance !== a.attendance) {
                    return b.attendance - a.attendance;
                }
                return b.achievements - a.achievements;
            });
            
            renderLeaderboard(data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            leaderboardBody.innerHTML = `<tr><td colspan="4" class="text-center py-10 px-5 text-red-400">Could not load leaderboard data. Please check the console for errors.</td></tr>`;
        }
    }

    function renderLeaderboard(data) {
        leaderboardBody.innerHTML = ''; // Clear existing data
        if (data.length === 0) {
             leaderboardBody.innerHTML = `<tr><td colspan="4" class="text-center py-10 px-5 text-gray-400">Leaderboard is empty. Be the first to participate!</td></tr>`;
             return;
        }

        data.forEach((user, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-700';
            row.innerHTML = `
                <td class="px-5 py-5 border-b border-gray-700 text-sm">
                    <p class="text-white whitespace-no-wrap">${index + 1}</p>
                </td>
                <td class="px-5 py-5 border-b border-gray-700 text-sm">
                    <p class="text-white whitespace-no-wrap font-semibold">${user.name}</p>
                </td>
                <td class="px-5 py-5 border-b border-gray-700 text-sm">
                    <p class="text-white whitespace-no-wrap">${user.attendance}</p>
                </td>
                <td class="px-5 py-5 border-b border-gray-700 text-sm">
                    <p class="text-white whitespace-no-wrap">${user.achievements}</p>
                </td>
            `;
            leaderboardBody.appendChild(row);
        });
    }

    async function postData(action, points = 0) {
        if (!loggedInUser) {
            alert('You must be logged in to perform this action.');
            return;
        }
        
        attendBtn.disabled = true;
        achieveBtn.disabled = true;
        
        const payload = {
            name: loggedInUser,
            action: action,
            points: points
        };

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', // Required for Apps Script
                },
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Refresh the leaderboard to show the new data
            await fetchLeaderboard();

        } catch (error) {
            console.error(`Error with action '${action}':`, error);
            alert(`An error occurred. Could not update your data.`);
        } finally {
            checkLoginStatus(); // Re-enable buttons if still logged in
        }
    }

    // Event Listeners
    attendBtn.addEventListener('click', () => postData('attend'));
    achieveBtn.addEventListener('click', () => postData('achieve', 10));
    
    // Initial Load
    checkLoginStatus();
    fetchLeaderboard();
});
