// Curated against manual-skill-purpose.json and shipped skill-descriptions.json,
// 2026-11-03. Advice is conditional, not a fixed combo or measured DPS ranking.
export const HOLD_MESSAGES={
 move:'이동할 방향이 위험하면 먼저 방향을 바꾸세요.',
 charge:'회피가 급하면 충전보다 생존을 우선하세요.',
 burst:'적이 곧 죽거나 공격할 수 없는 구간이 오면 다음 기회까지 아끼세요.',
 control:'공격 순서에 억지로 끼워 넣지 말고, 필요한 제어·대응 상황에 사용하세요.',
 release:'행동 불가가 아닐 때는 다음 제어에 대비해 아끼세요.',
 follow:'발동 조건이나 사용 가능 표시가 없으면 반복해서 누르지 마세요.',
 block:'공격이 닿기 전까지 아끼고, 회피가 필요한 공격은 회피를 우선하세요.',
 area:'적이 범위 밖이거나 곧 흩어지면 위치와 타이밍을 다시 잡으세요.',
 heal:'회복·해제가 필요하지 않다면 다음 피해 구간을 위해 남겨 두세요.',
 regen:'지속 회복이 남아 있으면 남은 시간과 다음 피해 구간을 확인하세요.',
 taunt:'위협이 안정적이고 약화 효과도 유지 중이면 다음 대응 시점을 확인하세요.',
 pull:'당겨 온 적이 파티를 위험하게 만들면 사용하지 마세요.',
 resource:'자원이 충분하면 소비할 공격과 다음 보충 시점을 먼저 확인하세요.',
 stagger:'그로기 상태나 사용 가능 표시가 없을 때는 아껴 두세요.',
 back:'후방을 잡으려다 위험해지면 위치 이동보다 생존을 우선하세요.',
 toggle:'소환이 유지 중일 때는 해제되지 않도록 반복 입력을 피하세요.',
 summon:'이미 소환되어 있으면 남은 상태를 확인하고 재사용하세요.',
 party:'같은 계열의 파티 효과가 유지 중이면 중복 여부를 먼저 확인하세요.',
 revive:'되살린 파티원이 바로 위험해질 상황이면 안전한 시점을 기다리세요.',
 guard:'회복·방어 효과가 필요한 구간을 고려해 사용 시점을 고르세요.',
 spirit:'협공에 맞는 정령과 공격 대상을 확인한 뒤 사용하세요.',
 healFirst:'파티 회복이 급하면 공격보다 회복·해제를 우선하세요.'
} as const;
type HoldCategory=keyof typeof HOLD_MESSAGES;
// Explicit IDs avoid guessing skill behavior from names or class membership.
export const HOLD_SKILL_GROUPS:Record<HoldCategory,readonly string[]>={
 move:'11190000 11360000 11450000 11100000 12430000 13070000 13360000 13050000 13220000 13280000 13140000 18090000 14090000'.split(' '),
 follow:'11170000 11200000 12240000 12270000 12300000 18100000 18150000 18080000'.split(' '),
 block:'11110000 12110000'.split(' '),
 area:'11050000 13700000 15390000 15200000'.split(' '),
 burst:'11390000 11400000 11250000 12450000 14310000 14220000 14380000 16370000 15400000 15310000 15320000'.split(' '),
 control:'12100000 14070000 14170000 16070000 15110000 15150000 18060000'.split(' '),
 release:'11260000 12260000 14260000 13260000 16200000 15240000 17240000 18200000'.split(' '),
 guard:'12230000 16190000 18240000'.split(' '),
 charge:'12090000 14010000 15060000'.split(' '),
 pull:['12130000'],stagger:'13340000 16340000 15010000 18300000'.split(' '),
 resource:['13100000','16010000'],back:['13060000'],toggle:['16250000'],summon:['17440000'],spirit:['16150000'],
 heal:['17100000','17120000','18120000'],regen:['17090000'],
 party:['17410000','18190000','18160000','18250000'],revive:['17390000'],healFirst:['17060000','17040000'],taunt:['12120000']
};
const categories=Object.fromEntries(Object.entries(HOLD_SKILL_GROUPS).flatMap(([category,ids])=>ids.map(id=>[id,category as HoldCategory])));
export function holdAdvice(id:string):string|undefined{const category=categories[id];return category?HOLD_MESSAGES[category]:undefined;}
export const CLASS_MACRO_ADVICE:Readonly<Record<string,string>>={
 gladiator:'돌진·막기·조건부 후속기는 직접 판단하고, 공격 강화는 집중 공격 직전에 사용하세요.',
 templar:'도발·보호막·포획·충전기는 수동으로 관리하세요. 파티 보호가 공격 순서보다 우선입니다.',
 ranger:'이동 방향과 충전 시간을 직접 판단하고, 공격 버프는 안전한 공격 시간에 맞추세요.',
 assassin:'위치 이동·문양 보충·후방 공격·그로기 기회를 직접 판단하세요. 위험한 위치로 자동 진입하지 않게 하세요.',
 elementalist:'정령의 소환·해제와 협공 대상을 확인하고, 강화 효과는 공격·방어가 필요한 순간에 맞추세요.',
 sorcerer:'충전 시간·제어 대상·지속 범위의 위치를 직접 판단하고, 공격 버프는 집중 공격에 맞추세요.',
 cleric:'파티 회복·해제·부활을 우선하고, 공격은 회복에 여유가 있을 때 사용하세요.',
 chanter:'파티 효과의 중복을 확인하고, 회복·보호막·공격 지원은 파티 상황에 맞춰 직접 사용하세요.'
};
// Assassin has no verified fixed rotation. These are independent conditional
// examples; never insert them into profile.rotation or a macro sequence.
export const ASSASSIN_CONDITIONAL_FLOW=[
 {title:'안전한 접근',body:'이동할 위치가 안전할 때 접근기를 골라 사용하세요.',ids:['13070000','13360000']},
 {title:'문양 보충',body:'문양이 부족할 때 보충 기술을 사용하고 문양 소비 공격을 이어가세요.',ids:['13100000','13130000']},
 {title:'후방·그로기 기회',body:'후방이 안전할 때 후방 공격을, 적이 그로기일 때 전용 공격을 선택하세요.',ids:['13060000','13340000']},
 {title:'위험 대응',body:'위험하면 순서와 관계없이 회피하고, 행동 불가는 해제 기술로 대응하세요.',ids:['13140000','13260000']}
];
