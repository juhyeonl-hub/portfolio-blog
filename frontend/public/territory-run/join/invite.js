const COPY = {
  "en": {
    "title": "Your next walk. Our next battle.",
    "lead": "Walk or run, claim territory, and play together on the real map.",
    "codeLabel": "YOUR INVITE CODE",
    "copy": "Copy code",
    "copied": "Code copied",
    "copyFailed": "Select and copy the code above.",
    "open": "Open in Bootprint",
    "install": "Get it on Google Play",
    "stepsTitle": "A few steps to your first territory",
    "steps": [
      "Install or update Bootprint on your Android phone.",
      "Sign in, then open this invitation again.",
      "Preview the battle and choose your team. Your next walk counts."
    ],
    "fallback": "App not opening? Update Bootprint, or enter this code in Battles → Join with invite code.",
    "invalid": "This invitation has no valid code. Ask your friend for a new link.",
    "privacy": "Privacy policy",
    "note": "Available on Android. You choose whether to join.",
    "language": "Language"
  },
  "ko": {
    "title": "다음 산책은, 함께 땅따먹기.",
    "lead": "걷고 달리며 실제 지도 위의 영역을 차지하고 친구와 함께 겨뤄보세요.",
    "codeLabel": "내 초대 코드",
    "copy": "코드 복사",
    "copied": "코드를 복사했어요",
    "copyFailed": "위 코드를 선택해서 복사해 주세요.",
    "open": "Bootprint에서 열기",
    "install": "Google Play에서 설치",
    "stepsTitle": "첫 발자국까지 간단하게",
    "steps": [
      "Android 휴대전화에 Bootprint를 설치하거나 업데이트하세요.",
      "로그인한 뒤 이 초대 링크를 다시 열어주세요.",
      "대전을 확인하고 팀을 선택하세요. 다음 산책부터 함께합니다."
    ],
    "fallback": "앱이 열리지 않나요? Bootprint를 업데이트하거나 대전 → 초대 코드 참가에서 코드를 입력하세요.",
    "invalid": "유효한 초대 코드가 없습니다. 친구에게 새 링크를 요청해 주세요.",
    "privacy": "개인정보처리방침",
    "note": "Android에서 이용할 수 있습니다. 참가 여부는 직접 선택합니다.",
    "language": "언어"
  },
  "fi": {
    "title": "Seuraava kävely. Yhteinen taistelu.",
    "lead": "Kävele tai juokse, valtaa alueita ja pelaa yhdessä oikealla kartalla.",
    "codeLabel": "KUTSUKOODISI",
    "copy": "Kopioi koodi",
    "copied": "Koodi kopioitu",
    "copyFailed": "Valitse ja kopioi yllä oleva koodi.",
    "open": "Avaa Bootprintissä",
    "install": "Lataa Google Playsta",
    "stepsTitle": "Muutama askel ensimmäiseen alueeseesi",
    "steps": [
      "Asenna tai päivitä Bootprint Android-puhelimeesi.",
      "Kirjaudu sisään ja avaa tämä kutsu uudelleen.",
      "Tutustu taisteluun ja valitse joukkueesi. Seuraava kävelysi lasketaan mukaan."
    ],
    "fallback": "Eikö sovellus avaudu? Päivitä Bootprint tai syötä koodi kohdassa Taistelut → Liity kutsukoodilla.",
    "invalid": "Kutsussa ei ole kelvollista koodia. Pyydä ystävältäsi uusi linkki.",
    "privacy": "Tietosuojakäytäntö",
    "note": "Saatavilla Androidille. Päätät itse liittymisestä.",
    "language": "Kieli"
  },
  "sv": {
    "title": "Nästa promenad. Vår nästa kamp.",
    "lead": "Gå eller spring, ta territorium och spela tillsammans på den riktiga kartan.",
    "codeLabel": "DIN INBJUDNINGSKOD",
    "copy": "Kopiera kod",
    "copied": "Koden kopierad",
    "copyFailed": "Markera och kopiera koden ovan.",
    "open": "Öppna i Bootprint",
    "install": "Hämta på Google Play",
    "stepsTitle": "Några steg till ditt första territorium",
    "steps": [
      "Installera eller uppdatera Bootprint på din Android-telefon.",
      "Logga in och öppna sedan inbjudan igen.",
      "Se kampen och välj ditt lag. Din nästa promenad räknas."
    ],
    "fallback": "Öppnas inte appen? Uppdatera Bootprint eller ange koden under Kamper → Gå med via inbjudningskod.",
    "invalid": "Inbjudan saknar en giltig kod. Be din vän om en ny länk.",
    "privacy": "Integritetspolicy",
    "note": "Tillgänglig för Android. Du väljer själv om du vill gå med.",
    "language": "Språk"
  }
};
const params = new URLSearchParams(location.search);
// Keep the same code grammar as the app. Never put user input into HTML.
const rawCode = params.get('code') || '';
const code = /^[A-Za-z0-9_-]{4,40}$/.test(rawCode) ? rawCode : null;
const supported = Object.keys(COPY);
const preferred = [params.get('lang'), ...(navigator.languages || [navigator.language])]
  .map(value => (value || '').toLowerCase().split('-')[0]);
let locale = preferred.find(value => supported.includes(value)) || 'en';
const el = id => document.getElementById(id);
function render() {
  const copy = COPY[locale];
  document.documentElement.lang = locale;
  el('language').value = locale;
  for (const key of ['title','lead','codeLabel','copy','open','install','stepsTitle','fallback','invalid','privacy','note']) el(key).textContent = copy[key];
  el('languageLabel').textContent = copy.language;
  copy.steps.forEach((text,index) => { el('step'+index).textContent = text; });
  el('copyStatus').textContent = '';
  el('codeBox').hidden = !code;
  el('invalid').hidden = !!code || !rawCode;
  if (code) {
    el('code').textContent = code;
    el('open').href = 'territoryrun://join?code=' + encodeURIComponent(code);
    el('open').hidden = false;
  }
}
el('language').addEventListener('change', event => { locale = event.target.value; render(); });
el('copy').addEventListener('click', async () => {
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    el('copyStatus').textContent = COPY[locale].copied;
  } catch {
    el('copyStatus').textContent = COPY[locale].copyFailed;
    el('code').focus();
  }
});
render();
