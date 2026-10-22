"""Shared navigation helpers for the clean UI: guided 빌드 entry with section pills, a class dropdown, a ranking list and build comparison section."""
import re

SECTIONS = ['스킬 & 특화', '데바니온', '내 장비 & 성장', '매크로 & 키 배치', '보스전 운영']


def click_tab(page, name):
    """Click a main-menu tab wherever it is visible: home tabs, sidebar, or the phone menu after opening it."""
    if name == '랭커':
        open_section(page, '랭커와 비교'); return
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
    """Open the build entry and select one detailed editor through its pill."""
    open_build(page)
    chooser = page.get_by_label('빌드에서 할 일', exact=True)
    if chooser.is_visible():
        chooser.select_option(label=name)
    else:
        page.locator('.build-pills > button', has_text=re.compile('^' + re.escape(name) + '$')).click()


def pick_class(page, name):
    """Choose a class in the dropdown by its Korean name (살성, 검성, …)."""
    page.locator('.class-select').select_option(label=name)


def open_library(page):
    """Open the library from the guided build entry."""
    open_build(page)
    page.get_by_role('button', name='공유 링크 · 보관함', exact=True).click()
