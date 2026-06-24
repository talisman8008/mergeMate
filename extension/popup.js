document.addEventListener('DOMContentLoaded', () => {
  const checkPrBtn = document.getElementById('checkPrBtn');
  const statusEl = document.getElementById('status');
  const resultEl = document.getElementById('result');

  // Replace this with your backend's actual URL/port when deployed
  const BACKEND_URL = 'https://your-backend.up.railway.app';

  checkPrBtn.addEventListener('click', async () => {
    // 1. Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we are on a GitHub PR page
    if (!tab.url.includes('github.com') || !tab.url.includes('/pull/')) {
      statusEl.textContent = 'Not a GitHub PR page';
      statusEl.style.backgroundColor = '#ffebe9';
      statusEl.style.color = '#cf222e';
      return;
    }

    statusEl.textContent = 'Analyzing...';
    resultEl.style.display = 'block';
    resultEl.textContent = 'Contacting local backend...';

    try {
      // 2. Make a request to your local backend
      // Adjust the endpoint (/api/prcheck) based on your routes/prcheck.js
      const response = await fetch(`${BACKEND_URL}/api/prcheck/after`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prUrl: tab.url })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      
      // 3. Display the result
      statusEl.textContent = 'Success!';
      resultEl.textContent = JSON.stringify(data, null, 2);

    } catch (error) {
      statusEl.textContent = 'Error';
      resultEl.textContent = `Failed to connect to backend: ${error.message}. Ensure backend is running on port 3000.`;
    }
  });
});
