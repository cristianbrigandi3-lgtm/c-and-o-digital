// Prova locale: node --env-file=.env test-mail.mjs
import mail from './lib/mail.js';

const to = process.env.MAIL_TO || process.env.GMAIL_USER;

try {
  await mail.sendContactMail({
    nome: 'Test dal terminale',
    contatto: 'tester@example.invalid',
    servizio: 'Automazioni',
    msg: 'Se leggi questa email, Gmail SMTP con la password per le app funziona.',
  });
  console.log('Email inviata a', to);
} catch (e) {
  console.error('Errore:', e.message);
  process.exitCode = 1;
}
