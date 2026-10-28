import { Voucher } from '../types/entities';
import { SEED_CUSTOMERS } from '../store/db';

/**
 * Formats voucher data into a clean, human-readable Hindi/Hinglish message
 * tailored for Indian small business customers and retailers.
 */
export function formatVoucherForWhatsApp(voucher: Voucher): string {
  const formattedDate = voucher.date || new Date().toISOString().split('T')[0];
  const totalAmount = Number(voucher.totalAmount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const paidAmount = Number(voucher.paidAmount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const computedUdhaar = Number(voucher.computedUdhaar ?? (voucher.totalAmount - voucher.paidAmount)).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Items breakdown
  let itemsBreakdown = '';
  if (voucher.items && voucher.items.length > 0) {
    itemsBreakdown = voucher.items
      .map((item, idx) => {
        const qty = item.qty || 1;
        const unit = item.unit || 'nos';
        const rate = Number(item.estRate || 0).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        const total = Number(item.lineTotal || 0).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        return `${idx + 1}. *${item.particulars}* (${qty} ${unit} @ ₹${rate}) = ₹${total}`;
      })
      .join('\n');
  } else {
    itemsBreakdown = '• Samaan deliver kiya gaya';
  }

  // Audit discrepancy notice (Hinglish)
  let auditNotice = '';
  if (voucher.hasMathAnomaly && voucher.statedUdhaar !== undefined && voucher.statedUdhaar !== voucher.computedUdhaar) {
    const stated = Number(voucher.statedUdhaar).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const discrepancy = Math.abs(Number(voucher.mathDiscrepancy || 0)).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    auditNotice = `\n⚠️ *Hisaab Sudhaar (Audit Check):*\nField note me ₹${stated} likha tha, par sahi hisaab ₹${computedUdhaar} hai (₹${discrepancy} ka fark theek kiya gaya).\n`;
  }

  const beatLine = voucher.partyBeat ? `📍 *Area/Beat:* ${voucher.partyBeat}\n` : '';

  return `*VOICE2VAULT // VYAPAR PARCHI* 🧾
----------------------------------------
Namaste *${voucher.partyName}* ji 🙏,
Aapka taza bill aur khata vivran neeche diya gaya hai:

📄 *Voucher No:* ${voucher.voucherNumber}
📅 *Taareekh:* ${formattedDate}
${beatLine}----------------------------------------
*Samaan ka Vivran (Items):*
${itemsBreakdown}
----------------------------------------
💰 *Kul Bill (Total Bill):* ₹${totalAmount}
💵 *Jama Rashi (Paid - ${voucher.paymentMode || 'CASH'}):* ₹${paidAmount}
⚖️ *Baaqi Udhaar (Balance Due):* ₹${computedUdhaar}
${auditNotice}📅 *Bhugtan Taareekh (Due Date):* ${voucher.dueDate || 'Samay par'}
----------------------------------------
_Dhanyawad! Kripya samay par baaqi rashi ka bhugtan karein._
_Voice2Vault - Automated Field Accounts_`;
}

/**
 * Attempts to resolve customer phone digits from customer registry
 */
export function getCustomerPhoneDigits(voucher: Voucher): string | null {
  if (!voucher.partyName && !voucher.partyId) return null;

  const found = SEED_CUSTOMERS.find(
    (c) =>
      (voucher.partyId && c.id === voucher.partyId) ||
      (voucher.partyName && c.name.toLowerCase().includes(voucher.partyName.toLowerCase())) ||
      (voucher.partyName && voucher.partyName.toLowerCase().includes(c.name.toLowerCase()))
  );

  if (found && found.phone) {
    const cleaned = found.phone.replace(/[^0-9]/g, '');
    if (cleaned.length >= 10) {
      // If 10 digits, prefix 91 for India
      return cleaned.length === 10 ? `91${cleaned}` : cleaned;
    }
  }

  return null;
}
