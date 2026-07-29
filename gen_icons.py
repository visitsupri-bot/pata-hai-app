import struct, zlib, os

def make_png(size, color_rgb):
    """Create a minimal solid-color PNG of given size."""
    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)

    r, g, b = color_rgb
    raw = b''
    for _ in range(size):
        row = b'\x00' + bytes([r, g, b] * size)
        raw += row

    compressed = zlib.compress(raw)

    # PNG signature: 8 bytes
    png = bytes([137, 80, 78, 71, 13, 10, 26, 10])
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')
    return png

os.makedirs('icons', exist_ok=True)
saffron = (234, 88, 12)  # #ea580c
for size in [192, 512]:
    with open(f'icons/icon-{size}.png', 'wb') as f:
        f.write(make_png(size, saffron))
    print(f'Created icons/icon-{size}.png')
