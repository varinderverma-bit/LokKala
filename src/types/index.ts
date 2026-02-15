export type Availability = 'IN_STOCK' | 'LIMITED' | 'SOLD_OUT';

export interface Region {
  id: string;
  name: string;
  shortHistory: string;
  culturalSignificance: string;
  heroImage: string;
  tags: string[];
}

export interface Artist {
  id: string;
  name: string;
  photoUrl: string;
  regionId: string;
  bio: string;
  story: string;
  verified: boolean;
  socialLinks: { platform: string; url: string }[];
  joinedDate: string;
}

export interface ArtItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  images: string[];
  regionId: string;
  artistId: string;
  style: string;
  medium: string;
  dimensions: string;
  yearCreated: number;
  story: string;
  significance: string[];
  technique: string;
  materials: string;
  tags: string[];
  availability: Availability;
  shippingFrom: string;
  etaDays: number;
  popularityScore: number;
  createdAt: string;
}

export interface CartItem {
  artId: string;
  quantity: number;
  art: ArtItem;
}

export interface ShippingOption {
  id: string;
  label: string;
  price: number;
  days: number;
}

export interface ArtListQuery {
  search?: string;
  regionIds?: string[];
  styles?: string[];
  mediums?: string[];
  minPrice?: number;
  maxPrice?: number;
  availability?: Availability[];
  shippingFrom?: string[];
  sort?: 'popular' | 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
