import { GameObject } from "../core/GameObject.js";
import { Torus } from "../geometry/Torus.js";
import { Vec3 } from "../math/Vec3.js";

export class TargetCrosshair extends GameObject {
    constructor(gl) {
        super({
            name: "Crosshair",
            geometry: new Torus(gl, 0.35, 0.08, 32, 16),
            material: { color: new Vec3(1.0, 0.0, 0.0) }
        });

        this.transform.position = new Vec3(0, 1.5, -6.5);
        // Rotate the torus into the goal plane so it reads as a target ring.
        this.transform.rotation.x = Math.PI / 2;
    }
}
