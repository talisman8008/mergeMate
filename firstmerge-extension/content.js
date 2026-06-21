const BACKEND_URL = 'http://localhost:3000';

(function() {
  if (!window.location.href.match(/https:\/\/github\.com\/.*\/pull\/.*/)) return;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes firstmerge-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '999999',
    width: '320px',
    backgroundColor: '#211F2E',
    border: '1px solid #322F42',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    padding: '16px',
    fontFamily: 'system-ui'
  });

  const header = document.createElement('div');
  Object.assign(header.style, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  });

  const title = document.createElement('div');
  title.textContent = 'FirstMerge';
  Object.assign(title.style, {
    color: '#9F97F0',
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '0.05em'
  });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  Object.assign(closeBtn.style, {
    color: '#9C99AD',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0',
    lineHeight: '1'
  });
  closeBtn.onclick = () => panel.remove();

  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  const divider = document.createElement('div');
  Object.assign(divider.style, {
    borderTop: '1px solid #322F42',
    margin: '10px 0'
  });
  panel.appendChild(divider);

  const statusArea = document.createElement('div');
  panel.appendChild(statusArea);

  document.body.appendChild(panel);

  function setLoading() {
    statusArea.innerHTML = '';
    
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      textAlign: 'center',
      padding: '8px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    });

    const spinner = document.createElement('div');
    Object.assign(spinner.style, {
      width: '20px',
      height: '20px',
      border: '2px solid #322F42',
      borderTop: '2px solid #9F97F0',
      borderRadius: '50%',
      animation: 'firstmerge-spin 1s linear infinite'
    });

    const text = document.createElement('div');
    text.textContent = 'Analysing PR...';
    Object.assign(text.style, {
      color: '#9C99AD',
      fontSize: '13px',
      marginTop: '10px',
      textAlign: 'center'
    });

    wrapper.appendChild(spinner);
    wrapper.appendChild(text);
    statusArea.appendChild(wrapper);
  }

  function setVerdict(verdict, reason) {
    statusArea.innerHTML = '';
    
    const isGenuine = verdict === 'GENUINE';
    
    const title = document.createElement('div');
    title.textContent = isGenuine ? 'GENUINE' : 'TRIVIAL';
    Object.assign(title.style, {
      color: isGenuine ? '#6B71B8' : '#D87575',
      fontSize: '22px',
      fontWeight: '700',
      fontFamily: 'monospace',
      letterSpacing: '0.08em'
    });

    const desc = document.createElement('div');
    desc.textContent = reason;
    Object.assign(desc.style, {
      color: '#9C99AD',
      fontSize: '13px',
      lineHeight: '1.5',
      marginTop: '8px'
    });

    statusArea.appendChild(title);
    statusArea.appendChild(desc);
  }

  function setError(errorMsg) {
    statusArea.innerHTML = '';
    
    const title = document.createElement('div');
    title.textContent = 'Could not analyse PR';
    Object.assign(title.style, {
      color: '#D87575',
      fontSize: '13px'
    });

    const desc = document.createElement('div');
    desc.textContent = errorMsg;
    Object.assign(desc.style, {
      color: '#9C99AD',
      fontSize: '11px',
      marginTop: '4px'
    });

    statusArea.appendChild(title);
    statusArea.appendChild(desc);
  }

  function setNoAuth() {
    statusArea.innerHTML = '';
    
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      textAlign: 'center',
      padding: '8px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    });

    const title = document.createElement('div');
    title.textContent = 'Login to FirstMerge to check this PR';
    Object.assign(title.style, {
      color: '#9C99AD',
      fontSize: '13px'
    });

    const desc = document.createElement('div');
    desc.textContent = 'Click the extension icon to login';
    Object.assign(desc.style, {
      color: '#6A677D',
      fontSize: '11px',
      marginTop: '4px'
    });

    wrapper.appendChild(title);
    wrapper.appendChild(desc);
    statusArea.appendChild(wrapper);
  }

  function fetchVerdict(token) {
    fetch(`${BACKEND_URL}/api/prcheck/after`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ prUrl: window.location.href })
    })
    .then(res => res.json())
    .then(data => {
      setVerdict(data.verdict, data.reason);
    })
    .catch(err => {
      setError(err.message);
    });
  }

  chrome.storage.local.get(['fm_token'], (result) => {
    const token = result.fm_token;
    if (!token) {
      setNoAuth();
      return;
    }
    setLoading();
    fetchVerdict(token);
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'FM_TOKEN' && message.token) {
      chrome.storage.local.set({ fm_token: message.token }, () => {
        setLoading();
        fetchVerdict(message.token);
      });
    }
  });
})();
