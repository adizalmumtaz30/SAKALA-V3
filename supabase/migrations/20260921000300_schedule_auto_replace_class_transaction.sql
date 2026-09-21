create or replace function public.replace_schedule_for_class(
  p_academic_year_id uuid,
  p_class_id uuid,
  p_entries jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if jsonb_typeof(p_entries) <> 'array' then
    raise exception 'p_entries must be a JSON array';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_entries) as x(
      teaching_assignment_id uuid,
      teacher_id uuid,
      subject_id uuid,
      class_id uuid,
      day text,
      period_number integer
    )
    where x.class_id <> p_class_id
  ) then
    raise exception 'entry class mismatch';
  end if;

  delete from public.schedule_entry
  where academic_year_id = p_academic_year_id
    and class_id = p_class_id;

  insert into public.schedule_entry (
    academic_year_id,
    teaching_assignment_id,
    teacher_id,
    subject_id,
    class_id,
    day,
    period_number,
    room_id,
    source,
    locked
  )
  select
    p_academic_year_id,
    x.teaching_assignment_id,
    x.teacher_id,
    x.subject_id,
    x.class_id,
    x.day,
    x.period_number,
    null,
    'auto',
    false
  from jsonb_to_recordset(p_entries) as x(
    teaching_assignment_id uuid,
    teacher_id uuid,
    subject_id uuid,
    class_id uuid,
    day text,
    period_number integer
  );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.replace_schedule_for_class(uuid, uuid, jsonb) from public, anon;
grant execute on function public.replace_schedule_for_class(uuid, uuid, jsonb) to authenticated;
