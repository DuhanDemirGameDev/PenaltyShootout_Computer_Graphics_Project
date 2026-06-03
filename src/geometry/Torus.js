import { Geometry } from "../core/Geometry.js";

/**
 * Torus procedural geometry.
 *
 * @param {WebGLRenderingContext} gl
 * @param {number} R          - Major radius (centre of tube to centre of torus)
 * @param {number} r          - Minor radius (tube radius)
 * @param {number} tubularSegs - Segments around the tube (longitude)
 * @param {number} radialSegs  - Segments around the ring  (latitude)
 */
export class Torus extends Geometry {
  constructor(gl, R = 0.35, r = 0.08, tubularSegs = 32, radialSegs = 16) {
    const data = Torus.generate(R, r, tubularSegs, radialSegs);
    super(gl, data);
  }

  /**
   * Generates torus vertex data.
   *
   * Each vertex is placed at:
   *   P = ( (R + r*cos(v)) * cos(u),
   *           r * sin(v),
   *         (R + r*cos(v)) * sin(u) )
   *
   * where u ∈ [0, 2π] sweeps around the ring and
   *       v ∈ [0, 2π] sweeps around the tube.
   *
   * The outward-pointing normal is the unit vector from the ring-centre
   * point (R*cos(u), 0, R*sin(u)) to the vertex P.
   */
  static generate(R = 0.35, r = 0.08, tubularSegs = 32, radialSegs = 16) {
    const safeT = Math.max(3, Math.floor(tubularSegs));
    const safeR = Math.max(3, Math.floor(radialSegs));

    const positions = [];
    const normals   = [];
    const uvs       = [];
    const indices   = [];

    for (let j = 0; j <= safeR; j++) {
      const v       = (j / safeR) * Math.PI * 2;
      const cosV    = Math.cos(v);
      const sinV    = Math.sin(v);

      for (let i = 0; i <= safeT; i++) {
        const u    = (i / safeT) * Math.PI * 2;
        const cosU = Math.cos(u);
        const sinU = Math.sin(u);

        // Vertex position
        const px = (R + r * cosV) * cosU;
        const py =       r * sinV;
        const pz = (R + r * cosV) * sinU;

        positions.push(px, py, pz);

        // Outward normal = direction from ring-centre to vertex, normalised.
        // Ring-centre for this u: (R*cosU, 0, R*sinU)
        const nx = cosV * cosU;
        const ny = sinV;
        const nz = cosV * sinU;

        normals.push(nx, ny, nz);

        // UV: u-param maps i → [0,1], v-param maps j → [0,1]
        uvs.push(i / safeT, j / safeR);
      }
    }

    // Build triangles
    const stride = safeT + 1;
    for (let j = 0; j < safeR; j++) {
      for (let i = 0; i < safeT; i++) {
        const a = j * stride + i;
        const b = a + 1;
        const c = (j + 1) * stride + i;
        const d = c + 1;

        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    return { positions, normals, uvs, indices };
  }
}
