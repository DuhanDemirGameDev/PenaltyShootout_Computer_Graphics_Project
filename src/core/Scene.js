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

  render(gl, shaderProgram) {
    if (this.camera && shaderProgram) {
      shaderProgram.setMat4("uViewMatrix", this.camera.getViewMatrix().elements);
      shaderProgram.setMat4("uProjectionMatrix", this.camera.getProjectionMatrix().elements);
    }

    for (const object of this.objects) {
      object.render?.(gl, shaderProgram, this.camera);
    }
  }
}
