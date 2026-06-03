import { Geometry } from "../core/Geometry.js";

export class Cuboid extends Geometry {
  constructor(gl, width = 1, height = 1, depth = 1) {
    const data = Cuboid.generate(width, height, depth);
    super(gl, data);
  }

  static generate(width = 1, height = 1, depth = 1) {
    const hw = width / 2;
    const hh = height / 2;
    const hd = depth / 2;

    // Each face has unique vertices so flat normals and UVs remain independent.
    const positions = [
      // Front face (Z+).
      -hw, -hh,  hd,   hw, -hh,  hd,   hw,  hh,  hd,  -hw,  hh,  hd,
      // Back face (Z-).
      -hw, -hh, -hd,  -hw,  hh, -hd,   hw,  hh, -hd,   hw, -hh, -hd,
      // Top face (Y+).
      -hw,  hh, -hd,  -hw,  hh,  hd,   hw,  hh,  hd,   hw,  hh, -hd,
      // Bottom face (Y-).
      -hw, -hh, -hd,   hw, -hh, -hd,   hw, -hh,  hd,  -hw, -hh,  hd,
      // Right face (X+).
       hw, -hh, -hd,   hw,  hh, -hd,   hw,  hh,  hd,   hw, -hh,  hd,
      // Left face (X-).
      -hw, -hh, -hd,  -hw, -hh,  hd,  -hw,  hh,  hd,  -hw,  hh, -hd,
    ];

    // Face normals for flat lighting.
    const normals = [
      // Front.
       0,  0,  1,   0,  0,  1,   0,  0,  1,   0,  0,  1,
      // Back.
       0,  0, -1,   0,  0, -1,   0,  0, -1,   0,  0, -1,
      // Top.
       0,  1,  0,   0,  1,  0,   0,  1,  0,   0,  1,  0,
      // Bottom.
       0, -1,  0,   0, -1,  0,   0, -1,  0,   0, -1,  0,
      // Right.
       1,  0,  0,   1,  0,  0,   1,  0,  0,   1,  0,  0,
      // Left.
      -1,  0,  0,  -1,  0,  0,  -1,  0,  0,  -1,  0,  0,
    ];

    // Per-face texture coordinates.
    const uvs = [
      // Front.
      0, 1,  1, 1,  1, 0,  0, 0,
      // Back.
      1, 1,  1, 0,  0, 0,  0, 1,
      // Top.
      0, 0,  0, 1,  1, 1,  1, 0,
      // Bottom.
      1, 1,  0, 1,  0, 0,  1, 0,
      // Right.
      1, 1,  1, 0,  0, 0,  0, 1,
      // Left.
      0, 1,  1, 1,  1, 0,  0, 0,
    ];

    // Each cuboid face is composed of two indexed triangles.
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
