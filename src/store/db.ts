import {
  Customer,
  PriceListItem,
  InventoryItem,
  Voucher,
  LedgerEntry,
  OutboxItem,
  AppSettings,
} from '../types/entities';
import { AuditLogEntry, AgentMessage } from '../types/agent';
import { INITIAL_VOUCHERS } from '../data/initialLedger';

const DB_NAME = 'Voice2Vault_MultiAgent_DB_v2';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: AppSettings = {
  upiId: 'vyaparvault@upi',
  upiPayeeName: 'VyaparVault Wholesale',
  riskExposureThresholdPercent: 50.0,
  defaultCreditLimit: 50000,
  injectToolFailure: false,
  injectModelRateLimit: false,
  injectBadInput: false,
};

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust-sharma',
    name: 'Sharma Kirana & General Store',
    phone: '+91 98260 11029',
    beat: 'Vijay Nagar Scheme 54, Indore',
    gstin: '23AABCS1429B1Z5',
    credit_limit: 60000,
    current_balance: 27000,
  },
  {
    id: 'cust-gupta',
    name: 'Gupta Medical & Surgical Store',
    phone: '+91 94250 88219',
    beat: 'Rajwada Chouraha, Indore',
    gstin: '23AADCG4920E1ZT',
    credit_limit: 40000,
    current_balance: 5000,
  },
  {
    id: 'cust-patel',
    name: 'Patel Hardware & Industrial Tools',
    phone: '+91 98930 44102',
    beat: 'Bhanwarkuan Main Road, Indore',
    gstin: '23AAICP5541L1Z9',
    credit_limit: 50000,
    current_balance: 3000,
  },
  {
    id: 'cust-agarwal',
    name: 'Agarwal Provision Store',
    phone: '+91 98270 33918',
    beat: 'Siyaganj Market, Indore',
    gstin: '23AAAPL9921D1Z2',
    credit_limit: 80000,
    current_balance: 14500,
  },
  {
    id: 'cust-malwa',
    name: 'Malwa Agro Traders & Seed Corp',
    phone: '+91 94251 77301',
    beat: 'Sanwer Road Industrial Area, Indore',
    gstin: '23AABCM9102P1Z3',
    credit_limit: 100000,
    current_balance: 7000,
  },
];

export const SEED_PRICE_LIST: PriceListItem[] = [
  {
    sku: 'SKU-OIL-15L',
    name: 'Fortune Refined Soyabean Oil 15L Tin',
    unit: 'पेटी (Boxes)',
    rate: 1650,
    category: 'Edible Oils',
  },
  {
    sku: 'SKU-SUGAR-50K',
    name: 'Madhur Pure Sulphurless Sugar M-30 (50kg Bag)',
    unit: 'कट्टा (Bags)',
    rate: 900,
    category: 'Grains & Sugar',
  },
  {
    sku: 'SKU-PARA-650',
    name: 'Paracetamol IP 650mg Blister (10x10)',
    unit: 'बॉक्स (Boxes)',
    rate: 150,
    category: 'Pharmaceuticals',
  },
  {
    sku: 'SKU-ORS-WHO',
    name: 'Electral WHO Formula ORS 21.8g Sachet (50s)',
    unit: 'पेटी (Boxes)',
    rate: 233.33,
    category: 'Pharmaceuticals',
  },
  {
    sku: 'SKU-BOSCH-BITS',
    name: 'Bosch HSS-G Industrial Drill Bit Set (13 Pcs)',
    unit: 'बॉक्स (Boxes)',
    rate: 300,
    category: 'Hardware & Tools',
  },
  {
    sku: 'SKU-SEED-SOYA',
    name: 'Certified Hybrid Soyabean JS-9560 Seed (30kg)',
    unit: 'बोरी (Bags)',
    rate: 2050,
    category: 'Agro Seeds',
  },
  {
    sku: 'SKU-DAP-50KG',
    name: 'Coromandel Gromor DAP 18:46:00 (50kg Bag)',
    unit: 'कट्टा (Bags)',
    rate: 1250,
    category: 'Fertilizers',
  },
  {
    sku: 'SKU-RICE-BASMATI',
    name: 'Daawat Rozana Super Basmati Rice (25kg Bag)',
    unit: 'कट्टा (Bags)',
    rate: 1850,
    category: 'Grains & Sugar',
  },
];

export const SEED_INVENTORY: InventoryItem[] = [
  {
    sku: 'SKU-OIL-15L',
    name: 'Fortune Refined Soyabean Oil 15L Tin',
    unit: 'पेटी (Boxes)',
    stock: 140,
    reorder_point: 40,
    godown: 'Godown #1 (Palasia)',
  },
  {
    sku: 'SKU-SUGAR-50K',
    name: 'Madhur Pure Sulphurless Sugar M-30 (50kg Bag)',
    unit: 'कट्टा (Bags)',
    stock: 85,
    reorder_point: 25,
    godown: 'Godown #3 (Dewas Naka)',
  },
  {
    sku: 'SKU-PARA-650',
    name: 'Paracetamol IP 650mg Blister (10x10)',
    unit: 'बॉक्स (Boxes)',
    stock: 220,
    reorder_point: 50,
    godown: 'Pharma Godown #4 (Snehnagar)',
  },
  {
    sku: 'SKU-ORS-WHO',
    name: 'Electral WHO Formula ORS 21.8g Sachet (50s)',
    unit: 'पेटी (Boxes)',
    stock: 95,
    reorder_point: 30,
    godown: 'Pharma Godown #4 (Snehnagar)',
  },
  {
    sku: 'SKU-BOSCH-BITS',
    name: 'Bosch HSS-G Industrial Drill Bit Set (13 Pcs)',
    unit: 'बॉक्स (Boxes)',
    stock: 110,
    reorder_point: 30,
    godown: 'Hardware Yard #2 (Loha Mandi)',
  },
  {
    sku: 'SKU-SEED-SOYA',
    name: 'Certified Hybrid Soyabean JS-9560 Seed (30kg)',
    unit: 'बोरी (Bags)',
    stock: 60,
    reorder_point: 20,
    godown: 'Seed Depot Godown #5',
  },
  {
    sku: 'SKU-DAP-50KG',
    name: 'Coromandel Gromor DAP 18:46:00 (50kg Bag)',
    unit: 'कट्टा (Bags)',
    stock: 75,
    reorder_point: 25,
    godown: 'Fertilizer Buffer Shed #2',
  },
  {
    sku: 'SKU-RICE-BASMATI',
    name: 'Daawat Rozana Super Basmati Rice (25kg Bag)',
    unit: 'कट्टा (Bags)',
    stock: 90,
    reorder_point: 30,
    godown: 'Central Mandi Godown #2',
  },
];

// In-Memory Storage State as fallback and fast cache
class BusinessDB {
  private memoryStore: {
    customers: Customer[];
    price_list: PriceListItem[];
    inventory: InventoryItem[];
    vouchers: Voucher[];
    ledger_entries: LedgerEntry[];
    outbox: OutboxItem[];
    audit_log: AuditLogEntry[];
    message_bus: AgentMessage[];
    settings: AppSettings;
  };

  private idb: IDBDatabase | null = null;
  private isInitialized = false;

  constructor() {
    this.memoryStore = {
      customers: [...SEED_CUSTOMERS],
      price_list: [...SEED_PRICE_LIST],
      inventory: [...SEED_INVENTORY],
      vouchers: [...INITIAL_VOUCHERS],
      ledger_entries: [],
      outbox: [],
      audit_log: [],
      message_bus: [],
      settings: { ...DEFAULT_SETTINGS },
    };

    // Build initial ledger entries from initial vouchers
    this.initLedgerFromVouchers();
  }

  private initLedgerFromVouchers() {
    this.memoryStore.ledger_entries = this.memoryStore.vouchers.map((v, idx) => ({
      id: `led-${idx + 100}`,
      voucherId: v.id,
      voucherNumber: v.voucherNumber,
      date: v.date,
      partyId: v.partyId || 'cust-sharma',
      partyName: v.partyName,
      debit: v.totalAmount,
      credit: v.paidAmount,
      balance: v.computedUdhaar,
      narration: `Sale dispatch ref ${v.voucherNumber} (${v.paymentMode})`,
    }));
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        this.idb = await new Promise<IDBDatabase>((resolve, reject) => {
          const req = indexedDB.open(DB_NAME, DB_VERSION);

          req.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            const tables = [
              'customers',
              'price_list',
              'inventory',
              'vouchers',
              'ledger_entries',
              'outbox',
              'audit_log',
              'message_bus',
              'settings',
            ];
            tables.forEach((tbl) => {
              if (!db.objectStoreNames.contains(tbl)) {
                db.createObjectStore(tbl, { keyPath: 'id' });
              }
            });
          };

          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });

        // Hydrate from IndexedDB if populated, else seed
        await this.syncFromIDB();
      } catch (err) {
        console.warn('IndexedDB unavailable, operating in in-memory mode:', err);
      }
    }

    this.isInitialized = true;
  }

  private async syncFromIDB(): Promise<void> {
    if (!this.idb) return;

    try {
      const getStoreAll = <T>(storeName: string): Promise<T[]> => {
        return new Promise((resolve) => {
          if (!this.idb?.objectStoreNames.contains(storeName)) return resolve([]);
          const tx = this.idb.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.getAll();
          req.onsuccess = () => resolve((req.result as T[]) || []);
          req.onerror = () => resolve([]);
        });
      };

      const [storedCustomers, storedPrice, storedInv, storedVouchers, storedLedger, storedOutbox, storedAudit, storedBus] =
        await Promise.all([
          getStoreAll<Customer>('customers'),
          getStoreAll<PriceListItem>('price_list'),
          getStoreAll<InventoryItem>('inventory'),
          getStoreAll<Voucher>('vouchers'),
          getStoreAll<LedgerEntry>('ledger_entries'),
          getStoreAll<OutboxItem>('outbox'),
          getStoreAll<AuditLogEntry>('audit_log'),
          getStoreAll<AgentMessage>('message_bus'),
        ]);

      if (storedCustomers.length > 0) this.memoryStore.customers = storedCustomers;
      if (storedPrice.length > 0) this.memoryStore.price_list = storedPrice;
      if (storedInv.length > 0) this.memoryStore.inventory = storedInv;
      if (storedVouchers.length > 0) this.memoryStore.vouchers = storedVouchers;
      if (storedLedger.length > 0) this.memoryStore.ledger_entries = storedLedger;
      if (storedOutbox.length > 0) this.memoryStore.outbox = storedOutbox;
      if (storedAudit.length > 0) this.memoryStore.audit_log = storedAudit;
      if (storedBus.length > 0) this.memoryStore.message_bus = storedBus;

      // If empty in IDB, save initial seeds
      if (storedCustomers.length === 0) {
        await this.persistToIDB('customers', this.memoryStore.customers);
        await this.persistToIDB('price_list', this.memoryStore.price_list);
        await this.persistToIDB('inventory', this.memoryStore.inventory);
        await this.persistToIDB('vouchers', this.memoryStore.vouchers);
        await this.persistToIDB('ledger_entries', this.memoryStore.ledger_entries);
      }
    } catch (e) {
      console.warn('IDB sync error:', e);
    }
  }

  private async persistToIDB(storeName: string, items: any[]): Promise<void> {
    if (!this.idb || !this.idb.objectStoreNames.contains(storeName)) return;
    try {
      const tx = this.idb.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      items.forEach((item) => store.put(item));
    } catch (e) {
      console.warn(`Persist to ${storeName} error:`, e);
    }
  }

  // --- Customers Table ---
  public getCustomers(): Customer[] {
    return [...this.memoryStore.customers];
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.memoryStore.customers.find((c) => c.id === id);
  }

  public saveCustomer(customer: Customer): Customer {
    const idx = this.memoryStore.customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      this.memoryStore.customers[idx] = customer;
    } else {
      this.memoryStore.customers.push(customer);
    }
    this.persistToIDB('customers', this.memoryStore.customers);
    return customer;
  }

  public updateCustomerBalance(id: string, deltaBalance: number): Customer | undefined {
    const cust = this.memoryStore.customers.find((c) => c.id === id);
    if (cust) {
      cust.current_balance = Math.max(0, cust.current_balance + deltaBalance);
      this.persistToIDB('customers', this.memoryStore.customers);
      return { ...cust };
    }
    return undefined;
  }

  // --- Price List ---
  public getPriceList(): PriceListItem[] {
    return [...this.memoryStore.price_list];
  }

  public lookupPrice(skuOrName: string): PriceListItem | undefined {
    const query = (skuOrName || '').toLowerCase().trim();
    return this.memoryStore.price_list.find(
      (p) =>
        p.sku.toLowerCase() === query ||
        p.name.toLowerCase().includes(query) ||
        query.includes(p.sku.toLowerCase())
    );
  }

  // --- Inventory ---
  public getInventory(): InventoryItem[] {
    return [...this.memoryStore.inventory];
  }

  public updateInventoryStock(sku: string, deltaQty: number): InventoryItem | undefined {
    const item = this.memoryStore.inventory.find((i) => i.sku === sku);
    if (item) {
      item.stock = Math.max(0, item.stock + deltaQty);
      this.persistToIDB('inventory', this.memoryStore.inventory);
      return { ...item };
    }
    return undefined;
  }

  // --- Vouchers & Idempotency ---
  public getVouchers(): Voucher[] {
    return [...this.memoryStore.vouchers];
  }

  public getVoucherById(id: string): Voucher | undefined {
    return this.memoryStore.vouchers.find((v) => v.id === id);
  }

  public getVoucherByIdempotencyKey(key: string): Voucher | undefined {
    if (!key) return undefined;
    return this.memoryStore.vouchers.find((v) => v.idempotencyKey === key);
  }

  public saveVoucher(voucher: Voucher): { voucher: Voucher; isDuplicate: boolean } {
    // Check idempotency key first
    if (voucher.idempotencyKey) {
      const existing = this.getVoucherByIdempotencyKey(voucher.idempotencyKey);
      if (existing) {
        return { voucher: existing, isDuplicate: true };
      }
    }

    // Check duplicate by voucherNumber or id
    const existingIdx = this.memoryStore.vouchers.findIndex(
      (v) => v.id === voucher.id || v.voucherNumber === voucher.voucherNumber
    );

    if (existingIdx >= 0) {
      this.memoryStore.vouchers[existingIdx] = voucher;
    } else {
      this.memoryStore.vouchers = [voucher, ...this.memoryStore.vouchers];
    }

    this.persistToIDB('vouchers', this.memoryStore.vouchers);
    return { voucher, isDuplicate: false };
  }

  // --- Ledger Entries ---
  public getLedgerEntries(): LedgerEntry[] {
    return [...this.memoryStore.ledger_entries];
  }

  public addLedgerEntry(entry: LedgerEntry): void {
    const exists = this.memoryStore.ledger_entries.some((l) => l.id === entry.id);
    if (!exists) {
      this.memoryStore.ledger_entries = [entry, ...this.memoryStore.ledger_entries];
      this.persistToIDB('ledger_entries', this.memoryStore.ledger_entries);
    }
  }

  // --- Outbox ---
  public getOutbox(): OutboxItem[] {
    return [...this.memoryStore.outbox];
  }

  public saveOutboxItem(item: OutboxItem): void {
    const idx = this.memoryStore.outbox.findIndex((o) => o.id === item.id);
    if (idx >= 0) {
      this.memoryStore.outbox[idx] = item;
    } else {
      this.memoryStore.outbox = [item, ...this.memoryStore.outbox];
    }
    this.persistToIDB('outbox', this.memoryStore.outbox);
  }

  // --- Audit Log ---
  public getAuditLog(): AuditLogEntry[] {
    return [...this.memoryStore.audit_log];
  }

  public logAction(entry: AuditLogEntry): void {
    this.memoryStore.audit_log = [entry, ...this.memoryStore.audit_log];
    this.persistToIDB('audit_log', this.memoryStore.audit_log);
  }

  // --- Message Bus ---
  public getMessages(): AgentMessage[] {
    return [...this.memoryStore.message_bus];
  }

  public broadcastMessage(msg: AgentMessage): void {
    this.memoryStore.message_bus = [msg, ...this.memoryStore.message_bus];
    this.persistToIDB('message_bus', this.memoryStore.message_bus);
  }

  // --- Settings ---
  public getSettings(): AppSettings {
    return { ...this.memoryStore.settings };
  }

  public updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.memoryStore.settings = { ...this.memoryStore.settings, ...partial };
    return { ...this.memoryStore.settings };
  }

  // --- Reset to Clean Seeds ---
  public resetToSeeds(): void {
    this.memoryStore = {
      customers: [...SEED_CUSTOMERS],
      price_list: [...SEED_PRICE_LIST],
      inventory: [...SEED_INVENTORY],
      vouchers: [...INITIAL_VOUCHERS],
      ledger_entries: [],
      outbox: [],
      audit_log: [],
      message_bus: [],
      settings: { ...DEFAULT_SETTINGS },
    };
    this.initLedgerFromVouchers();
    if (this.idb) {
      const stores = [
        'customers',
        'price_list',
        'inventory',
        'vouchers',
        'ledger_entries',
        'outbox',
        'audit_log',
        'message_bus',
        'settings',
      ];
      stores.forEach((s) => this.persistToIDB(s, (this.memoryStore as any)[s] || []));
    }
  }
}

export const db = new BusinessDB();
// Trigger background init
if (typeof window !== 'undefined') {
  db.init().catch(console.error);
}
