import {useLocale} from './locale';
const tips:Record<string,string>={
 rankers:'직업을 고르고 내 캐릭터를 연결한 뒤, 비교할 랭커를 선택하세요.',
 map:'지역을 고른 뒤 찾는 이름을 검색하세요. 지도에서 표시를 누르면 자세한 정보를 볼 수 있습니다.',
 database:'궁금한 스킬이나 아이템 이름을 검색하세요. 지역과 데이터 기준도 함께 확인하세요.',
 'public-builds':'다른 유저의 세팅을 살펴보고, 내 직업과 목적에 맞는지 확인하세요.',
 builds:'현재 계획에 이름을 붙여 보관하거나 저장한 계획을 다시 불러오세요.',
 updates:'공지의 날짜와 지역을 확인하세요. 게임 변경 사항과 추천 검토 상태는 별도로 표시됩니다.'
};
export default function PageHelp({screen}:{screen:string}){
 const {t}=useLocale();
 return <>{tips[screen]&&<p className="page-direction">{t(tips[screen])}</p>}<details className="page-help"><summary>{t('사용 방법과 용어')}</summary><div>
 <p>{t('처음이라면 빌드에서 직업을 고른 뒤 추천을 미리 보세요. 장비 비교는 랭커에서 할 수 있습니다.')}</p>
 <p>{t('빌드는 스킬과 장비의 조합입니다. 여기서 바꾼 내용은 게임에 자동 적용되지 않습니다.')}</p>
 <p>{t('PvE는 몬스터와의 전투, PvP는 다른 플레이어와의 전투입니다.')}</p>
 <p>{t('포인트는 스킬이나 능력에 나누어 쓰는 점수입니다. 총량은 이미 쓴 점수와 남은 점수를 합친 값입니다.')}</p>
 <p>{t('설정은 이 브라우저에 저장됩니다. 다른 기기로 옮기려면 보관함에서 내보내기·가져오기를 사용하세요.')}</p>
 </div></details></>;
}
