export type OrderStatus =
  "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface AdminOrder {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  items: {
    product: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province: string;
    postalCode: string;
  };
  paymentMethod: "COD";
  paymentStatus: "unpaid" | "paid";
  paidAt?: string;
  paymentCollectedBy?: string;
  orderStatus: OrderStatus;
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}
