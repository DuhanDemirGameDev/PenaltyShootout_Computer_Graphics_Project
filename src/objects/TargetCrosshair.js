import { GameObject } from "../core/GameObject.js";
import { Sphere } from "../geometry/Sphere.js";
import { Vec3 } from "../math/Vec3.js";

export class TargetCrosshair extends GameObject {
    constructor(gl) {
        super({
            name: "Crosshair",
            geometry: new Sphere(gl, 0.2, 16, 16),
            material: { color: new Vec3(1.0, 0.0, 0.0) }
        });

        this.transform.position = new Vec3(0, 1.5, -6.5);
    }
}