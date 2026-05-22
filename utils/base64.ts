// Pure JS base64 to ArrayBuffer decoder.
// Does not use global atob, making it fully compatible with React Native's Hermes engine and web browsers.

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// lookup table for decoding
const lookup = new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

export function decodeBase64ToArrayBuffer(base64: string): ArrayBuffer {
  // Strip potential data URL prefix
  const pureBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');

  let bufferLength = pureBase64.length * 0.75;
  const len = pureBase64.length;
  let i;
  let p = 0;
  let encoded1, encoded2, encoded3, encoded4;

  if (pureBase64[pureBase64.length - 1] === '=') {
    bufferLength--;
    if (pureBase64[pureBase64.length - 2] === '=') {
      bufferLength--;
    }
  }

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const bytes = new Uint8Array(arrayBuffer);

  for (i = 0; i < len; i += 4) {
    encoded1 = lookup[pureBase64.charCodeAt(i)];
    encoded2 = lookup[pureBase64.charCodeAt(i + 1)];
    encoded3 = lookup[pureBase64.charCodeAt(i + 2)];
    encoded4 = lookup[pureBase64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (p < bufferLength) {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (p < bufferLength) {
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  }

  return arrayBuffer;
}
