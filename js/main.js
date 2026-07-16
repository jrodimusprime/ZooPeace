document.addEventListener('DOMContentLoaded', () => {
  const save = loadSave();
  UI.init(save);
  UI.boot(save);
  if (typeof Ads !== 'undefined') Ads.init();

  const params = new URLSearchParams(location.search);

  if (params.get('test') === '1') {
    const s = document.createElement('script');
    s.src = 'js/test-runner.js';
    s.onload = () => TestRunner.runLogicTests();
    document.body.appendChild(s);
  }

  if (params.get('gameplay-test') === '1') {
    const s = document.createElement('script');
    s.src = 'js/gameplay-sim.js';
    s.onload = () => GameplaySim.run();
    document.body.appendChild(s);
  }

  if (params.get('smoke') === '1') {
    const s = document.createElement('script');
    s.src = 'js/button-smoke.js';
    s.onload = () => ButtonSmoke.run();
    document.body.appendChild(s);
  }
});
