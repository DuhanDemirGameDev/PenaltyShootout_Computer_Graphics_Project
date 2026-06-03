import { Geometry } from "../core/Geometry.js";

export class Cone extends Geometry {
    constructor(gl, radius = 0.5, height = 1.0, radialSegments = 16) {
        const positions = [];
        const indices = [];

        // Apex vertex.
        positions.push(0, height, 0);

        // Base ring vertices.
        for (let i = 0; i <= radialSegments; i++) {
            const angle = (i / radialSegments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            positions.push(x, 0, z);

            if (i < radialSegments) {
                const apexIndex = 0;
                const baseIndex1 = i + 1;
                const baseIndex2 = i + 2;
                indices.push(apexIndex, baseIndex1, baseIndex2);
            }
        }

        super(gl, positions, indices);
    }
}
