(() => {
  const stage = document.querySelector('#stage');
  if (!stage) return;
  const loaderUrl = document.currentScript?.src || location.href;
  let started = false;
  const hint = document.querySelector('#hint');
  const load = () => {
    if (started) return;
    started = true;
    if (hint) hint.textContent = 'Trascina per ruotare · tocca + per i dettagli';
    const three = document.createElement('script');
    three.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
    three.onload = () => {
      const model = document.createElement('script');
      model.src = new URL('showcase.js', loaderUrl).href;
      model.onload = () => stage.classList.add('has-3d');
      document.head.append(model);
    };
    three.onerror = () => {
      if (hint) hint.textContent = 'Il modello richiede una connessione a internet per caricare Three.js.';
    };
    document.head.append(three);
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { observer.disconnect(); load(); }
    }, { rootMargin: '180px' });
    observer.observe(stage);
  } else load();
})();
