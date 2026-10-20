"""Builds the ASBC icon set (design 5: "AS / BC" in four cells, C highlighted) into frontend/asbc-pages/.

The letters are drawn with Space Grotesk 700 loaded from Google Fonts, so this needs network access and
Playwright (python3 -m playwright). Output PNGs are copied into dist-asbc by vite.asbc.config.js.
Usage: python3 shadowcraft/operations/build-asbc-icons.py
"""
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'frontend' / 'asbc-pages'
CELL, HIGHLIGHT, LETTER, DARK, BG = '#272237', '#a68be9', '#c6b1ff', '#171020', '#0e1017'


def icon(small: bool) -> str:
    """Square 100×100 SVG. The small version (≤32 px) has thinner gaps and larger letters to stay legible."""
    gap, pad, radius, size = (3, 3, 6, 40) if small else (4, 5, 8, 34)
    cell = (100 - 2 * pad - gap) / 2
    cells, letters = '', ''
    for i, ch in enumerate('ASBC'):
        x, y = pad + (i % 2) * (cell + gap), pad + (i // 2) * (cell + gap)
        cells += f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" rx="{radius}" fill="{HIGHLIGHT if ch == "C" else CELL}"/>'
        letters += (f'<text x="{x + cell / 2}" y="{y + cell / 2}" text-anchor="middle" dominant-baseline="central" '
                    f'style="font-family:\'Space Grotesk\';font-weight:700;font-size:{size}px" '
                    f'fill="{DARK if ch == "C" else LETTER}">{ch}</text>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="14" fill="{BG}"/>{cells}{letters}</svg>'


PAGE = """<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=block" rel="stylesheet">
<style>html,body{margin:0;background:transparent}svg{display:block;width:100%;height:100%}
.og{width:1200px;height:630px;background:radial-gradient(ellipse at 30% 40%,#2a2140 0%,#0e1017 65%);display:flex;align-items:center;gap:64px;padding:0 96px;box-sizing:border-box;font-family:'Space Grotesk';color:#e8e9f2}
.og .mark{width:300px;height:300px;flex:none}.og h1{font-size:120px;line-height:1;margin:0;letter-spacing:-2px}
.og p{margin:18px 0 0;font-size:38px;color:#c6b1ff;font-weight:500}.og small{display:block;margin-top:26px;font-size:26px;color:#8f94a9;font-weight:500}</style></head>
<body>__BODY__</body></html>"""


def render(page, body: str, width: int, height: int, path: pathlib.Path, transparent=True):
    page.set_viewport_size({'width': width, 'height': height})
    page.set_content(PAGE.replace('__BODY__', body))
    page.evaluate("document.fonts.load('700 40px \"Space Grotesk\"')")
    page.wait_for_function("document.fonts.check('700 40px \"Space Grotesk\"')")
    page.screenshot(path=str(path), omit_background=transparent, clip={'x': 0, 'y': 0, 'width': width, 'height': height})


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(device_scale_factor=1)
    for size, small in ((16, True), (32, True), (48, False), (180, False), (512, False)):
        render(page, f'<div style="width:{size}px;height:{size}px">{icon(small)}</div>', size, size, OUT / f'asbc-icon-{size}.png')
    og = (f'<div class="og"><div class="mark">{icon(False)}</div><div><h1>ASBC</h1><p>Aion2 Steam Build Craft</p>'
          '<small>Build planner for AION 2 Global</small></div></div>')
    render(page, og, 1200, 630, OUT / 'asbc-og.png', transparent=False)
    (OUT / 'asbc-icon.svg').write_text(icon(False))
    browser.close()
print('icons written to', OUT)
