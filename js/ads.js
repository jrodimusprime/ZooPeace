/**
 * AdSense helpers for Zoo Peace Maker.
 * Publisher: ca-pub-8968684526399437
 *
 * Create a Display ad unit in AdSense → Ads → By ad unit,
 * then paste the data-ad-slot value into AD_SLOT below.
 * Until a slot is set, banners still reserve space and the
 * victory interstitial still runs its 5s gate (Auto ads may fill elsewhere).
 */
const Ads = (() => {
  const CLIENT = 'ca-pub-8968684526399437';
  /** Paste your AdSense Display ad unit slot ID here (digits only). */
  const AD_SLOT = '1114086321';
  const VICTORY_SECONDS = 5;

  let victoryTimer = null;
  let victoryResolve = null;

  function isSmoke() {
    return new URLSearchParams(location.search).get('smoke') === '1';
  }

  function pushAd(ins) {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_) {
      /* AdSense may throw if blocked or already filled */
    }
    return ins;
  }

  function buildIns() {
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', CLIENT);
    if (AD_SLOT) ins.setAttribute('data-ad-slot', AD_SLOT);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    return ins;
  }

  /** Mount (or remount) an AdSense unit into a container. */
  function mount(container, { remount = false } = {}) {
    if (!container) return;
    if (container.dataset.adMounted === '1' && !remount) return;

    container.innerHTML = '';
    container.dataset.adMounted = '1';

    if (!AD_SLOT) {
      container.classList.add('ad-slot-empty');
      return;
    }

    container.classList.remove('ad-slot-empty');
    const ins = buildIns();
    container.appendChild(ins);
    pushAd(ins);
  }

  function mountAll() {
    document.querySelectorAll('[data-ad-slot-host]').forEach((el) => mount(el));
  }

  function setContinueLabel(btn, secondsLeft) {
    if (!btn) return;
    const base = typeof t === 'function' ? t('continue') : 'Continue';
    if (secondsLeft > 0) {
      btn.textContent = typeof t === 'function'
        ? t('continueIn', { n: secondsLeft })
        : `${base} (${secondsLeft})`;
      btn.disabled = true;
      btn.classList.add('btn-waiting');
    } else {
      btn.textContent = base;
      btn.disabled = false;
      btn.classList.remove('btn-waiting');
    }
  }

  /**
   * Show the victory ad gate for VICTORY_SECONDS, then enable Continue.
   * Resolves when the countdown finishes (or immediately in smoke tests).
   */
  function presentVictoryAd() {
    const overlay = document.getElementById('victory-ad-overlay');
    const host = document.getElementById('ad-slot-victory');
    const btn = document.getElementById('btn-victory-ad-continue');
    const secondsEl = document.getElementById('victory-ad-seconds');

    if (victoryTimer) {
      clearInterval(victoryTimer);
      victoryTimer = null;
    }

    if (!overlay) {
      return Promise.resolve();
    }

    if (isSmoke()) {
      overlay.classList.add('hidden');
      return Promise.resolve();
    }

    overlay.classList.remove('hidden');
    if (typeof applyStaticI18n === 'function') applyStaticI18n();
    mount(host, { remount: true });

    let left = VICTORY_SECONDS;
    if (secondsEl) secondsEl.textContent = String(left);
    setContinueLabel(btn, left);

    return new Promise((resolve) => {
      victoryResolve = resolve;
      victoryTimer = setInterval(() => {
        left -= 1;
        if (secondsEl) secondsEl.textContent = String(Math.max(0, left));
        setContinueLabel(btn, left);
        if (left <= 0) {
          clearInterval(victoryTimer);
          victoryTimer = null;
          setContinueLabel(btn, 0);
          const done = victoryResolve;
          victoryResolve = null;
          hideVictoryAd();
          if (done) done();
        }
      }, 1000);
    });
  }

  function hideVictoryAd() {
    if (victoryTimer) {
      clearInterval(victoryTimer);
      victoryTimer = null;
    }
    victoryResolve = null;
    document.getElementById('victory-ad-overlay')?.classList.add('hidden');
  }

  function dismissVictoryAd() {
    const btn = document.getElementById('btn-victory-ad-continue');
    if (btn?.disabled) return;
    const done = victoryResolve;
    hideVictoryAd();
    if (done) done();
  }

  function bind() {
    const btn = document.getElementById('btn-victory-ad-continue');
    if (btn && !btn.dataset.adBound) {
      btn.dataset.adBound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        dismissVictoryAd();
      });
    }
  }

  function init() {
    bind();
    mountAll();
  }

  return {
    init,
    mount,
    mountAll,
    presentVictoryAd,
    hideVictoryAd,
    VICTORY_SECONDS,
  };
})();
