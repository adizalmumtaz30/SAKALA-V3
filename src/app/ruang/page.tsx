import { IconRuang } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { listRooms } from "@/lib/data-access/room";
import { createRoomAction, toggleRoomStatusAction } from "@/lib/application/master-data.actions";
import { NameOnlyCreateForm } from "@/components/master-data/NameOnlyCreateForm";
import { EntityRow } from "@/components/master-data/EntityRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function RuangPage() {
  const supabase = await createClient();
  const rooms = await listRooms(supabase);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        kicker="DATA"
        title="Ruang"
        description="Ruang bersifat opsional — lengkapi hanya jika sekolah melacak penggunaan ruang per jadwal."
      />

      <div className="mt-6 rounded-2xl border border-hairline bg-surface p-5">
        <NameOnlyCreateForm
          action={createRoomAction}
          placeholder="Nama ruang"
          submitLabel="Tambah Ruang"
        />
      </div>

      <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.length === 0 && (
          <div className="col-span-full rounded-xl border border-hairline bg-surface"><EmptyState
            icon={<IconRuang size={16} strokeWidth={1.75} />}
            message="Belum ada data ruang."
          /></div>
        )}
        {rooms.map((room) => (
          <EntityRow
            key={room.id}
            icon={<IconRuang size={15} strokeWidth={1.75} />}
            name={room.name}
            status={room.status}
            id={room.id}
            toggleAction={toggleRoomStatusAction}
          />
        ))}
      </div>
    </div>
  );
}
