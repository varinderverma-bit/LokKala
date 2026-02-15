import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetArtByIdQuery, useGetArtistByIdQuery, useGetRegionByIdQuery, useGetRecommendationsQuery } from '@/api/artApi';
import { useAppDispatch } from '@/app/hooks';
import { addToCart } from '@/features/cart/cartSlice';
import { addRecentlyViewed } from '@/features/user/userSlice';
import { addToast } from '@/features/ui/uiSlice';
import { Button, Badge, Tabs } from '@/components/ui';
import { ArtCard } from '@/features/catalog/components/ArtCard';
import { formatCurrency } from '@/utils/currency';

const availabilityVariant: Record<string, 'success' | 'warning' | 'error'> = { IN_STOCK: 'success', LIMITED: 'warning', SOLD_OUT: 'error' };

export function ArtDetailPage() {
  const { artId } = useParams<{ artId: string }>();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('story');
  const [imageIndex, setImageIndex] = useState(0);

  const { data: art, isLoading } = useGetArtByIdQuery(artId!, { skip: !artId });
  const { data: artist } = useGetArtistByIdQuery(art?.artistId ?? '', { skip: !art?.artistId });
  const { data: region } = useGetRegionByIdQuery(art?.regionId ?? '', { skip: !art?.regionId });
  const { data: recommendations } = useGetRecommendationsQuery(artId ?? '', { skip: !artId });

  useEffect(() => { if (artId) dispatch(addRecentlyViewed(artId)); }, [artId, dispatch]);

  const handleAddToCart = () => {
    if (art) {
      dispatch(addToCart({ art }));
      dispatch(addToast({ message: 'Added to cart', type: 'success' }));
    }
  };

  if (isLoading || !art) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-96 animate-pulse rounded-xl bg-primary-200 dark:bg-gray-700" />
      </div>
    );
  }

  const tabs = [
    { id: 'story', label: 'The Story', content: <div className="prose dark:prose-invert max-w-none"><p className="whitespace-pre-wrap text-primary-700 dark:text-primary-300">{art.story}</p>{art.significance.length > 0 && <ul className="mt-6 list-disc pl-6 space-y-1">{art.significance.map((s, i) => <li key={i}>{s}</li>)}</ul>}</div> },
    { id: 'region', label: 'Region & History', content: region ? <div className="space-y-4"><img src={region.heroImage} alt={region.name} className="aspect-video w-full rounded-lg object-cover" /><h4 className="font-semibold">{region.name}</h4><p className="text-primary-700 dark:text-primary-300">{region.shortHistory}</p></div> : <p>Loading...</p> },
    { id: 'technique', label: 'Technique & Materials', content: <div className="space-y-4"><p><strong>Technique:</strong> {art.technique}</p><p><strong>Materials:</strong> {art.materials}</p><p><strong>Dimensions:</strong> {art.dimensions}</p></div> },
    { id: 'artist', label: 'Artist', content: artist ? <div className="flex gap-6"><img src={artist.photoUrl} alt={artist.name} className="h-24 w-24 rounded-full object-cover" /><div><h4 className="font-semibold">{artist.name}{artist.verified && <Badge variant="info" className="ml-2">Verified</Badge>}</h4><p className="mt-2 text-primary-700 dark:text-primary-300">{artist.bio}</p><Link to={`/artist/${artist.id}`}><Button variant="outline" size="sm" className="mt-4">View profile</Button></Link></div></div> : <p>Loading...</p> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl bg-primary-100 dark:bg-gray-800">
            <img src={art.images[imageIndex]} alt={art.title} className="h-full w-full object-cover" />
          </div>
          {art.images.length > 1 && (
            <div className="mt-4 flex gap-2">
              {art.images.map((img, i) => (
                <button key={i} type="button" onClick={() => setImageIndex(i)} className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${imageIndex === i ? 'border-accent-600' : 'border-transparent'}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-900 dark:text-white">{art.title}</h1>
          <Badge variant={availabilityVariant[art.availability]} className="mt-2">{art.availability.replace('_', ' ')}</Badge>
          <p className="mt-4 text-2xl font-semibold text-accent-600 dark:text-accent-400">{formatCurrency(art.price, art.currency)}</p>
          <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">Ships from {art.shippingFrom} · Est. {art.etaDays} days</p>
          <div className="mt-6 flex gap-4">
            <Button onClick={handleAddToCart} disabled={art.availability === 'SOLD_OUT'} size="lg">Add to Cart</Button>
            <Link to="/checkout" onClick={handleAddToCart}><Button variant="secondary" size="lg" disabled={art.availability === 'SOLD_OUT'}>Buy Now</Button></Link>
          </div>
          <div className="mt-8 rounded-lg border border-primary-200 p-4 dark:border-gray-700">
            <h3 className="font-semibold">Authenticity & Provenance</h3>
            <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">Certificate of authenticity. Direct from artist.</p>
          </div>
        </div>
      </div>
      <div className="mt-12"><Tabs tabs={tabs} activeTabId={activeTab} onTabChange={setActiveTab} /></div>
      {recommendations && recommendations.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-xl font-bold text-primary-900 dark:text-white">You may also like</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{recommendations.map((r) => <ArtCard key={r.id} art={r} />)}</div>
        </div>
      )}
    </div>
  );
}
