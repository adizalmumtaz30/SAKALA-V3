export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-6 py-24 text-center">
      <h1 className="text-[18px] font-semibold text-ink">{title}</h1>
      <p className="text-[13.5px] text-ink-muted">
        Modul ini belum dibangun — menyusul pada fase berikutnya.
      </p>
    </div>
  );
}
