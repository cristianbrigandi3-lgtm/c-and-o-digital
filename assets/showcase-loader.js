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
    three.src = new URL('vendor/three.min.js', loaderUrl).href;
    three.onload = () => {
      const model = document.createElement('script');
      model.src = new URL('showcase.js', loaderUrl).href;
      model.onload = () => stage.classList.add('has-3d');
      document.head.append(model);
    };
    three.onerror = () => {
      if (hint) hint.textContent = 'Il modello 3D non è disponibile in questa anteprima.';
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
