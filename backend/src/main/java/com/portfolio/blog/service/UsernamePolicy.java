package com.portfolio.blog.service;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Usernames that new community accounts may not take: impersonation, profanity, slurs and hate terms,
 * sexual terms, extremism and political figures. Usernames are already limited to [a-z0-9_], so
 * Korean/Japanese terms are listed in their common romanised forms.
 *
 * Matching avoids blocking ordinary game names (e.g. "assassin" contains "ass"):
 *  - CONTAINED: long, unambiguous words blocked anywhere, after normalisation;
 *  - TOKENS: short or ambiguous words blocked only as a whole token (split on "_" and digits)
 *    or as the whole name;
 *  - EXACT: system and brand words blocked only as the entire name;
 *  - normalisation lowercases, maps common digit substitutions (1→i, 0→o, 3→e, 4→a, 5→s, 7→t, 8→b)
 *    and drops "_", so "sh1t" and "f_u_c_k" are caught.
 * Existing accounts are unaffected: only account creation checks this.
 */
public final class UsernamePolicy {
    private UsernamePolicy() {}

    /** Impersonation of the site, staff or publisher (usernames only: these are ordinary words in posts). */
    static final List<String> IMPERSONATION = List.of("admin", "moderator", "official", "support", "ncsoft", "asbc", "juhyeonl");

    /** Long, unambiguous offensive words: matched anywhere inside a (normalised) name or word. */
    static final List<String> OFFENSIVE = List.of(
            // profanity (English)
            "fuck", "shit", "bitch", "bastard", "asshole", "motherf", "wanker", "bollock", "twat",
            // slurs and hate terms
            "nigger", "nigga", "faggot", "retard", "tranny", "kike", "chink", "beaner", "wetback", "raghead",
            // sexual terms
            "pussy", "penis", "vagina", "porn", "hentai", "blowjob", "handjob", "dildo", "orgasm", "pedophil", "paedophil",
            "molest", "incest", "bestiality",
            // extremism, violence and hate groups
            "hitler", "neonazi", "holocaust", "genocide", "terrorist", "whitepower", "siegheil",
            // Korean profanity and hate-community terms (romanised)
            "ssibal", "shibal", "sibal", "ssibbal", "ssipal", "byungsin", "byeongsin", "gaesaekki", "gaesaeki", "gaesekki",
            "jiral", "jotdae", "jotkka", "nigeum", "womad", "megalia",
            // Japanese profanity and slurs (romanised)
            "kichigai", "kisama", "chonko", "chankoro");

    /** Dictators and political figures by full name (current and former heads of state, major candidates). */
    static final List<String> POLITICAL = List.of(
            "stalin", "mussolini", "maozedong", "polpot", "xijinping", "kimjongun", "kimjongil", "kimilsung",
            "putin", "biden", "obama", "netanyahu", "donaldtrump", "erdogantayyip", "recepterdogan",
            "yoonsukyeol", "yoonsukyoul", "leejaemyung", "leejaemyeong", "moonjaein", "parkgeunhye", "leemyungbak",
            "handonghoon", "kimgunhee", "abeshinzo", "shinzoabe", "kishidafumio", "fumiokishida", "sanaetakaichi", "takaichisanae");

    // "putin" is matched as a token only: it occurs inside "computing".
    private static final List<String> CONTAINED = java.util.stream.Stream.of(IMPERSONATION, OFFENSIVE, POLITICAL).flatMap(List::stream).filter(w -> !w.equals("putin")).toList();

    /** System and brand words blocked only as the entire name ("steam_kim" or "shop_owner" stay allowed). */
    private static final Set<String> EXACT = Set.of(
            "root", "system", "steam", "aion", "aion2", "guest", "null", "undefined", "anonymous", "owner", "operator");

    /** Short or ambiguous offensive words: matched only as a whole token/word. */
    static final Set<String> OFFENSIVE_TOKENS = Set.of(
            "ass", "arse", "cunt", "cock", "dick", "dicks", "cum", "sex", "sexy", "anal", "anus", "tits", "boob", "boobs",
            "slut", "whore", "rape", "rapist", "pedo", "fag", "fags", "dyke", "jap", "japs", "gook", "paki", "spic", "coon",
            "kkk", "isis", "nsdap", "sieg", "heil", "nazi", "nazis", "nazism",
            // Korean/Japanese short insults and hate-community names (romanised; "ilbe" occurs in "bilberry")
            "baka", "kuso", "ilbe");

    private static final Set<String> TOKENS = java.util.stream.Stream.concat(OFFENSIVE_TOKENS.stream(), Set.of(
            // staff-looking tokens ("gm_kim", "mod_lee") and username-only ambiguous words
            "mod", "mods", "gm", "staff", "hoe", "jot",
            // political parties and politicians whose names are also ordinary words or common surnames
            "maga", "minjoo", "gukhim", "ccp", "ldp", "trump", "putin").stream()).collect(java.util.stream.Collectors.toUnmodifiableSet());

    static String normalise(String value) {
        StringBuilder out = new StringBuilder();
        for (char c : value.toLowerCase(Locale.ROOT).toCharArray()) {
            switch (c) {
                case '1' -> out.append('i');
                case '0' -> out.append('o');
                case '3' -> out.append('e');
                case '4' -> out.append('a');
                case '5' -> out.append('s');
                case '7' -> out.append('t');
                case '8' -> out.append('b');
                case '_' -> { }
                default -> out.append(c);
            }
        }
        return out.toString();
    }

    /** True when a new account may not use this username. */
    public static boolean blocked(String username) {
        if (username == null) return true;
        String lower = username.toLowerCase(Locale.ROOT);
        String flat = normalise(lower);
        if (CONTAINED.stream().anyMatch(flat::contains)) return true;
        if (EXACT.contains(lower) || EXACT.contains(flat)) return true;
        if (TOKENS.contains(flat) || TOKENS.contains(lower.replace("_", ""))) return true;
        // "_"-separated tokens with digit substitutions undone ("n4zi_member" → "nazi"), then the raw
        // tokens split on "_" and digits ("hitler88" style suffixes, "big_dick_99").
        if (Arrays.stream(lower.split("_+")).filter(t -> !t.isEmpty()).map(UsernamePolicy::normalise).anyMatch(TOKENS::contains)) return true;
        return Arrays.stream(lower.split("[_0-9]+")).filter(t -> !t.isEmpty()).anyMatch(TOKENS::contains);
    }
}
