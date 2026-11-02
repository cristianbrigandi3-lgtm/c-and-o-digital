(() => {
  const stage = document.querySelector('#stage');
  if (!stage) return;
  const loaderUrl = document.currentScript?.src || location.href;
  let started = false;
  const hint = document.querySelector('#hint');
  const fallback = stage.querySelector('.stage-fallback');
  const showFallback = message => {
    stage.classList.add('is-static');
    fallback?.removeAttribute('aria-hidden');
    if (fallback && message) {
      const description = fallback.querySelector('span');
      if (description) description.textContent = message;
    }
    if (hint) hint.textContent = 'La scena 3D non è disponibile · puoi continuare dal flusso di esempio.';
  };
  const load = () => {
    if (started) return;
    started = true;
    if (hint) hint.textContent = 'Trascina per ruotare · tocca + per i dettagli';
    const three = document.createElement('script');
    three.src = new URL('vendor/three.min.js', loaderUrl).href;
    three.onload = () => {
      const model = document.createElement('script');
      model.src = new URL('showcase.js', loaderUrl).href;
      model.onload = () => {
        if (stage.classList.contains('is-static')) return;
        fallback?.setAttribute('aria-hidden', 'true');
        stage.classList.add('has-3d');
      };
      model.onerror = () => showFallback('Il modello non si è caricato. Il concept collega una richiesta, gli strumenti e la persona che segue il lavoro.');
      document.head.append(model);
    };
    three.onerror = () => showFallback('La libreria 3D non è disponibile. Puoi comunque esplorare il flusso di esempio.');
    document.head.append(three);
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { observer.disconnect(); load(); }
    }, { rootMargin: '180px' });
    observer.observe(stage);
  } else load();
})();
