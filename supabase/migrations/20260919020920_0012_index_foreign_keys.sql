-- SAKALA V3 — index untuk foreign key yang belum ter-index.
--
-- Ditemukan lewat Supabase Advisor (kategori performance,
-- unindexed_foreign_keys) saat audit RLS/security yang sebelumnya memang
-- belum pernah dikerjakan di V3 (dicatat eksplisit di beberapa analisis
-- sebelumnya sebagai item tertunda).
--
-- Paling berdampak di schedule_entry & teaching_assignment -- dua tabel
-- yang dibaca di hampir setiap halaman (Kanvas Jadwal, Beban Mengajar,
-- Beranda) lewat join ke teacher/subject/class. Tanpa index ini, tiap join
-- itu full table scan begitu jumlah baris bertambah seiring sekolah
-- memakai aplikasinya.
create index if not exists attendance_teacher_id_idx on attendance (teacher_id);
create index if not exists class_academic_year_id_idx on class (academic_year_id);
create index if not exists room_school_id_idx on room (school_id);
create index if not exists schedule_entry_class_id_idx2 on schedule_entry (class_id);
create index if not exists schedule_entry_room_id_idx2 on schedule_entry (room_id);
create index if not exists schedule_entry_subject_id_idx2 on schedule_entry (subject_id);
create index if not exists schedule_entry_teacher_id_idx2 on schedule_entry (teacher_id);
create index if not exists schedule_entry_teaching_assignment_id_idx2 on schedule_entry (teaching_assignment_id);
create index if not exists subject_school_id_idx on subject (school_id);
create index if not exists teacher_school_id_idx on teacher (school_id);
create index if not exists teaching_assignment_class_id_idx on teaching_assignment (class_id);
create index if not exists teaching_assignment_subject_id_idx on teaching_assignment (subject_id);
create index if not exists teaching_assignment_teacher_id_idx on teaching_assignment (teacher_id);
