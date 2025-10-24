/**
 * content_script.js
 * Injects a Shadow DOM FAB and performs trimming of ChatGPT conversation turns.
 *
 * MV3 note: No inline scripts in HTML; this file is loaded via content_scripts in manifest.json.
 */

(() => {
  'use strict';

  // Unique id to avoid duplicates
  const ROOT_ID = 'gpttrimmer-root-v1';

  // Default number to keep; can be made configurable via chrome.storage later
  const DEFAULT_KEEP = 5;

  // Selector specified by the requirements
  const TURN_SELECTOR = 'article[data-testid^="conversation-turn-"]';

  // If the page already has our root, do nothing (prevents double injection)
  if (document.getElementById(ROOT_ID)) return;

  // Create host element and attach Shadow DOM to prevent CSS leakage / conflicts
  const host = document.createElement('div');
  host.id = ROOT_ID;
  host.style.all = 'initial'; // try to reduce CSS inheritance
  host.style.position = 'fixed';
  host.style.zIndex = '2147483647'; // maximum z-index to avoid conflicts
  host.style.bottom = '18px';
  host.style.right = '18px';
  host.style.pointerEvents = 'none'; // allow clicks only on our inner elements
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // Styles inside shadow DOM (won't affect page)
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
    .gpttrimmer-root:hover .gpttrimmer-label { opacity: 1; transform: translateX(-4px) translateY(-4px); }
    /* Toast (we'll append it to document.body so it shows above other content) */
  `;

  // Build fab container
  const container = document.createElement('div');
  container.className = 'gpttrimmer-root';
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', 'GPTTrimmer controls');
  Object.assign(container.style, {
    position: 'relative',
    display: 'inline-block'
  });

  const fab = document.createElement('img');
  fab.className = 'gpttrimmer-fab';
  fab.src = chrome.runtime.getURL('icons/icon128.png');
  fab.alt = 'Trim Chat';
  fab.setAttribute('title', 'Trim Chat (keeps last ' + DEFAULT_KEEP + ' turns)');
  fab.setAttribute('aria-label', 'Trim Chat History');

  const label = document.createElement('div');
  label.className = 'gpttrimmer-label';
  label.textContent = 'Trim Chat (keep last ' + DEFAULT_KEEP + ')';

  // Assemble shadow DOM
  container.appendChild(fab);
  container.appendChild(label);
  shadow.appendChild(style);
  shadow.appendChild(container);

  // Ensure host has pointer events when hovering over the FAB
  host.addEventListener('mouseenter', () => host.style.pointerEvents = 'auto');
  host.addEventListener('mouseleave', () => host.style.pointerEvents = 'none');

  // Helper: show toast banner (appended to document.body, not shadow) to ensure visibility
  function showToast(message, options = {}) {
    try {
      const id = 'gpttrimmer-toast-v1';
      // Remove existing toast if present
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
        color: '#ffffff',
        padding: '10px 14px',
        borderRadius: '8px',
        boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
        zIndex: 2147483646,
        fontSize: '13px',
        opacity: '0',
        transition: 'opacity 0.2s ease'
      });
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.style.opacity = '1');

      const duration = typeof options.duration === 'number' ? options.duration : 4000;
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          toast.remove();
        }, 220);
      }, duration);
    } catch (err) {
      try { console.warn('GPTTrimmer toast error', err); } catch (e) {}
    }
  }

  // Helper: attempt Notification API (using page Notification permission)
  async function tryNotify(message) {
    try {
      if (!('Notification' in window)) return false;
      if (Notification.permission === 'granted') {
        new Notification(message);
        return true;
      } else if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(message);
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } catch (err) {
      console.error('GPTTrimmer: Notification failed', err);
      return false;
    }
  }

  // The trimming routine
  async function trimConversation() {
    const storageGetKeep = () =>
      new Promise((resolve) => {
        if (!chrome || !chrome.storage || !chrome.storage.sync) {
          resolve(DEFAULT_KEEP);
          return;
        }
        try {
          chrome.storage.sync.get({ keep: DEFAULT_KEEP }, (items) => {
            const val = Number(items.keep);
            if (!Number.isFinite(val) || val < 0) resolve(DEFAULT_KEEP);
            else resolve(Math.floor(val));
          });
        } catch (e) {
          resolve(DEFAULT_KEEP);
        }
      });

    const KEEP = await storageGetKeep();
    let removed = 0;
    try {
      const turns = Array.from(document.querySelectorAll(TURN_SELECTOR) || []);
      const total = turns.length;
      if (total <= KEEP) {
        const msg = `No trimming needed. Total turns: ${total}.`;
        await tryNotify(msg).catch(()=>{});
        showToast(msg);
        return;
      }
      const toRemove = Math.max(0, total - KEEP);
      for (let i = 0; i < toRemove; i++) {
        const node = turns[i];
        if (node && node.parentElement) {
          node.remove();
          removed++;
        }
      }

      const msg = `Trimmed to last ${KEEP} messages (removed ${removed}).`;
      const didNotify = await tryNotify(msg);
      if (!didNotify) showToast(msg);
    } catch (err) {
      console.error('GPTTrimmer trimming failed', err);
      showToast('GPTTrimmer: Error trimming chat — see console.');
    }
  }

  // Click handler
  fab.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    fab.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.96)' }, { transform: 'scale(1)' }], { duration: 160 });
    trimConversation();
  });

  // Keyboard accessibility: pressing Enter or Space triggers the same as click
  fab.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      fab.click();
    }
  });

  try {
    if (!window.__GPTTRIMMER) {
      window.__GPTTRIMMER = {
        trimNow: trimConversation,
        version: '1.0.0'
      };
    }
  } catch (e) {}
})();
