"""Shared navigation helpers for the clean UI: one 빌드 page with section pills, a class dropdown, a 랭커 tab."""
import re

SECTIONS = ['스킬 & 특화', '데바니온', '내 장비 & 성장', '매크로 & 키 배치', '보스전 운영']


def click_tab(page, name):
    """Click a main-menu tab wherever it is visible: home tabs, sidebar, or the phone menu after opening it."""
    tabs = page.get_by_role('tab', name=name, exact=True)
    for i in range(tabs.count()):
        if tabs.nth(i).is_visible():
            tabs.nth(i).click(); return
    menu = page.get_by_role('button', name='메뉴', exact=False)
    if menu.count() and menu.first.is_visible():
        menu.first.click(); page.wait_for_timeout(250)
        for i in range(tabs.count()):
            if tabs.nth(i).is_visible():
                tabs.nth(i).click(); return
    tabs.first.click()


def open_build(page):
    click_tab(page, '빌드')


def open_section(page, name):
    """Open the build page and scroll to a section through its pill (no separate tabs any more)."""
    open_build(page)
    page.locator('.build-pills button', has_text=re.compile('^' + re.escape(name) + '$')).click()


def pick_class(page, name):
    """Choose a class in the dropdown by its Korean name (살성, 검성, …)."""
    page.locator('.class-select').select_option(label=name)


def open_library(page):
    """빌드 보관함 left the menus; it opens from the build page's summary column."""
    open_build(page)
    page.get_by_role('button', name='공유 링크 · 보관함', exact=True).click()
