import * as THREE from "three";
import { BufferAttribute, BufferGeometry, Line, LineBasicMaterial, LineSegments } from "three";

export function createLaserBeams(scene: THREE.Scene) {
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff });
  lineMaterial.linewidth = 3;
  const positions = new Float32Array(10 * 3);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  lineGeometry.setDrawRange(0, 0);
  const line = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(line);

  return lineGeometry;
}

export function createHubs(scene: THREE.Scene) {
  const hubPositions = [
    new THREE.Vector3(0.5, 1, -0.5),
    new THREE.Vector3(-0.5, 1, -0.5),
    new THREE.Vector3(0.3, 1.5, -0.2),
  ];

  const geometry = new THREE.BoxGeometry(0.02, 0.25, 0.25);

  const hubs = hubPositions.map((pos) => {
    const hubMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const hub = new THREE.Mesh(geometry, hubMaterial);
    hub.castShadow = true;
    hub.position.copy(pos);
    scene.add(hub);
    return hub;
  });

  return hubs;
}

export function createTeleport(scene: THREE.Scene) {
  const material = new THREE.MeshBasicMaterial({
    color: 0x884411,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
    transparent: true,
  });
  const ringGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.5, undefined, undefined, true);
  const ring = new THREE.Mesh(ringGeometry, material);

  return ring;
}

const vertices = new Float32Array(11 * 3);

export function createTeleportGuideline() {
  const geometry = new BufferGeometry();
  vertices.fill(0);
  geometry.setAttribute("position", new BufferAttribute(vertices, 3));
  const material = new LineBasicMaterial({
    color: 0x884411,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
    transparent: true,
    linewidth: 5,
  });
  const guideline = new Line(geometry, material);
  guideline.frustumCulled = false;
  return guideline;
}

export function updateGuideline(
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  guideline: THREE.Line,
  teleport: THREE.Mesh
) {
  const tmpVec = new THREE.Vector3();

  if (renderer.xr.getSession()) {
    const xrCamera = renderer.xr.getCamera(camera);
    const feetPos = xrCamera.getWorldPosition(tmpVec);
    feetPos.y = 0;

    const ctrl = renderer.xr.getController(0);
    const p = new THREE.Vector3();
    ctrl.getWorldPosition(p);
    const v = new THREE.Vector3();
    ctrl.getWorldDirection(v);
    v.multiplyScalar(6);

    const g = new THREE.Vector3(0, -9.8, 0);
    const t = (-v.y + Math.sqrt(v.y ** 2 - 2 * p.y * g.y)) / g.y;
    const lineGeometry = guideline.geometry as BufferGeometry;

    const vertex = tmpVec.set(0, 0, 0);
    for (let i = 0; i < 11; i++) {
      vertex.copy(guidePositionAtT((i * t) / 10, p, v, g));
      vertex.toArray(vertices, i * 3);
    }
    teleport.position.copy(guidePositionAtT(t, p, v, g));

    lineGeometry.attributes.position.needsUpdate = true;
  }
}

function guidePositionAtT(t: number, p: THREE.Vector3, v: THREE.Vector3, g: THREE.Vector3) {
  const result = p.clone();
  result.addScaledVector(v, t);
  result.addScaledVector(g, 0.5 * t ** 2);
  return result;
}

export function createDoor() {
  const box = new THREE.BoxGeometry(2, 3, 0.125);
  const material = new THREE.MeshLambertMaterial({ color: 0xcccccc });
  const leftDoor = new THREE.Mesh(box, material);
  const rightDoor = new THREE.Mesh(box, material);
  const group = new THREE.Group();
  group.add(leftDoor);
  group.add(rightDoor);
  leftDoor.position.set(-1, 1.5, 0);
  rightDoor.position.set(1, 1.5, 0);
  return {
    open: false,
    delta: 0.01,
    value: 0,
    group,
    leftDoor,
    rightDoor,
  };
}

export function createTrigger() {
  const box = new THREE.BoxGeometry(0.25, 0.25, 0.25);
  const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
  const trigger = new THREE.Mesh(box, material);
  return trigger;
}
