package com.portfolio.blog.controller;

import com.portfolio.blog.dto.BlockXFlightScoreRequest;
import com.portfolio.blog.model.BlockXFlightScore;
import com.portfolio.blog.repository.BlockXFlightScoreRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/block-x-flight/scores")
public class PublicBlockXFlightScoreController {

    private final BlockXFlightScoreRepository repository;

    public PublicBlockXFlightScoreController(BlockXFlightScoreRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<BlockXFlightScore>> topScores() {
        return ResponseEntity.ok(repository.findTop100ByOrderByScoreDescCreatedAtAsc());
    }

    @PostMapping
    public ResponseEntity<List<BlockXFlightScore>> saveScore(@Valid @RequestBody BlockXFlightScoreRequest request) {
        BlockXFlightScore score = new BlockXFlightScore();
        score.setPlayerName(request.getName().trim());
        score.setScore(request.getScore());
        score.setLines(request.getLines());
        repository.save(score);
        return ResponseEntity.ok(repository.findTop100ByOrderByScoreDescCreatedAtAsc());
    }
}
