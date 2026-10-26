// These guides describe ASBC's shipped tools, not unverified game rules or market forecasts.
export const origin = 'https://asbc.app';
export const guidePath = (locale, slug = '') => (locale === 'ko' ? '/ko/guides/' : '/guides/') + (slug ? slug + '/' : '');
export const ui = {
 en: {title:'AION 2 Global Tools & Beginner Guides | ASBC',heading:'Plan your next move in AION 2.',intro:'Build with the points you have. Check a trade before spending Kinah. Find a location or keep the next timer in view.',eyebrow:'AION 2 · STEAM GLOBAL',description:'Free AION 2 Global tools and guides: build planner, Daevanion point guide, trading calculator, boss timers and collection map.',open:'Open ASBC',browse:'Choose what you want to do',all:'All guides',read:'Read guide',steps:'Start here',related:'Keep exploring',skip:'Skip to content',footer:'Unofficial fan tools. Game data © NCSOFT.',official:'Official AION 2 website',privacy:'Privacy',languages:'Guide language',about:'Made for Global players',aboutText:'The planner supports all eight classes. The app offers English, Korean, Japanese and Finnish; these guides are available in English and Korean. Use the tools without signing in. Steam sign-in is available for supported account sync and community features.',scope:'A plan you can check',scopeText:'Your level, point budget and entered prices drive the results. Character lookup does not confirm every unspent point, timers can be delayed, and the map shows possible locations. Each guide explains what to check in the game.'},
 ko: {title:'아이온2 글로벌 도구와 초보자 이용 안내 | ASBC',heading:'지금 필요한 것부터, 하나씩.',intro:'내 포인트에 맞춰 빌드를 보고, 키나를 쓰기 전에 손익을 계산하세요. 지도에서 위치를 찾고 다음 콘텐츠 시간도 확인할 수 있습니다.',eyebrow:'아이온2 · STEAM 글로벌',description:'아이온2 Steam 글로벌용 빌드·데바니온·거래소 계산기·콘텐츠 타이머·수집 지도 이용 안내. 내 포인트와 가격으로 계획하세요.',open:'ASBC 열기',browse:'무엇을 하고 싶으세요?',all:'전체 안내',read:'이용 방법 보기',steps:'이 순서로 시작하세요',related:'함께 볼 안내',skip:'본문으로 건너뛰기',footer:'비공식 팬 도구 · 게임 데이터 © NCSOFT',official:'아이온2 공식 사이트',privacy:'개인정보 처리방침',languages:'안내 언어',about:'Steam 글로벌 이용자를 위한 도구',aboutText:'플래너는 8개 직업을 지원합니다. 앱은 한국어·영어·일본어·핀란드어, 이 안내는 영어·한국어로 제공됩니다. 기본 도구는 로그인 없이 사용하고, 지원하는 설정 동기화와 커뮤니티 기능에는 Steam 로그인을 이용할 수 있습니다.',scope:'게임 화면과 함께 확인하세요',scopeText:'내 레벨·포인트와 입력한 가격을 기준으로 계산합니다. 캐릭터 조회만으로 모든 잔여 포인트가 확인되지는 않습니다. 타이머는 지연될 수 있고 지도는 가능한 위치를 보여줍니다. 각 안내에 확인할 부분을 적었습니다.'}
};
export const topics = [
 {slug:'aion2-trade-calculator',route:'/trade',
 en:{title:'AION 2 Trade Calculator: Tax, Profit & Buy Limits | ASBC',heading:'Know what a trade leaves you.',label:'Trade calculator',description:'Calculate AION 2 Kinah profit after tax, a break-even selling price, purchase limits and partial-sale results. Compare stacks of 25, 50 or 100.',intro:'Enter a purchase price to see selling-price examples after tax. Change the quantity, tax and fees to match your own transaction.',cta:'Open trade calculator',
 steps:[['Enter the purchase cost','Choose a price per item or a total purchase cost. Set how many items you bought; do not enter a stack price as a single-item price.'],['Check the selling conditions','Confirm the current tax in your game. The calculator starts with 10% tax, zero fixed listing cost and conservative upward tax rounding. These are editable calculation defaults.'],['Choose a target or compare a price','Review break-even, 5%, 10% or 20% profit examples, or enter your own selling price. Profit percentage is measured against your purchase cost.']],
 sections:[{heading:'Example: buy at 130,000 Kinah, sell at 150,000',paragraphs:['Buy 100 items for a total of 13,000,000 Kinah. If all 100 sell at 150,000 each, with 10% sales tax and no extra fees, revenue is 15,000,000, tax is 1,500,000 and net profit is 500,000 Kinah.'],table:{caption:'Same unit selling price; all items sold; no fixed fee',head:['Selling plan','Tax','Total net profit'],rows:[['25 × 4 listings','1,500,000','500,000'],['50 × 2 listings','1,500,000','500,000'],['100 × 1 listing','1,500,000','500,000']]},after:'Splitting the same stock does not change the profit in this example. A fee for every listing, per-listing tax rounding or a different selling price can change the result.'},
 {heading:'How much can I pay?',paragraphs:['Use the purchase-limit tool when you already know a possible selling price. It works backwards from that price, tax, costs and your target profit to calculate a maximum purchase cost. A calculated limit does not mean buyers will pay your chosen selling price.']},
 {heading:'What if only some items sell?',paragraphs:['In the trade ledger, record the purchased quantity and cost, then the quantity sold and the actual amount received after settlement. The ledger separates realized profit from the cost still held in unsold inventory. Entering the actual settlement amount avoids deducting tax twice.','For crafting, compare the value of selling the materials with the proceeds and entered costs of selling the finished item. This also depends on the prices you enter.']},
 {heading:'Check before relying on a result',paragraphs:['ASBC does not fetch live exchange prices or guarantee a sale. Confirm the current tax, listing charges and rounding in the game. Relisting costs and changes in market price are not automatically included. The calculator is a planning tool; the ledger records what actually happened.']}],related:['aion2-build-planner']},
 ko:{title:'아이온2 거래소 계산기: 세금·순이익·구매 상한 | ASBC',heading:'팔고 나면 얼마나 남을까요?',label:'거래소 계산기',description:'아이온2 거래소 세후 순이익, 본전 판매가, 구매 상한과 일부 판매 손익을 계산합니다. 25개·50개·100개 묶음도 비교하세요.',intro:'구매 비용을 넣으면 세금을 뺀 판매가 예시가 나옵니다. 수량·세율·비용을 실제 거래 조건에 맞추세요.',cta:'거래소 계산기 열기',
 steps:[['구매 비용 입력','한 개 가격인지 전체 구매 비용인지 먼저 고르세요. 묶음 가격을 한 개 가격으로 넣지 않도록 산 수량도 확인합니다.'],['판매 조건 확인','게임의 현재 세율을 확인하세요. 기본값은 세율 10%, 고정 등록 비용 0키나, 묶음별 세금 올림입니다. 모두 수정할 수 있는 계산 조건입니다.'],['목표 이익 또는 판매가 비교','본전·5%·10%·20% 이익 예시를 보거나 직접 팔 가격을 넣으세요. 이익률의 기준은 구매 비용입니다.']],
 sections:[{heading:'예: 13만에 사서 15만에 팔면?',paragraphs:['100개를 개당 130,000키나에 사면 총 구매 비용은 13,000,000키나입니다. 모두 개당 150,000키나에 팔고 세율 10%, 추가 비용 0키나라면 판매 금액 15,000,000키나에서 세금 1,500,000키나를 빼고 순이익 500,000키나가 남습니다.'],table:{caption:'동일한 개당 판매가·전량 판매·고정 등록비 없음',head:['판매 방식','세금','전체 순이익'],rows:[['25개씩 4번','1,500,000','500,000'],['50개씩 2번','1,500,000','500,000'],['100개 한 번','1,500,000','500,000']]},after:'이 예에서는 나누어 팔아도 이익이 같습니다. 매번 내는 등록 비용, 묶음별 세금 소수점 처리, 판매가 차이가 있으면 결과가 달라집니다.'},
 {heading:'얼마까지 사도 될까요?',paragraphs:['팔 수 있을 것 같은 가격을 먼저 정했다면 구매 상한 도구를 쓰세요. 판매가·세율·비용·목표 이익에서 거꾸로 계산해 구매 상한을 보여줍니다. 그 가격에 실제로 팔린다는 보장은 아닙니다.']},
 {heading:'일부만 팔렸다면?',paragraphs:['거래 장부에 산 수량과 비용, 판매한 수량과 실제 정산 수령액을 기록하세요. 팔아서 확정된 이익과 남은 재고에 들어간 비용을 구분합니다. 실제 정산액을 넣으면 세금을 두 번 빼지 않습니다.','제작 비교에서는 재료를 그대로 파는 경우와 완성품을 파는 경우를 입력한 가격과 비용으로 비교할 수 있습니다.']},
 {heading:'계산 전에 확인할 점',paragraphs:['실시간 시세나 판매 가능성을 자동으로 확인하지 않습니다. 실제 세율·등록 비용·소수점 처리는 게임에서 확인하세요. 재등록 비용과 시세 변동은 자동 반영되지 않습니다. 계산기는 예상, 장부는 실제 거래 기록을 위한 도구입니다.']}],related:['aion2-build-planner']}},
 {slug:'aion2-build-planner',route:'/build',
 en:{title:'AION 2 Global Build Planner: Leveling, PvE & PvP | ASBC',heading:'Build around the points you have.',label:'Build planner',description:'Plan AION 2 Global skills for leveling, PvE or PvP. Set your level and point budget, connect a character and compare skills without copying a max-level budget.',intro:'Start with your class, level and available points. ASBC gives you a reference allocation you can inspect as your character grows.',cta:'Open build planner',
 steps:[['Choose your class','Open Build and select your class. You can begin without a character connection. To connect one, search by region, faction, server and exact character name.'],['Set your level and total points','Use the visible level and point fields. Choose total or remaining points to match your input, then check used / remaining / total. Total means spent plus remaining.'],['Choose Leveling, PvE or PvP','Use Leveling while progressing below level 45. The PvE option is intended for level-45 expedition planning. Inspect the highlighted skills, then switch to the Daevanion guide for nodes.']],
 sections:[{heading:'What changes when I edit points?',paragraphs:['The reference allocation recalculates for the entered level and budget. Skills keep their fixed display order; orange outlines help identify recommended upgrades. Review current and target levels before spending points in the game.']},
 {heading:'Why can my imported points differ?',paragraphs:['Public character data can show final skill levels and opened Daevanion nodes, but it does not confirm every unspent point or separate every source of skill bonuses. A final skill level is not the same as a directly spent skill-point total.','Leveling defaults use baseline rewards. The level-45 default assumes the listed side quests, sealed dungeons and garrisons are complete; it does not verify that your character has completed them. Correct the visible budget to match your own character.']},
 {heading:'Compare after you have a starting plan',paragraphs:['Use Ranking to browse characters and the comparison view inside Build to inspect differences. A ranker can have more points or different gear. Review the budget-aware Daevanion guide before trying to follow the whole layout.','The app also includes gear comparison, skill specialization details and a visual macro/key-layout guide. Use these when you need them; a connected character is not required to start exploring a class.']},
 {heading:'What the recommendation means',paragraphs:['This is a reference allocation within your entered constraints. It is not a proven optimal leveling route, a DPS guarantee or an automatic change to your in-game character. You make the final skill and node choices in the game.']}],related:['aion2-daevanion-guide','aion2-map']},
 ko:{title:'아이온2 글로벌 빌드 플래너: 레벨링·PvE·PvP | ASBC',heading:'내 포인트로 지금 올릴 것부터.',label:'빌드 플래너',description:'아이온2 글로벌 레벨링·PvE·PvP 스킬을 내 레벨과 포인트에 맞춰 살펴보세요. 캐릭터 연결, 스킬 안내와 데바니온 비교를 지원합니다.',intro:'직업과 레벨, 가진 포인트부터 맞추세요. 성장하면서 바뀌는 참고 배분을 직접 확인할 수 있습니다.',cta:'빌드 플래너 열기',
 steps:[['직업 선택','빌드에서 직업을 고르세요. 캐릭터 연결 없이도 시작할 수 있습니다. 연결할 때는 지역·종족·서버와 정확한 이름으로 검색합니다.'],['레벨과 총 포인트 입력','레벨과 포인트를 게임과 맞추세요. 입력할 숫자에 맞게 총량 또는 남음 방식을 고르고 사용·남음·총량을 확인합니다. 총량은 이미 쓴 양과 남은 양을 더한 값입니다.'],['레벨링·PvE·PvP 선택','45레벨 미만 성장 중에는 레벨링을, 45레벨 원정 계획에는 PvE를 선택하세요. 강조된 스킬을 확인하고 데바니온 화면에서 노드도 살펴봅니다.']],
 sections:[{heading:'포인트를 바꾸면 무엇이 달라지나요?',paragraphs:['입력한 레벨과 포인트에 맞춰 참고 배분이 다시 계산됩니다. 스킬은 고정된 순서로 표시되며 주황 테두리로 추천 업그레이드를 찾을 수 있습니다. 게임에서 찍기 전에 현재와 목표 레벨을 비교하세요.']},
 {heading:'캐릭터를 불러왔는데 포인트가 다른 이유',paragraphs:['공개 캐릭터 정보에는 최종 스킬 레벨과 개방한 데바니온 노드가 보일 수 있지만, 모든 잔여 포인트나 스킬 보너스의 출처까지 확인되지는 않습니다. 최종 스킬 레벨이 직접 투자한 스킬 포인트와 같은 뜻은 아닙니다.','레벨링 기본값은 기본 보상을 기준으로 합니다. 45레벨 기본값은 안내된 서브 퀘스트·봉인던전·주둔지를 완료했다고 가정하며 실제 완료를 확인한 값이 아닙니다. 내 캐릭터의 수치와 다르면 직접 수정하세요.']},
 {heading:'시작할 배분을 정한 뒤 비교하세요',paragraphs:['랭킹에서는 캐릭터를 둘러보고, 빌드 안의 비교 화면에서 차이를 확인합니다. 랭커는 나보다 포인트가 많거나 장비가 다를 수 있습니다. 전체 배치를 따라 하기 전에 포인트별 데바니온 안내를 보세요.','장비 비교, 스킬 특화 설명, 눈으로 보는 매크로·키 배치 안내도 있습니다. 직업을 처음 살펴볼 때 모든 설정을 먼저 할 필요는 없습니다.']},
 {heading:'추천의 의미',paragraphs:['입력한 조건 안에서 만든 참고 배분입니다. 최적의 레벨링 효율이나 DPS를 검증한 결과는 아니며 게임 캐릭터가 자동으로 변경되지도 않습니다. 최종 스킬과 노드는 게임에서 직접 선택하세요.']}],related:['aion2-daevanion-guide','aion2-map']}},
 {slug:'aion2-daevanion-guide',route:'/build/daevanion',
 en:{title:'AION 2 Daevanion Guide: Plan Nodes With Your Points | ASBC',heading:'A node guide for your budget.',label:'Daevanion guide',description:'Plan AION 2 Daevanion nodes with your own point budget. View one board at a time and separate priority nodes from later upgrades when comparing a ranker.',intro:'A complete ranker layout can use more points than you have. Set your own budget first, then inspect what to take now and what to leave for later.',cta:'Open Daevanion planner',
 steps:[['Confirm the point budget','In Build, enter total Daevanion points: spent plus unspent. Keep any separately shown resource, such as Asphel crystals, in its own field.'],['Choose a board','Switch between the Nezekan, Zikel, Vaizel and Triniel tabs to read one board at a time. Select a node to inspect its effect and cost.'],['Inspect the comparison guide','From Build’s comparison view, choose the target character and open its Daevanion guide. Read the legend with the board: priority nodes fit the guide’s current budget, while blue nodes are later targets.']],
 sections:[{heading:'Example: you have 370 points, the target uses 416',paragraphs:['Enter 370 as your own total, not 416. The comparison should show a smaller achievable reference allocation and mark later targets separately. You do not need to match every node immediately.','Change your budget or target character to get an updated guide. Check connecting paths and any separately limited resource before copying a suggested node into your game.']},
 {heading:'A different node is not automatically a bad node',paragraphs:['A comparison can mark nodes already shared, nodes that differ and nodes still missing. A difference only describes the two layouts. It does not prove your existing node is useless for your own content or gear.','The budget guide uses the available target and node data to help prioritize. It is not a measured ranking of DPS or survivability for every possible character.']},
 {heading:'Check totals before following the guide',paragraphs:['Character lookup and the planner’s budget are different inputs. If lookup cannot confirm the total or unused points, enter the values from the game. For example, 104 spent and 10 unspent means 114 total.','Review the guide again after leveling, acquiring points or selecting another target. The site is a planning aid and does not spend points on your character.']}],related:['aion2-build-planner']},
 ko:{title:'아이온2 데바니온 가이드: 내 포인트별 노드 계획 | ASBC',heading:'내 포인트에 맞춰, 먼저 찍을 노드부터.',label:'데바니온 가이드',description:'아이온2 데바니온을 내 총 포인트로 계획하세요. 보드별 탭과 랭커 비교에서 우선 노드·나중에 찍을 노드를 나눠 볼 수 있습니다.',intro:'랭커의 완성 배치를 그대로 따라 하기에는 포인트가 부족할 수 있습니다. 내 총량을 먼저 맞춘 뒤 지금과 나중의 목표를 나누어 보세요.',cta:'데바니온 플래너 열기',
 steps:[['총 포인트 확인','빌드에 이미 쓴 양과 남은 양을 더한 데바니온 총량을 넣습니다. 아스펠 결정처럼 별도로 표시되는 자원은 해당 칸에 따로 입력하세요.'],['보드 선택','네자칸·지켈·바이젤·트리니엘 탭으로 한 보드씩 크게 봅니다. 노드를 선택해 효과와 비용을 확인하세요.'],['비교 가이드 확인','빌드의 비교 화면에서 목표 캐릭터를 고르고 데바니온 안내를 여세요. 범례를 함께 읽으세요. 현재 예산의 우선 노드와 파란색 후순위 목표를 구분합니다.']],
 sections:[{heading:'예: 나는 370포인트, 목표는 416포인트',paragraphs:['내 총량에는 416이 아닌 370을 입력하세요. 가이드는 내 예산에 맞춘 참고 배분과 나중에 찍을 목표를 구분합니다. 처음부터 모든 노드를 같게 맞출 필요는 없습니다.','포인트나 목표 캐릭터를 바꾸면 안내가 갱신됩니다. 게임에서 찍기 전에는 연결 경로와 별도 자원의 제한도 확인하세요.']},
 {heading:'다른 노드가 곧 불필요한 노드는 아닙니다',paragraphs:['이미 같은 노드, 서로 다른 노드, 추가할 노드를 구분해 볼 수 있습니다. 차이 표시는 두 배치를 비교한 결과입니다. 내 콘텐츠나 장비에서 쓸모없다고 판정한 것은 아닙니다.','포인트별 안내는 목표 배치와 노드 정보로 우선순위를 살펴보는 도구입니다. 모든 캐릭터의 DPS나 생존 효율을 실측한 순위는 아닙니다.']},
 {heading:'따라 하기 전에 총량을 확인하세요',paragraphs:['조회한 캐릭터 정보와 플래너에 입력하는 예산은 서로 다릅니다. 총량이나 잔여량을 확인할 수 없으면 게임 수치를 입력하세요. 예를 들어 104포인트를 쓰고 10포인트가 남았다면 총량은 114입니다.','레벨이 오르거나 포인트를 얻거나 비교 대상을 바꾸면 다시 확인하세요. 사이트에서 게임 캐릭터의 포인트를 대신 사용하지는 않습니다.']}],related:['aion2-build-planner']}},
 {slug:'aion2-boss-timers',route:'/timers',
 en:{title:'AION 2 Boss & Event Timers for Global Servers | ASBC',heading:'Keep the next event in view.',label:'Boss & event timers',description:'View AION 2 Global boss and event timers by server. Pin the content you follow and use a dedicated timer page alongside the game.',intro:'Choose your region and server, pin the content you follow, and leave the dedicated timer page open beside the game.',cta:'Open content timers',
 steps:[['Choose the right server','Open the server and timer settings. Confirm your Global region and current server, especially after a server transfer.'],['Pin the content you follow','Pick the available bosses and events you want to keep in view. The top timer strip is available while using other tools.'],['Use the dedicated timer page','Open Content Timers for a screen focused on countdowns. Content icons help distinguish event categories; check the name and status too.']],
 sections:[{heading:'Reported times and reference schedules are different',paragraphs:['Some boss times come from external observation records. Other events use reference schedules. Read each timer’s status, source label and update time before treating it as current.','A countdown reaching zero does not prove that a boss is alive on your server. A stale record or delayed refresh can affect the displayed time. Use in-game confirmation when timing matters.']},
 {heading:'Using timers while planning',paragraphs:['You can keep the dedicated page in a second browser tab or window. On other ASBC pages, drag the top timer strip horizontally to view more pinned content; touch scrolling is available on mobile.','If a timer looks wrong or missing, check the selected server, pinned-content settings and status message. A reference schedule is not a live spawn detector.']}],related:['aion2-map','aion2-build-planner']},
 ko:{title:'아이온2 글로벌 보스·콘텐츠 타이머 | ASBC',heading:'다음 콘텐츠 시간을 한눈에.',label:'보스·콘텐츠 타이머',description:'서버별 아이온2 글로벌 보스와 콘텐츠 타이머를 확인하세요. 원하는 콘텐츠를 고정하고 타이머 전용 페이지를 게임 옆에 띄울 수 있습니다.',intro:'지역과 서버를 고르고 자주 보는 콘텐츠를 고정하세요. 게임 옆에 타이머 전용 페이지를 열어 둘 수 있습니다.',cta:'콘텐츠 타이머 열기',
 steps:[['현재 서버 선택','서버·타이머 설정에서 글로벌 지역과 현재 서버를 확인하세요. 서버를 이전했다면 선택도 바꿔야 합니다.'],['관심 콘텐츠 고정','제공되는 보스와 콘텐츠 중 계속 보고 싶은 항목을 고르세요. 다른 도구를 쓰는 동안에도 상단 타이머를 볼 수 있습니다.'],['전용 페이지 이용','콘텐츠 타이머로 이동하면 시간을 모아서 볼 수 있습니다. 종류별 아이콘과 함께 이름·상태를 확인하세요.']],
 sections:[{heading:'관측 기록과 참고 일정은 다릅니다',paragraphs:['일부 보스 시간은 외부 관측 기록을, 다른 콘텐츠는 참고 일정을 사용합니다. 각 타이머의 상태·출처 표시·갱신 시각을 함께 읽으세요.','카운트다운이 0이 됐다고 현재 서버에 보스가 살아 있다는 뜻은 아닙니다. 오래된 기록이나 갱신 지연이 표시 시간에 영향을 줄 수 있습니다. 정확한 시점이 중요하면 게임에서 확인하세요.']},
 {heading:'다른 도구와 함께 쓰기',paragraphs:['전용 페이지를 별도 탭이나 창에 띄울 수 있습니다. 다른 ASBC 페이지의 상단 타이머는 좌우로 드래그해 더 볼 수 있고 모바일에서는 터치로 스크롤합니다.','타이머가 이상하거나 보이지 않으면 선택한 서버, 고정 콘텐츠와 상태 문구를 확인하세요. 참고 일정은 실시간 출현 감지가 아닙니다.']}],related:['aion2-map','aion2-build-planner']}},
 {slug:'aion2-map',route:'/map',
 en:{title:'AION 2 Global Map: Hidden Cubes & Collection Locations | ASBC',heading:'Find a place. Track your progress.',label:'Map & collections',description:'Explore AION 2 Global locations for hidden cubes, gathering, NPCs and more. Filter markers and track checked locations on ASBC’s collection map.',intro:'Choose the map and marker categories you need, then zoom in to inspect a location. Keep the display focused on the places you are looking for.',cta:'Open map & collections',
 steps:[['Choose a map and category','Select the region or map, then enable the marker types you need. More than one type can be shown together.'],['Find and inspect a location','Search available location names or zoom in. Select a marker to inspect its details and use nearby landmarks to orient yourself.'],['Record what you have checked','Use the location’s completion control when you have checked it in the game. Browsing a marker alone should not be treated as completing it.']],
 sections:[{heading:'Are hidden cubes visible right now?',paragraphs:['The hidden-cube markers show possible locations from the available map data. They do not indicate that a cube is currently present on your server or channel.','ASBC does not have a verified live feed for hidden-cube spawns or a dependable active-duration rule to apply. A checked marker is your progress record, not proof that a cube cannot appear there again.']},
 {heading:'Make a crowded map easier to read',paragraphs:['Turn off categories you are not looking for, and zoom in when several markers overlap. Keep place names visible if they help you recognize the area in the game.','On a phone, move around the map and select individual markers rather than trying to read the entire region at once. Category counts describe the dataset, not the number of objects currently spawned.']},
 {heading:'Bring your plan back to the game',paragraphs:['Use the map for navigation and collection tracking. Use the build planner for your current skill and Daevanion budget, and the timer page for supported events. These tools answer different questions; a map marker is not a spawn timer.']}],related:['aion2-boss-timers','aion2-build-planner']},
 ko:{title:'아이온2 글로벌 지도: 히든큐브·채집·수집 위치 | ASBC',heading:'위치를 찾고 확인한 곳을 기록하세요.',label:'지도·수집',description:'아이온2 글로벌 히든큐브 후보 위치, 채집물, NPC 등을 지도에서 찾으세요. 표시 항목을 고르고 확인한 위치를 기록할 수 있습니다.',intro:'필요한 지도와 표시 항목을 고르고 확대해서 위치를 살펴보세요. 찾는 대상 위주로 표시하면 지도가 읽기 쉬워집니다.',cta:'지도·수집 열기',
 steps:[['지도와 표시 항목 선택','지역이나 지도를 고른 뒤 필요한 마커 종류를 켜세요. 여러 종류를 함께 표시할 수 있습니다.'],['위치 찾아보기','제공되는 위치 이름을 검색하거나 지도를 확대하세요. 마커를 눌러 상세 내용을 보고 주변 지형과 비교합니다.'],['확인한 위치 기록','게임에서 확인했다면 해당 위치의 완료 표시를 사용하세요. 마커를 열어 보기만 한 것은 완료와 다릅니다.']],
 sections:[{heading:'히든큐브가 지금 있는 위치인가요?',paragraphs:['히든큐브 마커는 지도 데이터에 있는 출현 가능 위치입니다. 현재 내 서버·채널에 큐브가 있다는 표시는 아닙니다.','확인된 실시간 히든큐브 출현 정보나 적용할 수 있는 확실한 유지 시간 규칙은 없습니다. 완료 마커도 내 확인 기록이며 다시 출현하지 않는다는 뜻은 아닙니다.']},
 {heading:'지도가 복잡하게 보이면',paragraphs:['지금 찾지 않는 항목을 끄고, 마커가 겹치는 곳은 확대하세요. 게임에서 위치를 알아보기 좋다면 지역 이름도 함께 표시합니다.','모바일에서는 지역 전체를 한 번에 읽으려 하기보다 이동하며 개별 마커를 선택하세요. 항목 옆 숫자는 데이터에 있는 위치 수이며 현재 출현한 개수가 아닙니다.']},
 {heading:'게임에서 필요한 정보에 맞춰 사용하세요',paragraphs:['지도는 위치 탐색과 수집 기록에 사용합니다. 스킬·데바니온 포인트는 빌드에서, 지원하는 이벤트 시간은 타이머에서 확인하세요. 지도 마커 자체가 출현 타이머인 것은 아닙니다.']}],related:['aion2-boss-timers','aion2-build-planner']}}
];

// Public discovery follows the reviewed people/build flows released on 2026-10-26.
topics.splice(1,0,{
 "slug": "aion2-public-builds",
 "route": "/public-builds",
 "en": {
  "title": "AION 2 Public Builds: Find, Edit, Save & Share | ASBC",
  "heading": "Find a build. Make it your own.",
  "label": "Public builds & people",
  "description": "Find AION 2 Global community builds by class or author. Check required points, apply a build, edit your copy, save it and share a link.",
  "intro": "Check a shared setup against your level and points, then adapt a personal copy. Public builds can be read without signing in.",
  "cta": "Find public builds",
  "steps": [
   [
    "Find a starting build",
    "Open Public builds. Filter by class, search the title and choose recent updates or most liked. Clear the filters if nothing matches."
   ],
   [
    "Check the plan before applying",
    "Inspect the level, skill and Stigma costs, Daevanion boards and equipment guidance. Save your current plan first if you want to keep it, then choose Apply to my planner."
   ],
   [
    "Edit, save and share your copy",
    "Edit skills, specializations or nodes in the planner. Save a named build in the library. Create a share link for the current allocation, or sign in and write a public build post."
   ]
  ],
  "sections": [
   {
    "heading": "Find a specific person",
    "paragraphs": [
     "Open Player builds. Character lookup shows the selected game character’s available current setup; use the correct region, server and name.",
     "The author tab lists a site author’s public posts. Game character names and site author names can differ; a matching name does not prove they are the same person."
    ],
    "links": [
     {
      "route": "/people",
      "label": "Find a character or author"
     }
    ]
   },
   {
    "heading": "Your copy and the original post",
    "paragraphs": [
     "Applying changes your planner for that class. Editing your copy does not edit the original post. Check the restore option after applying if you need to undo, and keep important plans as named library saves.",
     "A post link shows its latest published edit. A planner-generated share link captures its creation-time allocation; create a new link after changing the plan."
    ]
   },
   {
    "heading": "Write your own public build",
    "paragraphs": [
     "Sign in and open the public build composer. Add a title, class and description; choose skills, specializations and Daevanion nodes, add equipment recommendations and explain your choices.",
     "Preview before publishing. Only the author can edit their post. Public links work without sign-in, so publish information you want others to read."
    ]
   },
   {
    "heading": "Match your own points",
    "paragraphs": [
     "Compare the required points and level with your character. Lookup may not confirm all remaining points; enter your own game values in the planner.",
     "Equipment notes are author advice. Check the current item, game version and intended content before spending materials."
    ]
   }
  ],
  "related": [
   "aion2-build-planner",
   "aion2-daevanion-guide"
  ]
 },
 "ko": {
  "title": "아이온2 공개 빌드: 찾기·수정·저장·공유 | ASBC",
  "heading": "마음에 드는 빌드를 내 세팅으로.",
  "label": "공개 빌드·사람 찾기",
  "description": "아이온2 글로벌 공개 빌드를 직업·작성자로 찾고 필요한 포인트를 확인하세요. 내 플래너에서 수정·저장하고 링크로 공유할 수 있습니다.",
  "intro": "공유된 세팅의 레벨과 포인트를 확인한 뒤 내 플래너에서 맞춰 보세요. 공개 빌드는 로그인 없이 읽을 수 있습니다.",
  "cta": "공개 빌드 찾기",
  "steps": [
   [
    "시작할 빌드 찾기",
    "공개 빌드에서 직업을 고르고 제목을 검색하세요. 최근 수정순 또는 좋아요 많은 순으로 볼 수 있습니다. 결과가 없으면 필터를 초기화하세요."
   ],
   [
    "필요한 포인트 확인 후 적용",
    "게시물의 레벨, 스킬·스티그마 비용, 데바니온과 장비 안내를 확인하세요. 현재 계획을 보존하려면 먼저 저장한 뒤 내 플래너에 적용을 누르세요."
   ],
   [
    "내 세팅으로 수정·저장·공유",
    "플래너에서 스킬·특화·노드를 바꾸고 보관함에 이름을 붙여 저장하세요. 배분의 공유 링크를 만들거나 로그인 후 설명을 담은 공개 빌드를 작성할 수 있습니다."
   ]
  ],
  "sections": [
   {
    "heading": "특정 사람의 빌드 찾기",
    "paragraphs": [
     "사람별 빌드의 캐릭터 세팅 조회에서 지역·서버·이름을 확인하면 해당 캐릭터의 조회 가능한 현재 세팅을 볼 수 있습니다.",
     "작성자 탭에서는 사이트 작성자가 공개한 글을 모아 봅니다. 게임 캐릭터와 사이트 작성자의 이름은 다를 수 있으며 같은 이름만으로 동일인이라고 판단하지 않습니다."
    ],
    "links": [
     {
      "route": "/people",
      "label": "캐릭터·작성자 찾기"
     }
    ]
   },
   {
    "heading": "내가 수정하면 원본도 바뀌나요?",
    "paragraphs": [
     "공유 빌드를 적용하면 해당 직업의 내 플래너가 바뀝니다. 내 사본을 수정해도 작성자의 게시물은 바뀌지 않습니다. 적용 후 되돌리기를 확인하고 중요한 계획은 보관함에 이름을 붙여 저장하세요.",
     "게시물 링크는 최신 공개 내용을 보여줍니다. 플래너에서 생성한 공유 링크는 생성 당시의 배분이므로 변경 후에는 새 링크를 만드세요."
    ]
   },
   {
    "heading": "내 공개 빌드 작성하기",
    "paragraphs": [
     "로그인 후 빌드 글쓰기에서 제목·직업·설명을 입력하세요. 스킬·특화·데바니온을 직접 선택하고 장비 추천과 선택 이유도 적을 수 있습니다.",
     "미리보기로 확인한 뒤 게시하세요. 본인 글만 수정할 수 있습니다. 공개 빌드는 비로그인으로도 읽을 수 있으므로 다른 사람에게 보여줄 내용만 작성하세요."
    ]
   },
   {
    "heading": "내 포인트에 맞춰 확인하세요",
    "paragraphs": [
     "필요한 포인트와 레벨을 내 캐릭터와 비교하세요. 조회만으로 모든 남은 포인트가 확인되지는 않으니 게임에서 확인한 수치를 입력하세요.",
     "장비 안내는 작성자의 추천입니다. 재료를 쓰기 전에 아이템·버전·플레이 목적을 확인하세요."
    ]
   }
  ],
  "related": [
   "aion2-build-planner",
   "aion2-daevanion-guide"
  ]
 }
});
