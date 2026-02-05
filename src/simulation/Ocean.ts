import type { WaveConfig, WaveParams, WavePreset } from './types';
import { WAVE_PRESETS } from './types';

/**
 * Ocean wave calculator using Gerstner waves.
 * Provides wave height and surface normal calculation for physics.
 */
export class Ocean {
  private config: WaveConfig;
  private time: number = 0;

  constructor(preset: WavePreset = 'moderate') {
    this.config = WAVE_PRESETS[preset];
  }

  setPreset(preset: WavePreset): void {
    this.config = WAVE_PRESETS[preset];
  }

  setConfig(config: WaveConfig): void {
    this.config = config;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
  }

  getTime(): number {
    return this.time;
  }

  /**
   * Calculate wave height at a given world position.
   */
  getWaveHeight(x: number, z: number): number {
    let height = 0;

    for (const wave of this.config.waves) {
      const { amplitude, wavelength, direction, speed } = wave;

      // Normalize direction
      const dirLength = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
      const dirX = direction.x / dirLength;
      const dirZ = direction.z / dirLength;

      // Wave number k = 2π/λ
      const k = (2 * Math.PI) / wavelength;

      // Use deep water dispersion: ω = √(g*k), scaled by speed factor
      const omega = Math.sqrt(9.81 * k) * speed;

      // Phase: k·(D·P) - ωt
      const phase = k * (dirX * x + dirZ * z) - omega * this.time;

      height += amplitude * Math.sin(phase);
    }

    return height;
  }

  /**
   * Calculate displaced position using Gerstner wave formula.
   * Returns the full displaced position (x, y, z).
   */
  getDisplacedPosition(x: number, z: number): { x: number; y: number; z: number } {
    let totalDx = 0;
    let totalDy = 0;
    let totalDz = 0;

    for (const wave of this.config.waves) {
      const { amplitude, wavelength, direction, speed, steepness } = wave;

      // Normalize direction
      const dirLength = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
      const dirX = direction.x / dirLength;
      const dirZ = direction.z / dirLength;

      // Wave number k = 2π/λ
      const k = (2 * Math.PI) / wavelength;

      // Deep water dispersion relation
      const omega = Math.sqrt(9.81 * k) * speed;

      // Phase
      const phase = k * (dirX * x + dirZ * z) - omega * this.time;

      // Gerstner Q parameter - controls steepness
      // Q should be between 0 and 1/(k*A) to avoid loops
      // We use steepness as a normalized value (0-1)
      const Q = steepness / (k * amplitude * this.config.waves.length);
      const clampedQ = Math.min(Q, 1 / (k * amplitude + 0.001));

      const cosPhase = Math.cos(phase);
      const sinPhase = Math.sin(phase);

      // Gerstner displacement formulas
      totalDx += clampedQ * amplitude * dirX * cosPhase;
      totalDy += amplitude * sinPhase;
      totalDz += clampedQ * amplitude * dirZ * cosPhase;
    }

    return {
      x: x - totalDx,
      y: totalDy,
      z: z - totalDz
    };
  }

  /**
   * Calculate surface normal at a given position using finite differences.
   */
  getSurfaceNormal(x: number, z: number): { x: number; y: number; z: number } {
    const eps = 0.5;

    // Sample heights around the point
    const hL = this.getWaveHeight(x - eps, z);
    const hR = this.getWaveHeight(x + eps, z);
    const hD = this.getWaveHeight(x, z - eps);
    const hU = this.getWaveHeight(x, z + eps);

    // Gradient
    const dhdx = (hR - hL) / (2 * eps);
    const dhdz = (hU - hD) / (2 * eps);

    // Normal = (-dh/dx, 1, -dh/dz) normalized
    const nx = -dhdx;
    const ny = 1;
    const nz = -dhdz;

    const length = Math.sqrt(nx * nx + ny * ny + nz * nz);

    return {
      x: nx / length,
      y: ny / length,
      z: nz / length
    };
  }
}
