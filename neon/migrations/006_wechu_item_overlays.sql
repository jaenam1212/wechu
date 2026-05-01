insert into public.wechu_items (item_key, name, slot, cost)
values
  ('hat_item3', 'Top 아이템 3', 'hat', 1),
  ('hat_item5', 'Top 아이템 5', 'hat', 1),
  ('body_item4', 'Mid 아이템 4', 'body', 1),
  ('acc_item1', 'Bottom 아이템 1', 'acc', 1),
  ('acc_item2', 'Bottom 아이템 2', 'acc', 1)
on conflict (item_key)
do update set
  name = excluded.name,
  slot = excluded.slot,
  cost = excluded.cost;
