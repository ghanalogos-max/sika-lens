import { bytesToBase64, bytesToHex, pbkdf2Sha256, sha256 } from './kdf';

const utf8 = (s: string) => new TextEncoder().encode(s);

describe('sha256 and pbkdf2', () => {
  it('matches the empty-string and abc SHA-256 vectors', () => {
    expect(bytesToHex(sha256(new Uint8Array()))).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(bytesToHex(sha256(utf8('abc')))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('matches PBKDF2-HMAC-SHA256 for password/salt', () => {
    const password = utf8('password');
    const salt = utf8('salt');
    expect(bytesToHex(pbkdf2Sha256(password, salt, 1))).toBe('120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b');
    expect(bytesToHex(pbkdf2Sha256(password, salt, 2))).toBe('ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43');
    expect(bytesToHex(pbkdf2Sha256(password, salt, 4096))).toBe('c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a');
  });

  it('round-trips base64', () => {
    const bytes = new Uint8Array([0x14, 0xfb, 0x9c, 0x03, 0xd9, 0x7e]);
    expect(bytesToBase64(bytes)).toBe('FPucA9l+');
  });
});
