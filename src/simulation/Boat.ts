import * as THREE from 'three';

/**
 * Creates a recognizable boat model from Three.js primitives.
 * Includes hull, cabin, and mast for orientation reference.
 */
export class Boat {
  public group: THREE.Group;
  public gunMount: THREE.Group;  // Gun turret that can rotate

  // Boat dimensions for physics (larger boat)
  public readonly length: number = 8;
  public readonly width: number = 3;
  public readonly height: number = 1.4;
  public readonly draft: number = 0.5; // How deep it sits in water

  constructor() {
    this.group = new THREE.Group();
    this.gunMount = new THREE.Group();
    this.createHull();
    this.createCabin();
    this.createMast();
    this.createGunMount();
  }

  private createHull(): void {
    // Create boat hull using a custom shape
    const hullShape = new THREE.Shape();

    // Define hull outline (top view, then extrude)
    const halfLength = this.length / 2;
    const halfWidth = this.width / 2;

    // Start at stern (back) center
    hullShape.moveTo(0, -halfLength);

    // Right side - stern to bow
    hullShape.quadraticCurveTo(halfWidth, -halfLength * 0.8, halfWidth, 0);
    hullShape.quadraticCurveTo(halfWidth * 0.6, halfLength * 0.8, 0, halfLength);

    // Left side - bow to stern
    hullShape.quadraticCurveTo(-halfWidth * 0.6, halfLength * 0.8, -halfWidth, 0);
    hullShape.quadraticCurveTo(-halfWidth, -halfLength * 0.8, 0, -halfLength);

    // Extrude settings
    const extrudeSettings = {
      depth: this.height,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.1,
      bevelSegments: 3
    };

    const hullGeometry = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);

    // Rotate to proper orientation (hull should be horizontal)
    hullGeometry.rotateX(-Math.PI / 2);
    hullGeometry.translate(0, -this.height / 2 + this.draft, 0);

    const hullMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      specular: 0x111111,
      shininess: 30
    });

    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.castShadow = true;
    hull.receiveShadow = true;

    this.group.add(hull);

    // Add deck (top surface)
    const deckGeometry = new THREE.PlaneGeometry(this.width * 0.85, this.length * 0.9);
    deckGeometry.rotateX(-Math.PI / 2);
    deckGeometry.translate(0, this.draft, 0);

    const deckMaterial = new THREE.MeshPhongMaterial({
      color: 0xdeb887, // Burlywood - wooden deck color
      specular: 0x111111,
      shininess: 20
    });

    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.receiveShadow = true;
    this.group.add(deck);
  }

  private createCabin(): void {
    // Main cabin body
    const cabinWidth = this.width * 0.6;
    const cabinLength = this.length * 0.35;
    const cabinHeight = 1.2;

    const cabinGeometry = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
    cabinGeometry.translate(0, this.draft + cabinHeight / 2, -this.length * 0.1);

    const cabinMaterial = new THREE.MeshPhongMaterial({
      color: 0x1e5799, // Blue cabin
      specular: 0x333333,
      shininess: 40
    });

    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.castShadow = true;
    cabin.receiveShadow = true;

    this.group.add(cabin);

    // Cabin roof (slightly larger)
    const roofGeometry = new THREE.BoxGeometry(cabinWidth + 0.2, 0.12, cabinLength + 0.2);
    roofGeometry.translate(0, this.draft + cabinHeight + 0.06, -this.length * 0.1);

    const roofMaterial = new THREE.MeshPhongMaterial({
      color: 0xeeeeee,
      specular: 0x111111,
      shininess: 20
    });

    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.castShadow = true;
    this.group.add(roof);

    // Windows (small blue rectangles)
    const windowMaterial = new THREE.MeshPhongMaterial({
      color: 0x87ceeb,
      specular: 0x888888,
      shininess: 100,
      transparent: true,
      opacity: 0.8
    });

    const windowGeometry = new THREE.PlaneGeometry(0.4, 0.4);

    // Add windows to both sides
    [-1, 1].forEach((side) => {
      const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
      window1.position.set(
        side * (cabinWidth / 2 + 0.001),
        this.draft + cabinHeight * 0.6,
        -this.length * 0.1
      );
      window1.rotation.y = side * Math.PI / 2;
      this.group.add(window1);
    });
  }

  private createMast(): void {
    // Mast pole
    const mastHeight = 5;
    const mastGeometry = new THREE.CylinderGeometry(0.08, 0.1, mastHeight, 8);
    mastGeometry.translate(0, this.draft + mastHeight / 2, this.length * 0.2);

    const mastMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b4513, // Wood brown
      specular: 0x111111,
      shininess: 10
    });

    const mast = new THREE.Mesh(mastGeometry, mastMaterial);
    mast.castShadow = true;
    this.group.add(mast);

    // Flag for orientation (red triangle)
    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0);
    flagShape.lineTo(1.2, 0.4);
    flagShape.lineTo(0, 0.8);
    flagShape.lineTo(0, 0);

    const flagGeometry = new THREE.ShapeGeometry(flagShape);
    flagGeometry.rotateY(-Math.PI / 2); // Face sideways
    flagGeometry.translate(0, this.draft + mastHeight - 1, this.length * 0.2);

    const flagMaterial = new THREE.MeshPhongMaterial({
      color: 0xff4444,
      side: THREE.DoubleSide
    });

    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    this.group.add(flag);
  }

  private createGunMount(): void {
    // Cabin height for positioning on roof
    const cabinHeight = 1.2;
    const roofY = this.draft + cabinHeight + 0.12;

    // Position on the cabin roof
    this.gunMount.position.set(0, roofY, -this.length * 0.1);

    // Initial rotation toward island (45 degrees) - will be controlled by Simulation
    this.gunMount.rotation.y = Math.PI / 4;

    const metalMaterial = new THREE.MeshPhongMaterial({
      color: 0x3a3a3a,
      specular: 0x888888,
      shininess: 80
    });

    const darkMetalMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a1a,
      specular: 0x666666,
      shininess: 50
    });

    const gunMetalMaterial = new THREE.MeshPhongMaterial({
      color: 0x2d2d2d,
      specular: 0x555555,
      shininess: 60
    });

    // Base platform (circular) - larger
    const baseGeometry = new THREE.CylinderGeometry(0.9, 1.0, 0.2, 20);
    const base = new THREE.Mesh(baseGeometry, metalMaterial);
    base.position.y = 0.1;
    base.castShadow = true;
    this.gunMount.add(base);

    // Pedestal - taller and wider
    const pedestalGeometry = new THREE.CylinderGeometry(0.45, 0.6, 0.7, 16);
    const pedestal = new THREE.Mesh(pedestalGeometry, metalMaterial);
    pedestal.position.y = 0.55;
    pedestal.castShadow = true;
    this.gunMount.add(pedestal);

    // Turret ring
    const ringGeometry = new THREE.TorusGeometry(0.5, 0.08, 8, 24);
    ringGeometry.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeometry, darkMetalMaterial);
    ring.position.y = 0.9;
    ring.castShadow = true;
    this.gunMount.add(ring);

    // Main gun housing / receiver
    const housingGeometry = new THREE.BoxGeometry(0.7, 0.5, 1.4);
    const housing = new THREE.Mesh(housingGeometry, gunMetalMaterial);
    housing.position.set(0, 1.2, 0.3);
    housing.castShadow = true;
    this.gunMount.add(housing);

    // Barrel jacket (outer barrel)
    const jacketGeometry = new THREE.CylinderGeometry(0.14, 0.16, 2.8, 16);
    jacketGeometry.rotateX(Math.PI / 2);
    const jacket = new THREE.Mesh(jacketGeometry, darkMetalMaterial);
    jacket.position.set(0, 1.2, 2.0);
    jacket.castShadow = true;
    this.gunMount.add(jacket);

    // Inner barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 12);
    barrelGeometry.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeometry, gunMetalMaterial);
    barrel.position.set(0, 1.2, 2.2);
    barrel.castShadow = true;
    this.gunMount.add(barrel);

    // Muzzle brake / flash hider
    const muzzleGeometry = new THREE.CylinderGeometry(0.18, 0.14, 0.4, 16);
    muzzleGeometry.rotateX(Math.PI / 2);
    const muzzle = new THREE.Mesh(muzzleGeometry, metalMaterial);
    muzzle.position.set(0, 1.2, 3.6);
    muzzle.castShadow = true;
    this.gunMount.add(muzzle);

    // Muzzle holes (decorative rings)
    for (let i = 0; i < 3; i++) {
      const holeRing = new THREE.TorusGeometry(0.16, 0.02, 6, 16);
      holeRing.rotateX(Math.PI / 2);
      const holeMesh = new THREE.Mesh(holeRing, darkMetalMaterial);
      holeMesh.position.set(0, 1.2, 3.45 + i * 0.12);
      this.gunMount.add(holeMesh);
    }

    // Rear grip / spade handles
    const handleGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
    [-1, 1].forEach((side) => {
      const handle = new THREE.Mesh(handleGeometry, metalMaterial);
      handle.position.set(side * 0.4, 1.0, -0.5);
      handle.rotation.x = Math.PI / 4;
      handle.rotation.z = side * 0.2;
      handle.castShadow = true;
      this.gunMount.add(handle);

      // Handle grips
      const gripGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
      const gripMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
      const grip = new THREE.Mesh(gripGeometry, gripMaterial);
      grip.position.set(side * 0.5, 0.8, -0.7);
      grip.rotation.x = Math.PI / 4;
      grip.castShadow = true;
      this.gunMount.add(grip);
    });

    // Ammo belt feed (box)
    const ammoBoxGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.4);
    const ammoBoxMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a5c3d,
      specular: 0x333333,
      shininess: 30
    });
    const ammoBox = new THREE.Mesh(ammoBoxGeometry, ammoBoxMaterial);
    ammoBox.position.set(0.6, 1.0, 0.2);
    ammoBox.castShadow = true;
    this.gunMount.add(ammoBox);

    // Ammo belt (connecting box to gun)
    const beltGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.3);
    const belt = new THREE.Mesh(beltGeometry, ammoBoxMaterial);
    belt.position.set(0.35, 1.15, 0.2);
    belt.castShadow = true;
    this.gunMount.add(belt);

    // Gun shield (larger protective plate)
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(-0.8, 0);
    shieldShape.lineTo(-0.7, 0.9);
    shieldShape.lineTo(-0.3, 1.0);
    shieldShape.lineTo(0.3, 1.0);
    shieldShape.lineTo(0.7, 0.9);
    shieldShape.lineTo(0.8, 0);
    shieldShape.lineTo(-0.8, 0);

    const shieldGeometry = new THREE.ExtrudeGeometry(shieldShape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2
    });
    const shield = new THREE.Mesh(shieldGeometry, metalMaterial);
    shield.position.set(0, 0.9, 0.9);
    shield.castShadow = true;
    this.gunMount.add(shield);

    // Sight / optic on top
    const sightBaseGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.3);
    const sightBase = new THREE.Mesh(sightBaseGeometry, darkMetalMaterial);
    sightBase.position.set(0, 1.5, 0.1);
    sightBase.castShadow = true;
    this.gunMount.add(sightBase);

    const sightGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.25, 12);
    sightGeometry.rotateX(Math.PI / 2);
    const sight = new THREE.Mesh(sightGeometry, darkMetalMaterial);
    sight.position.set(0, 1.55, 0.1);
    sight.castShadow = true;
    this.gunMount.add(sight);

    this.group.add(this.gunMount);
  }

  /**
   * Get probe points for buoyancy calculation.
   * These are positions relative to boat center, at the bottom of the hull.
   */
  getProbePoints(): THREE.Vector3[] {
    const probeY = -this.draft; // Bottom of hull

    return [
      // Bow (front)
      new THREE.Vector3(0, probeY, this.length * 0.4),
      // Stern (back) - two points for stability
      new THREE.Vector3(-this.width * 0.3, probeY, -this.length * 0.35),
      new THREE.Vector3(this.width * 0.3, probeY, -this.length * 0.35),
      // Port side (left)
      new THREE.Vector3(-this.width * 0.4, probeY, 0),
      // Starboard side (right)
      new THREE.Vector3(this.width * 0.4, probeY, 0),
      // Center
      new THREE.Vector3(0, probeY, 0),
    ];
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
