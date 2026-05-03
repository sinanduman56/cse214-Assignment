export interface Store {
  id: number;
  name: string;
  location?: string;
  active: boolean;
  status?: string;
  owner?: { id: number; email: string };
  ownerId?: number;
  ownerEmail?: string;
}
