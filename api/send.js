// Endpoint Vercel: POST /api/send. La validazione è condivisa con Netlify.
const { handleContact } = require('../lib/contact-endpoint.js');

module.exports = async (req, res) => {
  const ip = String(req.headers?.['x-real-ip'] || req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  const response = await handleContact({ method: req.method, headers: req.headers, body: req.body, ip });
  for (const [name, value] of Object.entries(response.headers)) res.setHeader(name, value);
  return res.status(response.statusCode).send(response.body);
};
