# Retired browser tests

These tests target features that were removed from the active product by user decision. They are kept for reference and are not part of the regression set. The source components and data are preserved, so they can be restored if the features return.

- `crafting.py`, `official_crafting.py`, `recipe_links.py`: crafting calculator, recipe browsing and recipe links were removed on 2026-10-16 ("Current product scope — user decision 2026-10-16" in PROJECT_BRIEF.md).
- `live_dps.py`, `live_dps_socket.py`: measured DPS was excluded from the active product when the build-first planner was approved (PROJECT_BRIEF.md, build-first interface note; commit 0dae60b).

To run one anyway, mount the component in isolation the way `screen_localization.py` does, or restore its navigation entry first.
