export const PRODUCT_SLUG = 'rubric-feedback-bundles';
export const LICENSE_KEY = `sb_license:${PRODUCT_SLUG}`;
const VERDICT_KEY = `${LICENSE_KEY}:verdict`;
export const BILLING_BASE = import.meta.env.VITE_BILLING_BASE || 'https://api.sociobot.in/api/v1';

export interface LicenseState {
  unlocked: boolean;
  checking: boolean;
  notice: string;
}

export function checkoutUrl(): string {
  return `${BILLING_BASE}/products/${PRODUCT_SLUG}/checkout`;
}

export function captureReturnedLicense(): string | null {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (token) {
    localStorage.setItem(LICENSE_KEY, token);
    localStorage.removeItem(VERDICT_KEY);
    url.searchParams.delete('license');
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
  return token;
}

export function storedLicense(): string {
  return localStorage.getItem(LICENSE_KEY) ?? '';
}

export function storeLicense(token: string): void {
  localStorage.setItem(LICENSE_KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function cachedUnlock(): boolean {
  try {
    const verdict = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? 'null') as { valid?: boolean } | null;
    return Boolean(storedLicense() && verdict?.valid);
  } catch { return false; }
}

export async function verifyLicense(force = false): Promise<LicenseState> {
  const token = storedLicense();
  if (!token) return { unlocked: false, checking: false, notice: '' };
  try {
    const cached = JSON.parse(localStorage.getItem(VERDICT_KEY) ?? 'null') as { valid: boolean; at: number } | null;
    if (!force && cached && Date.now() - cached.at < 86_400_000) {
      return { unlocked: cached.valid, checking: false, notice: cached.valid ? '' : 'License no longer active.' };
    }
  } catch { /* verify below */ }
  if (!navigator.onLine) return { unlocked: cachedUnlock(), checking: false, notice: 'License check will resume when you’re online.' };
  try {
    const response = await fetch(`${BILLING_BASE}/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification service unavailable');
    const result = await response.json() as { valid: boolean };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, at: Date.now() }));
    return { unlocked: result.valid, checking: false, notice: result.valid ? '' : 'License no longer active.' };
  } catch {
    return { unlocked: cachedUnlock(), checking: false, notice: 'Could not refresh the license. Cached access is unchanged.' };
  }
}
