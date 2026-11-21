-- A small made-up farm for local development (`supabase db reset` loads it).
-- It has no members: sign up, then make yourself its manager (README.md).
-- The PGlite tests load it too, so it always matches the schema.

insert into public.farm (id, name) values
  ('00000000-0000-4000-8000-000000000001', 'Demo farm · Gabès');

insert into public.greenhouse (id, farm_id, name, area_m2, crop, kg_per_crate) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'Serre 1', 10000, 'tomato', 12),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'Serre 2', 10000, 'tomato', 12),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'Serre 3', 10000, 'cherry-tomato', 6),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000001', 'Serre 4', 10000, 'pepper', 10),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000001', 'Serre 5', 10000, 'cucumber', 12),
  ('00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000001', 'Serre 6', 10000, 'melon', 15);

insert into public.team (id, farm_id, name) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'Équipe A'),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000001', 'Équipe B'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000001', 'Équipe C');

insert into public.worker (id, farm_id, full_name, team_id, badge_code)
select
  ('00000000-0000-4000-8000-' || lpad((300 + n)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000001',
  name,
  ('00000000-0000-4000-8000-' || lpad((200 + 1 + (n - 1) / 4)::text, 12, '0'))::uuid,
  'GH-' || lpad(n::text, 4, '0')
from unnest(array[
  'Amira Ben Salah', 'Bilel Gharbi', 'Chaima Trabelsi', 'Dhia Jlassi',
  'Emna Mansouri', 'Fares Ayari', 'Ghada Hammami', 'Hamza Bouazizi',
  'Ines Chebbi', 'Jawher Dridi', 'Khaoula Ferchichi', 'Lotfi Khelifi'
]) with ordinality as w (name, n);

insert into public.worker_pay (worker_id, farm_id, hourly_rate)
select id, farm_id, 2.4 + (row_number() over (order by badge_code) % 4) * 0.15
from public.worker
where farm_id = '00000000-0000-4000-8000-000000000001';

insert into public.hygiene_item (farm_id, label_ar, label_fr, label_en, photo_required, sort_order) values
  ('00000000-0000-4000-8000-000000000001', 'غسل اليدين قبل الدخول', 'Lavage des mains avant l''entrée', 'Hands washed before entering', false, 1),
  ('00000000-0000-4000-8000-000000000001', 'الصناديق نظيفة', 'Caisses propres', 'Crates clean', true, 2),
  ('00000000-0000-4000-8000-000000000001', 'لا طعام داخل البيت المحمي', 'Pas de nourriture dans la serre', 'No food inside the greenhouse', false, 3),
  ('00000000-0000-4000-8000-000000000001', 'المرحاض ونقطة الماء نظيفان', 'Toilettes et point d''eau propres', 'Toilets and water point clean', true, 4);
