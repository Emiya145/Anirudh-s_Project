export type Location = {
  id: number;
  name: string;
  timezone: string;
  is_active: boolean;
};

export type WasteRecord = {
  id: number;
  location: number;
  ingredient: number;
  ingredient_lot: number | null;
  quantity: string;
  reason: "expired" | "discarded";
  recorded_at: string;
  recorded_by: number;
};

export type PurchaseOrderLine = {
  id: number;
  ingredient: number;
  quantity_ordered: string;
  unit_price_snapshot: string | null;
};

export type PurchaseOrder = {
  id: number;
  supplier: number;
  location: number;
  status: "draft" | "sent" | "received" | "canceled";
  ordered_at: string;
  expected_delivery_date: string | null;
  created_by: number;
  lines: PurchaseOrderLine[];
};

export type PurchaseOrderReceiveResult = {
  purchase_order_id: number;
  status: string;
  created_lots: Array<{ lot_id: number; ingredient_id: number; quantity: string }>;
};

export type Ingredient = {
  id: number;
  name: string;
  base_unit: string;
  is_perishable: boolean;
  default_low_stock_threshold: string;
};

export type IngredientLot = {
  id: number;
  location: number;
  ingredient: number;
  received_date: string;
  expiry_date: string | null;
  quantity_received: string;
  quantity_remaining: string;
  supplier: number | null;
  supplier_lot_code: string;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
  is_active: boolean;
};

export type Supplier = {
  id: number;
  name: string;
  email: string;
  phone: string;
  lead_time_days: number;
};

export type StoreLocation = {
  id: number;
  name: string;
  timezone: string;
  is_active: boolean;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  delivery_fee: string;
  delivery_min_order: string;
};

export type StoreProduct = {
  id: number;
  name: string;
  sku: string;
  is_active: boolean;
  description: string;
  image_url: string;
  base_price: string;
  is_public: boolean;
  category: string;
};

export type StoreAvailabilityItem = {
  product_id: number;
  on_hand: string;
};

export type StoreCheckoutSessionResponse = {
  order_id: number;
  url: string;
};

export type FinishedGoodLot = {
  id: number;
  location: number;
  product: number;
  produced_at: string;
  expiry_date: string | null;
  quantity_produced: string;
  quantity_remaining: string;
};

export type ProductDailyTarget = {
  id: number;
  location: number;
  product: number;
  business_date: string;
  target_quantity: string;
};

export type ProductionBatchCreateResponse = {
  id: number;
  location: number;
  product: number;
  quantity_produced: string;
  produced_at: string;
  source_order: number | null;
  consumed: Array<{ ingredient_id: number; lot_id: number; quantity: string }>;
};

export type CustomerOrder = {
  id: number;
  location: number;
  status: "draft" | "confirmed" | "fulfilled" | "canceled";
  ordered_at: string;
  due_at: string | null;
  created_by: number;
  lines: Array<{ id: number; product: number; quantity: string }>;
};

export type Notification = {
  id: number;
  created_at: string;
  last_seen_at: string;
  kind: "low_stock" | "expiring_soon" | "expired" | "target_shortfall";
  dedupe_key: string | null;
  is_active: boolean;
  location: number;
  ingredient: number | null;
  product: number | null;
  message: string;
  payload: Record<string, unknown>;
};
