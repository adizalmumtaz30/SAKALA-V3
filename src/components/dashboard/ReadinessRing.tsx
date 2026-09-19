import { Check } from "lucide-react";

/**
 * "Kesiapan Sistem" — ring melingkar dengan centang, dipakai sebagai
 * pengganti ilustrasi hero fotorealistik. SVG lingkaran tunggal (bukan
 * gambar), 100% kode — tidak ada aset gambar yang dipalsukan/didekati.
 */
export function ReadinessRing({ ready }: { ready: boolean }) {
  return (
    <div
      aria-hidden
      className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 ${
        ready
          ? "border-champagne bg-champagne/10"
          : "border-status-incomplete bg-status-incomplete/10"
      }`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full ${
          ready ? "bg-champagne text-canvas" : "bg-status-incomplete text-canvas"
        }`}
      >
        <Check size={24} strokeWidth={2.5} />
      </div>
    </div>
  );
}
