export function spawnProjectile() {
  const projectile = {
    x: 0,
    y: 0,
    angle: 0,
    speed: 10,
    fired: false,
  };
  return projectile;
}

export function respawnProjectile(projectile, plane) {
  projectile.x = plane.x;
  projectile.y = plane.y;
  projectile.angle = plane.angle - Math.PI / 2;
  projectile.fired = true;
  return projectile;
}

export function moveProjectile(projectile) {
  if (projectile.fired) {
    projectile.x += Math.cos(projectile.angle) * projectile.speed;
    projectile.y += Math.sin(projectile.angle) * projectile.speed;
  }
}
