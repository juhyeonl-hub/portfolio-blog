package com.portfolio.blog.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Offensive-language check for user-written build titles, descriptions and comments.
 *
 * Shares UsernamePolicy's offensive, extremist and political full-name lists, applied per word so that
 * ordinary words are not caught across word boundaries ("this hit" is not "shit"). Impersonation words
 * (admin, official, support…) are not used here because they are normal in posts. Political names are
 * matched as whole words or full names across up to three adjacent words ("kim jong un"), never inside
 * another word ("computing") or as a bare surname/common word ("trump card", Korean 트럼프 = playing cards).
 *
 * Native-script terms (Korean, Japanese, Finnish) are matched in the raw text; a few innocent compounds
 * that contain them are removed first (시발점, 시발역). Mild Finnish exclamations (perkele, saatana) are
 * deliberately not blocked. Only new or edited content is checked; existing posts are untouched.
 */
public final class ContentPolicy {
    private ContentPolicy() {}

    private static final Pattern WORD = Pattern.compile("[\\p{L}\\p{N}]+");

    /** Native-script offensive terms, matched anywhere in the lowercased text. */
    private static final List<String> NATIVE = List.of(
            // Korean profanity, slurs and hate-community terms
            "씨발", "씨빨", "씨팔", "ㅅㅂ", "ㅆㅂ", "시발", "병신", "ㅂㅅ", "개새끼", "개새기", "개색기", "좆", "지랄", "느금마",
            "일베충", "한남충", "김치녀", "된장녀", "틀딱", "짱깨", "쪽바리", "쪽발이", "흑형",
            // Korean political figures (full names)
            "김정은", "김정일", "김일성", "시진핑", "푸틴", "도널드 트럼프", "도널드트럼프", "바이든", "히틀러", "윤석열", "이재명", "문재인", "박근혜", "이명박", "한동훈", "김건희",
            // Japanese profanity and slurs; political figures
            "死ね", "氏ね", "キチガイ", "きちがい", "ガイジ", "チョン公", "支那人", "安倍晋三", "岸田文雄", "高市早苗", "習近平", "金正恩", "ヒトラー",
            // Finnish profanity and slurs (mild exclamations such as perkele/saatana are allowed)
            "vittu", "huora", "neekeri", "mulkku", "kusipää", "homppeli");

    /** Innocent words containing a native term; removed before matching. */
    private static final List<String> NATIVE_EXCEPTIONS = List.of("시발점", "시발역", "시발택시");

    /** True when the text contains offensive, extremist or political terms. Null/blank text is allowed. */
    public static boolean blocked(String text) {
        if (text == null || text.isBlank()) return false;
        String lower = text.toLowerCase(Locale.ROOT);
        String native_ = lower;
        for (String exception : NATIVE_EXCEPTIONS) native_ = native_.replace(exception, "");
        for (String term : NATIVE) if (native_.contains(term)) return true;

        List<String> words = new ArrayList<>();
        var m = WORD.matcher(lower);
        while (m.find()) {
            // Short words with a number attached ("nazi88", "dick99"): check the digit-separated parts too.
            for (String part : m.group().split("[0-9]+")) if (UsernamePolicy.OFFENSIVE_TOKENS.contains(part)) return true;
            words.add(UsernamePolicy.normalise(m.group()));
        }
        for (int i = 0; i < words.size(); i++) {
            String w = words.get(i);
            if (UsernamePolicy.OFFENSIVE_TOKENS.contains(w)) return true;
            for (String bad : UsernamePolicy.OFFENSIVE) if (w.contains(bad)) return true;
            // Political full names, alone or split across up to three adjacent words.
            StringBuilder window = new StringBuilder();
            for (int j = i; j < Math.min(words.size(), i + 3); j++) {
                window.append(words.get(j));
                String joined = window.toString();
                for (String name : UsernamePolicy.POLITICAL) if (joined.equals(name)) return true;
            }
        }
        return false;
    }
}
