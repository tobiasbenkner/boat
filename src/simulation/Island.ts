import * as THREE from 'three';

/**
 * Creates a small tropical island with a palm tree.
 */
export class Island {
  public group: THREE.Group;
  public position: THREE.Vector3;
  public radius: number = 5; // Island radius for collision/target detection

  private palmLeaves: THREE.Group;
  private time: number = 0;

  constructor(x: number = 20, z: number = 20) {
    this.group = new THREE.Group();
    this.position = new THREE.Vector3(x, 0, z);
    this.group.position.copy(this.position);

    this.palmLeaves = new THREE.Group();

    this.createBeach();
    this.createPalmTree();
  }

  private createBeach(): void {
    // Main island body - flattened sphere for natural look
    const islandGeometry = new THREE.SphereGeometry(5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    islandGeometry.scale(1, 0.3, 1);

    const sandMaterial = new THREE.MeshPhongMaterial({
      color: 0xf4d03f, // Sandy yellow
      specular: 0x111111,
      shininess: 5,
      flatShading: false
    });

    const island = new THREE.Mesh(islandGeometry, sandMaterial);
    island.position.y = -0.2;
    island.receiveShadow = true;
    island.castShadow = true;
    this.group.add(island);

    // Beach ring - slightly larger and lower
    const beachGeometry = new THREE.RingGeometry(4.5, 6.5, 32);
    beachGeometry.rotateX(-Math.PI / 2);

    const beachMaterial = new THREE.MeshPhongMaterial({
      color: 0xfdeaa8, // Lighter sand
      specular: 0x111111,
      shininess: 5,
      side: THREE.DoubleSide
    });

    const beach = new THREE.Mesh(beachGeometry, beachMaterial);
    beach.position.y = -0.15;
    beach.receiveShadow = true;
    this.group.add(beach);

    // Small rocks for detail
    const rockMaterial = new THREE.MeshPhongMaterial({
      color: 0x808080,
      specular: 0x222222,
      shininess: 10
    });

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 3.5 + Math.random() * 1.5;
      const rockSize = 0.15 + Math.random() * 0.2;

      const rockGeometry = new THREE.DodecahedronGeometry(rockSize, 0);
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(
        Math.cos(angle) * dist,
        rockSize * 0.3,
        Math.sin(angle) * dist
      );
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      this.group.add(rock);
    }
  }

  private createPalmTree(): void {
    // Trunk - curved using multiple segments
    const trunkMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b4513, // Brown
      specular: 0x111111,
      shininess: 5
    });

    const trunkGroup = new THREE.Group();
    const segments = 8;
    const trunkHeight = 4;
    const segmentHeight = trunkHeight / segments;

    for (let i = 0; i < segments; i++) {
      const radius = 0.15 - (i * 0.01); // Taper toward top
      const segGeometry = new THREE.CylinderGeometry(
        radius - 0.01,
        radius,
        segmentHeight,
        8
      );

      const segment = new THREE.Mesh(segGeometry, trunkMaterial);

      // Slight curve
      const curve = Math.sin((i / segments) * Math.PI) * 0.3;
      segment.position.set(
        curve,
        i * segmentHeight + segmentHeight / 2,
        0
      );
      segment.rotation.z = (i / segments) * 0.2;
      segment.castShadow = true;

      trunkGroup.add(segment);
    }

    // Position trunk on island
    trunkGroup.position.set(0.5, 0.8, 0.3);
    this.group.add(trunkGroup);

    // Palm leaves
    this.palmLeaves.position.set(
      0.5 + Math.sin(1) * 0.3 * segments / 8,
      trunkHeight + 0.5,
      0.3
    );

    const leafMaterial = new THREE.MeshPhongMaterial({
      color: 0x228b22, // Forest green
      specular: 0x111111,
      shininess: 10,
      side: THREE.DoubleSide
    });

    // Create 7 palm leaves
    for (let i = 0; i < 7; i++) {
      const leaf = this.createPalmLeaf(leafMaterial);
      const angle = (i / 7) * Math.PI * 2;

      leaf.rotation.z = Math.PI / 4 + Math.random() * 0.2; // Droop angle
      leaf.rotation.y = angle;
      leaf.position.y = -0.1 * Math.abs(Math.sin(angle * 2));

      this.palmLeaves.add(leaf);
    }

    this.group.add(this.palmLeaves);

    // Coconuts
    const coconutMaterial = new THREE.MeshPhongMaterial({
      color: 0x5d4037,
      specular: 0x222222,
      shininess: 20
    });

    for (let i = 0; i < 3; i++) {
      const coconutGeometry = new THREE.SphereGeometry(0.12, 8, 8);
      const coconut = new THREE.Mesh(coconutGeometry, coconutMaterial);
      const angle = (i / 3) * Math.PI * 2 + 0.5;
      coconut.position.set(
        0.5 + Math.cos(angle) * 0.15,
        trunkHeight + 0.3,
        0.3 + Math.sin(angle) * 0.15
      );
      coconut.castShadow = true;
      this.group.add(coconut);
    }
  }

  private createPalmLeaf(material: THREE.Material): THREE.Group {
    const leafGroup = new THREE.Group();

    // Main leaf stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.03, 2, 4);
    stemGeometry.rotateZ(Math.PI / 2);
    stemGeometry.translate(1, 0, 0);

    const stem = new THREE.Mesh(stemGeometry, material);
    leafGroup.add(stem);

    // Leaf segments along stem
    const leafletCount = 12;
    for (let i = 0; i < leafletCount; i++) {
      const t = (i + 1) / leafletCount;
      const leafletLength = 0.4 * (1 - t * 0.5); // Shorter toward tip

      // Create leaflet shape
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(leafletLength * 0.5, leafletLength * 0.15, leafletLength, 0);
      shape.quadraticCurveTo(leafletLength * 0.5, -leafletLength * 0.15, 0, 0);

      const leafletGeometry = new THREE.ShapeGeometry(shape);

      // Two leaflets per position (left and right)
      [-1, 1].forEach((side) => {
        const leaflet = new THREE.Mesh(leafletGeometry, material);
        leaflet.position.set(t * 1.8 + 0.2, 0, 0);
        leaflet.rotation.y = side * Math.PI / 2;
        leaflet.rotation.x = side * (0.2 + t * 0.3); // Angle outward
        leaflet.rotation.z = -t * 0.5; // Droop more toward tip
        leafGroup.add(leaflet);
      });
    }

    return leafGroup;
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    // Gentle sway animation for palm leaves
    this.palmLeaves.rotation.x = Math.sin(this.time * 1.5) * 0.05;
    this.palmLeaves.rotation.z = Math.sin(this.time * 1.2 + 1) * 0.03;
  }

  dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
