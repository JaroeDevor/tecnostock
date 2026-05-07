const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
if (!process.env.ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY no configurada. Abortando el inicio por seguridad.");
}
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Must be 256 bits (32 bytes)
const IV_LENGTH = 12; // GCM recommended IV length

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  // Formato: iv:authTag:encrypted
  return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

function decrypt(text) {
  if (!text) return text;
  const parts = text.split(':');

  // Compatibilidad con formato CBC antiguo (iv:encrypted — 2 partes)
  if (parts.length === 2) {
    return decryptLegacyCBC(text);
  }

  if (parts.length !== 3) return null;

  try {
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = Buffer.from(parts[2], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('GCM decryption failed', err.message);
    return null;
  }
}

// Fallback para tokens encriptados con el formato CBC anterior
function decryptLegacyCBC(text) {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Legacy CBC decryption failed', err.message);
    return null;
  }
}

module.exports = { encrypt, decrypt };
