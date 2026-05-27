import { Geometry } from "../core/Geometry.js";

export class Cuboid extends Geometry {
  constructor(gl, width = 1, height = 1, depth = 1) {
    const data = Cuboid.generate(width, height, depth);
    super(gl, data);
  }

  static generate(width = 1, height = 1, depth = 1) {
    // Merkezden köşelere olan uzaklıklar
    const hw = width / 2;
    const hh = height / 2;
    const hd = depth / 2;

    // Bir küboidin 6 yüzü vardır. Her yüz için 4 köşe tanımlıyoruz (Toplam 24 nokta)
    const positions = [
      // Ön yüz (Z+)
      -hw, -hh,  hd,   hw, -hh,  hd,   hw,  hh,  hd,  -hw,  hh,  hd,
      // Arka yüz (Z-)
      -hw, -hh, -hd,  -hw,  hh, -hd,   hw,  hh, -hd,   hw, -hh, -hd,
      // Üst yüz (Y+)
      -hw,  hh, -hd,  -hw,  hh,  hd,   hw,  hh,  hd,   hw,  hh, -hd,
      // Alt yüz (Y-)
      -hw, -hh, -hd,   hw, -hh, -hd,   hw, -hh,  hd,  -hw, -hh,  hd,
      // Sağ yüz (X+)
       hw, -hh, -hd,   hw,  hh, -hd,   hw,  hh,  hd,   hw, -hh,  hd,
      // Sol yüz (X-)
      -hw, -hh, -hd,  -hw, -hh,  hd,  -hw,  hh,  hd,  -hw,  hh, -hd,
    ];

    // Işıklandırma için yüzey normalleri
    const normals = [
      // Ön
       0,  0,  1,   0,  0,  1,   0,  0,  1,   0,  0,  1,
      // Arka
       0,  0, -1,   0,  0, -1,   0,  0, -1,   0,  0, -1,
      // Üst
       0,  1,  0,   0,  1,  0,   0,  1,  0,   0,  1,  0,
      // Alt
       0, -1,  0,   0, -1,  0,   0, -1,  0,   0, -1,  0,
      // Sağ
       1,  0,  0,   1,  0,  0,   1,  0,  0,   1,  0,  0,
      // Sol
      -1,  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,  0,
    ];

    // Resim kaplamak için UV koordinatları
    const uvs = [
      // Ön
      0, 1,  1, 1,  1, 0,  0, 0,
      // Arka
      1, 1,  1, 0,  0, 0,  0, 1,
      // Üst
      0, 0,  0, 1,  1, 1,  1, 0,
      // Alt
      1, 1,  0, 1,  0, 0,  1, 0,
      // Sağ
      1, 1,  1, 0,  0, 0,  0, 1,
      // Sol
      0, 1,  1, 1,  1, 0,  0, 0,
    ];

    // Noktaları üçgenlere çevirme (Her yüz 2 üçgenden, yani 6 indeksten oluşur)
    const indices = [];
    for (let i = 0; i < 6; i++) {
      const offset = i * 4;
      indices.push(
        offset, offset + 1, offset + 2,
        offset, offset + 2, offset + 3
      );
    }

    return { positions, normals, uvs, indices };
  }
}