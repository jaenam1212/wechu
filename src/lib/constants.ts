export const VOTE_COST = 40;
/** 1 reward point per this many seconds of verified wait (server clocks). */
export const REWARD_SECONDS_PER_POINT = 30;
export const MAX_REWARD_PER_SESSION = 5000;
export const MAX_SESSION_SECONDS = 86400;

/**
 * GPS로 줄 존을 고를 때·세션 시작 시 적용되는 최대 허용 반경(미터).
 * DB에 더 큰 반경(예: 옛 데모 500km)이 있어도 이 값 이내만 인정하여
 * 특정 줄 존만 사실상 허용한다.
 */
export const MAX_GPS_VENUE_RADIUS_M = 3500;
