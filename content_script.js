/**
 * content_script.js
 * Injects a Shadow DOM FAB (image button) and performs trimming of ChatGPT conversation turns.
 *
 * MV3 note: No inline scripts in HTML; this file is loaded via content_scripts in manifest.json.
 */

(() => {
  'use strict';

  const ROOT_ID = 'gpttrimmer-root-v1';
  const DEFAULT_KEEP = 20;
  const TURN_SELECTOR = 'article[data-testid^="conversation-turn-"]';

  if (document.getElementById(ROOT_ID)) return;

  // ---- Create Shadow DOM host ----
  const host = document.createElement('div');
  host.id = ROOT_ID;
  host.style.all = 'initial';
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647';
  host.style.bottom = '18px';
  host.style.right = '18px';
  host.style.pointerEvents = 'none';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // ---- Shadow DOM Styles ----
  const style = document.createElement('style');
  style.textContent = `
    :host { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
    .gpttrimmer-fab {
      pointer-events: auto;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: inline-block;
      box-shadow: 0 6px 18px rgba(0,0,0,0.35);
      cursor: pointer;
      user-select: none;
      transition: transform 0.12s ease, box-shadow 0.12s ease;
    }
    .gpttrimmer-fab:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,0.45);
      transform: scale(1.05);
    }
    .gpttrimmer-fab:active { transform: scale(0.96); }
    .gpttrimmer-fab:focus { outline: 3px solid rgba(0,123,255,0.25); }
    .gpttrimmer-label {
      position: absolute;
      bottom: 72px;
      right: 0;
      transform: translateX(-4px);
      background: rgba(0,0,0,0.75);
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      white-space: nowrap;
      font-size: 13px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.12s ease, transform 0.12s ease;
      transform-origin: right bottom;
    }
    .gpttrimmer-root:hover .gpttrimmer-label {
      opacity: 1;
      transform: translateX(-4px) translateY(-4px);
    }
  `;

  const container = document.createElement('div');
  container.className = 'gpttrimmer-root';
  Object.assign(container.style, {
    position: 'relative',
    display: 'inline-block',
  });

  const fab = document.createElement('img');
  fab.className = 'gpttrimmer-fab';
  fab.src = chrome.runtime.getURL('icons/icon128.png');
  fab.alt = 'Trim Chat';
  fab.tabIndex = 0;

  const label = document.createElement('div');
  label.className = 'gpttrimmer-label';

  container.appendChild(fab);
  container.appendChild(label);
  shadow.appendChild(style);
  shadow.appendChild(container);

  host.addEventListener(
    'mouseenter',
    () => (host.style.pointerEvents = 'auto')
  );
  host.addEventListener(
    'mouseleave',
    () => (host.style.pointerEvents = 'none')
  );

  // ---- Utilities ----
  function showToast(message, options = {}) {
    try {
      const id = 'gpttrimmer-toast-v1';
      const existing = document.getElementById(id);
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = id;
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

      const duration = options.duration ?? 4000;
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 220);
      }, duration);
    } catch (err) {
      console.warn('GPT Trimmer toast error', err);
    }
  }

  async function tryNotify(message) {
    try {
      if (!('Notification' in window)) return false;
      if (Notification.permission === 'granted') {
        new Notification('GPT Trimmer', {
          body: message,
          icon: chrome.runtime.getURL('icons/icon128.png'),
        });
        return true;
      }
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(message);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('GPT Trimmer: Notification failed', err);
      return false;
    }
  }

  async function getKeepValue() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get({ KEEP: DEFAULT_KEEP }, (res) => {
          const val = Number(res.KEEP);
          if (Number.isFinite(val) && val > 0) resolve(Math.floor(val));
          else resolve(DEFAULT_KEEP);
        });
      } catch {
        resolve(DEFAULT_KEEP);
      }
    });
  }

  async function trimConversation() {
    const KEEP = await getKeepValue();
    let removed = 0;

    try {
      const turns = Array.from(document.querySelectorAll(TURN_SELECTOR));
      const total = turns.length;

      if (total <= KEEP) {
        const msg = `No trimming needed. Total turns: ${total}.`;
        if (!(await tryNotify(msg))) showToast(msg);
        return;
      }

      const toRemove = total - KEEP;
      for (let i = 0; i < toRemove; i++) turns[i]?.remove();

      const msg = `Trimmed to last ${KEEP} messages (removed ${toRemove}).`;
      if (!(await tryNotify(msg))) showToast(msg);
    } catch (err) {
      console.error('GPT Trimmer trimming failed', err);
      showToast('GPT Trimmer: Error trimming chat — see console.');
    }
  }

  function waitForChatTurns(timeout = 5000, interval = 200) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        const turns = document.querySelectorAll(TURN_SELECTOR);
        if (turns.length > 0) resolve(turns);
        else if (Date.now() - start > timeout) resolve([]);
        else setTimeout(check, interval);
      };
      check();
    });
  }

  async function updateTooltip() {
    const KEEP = await getKeepValue();
    fab.title = `Trim Chat (keep last ${KEEP} turns)`;
    label.textContent = `Trim Chat (keep last ${KEEP})`;
  }

  // ---- Trim on page load only if toggle is ON ----
  chrome.storage.sync.get({ trimOnLoad: true }, ({ trimOnLoad }) => {
    if (trimOnLoad) {
      waitForChatTurns(8000, 300).then((turns) => {
        if (turns.length > 0) trimConversation();
      });
    }
  });

  // ---- Tooltip ----
  updateTooltip();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.KEEP) updateTooltip();
  });

  // ---- FAB Click ----
  fab.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    fab.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(0.96)' },
        { transform: 'scale(1)' },
      ],
      { duration: 160 }
    );
    trimConversation();
  });

  fab.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      fab.click();
    }
  });

  // ---- Expose helper ----
  window.__GPTTRIMMER = { trimNow: trimConversation, version: '1.1.1' };
})();
