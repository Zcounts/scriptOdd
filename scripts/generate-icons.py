#!/usr/bin/env python3
"""Generate placeholder icon files for scriptOdd packaging.

Design: dark warm-brown background (#2d2a27) with a paper rectangle (#f2eadc)
and gold accent stripe (#caa24b), reflecting the app's visual language.

Outputs:
  build/icon.png   — 512×512 PNG  (Linux AppImage, also source)
  build/icon.ico   — ICO with embedded 256×256 PNG  (Windows)
  build/icon.icns  — ICNS with ic09 512×512 PNG element  (macOS)

Usage:
  python3 scripts/generate-icons.py
"""

import struct
import zlib
import os

# ── Colors (from src/renderer/src/index.css) ──────────────────────────────────
BG    = (0x2d, 0x2a, 0x27)  # --so-shell-bg
PAPER = (0xf2, 0xea, 0xdc)  # --so-paper
GOLD  = (0xca, 0xa2, 0x4b)  # --so-accent
LINE  = (0xd6, 0xcc, 0xba)  # muted line on paper


# ── PNG helpers ────────────────────────────────────────────────────────────────

def _png_chunk(name: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(name + data) & 0xFFFFFFFF
    return struct.pack('>I', len(data)) + name + data + struct.pack('>I', crc)


def render_icon(size: int) -> bytes:
    """Render the scriptOdd placeholder icon at the given square size."""
    W = H = size

    # Scale geometry relative to 512
    s = size / 512.0
    px1 = int(106 * s)          # paper left
    px2 = int(406 * s)          # paper right
    py1 = int(76 * s)           # paper top
    py2 = int(446 * s)          # paper bottom
    gold_h = max(1, int(40 * s))  # gold stripe height

    pw = px2 - px1              # paper width in pixels

    # Build row templates
    bg_row_full   = bytes(BG) * W
    gold_row_full = bytes(BG) * px1 + bytes(GOLD) * pw + bytes(BG) * (W - px2)
    paper_row_full = bytes(BG) * px1 + bytes(PAPER) * pw + bytes(BG) * (W - px2)

    # Screenplay "text" lines on the paper (abstract, no real font)
    line_defs = []
    if size >= 64:
        lx_indent = max(1, int(20 * s))
        lx_end_full = max(1, int(260 * s))
        lx_end_short = max(1, int(140 * s))
        line_y_offsets = [
            (int(56 * s),  False),  # scene heading (short)
            (int(74 * s),  True),   # action
            (int(90 * s),  True),
            (int(114 * s), False),  # scene heading (short)
            (int(132 * s), True),
            (int(148 * s), True),
            (int(164 * s), True),
            (int(188 * s), False),  # scene heading
            (int(206 * s), True),
            (int(222 * s), True),
        ]
        for (off, is_full) in line_y_offsets:
            ly = py1 + gold_h + off
            if ly >= py2 - max(1, int(4 * s)):
                continue
            lx2 = lx_end_full if is_full else lx_end_short
            line_defs.append((ly, lx_indent, min(lx2, pw - lx_indent)))

    # Assemble rows
    raw = bytearray()
    for y in range(H):
        raw.append(0)  # PNG filter byte
        if y < py1 or y >= py2:
            raw.extend(bg_row_full)
        elif y < py1 + gold_h:
            raw.extend(gold_row_full)
        else:
            row = bytearray(paper_row_full)
            # Draw any text lines at this y
            for (ly, lx_i, lx_w) in line_defs:
                if y == ly:
                    start = (px1 + lx_i) * 3
                    row[start:start + lx_w * 3] = bytes(LINE) * lx_w
            raw.extend(row)

    idat = zlib.compress(bytes(raw), 6)
    ihdr = struct.pack('>IIBBBBB', W, H, 8, 2, 0, 0, 0)

    png = b'\x89PNG\r\n\x1a\n'
    png += _png_chunk(b'IHDR', ihdr)
    png += _png_chunk(b'IDAT', idat)
    png += _png_chunk(b'IEND', b'')
    return png


# ── ICO format ─────────────────────────────────────────────────────────────────

def make_ico(png_256: bytes) -> bytes:
    """ICO file with one embedded 256×256 PNG entry (Vista+ compatible)."""
    # For sizes > 255 pixels, width/height fields in directory are written as 0
    header = struct.pack('<HHH', 0, 1, 1)        # reserved, type=1(ICO), count
    data_offset = 6 + 16                          # header(6) + one dir entry(16)
    dir_entry = struct.pack('<BBBBHHII',
        0, 0,                  # width=0 (means 256), height=0 (means 256)
        0, 0,                  # colorCount, reserved
        1, 32,                 # planes, bitCount
        len(png_256),          # bytesInRes
        data_offset            # imageOffset
    )
    return header + dir_entry + png_256


# ── ICNS format ────────────────────────────────────────────────────────────────

def make_icns(png_512: bytes) -> bytes:
    """Minimal ICNS with one ic09 element (512×512 PNG)."""
    # ic09 = 512×512 icon (used directly and as @2x for 256×256 slots)
    icon_type = b'ic09'
    element_len = 8 + len(png_512)
    element = icon_type + struct.pack('>I', element_len) + png_512
    total_len = 8 + len(element)
    return b'icns' + struct.pack('>I', total_len) + element


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> None:
    repo_root = os.path.join(os.path.dirname(__file__), '..')
    out = os.path.abspath(os.path.join(repo_root, 'build'))
    os.makedirs(out, exist_ok=True)

    print('Rendering 512×512 icon …')
    png512 = render_icon(512)
    with open(os.path.join(out, 'icon.png'), 'wb') as f:
        f.write(png512)
    print(f'  ✓  build/icon.png  ({len(png512):,} bytes)')

    print('Rendering 256×256 icon for ICO …')
    png256 = render_icon(256)
    ico = make_ico(png256)
    with open(os.path.join(out, 'icon.ico'), 'wb') as f:
        f.write(ico)
    print(f'  ✓  build/icon.ico  ({len(ico):,} bytes)')

    print('Building ICNS …')
    icns = make_icns(png512)
    with open(os.path.join(out, 'icon.icns'), 'wb') as f:
        f.write(icns)
    print(f'  ✓  build/icon.icns ({len(icns):,} bytes)')

    print('\nDone. Replace these with real artwork before shipping.')


if __name__ == '__main__':
    main()
