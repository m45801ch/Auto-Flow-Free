import re
SIMP = set("个传价仅俩伥优伫会俩佣儿兑党兰关兴册军冯冲决凉减凤刘则创剂劳医华协卖卢厅历压县发变叶号吓园团图圣场坚坛坝坟坏块视频图像标签队列项目设置存储下载打开质时模式环复滚志帧转页对说词话词语读计让认记许论讲调谢谊诡诣诤诧诨诫讹诰诱诳诽谤谀谄谂谌谏谔谓谝谞谟谠谡谦谧谨谩谪谬谭谮谯谰谱谲谳谴谵谶贝贞负贡财责贤败账货质贩贪贫贬购贮贯贰贱贲贳贴贵贶贷贸费贺贻贼贽贾贿赀赁赂赃资赈赉赋赌赍赎赏赐赑赒赓赔赕赖赗赘赙赚赛赜赝仅侦侦數偵")
lines = open('popup.js', encoding='utf-8').read().split('\n')
# find dictionary boundaries
zhcn = [i for i,l in enumerate(lines) if '"zh-CN"' in l][0]
en = [i for i,l in enumerate(lines) if '"en"' in l][0]
print("zhCN at", zhcn, "en at", en)
for i,l in enumerate(lines):
    s = l.strip()
    if not s: continue
    if set(s)&SIMP:
        zone = "zhTW" if i<zhcn else ("zhCN" if i<en else "en/tail")
        print(zone, i+1, s[:100])
