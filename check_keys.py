import re, sys

src = open('/home/ubuntu/flow-automation/popup.js').read()
m = re.search(r'const i18n = \{([\s\S]*?)\n\};', src)
block = m.group(1)

# Split by top-level language headers (2-space indent)
langs = {}
cur = None
for line in block.split('\n'):
    h = re.match(r'^  "?(en|zh-CN|zh-TW)"?: \{$', line)
    if h:
        cur = h.group(1); langs[cur] = []
    elif cur:
        if re.match(r'^  \},?$', line):
            cur = None
        else:
            for mm in re.finditer(r"[,;]\s*([A-Za-z0-9_]+)\s*:", ',' + line):
                langs.setdefault(cur, []).append(mm.group(1))

html = open('/home/ubuntu/flow-automation/popup.html').read()
keys = set(re.findall(r'data-i18n="([A-Za-z0-9_]+)"', html))
special = {'queueCount'}
keys = keys - special  # queueCount handled specially in JS

missing = {}
for lang in ('zh-TW', 'en', 'zh-CN'):
    s = set(langs.get(lang, []))
    miss = sorted(k for k in keys if k not in s)
    missing[lang] = miss
    print(f"{lang}: keys={len(s)}, missing={len(miss)}")
    if miss:
        print('  missing:', miss)

# check html uses of data-i18n-title / data-i18n-placeholder
for attr in ('data-i18n-title', 'data-i18n-placeholder'):
    ks = set(re.findall(attr + r'="([A-Za-z0-9_]+)"', html))
    s = set(langs.get('zh-TW', []))
    miss = sorted(k for k in ks if k not in s)
    print(f"{attr}: missing={miss}")

if all(not v for v in missing.values()):
    print("ALL KEYS PRESENT - OK")
