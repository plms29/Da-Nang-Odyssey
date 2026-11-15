"""Quay demo ngang 1920x1080 tu app local. Server :3200 chay voi Supabase gia (xem README-video.md)."""
import glob, json, os, re, shutil, subprocess, sys
from playwright.sync_api import sync_playwright
BASE = os.environ.get("BASE", "http://localhost:3200"); OUT = "clips"; os.makedirs(OUT, exist_ok=True)
ARGS = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
SESSION = json.dumps({"access_token": "a.b.c", "token_type": "bearer", "expires_in": 99999, "expires_at": 4102444800,
    "refresh_token": "r", "user": {"id": "demo", "aud": "authenticated", "role": "authenticated", "email": "demo@example.com",
    "app_metadata": {}, "user_metadata": {}, "created_at": "2026-01-01T00:00:00Z"}})
SAMPLE = [("Thành Điện Hải", "Gạch cũ nhớ năm 1858"), ("Cầu Rồng", "Rồng thức giấc bên sông Hàn"), ("Bảo tàng Chăm", "Nghìn năm vẫn mỉm cười"),
          ("Phố cổ Hội An", "Đèn lồng giữ hộ ký ức"), ("Thành Điện Hải", "Một ngày làm người giữ thành"), ("Cầu Rồng", "Đà Nẵng về đêm")]

def scene(p, name, fn, cards=False):
    tmp = f"tmp_{name}"; shutil.rmtree(tmp, ignore_errors=True)
    vp = {'width': 1920, 'height': 1080} if cards else {'width': 1440, 'height': 810}
    b = p.chromium.launch(args=ARGS)
    c = b.new_context(viewport=vp, record_video_dir=tmp, record_video_size=vp)
    c.add_init_script(f"localStorage.setItem('sb-mock-auth-token', {json.dumps(SESSION)})")
    pg = c.new_page(); fn(pg); c.close(); b.close()
    webm = glob.glob(f"{tmp}/*.webm")[0]
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "0" if cards else "2.2", "-i", webm, "-vf", "scale=1920:1080:flags=lanczos", "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", f"{OUT}/{name}.mp4"], check=True)
    shutil.rmtree(tmp, ignore_errors=True); print("ok", name)

def go(pg, path, wait=2500):
    pg.goto(BASE + path); pg.add_style_tag(content="nextjs-portal{display:none!important}"); pg.wait_for_timeout(wait)
def click(pg, text, root="main"): pg.locator(f"{root} button").filter(has_text=text).first.click(timeout=8000)

def mock_supabase(pg):  # chi cho cong dong: du lieu mau, khong phai du lieu that
    def rest(r):
        rows = [{"id": str(i), "spot_name": s, "caption": c, "path": f"c{i%4+1}.jpg", "created_at": "2026-11-01"} for i, (s, c) in enumerate(SAMPLE)]
        r.fulfill(status=200, content_type="application/json", body=json.dumps(rows))
    pg.route(re.compile(r"mock\.supabase\.co/rest/v1/danang_photos"), rest)
    pg.route(re.compile(r"mock\.supabase\.co/storage/.*/(c\d)\.jpg"), lambda r: r.fulfill(status=200, content_type="image/jpeg",
        body=open("art/" + r.request.url.split("/")[-1].split("?")[0], "rb").read()))
    pg.route(re.compile(r"mock\.supabase\.co/(?!rest/v1/danang_photos|storage)"), lambda r: r.fulfill(status=200, content_type="application/json", body="[]"))

def home(pg):
    go(pg, "/", 4000); pg.mouse.wheel(0, 500); pg.wait_for_timeout(2500)
    pg.locator("main a").filter(has_text="Khám phá").first.hover(); pg.wait_for_timeout(1500)

def dien_hai(pg):
    go(pg, "/kham-pha/man-2-giu-thanh", 3500)
    while not pg.evaluate("scrollY+innerHeight>=document.body.scrollHeight-2"):  # cuon cham: giu doan chuyen canh
        pg.mouse.wheel(0, 90); pg.wait_for_timeout(300)
    pg.wait_for_timeout(1500); click(pg, "Bắt đầu"); pg.wait_for_timeout(3500)
    box = pg.locator(".leaflet-container").first; box.scroll_into_view_if_needed(); pg.wait_for_timeout(1500)
    m = {t: pg.locator(f'.leaflet-marker-icon[title="{t}"]').first.bounding_box() for t in ("Cầu Thuận Phước", "Cầu Rồng", "Chợ Hàn")}
    c = lambda b: (b["x"] + b["width"] / 2, b["y"] + b["height"] / 2)
    (_, y1), (_, y2), (xh, yh) = c(m["Cầu Thuận Phước"]), c(m["Cầu Rồng"]), c(m["Chợ Hàn"])
    ky = (y2 - y1) / (16.0612 - 16.0905); kx = ky * -0.961 * -1  # px/do lat; lng dung cos(16deg)
    kx = abs(ky) * 0.961
    tx = xh + (108.2217 - 108.2238) * kx; ty = yh + (16.0759 - 16.0682) * ky
    pg.mouse.move(tx - 120, ty - 80, steps=15); pg.wait_for_timeout(700); pg.mouse.click(tx, ty); pg.wait_for_timeout(1800)
    click(pg, "Xác nhận ghim"); pg.wait_for_timeout(2500)

def community(pg): mock_supabase(pg); go(pg, "/cong-dong", 5000); pg.mouse.wheel(0, 300); pg.wait_for_timeout(2500)
def cards(h, ms): return lambda pg: (pg.goto("file:///" + os.path.abspath("cards.html").replace("\\", "/") + "#" + h), pg.wait_for_timeout(ms))

SCENES = dict(title=(cards("title", 6000), True), home=(home, False), dien_hai=(dien_hai, False), community=(community, False),
              tech=(cards("tech", 17000), True), outro=(cards("outro", 7000), True))
if __name__ == "__main__":
    with sync_playwright() as p:
        for n in (sys.argv[1:] or SCENES): scene(p, n, *SCENES[n])
