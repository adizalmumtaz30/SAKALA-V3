import { createClient } from "@/lib/supabase/server";
import { listRooms } from "@/lib/data-access/room";
import { createRoomAction, toggleRoomStatusAction } from "@/lib/application/master-data.actions";
import { NameOnlyCreateForm } from "@/components/master-data/NameOnlyCreateForm";
import { ToggleStatusButton } from "@/components/master-data/ToggleStatusButton";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function RuangPage() {
  const supabase = await createClient();
  const rooms = await listRooms(supabase);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-[20px] font-semibold text-ink">Ruang</h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        Ruang bersifat opsional — lengkapi hanya jika sekolah melacak
        penggunaan ruang per jadwal.
      </p>

      <div className="mt-6">
        <NameOnlyCreateForm
          action={createRoomAction}
          placeholder="Nama ruang"
          submitLabel="Tambah Ruang"
        />
      </div>

      <div className="mt-8 divide-y divide-hairline rounded-2xl border border-hairline bg-surface">
        {rooms.length === 0 && (
          <p className="px-4 py-6 text-center text-[13px] text-ink-faint">
            Belum ada data ruang.
          </p>
        )}
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-[13.5px] text-ink">{room.name}</p>
              <StatusBadge status={room.status} />
            </div>
            <ToggleStatusButton
              id={room.id}
              status={room.status}
              action={toggleRoomStatusAction}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
