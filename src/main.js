import { WebGLApp } from "./core/WebGLApp.js";
import { GameObject } from "./core/GameObject.js";
import { ShaderProgram } from "./core/ShaderProgram.js";
import { Sphere } from "./geometry/Sphere.js";
import { Mat4 } from "./math/Mat4.js";
import { Transform } from "./math/Transform.js";
import { Vec3 } from "./math/Vec3.js";

const basicVertexShaderSourceWebGL2 = `#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uModelMatrix;

out vec3 vNormal;

void main() {
  vNormal = aNormal;
  gl_Position = uModelMatrix * vec4(aPosition, 1.0);
}
`;

const basicFragmentShaderSourceWebGL2 = `#version 300 es
precision highp float;

out vec4 fragColor;

in vec3 vNormal;

void main() {
  vec3 normalColor = normalize(vNormal) * 0.5 + 0.5;
  fragColor = vec4(normalColor, 1.0);
}
`;

const basicVertexShaderSourceWebGL1 = `
precision highp float;

attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModelMatrix;

varying vec3 vNormal;

void main() {
  vNormal = aNormal;
  gl_Position = uModelMatrix * vec4(aPosition, 1.0);
}
`;

const basicFragmentShaderSourceWebGL1 = `
precision highp float;

varying vec3 vNormal;

void main() {
  vec3 normalColor = normalize(vNormal) * 0.5 + 0.5;
  gl_FragColor = vec4(normalColor, 1.0);
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

    const dummyParent = new GameObject({ name: "Dummy Parent" });
    const dummyChild = new GameObject({ name: "Dummy Child" });

    dummyParent.transform.position = new Vec3(0, 0.5, -2);
    dummyChild.transform.position = new Vec3(0.25, 0, 0);
    dummyParent.transform.addChild(dummyChild.transform);

    dummyParent.update(0);
    dummyChild.update(0);
    dummyParent.render(app.gl, shader, null);

    const dummyChildWorldOrigin = dummyChild.transform.worldMatrix.transformVec3(new Vec3(0, 0, 0));

    console.info(
      `GameObject test: ${dummyChild.name} world origin = ${dummyChildWorldOrigin.toString()}`
    );

    const sphereObject = new GameObject({
      name: "Generated Sphere",
      geometry: new Sphere(app.gl, 0.55, 32, 16),
    });

    sphereObject.render(app.gl, shader, null);

    console.info("Geometry test: mathematically generated sphere rendered successfully.");
  } catch (error) {
    console.error("Failed to initialize Penalty Shootout Simulator.", error);
  }
}

main();
