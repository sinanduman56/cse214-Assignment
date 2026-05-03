export interface Shipment {
  id: number;
  status?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  order?: { id: number };
}
