document.addEventListener('DOMContentLoaded', () => {
  const loggedOutView = document.getElementById('logged-out');
  const loggedInView = document.getElementById('logged-in');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const usernameDisplay = document.getElementById('username-display');
  const loginError = document.getElementById('login-error');

  function showLoggedIn(username) {
    loggedOutView.style.display = 'none';
    loggedInView.style.display = 'block';
    usernameDisplay.textContent = username ? `@${username}` : 'Logged in';
  }

  function showLoggedOut() {
    loggedOutView.style.display = 'block';
    loggedInView.style.display = 'none';
    loginError.textContent = '';
  }

  // 1. Read chrome.storage.local
  chrome.storage.local.get(['fm_token', 'fm_username'], (result) => {
    if (result.fm_token) {
      showLoggedIn(result.fm_username);
    } else {
      showLoggedOut();
    }
  });

  // 2. login-btn click
  loginBtn.addEventListener('click', () => {
    loginError.textContent = '';
    const authUrl = 'http://localhost:3000/api/auth/extension-login';
    
    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (responseUrl) => {
      if (chrome.runtime.lastError || !responseUrl) {
        loginError.textContent = 'Login failed';
        return;
      }

      try {
        // Handle parsing responseUrl for token and username
        // We'll support both hash #token=... and query ?token=...
        const url = new URL(responseUrl);
        const paramsStr = url.hash ? url.hash.substring(1) : url.search.substring(1);
        const params = new URLSearchParams(paramsStr);
        
        const token = params.get('token');
        const username = params.get('username');

        if (token) {
          chrome.storage.local.set({ fm_token: token, fm_username: username }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0] && tabs[0].url && tabs[0].url.match(/github\.com\/.*\/pull\//)) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'FM_TOKEN', token: token });
              }
            });
            showLoggedIn(username);
          });
        } else {
          loginError.textContent = 'Login failed (no token in URL)';
        }
      } catch (err) {
        loginError.textContent = 'Login failed';
        console.error('Error parsing auth response:', err);
      }
    });
  });

  // 3. logout-btn click
  logoutBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['fm_token', 'fm_username'], () => {
      showLoggedOut();
    });
  });
});
