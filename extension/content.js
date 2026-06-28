// This script runs directly on GitHub Pull Request pages.
console.log('FirstMerge content script loaded on a Pull Request page.');

const BACKEND_URL = 'https://your-backend.up.railway.app';

function createFirstMergeBanner() {
  const banner = document.createElement('div');
  banner.id = 'firstmerge-banner';
  banner.style.cssText = `
    background-color: #17151F;
    border: 1px solid #322F42;
    border-radius: 6px;
    padding: 16px;
    margin-bottom: 16px;
    color: #F2F1F7;
    font-family: 'DM Sans', -apple-system, sans-serif;
  `;

  const header = document.createElement('div');
  header.style.cssText = `display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-weight: 600; font-size: 16px;`;
  
  const iconUrl = chrome.runtime.getURL('icon.svg');
  header.innerHTML = `<img src="${iconUrl}" style="width: 20px; height: 20px; border-radius: 4px;" alt="logo"> FirstMerge Auto-Analysis`;
  
  const content = document.createElement('div');
  content.id = 'firstmerge-content';
  content.style.cssText = `color: #9C99AD; font-size: 14px; white-space: pre-wrap;`;
  content.innerText = 'Analyzing PR diff and quality...';

  banner.appendChild(header);
  banner.appendChild(content);

  // FTUE Logic
  chrome.storage.local.get(['fm_hasSeenExtensionTour'], (result) => {
    if (!result.fm_hasSeenExtensionTour) {
      banner.style.position = 'relative';
      const ftue = document.createElement('div');
      ftue.id = 'fm-extension-ftue';
      ftue.style.cssText = 'position: absolute; top: -15px; right: -10px; transform: translateY(-100%); background-color: #6B71B8; color: white; padding: 12px 16px; border-radius: 8px; font-family: sans-serif; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 10000; width: 280px; border: 1px solid rgba(255,255,255,0.2);';

      ftue.innerHTML = '<div style="font-weight: bold; margin-bottom: 6px; font-size: 14px;">FirstMerge Auto-Analysis </div><div style="margin-bottom: 12px; line-height: 1.4;">We will automatically analyze your code here before you submit to ensure it is high quality and linked to an issue.</div><button id="fm-ftue-dismiss" style="background: rgba(0,0,0,0.2); border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; transition: background 0.2s;">Got it!</button><div style="position: absolute; bottom: -6px; right: 24px; width: 12px; height: 12px; background: #6B71B8; transform: rotate(45deg); border-right: 1px solid rgba(255,255,255,0.2); border-bottom: 1px solid rgba(255,255,255,0.2);"></div>';
      
      banner.appendChild(ftue);

      // Need setTimeout because innerHTML was just set
      setTimeout(() => {
        const dismissBtn = document.getElementById('fm-ftue-dismiss');
        if (dismissBtn) {
          dismissBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.storage.local.set({ fm_hasSeenExtensionTour: true });
            ftue.remove();
          });
        }
      }, 0);
    }
  });

  return { banner, content };
}

async function analyzePRAutomatically() {
  const currentUrl = window.location.href;
  
  // Find where to inject our UI
  const prForm = document.querySelector('form.new_pull_request') || document.querySelector('.js-details-container form');
  const fallbackContainer = document.querySelector('.js-compare-content') || document.querySelector('.repository-content');
  
  if (!prForm && !fallbackContainer) return;

  // Don't inject twice
  if (document.getElementById('firstmerge-banner')) return;

  const { banner, content } = createFirstMergeBanner();
  
  if (prForm && prForm.parentNode) {
    prForm.parentNode.insertBefore(banner, prForm);
  } else if (fallbackContainer) {
    fallbackContainer.prepend(banner);
  }

  try {
    const runAnalysis = () => {
      content.style.cssText = `color: #9C99AD; font-size: 14px; white-space: pre-wrap; border: none; background: transparent; padding: 0;`;
      content.innerText = 'Analyzing PR diff and quality...';

      chrome.storage.local.get(['fm_token'], async (result) => {
        const token = result.fm_token;
        if (!token) {
          content.style.padding = '16px';
          content.innerText = 'Open FirstMerge and log in to activate the extension.';
          return;
        }

        try {
          const tInput = document.querySelector('input#pull_request_title');
          const bInput = document.querySelector('textarea#pull_request_body');
          const prTitle = tInput ? tInput.value : '';
          const prBody = bInput ? bInput.value : '';

          let response = await fetch(`${BACKEND_URL}/api/prcheck/compare`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              compareUrl: window.location.href,
              title: prTitle,
              body: prBody
            })
          });

          if (response.status === 401) {
            const newToken = await new Promise(resolve => {
              chrome.runtime.sendMessage({ action: 'REFRESH_TOKEN' }, resolve);
            });

            if (newToken) {
              response = await fetch(`${BACKEND_URL}/api/prcheck/compare`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${newToken}`
                },
                body: JSON.stringify({
                  compareUrl: window.location.href,
                  title: prTitle,
                  body: prBody
                })
              });
            }
          }

          if (!response.ok) {
            let errorMsg = `Server returned ${response.status}`;
            try {
              const errorData = await response.json();
              if (errorData.error) errorMsg = errorData.error;
            } catch (e) {}
            throw new Error(errorMsg);
          }    
          const data = await response.json();
          
          if (typeof data === 'object' && data !== null) {
            const isGenuine = data.verdict && data.verdict.toUpperCase() === 'GENUINE';
            const verdictColor = isGenuine ? '#6B71B8' : '#D87575'; 
            const verdictBg = isGenuine ? 'rgba(107, 113, 184, 0.1)' : 'rgba(216, 117, 117, 0.1)';
            
            const checkIcon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${verdictColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>`;
            const xIcon = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${verdictColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>`;
            const iconToUse = isGenuine ? checkIcon : xIcon;

            content.style.cssText = `border: 2px solid #322F42; border-radius: 12px; overflow: hidden; background-color: #211F2E; font-family: 'DM Sans', -apple-system, sans-serif;`;
            
            content.innerHTML = `
              <div style="padding: 16px 24px; border-bottom: 2px solid #322F42; display: flex; align-items: center; justify-content: space-between; background-color: #211F2E;">
                <h2 style="margin: 0; font-family: 'Space Mono', monospace; font-size: 13px; font-weight: bold; color: #F2F1F7; text-transform: uppercase; letter-spacing: 0.05em;">RESULTS</h2>
              </div>
              
              <div style="padding: 32px; text-align: center; border-bottom: 2px solid #322F42; background-color: ${verdictBg};">
                <div id="verdict-container" style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                  ${iconToUse}
                </div>
              </div>

              <div style="padding: 32px; display: flex; flex-direction: column; gap: 32px;">
                <div>
                  <h3 style="margin: 0 0 12px 0; font-family: 'Space Mono', monospace; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #F2F1F7;">
                    Reason
                  </h3>
                  <div id="reason-container"></div>
                </div>

                <div>
                  <h3 style="margin: 0 0 12px 0; font-family: 'Space Mono', monospace; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #6B71B8; display: flex; align-items: center; gap: 8px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Suggestion
                  </h3>
                  <div id="suggestion-container"></div>
                </div>
              </div>
              
              <div style="padding: 24px 32px; border-top: 2px solid #322F42; display: flex; justify-content: flex-end; background-color: #17151F;">
                <a href="https://your-frontend.vercel.app/explore" target="_blank" style="text-decoration: none; font-family: 'Space Mono', monospace; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; background-color: transparent; color: #F2F1F7; border: 1px solid #322F42; padding: 12px 24px; border-radius: 6px; cursor: pointer; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#322F42'" onmouseout="this.style.backgroundColor='transparent'">
                  Explore More Issues →
                </a>
              </div>
            `;

            const verdictSpan = document.createElement('span');
            verdictSpan.style.cssText = `font-size: 32px; font-weight: bold; text-transform: uppercase; letter-spacing: -0.02em; color: ${verdictColor};`;
            verdictSpan.textContent = data.verdict || 'UNKNOWN';
            content.querySelector('#verdict-container').appendChild(verdictSpan);

            const reasonP = document.createElement('p');
            reasonP.style.cssText = `margin: 0; font-size: 16px; color: #9C99AD; line-height: 1.6;`;
            reasonP.textContent = data.reason || 'No reason provided.';
            content.querySelector('#reason-container').appendChild(reasonP);

            const suggestionDiv = document.createElement('div');
            suggestionDiv.style.cssText = `background-color: rgba(23, 21, 31, 0.2); border: 1px solid rgba(255,255,255,0.05); box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.05); border-radius: 8px; padding: 20px; font-family: 'Space Mono', monospace; font-size: 14px; color: #F2F1F7; line-height: 1.6; white-space: pre-wrap;`;
            suggestionDiv.textContent = data.suggestion || 'No suggestion provided.';
            content.querySelector('#suggestion-container').appendChild(suggestionDiv);
          } else {
            content.style.padding = '16px';
            content.innerText = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
          }

        } catch (error) {
          content.innerText = `Failed to analyze PR: ${error.message}`;
          content.style.color = '#D87575'; 
        }
      });
    };

    const checkInputs = () => {
      const tInput = document.querySelector('input#pull_request_title');
      const bInput = document.querySelector('textarea#pull_request_body');
      const prTitle = tInput ? tInput.value : '';
      const prBody = bInput ? bInput.value : '';
      const issueRegex = /#\d+/;
      
      if (!issueRegex.test(prTitle) && !issueRegex.test(prBody)) {
        content.style.cssText = `border: 1px solid #735C1F; border-radius: 8px; background-color: rgba(115, 92, 31, 0.15); padding: 16px; color: #E5C07B; font-family: 'DM Sans', -apple-system, sans-serif;`;
        content.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 14px; margin-bottom: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Waiting for Issue Number...
          </div>
          <div style="font-size: 13px; color: rgba(229, 192, 123, 0.9);">
            Please link the issue (e.g. <code>Fixes #123</code>) in the title or description above. FirstMerge requires an issue number to analyze your code.
          </div>
        `;
        return false;
      }
      return true;
    };

    if (checkInputs()) {
      runAnalysis();
    } else {
      const inputListener = (e) => {
        if (e.target && (e.target.id === 'pull_request_title' || e.target.id === 'pull_request_body')) {
          if (checkInputs()) {
            document.removeEventListener('input', inputListener);
            runAnalysis();
          }
        }
      };
      document.addEventListener('input', inputListener);
    }
  } catch (error) {
    content.innerText = `Failed to analyze PR: ${error.message}`;
    content.style.color = '#D87575'; // Accent red
  }
}

function initAutoAnalyzer() {
  // Run on initial load
  if (window.location.href.includes('/compare/')) {
    analyzePRAutomatically();
  }

  // Handle GitHub's SPA navigation and dynamic DOM rendering
  new MutationObserver(() => {
    if (window.location.href.includes('/compare/')) {
      // It's safe to call this frequently because analyzePRAutomatically 
      // checks if the banner already exists before injecting.
      analyzePRAutomatically();
    }
  }).observe(document.body, { childList: true, subtree: true });
}

// Start observing immediately
initAutoAnalyzer();
