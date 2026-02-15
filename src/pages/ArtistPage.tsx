import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetArtistByIdQuery, useGetArtistArtQuery } from '@/api/artApi';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectIsFollowingArtist } from '@/features/user/selectors';
import { toggleFollowArtist } from '@/features/user/userSlice';
import { openInquiryModal, closeInquiryModal, addToast } from '@/features/ui/uiSlice';
import { Button, Badge, Modal } from '@/components/ui';
import { ArtCard } from '@/features/catalog/components/ArtCard';

export function ArtistPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const dispatch = useAppDispatch();
  const isFollowing = useAppSelector((s) => selectIsFollowingArtist(artistId ?? '')(s));
  const [inquiryMessage, setInquiryMessage] = useState('');

  const { data: artist, isLoading } = useGetArtistByIdQuery(artistId!, { skip: !artistId });
  const { data: portfolio } = useGetArtistArtQuery(artistId ?? '', { skip: !artistId });
  const inquiryOpen = useAppSelector((s) => s.ui.modals.inquiryArtistId === artistId);

  if (isLoading || !artist) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-32 w-32 animate-pulse rounded-full bg-primary-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <img src={artist.photoUrl} alt={artist.name} className="h-32 w-32 rounded-full object-cover" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white">{artist.name}</h1>
            {artist.verified && <Badge variant="info">Verified</Badge>}
          </div>
          <p className="mt-4 text-primary-700 dark:text-primary-300">{artist.bio}</p>
          <p className="mt-4 text-primary-700 dark:text-primary-300">{artist.story}</p>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => dispatch(toggleFollowArtist(artistId!))} variant={isFollowing ? 'secondary' : 'primary'}>{isFollowing ? 'Unfollow' : 'Follow'}</Button>
            <Button variant="outline" onClick={() => dispatch(openInquiryModal(artistId!))}>Send Inquiry</Button>
          </div>
        </div>
      </div>
      <div className="mt-12">
        <h2 className="font-display text-xl font-bold text-primary-900 dark:text-white">Portfolio</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{portfolio?.map((a) => <ArtCard key={a.id} art={a} />)}</div>
      </div>
      <Modal isOpen={!!inquiryOpen} onClose={() => dispatch(closeInquiryModal())} title="Send Inquiry">
        <form onSubmit={(e) => { e.preventDefault(); dispatch(addToast({ message: 'Inquiry sent (mock)', type: 'success' })); dispatch(closeInquiryModal()); setInquiryMessage(''); }} className="space-y-4">
          <textarea value={inquiryMessage} onChange={(e) => setInquiryMessage(e.target.value)} placeholder="Your message..." rows={4} className="w-full rounded-lg border px-4 py-2 dark:border-gray-600 dark:bg-gray-900" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => dispatch(closeInquiryModal())}>Cancel</Button>
            <Button type="submit">Send</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
