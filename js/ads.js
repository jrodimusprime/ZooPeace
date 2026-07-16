/** Mount the top horizontal AdSense unit (game_horizontal). */
const Ads = (() => {
  function init() {
    const host = document.getElementById('ad-top-slot');
    if (!host || host.dataset.adMounted === '1') return;
    host.dataset.adMounted = '1';
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_) {
      /* blocked or unavailable */
    }
  }

  return { init };
})();
