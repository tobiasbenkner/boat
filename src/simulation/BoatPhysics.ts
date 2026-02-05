import * as THREE from 'three';
import { Boat } from './Boat';
import { Ocean } from './Ocean';
import type { BoatTelemetry } from './types';

/**
 * Physics simulation for boat buoyancy and movement.
 * Uses a spring-damper system for smooth wave following.
 */
export class BoatPhysics {
  private boat: Boat;
  private ocean: Ocean;

  // State
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private targetY: number = 0;

  // Rotation state (pitch and roll)
  private pitch: number = 0;
  private roll: number = 0;
  private pitchVelocity: number = 0;
  private rollVelocity: number = 0;
  private yaw: number = 0;

  // Anchor mode - boat stays in place
  private anchored: boolean = true;

  // Physics parameters - tuned for larger, heavier boat
  private readonly verticalStiffness = 4;    // Lower = slower vertical response
  private readonly verticalDamping = 4;      // Higher relative to stiffness = less bouncy
  private readonly rotationalStiffness = 2;  // Lower = slower rotation
  private readonly rotationalDamping = 3;    // More damping = smoother
  private readonly waterlineOffset = -0.3;   // Negative = sits deeper in water

  constructor(boat: Boat, ocean: Ocean) {
    this.boat = boat;
    this.ocean = ocean;

    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
  }

  setAnchored(anchored: boolean): void {
    this.anchored = anchored;
  }

  isAnchored(): boolean {
    return this.anchored;
  }

  update(deltaTime: number): void {
    const dt = Math.min(deltaTime, 0.033);

    // When anchored, boat stays in place but can drift slightly with waves
    if (!this.anchored) {
      // Small drift from wave motion
      this.velocity.x *= 0.98;
      this.velocity.z *= 0.98;
      this.position.x += this.velocity.x * dt;
      this.position.z += this.velocity.z * dt;
    }

    // --- Vertical buoyancy (wave following) ---
    const waveHeight = this.ocean.getWaveHeight(this.position.x, this.position.z);
    const normal = this.ocean.getSurfaceNormal(this.position.x, this.position.z);

    this.targetY = waveHeight + this.waterlineOffset;

    const displacement = this.position.y - this.targetY;
    const springForce = -this.verticalStiffness * displacement;
    const dampingForce = -this.verticalDamping * this.velocity.y;

    this.velocity.y += (springForce + dampingForce) * dt;
    this.position.y += this.velocity.y * dt;

    // --- Rotation (pitch and roll from waves) ---
    const targetPitch = Math.asin(-normal.z) * 0.7;
    const targetRoll = Math.asin(normal.x) * 0.7;

    const pitchDisplacement = this.pitch - targetPitch;
    const pitchSpring = -this.rotationalStiffness * pitchDisplacement;
    const pitchDamp = -this.rotationalDamping * this.pitchVelocity;
    this.pitchVelocity += (pitchSpring + pitchDamp) * dt;
    this.pitch += this.pitchVelocity * dt;

    const rollDisplacement = this.roll - targetRoll;
    const rollSpring = -this.rotationalStiffness * rollDisplacement;
    const rollDamp = -this.rotationalDamping * this.rollVelocity;
    this.rollVelocity += (rollSpring + rollDamp) * dt;
    this.roll += this.rollVelocity * dt;

    // Clamp rotations
    this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 6, Math.PI / 6);
    this.roll = THREE.MathUtils.clamp(this.roll, -Math.PI / 6, Math.PI / 6);

    // --- Apply to boat mesh ---
    this.boat.group.position.copy(this.position);
    this.boat.group.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
  }

  getTelemetry(): BoatTelemetry {
    return {
      timestamp: Date.now(),
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
      },
      rotation: {
        roll: THREE.MathUtils.radToDeg(this.roll),
        pitch: THREE.MathUtils.radToDeg(this.pitch),
        yaw: THREE.MathUtils.radToDeg(this.yaw)
      },
      velocity: {
        x: this.velocity.x,
        y: this.velocity.y,
        z: this.velocity.z
      }
    };
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
    this.boat.group.position.copy(this.position);
  }

  reset(): void {
    this.position.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;
    this.pitchVelocity = 0;
    this.rollVelocity = 0;
    this.anchored = true;
    this.boat.group.position.copy(this.position);
    this.boat.group.rotation.set(0, 0, 0);
  }
}
