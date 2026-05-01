insert into public.venues (slug, name, lat, lng, radius_m)
values ('line-seoul-5682', '종로·동대문 인근 줄 존', 37.5682, 126.9977, 420)
on conflict (slug)
do update set
  name = excluded.name,
  lat = excluded.lat,
  lng = excluded.lng,
  radius_m = excluded.radius_m;
