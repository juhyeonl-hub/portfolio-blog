package com.portfolio.blog.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class UsernamePolicyTest {
    @Test
    void blocksImpersonationProfanityHateSexualExtremistAndPoliticalNames() {
        for (String name : List.of(
                "admin", "site_admin", "asbc_official", "ncsoft_kr", "moderator1", "gm_kim", "root", "guest", "juhyeonl",
                "fuck_you", "f_u_c_k", "sh1t_happens", "b1tch", "mother_fucker", "dumb_asshole", "big_dick_99", "ass", "cum_lord",
                "nigger", "n1gga", "faggot", "retard_42", "chink", "jap_hater", "white_power", "kkk_member",
                "porn_star", "hentai_fan", "pussy_slayer", "sexy_girl", "sex_god", "rapist", "pedo_bear", "pedophile",
                "hitler88", "heil_hitler", "nazi", "neonazi_club", "holocaust", "siegheil", "isis_fighter", "terrorist",
                "ssibal", "shibal_noma", "byungsin", "gaesaekki", "jiral_ha", "ilbe_user", "womad_fan", "kichigai", "baka_ranger",
                "kim_jong_un", "xijinping", "putin_fan", "donald_trump", "trump_2028", "maga_ranger", "biden", "yoon_suk_yeol",
                "lee_jae_myung", "moon_jae_in", "minjoo_party", "abe_shinzo", "sanae_takaichi", "kishida_fumio",
                // digit substitutions inside a short token followed by a suffix (Codex review)
                "n4zi_member", "st4ff_team", "d1ck_99", "s3x_god", "r4pe_fan", "g0ok_x")) {
            assertThat(UsernamePolicy.blocked(name)).as(name).isTrue();
        }
    }

    @Test
    void allowsOrdinaryGameAndPersonalNames() {
        for (String name : List.of(
                "assassin", "assassin_main", "classic_player", "passion_fan", "bass_player", "cocktail", "cockpit", "peacock_99",
                "dickens_reader", "sussex", "essex_ranger", "analysis", "canal_side", "therapist", "grape_juice", "scraper",
                "nazir", "staffan", "aho_matti", "matti_aho", "kishida_taro", "takaichi_fan", "trumpet_player", "kim_ssi",
                "chon_min", "hannam", "nimi", "shine_bright", "model_fan", "modern", "dogma", "torpedo", "pedometer", "crisis",
                "japan_fan", "spicy_ranger", "sextant", "titan", "gladiator", "templar", "chanter", "cleric", "sorcerer",
                "spiritmaster", "ranger_99", "steam_kim", "aion_lover", "shop_owner", "guest_star", "sakura", "hanako", "mikko_virtanen", "seoyeon", "minjun", "jiwoo_k", "sasuke")) {
            assertThat(UsernamePolicy.blocked(name)).as(name).isFalse();
        }
    }
}
