import { SanitizePipe } from './sanitize.pipe';

describe('SanitizePipe', () => {
  let pipe: SanitizePipe;

  beforeEach(() => {
    pipe = new SanitizePipe();
  });

  const bodyMeta: any = { type: 'body' };
  const queryMeta: any = { type: 'query' };

  // ─── Non-body types must pass through unchanged ───────────────────────────

  it('does not mutate query params', () => {
    const value = { q: '<script>alert(1)</script>' };
    expect(pipe.transform(value, queryMeta)).toBe(value);
  });

  it('passes null through', () => {
    expect(pipe.transform(null, bodyMeta)).toBeNull();
  });

  it('passes non-object primitives through', () => {
    expect(pipe.transform('hello', bodyMeta)).toBe('hello');
    expect(pipe.transform(42, bodyMeta)).toBe(42);
  });

  // ─── Basic HTML tag stripping ─────────────────────────────────────────────

  it('strips a simple <b> tag', () => {
    const result = pipe.transform({ name: '<b>Alice</b>' }, bodyMeta);
    expect(result.name).toBe('Alice');
  });

  it('strips <script> tags and their content', () => {
    const result = pipe.transform(
      { msg: '<script>document.cookie</script>Hello' },
      bodyMeta,
    );
    expect(result.msg).toBe('Hello');
  });

  it('strips inline event handlers', () => {
    const result = pipe.transform({ x: '<img onerror="alert(1)">' }, bodyMeta);
    expect(result.x).not.toContain('onerror');
    expect(result.x).not.toContain('<img');
  });

  it('removes javascript: URIs', () => {
    const result = pipe.transform({ href: 'javascript:alert(1)' }, bodyMeta);
    expect(result.href).not.toContain('javascript:');
  });

  // ─── Entity-encoded payloads must NOT be decoded back to raw HTML ─────────

  it('preserves &lt; entities — does not re-introduce raw angle brackets', () => {
    const result = pipe.transform({ msg: '&lt;script&gt;alert(1)&lt;/script&gt;' }, bodyMeta);
    // After processing, no real < or > tags should be in the result
    expect(result.msg).not.toContain('<script>');
    // The entities themselves should remain (safe for React rendering)
    expect(result.msg).toContain('&lt;');
  });

  it('does not decode &amp; into & then re-interpret as HTML', () => {
    const result = pipe.transform({ msg: '&amp;lt;img&amp;gt;' }, bodyMeta);
    expect(result.msg).not.toContain('<img');
  });

  // ─── Nested objects and arrays ────────────────────────────────────────────

  it('sanitizes nested objects recursively', () => {
    const result = pipe.transform(
      { user: { name: '<b>Bob</b>', bio: 'clean text' } },
      bodyMeta,
    );
    expect(result.user.name).toBe('Bob');
    expect(result.user.bio).toBe('clean text');
  });

  it('sanitizes string values inside arrays', () => {
    const result = pipe.transform(
      { tags: ['<b>tag1</b>', 'tag2', '<script>x</script>'] },
      bodyMeta,
    );
    expect(result.tags).toEqual(['tag1', 'tag2', '']);
  });

  it('preserves non-string values (numbers, booleans)', () => {
    const result = pipe.transform({ count: 5, active: true }, bodyMeta);
    expect(result.count).toBe(5);
    expect(result.active).toBe(true);
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────

  it('trims surrounding whitespace', () => {
    const result = pipe.transform({ name: '  Alice  ' }, bodyMeta);
    expect(result.name).toBe('Alice');
  });

  it('handles empty string', () => {
    const result = pipe.transform({ name: '' }, bodyMeta);
    expect(result.name).toBe('');
  });

  it('handles a string that becomes empty after stripping', () => {
    const result = pipe.transform({ name: '<b></b>' }, bodyMeta);
    expect(result.name).toBe('');
  });

  it('preserves normal French text with accents', () => {
    const result = pipe.transform(
      { msg: 'Réservation confirmée — merci d\'avoir choisi notre hôtel.' },
      bodyMeta,
    );
    expect(result.msg).toBe('Réservation confirmée — merci d\'avoir choisi notre hôtel.');
  });

  it('handles mixed content (text + tags)', () => {
    const result = pipe.transform(
      { msg: 'Hello <b>World</b>, how are you?' },
      bodyMeta,
    );
    expect(result.msg).toBe('Hello World, how are you?');
  });
});
