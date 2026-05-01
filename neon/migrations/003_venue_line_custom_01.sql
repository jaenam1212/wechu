insert into public.venues (slug, name, lat, lng, radius_m)
values ('line-custom-01', '커스텀 줄 존', 37.5461, 126.8791, 250)
on conflict (slug)
do update set
  name = excluded.name,
  lat = excluded.lat,
  lng = excluded.lng,
  radius_m = excluded.radius_m;
