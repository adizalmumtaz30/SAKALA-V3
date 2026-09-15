export type RoomStatus = "active" | "inactive";

export interface Room {
  id: string;
  code: string | null;
  name: string;
  roomType: string | null;
  capacity: number | null;
  status: RoomStatus;
  notes: string | null;
}
