import * as THREE from "three";
import { Vector3 } from "three";
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

export function createCorridor() {
  const shape = [
    0,
    0,
    0,

    1.5,
    0,
    0,

    2.0,
    0.5,
    0,

    2.0,
    2.5,
    0,

    1.5,
    3,
    0,

    -1.5,
    3,
    0,

    -2.0,
    2.5,
    0,

    -2.0,
    0.5,
    0,

    -1.5,
    0,
    0,

    0,
    0,
    0,
  ];

  const geometry = extrudeGeometry(shape, 20);

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
  const geometry = extrudeGeometry(shape, 0.25, false, true);
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
  const handMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

  const hand = new THREE.Mesh(handGeometry, handMaterial);
  hand.scale.set(0.08, 0.08, 0.08);
  hand.rotation.x = -0.75 * Math.PI;
  hand.rotation.y = -Math.PI / 2;
  hand.castShadow = true;
  return hand;
}

export function extrudeGeometry(shape: number[], depth: number, close?: boolean, cap?: boolean) {
  const data = extrude(shape, [0, 0, depth], close, cap);

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(data.indices);
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(data.vertices), 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(data.normals), 3));

  return geometry;
}
