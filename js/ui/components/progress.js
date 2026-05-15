/**
 * progress.js — Worker Task Progress Bar Manager
 * Main thread only (DOM). Driven by PROGRESS events forwarded from WorkerManager.
 */

export class ProgressManager {
  constructor() {
    this._bar   = null;
    this._label = null;
    this._wrap  = null;
  }

  show(stage = '', value = 0) {
    this._ensureElements();
    this._wrap.hidden = false;
    this.update(stage, value);
  }

  update(stage, value) {
    if (!this._bar) return;
    const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
    this._bar.style.width = `${pct}%`;
    this._bar.setAttribute('aria-valuenow', pct);
    if (stage) this._label.textContent = stage;
  }

  hide() {
    if (this._wrap) {
      this._wrap.hidden = true;
      this.update('', 0);
    }
  }

  _ensureElements() {
    if (this._wrap) return;

    this._wrap = document.getElementById('progress-wrap');
    if (!this._wrap) {
      this._wrap = document.createElement('div');
      this._wrap.id = 'progress-wrap';
      this._wrap.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:9998;' +
        'background:#1a1a2e;padding:.4rem .8rem;display:flex;' +
        'flex-direction:column;gap:.25rem;';
      document.body.prepend(this._wrap);
    }

    this._label = this._wrap.querySelector('#progress-label');
    if (!this._label) {
      this._label = document.createElement('span');
      this._label.id = 'progress-label';
      this._label.style.cssText = 'font-size:.75rem;color:#aaa;';
      this._wrap.appendChild(this._label);
    }

    const track = this._wrap.querySelector('#progress-track');
    let trackEl = track;
    if (!trackEl) {
      trackEl = document.createElement('div');
      trackEl.id = 'progress-track';
      trackEl.style.cssText = 'height:4px;background:#333;border-radius:2px;overflow:hidden;';
      this._wrap.appendChild(trackEl);
    }

    this._bar = trackEl.querySelector('#progress-bar');
    if (!this._bar) {
      this._bar = document.createElement('div');
      this._bar.id = 'progress-bar';
      this._bar.role = 'progressbar';
      this._bar.setAttribute('aria-valuemin', '0');
      this._bar.setAttribute('aria-valuemax', '100');
      this._bar.setAttribute('aria-valuenow', '0');
      this._bar.style.cssText =
        'height:100%;width:0%;background:#5c6bc0;' +
        'transition:width .15s ease;border-radius:2px;';
      trackEl.appendChild(this._bar);
    }

    this._wrap.hidden = true;
  }
}
