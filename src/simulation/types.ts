export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  roll: number;   // rotation around Z axis
  pitch: number;  // rotation around X axis
  yaw: number;    // rotation around Y axis
}

export interface BoatTelemetry {
  timestamp: number;
  position: Vector3;
  rotation: Rotation;
  velocity: Vector3;
}

export interface WaveParams {
  amplitude: number;      // Wave height (meters)
  wavelength: number;     // Distance between crests (meters)
  direction: { x: number; z: number };  // Wave travel direction
  speed: number;          // Speed multiplier (1.0 = realistic)
  steepness: number;      // Gerstner steepness (0-1)
}

export interface WaveConfig {
  waves: WaveParams[];
}

export type WavePreset = 'calm' | 'moderate' | 'rough' | 'storm';

// Realistic wave presets based on Beaufort scale approximations
export const WAVE_PRESETS: Record<WavePreset, WaveConfig> = {
  calm: {
    // Beaufort 2-3: Light breeze, small wavelets
    waves: [
      { amplitude: 0.08, wavelength: 15, direction: { x: 1, z: 0.2 }, speed: 0.8, steepness: 0.3 },
      { amplitude: 0.05, wavelength: 10, direction: { x: 0.7, z: 0.7 }, speed: 0.9, steepness: 0.2 },
    ]
  },
  moderate: {
    // Beaufort 4-5: Moderate breeze, small waves
    waves: [
      { amplitude: 0.25, wavelength: 20, direction: { x: 1, z: 0.1 }, speed: 1.0, steepness: 0.4 },
      { amplitude: 0.15, wavelength: 12, direction: { x: 0.6, z: 0.8 }, speed: 1.0, steepness: 0.35 },
      { amplitude: 0.08, wavelength: 8, direction: { x: -0.3, z: 1 }, speed: 1.1, steepness: 0.25 },
    ]
  },
  rough: {
    // Beaufort 6-7: Strong breeze to near gale
    waves: [
      { amplitude: 0.6, wavelength: 25, direction: { x: 1, z: 0 }, speed: 1.0, steepness: 0.5 },
      { amplitude: 0.4, wavelength: 15, direction: { x: 0.8, z: 0.6 }, speed: 1.0, steepness: 0.45 },
      { amplitude: 0.2, wavelength: 10, direction: { x: 0.3, z: 0.95 }, speed: 1.1, steepness: 0.35 },
    ]
  },
  storm: {
    // Beaufort 8-9: Gale to strong gale
    waves: [
      { amplitude: 1.2, wavelength: 35, direction: { x: 1, z: 0.1 }, speed: 1.0, steepness: 0.55 },
      { amplitude: 0.8, wavelength: 20, direction: { x: 0.7, z: 0.7 }, speed: 1.0, steepness: 0.5 },
      { amplitude: 0.5, wavelength: 12, direction: { x: -0.2, z: 1 }, speed: 1.1, steepness: 0.4 },
      { amplitude: 0.25, wavelength: 7, direction: { x: 0.9, z: -0.4 }, speed: 1.2, steepness: 0.35 },
    ]
  }
};

export type TelemetryCallback = (telemetry: BoatTelemetry) => void;
