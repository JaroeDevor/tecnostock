const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
if (!process.env.ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY no configurada. Abortando el inicio por seguridad.");
}
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Must be 256 bits (32 bytes)
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  if (!text) return text;
  const textParts = text.split(':');
  if (textParts.length !== 2) return text; // Maybe it's not encrypted yet

  const iv = Buffer.from(textParts[0], 'hex');
  const encryptedText = Buffer.from(textParts[1], 'hex');
  
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed', err);
    return null;
  }
}

module.exports = { encrypt, decrypt };
