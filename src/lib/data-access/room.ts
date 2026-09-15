import type { SupabaseClient } from "@supabase/supabase-js";
import type { Room } from "@/lib/domain/room";

interface RoomRow {
  id: string;
  code: string | null;
  name: string;
  room_type: string | null;
  capacity: number | null;
  status: "active" | "inactive";
  notes: string | null;
}

function toDomain(row: RoomRow): Room {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    roomType: row.room_type,
    capacity: row.capacity,
    status: row.status,
    notes: row.notes,
  };
}

export async function listRooms(supabase: SupabaseClient): Promise<Room[]> {
  const { data, error } = await supabase
    .from("room")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as RoomRow[]).map(toDomain);
}
