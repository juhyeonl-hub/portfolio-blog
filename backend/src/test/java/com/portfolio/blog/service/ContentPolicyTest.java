package com.portfolio.blog.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class ContentPolicyTest {
    @Test
    void blocksOffensiveExtremistAndPoliticalContent() {
        for (String text : List.of(
                "This build is fucking good", "what a piece of sh1t", "you are a b1tch", "kick ass build", "nigger",
                "porn link here", "heil hitler", "NAZI build", "kkk", "kim jong un best ranger", "Xi Jinping fan build",
                "Vote moon jae-in", "donald trump 2028",
                "씨발 이게 뭐야", "ㅅㅂ 너무 어렵다", "병신같은 빌드", "개새끼야", "좆밥 빌드", "지랄하네", "한남충", "짱깨",
                "윤석열 빌드", "이재명 지지", "도널드 트럼프", "김정은 만세",
                "死ね", "キチガイかよ", "安倍晋三",
                "vittu tää on huono", "huora", "neekeri")) {
            assertThat(ContentPolicy.blocked(text)).as(text).isTrue();
        }
    }

    @Test
    void allowsOrdinaryBuildTalk() {
        for (String text : List.of(
                "", "   ", "Assassin build for boss PvE", "classic burst rotation, pass the shield", "Official patch 2.0.8 notes",
                "Support build with admin-approved stats", "Use the trump card at 30%", "computing the best damage",
                "therapist-level healing", "bilberry pie", "cockpit view", "Scunthorpe", "Sussex guild",
                "시발점에서 출발하세요", "시발역 근처", "트럼프 카드처럼 아껴 쓰세요", "살성 PvE 입문 빌드입니다", "이 빌드 좋아요",
                "暗殺者のビルドです", "クソゲーじゃない", "Hyvä build, perkele!", "saatana mikä pomo", "Aho ja Virtanen kokeilivat",
                "Nazir's guide", "Matti Aho")) {
            assertThat(ContentPolicy.blocked(text)).as(text).isFalse();
        }
    }
}
