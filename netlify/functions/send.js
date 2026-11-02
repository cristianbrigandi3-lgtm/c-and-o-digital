// Endpoint Netlify: /.netlify/functions/send (redirect pubblico /api/send).
const { handleContact } = require('../../lib/contact-endpoint.js');

exports.handler = async (event) => {
  const ip = String(event.headers?.['x-nf-client-connection-ip'] || event.headers?.['client-ip'] || '').trim();
  const body = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body;
  const response = await handleContact({ method: event.httpMethod, headers: event.headers, body, ip });
  return { ...response, isBase64Encoded: false };
};

