import type { Region, Artist, ArtItem } from '@/types';

const img = (seed: string, w = 600, h = 400) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const regions: Region[] = [
  { id: 'r1', name: 'Oaxaca, Mexico', shortHistory: 'Cradle of indigenous art.', culturalSignificance: 'Alebrijes, pottery, textiles.', heroImage: img('oaxaca', 1200, 600), tags: ['textiles', 'pottery'] },
  { id: 'r2', name: 'Bali, Indonesia', shortHistory: 'Temple and court art.', culturalSignificance: 'Wood carving, silver.', heroImage: img('bali', 1200, 600), tags: ['woodcarving', 'silver'] },
  { id: 'r3', name: 'Marrakech, Morocco', shortHistory: 'Berber and Andalusian crossroads.', culturalSignificance: 'Zellige, leather.', heroImage: img('marrakech', 1200, 600), tags: ['ceramics', 'leather'] },
  { id: 'r4', name: 'Kyoto, Japan', shortHistory: 'Imperial capital craftsmanship.', culturalSignificance: 'Lacquer, ceramics.', heroImage: img('kyoto', 1200, 600), tags: ['ceramics', 'lacquer'] },
];

export const artists: Artist[] = [
  { id: 'a1', name: 'Elena Martinez', photoUrl: img('elena', 200, 200), regionId: 'r1', bio: 'Fourth-generation artisan.', story: 'I learned from my grandmother.', verified: true, socialLinks: [{ platform: 'instagram', url: '#' }], joinedDate: '2022-03-15' },
  { id: 'a2', name: 'Wayan Sutra', photoUrl: img('wayan', 200, 200), regionId: 'r2', bio: 'Balinese woodcarver.', story: 'My father taught me.', verified: true, socialLinks: [{ platform: 'instagram', url: '#' }], joinedDate: '2021-11-20' },
  { id: 'a3', name: 'Fatima Alaoui', photoUrl: img('fatima', 200, 200), regionId: 'r3', bio: 'Marrakech ceramist.', story: 'I work in the medina.', verified: true, socialLinks: [{ platform: 'instagram', url: '#' }], joinedDate: '2023-01-10' },
  { id: 'a4', name: 'Kenji Tanaka', photoUrl: img('kenji', 200, 200), regionId: 'r4', bio: 'Kyoto potter.', story: 'Imperfection is beauty.', verified: true, socialLinks: [{ platform: 'instagram', url: '#' }], joinedDate: '2020-06-01' },
];

export const artItems: ArtItem[] = [
  { id: 'art1', title: 'Jaguar Spirit Alebrije', price: 450, currency: 'USD', images: [img('art1', 800, 800)], regionId: 'r1', artistId: 'a1', style: 'Traditional', medium: 'Wood', dimensions: '28 x 18 cm', yearCreated: 2023, story: 'The jaguar represents strength.', significance: ['Protection'], technique: 'Hand-carved', materials: 'Copal wood', tags: ['alebrije'], availability: 'IN_STOCK', shippingFrom: 'Oaxaca', etaDays: 14, popularityScore: 95, createdAt: '2023-09-01' },
  { id: 'art2', title: 'Rangda Mask', price: 680, currency: 'USD', images: [img('art2', 800, 800)], regionId: 'r2', artistId: 'a2', style: 'Traditional', medium: 'Wood', dimensions: '45 x 35 cm', yearCreated: 2023, story: 'Rangda is the queen of demons.', significance: ['Balance'], technique: 'Relief carving', materials: 'Suar wood', tags: ['mask'], availability: 'LIMITED', shippingFrom: 'Bali', etaDays: 21, popularityScore: 88, createdAt: '2023-07-15' },
  { id: 'art3', title: 'Zellige Mosaic Plate', price: 320, currency: 'USD', images: [img('art3', 800, 800)], regionId: 'r3', artistId: 'a3', style: 'Geometric', medium: 'Ceramic', dimensions: '40 cm', yearCreated: 2024, story: 'Eight-pointed star pattern.', significance: ['Islamic geometry'], technique: 'Hand-cut zellige', materials: 'Ceramic', tags: ['zellige'], availability: 'IN_STOCK', shippingFrom: 'Marrakech', etaDays: 18, popularityScore: 92, createdAt: '2024-01-05' },
  { id: 'art4', title: 'Raku Tea Bowl', price: 580, currency: 'USD', images: [img('art4', 800, 800)], regionId: 'r4', artistId: 'a4', style: 'Wabi-sabi', medium: 'Raku', dimensions: '12 cm', yearCreated: 2023, story: 'Fired in a single day.', significance: ['Tea ceremony'], technique: 'Raku firing', materials: 'Raku clay', tags: ['raku'], availability: 'IN_STOCK', shippingFrom: 'Kyoto', etaDays: 21, popularityScore: 90, createdAt: '2023-11-20' },
  { id: 'art5', title: 'Owl Messenger Alebrije', price: 380, currency: 'USD', images: [img('art5', 800, 800)], regionId: 'r1', artistId: 'a1', style: 'Traditional', medium: 'Wood', dimensions: '22 cm', yearCreated: 2023, story: 'The owl is a messenger.', significance: ['Wisdom'], technique: 'Hand-carved', materials: 'Copal wood', tags: ['alebrije'], availability: 'IN_STOCK', shippingFrom: 'Oaxaca', etaDays: 14, popularityScore: 82, createdAt: '2023-10-10' },
  { id: 'art6', title: 'Barong Spirit Sculpture', price: 520, currency: 'USD', images: [img('art6', 800, 800)], regionId: 'r2', artistId: 'a2', style: 'Traditional', medium: 'Wood', dimensions: '35 cm', yearCreated: 2023, story: 'Barong represents good.', significance: ['Protection'], technique: 'Full-round carving', materials: 'Suar wood', tags: ['barong'], availability: 'IN_STOCK', shippingFrom: 'Bali', etaDays: 21, popularityScore: 85, createdAt: '2023-08-01' },
];
