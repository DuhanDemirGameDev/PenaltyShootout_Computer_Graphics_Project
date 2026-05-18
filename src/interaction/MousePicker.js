import { Vec3 } from "../math/Vec3.js";
import { Mat4 } from "../math/Mat4.js";

export class MousePicker {
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

    static intersectSphere(rayOrigin, rayDir, sphereCenter, sphereRadius) {
        const oc = new Vec3(rayOrigin.x - sphereCenter.x, rayOrigin.y - sphereCenter.y, rayOrigin.z - sphereCenter.z);
        const a = rayDir.dot(rayDir);
        const b = 2.0 * oc.dot(rayDir);
        const c = oc.dot(oc) - (sphereRadius * sphereRadius);
        return (b * b - 4 * a * c) > 0;
    }

    // Topun tam neresine tıkladığımızı bulan fonksiyon
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