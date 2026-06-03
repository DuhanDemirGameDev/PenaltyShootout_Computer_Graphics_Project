import { GameObject } from "../core/GameObject.js";
import { Plane } from "../geometry/Plane.js";
import { Vec3 } from "../math/Vec3.js";
import { TextureLoader } from "../utils/TextureLoader.js";
import { Cuboid } from "../geometry/Cuboid.js";

/**
 * Builds the textured pitch surface and all painted field markings.
 */
export class Ground extends GameObject {
  /**
   * Creates the grass plane, boundary lines, penalty box, and penalty arc.
   *
   * @param {WebGLRenderingContext|WebGL2RenderingContext} gl - Rendering context.
   */
  constructor(gl) {
    super({ name: "Ground Root" });

    this.childrenObjects = [];

    const textureLoader = new TextureLoader(gl);
    const grassTexture = textureLoader.loadTexture("assets/textures/grass.jpg");

    const grass = new GameObject({
      name: "Grass Plane",
      geometry: new Plane(gl, 20, 20, 1),
      material: { color: new Vec3(1, 1, 1), texture: grassTexture, useTexture: true }
    });
    this.transform.addChild(grass.transform);
    this.childrenObjects.push(grass);

    const lineMat = { color: new Vec3(1, 1, 1), useTexture: false };
    const lineY = 0.01;
    const t = 0.15;
    const lines = [];

    const boxFront = new GameObject({ name: "Box Front", geometry: new Cuboid(gl, 10, 0.02, t), material: lineMat });
    boxFront.transform.position = new Vec3(0, lineY, 1.5);

    const boxLeft = new GameObject({ name: "Box Left", geometry: new Cuboid(gl, t, 0.02, 8.5), material: lineMat });
    boxLeft.transform.position = new Vec3(-5, lineY, -2.75);

    const boxRight = new GameObject({ name: "Box Right", geometry: new Cuboid(gl, t, 0.02, 8.5), material: lineMat });
    boxRight.transform.position = new Vec3(5, lineY, -2.75);

    const smallFront = new GameObject({ name: "Small Box Front", geometry: new Cuboid(gl, 6, 0.02, t), material: lineMat });
    smallFront.transform.position = new Vec3(0, lineY, -1.5);

    const smallLeft = new GameObject({ name: "Small Box Left", geometry: new Cuboid(gl, t, 0.02, 5.5), material: lineMat });
    smallLeft.transform.position = new Vec3(-3, lineY, -4.25);

    const smallRight = new GameObject({ name: "Small Box Right", geometry: new Cuboid(gl, t, 0.02, 5.5), material: lineMat });
    smallRight.transform.position = new Vec3(3, lineY, -4.25);

    const penaltySpot = new GameObject({ name: "Penalty Spot", geometry: new Cuboid(gl, 0.4, 0.02, 0.4), material: lineMat });
    penaltySpot.transform.position = new Vec3(0, lineY, 0);

    const goalLine = new GameObject({ name: "Goal Line", geometry: new Cuboid(gl, 10, 0.02, t), material: lineMat });
    goalLine.transform.position = new Vec3(0, lineY, -7);

    lines.push(boxFront, boxLeft, boxRight, smallFront, smallLeft, smallRight, penaltySpot, goalLine);

    // Outer pitch lines are inset slightly so they remain visible near the ad boards.
    const pitchWidth = 19.0;

    const outerLeft = new GameObject({ name: "Outer Left", geometry: new Cuboid(gl, t, 0.02, pitchWidth), material: lineMat });
    outerLeft.transform.position = new Vec3(-9.5, lineY, 0);

    const outerRight = new GameObject({ name: "Outer Right", geometry: new Cuboid(gl, t, 0.02, pitchWidth), material: lineMat });
    outerRight.transform.position = new Vec3(9.5, lineY, 0);

    const outerFront = new GameObject({ name: "Outer Front", geometry: new Cuboid(gl, pitchWidth + 0.15, 0.02, t), material: lineMat });
    outerFront.transform.position = new Vec3(0, lineY, 9.5);

    const outerBack = new GameObject({ name: "Outer Back", geometry: new Cuboid(gl, pitchWidth + 0.15, 0.02, t), material: lineMat });
    outerBack.transform.position = new Vec3(0, lineY, -9.5);

    lines.push(outerLeft, outerRight, outerFront, outerBack);

    // Build the penalty arc from short cuboid segments tangent to a semicircle.
    const arcRadius = 2.5;
    const numSegments = 16;
    // The arc begins beyond the penalty-box front line at z = 1.5.
    const startAngle = Math.asin(1.5 / arcRadius);
    const endAngle = Math.PI - startAngle;
    const angleStep = (endAngle - startAngle) / numSegments;

    for (let i = 0; i < numSegments; i++) {
      const theta1 = startAngle + i * angleStep;
      const theta2 = startAngle + (i + 1) * angleStep;

      const midTheta = (theta1 + theta2) / 2;
      const x = arcRadius * Math.cos(midTheta);
      const z = arcRadius * Math.sin(midTheta);

      const dx = arcRadius * Math.cos(theta2) - arcRadius * Math.cos(theta1);
      const dz = arcRadius * Math.sin(theta2) - arcRadius * Math.sin(theta1);
      const segLength = Math.sqrt(dx * dx + dz * dz) + 0.05;

      const segment = new GameObject({
        name: `Arc Segment ${i}`,
        geometry: new Cuboid(gl, t, 0.02, segLength),
        material: lineMat
      });

      segment.transform.position = new Vec3(x, lineY, z);
      segment.transform.rotation.y = Math.atan2(dx, dz);

      lines.push(segment);
    }

    for (const line of lines) {
      this.transform.addChild(line.transform);
      this.childrenObjects.push(line);
    }

    this.geometry = null;
  }

  /**
   * Renders the pitch and its child marking meshes.
   *
   * @param {WebGLRenderingContext|WebGL2RenderingContext} gl - Rendering context.
   * @param {ShaderProgram} shaderProgram - Active shader program wrapper.
   * @param {Camera} camera - Active camera.
   * @returns {?Mat4} World matrix of the root transform.
   */
  render(gl, shaderProgram, camera) {
    if (!this.visible) {
      return null;
    }

    this.transform.updateWorldMatrix();

    for (const child of this.childrenObjects) {
      child.render(gl, shaderProgram, camera);
    }

    return this.transform.worldMatrix;
  }
}
