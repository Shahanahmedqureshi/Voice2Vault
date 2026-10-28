import { tools } from '../tools';
import { Voucher, VoucherItem } from '../types/entities';

export interface LedgerCommitInput {
  voucher: Partial<Voucher>;
  items: VoucherItem[];
}

export interface LedgerCommitResult {
  success: boolean;
  voucher: Voucher;
  isDuplicate: boolean;
  inventoryUpdated: boolean;
}

/**
 * Ledger Agent: Executes idempotent writes to the master ledger and deducts warehouse inventory.
 * Automatically de-duplicates requests using customer, date, total, and item hash.
 */
export async function executeLedgerAgent(
  input: LedgerCommitInput
): Promise<LedgerCommitResult> {
  // 1. Write voucher (idempotent)
  const writeRes = await tools.write_voucher(input.voucher);

  // 2. Deduct inventory if not a duplicate
  let inventoryUpdated = false;
  if (!writeRes.isDuplicate && input.items && input.items.length > 0) {
    const invRes = await tools.update_inventory(input.items);
    inventoryUpdated = invRes.success;
  }

  return {
    success: true,
    voucher: writeRes.voucher,
    isDuplicate: writeRes.isDuplicate,
    inventoryUpdated,
  };
}
