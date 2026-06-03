import { GameObject } from "../core/GameObject.js";
import { Cuboid } from "../geometry/Cuboid.js";
import { Sphere } from "../geometry/Sphere.js";
import { Vec3 } from "../math/Vec3.js";

export class Goalkeeper extends GameObject {
  constructor(gl) {
    super({ name: "Goalkeeper Root" });

    const jerseyMaterial = { color: new Vec3(0.1, 0.2, 0.8) };
    const skinMaterial = { color: new Vec3(0.9, 0.75, 0.6) };
    const shortsMaterial = { color: new Vec3(0.1, 0.1, 0.1) };
    const gloveMaterial = { color: new Vec3(0.2, 0.2, 0.2) };
    const shoeMaterial = { color: new Vec3(0.8, 0.9, 0.1) };

    const torsoW = 0.75, torsoH = 0.9, torsoD = 0.3;
    const legW = 0.28, legH = 0.95, legD = 0.25;
    const armW = 0.20, armH = 1.0, armD = 0.20;
    const headRadius = 0.23;

    // Position the torso so the shoes rest exactly on the ground plane.
    const calculatedTorsoY = legH + (torsoH / 2) + 0.15;

    const torso = new GameObject({
      name: "Torso",
      geometry: new Cuboid(gl, torsoW, torsoH, torsoD),
      material: jerseyMaterial,
    });
    torso.transform.position = new Vec3(0, calculatedTorsoY, 0);

    const head = new GameObject({
      name: "Head",
      geometry: new Sphere(gl, headRadius, 16, 16),
      material: skinMaterial,
    });
    head.transform.position = new Vec3(0, (torsoH / 2) + headRadius, 0);

    // Left arm hierarchy: shoulder -> arm -> glove.
    const leftShoulder = new GameObject({ name: "Left Shoulder" });
    leftShoulder.transform.position = new Vec3(-(torsoW / 2 + armW / 2) - 0.01, (torsoH / 2) - 0.1, 0);

    const leftArm = new GameObject({
      name: "Left Arm", geometry: new Cuboid(gl, armW, armH, armD), material: skinMaterial,
    });
    leftArm.transform.position = new Vec3(0, -(armH / 2), 0);
    
    const leftGlove = new GameObject({
      name: "Left Glove", geometry: new Cuboid(gl, armW + 0.06, 0.25, armD + 0.06), material: gloveMaterial,
    });
    leftGlove.transform.position = new Vec3(0, -(armH / 2 + 0.125), 0);

    leftShoulder.transform.addChild(leftArm.transform);
    leftArm.transform.addChild(leftGlove.transform);


    // Right arm hierarchy: shoulder -> arm -> glove.
    const rightShoulder = new GameObject({ name: "Right Shoulder" });
    rightShoulder.transform.position = new Vec3((torsoW / 2 + armW / 2) + 0.01, (torsoH / 2) - 0.1, 0);

    const rightArm = new GameObject({
      name: "Right Arm", geometry: new Cuboid(gl, armW, armH, armD), material: skinMaterial,
    });
    rightArm.transform.position = new Vec3(0, -(armH / 2), 0);

    const rightGlove = new GameObject({
      name: "Right Glove", geometry: new Cuboid(gl, armW + 0.06, 0.25, armD + 0.06), material: gloveMaterial,
    });
    rightGlove.transform.position = new Vec3(0, -(armH / 2 + 0.125), 0);

    rightShoulder.transform.addChild(rightArm.transform);
    rightArm.transform.addChild(rightGlove.transform);


    // Left leg hierarchy: hip -> leg -> shoe.
    const leftHip = new GameObject({ name: "Left Hip" });
    leftHip.transform.position = new Vec3(-0.18, -(torsoH / 2), 0);

    const leftLeg = new GameObject({
      name: "Left Leg", geometry: new Cuboid(gl, legW, legH, legD), material: shortsMaterial,
    });
    leftLeg.transform.position = new Vec3(0, -(legH / 2), 0);

    const leftShoe = new GameObject({
      name: "Left Shoe", geometry: new Cuboid(gl, legW + 0.02, 0.15, legD + 0.1), material: shoeMaterial,
    });
    leftShoe.transform.position = new Vec3(0, -(legH / 2 + 0.075), 0.05);

    leftHip.transform.addChild(leftLeg.transform);
    leftLeg.transform.addChild(leftShoe.transform);


    // Right leg hierarchy: hip -> leg -> shoe.
    const rightHip = new GameObject({ name: "Right Hip" });
    rightHip.transform.position = new Vec3(0.18, -(torsoH / 2), 0);

    const rightLeg = new GameObject({
      name: "Right Leg", geometry: new Cuboid(gl, legW, legH, legD), material: shortsMaterial,
    });
    rightLeg.transform.position = new Vec3(0, -(legH / 2), 0);

    const rightShoe = new GameObject({
      name: "Right Shoe", geometry: new Cuboid(gl, legW + 0.02, 0.15, legD + 0.1), material: shoeMaterial,
    });
    rightShoe.transform.position = new Vec3(0, -(legH / 2 + 0.075), 0.05);

    rightHip.transform.addChild(rightLeg.transform);
    rightLeg.transform.addChild(rightShoe.transform);

    // The torso acts as the central parent for all articulated joints.
    this.transform.addChild(torso.transform);
    torso.transform.addChild(head.transform);
    torso.transform.addChild(leftShoulder.transform);  
    torso.transform.addChild(rightShoulder.transform);
    torso.transform.addChild(leftHip.transform); 
    torso.transform.addChild(rightHip.transform);

    this.childrenObjects = [torso, head, leftArm, leftGlove, rightArm, rightGlove, leftLeg, leftShoe, rightLeg, rightShoe];

    this.joints = {
      torso,
      head,
      leftShoulder,
      rightShoulder,
      leftHip,
      rightHip,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg
    };

    // Place the goalkeeper slightly in front of the goal line.
    this.transform.position = new Vec3(0, 0, -6.3);
    this.geometry = null;

    this.setDiveProgress(0, this.transform.position, this.transform.position);
  }

  /**
   * Updates the goalkeeper's dive pose through root motion and joint rotations.
   *
   * @param {number} t - Normalized progress from 0.0 to 1.0.
   * @param {Vec3} start - Starting root position.
   * @param {Vec3} target - Target root position.
   */
  setDiveProgress(t, start, target) {
    if (t === 0) {
      // Ready stance.
      this.transform.position.x = start.x;
      this.transform.position.y = 0;
      this.transform.rotation = new Vec3(0, 0, 0);

      // A slight crouch and open shoulders give the keeper a prepared stance.
      this.joints.torso.transform.rotation = new Vec3(0.15, 0, 0);
      this.joints.head.transform.rotation = new Vec3(-0.05, 0, 0);
      this.joints.leftShoulder.transform.rotation = new Vec3(0.1, 0, 0.35);
      this.joints.rightShoulder.transform.rotation = new Vec3(0.1, 0, -0.35);
      this.joints.leftHip.transform.rotation = new Vec3(-0.25, 0, 0);
      this.joints.rightHip.transform.rotation = new Vec3(-0.25, 0, 0);
      return;
    }

    const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);

    // Horizontal movement accelerates quickly toward the chosen save target.
    const tX = easeOutQuad(t);
    const x = start.x + (target.x - start.x) * tX;

    // Vertical motion first compresses the body, then follows a jump arc.
    let y = 0;
    const crouchDuration = 0.15;
    if (t < crouchDuration) {
      const cp = t / crouchDuration;
      y = -0.32 * Math.sin(cp * Math.PI);

      // The crouch phase bends the torso and hips before takeoff.
      this.joints.torso.transform.rotation = new Vec3(0.15 + 0.22 * cp, 0, 0);
      this.joints.head.transform.rotation = new Vec3(-0.05 - 0.03 * cp, 0, 0);
      this.joints.leftHip.transform.rotation = new Vec3(-0.25 - 0.3 * cp, 0, 0);
      this.joints.rightHip.transform.rotation = new Vec3(-0.25 - 0.3 * cp, 0, 0);
      this.joints.leftShoulder.transform.rotation = new Vec3(0.1, 0, 0.35 + 0.18 * cp);
      this.joints.rightShoulder.transform.rotation = new Vec3(0.1, 0, -0.35 - 0.18 * cp);
      
      this.transform.rotation = new Vec3(0, 0, 0);
    } else {
      const lp = (t - crouchDuration) / (1 - crouchDuration);
      
      // Combine target elevation with a temporary flight arc.
      const baseHeight = 0 + (target.y - 0) * lp;
      const jumpArc = Math.sin(lp * Math.PI) * 0.9;
      y = baseHeight + jumpArc;

      // Roll the whole body into the dive direction.
      const direction = target.x - start.x;
      const diveAngle = direction * 0.45;
      this.transform.rotation = new Vec3(0, 0, -diveAngle * lp);

      // The torso rotates slightly toward the save direction for a natural reach.
      this.joints.torso.transform.rotation = new Vec3(0.1 * lp, direction * 0.12 * lp, 0);
      this.joints.head.transform.rotation = new Vec3(0, 0, 0);

      // Shoulder X rotation reaches forward; shoulder Z rotation opens the arms laterally.
      if (direction < -0.2) {
        // Left dive: lead with the left arm while the right arm balances the pose.
        this.joints.leftShoulder.transform.rotation = new Vec3(
          -Math.PI * 0.20 * lp,
           0,
           Math.PI * 0.55 * lp
        );
        this.joints.rightShoulder.transform.rotation = new Vec3(
           Math.PI * 0.10 * lp,
           0,
          -Math.PI * 0.30 * lp
        );

        this.joints.leftHip.transform.rotation  = new Vec3(-0.15 * lp, 0, -0.25 * lp);
        this.joints.rightHip.transform.rotation = new Vec3(-0.35 * lp, 0, -0.40 * lp);

      } else if (direction > 0.2) {
        // Right dive: mirror the left-dive pose.
        this.joints.rightShoulder.transform.rotation = new Vec3(
          -Math.PI * 0.20 * lp,
           0,
          -Math.PI * 0.55 * lp
        );
        this.joints.leftShoulder.transform.rotation = new Vec3(
           Math.PI * 0.10 * lp,
           0,
           Math.PI * 0.30 * lp
        );

        this.joints.rightHip.transform.rotation = new Vec3(-0.15 * lp, 0,  0.25 * lp);
        this.joints.leftHip.transform.rotation  = new Vec3(-0.35 * lp, 0,  0.40 * lp);

      } else {
        // Central jump: raise both arms symmetrically.
        this.joints.leftShoulder.transform.rotation = new Vec3(
          -Math.PI * 0.30 * lp,
           0,
           Math.PI * 0.50 * lp
        );
        this.joints.rightShoulder.transform.rotation = new Vec3(
          -Math.PI * 0.30 * lp,
           0,
          -Math.PI * 0.50 * lp
        );

        this.joints.leftHip.transform.rotation  = new Vec3(-0.20 * lp, 0, -0.15 * lp);
        this.joints.rightHip.transform.rotation = new Vec3(-0.20 * lp, 0,  0.15 * lp);
      }
    }

    this.transform.position.x = x;
    this.transform.position.y = y;
  }

  render(gl, shaderProgram, camera) {
    if (!this.visible) return null;
    this.transform.updateWorldMatrix();
    for (const child of this.childrenObjects) {
      child.render(gl, shaderProgram, camera);
    }
    return this.transform.worldMatrix;
  }
}
