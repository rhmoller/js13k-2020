import * as THREE from "three";

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
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(1.5, 0);
  shape.lineTo(2.0, 0.5);
  shape.lineTo(2.0, 2.5);
  shape.lineTo(1.5, 3);
  shape.lineTo(-1.5, 3);
  shape.lineTo(-2.0, 2.5);
  shape.lineTo(-2.0, 0.5);
  shape.lineTo(-1.5, 0);
  shape.lineTo(0, 0);

  const geometry = new THREE.ExtrudeBufferGeometry(shape, {
    steps: 2,
    depth: 10,
    bevelEnabled: false,
  });

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
