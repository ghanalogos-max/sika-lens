import { isNewerVersion } from './updatePrompt';

describe('isNewerVersion', () => {
  it('detects patch bumps', () => {
    expect(isNewerVersion('1.1.1', '1.1.0')).toBe(true);
    expect(isNewerVersion('1.1.0', '1.1.1')).toBe(false);
  });

  it('detects minor and major bumps', () => {
    expect(isNewerVersion('1.2.0', '1.1.9')).toBe(true);
    expect(isNewerVersion('2.0.0', '1.9.9')).toBe(true);
  });

  it('treats equal as not newer', () => {
    expect(isNewerVersion('1.1.0', '1.1.0')).toBe(false);
  });
});
