import { Geometry } from "../core/Geometry.js";

export class Plane extends Geometry {
  constructor(gl, width = 10, depth = 10, segments = 1) {
    const data = Plane.generate(width, depth, segments);
    super(gl, data);
  }

  static generate(width = 10, depth = 10, segments = 1) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const safeSegments = Math.max(1, Math.floor(segments));
    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    for (let z = 0; z <= safeSegments; z += 1) {
      const v = z / safeSegments;
      const positionZ = v * depth - halfDepth;

      for (let x = 0; x <= safeSegments; x += 1) {
        const u = x / safeSegments;
        const positionX = u * width - halfWidth;

        positions.push(positionX, 0, positionZ);
        normals.push(0, 1, 0);
        uvs.push(u, v);
      }
    }

    for (let z = 0; z < safeSegments; z += 1) {
      for (let x = 0; x < safeSegments; x += 1) {
        const row = safeSegments + 1;
        const a = z * row + x;
        const b = a + 1;
        const c = a + row;
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    return { positions, normals, uvs, indices };
  }
}
