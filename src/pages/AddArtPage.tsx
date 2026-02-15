import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectIsArtist } from '@/features/auth/selectors';
import { addSubmission } from '@/features/submittedArt/submittedArtSlice';
import { addToast } from '@/features/ui/uiSlice';
import { useGetRegionsQuery } from '@/api/artApi';
import { Button, Input } from '@/components/ui';

export function AddArtPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isArtist = useAppSelector(selectIsArtist);
  const { data: regions } = useGetRegionsQuery();

  if (!isArtist) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white">Artist login required</h1>
        <p className="mt-4 text-primary-600 dark:text-primary-400">
          Only artists can list art. Sign in with your artist account to continue.
        </p>
        <Link to="/login/artist" className="mt-6 inline-block">
          <Button size="lg">Artist login</Button>
        </Link>
        <p className="mt-6 text-sm text-primary-500 dark:text-primary-500">
          Are you a buyer? <Link to="/explore" className="text-accent-600 hover:underline dark:text-accent-400">Browse art</Link>
        </p>
      </div>
    );
  }

  const [form, setForm] = useState({
    title: '',
    creatorName: '',
    medium: '',
    dimensions: '',
    yearCreated: new Date().getFullYear(),
    technique: '',
    materials: '',
    imageUrl: '',
    regionId: '',
    personalStory: '',
    regionStory: '',
    significanceText: '',
    tagsText: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Required';
    if (!form.creatorName.trim()) e.creatorName = 'Required';
    if (!form.medium.trim()) e.medium = 'Required';
    if (!form.regionId) e.regionId = 'Please select a region';
    if (!form.personalStory.trim()) e.personalStory = 'Share your personal story';
    if (!form.regionStory.trim()) e.regionStory = 'Share the story of the region';
    if (!form.significanceText.trim()) e.significanceText = 'Describe what the painting signifies';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const significance = form.significanceText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const tags = form.tagsText
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    dispatch(
      addSubmission({
        title: form.title.trim(),
        creatorName: form.creatorName.trim(),
        medium: form.medium.trim(),
        dimensions: form.dimensions.trim() || 'Not specified',
        yearCreated: form.yearCreated,
        technique: form.technique.trim() || 'Not specified',
        materials: form.materials.trim() || 'Not specified',
        imageUrl: form.imageUrl.trim() || 'https://picsum.photos/seed/art/800/800',
        regionId: form.regionId,
        personalStory: form.personalStory.trim(),
        regionStory: form.regionStory.trim(),
        significance,
        tags,
      })
    );
    dispatch(addToast({ message: 'Your artifact has been submitted!', type: 'success' }));
    navigate('/submitted-art');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white sm:text-3xl">
        List Your Art
      </h1>
      <p className="mt-2 text-primary-600 dark:text-primary-400">
        Share your artifact, your story, and what it means to you and your region.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-10">
        {/* Artifact details */}
        <section className="rounded-xl border border-primary-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="font-display text-lg font-semibold text-primary-900 dark:text-white">
            Artifact details
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Title of the work"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              error={errors.title}
              placeholder="e.g. Radha-Krishna in the Grove"
              required
            />
            <Input
              label="Your name (creator)"
              value={form.creatorName}
              onChange={(e) => setForm({ ...form, creatorName: e.target.value })}
              error={errors.creatorName}
              placeholder="e.g. Priya Thakur"
              required
            />
            <Input
              label="Medium"
              value={form.medium}
              onChange={(e) => setForm({ ...form, medium: e.target.value })}
              error={errors.medium}
              placeholder="e.g. Natural pigments on silk"
              required
            />
            <Input
              label="Dimensions"
              value={form.dimensions}
              onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
              placeholder="e.g. 25 x 20 cm"
            />
            <Input
              label="Year created"
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              value={form.yearCreated || ''}
              onChange={(e) => setForm({ ...form, yearCreated: Number(e.target.value) || new Date().getFullYear() })}
            />
            <Input
              label="Technique"
              value={form.technique}
              onChange={(e) => setForm({ ...form, technique: e.target.value })}
              placeholder="e.g. Kangra miniature painting"
            />
            <Input
              label="Materials"
              value={form.materials}
              onChange={(e) => setForm({ ...form, materials: e.target.value })}
              placeholder="e.g. Silk, stone pigments, gold leaf"
            />
            <div className="sm:col-span-2">
              <Input
                label="Image URL (optional)"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://example.com/your-art.jpg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-primary-800 dark:text-primary-200">
                Region
              </label>
              <select
                value={form.regionId}
                onChange={(e) => setForm({ ...form, regionId: e.target.value })}
                className="w-full rounded-lg border border-primary-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-900"
                required
                aria-invalid={!!errors.regionId}
              >
                <option value="">Select a region</option>
                {regions?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {errors.regionId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.regionId}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Personal story */}
        <section className="rounded-xl border border-primary-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="font-display text-lg font-semibold text-primary-900 dark:text-white">
            Your personal story
          </h2>
          <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
            Why did you create this? What does it mean to you?
          </p>
          <div className="mt-4">
            <textarea
              value={form.personalStory}
              onChange={(e) => setForm({ ...form, personalStory: e.target.value })}
              rows={5}
              className="w-full rounded-lg border border-primary-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-900 focus:ring-2 focus:ring-accent-500 focus:outline-none"
              placeholder="I grew up watching my grandmother paint..."
              required
              aria-invalid={!!errors.personalStory}
            />
            {errors.personalStory && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.personalStory}
              </p>
            )}
          </div>
        </section>

        {/* Story of the region */}
        <section className="rounded-xl border border-primary-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="font-display text-lg font-semibold text-primary-900 dark:text-white">
            Story of the region
          </h2>
          <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
            How does this piece connect to the history and culture of your region?
          </p>
          <div className="mt-4">
            <textarea
              value={form.regionStory}
              onChange={(e) => setForm({ ...form, regionStory: e.target.value })}
              rows={5}
              className="w-full rounded-lg border border-primary-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-900 focus:ring-2 focus:ring-accent-500 focus:outline-none"
              placeholder="This tradition has been passed down in our valley for generations..."
              required
              aria-invalid={!!errors.regionStory}
            />
            {errors.regionStory && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.regionStory}
              </p>
            )}
          </div>
        </section>

        {/* What the painting signifies */}
        <section className="rounded-xl border border-primary-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="font-display text-lg font-semibold text-primary-900 dark:text-white">
            What the painting signifies
          </h2>
          <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
            One meaning per line (e.g. devotion, protection, cultural heritage).
          </p>
          <div className="mt-4">
            <textarea
              value={form.significanceText}
              onChange={(e) => setForm({ ...form, significanceText: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-primary-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-900 focus:ring-2 focus:ring-accent-500 focus:outline-none"
              placeholder="Bhakti devotion&#10;Romantic lyricism&#10;Himalayan landscape"
              required
              aria-invalid={!!errors.significanceText}
            />
            {errors.significanceText && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.significanceText}
              </p>
            )}
          </div>
        </section>

        {/* Tags */}
        <section className="rounded-xl border border-primary-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="font-display text-lg font-semibold text-primary-900 dark:text-white">
            Tags (optional)
          </h2>
          <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
            Comma- or space-separated, e.g. kangra, pahari, miniature
          </p>
          <div className="mt-4">
            <Input
              value={form.tagsText}
              onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
              placeholder="kangra, pahari, miniature"
            />
          </div>
        </section>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
          <Link to="/explore">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button type="submit" size="lg">
            Submit your art
          </Button>
        </div>
      </form>
    </div>
  );
}
