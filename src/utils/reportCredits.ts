import { PurchaseTransaction, ReportPricingPlan } from '../types';

const STORAGE_KEY_CREDITS = 'thermoduct_report_credits_v1';
const STORAGE_KEY_TX = 'thermoduct_report_transactions_v1';

export const REPORT_PRICING_PLANS: ReportPricingPlan[] = [
  {
    id: 'single',
    name: 'Single Report Pass',
    reportsCount: 1,
    priceIdr: 49000,
    priceUsd: 3.5,
    description: 'Cocok untuk 1x verifikasi perhitungan atau inspeksi audit cepat.',
  },
  {
    id: 'pack5',
    name: 'Project Pack (5 Laporan)',
    reportsCount: 5,
    priceIdr: 179000,
    priceUsd: 12.5,
    popular: true,
    savingsPercent: 27,
    description: 'Paling diminati untuk proyek audit plant, multi-ducting, atau perpipaan.',
  },
  {
    id: 'pack20',
    name: 'Enterprise / Firm Pack (20 Laporan)',
    reportsCount: 20,
    priceIdr: 499000,
    priceUsd: 35.0,
    savingsPercent: 49,
    description: 'Solusi hemat untuk konsultan rekayasa termal, kontraktor EPC & industri.',
  },
];

const VALID_VOUCHERS: Record<string, { credits: number; label: string }> = {
  ENGINEER2026: { credits: 2, label: 'Voucher Engineer Promo (2 Laporan Gratis)' },
  THERMOVIP: { credits: 5, label: 'VIP Industrial Pass (5 Laporan Gratis)' },
  AUDITFREE: { credits: 1, label: 'Audit Inspector Trial (1 Laporan Gratis)' },
  TRIAL2026: { credits: 1, label: 'New User Trial Pass (1 Laporan Gratis)' },
  SEMEN2026: { credits: 3, label: 'Cement & Kiln Specialist Partner (3 Laporan Gratis)' },
};

export const reportCreditsManager = {
  getCredits(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CREDITS);
      if (stored === null) {
        // Welcome gift: 1 free credit for first-time users
        localStorage.setItem(STORAGE_KEY_CREDITS, '1');
        return 1;
      }
      const val = parseInt(stored, 10);
      return isNaN(val) ? 0 : Math.max(0, val);
    } catch {
      return 1;
    }
  },

  setCredits(credits: number) {
    try {
      localStorage.setItem(STORAGE_KEY_CREDITS, Math.max(0, credits).toString());
    } catch (e) {
      console.error('Failed to save report credits', e);
    }
  },

  useCredit(): boolean {
    const current = this.getCredits();
    if (current <= 0) return false;
    this.setCredits(current - 1);
    return true;
  },

  addCredits(count: number, txDetails?: Partial<PurchaseTransaction>): number {
    const current = this.getCredits();
    const newTotal = current + count;
    this.setCredits(newTotal);

    if (txDetails) {
      const tx: PurchaseTransaction = {
        id: txDetails.id || `INV-TD-${Date.now().toString().slice(-6)}`,
        date: txDetails.date || new Date().toISOString(),
        planId: txDetails.planId || 'custom',
        planName: txDetails.planName || `${count} Laporan`,
        reportsAdded: count,
        amountIdr: txDetails.amountIdr || 0,
        paymentMethod: txDetails.paymentMethod || 'qris',
        status: 'PAID',
      };
      this.saveTransaction(tx);
    }

    return newTotal;
  },

  getTransactions(): PurchaseTransaction[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TX);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveTransaction(tx: PurchaseTransaction) {
    try {
      const history = this.getTransactions();
      history.unshift(tx);
      localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(history.slice(0, 50)));
    } catch (e) {
      console.error('Failed to save transaction', e);
    }
  },

  redeemVoucher(rawCode: string): { success: boolean; creditsAdded: number; message: string } {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return { success: false, creditsAdded: 0, message: 'Masukkan kode voucher terlebih dahulu.' };
    }

    // Check if voucher has been used
    const usedKey = `thermoduct_voucher_used_${code}`;
    if (localStorage.getItem(usedKey)) {
      return { success: false, creditsAdded: 0, message: 'Kode voucher ini sudah pernah digunakan di perangkat ini.' };
    }

    const matched = VALID_VOUCHERS[code];
    if (matched) {
      this.addCredits(matched.credits, {
        id: `VCH-${code}-${Date.now().toString().slice(-4)}`,
        planId: 'voucher',
        planName: matched.label,
        amountIdr: 0,
        paymentMethod: 'voucher',
      });
      localStorage.setItem(usedKey, 'true');
      return {
        success: true,
        creditsAdded: matched.credits,
        message: `Selamat! Voucher ${code} berhasil diaktifkan. Anda mendapatkan +${matched.credits} Kuota Laporan Resmi!`,
      };
    }

    return {
      success: false,
      creditsAdded: 0,
      message: 'Kode voucher tidak valid atau sudah kedaluwarsa. Coba gunakan: ENGINEER2026 atau AUDITFREE.',
    };
  },
};
