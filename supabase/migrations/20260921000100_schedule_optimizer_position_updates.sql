create or replace function public.apply_schedule_position_updates(p_academic_year_id uuid, p_updates jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  row_no integer := 0;
begin
  if p_updates is null or jsonb_typeof(p_updates) <> 'array' then
    raise exception 'p_updates must be a JSON array';
  end if;

  -- Move all affected rows to temporary positive periods first. This makes
  -- swaps/cycles safe against the UNIQUE class/teacher constraints.
  for item in select * from jsonb_array_elements(p_updates)
  loop
    row_no := row_no + 1;
    update public.schedule_entry
    set period_number = 10000 + row_no
    where id = (item->>'id')::uuid
      and academic_year_id = p_academic_year_id
      and source = 'auto'
      and locked = false;
  end loop;

  for item in select * from jsonb_array_elements(p_updates)
  loop
    update public.schedule_entry
    set day = item->>'day',
        period_number = (item->>'periodNumber')::integer,
        updated_at = now()
    where id = (item->>'id')::uuid;
  end loop;
end;
$$;

revoke all on function public.apply_schedule_position_updates(uuid, jsonb) from public;
grant execute on function public.apply_schedule_position_updates(uuid, jsonb) to authenticated;