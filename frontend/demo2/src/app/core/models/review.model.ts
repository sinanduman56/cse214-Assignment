export interface Review {
  id: number;
  starRating: number;
  content: string;
  helpfulVotes?: number;
  totalVotes?: number;
  userId: number;
  userEmail: string;
  productId: number;
  productName?: string;
  createdAt?: string;
}

export interface ReviewStats {
  productId: number;
  reviewCount: number;
  averageRating: number;
  distribution: { [star: number]: number };
}
