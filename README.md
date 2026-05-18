# Penalty Shootout Simulator

Interactive 3D penalty shootout simulation built with raw WebGL. The current foundation provides the rendering surface, shader system, math library, transform hierarchy, geometry generators, scene manager, camera, render loop, and centralized input tracking.

## Architecture Overview

The project is organized like a small WebGL engine:

- `src/main.js` is the application entry point. It creates the WebGL app, shader, camera, scene, input manager, test objects, and animation loop.
- `src/core/` contains reusable engine systems such as `WebGLApp`, `ShaderProgram`, `GameObject`, `Geometry`, `Scene`, `Camera`, and `Time`.
- `src/math/` contains our custom math foundation: `Vec3`, `Mat4`, and `Transform`.
- `src/geometry/` contains mathematical primitive generators such as `Plane`, `Sphere`, and `Cylinder`.
- `src/objects/` is for project-specific scene objects such as `Ball`, `GoalPost`, `Goalkeeper`, `Ground`, `StadiumLights`, and `TargetCrosshair`.
- `src/interaction/` is for input and gameplay interaction systems such as `InputManager`, `MousePicker`, keyboard controls, and camera controls.
- `src/physics/` is for ball trajectory, goalkeeper dive interpolation, and collision/save-goal checks.
- `src/lighting/` is for lights, spotlights, and shadow-related systems.
- `src/ui/` is for HTML slider/control wiring.
- `src/shaders/` is reserved for moving shader source out of `main.js` later.
- `assets/` stores textures, screenshots, and other media.

## Quick Start

Run a local static server from the project root:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

Do not open `index.html` directly from the file system, because browser ES modules work best through a local server.

## Creating A GameObject

Import the pieces you need:

```js
import { GameObject } from "./core/GameObject.js";
import { Sphere } from "./geometry/Sphere.js";
import { Vec3 } from "./math/Vec3.js";
```

Create geometry, color, and transform:

```js
const ball = new GameObject({
  name: "Ball",
  geometry: new Sphere(app.gl, 0.5, 32, 16),
  material: { color: new Vec3(1, 1, 1) },
});

ball.transform.position = new Vec3(0, 0.5, 3);
scene.add(ball);
```

For hierarchy, use `Transform.addChild()`:

```js
goalkeeper.transform.addChild(leftArm.transform);
goalkeeper.transform.addChild(rightArm.transform);
```

## Reading Input

`InputManager` is created once in `main.js`:

```js
const input = new InputManager(app.canvas);
```

Inside the animation loop:

```js
if (input.wasKeyPressed("Space")) {
  console.info("Space pressed");
}

if (input.isKeyDown("ArrowLeft")) {
  target.transform.position.x -= 2 * time.deltaTime;
}

if (input.wasMouseClicked()) {
  const mouse = input.getMousePosition();
  console.info(mouse.x, mouse.y, mouse.ndcX, mouse.ndcY);
}

input.endFrame();
```

Use `mouse.ndcX` and `mouse.ndcY` later for raycasting and mouse picking.

## Team Handoff Notes

Zeynep should add modeling and hierarchy work near the `ZEYNEP'S AREA` block in `src/main.js`, then move larger object definitions into `src/objects/`.

Baris should add input, physics, trajectory, and animation updates near the `BARIS'S AREA` block in `src/main.js`, then move larger systems into `src/interaction/` and `src/physics/`.
