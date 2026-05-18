import { WebGLApp } from "./core/WebGLApp.js";
import { Camera } from "./core/Camera.js";
import { GameObject } from "./core/GameObject.js";
import { Scene } from "./core/Scene.js";
import { ShaderProgram } from "./core/ShaderProgram.js";
import { Time } from "./core/Time.js";
import { Cylinder } from "./geometry/Cylinder.js";
import { Plane } from "./geometry/Plane.js";
import { Sphere } from "./geometry/Sphere.js";
import { InputManager } from "./interaction/InputManager.js";
import { Vec3 } from "./math/Vec3.js";

const basicVertexShaderSourceWebGL2 = `#version 300 es
precision highp float;

in vec3 aPosition;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
`;

const basicFragmentShaderSourceWebGL2 = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec3 uColor;

void main() {
  fragColor = vec4(uColor, 1.0);
}
`;

const basicVertexShaderSourceWebGL1 = `
precision highp float;

attribute vec3 aPosition;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
}
`;

const basicFragmentShaderSourceWebGL1 = `
precision highp float;

uniform vec3 uColor;

void main() {
  gl_FragColor = vec4(uColor, 1.0);
}
`;

function main() {
  try {
    const app = new WebGLApp("glCanvas");
    const vertexSource = app.isWebGL2
      ? basicVertexShaderSourceWebGL2
      : basicVertexShaderSourceWebGL1;
    const fragmentSource = app.isWebGL2
      ? basicFragmentShaderSourceWebGL2
      : basicFragmentShaderSourceWebGL1;

    const shader = new ShaderProgram(
      app.gl,
      vertexSource,
      fragmentSource
    );
    const camera = new Camera({
      position: new Vec3(0, 5, 12),
      target: new Vec3(0, 0, 0),
      aspectRatio: app.canvas.width / app.canvas.height,
    });
    const scene = new Scene({ camera });
    const time = new Time();
    const input = new InputManager(app.canvas);

    shader.use();
    app.clear();
    shader.setMat4("uViewMatrix", camera.getViewMatrix().elements);
    shader.setMat4("uProjectionMatrix", camera.getProjectionMatrix().elements);

    console.info(
      `Penalty Shootout Simulator initialized with ${app.isWebGL2 ? "WebGL2" : "WebGL1"}.`
    );
    console.info("Solid-color shader program compiled and linked successfully.");

    // ============================================================
    // === ZEYNEP'S AREA: MODELING & HIERARCHY ====================
    // Create scene objects here: ground, ball, goalpost, stadium
    // lights, goalkeeper body parts, and parent-child transforms.
    // Add every visible GameObject to the Scene with scene.add(...).
    // ============================================================

    const ground = new GameObject({
      name: "Ground",
      geometry: new Plane(app.gl, 20, 20, 1),
      material: { color: new Vec3(0.08, 0.45, 0.15) },
    });
    ground.transform.position = new Vec3(0, 0, 0);

    const ball = new GameObject({
      name: "Ball",
      geometry: new Sphere(app.gl, 0.5, 32, 16),
      material: { color: new Vec3(0.95, 0.95, 0.9) },
    });
    ball.transform.position = new Vec3(0, 0.5, 3);

    const leftGoalpost = new GameObject({
      name: "Left Goalpost",
      geometry: new Cylinder(app.gl, 0.1, 3, 24),
      material: { color: new Vec3(0.85, 0.85, 0.82) },
    });
    leftGoalpost.transform.position = new Vec3(-2.5, 1.5, -7);

    const rightGoalpost = new GameObject({
      name: "Right Goalpost",
      geometry: new Cylinder(app.gl, 0.1, 3, 24),
      material: { color: new Vec3(0.85, 0.85, 0.82) },
    });
    rightGoalpost.transform.position = new Vec3(2.5, 1.5, -7);

    scene.add(ground);
    scene.add(ball);
    scene.add(leftGoalpost);
    scene.add(rightGoalpost);

    const animate = (timestamp) => {
      time.update(timestamp);

      camera.updateAspectRatio(app.canvas.width, app.canvas.height);

      // ============================================================
      // === BARIS'S AREA: INPUT, PHYSICS & ANIMATION ===============
      // Read input here, then update gameplay systems such as mouse
      // picking, target movement, ball trajectory, goalkeeper dive,
      // collision checks, and save/goal state.
      // ============================================================

      if (input.wasKeyPressed("Space")) {
        console.info("Input test: Space key pressed.");
      }

      if (input.wasMouseClicked()) {
        const mouse = input.getMousePosition();
        console.info(
          `Input test: mouse click at canvas (${mouse.x.toFixed(1)}, ${mouse.y.toFixed(1)}), NDC (${mouse.ndcX.toFixed(3)}, ${mouse.ndcY.toFixed(3)}).`
        );
      }

      app.clear();
      shader.use();
      scene.update(time.deltaTime);
      scene.render(app.gl, shader);
      input.endFrame();

      requestAnimationFrame(animate);
    };

    console.info("Minimal test scene assembled: ground, ball, and dummy goalposts added to Scene.");
    console.info("Render loop started: Time is updating the scene every animation frame.");
    console.info("Input test ready: press Space or click the canvas.");

    requestAnimationFrame(animate);
  } catch (error) {
    console.error("Failed to initialize Penalty Shootout Simulator.", error);
  }
}

main();
