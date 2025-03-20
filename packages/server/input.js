export function handleInput(plane, data) {
  // Delta values for adjustments – tweak these for the game feel you want.
  const ANGLE_VELOCITY_DELTA = Math.PI / 12; // change in angular velocity per command
  plane.isFiring = false;

  switch (data) {
    case "up":
      // Pitch the airplane upward by decreasing angular velocity.
      if(!plane.stalled){
        plane.angle -= ANGLE_VELOCITY_DELTA;
      }
      break;
    case "down":
      // Pitch the airplane downward by increasing angular velocity.
      if(!plane.stalled){
        plane.angle += ANGLE_VELOCITY_DELTA;
      }
      break;
    case "increaseThrust":
      plane.isThrusting = true;
      break;
    case "decreaseThrust":
      // Prevent thrust from dropping below zero.
      plane.isThrusting = false;
      break;
    case "fire":
      plane.isFiring = true;
      break;
    default:
      // Handle unknown commands if necessary.
      console.log(`Unknown control command: ${data}`);
  }
}
