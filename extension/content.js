// This script runs directly on GitHub Pull Request pages.
console.log('FirstMerge content script loaded on a Pull Request page.');

const BACKEND_URL = 'http://localhost:3000';

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
  analyzePRAutomatically();

  // Handle GitHub's SPA navigation (Turbo/pjax)
  let lastUrl = location.href; 
  new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      if (currentUrl.includes('/compare/')) {
        setTimeout(analyzePRAutomatically, 1000);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}

// Wait for GitHub's DOM to be ready
setTimeout(initAutoAnalyzer, 1000);
