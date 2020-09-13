import * as THREE from "three";
import { extrude } from "./extrude";

export function createPlane() {
  const geometry = new THREE.BufferGeometry();
  // create a simple square shape. We duplicate the top left and bottom right
  // vertices because each vertex needs to appear once per triangle.
  const vertices = new Float32Array([
    -1.0,
    -1.0,
    1.0,
    1.0,
    -1.0,
    1.0,
    1.0,
    1.0,
    1.0,

    1.0,
    1.0,
    1.0,
    -1.0,
    1.0,
    1.0,
    -1.0,
    -1.0,
    1.0,
  ]);

  const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);

  // itemSize = 3 because there are 3 values (components) per vertex
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  return geometry;
}

export function createCorridor(width: number, depth: number) {
  const hw = width / 2;
  const hd = depth / 2;

  const shape = [
    0,
    0,
    -hd,

    hw - 0.5,
    0,
    -hd,

    hw,
    0.5,
    -hd,

    hw,
    2.5,
    -hd,

    hw - 0.5,
    3,
    -hd,

    -hw + 0.5,
    3,
    -hd,

    -hw,
    2.5,
    -hd,

    -hw,
    0.5,
    -hd,

    -hw + 0.5,
    0,
    -hd,

    0,
    0,
    -hd,
  ];

  const geometry = extrudeGeometry(shape, { depth });

  return geometry;
}

export function createPillar() {
  // prettier-ignore
  const shape = [
    0.25, 3, 0, 
    1.5, 2.75, 0, 

    1.75, 2.5-0.125, 0,     
    1.75, 1.25, 0,     
    1.5, 1, 0,     

    1.5, 0.5, 0,     
    1, 0, 0,     
    2.0, 0, 0,
    2.0, 3, 0];
  const geometry = extrudeGeometry(shape, { depth: 0.25, cap: true });
  return geometry;
}

export function createDoorFrame() {
  // prettier-ignore
  const vertices = [
    -2, 0,
    -1, 0,
    -1, 3,
    -2, 3
  ];

  const shape = new THREE.Shape();
  shape.moveTo(vertices[0], vertices[1]);
  for (let i = 2; i < vertices.length; i += 2) {
    shape.lineTo(vertices[i], vertices[i + 1]);
  }

  const geometry = new THREE.ExtrudeBufferGeometry(shape, { depth: 0.25 });
  return geometry;
}

export function createHand() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -1);
  shape.lineTo(0.3, -1);
  shape.lineTo(0.6, -0.6);
  shape.lineTo(0.9, -0.2);
  shape.lineTo(1.1, 0);
  shape.lineTo(1, 0.1);
  shape.lineTo(0.8, 0);
  shape.lineTo(0.6, -0.1);
  shape.lineTo(0.4, 1);
  shape.lineTo(-0.3, 1);
  shape.lineTo(-0.5, 0);
  shape.lineTo(-0.5, -0.6);
  shape.lineTo(-0.3, -1);

  const geometry = new THREE.ExtrudeBufferGeometry(shape, {
    steps: 1,
    depth: 0.2,
    bevelEnabled: false,
  });

  return geometry;
}

export function createControllerModel(side: "left" | "right") {
  const handGeometry = createHand();
  handGeometry.computeBoundingBox();
  const handMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

  const hand = new THREE.Mesh(handGeometry, handMaterial);
  hand.scale.set(0.08, 0.08, 0.08);
  hand.rotation.x = -0.75 * Math.PI;
  hand.rotation.y = -Math.PI / 2;
  hand.castShadow = true;
  hand.name = "hand";
  return hand;
}

export function extrudeGeometry(
  shape: number[],
  options: { depth: number; close?: boolean; cap?: boolean; direction?: [number, number, number] }
) {
  const { depth, close, cap, direction } = options;
  const data = extrude(shape, direction ? direction : [0, 0, depth], close, cap);

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(data.indices);
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(data.vertices), 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(data.normals), 3));

  return geometry;
}
