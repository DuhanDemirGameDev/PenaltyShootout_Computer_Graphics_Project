import { WebGLApp } from "./core/WebGLApp.js";
import { ShaderProgram } from "./core/ShaderProgram.js";
import { Mat4 } from "./math/Mat4.js";
import { Transform } from "./math/Transform.js";
import { Vec3 } from "./math/Vec3.js";

const basicVertexShaderSourceWebGL2 = `#version 300 es
precision highp float;

in vec3 aPosition;

void main() {
  gl_Position = vec4(aPosition, 1.0);
}
`;

const basicFragmentShaderSourceWebGL2 = `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  fragColor = vec4(0.95, 0.95, 1.0, 1.0);
}
`;

const basicVertexShaderSourceWebGL1 = `
precision highp float;

attribute vec3 aPosition;

void main() {
  gl_Position = vec4(aPosition, 1.0);
}
`;

const basicFragmentShaderSourceWebGL1 = `
precision highp float;

void main() {
  gl_FragColor = vec4(0.95, 0.95, 1.0, 1.0);
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

    shader.use();
    app.clear();

    console.info(
      `Penalty Shootout Simulator initialized with ${app.isWebGL2 ? "WebGL2" : "WebGL1"}.`
    );
    console.info("Basic shader program compiled and linked successfully.");

    const startPosition = new Vec3(1, 2, 3);
    const translation = Mat4.translation(4, 5, 6);
    const translatedPosition = translation.transformVec3(startPosition);

    console.info(
      `Math test: ${startPosition.toString()} translated by (4, 5, 6) = ${translatedPosition.toString()}`
    );

    const torsoTransform = new Transform();
    torsoTransform.position = new Vec3(0, 1.5, -5);

    const armTransform = new Transform();
    armTransform.position = new Vec3(1, 0, 0);

    torsoTransform.addChild(armTransform);
    torsoTransform.updateWorldMatrix();

    const armWorldOrigin = armTransform.worldMatrix.transformVec3(new Vec3(0, 0, 0));

    console.info(
      `Transform hierarchy test: arm local origin in world space = ${armWorldOrigin.toString()}`
    );
  } catch (error) {
    console.error("Failed to initialize Penalty Shootout Simulator.", error);
  }
}

main();
