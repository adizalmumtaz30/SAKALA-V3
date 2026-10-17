-- SIGNAL migration 0001: core schema (Cloudflare D1 / SQLite)
-- Sesuai dokumen 05 Backend Schema. FK aktif; ID stabil sebagai TEXT primary key.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS academic_periods (
  period_id TEXT PRIMARY KEY,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL CHECK (semester IN ('GANJIL','GENAP')),
  start_date TEXT,
  end_date TEXT,
  status TEXT NOT NULL DEFAULT 'PLANNING' CHECK (status IN ('PLANNING','ACTIVE','ARCHIVED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (academic_year, semester)
);

CREATE TABLE IF NOT EXISTS classes (
  class_id TEXT PRIMARY KEY,
  period_id TEXT NOT NULL REFERENCES academic_periods(period_id),
  class_name TEXT NOT NULL,
  level TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (period_id, class_name)
);

CREATE TABLE IF NOT EXISTS teachers (
  teacher_id TEXT PRIMARY KEY,
  teacher_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subjects (
  subject_id TEXT PRIMARY KEY,
  subject_code TEXT NOT NULL UNIQUE,
  subject_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teacher_qualifications (
  qualification_id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(teacher_id),
  subject_id TEXT NOT NULL REFERENCES subjects(subject_id),
  status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('APPROVED','PENDING','REVOKED')),
  valid_from TEXT,
  valid_to TEXT,
  UNIQUE (teacher_id, subject_id)
);

CREATE TABLE IF NOT EXISTS time_structures (
  time_structure_id TEXT PRIMARY KEY,
  period_id TEXT NOT NULL REFERENCES academic_periods(period_id),
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('MON','TUE','WED','THU','FRI','SAT')),
  max_teaching_periods INTEGER NOT NULL CHECK (max_teaching_periods BETWEEN 1 AND 10),
  is_active INTEGER NOT NULL DEFAULT 1,
  UNIQUE (period_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS time_slots (
  slot_id TEXT PRIMARY KEY,
  time_structure_id TEXT NOT NULL REFERENCES time_structures(time_structure_id) ON DELETE CASCADE,
  slot_order INTEGER NOT NULL,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('TEACHING','BREAK','NON_TEACHING')),
  start_time TEXT,
  end_time TEXT,
  label TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  UNIQUE (time_structure_id, slot_order)
);

CREATE TABLE IF NOT EXISTS teacher_limits (
  teacher_limit_id TEXT PRIMARY KEY,
  period_id TEXT NOT NULL REFERENCES academic_periods(period_id),
  teacher_id TEXT NOT NULL REFERENCES teachers(teacher_id),
  max_weekly_jp INTEGER NOT NULL CHECK (max_weekly_jp > 0),
  target_weekly_jp INTEGER,
  max_daily_jp INTEGER,
  UNIQUE (period_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS subject_requirements (
  requirement_id TEXT PRIMARY KEY,
  period_id TEXT NOT NULL REFERENCES academic_periods(period_id),
  class_id TEXT NOT NULL REFERENCES classes(class_id),
  subject_id TEXT NOT NULL REFERENCES subjects(subject_id),
  weekly_jp INTEGER NOT NULL CHECK (weekly_jp > 0),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','APPROVED','INACTIVE')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (period_id, class_id, subject_id)
);

CREATE TABLE IF NOT EXISTS teacher_allocations (
  allocation_id TEXT PRIMARY KEY,
  requirement_id TEXT NOT NULL REFERENCES subject_requirements(requirement_id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES teachers(teacher_id),
  allocated_jp INTEGER NOT NULL CHECK (allocated_jp >= 0),
  allocation_mode TEXT NOT NULL DEFAULT 'MANUAL' CHECK (allocation_mode IN ('MANUAL','AUTO_PROPOSED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_alloc_requirement ON teacher_allocations(requirement_id);
CREATE INDEX IF NOT EXISTS idx_alloc_teacher ON teacher_allocations(teacher_id);

CREATE TABLE IF NOT EXISTS generation_jobs (
  job_id TEXT PRIMARY KEY,
  period_id TEXT NOT NULL REFERENCES academic_periods(period_id),
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN ('QUEUED','RUNNING','SUCCESS','INFEASIBLE','SEARCH_LIMIT_REACHED','INVALID_INPUT','CANCELLED','FAILED')),
  input_fingerprint TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  candidate_count INTEGER NOT NULL DEFAULT 0,
  progress_stage TEXT,
  stop_reason TEXT,
  request_id TEXT,
  started_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS schedule_candidates (
  candidate_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES generation_jobs(job_id) ON DELETE CASCADE,
  period_id TEXT NOT NULL REFERENCES academic_periods(period_id),
  validity_status TEXT NOT NULL DEFAULT 'VALID' CHECK (validity_status IN ('VALID','INVALID')),
  score REAL,
  score_breakdown TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_candidates_job ON schedule_candidates(job_id);

CREATE TABLE IF NOT EXISTS schedule_drafts (
  draft_id TEXT PRIMARY KEY,
  period_id TEXT NOT NULL REFERENCES academic_periods(period_id),
  base_version_id TEXT,
  candidate_id TEXT,
  status TEXT NOT NULL DEFAULT 'EDITING'
    CHECK (status IN ('EDITING','VALIDATING','READY','BLOCKED','PUBLISHED','ABANDONED')),
  input_fingerprint TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS schedule_entries (
  entry_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL, -- candidate_id / draft_id / version_id
  owner_type TEXT NOT NULL CHECK (owner_type IN ('CANDIDATE','DRAFT','VERSION')),
  class_id TEXT NOT NULL REFERENCES classes(class_id),
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('MON','TUE','WED','THU','FRI','SAT')),
  slot_order INTEGER NOT NULL,
  subject_id TEXT NOT NULL REFERENCES subjects(subject_id),
  teacher_id TEXT NOT NULL REFERENCES teachers(teacher_id),
  requirement_id TEXT NOT NULL REFERENCES subject_requirements(requirement_id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (owner_id, class_id, day_of_week, slot_order)
);
CREATE INDEX IF NOT EXISTS idx_entries_owner ON schedule_entries(owner_id);
CREATE INDEX IF NOT EXISTS idx_entries_teacher ON schedule_entries(teacher_id, day_of_week, slot_order);

CREATE TABLE IF NOT EXISTS schedule_versions (
  version_id TEXT PRIMARY KEY,
  period_id TEXT NOT NULL REFERENCES academic_periods(period_id),
  version_number INTEGER NOT NULL,
  draft_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUPERSEDED','ROLLED_BACK')),
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (period_id, version_number)
);

CREATE TABLE IF NOT EXISTS schedule_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL REFERENCES schedule_versions(version_id) ON DELETE CASCADE,
  snapshot_schema_version INTEGER NOT NULL DEFAULT 1,
  data_payload TEXT NOT NULL,
  checksum TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS validation_results (
  validation_id TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  rule_code TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('ERROR','WARNING','INFO')),
  is_hard_constraint INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL,
  related_entity_ids TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_validation_subject ON validation_results(subject_type, subject_id);

CREATE TABLE IF NOT EXISTS audit_log (
  audit_id TEXT PRIMARY KEY,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  actor TEXT, -- null: operasi tanpa autentikasi
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_summary TEXT,
  after_summary TEXT,
  request_id TEXT,
  result TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts);
