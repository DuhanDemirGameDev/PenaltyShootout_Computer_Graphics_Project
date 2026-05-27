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
import { TextureLoader } from "./utils/TextureLoader.js";
import { Ground } from "./objects/Ground.js";
import { Ball } from "./objects/Ball.js";
import { GoalPost } from "./objects/GoalPost.js";

const basicVertexShaderSourceWebGL2 = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec2 aUv;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 vUv;

void main() {
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
  vUv = aUv;
}
`;

const basicFragmentShaderSourceWebGL2 = `#version 300 es
precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform vec3 uColor;
uniform sampler2D uTexture;
uniform bool uUseTexture;

void main() {
  if (uUseTexture) {
      fragColor = texture(uTexture, vUv); // Resim varsa ilgili pikseli al
  } else {
      fragColor = vec4(uColor, 1.0); // Yoksa düz renk kullan
  }
}
`;

const basicVertexShaderSourceWebGL1 = `
precision highp float;

attribute vec3 aPosition;
attribute vec2 aUv

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec2 vUv;

void main() {
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
  vUv = aUv;
}
`;

const basicFragmentShaderSourceWebGL1 = `
precision highp float;

varying vec2 vUv;

uniform vec3 uColor;

uniform sampler2D uTexture;
uniform bool uUseTexture;

void main() {
  if (uUseTexture) {
      gl_FragColor = texture2D(uTexture, vUv);
  } else {
      gl_FragColor = vec4(uColor, 1.0);
  }
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

    //AĞ için eklenen WebGL Şeffaflık kodu
    app.gl.enable(app.gl.BLEND);
    app.gl.blendFunc(app.gl.SRC_ALPHA, app.gl.ONE_MINUS_SRC_ALPHA);

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
    // Add every visible GameOb
    // ject to the Scene with scene.add(...).
    // ============================================================

    const textureLoader = new TextureLoader(app.gl);
    const grassTexture = textureLoader.loadTexture("assets/textures/grass.jpg");
    const ground = new Ground(app.gl, grassTexture);
    scene.add(ground);

    const ballTexture = textureLoader.loadTexture("assets/textures/football.jpg");
    const ball = new Ball(app.gl, ballTexture);
    scene.add(ball);

    const netTexture = textureLoader.loadTexture("assets/textures/net.png");
    
    const goal = new GoalPost(app.gl, netTexture);
    goal.transform.position = new Vec3(0, 0, -7); 
    scene.add(goal);

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
