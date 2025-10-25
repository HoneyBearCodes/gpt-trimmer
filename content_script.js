(() => {
  'use strict';

  // ---- Constants ----
  const ROOT_ID = 'gpttrimmer-root-v1';
  const DEFAULT_MESSAGES_TO_KEEP = 20;
  const CHAT_TURN_SELECTOR = 'article[data-testid^="conversation-turn-"]';
  const FAB_HIDE_DELAY = 4000;

  // Exit if FAB already exists
  if (document.getElementById(ROOT_ID)) return;

  // ---- DOM Elements: FAB Container ----
  const fabHost = document.createElement('div');
  fabHost.id = ROOT_ID;
  Object.assign(fabHost.style, {
    all: 'initial',
    position: 'fixed',
    zIndex: '2147483647',
    bottom: '18px',
    right: '18px',
    pointerEvents: 'auto',
    opacity: '1',
    transition: 'opacity 0.3s ease',
  });
  document.documentElement.appendChild(fabHost);

  const shadowRoot = fabHost.attachShadow({ mode: 'open' });

  const styleEl = document.createElement('style');
  styleEl.textContent = `
    :host { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
    .gpttrimmer-fab { pointer-events:auto; width:56px; height:56px; border-radius:50%; display:inline-block; box-shadow:0 6px 18px rgba(0,0,0,0.35); cursor:pointer; user-select:none; transition: transform 0.12s ease, box-shadow 0.12s ease; }
    .gpttrimmer-fab:hover { box-shadow:0 8px 24px rgba(0,0,0,0.45); transform: scale(1.05); }
    .gpttrimmer-fab:active { transform: scale(0.96); }
    .gpttrimmer-fab:focus { outline: 3px solid rgba(0,123,255,0.25); }
    .gpttrimmer-label { position:absolute; bottom:72px; right:0; transform: translateX(-4px); background: rgba(0,0,0,0.75); color:white; padding:6px 10px; border-radius:6px; white-space:nowrap; font-size:13px; pointer-events:none; opacity:0; transition:opacity 0.12s ease, transform 0.12s ease; transform-origin: right bottom; }
    .gpttrimmer-root:hover .gpttrimmer-label { opacity:1; transform: translateX(-4px) translateY(-4px); }
  `;

  const fabContainer = document.createElement('div');
  fabContainer.className = 'gpttrimmer-root';
  Object.assign(fabContainer.style, { position: 'relative', display: 'inline-block' });

  const fabButton = document.createElement('img');
  fabButton.className = 'gpttrimmer-fab';
  fabButton.src = chrome.runtime.getURL('icons/icon128.png');
  fabButton.alt = 'Trim Chat';
  fabButton.tabIndex = 0;

  const fabLabel = document.createElement('div');
  fabLabel.className = 'gpttrimmer-label';

  fabContainer.append(fabButton, fabLabel);
  shadowRoot.append(styleEl, fabContainer);

  // ---- FAB Visibility ----
  let hideFabTimeout;
  const showFAB = () => {
    fabHost.style.opacity = '1';
    clearTimeout(hideFabTimeout);
    hideFabTimeout = setTimeout(hideFAB, FAB_HIDE_DELAY);
  };
  const hideFAB = () => {
    fabHost.style.opacity = '0.05';
  };
  hideFabTimeout = setTimeout(hideFAB, FAB_HIDE_DELAY);

  fabHost.addEventListener('mouseenter', showFAB);
  fabHost.addEventListener('mouseleave', () => (hideFabTimeout = setTimeout(hideFAB, FAB_HIDE_DELAY)));

  // ---- Utilities ----
  const showToast = (message, duration = 4000) => {
    try {
      const TOAST_ID = 'gpttrimmer-toast-v1';
      document.getElementById(TOAST_ID)?.remove();

      const toast = document.createElement('div');
      toast.id = TOAST_ID;
      toast.textContent = message;
      Object.assign(toast.style, {
        position: 'fixed',
        top: '12px',
        right: '12px',
        background: 'rgba(0,0,0,0.78)',
        color: '#fff',
        padding: '10px 14px',
        borderRadius: '8px',
        boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
        zIndex: 2147483646,
        fontSize: '13px',
        opacity: '0',
        transition: 'opacity 0.2s ease',
      });
      document.body.appendChild(toast);
      requestAnimationFrame(() => (toast.style.opacity = '1'));

      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 220);
      }, duration);
    } catch (err) {
      console.warn('GPT Trimmer toast error:', err);
    }
  };

  const notifyUser = async (message) => {
    if (!('Notification' in window)) return false;

    try {
      if (Notification.permission === 'granted' || Notification.permission === 'default') {
        const permission =
          Notification.permission === 'default' ? await Notification.requestPermission() : 'granted';
        if (permission === 'granted') {
          new Notification('GPT Trimmer', { body: message, icon: chrome.runtime.getURL('icons/icon128.png') });
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('GPT Trimmer notification failed:', err);
      return false;
    }
  };

  const getMessagesToKeep = async () => {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get({ KEEP: DEFAULT_MESSAGES_TO_KEEP }, (res) => {
          const val = Number(res.KEEP);
          resolve(Number.isFinite(val) && val > 0 ? Math.floor(val) : DEFAULT_MESSAGES_TO_KEEP);
        });
      } catch {
        resolve(DEFAULT_MESSAGES_TO_KEEP);
      }
    });
  };

  // ---- Core: Trim Chat ----
  const trimChatConversation = async () => {
    const messagesToKeep = await getMessagesToKeep();
    let removedCount = 0;

    try {
      const chatTurns = Array.from(document.querySelectorAll(CHAT_TURN_SELECTOR));
      if (chatTurns.length <= messagesToKeep) {
        const msg = `No trimming needed. Total messages: ${chatTurns.length}.`;
        !(await notifyUser(msg)) && showToast(msg);
        return;
      }

      const excessCount = chatTurns.length - messagesToKeep;
      chatTurns.slice(0, excessCount).forEach((turn) => turn.remove());

      const msg = `Trimmed to last ${messagesToKeep} messages (removed ${excessCount}).`;
      !(await notifyUser(msg)) && showToast(msg);
    } catch (err) {
      console.error('GPT Trimmer trimming failed:', err);
      showToast('GPT Trimmer: Error trimming chat — see console.');
    }
  };

  const waitForChatTurns = (timeout = 5000, interval = 200) =>
    new Promise((resolve) => {
      const startTime = Date.now();
      const checkTurns = () => {
        const turns = document.querySelectorAll(CHAT_TURN_SELECTOR);
        if (turns.length > 0) resolve(turns);
        else if (Date.now() - startTime > timeout) resolve([]);
        else setTimeout(checkTurns, interval);
      };
      checkTurns();
    });

  const updateFabTooltip = async () => {
    const messagesToKeep = await getMessagesToKeep();
    fabButton.title = `Trim Chat (keep last ${messagesToKeep} turns)`;
    fabLabel.textContent = `Trim Chat (keep last ${messagesToKeep})`;
  };

  // ---- Trim on Page Load (if enabled) ----
  chrome.storage.sync.get({ trimOnLoad: true }, ({ trimOnLoad }) => {
    if (trimOnLoad) {
      waitForChatTurns(8000, 300).then((turns) => {
        if (turns.length > 0) trimChatConversation();
      });
    }
  });

  updateFabTooltip();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.KEEP) updateFabTooltip();
  });

  // ---- Event Listeners ----
  fabButton.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    fabButton.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(0.96)' }, { transform: 'scale(1)' }],
      { duration: 160 }
    );
    trimChatConversation();
  });

  fabButton.addEventListener('keydown', (ev) => {
    if (['Enter', ' '].includes(ev.key)) {
      ev.preventDefault();
      fabButton.click();
    }
  });

  // ---- Global Access ----
  window.__GPTTRIMMER = { trimNow: trimChatConversation, version: '1.1.1' };
})();
