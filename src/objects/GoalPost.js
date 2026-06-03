import { GameObject } from "../core/GameObject.js";
import { Cylinder } from "../geometry/Cylinder.js";
import { Plane } from "../geometry/Plane.js";
import { Vec3 } from "../math/Vec3.js";
import { TextureLoader } from "../utils/TextureLoader.js";

/**
 * Builds the goal frame and textured net assembly.
 */
export class GoalPost extends GameObject {
  /**
   * Creates the posts, crossbar, and net planes.
   *
   * @param {WebGLRenderingContext|WebGL2RenderingContext} gl - Rendering context.
   */
  constructor(gl) {
    super({ name: "GoalPost Root" });

    const postRadius = 0.1;
    const postHeight = 3.0;
    const crossbarWidth = 7.32;
    const netDepth = 2.0;

    const postMaterial = { color: new Vec3(0.9, 0.9, 0.9) };

    const textureLoader = new TextureLoader(gl);
    const netTexture = textureLoader.loadTexture("assets/textures/net.png");
    const netMaterial = {
      color: new Vec3(1, 1, 1),
      texture: netTexture,
      useTexture: true
    };

    const leftPost = new GameObject({
      name: "Left Post",
      geometry: new Cylinder(gl, postRadius, postHeight, 24),
      material: postMaterial,
    });
    leftPost.transform.position = new Vec3(-crossbarWidth / 2, postHeight / 2, 0);

    const rightPost = new GameObject({
      name: "Right Post",
      geometry: new Cylinder(gl, postRadius, postHeight, 24),
      material: postMaterial,
    });
    rightPost.transform.position = new Vec3(crossbarWidth / 2, postHeight / 2, 0);

    const crossbar = new GameObject({
      name: "Crossbar",
      geometry: new Cylinder(gl, postRadius, crossbarWidth + (postRadius * 2), 24),
      material: postMaterial,
    });
    // The cylinder generator is vertical by default; rotate it to form the crossbar.
    crossbar.transform.position = new Vec3(0, postHeight, 0);
    crossbar.transform.rotation.z = Math.PI / 2;

    const backNet = new GameObject({
      name: "Back Net",
      geometry: new Plane(gl, crossbarWidth, postHeight, 1),
      material: netMaterial,
    });

    backNet.transform.position = new Vec3(0, postHeight / 2, -netDepth);
    backNet.transform.rotation.x = Math.PI / 2;

    const leftNet = new GameObject({
      name: "Left Net",
      geometry: new Plane(gl, netDepth, postHeight, 1),
      material: netMaterial,
    });
    leftNet.transform.position = new Vec3(-crossbarWidth / 2, postHeight / 2, -netDepth / 2);
    leftNet.transform.rotation.x = Math.PI / 2;
    leftNet.transform.rotation.y = Math.PI / 2;

    const rightNet = new GameObject({
      name: "Right Net",
      geometry: new Plane(gl, netDepth, postHeight, 1),
      material: netMaterial,
    });
    rightNet.transform.position = new Vec3(crossbarWidth / 2, postHeight / 2, -netDepth / 2);
    rightNet.transform.rotation.x = Math.PI / 2;
    rightNet.transform.rotation.y = -Math.PI / 2;

    const topNet = new GameObject({
      name: "Top Net",
      geometry: new Plane(gl, crossbarWidth, netDepth, 1),
      material: netMaterial,
    });
    topNet.transform.position = new Vec3(0, postHeight, -netDepth / 2);

    // Parent all goal components so the full structure can move as one object.
    this.transform.addChild(leftPost.transform);
    this.transform.addChild(rightPost.transform);
    this.transform.addChild(crossbar.transform);
    this.transform.addChild(backNet.transform);
    this.transform.addChild(leftNet.transform);
    this.transform.addChild(rightNet.transform);
    this.transform.addChild(topNet.transform);

    this.childrenObjects = [leftPost, rightPost, crossbar, backNet, leftNet, rightNet, topNet];

    this.transform.position = new Vec3(0, 0, -7);
    this.geometry = null;
  }

  /**
   * Renders each goal component because the root object is only a transform.
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
