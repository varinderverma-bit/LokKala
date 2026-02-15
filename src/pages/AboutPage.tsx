export function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-primary-900 dark:text-white sm:text-4xl">About Local Art Marketplace</h1>
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-primary-900 dark:text-white">Our Mission</h2>
        <p className="mt-4 text-primary-700 dark:text-primary-300">We empower creators and preserve culture by connecting artists directly with buyers. Every piece carries a story.</p>
      </section>
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-primary-900 dark:text-white">Ethical Commerce</h2>
        <ul className="mt-4 space-y-3 text-primary-700 dark:text-primary-300">
          <li>• Fair pricing — Artists set their own prices.</li>
          <li>• Transparent provenance — Every piece comes with its story.</li>
        </ul>
      </section>
    </div>
  );
}
