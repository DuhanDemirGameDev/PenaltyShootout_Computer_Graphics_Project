import { GameObject } from "../core/GameObject.js";
import { Torus } from "../geometry/Torus.js";
import { Vec3 } from "../math/Vec3.js";

export class TargetCrosshair extends GameObject {
    constructor(gl) {
        super({
            name: "Crosshair",
            // Torus: major radius 0.35, tube radius 0.08, 32 tubular segments, 16 radial segments
            geometry: new Torus(gl, 0.35, 0.08, 32, 16),
            material: { color: new Vec3(1.0, 0.0, 0.0) }
        });

        this.transform.position = new Vec3(0, 1.5, -6.5);
        // Rotate 90° around X so the torus ring stands upright (XY plane) and faces the camera.
        // Without this it lies flat on the XZ plane like a UFO.
        this.transform.rotation.x = Math.PI / 2;
    }
}