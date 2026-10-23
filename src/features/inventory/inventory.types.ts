export interface InventoryMovement {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
    images?: {
      url: string;
      alt?: string;
      isPrimary?: boolean;
    }[];
  } | null;
  type?: "manual" | "sale" | "cancellation";
  actorType?: "admin" | "customer" | "system";
  actor?: { _id: string; name: string; email: string } | null;
  order?: string | null;
  note?: string;
  admin: {
    _id: string;
    name: string;
    email: string;
  } | null;
  adjustment: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
}

export interface InventoryHistoryResponse {
  movements: InventoryMovement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
