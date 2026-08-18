#!/usr/bin/env python3
"""Scan popup.html for hardcoded CJK strings outside data-i18n nodes and
placeholder/title attrs that are not handled by i18n; also scan popup.js
outside string-dict lines for hardcoded CJK literals used in UI (toasts etc)."""
import re

CJK = re.compile(r'[\u4e00-\u9fff]')

print("=== popup.html hardcoded CJK (per line) ===")
with open("popup.html", encoding="utf-8") as f:
    lines = f.readlines()
for i, line in enumerate(lines, 1):
    # strip comments
    core = re.sub(r'<!--.*?-->', ' ', line)
    if CJK.search(core):
        # check if all CJK is inside a data-i18n span text (acceptable, will be translated)
        # find spans with data-i18n and their inner text
        stripped = re.sub(r'<span[^>]*data-i18n="[^"]*"[^>]*>.*?</span>', '', core)
        stripped = re.sub(r'<option[^>]*>.*?</option>', '', stripped)
        if CJK.search(stripped):
            print(f"L{i}: {stripped.rstrip()[:110]}")

print("\n=== popup.js hardcoded CJK in runtime UI code (outside dict) ===")
with open("popup.js", encoding="utf-8") as f:
    jslines = f.readlines()
# dict regions: lines 11-133 (zh-TW), 259-382 (zh-CN), 135-257 (en); comments fine
in_dict = lambda n: (11 <= n <= 382)
for i, line in enumerate(jslines, 1):
    if in_dict(i):
        continue
    core = re.sub(r'//.*', '', line)
    if CJK.search(core):
        print(f"L{i}: {core.rstrip()[:120]}")

print("\n=== popup.js en-dict values containing CJK ===")
dict_mode = None
for i, line in enumerate(jslines, 1):
    m = re.match(r'\s*"((?:zh-TW|zh-CN|en))":\s*\{', line)
    if m:
        dict_mode = m.group(1)
        continue
    if dict_mode and re.match(r'\s*\},', line):
        dict_mode = None
    if dict_mode == "en" and CJK.search(line):
        print(f"L{i}: {line.rstrip()[:120]}")

print("\n=== applyI18n handling (placeholder/title/option) ===")
for i, line in enumerate(jslines, 900, 900):
    pass
a = [j for j, l in enumerate(jslines, 1) if "function applyI18n" in l]
for start in a:
    for j in range(start - 1, min(start + 40, len(jslines))):
        print(f"L{j+1}: {jslines[j].rstrip()[:120]}")
