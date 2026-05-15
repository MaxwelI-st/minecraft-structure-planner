/**
 * toast.js — Lightweight Toast Notification Manager
 * Main thread only (DOM). No Worker dependency.
 */

const DURATION = { success: 3000, info: 3000, warn: 5000, error: 6000 };
const ICONS    = { success: '✅', info: 'ℹ️', warn: '⚠️', error: '❌' };

export class ToastManager {
  constructor() {
    this._container = this._ensureContainer();
  }

  success(msg) { this._show(msg, 'success'); }
  info(msg)    { this._show(msg, 'info');    }
  warn(msg)    { this._show(msg, 'warn');    }
  error(msg)   { this._show(msg, 'error');   }

  _show(msg, level) {
    const el = document.createElement('div');
    el.className = `toast toast--${level}`;
    el.textContent = `${ICONS[level]} ${msg}`;
    this._container.appendChild(el);

    // Fade-in on next tick
    requestAnimationFrame(() => el.classList.add('toast--visible'));

    setTimeout(() => {
      el.classList.remove('toast--visible');
      el.addEventListener('transitionend', () => el.remove(), { once: true });
    }, DURATION[level]);
  }

  _ensureContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      c.style.cssText =
        'position:fixed;bottom:1rem;right:1rem;z-index:9999;' +
        'display:flex;flex-direction:column;gap:.5rem;pointer-events:none;';
      document.body.appendChild(c);
    }
    return c;
  }
}
