// https://stackoverflow.com/questions/60369148/how-do-i-replace-deprecated-crypto-createcipher-in-nodejs

'use strict';

module.exports = { encrypt, decrypt };

const {
  HEX_DIGITS // 64 random hex digits
} = process.env;

const en = require('int-encoder'); // for compressing hex to base64
const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const ENCRYPTION_KEY = Buffer.from(HEX_DIGITS, 'hex');
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return en.encode(iv.toString('hex'), 16) + ':' + en.encode(encrypted.toString('hex'), 16);
}

function decrypt(text) {
  console.log('decrypting: ', text);
  const textParts = text.split(':').map(part => en.decode(part, 16));
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}