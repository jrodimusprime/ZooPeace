/**
 * AdSense helpers.
 * Top strip: game_horizontal (5575955375)
 * Recover break: medium display unit (1114086321) — two 10s slots after KO
 */
const Ads = (() => {
  const CLIENT = 'ca-pub-8968684526399437';
  const SLOT_TOP = '5575955375';
  const SLOT_MEDIUM = '1114086321';
  const RECOVER_AD_SECONDS = 10;
  const RECOVER_AD_COUNT = 2;

  let recoverTimer = null;
  let recoverBusy = false;

  function isSmoke() {
    return new URLSearchParams(location.search).get('smoke') === '1';
  }

  function pushAd() {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_) {
      /* blocked or unavailable */
    }
  }

  function init() {
    const host = document.getElementById('ad-top-slot');
    if (!host || host.dataset.adMounted === '1') return;
    host.dataset.adMounted = '1';
    pushAd();
  }

  function mountMediumAd(container) {
    if (!container) return;
    container.innerHTML = '';
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle recover-ad-ins';
    ins.style.display = 'block';
    ins.style.width = '300px';
    ins.style.height = '250px';
    ins.setAttribute('data-ad-client', CLIENT);
    ins.setAttribute('data-ad-slot', SLOT_MEDIUM);
    ins.setAttribute('data-ad-format', 'rectangle');
    ins.setAttribute('data-full-width-responsive', 'false');
    container.appendChild(ins);
    pushAd();
  }

  function setRecoverUi(adIndex, secondsLeft) {
    const stepEl = document.getElementById('recover-ad-step');
    const secondsEl = document.getElementById('recover-ad-seconds');
    const btn = document.getElementById('btn-recover-ad-continue');
    if (stepEl && typeof t === 'function') {
      stepEl.textContent = t('recoverAdStep', { n: adIndex, total: RECOVER_AD_COUNT });
    } else if (stepEl) {
      stepEl.textContent = `Ad ${adIndex} / ${RECOVER_AD_COUNT}`;
    }
    if (secondsEl) secondsEl.textContent = String(Math.max(0, secondsLeft));
    if (btn) {
      btn.disabled = true;
      btn.textContent = typeof t === 'function'
        ? t('recoverAdWait', { n: Math.max(0, secondsLeft) })
        : `Wait (${Math.max(0, secondsLeft)})`;
    }
  }

  function clearRecoverTimer() {
    if (recoverTimer) {
      clearInterval(recoverTimer);
      recoverTimer = null;
    }
  }

  function hideRecoverBreak() {
    clearRecoverTimer();
    recoverBusy = false;
    document.getElementById('recover-ad-modal')?.classList.add('hidden');
  }

  /**
   * Show 2 medium ads for 10 seconds each, then call onDone.
   * Skips instantly during ?smoke=1.
   */
  function presentRecoverBreak(onDone) {
    const finish = typeof onDone === 'function' ? onDone : () => {};

    if (isSmoke()) {
      hideRecoverBreak();
      finish();
      return;
    }

    if (recoverBusy) return;
    recoverBusy = true;

    const overlay = document.getElementById('recover-ad-modal');
    const host = document.getElementById('recover-ad-slot');
    if (!overlay || !host) {
      recoverBusy = false;
      finish();
      return;
    }

    if (typeof applyStaticI18n === 'function') applyStaticI18n();
    overlay.classList.remove('hidden');

    let adIndex = 1;

    const runAd = () => {
      clearRecoverTimer();
      mountMediumAd(host);
      let left = RECOVER_AD_SECONDS;
      setRecoverUi(adIndex, left);

      recoverTimer = setInterval(() => {
        left -= 1;
        setRecoverUi(adIndex, left);
        if (left > 0) return;

        clearRecoverTimer();
        if (adIndex < RECOVER_AD_COUNT) {
          adIndex += 1;
          runAd();
          return;
        }

        const btn = document.getElementById('btn-recover-ad-continue');
        if (btn) {
          btn.disabled = false;
          btn.textContent = typeof t === 'function' ? t('recover') : 'Recover';
        }
        // Auto-continue after the last countdown so recovery feels seamless.
        hideRecoverBreak();
        finish();
      }, 1000);
    };

    runAd();
  }

  return {
    init,
    presentRecoverBreak,
    hideRecoverBreak,
  };
})();
