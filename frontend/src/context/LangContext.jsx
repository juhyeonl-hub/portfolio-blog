import { createContext, useContext, useState } from 'react';

const LangContext = createContext(null);

const translations = {
  en: {
    // Home
    title1: "JuHyeon's",
    title2: "Adventure",

    // Menu
    showcase: "SHOWCASE",
    profile: "PROFILE",
    journal: "JOURNAL",

    // Page titles
    showcaseTitle: "Showcase",
    profileTitle: "Profile",
    journalTitle: "Journal",
    guestbookTitle: "Guestbook",

    // Navigation
    backToMenu: "← Back to Menu",
    backToShowcase: "← Back to Showcase",
    backToJournal: "← Back to Journal",

    // Profile
    location: "Vantaa, Finland",
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    printPdf: "Print / Download PDF",

    // Profile - summary
    summary: "Java backend developer with approximately two years of professional experience building and maintaining enterprise systems in Korea's financial sector using Java and Spring Boot. Currently attending Hive Helsinki to deepen computer science fundamentals in C and C++, including hands-on work in concurrency, memory management, and systems design. Comfortable working across the stack, and consistent in one thing across every role: when something is unclear, I find the answer myself and see the work through to completion.",

    // Showcase
    clone: "Clone",
    copied: "Copied!",
    copy: "Copy",
    liveDemoBtn: "Live Demo",
    loading: "Loading...",

    // Journal
    searchPosts: "Search posts...",
    search: "Search",
    noPostsFound: "No posts found.",
    tag: "Tag",
    clear: "Clear",
    prev: "Prev",
    next: "Next",

    // Guestbook
    nickname: "Nickname",
    leaveMessage: "Leave a message...",
    post: "Post",
    noMessages: "No messages yet. Be the first!",

    // Admin
    admin: "Admin",
    logout: "Logout",
  },

  ko: {
    title1: "주현의",
    title2: "모험",

    showcase: "쇼케이스",
    profile: "프로필",
    journal: "저널",

    showcaseTitle: "쇼케이스",
    profileTitle: "프로필",
    journalTitle: "저널",
    guestbookTitle: "방명록",

    backToMenu: "← 메뉴로",
    backToShowcase: "← 쇼케이스로",
    backToJournal: "← 저널로",

    location: "반타, 핀란드",
    experience: "경력",
    education: "학력",
    skills: "기술 스택",
    languages: "언어",
    printPdf: "인쇄 / PDF 다운로드",

    summary: "한국 금융권에서 약 2년간 Java와 Spring Boot를 사용하여 엔터프라이즈 시스템을 구축 및 유지보수한 경험이 있는 백엔드 개발자입니다. 현재 Hive Helsinki에서 C와 C++를 통해 동시성, 메모리 관리, 시스템 설계 등 컴퓨터 과학 기초를 심화 학습 중입니다. 풀스택 작업에도 익숙하며, 어떤 역할에서든 일관된 것이 하나 있습니다: 불분명한 부분이 있으면 스스로 답을 찾고, 끝까지 완수합니다.",

    clone: "클론",
    copied: "복사됨!",
    copy: "복사",
    liveDemoBtn: "라이브 데모",
    loading: "로딩 중...",

    searchPosts: "포스트 검색...",
    search: "검색",
    noPostsFound: "포스트가 없습니다.",
    tag: "태그",
    clear: "초기화",
    prev: "이전",
    next: "다음",

    nickname: "닉네임",
    leaveMessage: "메시지를 남겨주세요...",
    post: "작성",
    noMessages: "아직 메시지가 없습니다. 첫 번째로 남겨보세요!",

    admin: "관리자",
    logout: "로그아웃",
  },

  ja: {
    title1: "ジュヒョンの",
    title2: "アドベンチャー",

    showcase: "ショーケース",
    profile: "プロフィール",
    journal: "ジャーナル",

    showcaseTitle: "ショーケース",
    profileTitle: "プロフィール",
    journalTitle: "ジャーナル",
    guestbookTitle: "ゲストブック",

    backToMenu: "← メニューへ",
    backToShowcase: "← ショーケースへ",
    backToJournal: "← ジャーナルへ",

    location: "ヴァンター、フィンランド",
    experience: "職歴",
    education: "学歴",
    skills: "技術スタック",
    languages: "言語",
    printPdf: "印刷 / PDFダウンロード",

    summary: "韓国の金融業界で約2年間、JavaとSpring Bootを使用してエンタープライズシステムの構築・保守を行ったバックエンド開発者です。現在はHive Helsinkiで、CとC++を通じて並行処理、メモリ管理、システム設計などのコンピュータサイエンスの基礎を深めています。フルスタック開発にも対応でき、どの役割でも一貫していること：不明な点があれば自ら答えを見つけ、最後まで完遂します。",

    clone: "クローン",
    copied: "コピー済み！",
    copy: "コピー",
    liveDemoBtn: "ライブデモ",
    loading: "読み込み中...",

    searchPosts: "投稿を検索...",
    search: "検索",
    noPostsFound: "投稿が見つかりません。",
    tag: "タグ",
    clear: "クリア",
    prev: "前へ",
    next: "次へ",

    nickname: "ニックネーム",
    leaveMessage: "メッセージを残す...",
    post: "投稿",
    noMessages: "まだメッセージがありません。最初のメッセージを残しましょう！",

    admin: "管理者",
    logout: "ログアウト",
  },
};

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lang') || 'en';
  });

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const t = (key) => translations[lang]?.[key] || translations['en'][key] || key;

  return (
    <LangContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) throw new Error('useLang must be used within LangProvider');
  return context;
}
