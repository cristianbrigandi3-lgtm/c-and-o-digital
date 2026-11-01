(() => {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const nav = document.querySelector('#nav');
  const pages = [...document.querySelectorAll('.page')];
  const routes = pages.map(page => page.dataset.r);
  const reveal = root => {
    const items = root.querySelectorAll('.card,.cols>div,.tile');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(item => item.classList.add('in'));
      return;
    }
    const observer = new IntersectionObserver((entries, current) => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); current.unobserve(entry.target); }
    }), { threshold: .12 });
    items.forEach(item => { item.classList.add('reveal'); observer.observe(item); });
  };

  const updateCurrentLink = (route, spa = false) => {
    const path = route === 'home' ? './' : `${route}/`;
    document.querySelectorAll('.links a').forEach(link => {
      const target = link.getAttribute('href');
      const isCurrent = spa
        ? target === `#/${route}` || (route === 'home' && target === '#/')
        : new URL(target, location.href).pathname === location.pathname;
      if (isCurrent || (!spa && target === path)) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };
  const showRoute = (route, moveFocus = false) => {
    if (!routes.includes(route)) route = 'home';
    pages.forEach(page => { page.hidden = page.dataset.r !== route; });
    updateCurrentLink(route, true);
    const current = pages.find(page => page.dataset.r === route);
    if (current) {
      document.title = current.dataset.t || document.title;
      reveal(current);
      if (moveFocus) {
        window.scrollTo(0, 0);
        current.querySelector('h1')?.focus({ preventScroll: true });
      }
    }
  };
  if (pages.length > 1) {
    const routeFromHash = () => location.hash.replace(/^#\/?/, '') || 'home';
    showRoute(routeFromHash());
    addEventListener('hashchange', () => {
      const route = routeFromHash();
      if (reducedMotion || typeof document.startViewTransition !== 'function') {
        showRoute(route, true);
        return;
      }
      document.startViewTransition(() => showRoute(route, true));
    });
  } else if (pages.length === 1) {
    updateCurrentLink(pages[0].dataset.r, false);
    reveal(pages[0]);
  }
  const updateNav = () => nav?.classList.toggle('s', scrollY > 8);
  addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  const recommendations = {
    richieste: {
      title: 'Concept: una coda unica per le richieste',
      steps: ['Scegli un solo punto di ingresso iniziale.', 'Raccogli soltanto le informazioni necessarie per capire la richiesta.', 'Assegna ogni richiesta a una persona e mostra lo stato del passaggio.'],
    },
    copia: {
      title: 'Concept: elimina un passaggio di copia',
      steps: ['Individua quale dato viene copiato più spesso.', 'Verifica se i due strumenti possono scambiarsi quel dato in modo sicuro.', 'Automatizza un solo passaggio e mantieni una revisione umana.'],
    },
    appuntamenti: {
      title: 'Concept: regole chiare per gli appuntamenti',
      steps: ['Rendi visibili disponibilità e regole di prenotazione.', 'Invia una conferma e un promemoria automatici.', 'Prevedi una via semplice per cambiare o annullare.'],
    },
    documenti: {
      title: 'Concept: un archivio con una sola fonte valida',
      steps: ['Definisci nomi, cartelle e permessi in modo coerente.', 'Raccogli i collegamenti ai documenti usati più spesso.', 'Assegna una persona che verifichi accessi e copie di sicurezza.'],
    },
  };
  const selector = document.querySelector('#friction-select');
  const run = document.querySelector('#friction-run');
  run?.addEventListener('click', () => {
    const plan = recommendations[selector?.value];
    if (!plan) return;
    const output = document.querySelector('#friction-output');
    document.querySelector('#friction-heading').textContent = plan.title;
    const steps = document.querySelector('#friction-steps');
    steps.replaceChildren(...plan.steps.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    output.hidden = false;
  });

  document.querySelectorAll('[data-svc]').forEach(link => {
    link.addEventListener('click', () => {
      const target = new URL(link.href, location.href);
      target.searchParams.set('servizio', link.dataset.svc);
      link.href = target.href;
    }, { once: true });
  });

  const form = document.querySelector('#f');
  if (!form) return;
  const service = new URLSearchParams(location.search).get('servizio');
  if (service && [...form.elements.servizio.options].some(option => option.value === service || option.textContent === service)) {
    form.elements.servizio.value = service;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const status = document.querySelector('#note');
    const button = form.querySelector('[type="submit"]');
    const invalid = [...form.querySelectorAll('[required]')].find(field => !field.value.trim());
    if (invalid) { invalid.focus(); status.textContent = 'Completa i campi obbligatori.'; return; }
    if (form.elements.website.value || button.disabled) return;
    button.disabled = true;
    status.textContent = 'Invio in corso…';
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.elements.nome.value,
          contatto: form.elements.contatto.value,
          servizio: form.elements.servizio.value,
          msg: form.elements.msg.value,
          website: form.elements.website.value,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Richiesta non inviata.');
      form.reset();
      status.textContent = 'Richiesta inviata. Ti ricontatteremo usando il recapito indicato.';
    } catch (error) {
      status.textContent = error.message || 'Invio non riuscito. Riprova più tardi.';
    } finally {
      button.disabled = false;
    }
  });
})();
