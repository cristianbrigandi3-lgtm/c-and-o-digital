# C&O — Cristian & Omar

Sito vetrina statico, senza backend. Deploy su GitHub Pages.

## Pagine
- `index.html` — home + form preventivo (FormSubmit)
- `servizi.html` — pacchetti `#pacchetti`, strumenti `#tools`, dettaglio
- `recensioni.html` — legge `data/recensioni.json`, invio via FormSubmit da moderare
- `404.html` — non trovata

## Foto team (`index.html#team`)
Sostituisci `<div class="foto-slot">` con `<img src="img/team/cristian.jpg" ...>` (72x72, `object-fit: cover` già gestito dal CSS).

## Form
Nessun Netlify. I form puntano a `https://formsubmit.co/cristianbrigandi3@gmail.com`.
Prima attivazione: arriva email di conferma FormSubmit, cliccare "Activate".

## Recensioni
1. Arriva email FormSubmit con nome/voto/testo.
2. Verifica che sia un cliente vero.
3. Aggiungi riga a `data/recensioni.json`: `{"nome":"...","voto":5,"testo":"...","data":"2026-10-05"}`
4. Commit + push. Pages aggiorna in ~1 min.

## Deploy (GitHub Pages)
Settings → Pages → Deploy from branch → `main` / `/ (root)`.
URL: `https://cristianbrigandi3-lgtm.github.io/c-and-o-digital/`
File `.nojekyll` incluso per servire tutto così com'è.
