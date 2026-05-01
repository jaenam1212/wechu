insert into public.venues (slug, name, lat, lng, radius_m)
values
  ('line-seoul-5416', '서울 동부 줄 존 A', 37.541616, 127.078827, 500),
  ('line-seoul-5398', '서울 동부 줄 존 B', 37.539857, 127.145226, 500)
on conflict (slug)
do update set
  name = excluded.name,
  lat = excluded.lat,
  lng = excluded.lng,
  radius_m = excluded.radius_m;
