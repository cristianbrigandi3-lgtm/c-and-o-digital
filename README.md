# C & O Web Assistance

Sito in preparazione per un futuro progetto di servizi digitali rivolto in primo luogo a piccole imprese. Il repo è una base di lavoro, **non una società o un’offerta commerciale attiva**.

La direzione commerciale ipotizzata, le offerte da validare e il percorso pre-lancio sono documentati in docs/STRATEGIA-STARTUP.md.

## Struttura

- `index.html` — sorgente delle sezioni e dei testi.
- `assets/site.css`, `assets/site.js` — stile e interazioni condivise.
- `assets/showcase.js` — modello 3D originale; Three.js 0.149.0 è incluso localmente e caricato solo vicino alla scena.
- `assets/vendor/` — Three.js, Bricolage Grotesque variabile e relative licenze. I file vengono pubblicati insieme agli asset, senza CDN.
- `scripts/build.mjs` — genera le sei pagine statiche nella cartella `public/`.
- `api/send.js` e `netlify/functions/send.js` — adattatori per Vercel e Netlify; condividono la logica in `lib/`.
- `public/` — sola cartella da pubblicare. Viene rigenerata; non contiene i sorgenti del backend, i test o i documenti interni.
- `docs/` — brief originale e piano interno pre-lancio; non vengono copiati nel sito.

## Anteprima in preparazione

La build predefinita è volutamente prudente:

- crea URL statici separati (`/servizi/`, `/chi-siamo/`, `/contatti/`, `/privacy/`, `/termini/`), quindi ricarica e link diretti puntano alla pagina giusta;
- imposta `noindex,nofollow` e `robots.txt` blocca la scansione;
- `/contatti/` non mostra un modulo e non raccoglie dati;
- l’endpoint email rifiuta richieste finché `CONTACT_ENABLED` non è `true`;
- la cartella pubblicabile è soltanto `public/`.

Genera la preview con npm run build oppure node scripts/build.mjs. Netlify e Vercel usano lo stesso script, la stessa cartella di output e la stessa URL pubblica /api/send. Il progetto non è pubblicato da questo comando. Per visualizzarla come sul sito pubblicato, avvia npm run preview dopo la build e apri http://127.0.0.1:4173: il server locale serve esclusivamente public.

Il modello 3D conserva la scena originale e carica la libreria solo quando la scena si avvicina allo schermo. Three.js è distribuito in `assets/vendor/three.min.js`; la versione e la licenza MIT sono conservate insieme al codice. La preview non deve effettuare richieste a un CDN per mostrare la scena.

## Protezioni del modulo, da attivare solo al lancio

La function condivide validazione e invio email. Rifiuta origini diverse, metodi e content-type errati, JSON non valido e payload oltre 12 KB; valida nome e recapito, limita i campi, neutralizza HTML nella email e risponde senza cache. Le credenziali non arrivano mai al browser.

L’antispam usa Redis REST in Upstash: massimo 5 richieste per IP in 10 minuti, contatore atomico e condiviso tra istanze serverless, chiavi con hash SHA-256, scadenza automatica. Il sistema fallisce in modo chiuso se mancano le credenziali Redis. La function rifiuta tutto finché non vengono configurati tutti i requisiti:

1. completare e far verificare i testi legali e i dati dell’attività;
2. scegliere provider, regioni e condizioni di trattamento;
3. configurare un database Upstash e le variabili `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` solo lato server;
4. impostare `CONTACT_ENABLED=true`, `ALLOWED_ORIGIN` con l’origine HTTPS esatta, `GMAIL_USER`, `GMAIL_APP_PASSWORD` e `MAIL_TO` nelle variabili segrete del provider;
5. assicurarsi che il dominio, l’indirizzo email e il canale di risposta siano sotto il controllo del titolare.

`.env.example` contiene nomi di variabili vuoti, non segreti. Non committare mai `.env` o token. Non eseguire `test-mail`: manda un’email vera; usalo solo quando avrai configurato intenzionalmente il servizio.

## Preparazione al lancio

Leggi [`docs/PIANO-PRE-LANCIO.md`](docs/PIANO-PRE-LANCIO.md) e completa ogni campo prima di costruire la versione pubblica. Per passare da preview a lancio si dovrà impostare `SITE_PRELAUNCH=false`, compilare `SITE_URL`, identità e dati applicabili, fornitori e periodo di conservazione, sostituire i segnaposto nei testi sorgente e impostare `PRIVACY_TEXT_APPROVED=true` e `TERMS_TEXT_APPROVED=true` dopo una revisione professionale.

Lo script blocca la build di lancio se mancano variabili, se l’URL non è HTTPS, se il titolare non ha dichiarato verificate privacy e condizioni, se restano segnaposto o testi di pre-lancio. Il flag di approvazione non sostituisce una verifica reale.

Il sito non installa strumenti di analytics o marketing intenzionali e non mostra banner cookie nella preview. L’hosting può comunque registrare dati tecnici nei propri log. Se in futuro si aggiungono analytics, pixel, incorporamenti, chat o cookie non tecnici, aggiornare la valutazione privacy e la gestione del consenso prima di attivarli.

## Riferimenti per la checklist

- [GDPR, articolo 13](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679): identità e contatti del titolare, finalità, base giuridica, destinatari, trasferimenti, conservazione e diritti.
- [D.Lgs. 70/2003, articolo 7](https://www.parlamento.it/parlam/leggi/deleghe/03070dl.htm): informazioni generali accessibili del prestatore di servizi online.
- [Garante Privacy — FAQ cookie](https://www.garanteprivacy.it/faq/cookie): il banner dipende dagli strumenti effettivamente installati; i soli cookie tecnici richiedono informativa, non il banner.
- [AgID — linee guida sull’accessibilità dei servizi](https://www.agid.gov.it/it/notizie/european-accessibility-act-eaa-pubblicate-le-linee-guida-agid-sullaccessibilita-dei-servizi): verificare l’ambito di applicazione in base a servizi, clienti e forma d’impresa prima del lancio.

Questa guida non costituisce consulenza legale o fiscale. Forma dell’attività, capacità di firmare contratti, fiscalità, privacy, e-commerce e accessibilità devono essere verificati con professionisti quando il lancio sarà concreto.

