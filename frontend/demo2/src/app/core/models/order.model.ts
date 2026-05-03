import { Product } from './product.model';

export interface OrderItem {
  id: number;
  product: Product;
  quantity: number;
  unitPrice: number;
}

export interface OrderShipment {
  id: number;
  warehouse?: string;
  shipmentMode?: string;
  customerRating?: number;
  productImportance?: string;
  discountOffered?: number;
}

export interface Order {
  id: number;
  status: string;
  grandTotal: number;
  orderDate: string;
  paymentMethod?: string;
  fulfilment?: string;
  orderItems?: OrderItem[];
  shipment?: OrderShipment;
  user?: { id: number; email: string };
}
