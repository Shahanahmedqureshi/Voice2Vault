import { tools } from '../tools';
import { Customer, Voucher, OutboxItem } from '../types/entities';

export interface CollectionsResult {
  upiUrl: string;
  qrDataUrl: string;
  whatsappParchiText: string;
  whatsappWebUrl: string;
  outboxItem: OutboxItem;
}

/**
 * Collections Agent: Generates pre-filled UPI QR codes and drafts Hinglish WhatsApp parchis.
 * Does NOT auto-send messages; places items into the Outbox as DRAFT requiring human approval.
 */
export async function executeCollectionsAgent(
  customer: Customer,
  voucher: Voucher
): Promise<CollectionsResult> {
  // 1. Generate pre-filled dynamic UPI payment QR
  const upiAmount = voucher.computedUdhaar > 0 ? voucher.computedUdhaar : voucher.totalAmount;
  const upiRes = await tools.generate_upi_qr(
    upiAmount,
    `Voucher ${voucher.voucherNumber} - ${customer.name}`
  );

  // 2. Draft Hinglish WhatsApp parchi & click-to-chat link
  const waRes = await tools.draft_whatsapp(customer, voucher);

  return {
    upiUrl: upiRes.upiUrl,
    qrDataUrl: upiRes.qrDataUrl,
    whatsappParchiText: waRes.parchiText,
    whatsappWebUrl: waRes.whatsappWebUrl,
    outboxItem: waRes.outboxItem,
  };
}
