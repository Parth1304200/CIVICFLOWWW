// CPGRAMS (Centralized Public Grievance Redress and Monitoring System)
// Official portal: https://pgportal.gov.in
// Fallback: complaints stored locally, exported as JSON for manual upload

const CPGRAMS_BASE = process.env.CPGRAMS_BASE_URL ?? 'https://pgportal.gov.in/api';
const CPGRAMS_KEY = process.env.CPGRAMS_API_KEY ?? '';
const FALLBACK = process.env.CPGRAMS_FALLBACK_MODE === 'true';

export interface CPGRAMSComplaint {
  title: string;
  description: string;
  category: string;
  address: string;
  state: string;
  district: string;
  pincode: string;
  citizenName: string;
  citizenPhone: string;
  citizenEmail: string;
}

export async function syncToCPGRAMS(
  complaint: CPGRAMSComplaint
): Promise<{ ref: string; synced: boolean }> {
  if (FALLBACK || !CPGRAMS_KEY) {
    console.warn('[CPGRAMS] Running in fallback mode. Complaint not synced to portal.');
    return { ref: `LOCAL-${Date.now()}`, synced: false };
  }

  try {
    const res = await fetch(`${CPGRAMS_BASE}/v1/grievance/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CPGRAMS_KEY,
        'X-Ministry': 'Delhi-CMO',
      },
      body: JSON.stringify({
        ...complaint,
        state: 'Delhi',
        ministry: 'Urban Development',
        language: 'en',
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`CPGRAMS HTTP ${res.status}`);
    const data = await res.json();
    return { ref: data.registrationNumber ?? data.ref, synced: true };
  } catch (err) {
    console.error('[CPGRAMS] Sync failed:', err);
    return { ref: `FAILED-${Date.now()}`, synced: false };
  }
}

export async function getCPGRAMSStatus(
  ref: string
): Promise<{ status: string; remarks: string } | null> {
  if (FALLBACK || ref.startsWith('LOCAL') || ref.startsWith('FAILED')) {
    return { status: 'local', remarks: 'Complaint managed locally. CPGRAMS sync pending.' };
  }

  try {
    const res = await fetch(`${CPGRAMS_BASE}/v1/grievance/status/${ref}`, {
      headers: { 'X-API-Key': CPGRAMS_KEY },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
