import { describe, expect, it } from 'vitest';
import { validateLogo, LOGO_MAX_BYTES } from './branding';
describe('Invoice branding', () => {
  it('accepts PNG JPEG and WebP invoice images', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) expect(validateLogo({ type, size: 1024 })).toBeNull();
  });
  it('rejects non-images and executable SVG uploads', () => expect(validateLogo({ type: 'image/svg+xml', size: 1024 })).not.toBeNull());
  it('limits invoice logos to five megabytes', () => {
    expect(LOGO_MAX_BYTES).toBe(5242880);
    expect(validateLogo({ type: 'image/png', size: 5242881 })).not.toBeNull();
  });
});