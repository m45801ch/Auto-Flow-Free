from PIL import Image, ImageDraw

def make_icon(size, path):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = size * 0.14
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill="#0d0d0d")
    # 綠色播放箭頭
    c = size / 2
    w = int(size * 0.12)
    pts = [
        (int(c - size * 0.28), int(c - size * 0.28)),
        (int(c - size * 0.28), int(c + size * 0.28)),
        (int(c + size * 0.28), c),
    ]
    d.polygon(pts, fill="#3ddc84")
    img.save(path)

for s in [16, 32, 48, 128]:
    make_icon(s, f"/home/ubuntu/flow-automation/icons/icon{s}.png")
print("done")
