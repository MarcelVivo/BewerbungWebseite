const encoder = new TextEncoder();
const decoder = new TextDecoder();

function encodeBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

async function importKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function createRecruiterSession(secret: string, lifetimeMs = 8 * 60 * 60 * 1000) {
  const payload = encodeBase64Url(encoder.encode(JSON.stringify({
    aud: 'recruiter',
    exp: Date.now() + lifetimeMs,
  })));
  const signature = await crypto.subtle.sign('HMAC', await importKey(secret), encoder.encode(payload));
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifyRecruiterSession(token: string, secret: string) {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature || !secret || secret.length < 32) return false;
    const valid = await crypto.subtle.verify(
      'HMAC',
      await importKey(secret),
      decodeBase64Url(signature),
      encoder.encode(payload),
    );
    if (!valid) return false;
    const decoded = JSON.parse(decoder.decode(decodeBase64Url(payload)));
    return decoded?.aud === 'recruiter'
      && typeof decoded.exp === 'number'
      && decoded.exp > Date.now();
  } catch {
    return false;
  }
}
