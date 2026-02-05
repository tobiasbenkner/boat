import * as THREE from 'three';
import { Ocean } from './Ocean';

/**
 * Visual representation of the ocean surface.
 * Uses a PlaneGeometry that deforms based on Ocean wave calculations.
 */
export class OceanMesh {
  public mesh: THREE.Mesh;
  private geometry: THREE.PlaneGeometry;
  private ocean: Ocean;
  private originalPositions: Float32Array;

  private readonly segmentsX: number;
  private readonly segmentsZ: number;
  private readonly sizeX: number;
  private readonly sizeZ: number;

  constructor(ocean: Ocean, sizeX: number = 100, sizeZ: number = 100, segments: number = 128) {
    this.ocean = ocean;
    this.sizeX = sizeX;
    this.sizeZ = sizeZ;
    this.segmentsX = segments;
    this.segmentsZ = segments;

    // Create geometry
    this.geometry = new THREE.PlaneGeometry(sizeX, sizeZ, this.segmentsX, this.segmentsZ);
    this.geometry.rotateX(-Math.PI / 2); // Make it horizontal

    // Store original positions for wave calculation
    this.originalPositions = new Float32Array(this.geometry.attributes.position.array);

    // Create material with water-like appearance
    const material = new THREE.MeshPhongMaterial({
      color: 0x0077be,
      specular: 0x111111,
      shininess: 100,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      flatShading: false,
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;
  }

  update(): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    const vertexCount = positions.length / 3;

    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3;

      // Get original x, z positions (y is now vertical due to rotation)
      const origX = this.originalPositions[i3];
      const origZ = this.originalPositions[i3 + 2];

      // Get displaced position from ocean
      const displaced = this.ocean.getDisplacedPosition(origX, origZ);

      // Update vertex position
      positions[i3] = displaced.x;
      positions[i3 + 1] = displaced.y;
      positions[i3 + 2] = displaced.z;
    }

    // Mark geometry for update
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  dispose(): void {
    this.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
