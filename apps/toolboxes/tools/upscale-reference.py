# Reference output for src/lib/upscale/model.test.ts, computed with numpy the way PyTorch does it
# (conv2d = cross-correlation with zero padding, F.pixel_shuffle, + F.interpolate nearest).
# Run: python -I tools/upscale-reference.py > src/lib/upscale/reference.json
import json, os, sys
import numpy as np

here = os.path.dirname(os.path.abspath(__file__))
flat = np.fromfile(os.path.join(here, "../src/lib/upscale/realesr-general-x4v3.bin"), dtype=np.float16)
flat = flat.astype(np.float32)

W, H = 6, 5
x = np.array([[[((px * 7 + py * 13 + c * 5) % 11) / 10 for px in range(W)] for py in range(H)] for c in range(3)], np.float32)

at = 0
def take(*shape):
    global at
    n = int(np.prod(shape))
    out = flat[at:at + n].reshape(shape)
    at += n
    return out

feat = x
for i, (cin, cout) in enumerate([(3, 64)] + [(64, 64)] * 32 + [(64, 48)]):
    w, b = take(cout, cin, 3, 3), take(cout)
    pad = np.pad(feat, ((0, 0), (1, 1), (1, 1)))
    y = np.zeros((cout, H, W), np.float32) + b[:, None, None]
    for ky in range(3):
        for kx in range(3):
            y += np.einsum("oi,ihw->ohw", w[:, :, ky, kx], pad[:, ky:ky + H, kx:kx + W])
    if i < 33:
        a = take(cout)
        y = np.where(y > 0, y, y * a[:, None, None])
    feat = y
assert at == flat.size

r = 4
out = feat.reshape(3, r, r, H, W).transpose(0, 3, 1, 4, 2).reshape(3, H * r, W * r)
out += x.repeat(r, axis=1).repeat(r, axis=2)
json.dump({"w": W, "h": H, "out": [round(float(v), 4) for v in out.ravel()]}, sys.stdout)
