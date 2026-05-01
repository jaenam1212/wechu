-- 옛 시드에서 wechu-demo 반경이 500km 라 전국 어디서나 매칭됨.
-- GPS 정책(MAX_GPS_VENUE_RADIUS_M)과 맞추고 데모는 광화문 인근 소구역만 허용.
UPDATE public.venues
SET radius_m = 280
WHERE slug = 'wechu-demo'
  AND radius_m > 10000;
