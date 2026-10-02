import { gerarDesenho } from '../../lib/desenho.js';

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  // 1) Método (405)
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ erro: 'Método não permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json; charset=utf-8', Allow: 'POST' }
    });
  }

  // 2) Corpo (400)
  let corpo;
  try {
    corpo = await request.json();
  } catch (e) {
    return json({ erro: 'Corpo ausente ou JSON inválido' }, 400);
  }
  const numero = corpo && corpo.numero;
  if (typeof numero !== 'number' || !Number.isInteger(numero) || numero < 1 || numero > 100) {
    return json({ erro: 'numero deve ser um inteiro entre 1 e 100' }, 400);
  }

  // 3) Token (401)
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return json({ erro: 'Token ausente' }, 401);
  const token = m[1].trim();

  let info;
  try {
    const r = await fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token)
    );
    if (r.status !== 200) return json({ erro: 'Token inválido ou expirado' }, 401);
    info = await r.json();
  } catch (e) {
    return json({ erro: 'Não foi possível verificar o token' }, 401);
  }

  if (!env.GOOGLE_CLIENT_ID || info.aud !== env.GOOGLE_CLIENT_ID) {
    return json({ erro: 'Token emitido para outro aplicativo' }, 401);
  }
  if (String(info.email_verified) !== 'true' || !info.email) {
    return json({ erro: 'E-mail não verificado' }, 401);
  }

  // 200: o e-mail vem do token, nunca do cliente
  const svg = gerarDesenho(numero, info.email);
  return new Response(svg, {
    status: 200,
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' }
  });
}