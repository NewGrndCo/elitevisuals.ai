export default function Loading() {
  return (
    <main className="route-state" aria-busy="true">
      <p role="status">Loading Elite Visuals…</p>
      <div className="route-skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
