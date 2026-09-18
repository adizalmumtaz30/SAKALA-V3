-- SAKALA V3 — Backfill warna identitas untuk mapel yang dibuat sebelum
-- sistem warna ada (migration 0008). Urutan alfabetis supaya deterministik
-- dan stabil antar-jalankan, bukan acak.
with ordered as (
  select id, row_number() over (order by name) - 1 as idx
  from subject
  where color_key is null
),
palette as (
  select * from unnest(array[
    'deep-teal','burgundy','forest','ochre','aubergine','navy',
    'terracotta','sage','slate-blue','rust','plum','moss',
    'steel','amber-deep','indigo','clay','emerald-mut','mauve',
    'olive','cobalt-mut','brick','pine'
  ]) with ordinality as p(key, ord)
)
update subject s
set color_key = palette.key
from ordered, palette
where s.id = ordered.id
  and palette.ord = (ordered.idx % 22) + 1;
