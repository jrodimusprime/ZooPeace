document.addEventListener('DOMContentLoaded', () => {
  const save = loadSave();
  UI.init(save);
  UI.boot(save);

  if (new URLSearchParams(location.search).get('test') === '1') {
    const s = document.createElement('script');
    s.src = 'js/test-runner.js';
    s.onload = () => TestRunner.runLogicTests();
    document.body.appendChild(s);
  }
});
