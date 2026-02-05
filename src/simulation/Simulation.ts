import * as THREE from 'three';
import { Ocean } from './Ocean';
import { OceanMesh } from './OceanMesh';
import { Boat } from './Boat';
import { BoatPhysics } from './BoatPhysics';
import { Island } from './Island';
import type { WavePreset, BoatTelemetry, TelemetryCallback } from './types';

/**
 * Main simulation controller.
 * Manages the Three.js scene, animation loop, and telemetry output.
 */
export class Simulation {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private gunCamera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  private ocean: Ocean;
  private oceanMesh: OceanMesh;
  private boat: Boat;
  private boatPhysics: BoatPhysics;
  private island: Island;

  private clock: THREE.Clock;
  private animationId: number | null = null;

  private telemetryInterval: number | null = null;
  private telemetryCallback: TelemetryCallback | null = null;

  private currentPreset: WavePreset = 'moderate';

  // Gun aiming control
  private gunYaw: number = 0;      // Left/right rotation
  private gunPitch: number = 0;    // Up/down rotation
  private readonly gunTurnSpeed = 0.02;
  private readonly gunPitchLimit = Math.PI / 6;  // 30 degrees up/down
  private readonly gunYawLimit = Math.PI / 3;    // 60 degrees left/right
  private keysPressed: Set<string> = new Set();

  constructor(container: HTMLElement) {
    this.container = container;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 50, 150);

    // Main camera setup
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(-18, 10, -18);
    this.camera.lookAt(0, 0, 0);

    // Gun sight camera (narrow FOV for zoom effect)
    this.gunCamera = new THREE.PerspectiveCamera(
      25,
      1,
      0.1,
      500
    );

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.autoClear = false;
    container.appendChild(this.renderer.domElement);

    // Lighting
    this.setupLighting();

    // Ocean
    this.ocean = new Ocean(this.currentPreset);
    this.oceanMesh = new OceanMesh(this.ocean);
    this.scene.add(this.oceanMesh.mesh);

    // Island
    this.island = new Island(25, 25);
    this.scene.add(this.island.group);

    // Boat
    this.boat = new Boat();
    this.scene.add(this.boat.group);

    // Attach gun camera to boat
    // Position: on cabin roof at gun sight position
    this.gunCamera.position.set(0, 2.2, -0.8);
    this.boat.group.add(this.gunCamera);

    // Initial gun direction: toward island (25, 25) from origin
    // Camera looks in -Z by default, rotate to face island direction
    // Direction to island is (+X, +Z), need to rotate -135° from -Z
    this.gunYaw = -Math.PI * 3 / 4;
    this.updateGunRotation();

    // Physics
    this.boatPhysics = new BoatPhysics(this.boat, this.ocean);
    this.boatPhysics.setPosition(0, 0, 0);

    // Clock
    this.clock = new THREE.Clock();

    // Handle resize
    window.addEventListener('resize', this.onResize.bind(this));

    // Keyboard controls for gun
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.keysPressed.add(event.key);
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keysPressed.delete(event.key);
  }

  private updateGunControls(): void {
    // Arrow keys control gun direction
    if (this.keysPressed.has('ArrowLeft')) {
      this.gunYaw += this.gunTurnSpeed;
    }
    if (this.keysPressed.has('ArrowRight')) {
      this.gunYaw -= this.gunTurnSpeed;
    }
    if (this.keysPressed.has('ArrowUp')) {
      this.gunPitch += this.gunTurnSpeed;
    }
    if (this.keysPressed.has('ArrowDown')) {
      this.gunPitch -= this.gunTurnSpeed;
    }

    // Clamp values
    this.gunPitch = THREE.MathUtils.clamp(this.gunPitch, -this.gunPitchLimit, this.gunPitchLimit);

    this.updateGunRotation();
  }

  private updateGunRotation(): void {
    // Apply rotation to gun camera (YXZ order: yaw first, then pitch)
    this.gunCamera.rotation.set(this.gunPitch, this.gunYaw, 0, 'YXZ');

    // Rotate the gun model to match camera direction
    // Gun barrel points in +Z, camera looks at -Z, so offset by PI
    // Also apply pitch to the gun model
    this.boat.gunMount.rotation.set(this.gunPitch, this.gunYaw + Math.PI, 0, 'YXZ');
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    sunLight.position.set(30, 40, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    this.scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x006994, 0.4);
    this.scene.add(hemiLight);
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  start(): void {
    this.clock.start();
    this.animate();
    this.startTelemetry();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.stopTelemetry();
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);

    const deltaTime = this.clock.getDelta();

    // Update ocean waves
    this.ocean.update(deltaTime);
    this.oceanMesh.update();

    // Update boat physics
    this.boatPhysics.update(deltaTime);

    // Update island
    this.island.update(deltaTime);

    // Update gun controls (arrow keys)
    this.updateGunControls();

    // Main camera looks at boat
    const boatPos = this.boatPhysics.getPosition();
    this.camera.lookAt(boatPos.x, boatPos.y + 1, boatPos.z);

    // Render both views
    this.renderViews();
  };

  private renderViews(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.renderer.clear();

    // Main view (full screen)
    this.renderer.setViewport(0, 0, width, height);
    this.renderer.setScissor(0, 0, width, height);
    this.renderer.setScissorTest(false);
    this.renderer.render(this.scene, this.camera);

    // Gun sight view (top-right corner, inside frame)
    const frameWidth = Math.min(320, width * 0.37);
    const sightSize = frameWidth - 20;
    const frameTop = 10;
    const framePadding = 10;

    // Three.js viewport coordinates are from bottom-left
    const sightX = width - frameWidth + framePadding;
    const sightY = height - frameTop - framePadding - sightSize;

    this.renderer.setScissorTest(true);
    this.renderer.setViewport(sightX, sightY, sightSize, sightSize);
    this.renderer.setScissor(sightX, sightY, sightSize, sightSize);

    // Render gun camera view
    this.renderer.render(this.scene, this.gunCamera);

    this.renderer.setScissorTest(false);
  }

  setWavePreset(preset: WavePreset): void {
    this.currentPreset = preset;
    this.ocean.setPreset(preset);
  }

  getWavePreset(): WavePreset {
    return this.currentPreset;
  }

  onTelemetry(callback: TelemetryCallback): void {
    this.telemetryCallback = callback;
  }

  private startTelemetry(): void {
    this.telemetryInterval = window.setInterval(() => {
      if (this.telemetryCallback) {
        const telemetry = this.boatPhysics.getTelemetry();
        this.telemetryCallback(telemetry);
      }
    }, 50);
  }

  private stopTelemetry(): void {
    if (this.telemetryInterval !== null) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }
  }

  resetBoat(): void {
    this.boatPhysics.reset();
  }

  dispose(): void {
    this.stop();
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('keyup', this.onKeyUp.bind(this));
    this.oceanMesh.dispose();
    this.boat.dispose();
    this.island.dispose();
    this.renderer.dispose();
  }
}
