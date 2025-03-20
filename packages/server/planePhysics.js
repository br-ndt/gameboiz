export function stepPhysics(airplane, deltaTime) {
  if (!airplane) {
    return;
  }
  // Constants for physics simulation (can be adjusted as needed)
  const GRAVITY = 9.81 * 1; // Scaled gravity for gameplay
  const DRAG_COEFFICIENT = 0.05; // Air resistance
  const LIFT_COEFFICIENT = 0.1; // Lift force coefficient
  const ANGULAR_DRAG = 0.5; // Rotational drag

  // Apply thrust (forward force based on the plane's angle)
  const thrustX = Math.cos(airplane.angle) * airplane.thrust;
  const thrustY = Math.sin(airplane.angle) * airplane.thrust;
  airplane.vx += thrustX * deltaTime;
  airplane.vy += thrustY * deltaTime;

  // Apply lift (depends on forward speed)
  const forwardSpeed =
    airplane.vx * Math.cos(airplane.angle) +
    airplane.vy * Math.sin(airplane.angle);
  const liftX = -Math.sin(airplane.angle) * LIFT_COEFFICIENT * forwardSpeed;
  const liftY = Math.cos(airplane.angle) * LIFT_COEFFICIENT * forwardSpeed;
  airplane.vx += liftX * deltaTime;
  airplane.vy += liftY * deltaTime;

  // Apply drag (air resistance)
  airplane.vx -= airplane.vx * DRAG_COEFFICIENT * deltaTime;
  airplane.vy -= airplane.vy * DRAG_COEFFICIENT * deltaTime;

  // Apply gravity
  airplane.vy += GRAVITY * deltaTime;

  // Update position
  airplane.x += airplane.vx * deltaTime;
  airplane.y += airplane.vy * deltaTime;

  // Apply angular drag to rotation
  airplane.angularVelocity *= 1 - ANGULAR_DRAG * deltaTime;

  // Update angle
  airplane.angle += airplane.angularVelocity * deltaTime;

  // Simple ground collision (optional)
  // const GROUND_LEVEL = window.innerHeight - 50; // Adjust as needed
  // if (airplane.y > GROUND_LEVEL) {
  //   airplane.y = GROUND_LEVEL;
  //   airplane.vy = 0; // Stop vertical movement
  //   airplane.vx *= 0.5; // Ground friction
  // }
  return airplane;
}

// https://github.com/sergiou87/triplane-turmoil/blob/master/src/world/plane.cpp

export function physicsStep(airplane, dt) {
  // ------------------------------------------------
  // 1) Define basic physics constants and state
  // ------------------------------------------------
  const GRAVITY = 9.8; // m/s^2 downward
  const DRAG_FWD = 0.02; // drag coefficient in the forward direction
  const DRAG_SIDE = 0.005; // drag coefficient in the sideways direction
  const LIFT_COEFF = 0.02; // lift coefficient for forward speed
  // (Feel free to tweak these constants for your desired arcade feel.)

  let { x, y, vx, vy, angle, thrust } = airplane;

  // ------------------------------------------------
  // 2) Compute the plane’s “forward” and “side” vectors
  // ------------------------------------------------
  // Forward vector (nose direction)
  const fwdX = Math.cos(angle);
  const fwdY = Math.sin(angle);

  // Side vector (perpendicular to forward).
  // This points to the plane’s "wing up" side if angle = 0 => plane pointing right => side is up.
  // But for pure left-handed or right-handed orientation, just be consistent.
  // We’ll define “side” as +90° from forward (counterclockwise).
  const sideX = -Math.sin(angle);
  const sideY = Math.cos(angle);

  // ------------------------------------------------
  // 3) Decompose velocity into forward & side magnitudes
  // ------------------------------------------------
  // vForward = projection of velocity onto the plane’s nose
  const vForward = vx * fwdX + vy * fwdY;
  // vSide = projection of velocity onto the plane’s side vector
  const vSide = vx * sideX + vy * sideY;

  // ------------------------------------------------
  // 4) Compute thrust force in forward direction
  // ------------------------------------------------
  const thrustFx = thrust * fwdX;
  const thrustFy = thrust * fwdY;

  // ------------------------------------------------
  // 5) Compute drag in forward & side directions
  // ------------------------------------------------
  // We want drag to oppose the sign of each velocity component.
  // Magnitude of drag is c * speed^2, direction is opposite velocity.
  // “Forward drag” uses DRAG_FWD, “side drag” uses DRAG_SIDE.
  const dragFwdMag = DRAG_FWD * vForward * Math.abs(vForward);
  const dragSideMag = DRAG_SIDE * vSide * Math.abs(vSide);

  // Now convert these scalar drags back into x,y by using the forward and side vectors negatively.
  // The sign of vForward / vSide tells us which way to oppose.
  const dragFx = -dragFwdMag * fwdX - dragSideMag * sideX;
  const dragFy = -dragFwdMag * fwdY - dragSideMag * sideY;

  // ------------------------------------------------
  // 6) Compute lift
  // ------------------------------------------------
  // A simple arcade approach:
  // - Only generate lift if forward speed is positive (plane moving “nose first”).
  // - Lift is proportional to (vForward^2) and is applied perpendicular to forward direction,
  //   i.e. in the “side” direction that points upward from the wings.
  //   We'll assume “up” is +side vector for the plane (not world up).
  let liftMag = 0;
  if (vForward > 0) {
    liftMag = LIFT_COEFF * vForward * vForward;
  }
  // Apply lift along +side vector (which we decided is “wing up”).
  // If you prefer the other perpendicular direction, just invert sideX/sideY.
  const liftFx = liftMag * sideX;
  const liftFy = liftMag * sideY;

  // ------------------------------------------------
  // 7) Sum all forces to find acceleration
  // ------------------------------------------------
  // Force = Thrust + Drag + Lift + Gravity
  // Gravity is purely downward in the global frame.
  // For simplicity, we assume mass = 1 => acceleration = net force.
  const ax = thrustFx + dragFx + liftFx;
  const ay = thrustFy + dragFy - GRAVITY;

  // ------------------------------------------------
  // 8) Integrate velocity and position via Euler
  // ------------------------------------------------
  vx += ax * dt;
  vy += ay * dt;

  x += vx * dt;
  y += vy * dt;

  // The plane’s angle is presumably updated by player inputs
  // (e.g., “angle += someDelta” from keyboard or joystick).

  // Return updated state
  return { ...airplane, x, y, vx, vy, angle, thrust };
}

export function handleInput(plane, data) {
  // Delta values for adjustments – tweak these for the game feel you want.
  const ANGLE_VELOCITY_DELTA = 0.15; // change in angular velocity per command
  const THRUST_DELTA = 1; // change in thrust per command

  switch (data) {
    case "up":
      // Pitch the airplane upward by decreasing angular velocity.
      plane.angle -= ANGLE_VELOCITY_DELTA;
      break;
    case "down":
      // Pitch the airplane downward by increasing angular velocity.
      plane.angle += ANGLE_VELOCITY_DELTA;
      break;
    case "increaseThrust":
      plane.thrust += THRUST_DELTA;
      break;
    case "decreaseThrust":
      // Prevent thrust from dropping below zero.
      plane.thrust = Math.max(0, plane.thrust - THRUST_DELTA);
      break;
    default:
      // Handle unknown commands if necessary.
      console.log(`Unknown control command: ${data}`);
  }
}

/*
  // Example usage:
  let airplane = {
    x: 0,
    y: 100,             // Starting altitude of 100 units
    vx: 10,             // Initial horizontal speed
    vy: 0,              // Initial vertical speed
    angle: Math.PI / 6, // 30 degrees in radians
    thrust: 15,         // Thrust magnitude
    angularVelocity: 0.05  // Angular velocity in radians per second
  };
  
  const dt = 0.016; // For ~60 FPS, each frame is roughly 16ms
  
  // Call the physics step function in your game loop
  airplane = physicsStep(airplane, dt);
*/
