-- 아이템 설명 컬럼 + 스토리 상점 5종 (acc_item1, acc_item2, body_item4, hat_item3, hat_item5)

alter table public.wechu_items add column if not exists description text not null default '';

update public.wechu_items set
  name = '리쿠의 두 번째 단추',
  cost = 10,
  description = $desc$
일본에서는 졸업식 날 심장과 가장 가까운 두 번째 가쿠란 단추를 줄 수 있냐고 고백하는게 유행이래! 리쿠도 졸업식 때 단추를 줄 수 있냐고 질문을 많이 받았는데, 그게 귀찮았는지 떼서 위츄에게 줬어!
$desc$
where item_key = 'acc_item1';

update public.wechu_items set
  name = '유우시의 별 단추',
  cost = 50,
  description = $desc$
유우시의 두 번째 단추 얘기를 듣고 한참 고민하더니 유우시가 달아준 별 단추. "우린 역시 별이지!" 아무리봐도 그건 핑계고 리쿠가 멋져보여서 따라한 것 같은데... 귀여우니까 됐다!
$desc$
where item_key = 'acc_item2';

update public.wechu_items set
  name = '재희의 위꾸 리본',
  cost = 50,
  description = $desc$
팬들 사이에서 민봄을 리본으로 꾸미는 문화가 있다는 걸 알게 된 재희가 위츄도 위꾸하자! 하며 꾸며준 리본! 료한테 자랑하니까 좀 작은 것 같다며 놀렸어 ㅡㅡ 하나도 안 작거든!
$desc$
where item_key = 'body_item4';

update public.wechu_items set
  name = '시온의 별 머리핀',
  cost = 50,
  description = $desc$
기분이 너무 좋아서 조금 시끄럽게 했더니 시온이 갑자기 꽂아준 별 머리핀. "움직이지 마, 테스트 중이야." 뭘 테스트 하는진 잘 모르겠지만 어쨌든 가만히 있었는데 시온은 이미 한참 전에 나간 후였다… 이거 그냥 조용히 시키려고 아무 말이나 한 거지?
$desc$
where item_key = 'hat_item3';

update public.wechu_items set
  name = '사쿠야의 모자',
  cost = 100,
  description = $desc$
260503 Ode to love 인기가요 무대에서 사쿠야가 쓴 모자. 팬들이 에버랜드에서 알바할 것 같다고 많이 좋아해줬었지? 이날 인기가요 첫 1등을 해서 사쿠야가 기념으로 위츄에게 모자를 선물해줬어. 시즈니들아, 1등 고마워!
$desc$
where item_key = 'hat_item5';
