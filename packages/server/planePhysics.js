
export function physicsStep(plane, deltaTime) {
  // Define stall thresholds and the stall angle (straight down)
  const stallSpeedThreshold = 10; // speed below which stall initiates
  const stallRecoveryThreshold = 300; // speed above which stall is cancelled
  const stallAngle = (2 * Math.PI) / 2; // 270 degrees (nose down)

  // --- 1. Compute current speed from velocity components ---
  let speed = Math.sqrt(plane.vx * plane.vx + plane.vy * plane.vy);

  // --- 2. Check for stall conditions ---
  if (!plane.stalled && speed < stallSpeedThreshold) {
    // Enter stall state: force angle to point straight down.
    plane.stalled = true;
    plane.angle = stallAngle;
  }

  // === 1) Angle-based effect (simulates climbing or diving) ===
  //     For simplicity, let's do a small factor:
  const angleDeg = (plane.angle * 180) / Math.PI;
  // Normalize to 0..360
  const angle360 = ((angleDeg % 360) + 360 + 90) % 360;

  // If nose-up (0..180), reduce speed slightly
  if (angle360 > 0 && angle360 < 180) {
    speed -= 100 * deltaTime; // climbFactor
  }
  // If nose-down (180..360), increase speed slightly
  else {
    speed += 100 * deltaTime; // diveFactor
  }

  // === 2) Friction/drag ===
  // Example: match original "speed -= speed/50" per second
  const frictionFactor = 1 / 50;
  speed -= speed * frictionFactor * deltaTime;

  // === 3) Thrust if "engine on" ===
  if (plane.isThrusting) {
    speed += plane.thrust * deltaTime;
    // Decrement fuel if you track that
    // plane.fuel -= fuelRate * deltaTime
  }

  // === 4) Prevent negative speed or impose a max if desired ===
  if (speed < 0) speed = 0;
  const maxSpeed = 400; // or any number
  if (speed > maxSpeed) speed = maxSpeed;

  // Keep angle in [0, 2π)
  plane.angle = plane.angle % (2 * Math.PI);
  if (plane.angle < 0) plane.angle += 2 * Math.PI;

  // === 6) Convert speed + angle -> vx, vy ===
  plane.vx = speed * Math.sin(plane.angle);
  plane.vy = speed * Math.cos(plane.angle);

  // --- 7. Check for stall recovery ---
  if (plane.stalled && speed >= stallRecoveryThreshold) {
    // Once enough speed is regained, cancel the stall.
    plane.stalled = false;
  }

  // --- 8. Update the plane's angle ---
  if (plane.stalled) {
    // When stalled, lock the plane's nose downward.
    plane.angle = stallAngle;
  }

  const GROUND_LEVEL = 850; // Adjust as needed
  if (plane.y > GROUND_LEVEL) {
    plane.y = GROUND_LEVEL;
    plane.vy = 0; // Stop vertical movement
    plane.vx *= 0.5; // Ground friction
  }

  // === 7) Update x,y (if your y axis grows downward, do plane.y += vy) ===
  plane.x += plane.vx * deltaTime;
  plane.y -= plane.vy * deltaTime; // "Triplane" style, up is negative y
  return plane;
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
