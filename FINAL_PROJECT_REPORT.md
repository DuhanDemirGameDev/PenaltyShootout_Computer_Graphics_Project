# Penalty Shootout Simulator: Final Project Report

**Course:** Computer Graphics  
**Project:** Penalty Shootout Simulator  
**Team Members:** Duhan Demir, Zeynep Gerçekdoğan, Barış Yaman  
**Implementation Platform:** Raw WebGL / JavaScript ES Modules  

---

## 1. Introduction & Project Summary

Penalty Shootout Simulator is an interactive 3D computer graphics application that simulates the visual and mechanical experience of taking a penalty kick in a football stadium. The project was developed with raw WebGL and modular JavaScript, without relying on high-level rendering engines such as Three.js. This design decision required the team to implement the essential graphics pipeline directly: context creation, shader compilation, matrix mathematics, procedural geometry, scene traversal, texture loading, camera control, lighting, shadow mapping, input handling, and animation.

The main goal of the application is to provide a real-time 3D penalty shooting environment where the user can aim at the goal, control shot power through mouse interaction, influence ball spin by clicking different parts of the ball, reposition the goalkeeper, move around the scene with a 3D camera, and modify stadium lighting through user interface controls. The simulation is implemented as a small custom graphics engine organized around reusable modules in `src/core`, `src/math`, `src/geometry`, `src/objects`, `src/interaction`, `src/physics`, `src/lighting`, `src/ui`, and `src/shaders`.

The central application entry point is `src/main.js`. It initializes `WebGLApp`, compiles shader programs through `ShaderProgram`, creates a `Camera`, constructs the `Scene`, attaches an `InputManager`, instantiates the stadium objects, creates four controllable `Spotlight` instances, initializes a `ShadowMap`, and starts the `requestAnimationFrame` loop. The final scene includes a textured grass field, a textured football, a modeled goal with posts and nets, a hierarchical goalkeeper, stadium light towers, textured advertisement boards, a target crosshair, an interactive scoreboard, a shot power bar, and a side control panel.

The project satisfies the course requirement for a fully 3D interactive graphics project by combining several distinct technical components:

- A custom mathematical foundation for vectors, matrices, projections, view transforms, and hierarchical modeling.
- Multiple procedural 3D morphologies, including planes, spheres, cylinders, and cuboids.
- Texture mapping for the grass, football, goal net, and advertisement panels.
- User-controlled objects, including the aiming crosshair, goalkeeper, camera target/orbit, and stadium lights.
- A controllable main light source and additional dynamic light sources.
- Real-time animation for the ball trajectory, goalkeeper dive, shadows, score feedback, and light movement.

Because the implementation is built directly on WebGL, the final result demonstrates not only a visual simulation but also a practical understanding of the low-level graphics pipeline.

---

## 2. Core Architecture & Math

The project is structured as a compact custom WebGL engine. The architecture separates reusable rendering systems from project-specific objects and gameplay logic. This separation is visible in the folder organization:

- `src/core`: rendering context, shader programs, scene management, camera, geometry buffers, time, and base object abstraction.
- `src/math`: custom `Vec3`, `Mat4`, and `Transform` implementations.
- `src/geometry`: procedural geometry generators.
- `src/objects`: concrete 3D scene objects such as `Ball`, `GoalPost`, `Goalkeeper`, `Ground`, `StadiumLights`, `TargetCrosshair`, and `AdBoards`.
- `src/interaction`: input, camera control, mouse picking, and game-state management.
- `src/physics`: ball trajectory, goalkeeper dive, and collision/result logic.
- `src/lighting`: light abstractions, spotlights, and shadow mapping.
- `src/shaders`: GLSL shader source strings.
- `src/ui`: HTML interface updates and slider-driven control.

### 2.1 WebGL Context and Rendering Loop

The `WebGLApp` class in `src/core/WebGLApp.js` owns the canvas and WebGL context. It locates the `glCanvas` element, requests a WebGL2 context first, falls back to WebGL if available, configures depth testing, clears the frame buffer, and handles resizing. The class also limits device pixel ratio to avoid unnecessarily expensive render targets on high-DPI screens. Depth testing is enabled with `gl.DEPTH_TEST`, `gl.depthFunc(gl.LEQUAL)`, and `gl.clearDepth(1.0)`.

The render loop is implemented in `src/main.js` through `requestAnimationFrame(animate)`. Each frame performs the following high-level sequence:

1. Update time and camera aspect ratio.
2. Read UI sliders and checkboxes for light intensity, light enable states, selected light position, and light movement speed.
3. Update moving spotlight targets and selected light source position.
4. Synchronize the visible stadium light tower models with the logical light positions.
5. Update game logic through `GameStateMachine.update`.
6. Update camera controls through `CameraControls.update`.
7. Render a shadow depth pass into the `ShadowMap`.
8. Render the main color pass with Phong lighting, texture sampling, and shadow lookup.
9. Clear per-frame input events through `input.endFrame()`.

This two-pass structure is important academically because it separates light-space depth capture from camera-space shading, which is the standard conceptual approach for shadow mapping.

### 2.2 Scene and GameObject Abstraction

`src/core/Scene.js` stores arrays of objects and lights. Its `render` method updates the camera uniforms `uViewMatrix` and `uProjectionMatrix`, applies light uniforms through `_applyLightUniforms`, and renders every object. It also contains `renderDepthPass`, which recursively renders objects into the shadow-map framebuffer using only depth information.

The base renderable abstraction is `GameObject` in `src/core/GameObject.js`. Each object owns:

- a `name`,
- a `Transform`,
- optional `Geometry`,
- a material containing color and optional texture data,
- a `visible` flag.

During rendering, `GameObject.render` updates the world matrix, sends `uModelMatrix` and `uColor` to the shader, enables or disables texture use through `uUseTexture`, binds the texture through `ShaderProgram.setTexture` when needed, and finally calls `geometry.draw(shaderProgram)`.

This abstraction allows both simple objects, such as the ball, and composite objects, such as the goal and goalkeeper, to participate in the same rendering pipeline.

### 2.3 Geometry Buffer Management

`src/core/Geometry.js` converts generated mesh arrays into WebGL buffers. It supports positions, normals, UV coordinates, and optional indices. It creates `ARRAY_BUFFER` objects for vertex attributes and an `ELEMENT_ARRAY_BUFFER` for indexed rendering. It also detects whether 32-bit indices are required and checks WebGL2 or the `OES_element_index_uint` extension.

During drawing, `Geometry.bind` connects the mesh buffers to shader attributes:

- `aPosition` for vertex position,
- `aNormal` for lighting calculations,
- `aUv` for texture sampling.

Then `Geometry.draw` renders either with `gl.drawElements` for indexed meshes or `gl.drawArrays` for non-indexed meshes. This module is the bridge between procedural mesh generation and the GPU.

### 2.4 Custom Vector Mathematics

The vector system is implemented in `src/math/Vec3.js`. It provides:

- addition and subtraction,
- scalar multiplication,
- dot product,
- cross product,
- length,
- normalization,
- array conversion.

This class is used throughout the entire codebase: camera positioning, lighting, raycasting, ball trajectory, goalkeeper animation, object placement, and shader uniform uploads. For example, `Camera.front` is computed by subtracting the camera position from its target and normalizing the result. `MousePicker` uses vector dot products to solve ray-sphere intersection. `Mat4.lookAt` uses cross and dot products to construct camera basis vectors.

### 2.5 Custom Matrix Mathematics

The matrix system is implemented in `src/math/Mat4.js`. The class stores matrix elements in `Float32Array` form and provides the operations required for a standard 3D graphics pipeline:

- `identity`,
- `translation`,
- `rotationX`,
- `rotationY`,
- `rotationZ`,
- `scaling`,
- `perspective`,
- `lookAt`,
- `multiply`,
- `invert`,
- `transformVec3`.

The implementation uses column-major indexing, matching the convention used by WebGL's `uniformMatrix4fv` when the transpose parameter is `false`. Matrix multiplication iterates over columns and rows and computes the product of the left and right matrices. The `perspective` method constructs a projection matrix from field of view, aspect ratio, near plane, and far plane. The `lookAt` method computes the camera basis from the eye, center, and up vectors.

`Mat4.invert` is especially important for mouse picking. The `MousePicker` converts normalized device coordinates back into a world-space ray by using the inverse projection and inverse view matrices. This lets the application determine where the user clicked in 3D space instead of treating mouse input as only a 2D screen event.

### 2.6 Transform Hierarchy

The hierarchical transform system is implemented in `src/math/Transform.js`. Each transform stores local position, rotation, scale, parent reference, child list, local matrix, and world matrix. The method `updateLocalMatrix` composes the local transform as:

```text
T * Rz * Ry * Rx * S
```

This means the object is scaled in local space, then rotated around local axes, then translated into its parent coordinate system. `updateWorldMatrix` multiplies the local matrix by the parent world matrix when a parent exists; otherwise, the world matrix is simply the local matrix. It then recursively updates all children.

The method `addChild` prevents invalid transform graphs by rejecting self-parenting and parent cycles. This is important for stable hierarchical modeling, especially in the goalkeeper and goal-post models where many child objects depend on parent transforms.

### 2.7 Shader Management

`src/core/ShaderProgram.js` manages shader compilation, linking, uniform lookup, attribute lookup, and uniform updates. It compiles vertex and fragment shaders, reports compile/link errors, caches uniform and attribute locations, and exposes helper methods:

- `setMat4`,
- `setVec3`,
- `setFloat`,
- `setInt`,
- `setBool`,
- `setTexture`.

The application creates two shader programs in `src/main.js`:

- `shader`, using `basicVertexShader` and `basicFragmentShader` for the main color pass.
- `shadowShader`, using `shadowVertexShader` and `shadowFragmentShader` for the shadow depth pass.

Shader source code is stored in `src/shaders/ShaderSources.js`. The main vertex shader receives `aPosition`, `aNormal`, and `aUv`, computes world position, transformed normal, UV coordinates, shadow coordinates, and final clip-space position. The main fragment shader supports texture sampling, ambient lighting, diffuse lighting, Phong specular highlights, distance attenuation, and shadow testing.

The fragment shader defines `MAX_LIGHTS 4`, matching the four stadium spotlights created in `src/main.js`. It samples `uTexture` when `uUseTexture` is true and otherwise uses the material color. It computes:

- ambient term: `0.18 * baseColor`,
- diffuse term: `max(dot(N, L), 0.0)`,
- specular term: `pow(max(dot(V, R), 0.0), 32.0)`,
- attenuation: `1.0 / (1.0 + 0.007 * dist + 0.0002 * dist * dist)`,
- shadow factor from `uShadowMap`.

Although the light objects are named `Spotlight` and store target directions for shadow-map view construction, the main color shader currently shades them as position-based Phong lights rather than applying a spotlight cutoff cone. This is a reasonable implementation choice for the final scene because the visual stadium lighting is still dynamic and controllable, while the light-space matrix uses the selected spotlight's position and target for shadow projection.

---

## 3. 3D Modeling, Textures & Hierarchy

The visual content of the simulator is constructed primarily from procedural geometry and transform hierarchies. Instead of importing most assets from external modeling software, the project generates geometric primitives in JavaScript and combines them into larger composite models.

### 3.1 Procedural Geometry

The procedural geometry modules are located in `src/geometry`.

`Plane.js` generates a rectangular ground-like mesh. It builds a grid of vertices over width and depth, assigns upward normals `(0, 1, 0)`, generates UV coordinates, and indexes each cell into two triangles. It is used for the grass field and goal nets.

`Sphere.js` generates a UV sphere from radius, width segments, and height segments. The generator loops over latitude and longitude, computes spherical coordinates, stores positions, normals, UVs, and triangle indices. This is used for the football and the red target crosshair.

`Cylinder.js` generates cylindrical side surfaces plus top and bottom caps. It computes side normals for correct lighting and UVs for potential texture mapping. It is used for goal posts and light tower poles.

`Cuboid.js` generates a box mesh with six independent faces. Each face has its own positions, normals, UV coordinates, and indices. Separate face vertices are useful because each face needs a different normal direction for flat lighting. Cuboids are used extensively for the goalkeeper body parts, field markings, stadium light panels, support arms, advertisement frames, and advertisement screens.

Together, these primitives provide more than the required three morphologies. The active scene uses planes, spheres, cylinders, and cuboids. This supports a rich environment while keeping the geometry mathematically transparent.

### 3.2 Ground and Field Lines

The `Ground` object in `src/objects/Ground.js` is a composite root. It creates a `Grass Plane` from `Plane(gl, 20, 20, 1)` and applies the texture `assets/textures/grass.jpg` through `TextureLoader`. Field lines are modeled as thin cuboids placed slightly above the grass at `y = 0.01` to avoid z-fighting. The field includes a front box line, left and right penalty box lines, smaller goal box lines, and a penalty spot.

This approach demonstrates practical scene construction: the grass is a textured plane, while the markings are actual 3D geometry rather than a 2D overlay. Because the markings are cuboids, they respond to the same projection, view, and lighting calculations as the rest of the scene.

### 3.3 Football Model and Texture

The football is implemented in `src/objects/Ball.js`. It uses a high-resolution procedural sphere:

```text
new Sphere(gl, 0.3, 64, 64)
```

The material loads `assets/textures/football.jpg` and enables texture sampling through `useTexture: true`. The ball is mathematically positioned to spawn exactly on top of the procedural penalty spot modeled on the pitch (`new Vec3(0, ballRadius, 0)`), and its Y-axis is perfectly flush with the ground using its exact radius. The ball's initial `rotation.x` is set to `Math.PI * 0.75` to align the texture visually.

During gameplay, the ball's transform position is continuously updated by `BallTrajectory.computePosition`, and its rotation is updated in `GameStateMachine.updateShooting` to show forward spin, side spin, and tumbling.

### 3.4 Goal Post and Net Model

The goal is implemented in `src/objects/GoalPost.js` as a hierarchical composite object. The root object has no geometry; it exists to position and organize its child parts. The standard football goal dimensions are represented with:

- `crossbarWidth = 7.32`,
- `postHeight = 3.0`,
- `postRadius = 0.1`,
- `netDepth = 2.0`.

The left and right posts are vertical cylinders. The crossbar is another cylinder rotated around the Z axis by `Math.PI / 2` so that it lies horizontally across the goal width. Four net planes are added:

- `Back Net`,
- `Left Net`,
- `Right Net`,
- `Top Net`.

The net material loads `assets/textures/net.png`. The goal root is positioned at `new Vec3(0, 0, -7)`, placing it at the far end of the penalty area. The model is not a single mesh; it is a parent-child hierarchy. Child transforms are attached to the root with `this.transform.addChild(...)`, and rendering iterates through `childrenObjects`.

This design makes the goal easy to move, scale, or rotate as a complete object while keeping the posts and nets locally positioned.

### 3.5 Hierarchical Goalkeeper Model

The goalkeeper in `src/objects/Goalkeeper.js` is the strongest example of hierarchical modeling in the project. It is built from cuboids and a sphere:

- torso: cuboid,
- head: sphere,
- arms: cuboids,
- gloves: cuboids,
- legs: cuboids,
- shoes: cuboids.

The model uses a root object named `Goalkeeper Root`. The torso is a child of the root, and the head, shoulders, and hips are children of the torso. The limbs are not simply translated geometry; they are attached through joint-like parent transforms:

- `leftShoulder -> leftArm -> leftGlove`,
- `rightShoulder -> rightArm -> rightGlove`,
- `leftHip -> leftLeg -> leftShoe`,
- `rightHip -> rightLeg -> rightShoe`.

This hierarchy is important because rotations are applied to joints instead of only rotating the final geometry. For example, rotating `leftShoulder.transform.rotation.z` raises the entire left arm and glove because the arm and glove are descendants of the shoulder transform. Similarly, rotating a hip affects the corresponding leg and shoe.

The method `setDiveProgress(t, start, target)` animates the goalkeeper through different phases:

1. At `t = 0`, the goalkeeper returns to a ready pose with a forward-leaning torso, slightly lowered head, open arms, and bent hips.
2. During the crouch phase, the torso and hips bend more strongly and the arms open further.
3. During the flight phase, the goalkeeper moves horizontally toward the target, follows a vertical jump arc, rotates the whole body around the Z axis, and adjusts shoulder and hip rotations based on whether the dive is left, right, or center.

This is a true hierarchical animation because the visible pose is produced by a combination of root transform changes and local joint rotations.

### 3.6 Stadium Lights

The physical stadium light towers are modeled in `src/objects/StadiumLights.js`. A helper class `SingleLightTower` builds each tower from:

- a cylindrical pole,
- a cuboid support arm,
- a cuboid light panel.

Four towers are placed around the stadium:

- far left,
- far right,
- near left,
- near right.

The visible tower positions are synchronized with the corresponding logical light positions in `src/main.js`. When the user moves a selected light through UI sliders, the rendered tower model moves with that light. This creates a consistent relationship between the graphical object and the lighting system.

### 3.7 Advertisement Boards

`src/objects/AdBoards.js` adds textured advertisement panels around the field. It loads three textures:

- `assets/textures/gazi.png`,
- `assets/textures/acm_gazi.png`,
- `assets/textures/ayazjam.png`.

Each panel is built from a cuboid frame and a thin textured cuboid screen. The boards are grouped into side-board parent transforms for the left, right, back, and front sides of the field. This module adds additional texture use, visual context, and hierarchical composition beyond the core football scene.

### 3.8 Texture Loading

Texture loading is handled by `src/utils/TextureLoader.js`. The loader creates a WebGL texture immediately and initializes it with a 1x1 blue placeholder pixel. When the image finishes loading, the texture is replaced with the real image data through `gl.texImage2D`. Wrapping is set to `CLAMP_TO_EDGE`, and minification uses `LINEAR` filtering.

The active project uses at least six texture files:

- `assets/textures/grass.jpg`,
- `assets/textures/football.jpg`,
- `assets/textures/net.png`,
- `assets/textures/gazi.png`,
- `assets/textures/acm_gazi.png`,
- `assets/textures/ayazjam.png`.

This clearly satisfies the requirement for three or more textures. It also demonstrates UV coordinate usage in the geometry generators and texture sampling in the fragment shader.

---

## 4. Interaction, Physics & Animation

The interactive and animated behavior of the simulator is centralized in the interaction and physics modules. The most important controller is `GameStateMachine` in `src/interaction/GameStateMachine.js`, which manages the full penalty shot cycle.

### 4.1 Game State Machine

The game state machine defines four states:

- `READY`,
- `CHARGING`,
- `SHOOTING`,
- `FINISHED`.

In the `READY` state, the user can aim, move the goalkeeper through the UI slider, and click the ball to begin a shot. In the `CHARGING` state, the shot power increases while the mouse is held down. When the mouse is released, the ball start and target positions are stored, shot parameters are computed, the goalkeeper dive target is calculated, and the state changes to `SHOOTING`. In the `SHOOTING` state, the ball and goalkeeper are animated and the result is evaluated. In the `FINISHED` state, pressing the Space key resets the shot.

This finite-state design keeps input, animation, and scoring logic organized. It prevents the user from accidentally starting a new shot while the ball is already traveling and provides a clear reset condition.

### 4.2 Input Management

`src/interaction/InputManager.js` tracks keyboard state, per-frame key presses, mouse position, mouse button state, and normalized device coordinates. It converts mouse positions into NDC values using:

```text
ndcX = (x / width) * 2 - 1
ndcY = 1 - (y / height) * 2
```

These normalized values are essential for raycasting because clip-space and normalized-device-space coordinates are the bridge between the 2D canvas and the 3D camera projection.

The input manager also separates continuous key state from one-frame events. `isKeyDown` is used for continuous movement, while `wasKeyPressed` is used for events such as resetting the shot with Space.

### 4.3 Crosshair Control

The target crosshair is implemented in `src/objects/TargetCrosshair.js` as a small red sphere positioned near the goal at `new Vec3(0, 1.5, -6.5)`. In the `READY` state, the user moves it with the arrow keys:

- ArrowLeft and ArrowRight change X,
- ArrowUp and ArrowDown change Y.

The crosshair is clamped to realistic goal bounds:

- X range: `[-3.5, 3.5]`,
- Y range: `[0.2, 2.9]`.

This gives the user direct control over the intended shot target while keeping the target inside or near the goal mouth.

### 4.4 Mouse Picking and Ball Spin

The user begins a shot by clicking the ball. This is implemented through `MousePicker` in `src/interaction/MousePicker.js`. The method `calculateRayDirection` transforms screen-space NDC coordinates into a world-space ray using the inverse projection and inverse view matrices. The method `getIntersectionPoint` solves a ray-sphere intersection equation against the football.

When the user clicks the ball, `GameStateMachine.updateReady` computes the hit point on the sphere. The offset between this hit point and the ball center determines spin:

```text
sideSpin = -hitOffsetX * 6.5
verticalSpin = -hitOffsetY * 3.5
```

This means that clicking different regions of the ball changes the resulting curve and vertical behavior of the shot. The system therefore connects a graphical picking operation to a gameplay physics parameter.

### 4.5 Shot Power

When the click is registered, the game enters `CHARGING`. During charging, `shotPower` increases by `deltaTime * 2.5` until it reaches `maxPower = 3.0`. The `UIManager` updates the power bar by setting the width of `powerFill` according to the power ratio.

When the mouse is released, shot power is passed into `BallTrajectory.computeShotParams`. The shot duration and arc height are calculated as:

```text
shotDuration = 1.2 - (shotPower / maxPower) * 0.85
arcHeight = 1.2 + (shotPower * 0.4)
```

This makes stronger shots faster and higher. A strong negative vertical spin reduces arc height, representing a lower, driven shot.

### 4.6 Ball Trajectory

The ball trajectory is implemented in `src/physics/BallTrajectory.js`. The main function is `computePosition(t, start, target, sideSpin, verticalSpin, arcHeight)`. The function clamps the primary shot interpolation to `t <= 1.0` and computes position as a combination of:

- linear interpolation from start to target,
- quadratic horizontal spin contribution,
- asymmetric sine arc for vertical height,
- vertical spin contribution.

The X coordinate includes side spin:

```text
currentX = lerp(start.x, target.x, t) + sideSpin * t^2
```

The Y coordinate includes an asymmetric arc:

```text
asymmetricArc = sin(t^1.4 * pi)
```

The function also handles post and crossbar bounce behavior. If the target is close to the left post, right post, or crossbar, a collision phase begins after `collisionT = 0.90`, and the ball is reflected back into the field. If the shot is a goal and no post is hit, then after `t > 1.0` the ball continues into the net and falls toward the ground. If the shot is outside, it continues beyond the target and drops due to a gravity-like term.

The final Y position is clamped to at least the ball radius, preventing the ball from sinking below the grass plane.

### 4.7 Goalkeeper Dive

The goalkeeper's target is computed in `src/physics/GoalkeeperDive.js`. Rather than perfectly predicting the ball's trajectory, the goalkeeper calculates a completely random dive target within the physical goal bounds the moment the shot is taken:

- X range: `[-3.0, 3.0]`,
- Y range: `[0.5, 2.5]`.

This makes the gameplay unpredictable and more realistic, forcing the player to guess where the keeper won't go.

The actual pose animation is implemented in the goalkeeper object's `setDiveProgress` method. This method combines translation, jump arc, body rotation, shoulder rotation, hip rotation, and ready-pose restoration. It creates a much richer animation than a simple linear translation.

### 4.8 Save, Goal, and Miss Logic

`src/physics/Collision.js` defines `ShotResult` values: `GOAL`, `SAVE`, and `MISS`. The logic was refactored so that the logical goal boundaries now perfectly mirror the physical 3D Goalpost dimensions (posts at X = ±3.66, crossbar at Y = 3.0), explicitly accounting for the ball's radius. This ensures that ground shots (where Y equals the ball's radius) and inner-post deflections are accurately registered as GOALs. It also checks whether the goalkeeper is close enough to save the shot.

In `GameStateMachine.updateShooting`, save detection also occurs during the flight phase when `t` is between `0.65` and `0.95`. If the distance between the ball and goalkeeper is less than `1.1`, the goalkeeper may save the shot unless a high-power shot escapes with a probability condition. On save, the ball bounces back into the field with a randomized upward and forward direction.

The result is shown through `UIManager.showScreenMessage`, and the scoreboard is updated through `UIManager.updateScore`.

### 4.9 UI Controls

The HTML interface is defined in `index.html`. It includes:

- scoreboard,
- power bar,
- result message,
- reset hint,
- goalkeeper X slider,
- spotlight intensity slider,
- spotlight movement speed slider,
- selected light dropdown,
- selected light X/Y/Z sliders,
- four light enable checkboxes.

`src/ui/UIManager.js` centralizes scoreboard, power bar, result message, and reset hint updates. Light and goalkeeper sliders are read in `src/main.js` and `GameStateMachine`.

The interface provides more than three user-controlled objects or parameters: crosshair, goalkeeper, camera, selected light position, light intensity, light movement speed, and individual light enable states.

---

## 5. Camera & Lighting

The camera and lighting systems are major parts of the project's 3D interaction and visual realism.

### 5.1 Camera Model

The camera is implemented in `src/core/Camera.js`. It stores position, target, up vector, field of view, aspect ratio, near plane, and far plane. Its view matrix is computed with `Mat4.lookAt`, and its projection matrix is computed with `Mat4.perspective`.

In `src/main.js`, the camera is initialized at:

```text
position = Vec3(0, 10, 30)
target = Vec3(0, 0, 0)
```

The camera aspect ratio is updated every frame according to the canvas width and height, ensuring that the projection remains correct after resizing.

### 5.2 3-Axis Camera Interaction

`src/interaction/CameraControls.js` provides the interactive camera system. It uses an orbit target and spherical coordinates:

- `yaw`,
- `pitch`,
- `distance`.

Right-click dragging rotates the camera around the stadium. Mouse wheel scrolling changes the camera distance. Pitch is clamped to prevent invalid viewing angles, and distance is clamped between `8` and `55`.

Keyboard controls also move the camera's orbit target over the XZ plane:

- `W`: move forward,
- `S`: move backward,
- `A`: move left,
- `D`: move right.

Although the WASD translation is constrained to the field plane for usability, the full camera position is still computed in 3D using X, Y, and Z coordinates from yaw, pitch, and distance:

```text
x = distance * cos(pitch) * sin(yaw)
y = distance * sin(pitch)
z = distance * cos(pitch) * cos(yaw)
```

Therefore, the camera supports three-dimensional viewing: horizontal orbit, vertical elevation, and radial zoom, while also allowing target movement across the field.

### 5.3 Light Classes

The base `Light` class in `src/lighting/Light.js` stores position, color, intensity, and an enabled flag. It uploads `uLightPos[i]` and `uLightColor[i]` uniforms to the shader. Disabled lights are represented by sending black color `(0, 0, 0)`, which effectively removes their diffuse and specular contribution.

`src/lighting/Spotlight.js` extends `Light` with a target, near/far planes, and light-space matrix computation. It provides:

- `getViewMatrix`,
- `getProjectionMatrix`,
- `getLightSpaceMatrix`.

The light-space matrix is calculated as:

```text
projection * view
```

This matrix is used during both shadow-map rendering and shadow lookup.

### 5.4 Dynamic Stadium Lighting

`src/main.js` creates four lights:

- `light1`: `Vec3(-9, 8, -9)`,
- `light2`: `Vec3(9, 8, -9)`,
- `light3`: `Vec3(-9, 8, 7)`,
- `light4`: `Vec3(9, 8, 7)`.

All lights target the field area near `Vec3(0, 0, -3)` initially. The UI allows the user to:

- change global light intensity,
- enable or disable each light,
- select a light tower,
- adjust the selected light's X/Y/Z position,
- control automatic movement speed.

When light movement speed is greater than zero, the code animates light targets with sine and cosine functions. The selected light source also orbits around its UI-defined base position. When movement speed is zero, the selected light is placed exactly at the slider-controlled position.

This satisfies the controllable-light requirement because the main light and other lights are directly controlled through the UI.

### 5.5 Shadow Mapping

Shadow mapping is implemented through `src/lighting/ShadowMap.js` and the shadow shaders in `src/shaders/ShaderSources.js`. The shadow map creates a depth texture with `gl.DEPTH_COMPONENT32F`, attaches it to a framebuffer as `gl.DEPTH_ATTACHMENT`, and disables color output with:

```text
gl.drawBuffers([gl.NONE])
gl.readBuffer(gl.NONE)
```

During each frame, the application performs:

1. A shadow pass:
   - bind the shadow framebuffer,
   - set the viewport to the shadow-map resolution,
   - clear depth,
   - render all objects using `shadowShader`,
   - write depth from the light's perspective.

2. A color pass:
   - return to the default framebuffer,
   - restore the canvas viewport,
   - bind the depth texture to texture unit 1,
   - send `uShadowMap`,
   - render the scene using the main shader.

The main vertex shader computes `vShadowCoord = uLightSpaceMatrix * worldPos`. The fragment shader projects this coordinate into texture space, samples the closest depth from the shadow map, compares it with the current depth, applies a small bias of `0.005`, and returns a shadow factor of `0.55` when the fragment is shadowed.

This gives the stadium objects spatial grounding and demonstrates an advanced real-time rendering technique beyond basic flat shading.

---

## 6. Conclusion & Requirements Checklist

Penalty Shootout Simulator successfully implements a complete interactive 3D WebGL scene. The project demonstrates low-level graphics programming skills by building a custom rendering pipeline, mathematical foundation, procedural geometry system, hierarchical modeling system, texture pipeline, lighting system, shadow map, camera controller, and animation/gameplay logic.

The final scene is not only a static model. It is interactive and animated: the user can aim the crosshair, click the ball to define spin, charge shot power, watch the ball curve toward the target, observe a hierarchical goalkeeper dive, control the goalkeeper's initial position, move the camera, and adjust dynamic stadium lighting. The result is a coherent simulation that combines graphics concepts with a playable penalty-kick interaction.

### Requirements Checklist

| Requirement | Evidence in Project |
|---|---|
| Fully 3D scene | The scene uses perspective projection, view matrices, depth testing, 3D transforms, 3D mesh geometry, and world-space lighting. Main modules: `src/core/WebGLApp.js`, `src/core/Camera.js`, `src/math/Mat4.js`, `src/core/Scene.js`. |
| 3-axis / 3D camera | `src/interaction/CameraControls.js` computes camera X, Y, and Z from yaw, pitch, and distance. It also supports right-click orbit, wheel zoom, and WASD target movement. |
| 3+ morphologies | The active scene uses `Plane`, `Sphere`, `Cylinder`, and `Cuboid` from `src/geometry`. |
| 3+ textures | The scene uses `grass.jpg`, `football.jpg`, `net.png`, `gazi.png`, `acm_gazi.png`, and `ayazjam.png`. Texture loading is handled by `src/utils/TextureLoader.js`. |
| 3+ user-controlled objects/parameters | The user controls the crosshair with arrow keys, goalkeeper X position with a slider, camera orbit/zoom/movement with mouse and WASD, and lights with sliders, dropdown, and checkboxes. |
| Controllable main light source | `src/main.js` exposes selected light X/Y/Z sliders, intensity slider, movement speed slider, and enable checkboxes. `light3` is used as the main shadow-casting light. |
| Hierarchical modeling | `src/objects/Goalkeeper.js`, `src/objects/GoalPost.js`, `src/objects/StadiumLights.js`, and `src/objects/AdBoards.js` use parent-child transforms. |
| Animation | Ball flight, ball spin, goalkeeper dive, light movement, power bar, scoreboard messages, and save bounce are animated in real time. |
| Mathematical implementation | Custom `Vec3`, `Mat4`, and `Transform` classes implement the necessary 3D graphics math. |
| Shader implementation | `src/shaders/ShaderSources.js` contains GLSL ES 3.00 shaders for Phong lighting, texture mapping, and shadow mapping. |

### Final Evaluation

The project meets and exceeds the expected course requirements. Its strongest academic contributions are the custom math/rendering infrastructure, the hierarchical goalkeeper model, the procedural construction of the stadium elements, and the integration of interaction with animation. The project also demonstrates how graphics algorithms are connected in practice: mouse picking depends on inverse matrices, animation depends on time-normalized interpolation, lighting depends on normals and world positions, and shadow mapping depends on an additional light-space rendering pass.

Future improvements could include physically based ball dynamics, collision against exact post geometry, spotlight cutoff cones in the fragment shader, skeletal skinning for the goalkeeper, and audio feedback. However, within the scope of the current course project, the implementation is already a complete and technically substantial WebGL application.

---

## 7. References

1. Angel, E., & Shreiner, D. (2015). *Interactive Computer Graphics: A Top-Down Approach with WebGL* (7th ed.). Pearson.

2. Matsuda, K., & Lea, R. (2013). *WebGL Programming Guide: Interactive 3D Graphics Programming with WebGL*. Addison-Wesley.

3. Foley, J. D., van Dam, A., Feiner, S. K., & Hughes, J. F. (1995). *Computer Graphics: Principles and Practice* (2nd ed.). Addison-Wesley.

4. Phong, B. T. (1975). Illumination for computer generated pictures. *Communications of the ACM*, 18(6), 311-317.

5. Williams, L. (1978). Casting curved shadows on curved surfaces. *Computer Graphics*, 12(3), 270-274.

6. Khronos Group. (n.d.). *WebGL 2.0 Specification*. https://registry.khronos.org/webgl/specs/latest/2.0/

7. MDN Web Docs. (n.d.). *WebGL API*. https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API

8. MDN Web Docs. (n.d.). *WebGL model view projection*. https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection

9. LearnOpenGL. (n.d.). *Shadow Mapping*. https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping

10. Project source files in the Penalty Shootout Simulator repository, especially `src/main.js`, `src/core`, `src/math`, `src/geometry`, `src/objects`, `src/interaction`, `src/physics`, `src/lighting`, and `src/shaders`.
