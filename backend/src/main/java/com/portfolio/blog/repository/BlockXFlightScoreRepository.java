package com.portfolio.blog.repository;

import com.portfolio.blog.model.BlockXFlightScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BlockXFlightScoreRepository extends JpaRepository<BlockXFlightScore, Long> {
    List<BlockXFlightScore> findTop100ByOrderByScoreDescCreatedAtAsc();
}
