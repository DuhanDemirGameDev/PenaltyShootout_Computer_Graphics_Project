import { Vec3 } from "../math/Vec3.js";
import { Mat4 } from "../math/Mat4.js";

/**
 * Converts screen-space mouse input into world-space picking queries.
 */
export class MousePicker {
    /**
     * Builds a normalized world-space ray direction from normalized device coordinates.
     *
     * The method applies the inverse projection and inverse view matrices to move
     * from clip space back into the camera/world basis used by the scene.
     *
     * @param {number} ndcX - Mouse X in normalized device coordinates.
     * @param {number} ndcY - Mouse Y in normalized device coordinates.
     * @param {Mat4} viewMatrix - Current camera view matrix.
     * @param {Mat4} projectionMatrix - Current camera projection matrix.
     * @returns {Vec3} Normalized ray direction in world space.
     */
    static calculateRayDirection(ndcX, ndcY, viewMatrix, projectionMatrix) {
        const invProj = Mat4.invert(projectionMatrix);
        const invView = Mat4.invert(viewMatrix);

        const p = invProj.elements;
        const v = invView.elements;

        const eyeX = p[0] * ndcX + p[4] * ndcY + p[8] * -1.0 + p[12] * 1.0;
        const eyeY = p[1] * ndcX + p[5] * ndcY + p[9] * -1.0 + p[13] * 1.0;

        const dirX = v[0] * eyeX + v[4] * eyeY + v[8] * -1.0;
        const dirY = v[1] * eyeX + v[5] * eyeY + v[9] * -1.0;
        const dirZ = v[2] * eyeX + v[6] * eyeY + v[10] * -1.0;

        return new Vec3(dirX, dirY, dirZ).normalize();
    }

    /**
     * Tests whether a ray intersects a sphere.
     *
     * @param {Vec3} rayOrigin - Ray origin in world space.
     * @param {Vec3} rayDir - Normalized ray direction.
     * @param {Vec3} sphereCenter - Sphere center in world space.
     * @param {number} sphereRadius - Sphere radius.
     * @returns {boolean} True when the ray hits the sphere.
     */
    static intersectSphere(rayOrigin, rayDir, sphereCenter, sphereRadius) {
        const oc = new Vec3(rayOrigin.x - sphereCenter.x, rayOrigin.y - sphereCenter.y, rayOrigin.z - sphereCenter.z);
        const a = rayDir.dot(rayDir);
        const b = 2.0 * oc.dot(rayDir);
        const c = oc.dot(oc) - (sphereRadius * sphereRadius);
        return (b * b - 4 * a * c) > 0;
    }

    /**
     * Returns the closest ray-sphere hit point.
     *
     * This is used to determine which region of the ball was clicked, allowing
     * the gameplay system to derive side spin and vertical spin from the hit offset.
     *
     * @param {Vec3} rayOrigin - Ray origin in world space.
     * @param {Vec3} rayDir - Normalized ray direction.
     * @param {Vec3} sphereCenter - Sphere center in world space.
     * @param {number} sphereRadius - Sphere radius.
     * @returns {Vec3 | null} Closest intersection point, or null when there is no hit.
     */
    static getIntersectionPoint(rayOrigin, rayDir, sphereCenter, sphereRadius) {
        const oc = new Vec3(rayOrigin.x - sphereCenter.x, rayOrigin.y - sphereCenter.y, rayOrigin.z - sphereCenter.z);
        const a = rayDir.dot(rayDir);
        const b = 2.0 * oc.dot(rayDir);
        const c = oc.dot(oc) - (sphereRadius * sphereRadius);
        const discriminant = b * b - 4 * a * c;

        if (discriminant > 0) {
            const t = (-b - Math.sqrt(discriminant)) / (2.0 * a);
            return new Vec3(rayOrigin.x + rayDir.x * t, rayOrigin.y + rayDir.y * t, rayOrigin.z + rayDir.z * t);
        }
        return null;
    }
}
