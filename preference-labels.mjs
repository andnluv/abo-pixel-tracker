/** UI localization only. All saved and modeled IDs remain unchanged. */
export const PREFERENCE_LABELS = Object.freeze({
  "power_exchange": "권력 교환(D/s)",
  "power_dynamics": "권력 관계(D/s)",
  "dominance": "지배 성향",
  "submission": "복종 성향",
  "switch": "스위치 성향",
  "fear_play": "공포 플레이",
  "verbal_teasing": "언어적 도발",
  "sensory_play": "감각 플레이",
  "loss_of_control": "통제권 상실",
  "praise": "칭찬 플레이",
  "praise_kink": "칭찬 플레이",
  "slow_burn": "서서히 깊어지는 관계",
  "quiet_intimacy": "조용한 친밀감",
  "emotional_vulnerability": "감정적 취약성",
  "being_pursued": "구애받기",
  "possessiveness": "소유욕",
  "exhibitionism": "노출 플레이",
  "exposure": "노출",
  "embarrassment": "수치심 플레이",
  "embarrassment_play": "수치심 플레이",
  "humiliation": "굴욕 플레이",
  "humiliation_play": "굴욕 플레이",
  "degradation": "비하 플레이",
  "degradation_play": "비하 플레이",
  "aftercare": "애프터케어",
  "roleplay": "역할극",
  "physical_closeness": "신체 밀착",
  "gentle_touch": "부드러운 스킨십",
  "restraint": "구속 플레이",
  "bondage": "본디지(구속 플레이)",
  "bdsm": "BDSM",
  "sadism": "가학 성향",
  "masochism": "피학 성향",
  "sadomasochism": "가학·피학 성향",
  "pet_play": "펫 플레이",
  "impact_play": "타격 플레이",
  "blindfold": "눈가리개 플레이",
  "temperature_play": "온도 플레이",
  "sensation_play": "감각 플레이",
  "sensory_deprivation": "감각 차단 플레이",
  "verbal_play": "언어 플레이",
  "dirty_talk": "노골적인 대화",
  "verbal_domination": "언어적 지배",
  "praise_play": "칭찬 플레이",
  "control": "통제",
  "control_play": "통제 플레이",
  "obedience": "복종",
  "discipline": "규율 플레이",
  "command": "명령 플레이",
  "commands": "명령 플레이",
  "possessive_play": "소유 표현",
  "territorial": "영역 행동",
  "jealousy": "질투",
  "protectiveness": "보호 성향",
  "affection": "애정 표현",
  "cuddling": "껴안기",
  "hugging": "포옹",
  "kissing": "입맞춤",
  "touch": "스킨십",
  "massage": "마사지",
  "eye_contact": "시선 교환",
  "eye_contact_play": "시선 플레이",
  "soft_dom": "부드러운 지배",
  "pleasure_dom": "쾌감 중심 지배",
  "teasing": "장난스러운 도발",
  "tease": "도발",
  "tease_and_denial": "도발과 지연",
  "voice_kink": "목소리 취향",
  "whispering": "귓속말",
  "longing": "갈망",
  "intensity": "강렬한 친밀감",
  "caregiving": "돌봄 성향",
  "caretaking": "돌봄 성향",
  "nurturing": "다정한 돌봄",
  "intimacy": "친밀감",
  "slow_pace": "느린 진행",
  "being_watched": "보여지는 상황",
  "watching": "바라보기",
  "public_exposure": "공개적인 노출",
  "private_exposure": "사적인 노출",
  "shame": "수치심",
  "shame_play": "수치심 플레이",
  "ownership": "소유 관계",
  "ownership_play": "소유 관계 플레이",
  "romantic_tension": "연애적 긴장감",
  "breath_play": "호흡 관련 플레이",
  "marking": "표식",
  "nesting": "네스팅",
  "knotting": "노팅",
  "body_worship": "신체 찬미",
  "pet_names": "애칭",
  "curiosity": "호기심",
  "physical_affection": "신체적 애정 표현",
  "intimacy_avoidance": "친밀감 회피",
  "being_needed": "필요로 여겨지기",
  "being_desired": "욕망의 대상이 되기",
  "being_called_cute": "귀엽다는 말을 듣기",
  "bonding_with_user": "유저와 유대 형성",
  "tight_squeezing": "강하게 쥐거나 조이기",
  "contact_request": "접촉 요청"
});
export const PREFERENCE_LEVELS = Object.freeze({
  "latent": "잠재적 관심",
  "liked": "선호",
  "strongly_liked": "강한 선호",
  "disliked": "비선호",
  "restricted": "제한"
});
export const ATTITUDE_LABELS = Object.freeze({
  "open": "열려 있음",
  "reserved": "소극적임",
  "curious": "호기심만 있음"
});
export const CYCLE_PHASE_LABELS = Object.freeze({
  "quiet": "안정기",
  "prodrome": "전조기",
  "active": "활성기",
  "recovery": "회복기",
  "suspended": "중단",
  "none": "해당 없음"
});
export const INSTINCT_LABELS = Object.freeze({
  "approach": "접근",
  "contact_seek": "접촉 요구",
  "protect": "보호",
  "jealousy": "질투",
  "territorial": "영역 행동",
  "nesting": "네스팅",
  "bond_partner_seek": "결합 상대 탐색"
});
export const PREGNANCY_LABELS = Object.freeze({
  "none": "해당 없음",
  "conception_pending": "임신 여부 판정 중",
  "pregnant_unaware": "임신 · 미인지",
  "pregnant_suspected": "임신 · 의심",
  "pregnant_confirmed": "임신 · 확인",
  "due": "출산 예정",
  "postpartum": "산후 회복",
  "unaware": "모름",
  "suspected": "의심",
  "confirmed": "확인"
});

export function preferenceLabel(id) {
  const raw=String(id??'').trim();
  return PREFERENCE_LABELS[raw.toLowerCase()] ?? raw;
}
export function preferenceDisplayLabel(preference) {
  const explicit=String(preference?.label??'').trim();
  return /[가-힣]/u.test(explicit) ? explicit : preferenceLabel(preference?.id);
}
export const preferenceLevelLabel = value => PREFERENCE_LEVELS[value] ?? String(value??'');
export const attitudeLabel = value => ATTITUDE_LABELS[value] ?? String(value??'');
export const cyclePhaseLabel = value => CYCLE_PHASE_LABELS[value] ?? String(value??'');
export const instinctLabel = value => INSTINCT_LABELS[value] ?? String(value??'');
export const pregnancyLabel = value => PREGNANCY_LABELS[value] ?? String(value??'');
/** If the user leaves the translated label untouched, preserve the machine ID.
 * A newly typed Korean label is either mapped to a known ID or saved verbatim.
 */
export function preferenceIdFromEdit(text, previousId='', previousLabel='') {
  const edited=String(text??'').trim().slice(0,80);
  if (!edited) return '';
  const previous=String(previousId??'').trim();
  if (edited===preferenceLabel(previous) || edited===String(previousLabel??'').trim()) return previous;
  if (Object.hasOwn(PREFERENCE_LABELS, edited.toLowerCase())) return edited.toLowerCase();
  const lookup=Object.entries(PREFERENCE_LABELS).find(([,label])=>label===edited);
  return lookup?.[0] ?? edited;
}

/** Presentation only: raw scene values remain untouched in event/state storage. */
export const SCENE_LABELS = Object.freeze({
  'on_back':'등을 대고 누운 자세', 'on_stomach':'엎드린 자세',
  'standing':'서 있는 자세', 'sitting':'앉은 자세', 'kneeling':'무릎 꿇은 자세',
  'lying_down':'누운 자세', 'side_lying':'옆으로 누운 자세',
  'penetration':'삽입', 'kissing':'입맞춤', 'hugging':'포옹',
  'touching':'접촉', 'holding_hands':'손잡기', 'cuddling':'껴안기',
  'contact_request':'접촉 요청', 'none':'없음'
});
export function sceneDisplayLabel(value) {
  const raw=String(value??'').trim();
  if (!raw) return '—';
  return SCENE_LABELS[raw.toLowerCase()] ?? PREFERENCE_LABELS[raw.toLowerCase()] ?? raw;
}
export function sceneRecordSummary(scene) {
  if (!scene || typeof scene!=='object') return '기록 없음';
  const parts=[scene.posture,scene.contact,...(Array.isArray(scene.play)?scene.play:[])].filter(Boolean).map(sceneDisplayLabel);
  return [...new Set(parts)].join(' · ') || '세부 내용 없음';
}
