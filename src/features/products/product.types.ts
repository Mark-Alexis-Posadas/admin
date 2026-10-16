export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface AdminProduct {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  brand: string;
  stock: number;
  lowStockThreshold: number;
  images: ProductImage[];
  tags: string[];
  weight: number | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductPayload = Pick<
  AdminProduct,
  | "name"
  | "slug"
  | "sku"
  | "description"
  | "shortDescription"
  | "price"
  | "compareAtPrice"
  | "category"
  | "brand"
  | "stock"
  | "lowStockThreshold"
  | "images"
  | "tags"
  | "weight"
  | "isFeatured"
>;
