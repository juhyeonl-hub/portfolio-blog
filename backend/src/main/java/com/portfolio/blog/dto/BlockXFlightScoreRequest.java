package com.portfolio.blog.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class BlockXFlightScoreRequest {

    @NotBlank
    @Size(max = 18)
    private String name;

    @Min(0)
    @Max(1_000_000_000)
    private int score;

    @Min(0)
    @Max(1_000_000)
    private int lines;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public int getLines() { return lines; }
    public void setLines(int lines) { this.lines = lines; }
}
