/**
 * Stores renderable objects and lights, then coordinates scene-level rendering.
 */
export class Scene {
  constructor({ camera = null } = {}) {
    this.objects = [];
    this.lights = [];
    this.camera = camera;
  }

  add(object) {
    this.objects.push(object);
    return object;
  }

  addLight(light) {
    this.lights.push(light);
    return light;
  }

  update(deltaTime) {
    for (const object of this.objects) {
      object.update?.(deltaTime);
    }
  }

  /**
   * Uploads light and camera uniforms required by the active lighting shader.
   *
   * @param {ShaderProgram} shaderProgram - Active shader program.
   */
  _applyLightUniforms(shaderProgram) {
    shaderProgram.setInt("uNumLights", this.lights.length);

    for (let i = 0; i < this.lights.length; i++) {
      this.lights[i].setUniforms(shaderProgram, i);
    }

    // A single UI slider controls the shared intensity value.
    if (this.lights.length > 0) {
      shaderProgram.setFloat("uLightIntensity", this.lights[0].intensity);
    }

    // The camera position is required for specular reflection.
    if (this.camera) {
      shaderProgram.setVec3("uCameraPos", this.camera.position);
    }
  }

  /**
   * Renders the scene from the camera view using the supplied shader.
   */
  render(gl, shaderProgram) {
    if (this.camera && shaderProgram) {
      shaderProgram.setMat4("uViewMatrix", this.camera.getViewMatrix().elements);
      shaderProgram.setMat4("uProjectionMatrix", this.camera.getProjectionMatrix().elements);
      this._applyLightUniforms(shaderProgram);
    }

    for (const object of this.objects) {
      object.render?.(gl, shaderProgram, this.camera);
    }
  }

  /**
   * Renders only geometry depth from the active light's point of view.
   */
  renderDepthPass(gl, depthShader) {
    for (const object of this.objects) {
      this._renderObjectDepth(gl, depthShader, object);
    }
  }

  /**
   * Recursively renders hierarchical objects during the depth pass.
   *
   * @private
   */
  _renderObjectDepth(gl, shader, object) {
    if (!object.visible) return;

    object.transform.updateWorldMatrix();

    if (object.geometry) {
      shader.setMat4("uModelMatrix", object.transform.worldMatrix.elements);
      object.geometry.draw(shader);
    }

    // Composite objects expose childrenObjects so non-root meshes also cast shadows.
    if (object.childrenObjects) {
      for (const child of object.childrenObjects) {
        this._renderObjectDepth(gl, shader, child);
      }
    }
  }
}
