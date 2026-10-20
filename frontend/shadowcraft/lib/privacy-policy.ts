/**
 * ASBC privacy policy, written per language (legal text, not run through the UI dictionary).
 * Every statement must match what the site actually does; update the date and all four languages together.
 */
import type {Locale} from '../app/locale';

export const PRIVACY_CONTACT = 'contact@asbc.app';
export const PRIVACY_UPDATED = '2026-10-20';

type Policy = {title: string; updated: string; sections: {heading: string; paragraphs: string[]}[]};

export const PRIVACY: Record<Locale, Policy> = {
  ko: {
    title: '개인정보 처리방침',
    updated: '시행일',
    sections: [
      {heading: '운영자', paragraphs: [
        'ASBC(asbc.app)는 Juhyeon Lee가 개인 프로젝트 브랜드 "추억 게임즈"로 운영하는 비공식 팬 도구입니다. 엔씨소프트와는 관계가 없습니다.',
        `개인정보에 관한 문의와 요청: ${PRIVACY_CONTACT}`,
      ]},
      {heading: '이 브라우저에만 저장되는 정보', paragraphs: [
        '빌드 계획, 빌드 보관함, 장비, 지도 기록, 언어와 서버·타이머 설정은 이 브라우저의 저장소(localStorage)에만 저장되며 서버로 보내지 않습니다. 브라우저의 사이트 데이터를 지우면 함께 지워집니다.',
        '커뮤니티 로그인 상태는 이 탭의 세션 저장소(sessionStorage)에 저장되며 탭을 닫으면 지워집니다.',
      ]},
      {heading: '커뮤니티를 이용할 때 서버에 저장하는 정보', paragraphs: [
        '계정: 아이디, 비밀번호(되돌릴 수 없는 bcrypt 해시로만 저장), 가입 시각.',
        'Steam으로 로그인한 경우: SteamID와 연결 시각. Steam 비밀번호, 이메일, 보유 게임 목록은 받지 않습니다.',
        '로그인 세션: 최대 24시간 유지되는 세션 정보.',
        '직접 올린 내용: 공개한 빌드(제목, 설명, 배분), 댓글, 추천, 신고(사유와 설명).',
      ]},
      {heading: '자동으로 처리되는 정보', paragraphs: [
        'IP 주소: 로그인 시도 횟수 제한을 위해 서버 메모리에서 10분 동안 사용하고 늦어도 11분 안에 지우며 데이터베이스나 로그에 저장하지 않습니다.',
        '캐릭터 조회: 입력한 서버와 캐릭터 이름으로 아이온2 공식 사이트의 공개 정보를 조회합니다. 조회 결과는 서버 메모리에 최대 5분 동안 임시로 보관합니다.',
      ]},
      {heading: '쿠키', paragraphs: [
        'asbc_steam: Steam 로그인 중 요청이 같은 브라우저에서 왔는지 확인하는 보안 쿠키입니다. 로그인 과정에서만 쓰이며 5분 뒤 만료됩니다.',
        '광고, 분석, 추적용 쿠키는 사용하지 않습니다.',
      ]},
      {heading: '처리 목적과 근거', paragraphs: [
        '계정과 커뮤니티 기능 제공: 이용자가 요청한 서비스 제공(GDPR 제6조 1항 b).',
        '보안, 남용 방지, 신고 처리: 서비스와 이용자를 보호하기 위한 정당한 이익(GDPR 제6조 1항 f).',
        '개인정보를 판매하거나 광고 목적으로 제공하지 않습니다.',
      ]},
      {heading: '정보를 처리하는 다른 회사', paragraphs: [
        'Cloudflare: 사이트 호스팅과 전송, contact@asbc.app 메일 전달. 요청을 전달하는 과정에서 IP 주소 등 접속 정보를 처리합니다.',
        'Valve(Steam): Steam 로그인을 선택한 경우 Steam에서 로그인합니다.',
        'Vercel: 이전 주소(juhyeonl.dev/lab/shadowcraft)의 호스팅.',
        '서버와 데이터베이스는 핀란드에 있습니다. Cloudflare, Valve, Vercel은 미국 기업으로, 이들을 통한 처리에는 미국으로의 전송이 포함될 수 있습니다.',
      ]},
      {heading: '보관 기간', paragraphs: [
        '계정과 올린 내용은 직접 삭제하거나 탈퇴할 때까지 보관합니다. 계정을 삭제하면 그 계정의 Steam 연결, 세션, 빌드, 댓글, 추천, 신고가 함께 삭제됩니다.',
        '장애 복구용 데이터베이스 백업은 매일 만들고 30일 동안 보관한 뒤 자동으로 지웁니다. 삭제한 정보는 그동안 백업에만 남아 있다가 함께 지워집니다.',
      ]},
      {heading: '이용자의 권리', paragraphs: [
        '내 계정 화면의 "회원 탈퇴"에서 계정과 올린 내용을 바로 삭제할 수 있습니다.',
        `자신의 정보에 대한 열람, 정정, 삭제, 처리 제한, 이의 제기, 이전을 요청할 수 있습니다. ${PRIVACY_CONTACT}로 아이디와 요청 내용을 보내 주세요. 본인 확인을 위해 추가 확인을 요청할 수 있습니다.`,
        '처리에 불만이 있으면 거주 국가의 개인정보 감독기관이나 핀란드 데이터보호 감독기관(Tietosuojavaltuutetun toimisto, tietosuoja.fi)에 신고할 수 있습니다.',
      ]},
      {heading: '변경', paragraphs: [
        '광고 도입 등 처리 내용이 바뀌면 바뀌기 전에 이 페이지를 고치고 시행일을 바꿉니다.',
      ]},
    ],
  },
  en: {
    title: 'Privacy policy',
    updated: 'Effective',
    sections: [
      {heading: 'Who runs ASBC', paragraphs: [
        'ASBC (asbc.app) is an unofficial fan tool run by Juhyeon Lee under the personal project brand "추억 게임즈" (Memory Games). It is not affiliated with NCSOFT.',
        `Privacy questions and requests: ${PRIVACY_CONTACT}`,
      ]},
      {heading: 'Data stored only in your browser', paragraphs: [
        'Build plans, the build library, gear, map progress, language and server/timer settings are stored only in this browser (localStorage) and are not sent to the server. Clearing the site data in your browser removes them.',
        'Your community sign-in is kept in this tab\'s session storage (sessionStorage) and is removed when the tab is closed.',
      ]},
      {heading: 'Data stored on the server when you use the community', paragraphs: [
        'Account: username, password (stored only as an irreversible bcrypt hash), sign-up time.',
        'If you sign in with Steam: your SteamID and the time it was linked. We do not receive your Steam password, email address or game library.',
        'Sign-in sessions: session records that last at most 24 hours.',
        'What you post: published builds (title, description, allocation), comments, votes and reports (reason and description).',
      ]},
      {heading: 'Data processed automatically', paragraphs: [
        'IP address: used only in server memory to limit sign-in attempts and removed within 11 minutes at most; it is not stored in the database or in logs.',
        'Character lookup: the server and character name you enter are used to look up public information on the official AION 2 website. Results are kept in server memory for up to 5 minutes.',
      ]},
      {heading: 'Cookies', paragraphs: [
        'asbc_steam: a security cookie that checks that a Steam sign-in finishes in the same browser that started it. It is used only during sign-in and expires after 5 minutes.',
        'We do not use advertising, analytics or tracking cookies.',
      ]},
      {heading: 'Purposes and legal bases', paragraphs: [
        'Providing accounts and community features you ask for (GDPR Art. 6(1)(b)).',
        'Security, abuse prevention and handling reports, as a legitimate interest in protecting the service and its users (GDPR Art. 6(1)(f)).',
        'We do not sell personal data or share it for advertising.',
      ]},
      {heading: 'Companies that process data for ASBC', paragraphs: [
        'Cloudflare: hosting and delivery of the site, and forwarding of mail to contact@asbc.app. It processes connection data such as IP addresses while passing requests on.',
        'Valve (Steam): if you choose Steam sign-in, you sign in on Steam.',
        'Vercel: hosting of the previous address (juhyeonl.dev/lab/shadowcraft).',
        'The server and database are in Finland. Cloudflare, Valve and Vercel are US companies, so processing through them may involve transfers to the United States.',
      ]},
      {heading: 'How long data is kept', paragraphs: [
        'Your account and posts are kept until you delete them or delete your account. Deleting an account also deletes its Steam link, sessions, builds, comments, votes and reports.',
        'Database backups for recovery are made daily, kept for 30 days and then deleted automatically. Deleted data remains only in those backups until they are deleted.',
      ]},
      {heading: 'Your rights', paragraphs: [
        'You can delete your account and everything you posted at any time under "Delete account" on the account screen.',
        `You can ask for access to, correction, deletion, restriction of processing and portability of your data, and object to processing. Send your username and request to ${PRIVACY_CONTACT}. We may ask for further confirmation that the account is yours.`,
        'You can complain to the data protection authority of your country or to the Finnish Data Protection Ombudsman (Tietosuojavaltuutetun toimisto, tietosuoja.fi).',
      ]},
      {heading: 'Changes', paragraphs: [
        'If processing changes, for example if advertising is added, this page and its effective date will be updated before the change.',
      ]},
    ],
  },
  ja: {
    title: 'プライバシーポリシー',
    updated: '施行日',
    sections: [
      {heading: '運営者', paragraphs: [
        'ASBC(asbc.app)は、Juhyeon Leeが個人プロジェクトブランド「추억 게임즈」として運営する非公式ファンツールです。NCSOFTとは関係ありません。',
        `個人情報に関するお問い合わせ・ご依頼: ${PRIVACY_CONTACT}`,
      ]},
      {heading: 'このブラウザにのみ保存される情報', paragraphs: [
        'ビルド計画、ビルド保管庫、装備、マップ記録、言語、サーバー・タイマー設定は、このブラウザのストレージ(localStorage)にのみ保存され、サーバーには送信されません。ブラウザのサイトデータを削除すると一緒に消えます。',
        'コミュニティのログイン状態は、このタブのセッションストレージ(sessionStorage)に保存され、タブを閉じると消えます。',
      ]},
      {heading: 'コミュニティ利用時にサーバーに保存する情報', paragraphs: [
        'アカウント: ID、パスワード(元に戻せないbcryptハッシュとしてのみ保存)、登録日時。',
        'Steamでログインした場合: SteamIDと連携日時。Steamのパスワード、メールアドレス、所有ゲーム一覧は受け取りません。',
        'ログインセッション: 最長24時間有効なセッション情報。',
        '投稿した内容: 公開したビルド(タイトル、説明、配分)、コメント、推薦、通報(理由と説明)。',
      ]},
      {heading: '自動的に処理される情報', paragraphs: [
        'IPアドレス: ログイン試行回数の制限のため、サーバーのメモリ上で10分間使用し、遅くとも11分以内に削除します。また、データベースやログには保存しません。',
        'キャラクター照会: 入力したサーバーとキャラクター名で、アイオン2公式サイトの公開情報を照会します。照会結果はサーバーのメモリに最長5分間一時保存します。',
      ]},
      {heading: 'Cookie', paragraphs: [
        'asbc_steam: Steamログイン中のリクエストが同じブラウザから来たことを確認するセキュリティCookieです。ログイン処理中のみ使用し、5分で失効します。',
        '広告、分析、トラッキング用のCookieは使用しません。',
      ]},
      {heading: '処理の目的と根拠', paragraphs: [
        'アカウントとコミュニティ機能の提供: 利用者が求めるサービスの提供(GDPR第6条1項b)。',
        'セキュリティ、不正利用の防止、通報対応: サービスと利用者を守るための正当な利益(GDPR第6条1項f)。',
        '個人情報を販売したり、広告目的で提供したりしません。',
      ]},
      {heading: '情報を処理する他の企業', paragraphs: [
        'Cloudflare: サイトのホスティングと配信、contact@asbc.appのメール転送。リクエストを中継する過程でIPアドレスなどの接続情報を処理します。',
        'Valve(Steam): Steamログインを選んだ場合、Steam上でログインします。',
        'Vercel: 旧アドレス(juhyeonl.dev/lab/shadowcraft)のホスティング。',
        'サーバーとデータベースはフィンランドにあります。Cloudflare、Valve、Vercelは米国企業のため、これらを通じた処理には米国への移転が含まれる場合があります。',
      ]},
      {heading: '保存期間', paragraphs: [
        'アカウントと投稿内容は、ご自身で削除するか退会するまで保存します。アカウントを削除すると、そのアカウントのSteam連携、セッション、ビルド、コメント、推薦、通報も一緒に削除されます。',
        '障害復旧用のデータベースバックアップは毎日作成し、30日間保存した後に自動で削除します。削除した情報はその間バックアップにのみ残り、バックアップと一緒に削除されます。',
      ]},
      {heading: '利用者の権利', paragraphs: [
        'アカウント画面の「退会」から、アカウントと投稿内容をいつでも削除できます。',
        `ご自身の情報の閲覧、訂正、削除、処理の制限、異議申し立て、データポータビリティを請求できます。${PRIVACY_CONTACT}までIDとご依頼内容をお送りください。ご本人確認のため追加の確認をお願いする場合があります。`,
        '処理に不満がある場合は、お住まいの国のデータ保護監督機関、またはフィンランドのデータ保護監督機関(Tietosuojavaltuutetun toimisto、tietosuoja.fi)に申し立てることができます。',
      ]},
      {heading: '変更', paragraphs: [
        '広告の導入など処理内容が変わる場合は、変更前に本ページと施行日を更新します。',
      ]},
    ],
  },
  fi: {
    title: 'Tietosuojaseloste',
    updated: 'Voimassa alkaen',
    sections: [
      {heading: 'Rekisterinpitäjä', paragraphs: [
        'ASBC (asbc.app) on epävirallinen fanityökalu, jota Juhyeon Lee ylläpitää henkilökohtaisen projektibrändin "추억 게임즈" nimellä. Sillä ei ole yhteyttä NCSOFTiin.',
        `Tietosuojaa koskevat kysymykset ja pyynnöt: ${PRIVACY_CONTACT}`,
      ]},
      {heading: 'Vain selaimeesi tallennettavat tiedot', paragraphs: [
        'Rakennesuunnitelmat, rakennekirjasto, varusteet, karttaedistyminen sekä kieli- ja palvelin-/ajastinasetukset tallennetaan vain tähän selaimeen (localStorage), eikä niitä lähetetä palvelimelle. Ne poistuvat, kun poistat sivuston tiedot selaimesta.',
        'Yhteisöön kirjautuminen säilyy tämän välilehden istuntomuistissa (sessionStorage) ja poistuu, kun välilehti suljetaan.',
      ]},
      {heading: 'Palvelimelle tallennettavat tiedot yhteisöä käytettäessä', paragraphs: [
        'Tili: käyttäjätunnus, salasana (tallennetaan vain palautumattomana bcrypt-tiivisteenä), rekisteröitymisaika.',
        'Jos kirjaudut Steamilla: SteamID ja yhdistämisaika. Emme saa Steam-salasanaasi, sähköpostiosoitettasi tai pelikirjastoasi.',
        'Kirjautumisistunnot: istuntotiedot, jotka ovat voimassa enintään 24 tuntia.',
        'Julkaisemasi sisältö: julkaistut rakenteet (otsikko, kuvaus, jako), kommentit, äänet ja ilmoitukset (syy ja kuvaus).',
      ]},
      {heading: 'Automaattisesti käsiteltävät tiedot', paragraphs: [
        'IP-osoite: käytetään vain palvelimen muistissa kirjautumisyritysten rajoittamiseen ja poistetaan viimeistään 11 minuutin kuluttua; sitä ei tallenneta tietokantaan eikä lokeihin.',
        'Hahmohaku: syöttämäsi palvelin ja hahmon nimi käytetään julkisten tietojen hakemiseen AION 2:n virallisesta verkkopalvelusta. Tulokset säilytetään palvelimen muistissa enintään 5 minuuttia.',
      ]},
      {heading: 'Evästeet', paragraphs: [
        'asbc_steam: turvaeväste, jolla varmistetaan, että Steam-kirjautuminen päättyy samassa selaimessa, jossa se aloitettiin. Sitä käytetään vain kirjautumisen aikana, ja se vanhenee 5 minuutissa.',
        'Emme käytä mainos-, analytiikka- tai seurantaevästeitä.',
      ]},
      {heading: 'Käsittelyn tarkoitukset ja perusteet', paragraphs: [
        'Pyytämiesi tilien ja yhteisötoimintojen tarjoaminen (GDPR 6 artiklan 1 kohdan b alakohta).',
        'Tietoturva, väärinkäytösten estäminen ja ilmoitusten käsittely oikeutettuna etuna palvelun ja käyttäjien suojaamiseksi (GDPR 6 artiklan 1 kohdan f alakohta).',
        'Emme myy henkilötietoja emmekä luovuta niitä mainontaan.',
      ]},
      {heading: 'Tietoja käsittelevät muut yritykset', paragraphs: [
        'Cloudflare: sivuston ylläpito ja välitys sekä contact@asbc.app-osoitteen sähköpostin edelleenlähetys. Se käsittelee yhteystietoja, kuten IP-osoitteita, välittäessään pyyntöjä.',
        'Valve (Steam): jos valitset Steam-kirjautumisen, kirjaudut Steamissa.',
        'Vercel: aiemman osoitteen (juhyeonl.dev/lab/shadowcraft) ylläpito.',
        'Palvelin ja tietokanta sijaitsevat Suomessa. Cloudflare, Valve ja Vercel ovat yhdysvaltalaisia yrityksiä, joten niiden kautta tapahtuvaan käsittelyyn voi sisältyä siirtoja Yhdysvaltoihin.',
      ]},
      {heading: 'Säilytysajat', paragraphs: [
        'Tilisi ja julkaisusi säilytetään, kunnes poistat ne tai poistat tilisi. Tilin poistaminen poistaa myös sen Steam-yhteyden, istunnot, rakenteet, kommentit, äänet ja ilmoitukset.',
        'Tietokannasta otetaan palautusta varten varmuuskopio päivittäin, ja varmuuskopiot poistetaan automaattisesti 30 päivän kuluttua. Poistetut tiedot säilyvät siihen asti vain varmuuskopioissa.',
      ]},
      {heading: 'Oikeutesi', paragraphs: [
        'Voit poistaa tilisi ja kaiken julkaisemasi milloin tahansa tilinäkymän kohdasta "Poista tili".',
        `Voit pyytää pääsyä tietoihisi, niiden oikaisemista, poistamista, käsittelyn rajoittamista ja siirtämistä sekä vastustaa käsittelyä. Lähetä käyttäjätunnuksesi ja pyyntösi osoitteeseen ${PRIVACY_CONTACT}. Voimme pyytää lisävahvistusta siitä, että tili on sinun.`,
        'Voit tehdä valituksen oman maasi tietosuojaviranomaiselle tai tietosuojavaltuutetun toimistolle (tietosuoja.fi).',
      ]},
      {heading: 'Muutokset', paragraphs: [
        'Jos käsittely muuttuu, esimerkiksi mainonnan lisäämisen vuoksi, tämä sivu ja sen voimaantulopäivä päivitetään ennen muutosta.',
      ]},
    ],
  },
};
