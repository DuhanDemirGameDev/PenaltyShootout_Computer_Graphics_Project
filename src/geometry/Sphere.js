import { Geometry } from "../core/Geometry.js";

export class Sphere extends Geometry {
  constructor(gl, radius = 0.5, widthSegments = 32, heightSegments = 16) {
    const data = Sphere.generate(radius, widthSegments, heightSegments);
    super(gl, data);
  }

  static generate(radius = 0.5, widthSegments = 32, heightSegments = 16) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const safeWidthSegments = Math.max(3, Math.floor(widthSegments));
    const safeHeightSegments = Math.max(2, Math.floor(heightSegments));

    for (let y = 0; y <= safeHeightSegments; y += 1) {
      const v = y / safeHeightSegments;
      const theta = v * Math.PI;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let x = 0; x <= safeWidthSegments; x += 1) {
        const u = x / safeWidthSegments;
        const phi = u * Math.PI * 2;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        const normalX = cosPhi * sinTheta;
        const normalY = cosTheta;
        const normalZ = sinPhi * sinTheta;

        positions.push(
          radius * normalX,
          radius * normalY,
          radius * normalZ
        );
        normals.push(normalX, normalY, normalZ);
        uvs.push(u, 1 - v);
      }
    }

    for (let y = 0; y < safeHeightSegments; y += 1) {
      for (let x = 0; x < safeWidthSegments; x += 1) {
        const row = safeWidthSegments + 1;
        const a = y * row + x;
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
