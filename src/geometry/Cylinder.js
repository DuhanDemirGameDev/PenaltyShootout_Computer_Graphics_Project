import { Geometry } from "../core/Geometry.js";

export class Cylinder extends Geometry {
  constructor(gl, radius = 0.1, height = 1, radialSegments = 24) {
    const data = Cylinder.generate(radius, height, radialSegments);
    super(gl, data);
  }

  static generate(radius = 0.1, height = 1, radialSegments = 24) {
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const safeSegments = Math.max(3, Math.floor(radialSegments));
    const halfHeight = height / 2;

    for (let y = 0; y <= 1; y += 1) {
      const positionY = y === 0 ? -halfHeight : halfHeight;
      const v = y;

      for (let i = 0; i <= safeSegments; i += 1) {
        const u = i / safeSegments;
        const angle = u * Math.PI * 2;
        const normalX = Math.cos(angle);
        const normalZ = Math.sin(angle);

        positions.push(radius * normalX, positionY, radius * normalZ);
        normals.push(normalX, 0, normalZ);
        uvs.push(u, v);
      }
    }

    for (let i = 0; i < safeSegments; i += 1) {
      const row = safeSegments + 1;
      const a = i;
      const b = i + 1;
      const c = row + i;
      const d = row + i + 1;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }

    const bottomCenterIndex = positions.length / 3;
    positions.push(0, -halfHeight, 0);
    normals.push(0, -1, 0);
    uvs.push(0.5, 0.5);

    for (let i = 0; i <= safeSegments; i += 1) {
      const u = i / safeSegments;
      const angle = u * Math.PI * 2;
      const x = Math.cos(angle);
      const z = Math.sin(angle);

      positions.push(radius * x, -halfHeight, radius * z);
      normals.push(0, -1, 0);
      uvs.push((x + 1) / 2, (z + 1) / 2);
    }

    for (let i = 0; i < safeSegments; i += 1) {
      indices.push(bottomCenterIndex, bottomCenterIndex + i + 1, bottomCenterIndex + i + 2);
    }

    const topCenterIndex = positions.length / 3;
    positions.push(0, halfHeight, 0);
    normals.push(0, 1, 0);
    uvs.push(0.5, 0.5);

    for (let i = 0; i <= safeSegments; i += 1) {
      const u = i / safeSegments;
      const angle = u * Math.PI * 2;
      const x = Math.cos(angle);
      const z = Math.sin(angle);

      positions.push(radius * x, halfHeight, radius * z);
      normals.push(0, 1, 0);
      uvs.push((x + 1) / 2, (z + 1) / 2);
    }

    for (let i = 0; i < safeSegments; i += 1) {
      indices.push(topCenterIndex, topCenterIndex + i + 2, topCenterIndex + i + 1);
    }

    return { positions, normals, uvs, indices };
  }
}
