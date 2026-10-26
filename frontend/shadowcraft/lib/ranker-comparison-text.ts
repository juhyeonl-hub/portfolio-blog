// Scoped copy keeps unrelated pending global translations out of this release.
const messages = {
 reference: ['스킬 설명과 가능한 특화 · 랭커가 고른 특화는 미확인', 'Skill reference and possible specializations · the ranker’s choices are unknown', 'スキル説明と選択可能な特化・ランカーの特化選択は未確認', 'Taidon kuvaus ja mahdolliset erikoistumiset · vertailuhahmon valinnat eivät ole tiedossa'],
 boardPrep: ['먼저 랭커 실제 배치를 확인하세요. 내 총 포인트를 입력하고 ‘내 포인트로 따라가기’를 선택하면 예산 안의 경로를 볼 수 있습니다.', 'Read the ranker’s actual nodes first. Enter your total points and choose Guide for my points to see a path within your budget.', 'まずランカーの実際の配置を確認します。総ポイントを入力し、自分のポイントで参考にするを選ぶと予算内の経路を確認できます。', 'Katso ensin vertailuhahmon todelliset solmut. Syötä kokonaispisteesi ja valitse Ohje omille pisteille nähdäksesi budjettiisi sopivan reitin.'],
 zoom: ['보드 확대', 'Enlarge board', 'ボードを拡大', 'Suurenna lautaa'],
 fit: ['전체 배치 보기', 'Fit full board', '配置全体を表示', 'Näytä koko lauta'],
 pan: ['확대한 보드는 좌우로 밀어서 볼 수 있습니다.', 'Swipe sideways to explore the enlarged board.', '拡大したボードは左右にスワイプできます。', 'Selaa suurennettua lautaa pyyhkäisemällä sivusuunnassa.'],
 tabs: ['비교할 항목', 'Compare setup', '比較する項目', 'Vertaa kokoonpanoa'],
 clickGear: ['장비를 누르면 두 장비의 실제 옵션이 팝업으로 열립니다.', 'Select an item to open both items’ actual options.', '装備を押すと、両方の実際のオプションが開きます。', 'Valitse varuste nähdäksesi molempien todelliset ominaisuudet.'],
 gearDialog: ['장비 옵션 비교', 'Compare item options', '装備オプション比較', 'Vertaa varusteiden ominaisuuksia'],
 advice: ['내 장비 성장 안내 열기', 'Show guidance for my item', '自分の装備の成長ガイドを表示', 'Näytä oman varusteen ohjeet'],
 raw: ['랭커 실제 배치', 'Ranker’s actual nodes', 'ランカーの実際の配置', 'Vertailuhahmon todelliset solmut'],
 guide: ['내 포인트로 따라가기', 'Guide for my points', '自分のポイントで参考にする', 'Ohje omille pisteille'],
 rawHelp: ['초록 체크가 랭커가 찍은 노드입니다. 보드와 노드를 눌러 배치·이름·비용을 확인하세요.', 'Green checks show the ranker’s selected nodes. Choose a board and select a node for its name and cost.', '緑のチェックがランカーの選択済みノードです。ボードとノードを押すと名前とコストを確認できます。', 'Vihreä merkki näyttää vertailuhahmon valitseman solmun. Valitse lauta ja solmu nähdäksesi nimen ja hinnan.'],
 selected: ['랭커가 찍은 노드', 'Selected by ranker', 'ランカーが選択済み', 'Vertailuhahmon valitsema'],
 unselected: ['랭커가 찍지 않은 노드', 'Not selected by ranker', 'ランカーが未選択', 'Vertailuhahmo ei ole valinnut'],
 automatic: ['자동 개방 노드', 'Automatically unlocked', '自動開放ノード', 'Automaattisesti avattu'],
 skills: ['스킬 배치 한눈에 보기', 'Skills at a glance', 'スキル配置を一覧で確認', 'Taidot yhdellä silmäyksellä'],
 skillHelp: ['게임 순서로 보여줍니다. 양쪽 숫자는 장비·데바니온이 포함된 최종 레벨이며, 차이만큼 포인트를 투자하라는 뜻은 아닙니다. 기본 투자·특화는 조회되지 않습니다.', 'Shown in game order. Both values are final levels including gear and Daevanion. A level gap is not a point-spending instruction. Base investment and chosen specializations are unavailable.', 'ゲーム内の順序で表示します。数値は装備・デバニオン込みの最終レベルです。差の分だけポイントを振る指示ではありません。基礎投資・特化選択は確認できません。', 'Pelin mukainen järjestys. Arvot ovat lopullisia tasoja varusteet ja Daevanion mukaan lukien. Tasoero ei ole ohje pisteiden käyttöön. Perussijoitusta ja valittuja erikoistumisia ei tiedetä.'],
 mine: ['내 캐릭터', 'My character', '自分のキャラクター', 'Oma hahmo'],
 ranker: ['랭커', 'Ranker', 'ランカー', 'Vertailuhahmo'],
 unknown: ['미확인', 'Unknown', '未確認', 'Ei tiedossa'],
 difference: ['최종 레벨 차이', 'Final level difference', '最終レベル差', 'Lopullinen tasoero'],
 noSkills: ['조회되지 않은 스킬은 미습득·미장착으로 판단하지 않습니다.', 'Missing skills do not mean unlearned or unequipped.', '未取得の情報を未習得・未装着とは判断しません。', 'Puuttuva tieto ei tarkoita oppimatonta tai pois käytöstä olevaa taitoa.'],
 boardMissing: ['공식 데바니온 배치를 확인한 뒤 표시합니다. 조회 상태와 오류를 확인하세요.', 'The board appears after its official allocation is verified. Check the lookup status or error.', '公式配置の確認後に表示します。照会状態やエラーを確認してください。', 'Lauta näkyy, kun virallinen solmujako on varmistettu. Tarkista haun tila tai virhe.'],
 planReview: ['내 계획에 적용하기 전 확인', 'Review before changing my plan', '自分の計画への適用前に確認', 'Tarkista ennen oman suunnitelman muuttamista'],
} as const;
export function rankerText(locale: string, key: keyof typeof messages): string {
 return messages[key][locale === 'ko' ? 0 : locale === 'ja' ? 2 : locale === 'fi' ? 3 : 1];
}
