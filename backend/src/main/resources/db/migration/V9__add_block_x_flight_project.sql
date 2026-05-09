-- V9: Add Block X Flight as a portfolio project case study

INSERT INTO projects (
    title,
    slug,
    short_description,
    full_description,
    thumbnail_url,
    github_url,
    demo_url,
    tech_stack,
    display_order,
    published,
    created_at,
    updated_at
) VALUES (
    'Block X Flight',
    'block-x-flight',
    'Browser game prototype combining split-focus puzzle input, shooter dodging, seeded RNG, and lightweight multiplayer architecture.',
    '# Block X Flight

Block X Flight is a browser-based real-time game prototype built as an interactive systems experiment. The core loop combines a block-stacking puzzle field with a shooter survival field, forcing the player to manage two kinds of input pressure at once.

## Why I Built It

The project explores how much real-time interaction can fit inside a portfolio-friendly web experience without turning into a full game platform. I wanted the result to be playable, but also useful as a technical case study in input handling, game-loop design, and small multiplayer architecture.

## Technical Focus

- Canvas-based fixed-step style game loop
- Keyboard input handling with hold/repeat behavior
- Split-screen game-state rendering
- Seeded RNG for fair puzzle sequences
- Item, buff, and debuff state timers
- Local ranking persistence for single-player runs
- WebSocket relay foundation for private Host/Join play

## Current Modes

- Single: score-focused run with local ranking
- VS AI: local pressure mode with simulated opponent attacks
- Host: creates an invite-code room
- Join: joins an invite-code room

## What It Demonstrates

This is intentionally not presented as a polished commercial game. It is a compact interaction prototype that demonstrates real-time UI thinking, deterministic game systems, and practical browser networking foundations.

## Play

The playable version lives in the Lab section:

[/lab/block-x-flight](/lab/block-x-flight)
',
    NULL,
    NULL,
    '/lab/block-x-flight',
    'JavaScript, Canvas, WebSocket, Spring Boot, React',
    0,
    TRUE,
    NOW(),
    NOW()
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    short_description = EXCLUDED.short_description,
    full_description = EXCLUDED.full_description,
    demo_url = EXCLUDED.demo_url,
    tech_stack = EXCLUDED.tech_stack,
    display_order = EXCLUDED.display_order,
    published = EXCLUDED.published,
    updated_at = NOW();
