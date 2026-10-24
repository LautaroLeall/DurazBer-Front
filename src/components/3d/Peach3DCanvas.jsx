import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Sparkles,
  Layers,
  Play,
  Pause,
  Sliders,
  CircleDot,
  MoveHorizontal,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

// ============================================================================
// GENERADOR DE RUIDO ORGÁNICO DETERMINÍSTICO (SIMPLEX / FRACTAL NOISE)
// ============================================================================
function hash3(x, y, z) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return h - Math.floor(h);
}

function noise3D(x, y, z) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;

  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);
  const uz = fz * fz * (3.0 - 2.0 * fz);

  const n000 = hash3(ix, iy, iz);
  const n100 = hash3(ix + 1, iy, iz);
  const n010 = hash3(ix, iy + 1, iz);
  const n110 = hash3(ix + 1, iy + 1, iz);
  const n001 = hash3(ix, iy, iz + 1);
  const n101 = hash3(ix + 1, iy, iz + 1);
  const n011 = hash3(ix, iy + 1, iz + 1);
  const n111 = hash3(ix + 1, iy + 1, iz + 1);

  const nx00 = n000 + (n100 - n000) * ux;
  const nx10 = n010 + (n110 - n010) * ux;
  const nx01 = n001 + (n101 - n001) * ux;
  const nx11 = n011 + (n111 - n011) * ux;

  const nxy0 = nx00 + (nx10 - nx00) * uy;
  const nxy1 = nx01 + (nx11 - nx01) * uy;

  return nxy0 + (nxy1 - nxy0) * uz;
}

function fbm3D(x, y, z, octaves = 3) {
  let value = 0.0;
  let amplitude = 0.5;
  let frequency = 1.0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise3D(x * frequency, y * frequency, z * frequency);
    frequency *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

// ============================================================================
// MORFOLOGÍA BOTÁNICA DEL DURAZNO (DEFORMACIÓN 3D COMPARTIDA)
// ============================================================================
function deformPeachVertex(nx, ny, nz, baseRadius = 1.85) {
  let sx = nx * 1.04;
  let sy = ny * 0.96;
  let sz = nz * 1.01;

  const rXZ = Math.sqrt(nx * nx + nz * nz);

  // 1. Cavidad peduncular superior (hundimiento donde va el cabo/tallo)
  if (ny > 0.25) {
    const topFactor = Math.max(0, (ny - 0.25) / 0.75);
    const cavityDepth = Math.exp(-rXZ * rXZ * 9.5) * 0.44 * Math.pow(topFactor, 1.35);
    sy -= cavityDepth;
    const shoulder = Math.exp(-Math.pow(rXZ - 0.42, 2) * 14.0) * 0.055 * topFactor;
    sy += shoulder;
  }

  // 2. Hendidura inferior suave / punto estilar
  if (ny < -0.45) {
    const botFactor = Math.max(0, (-ny - 0.45) / 0.55);
    const botIndent = Math.exp(-rXZ * rXZ * 16.0) * 0.11 * Math.pow(botFactor, 1.5);
    sy += botIndent;
    const taper = 1.0 - 0.05 * botFactor * (1.0 - Math.exp(-rXZ * rXZ * 4.0));
    sx *= taper;
    sz *= taper;
  }

  // 3. Sutura carpelar longitudinal
  const angleXZ = Math.atan2(nz, nx);
  const sutureAngle = 0.35;
  let angleDiff = Math.abs(angleXZ - sutureAngle);
  if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

  const latFactor = Math.pow(Math.max(0, 1.0 - ny * ny * 0.85), 0.7);
  const cleft = Math.exp(-angleDiff * angleDiff * 18.0) * 0.085 * latFactor;
  const cheekLobe = Math.exp(-Math.pow(angleDiff - 0.55, 2) * 8.0) * 0.038 * latFactor;

  // 4. Variación orgánica de baja frecuencia
  const organicWave = (fbm3D(nx * 2.2 + 3.1, ny * 2.2 + 1.7, nz * 2.2 + 5.4, 3) - 0.5) * 0.055;

  const radialScale = baseRadius * (1.0 - cleft + cheekLobe + organicWave);

  return {
    x: sx * radialScale,
    y: sy * baseRadius + organicWave * 0.15,
    z: sz * radialScale
  };
}

// ============================================================================
// GENERADORES Y CACHÉ GLOBAL DE TEXTURAS PROCEDURALES HD
// ============================================================================
let cachedSkinTextures = null;
let cachedPulpTextures = null;
let cachedCarozoTextures = null;

function createPeachSkinTextures() {
  const width = 512;
  const height = 512;

  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d');

  const imgData = ctx.createImageData(width, height);
  const bumpData = bCtx.createImageData(width, height);
  const data = imgData.data;
  const bData = bumpData.data;

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const phi = v * Math.PI;
    const sinPhi = Math.sin(phi);
    const ny = Math.cos(phi);

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const theta = u * Math.PI * 2.0;
      const nx = sinPhi * Math.cos(theta);
      const nz = sinPhi * Math.sin(theta);

      const n1 = fbm3D(nx * 2.1 + 1.5, ny * 2.1 + 4.2, nz * 2.1 - 2.3, 3);
      const n2 = fbm3D(nx * 5.5 - 3.1, ny * 5.5 + 1.1, nz * 5.5 + 2.8, 3);
      const n3 = fbm3D(nx * 16.0, ny * 16.0, nz * 16.0, 2);
      const poreNoise = noise3D(nx * 58.0, ny * 58.0, nz * 58.0);

      let blushBias =
        0.52 * (nx * 0.65 + nz * 0.55 + 0.35) +
        0.55 * (n1 - 0.45) +
        0.22 * (n2 - 0.5);

      const meridianPattern = fbm3D(Math.cos(theta) * 6.0, ny * 1.4, Math.sin(theta) * 6.0, 2);
      blushBias += (meridianPattern - 0.5) * 0.25;

      let stemHalo = 0.0;
      if (ny > 0.68) {
        stemHalo = Math.pow(Math.min(1.0, (ny - 0.68) / 0.3), 1.4);
        const rays = fbm3D(Math.cos(theta) * 9.0, Math.sin(theta) * 9.0, ny * 3.0, 2);
        stemHalo *= 0.72 + 0.45 * rays;
      }

      blushBias = Math.max(0.0, Math.min(1.0, blushBias - stemHalo * 0.85));

      let r, g, b;
      if (blushBias < 0.38) {
        const t = blushBias / 0.38;
        r = 252 + (246 - 252) * t;
        g = 208 + (132 - 208) * t;
        b = 36 + (28 - 36) * t;
      } else if (blushBias < 0.72) {
        const t = (blushBias - 0.38) / 0.34;
        r = 246 + (192 - 246) * t;
        g = 132 + (26 - 132) * t;
        b = 28 + (32 - 28) * t;
      } else {
        const t = (blushBias - 0.72) / 0.28;
        r = 192 + (126 - 192) * t;
        g = 26 + (12 - 26) * t;
        b = 32 + (26 - 32) * t;
      }

      const speckle = (n3 - 0.5) * 34.0;
      r += speckle;
      g += speckle * 0.75;
      b += speckle * 0.3;

      if (poreNoise > 0.76) {
        const pFactor = (poreNoise - 0.76) / 0.24;
        if (blushBias > 0.45) {
          r += 48 * pFactor;
          g += 55 * pFactor;
          b += 18 * pFactor;
        } else {
          r -= 15 * pFactor;
          g -= 38 * pFactor;
          b -= 10 * pFactor;
        }
      }

      if (ny > 0.955) {
        const coreT = Math.min(1.0, (ny - 0.955) / 0.045);
        r = r * (1.0 - coreT) + 92 * coreT;
        g = g * (1.0 - coreT) + 72 * coreT;
        b = b * (1.0 - coreT) + 32 * coreT;
      }

      const idx = (y * width + x) * 4;
      data[idx] = Math.max(0, Math.min(255, Math.round(r)));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      data[idx + 3] = 255;

      const bumpVal = Math.max(
        0,
        Math.min(255, Math.round(128 + (n2 - 0.5) * 65 + (n3 - 0.5) * 90 + (poreNoise - 0.5) * 70))
      );
      bData[idx] = bumpVal;
      bData[idx + 1] = bumpVal;
      bData[idx + 2] = bumpVal;
      bData[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  bCtx.putImageData(bumpData, 0, 0);

  const colorTex = new THREE.CanvasTexture(colorCanvas);
  colorTex.wrapS = THREE.RepeatWrapping;
  colorTex.wrapT = THREE.ClampToEdgeWrapping;
  colorTex.needsUpdate = true;

  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.ClampToEdgeWrapping;
  bumpTex.needsUpdate = true;

  return { colorTex, bumpTex };
}

function createCutPulpTextures() {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  const imgData = ctx.createImageData(size, size);
  const bumpData = bCtx.createImageData(size, size);
  const data = imgData.data;
  const bData = bumpData.data;

  for (let y = 0; y < size; y++) {
    const py = (0.5 - y / size) * 2.0;
    for (let x = 0; x < size; x++) {
      const px = (x / size - 0.5) * 2.0;

      const r = Math.sqrt(px * px + py * py);
      const pitRadius = Math.sqrt(Math.pow(px / 0.37, 2) + Math.pow((py + 0.03) / 0.46, 2));
      const angle = Math.atan2(py, px);

      const radialFibers = fbm3D(
        Math.cos(angle) * 16.0 + r * 3.0,
        Math.sin(angle) * 16.0 + r * 3.0,
        r * 9.5,
        3
      );
      const fineFibers = fbm3D(
        Math.cos(angle) * 38.0,
        Math.sin(angle) * 38.0,
        r * 18.0,
        3
      );
      const cellNoise = fbm3D(px * 11.0 + 2.0, py * 11.0 + 3.0, 1.5, 2);
      const microCells = noise3D(px * 36.0, py * 36.0, 4.2);

      let red = 255;
      let green = 216 + (radialFibers - 0.5) * 34 + (cellNoise - 0.5) * 20;
      let blue = 54 + (radialFibers - 0.5) * 38 + (microCells - 0.5) * 14;

      const brightRays = Math.pow(Math.max(0, radialFibers), 1.8) * Math.sin(Math.min(1, r) * Math.PI);
      green += brightRays * 22;
      blue += brightRays * 28;

      if (r > 0.78 && r <= 0.91) {
        const subT = (r - 0.78) / 0.13;
        green -= subT * 18;
        blue -= subT * 14;
      }

      if (py > 0.35 && Math.abs(px) < 0.16) {
        const stemChannel = (1.0 - Math.abs(px) / 0.16) * Math.min(1.0, (py - 0.35) / 0.45);
        red -= stemChannel * 18;
        green -= stemChannel * 42;
        blue -= stemChannel * 20;
      }

      if (pitRadius < 1.48) {
        const bleedZone = Math.max(0, 1.0 - Math.max(0, pitRadius - 0.75) / 0.73);
        const veinSpikes = Math.pow(fineFibers, 1.45) * (0.6 + 0.4 * radialFibers);
        const veinPattern = veinSpikes * Math.pow(bleedZone, 1.25);

        red -= veinPattern * 42;
        green -= veinPattern * 165;
        blue -= veinPattern * 48;

        if (pitRadius >= 0.86 && pitRadius < 1.08) {
          const collarT = 1.0 - Math.abs(pitRadius - 0.96) / 0.12;
          if (collarT > 0 && fineFibers > 0.48) {
            red = Math.min(255, red + collarT * 15);
            green = Math.min(255, green + collarT * 28);
            blue = Math.min(255, blue + collarT * 12);
          }
        }

        if (pitRadius < 0.94) {
          const innerT = Math.min(1.0, (0.94 - pitRadius) / 0.22);
          const pitGrooves = Math.abs(
            Math.sin((px * 18.0 + cellNoise * 2.5) * Math.PI) *
            Math.cos((py * 14.0 + radialFibers * 2.5) * Math.PI)
          );

          const isOchreFiber = pitGrooves > 0.48 && fineFibers > 0.46;
          const targetR = isOchreFiber ? 238 : 138 + pitGrooves * 55;
          const targetG = isOchreFiber ? 174 : 20 + pitGrooves * 22;
          const targetB = isOchreFiber ? 52 : 22 + pitGrooves * 16;

          red = red * (1.0 - innerT) + targetR * innerT;
          green = green * (1.0 - innerT) + targetG * innerT;
          blue = blue * (1.0 - innerT) + targetB * innerT;
        }
      }

      const scarAngle = -0.82;
      const scarDiff = Math.abs(angle - scarAngle);
      if (r > 0.30 && r < 0.78 && scarDiff < 0.28) {
        const scarStrength =
          (1.0 - scarDiff / 0.28) *
          Math.sin(((r - 0.30) / 0.48) * Math.PI) *
          (0.4 + 0.8 * fineFibers);
        red -= scarStrength * 65;
        green -= scarStrength * 135;
        blue -= scarStrength * 45;
      }

      if (r > 0.90) {
        const rimT = Math.min(1.0, (r - 0.90) / 0.09);
        const outerEdge = r > 0.96 ? Math.min(1.0, (r - 0.96) / 0.04) : 0.0;
        const rimR = 232 - outerEdge * 65;
        const rimG = 78 - outerEdge * 56;
        const rimB = 26 - outerEdge * 6;
        red = red * (1.0 - rimT) + rimR * rimT;
        green = green * (1.0 - rimT) + rimG * rimT;
        blue = blue * (1.0 - rimT) + rimB * rimT;
      }

      const idx = (y * size + x) * 4;
      data[idx] = Math.max(0, Math.min(255, Math.round(red)));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(green)));
      data[idx + 2] = Math.max(0, Math.min(255, Math.round(blue)));
      data[idx + 3] = 255;

      const cavityRelief = pitRadius < 0.95 ? (fineFibers - 0.5) * 130 : 0;
      const bumpVal = Math.max(
        0,
        Math.min(
          255,
          Math.round(
            128 +
            (radialFibers - 0.5) * 95 +
            (fineFibers - 0.5) * 85 +
            (microCells - 0.5) * 35 +
            cavityRelief
          )
        )
      );
      bData[idx] = bumpVal;
      bData[idx + 1] = bumpVal;
      bData[idx + 2] = bumpVal;
      bData[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  bCtx.putImageData(bumpData, 0, 0);

  const colorTex = new THREE.CanvasTexture(colorCanvas);
  colorTex.needsUpdate = true;

  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.needsUpdate = true;

  return { colorTex, bumpTex };
}

function createCarozoTextures() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  const imgData = ctx.createImageData(size, size);
  const bImgData = bCtx.createImageData(size, size);
  const data = imgData.data;
  const bData = bImgData.data;

  for (let y = 0; y < size; y++) {
    const v = y / size;
    const phi = v * Math.PI;
    const ny = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    for (let x = 0; x < size; x++) {
      const u = x / size;
      const theta = u * Math.PI * 2.0;
      const nx = sinPhi * Math.cos(theta);
      const nz = sinPhi * Math.sin(theta);

      const warpX = fbm3D(nx * 4.5, ny * 4.5, nz * 4.5, 3);
      const warpY = fbm3D(nx * 4.5 + 5.2, ny * 4.5 + 1.3, nz * 4.5 + 2.8, 3);
      const ridges = Math.abs(
        Math.sin((nx * 9.0 + warpX * 3.8) * Math.PI) *
        Math.cos((ny * 7.0 + warpY * 3.5) * Math.PI)
      );
      const fibrousCling = fbm3D(nx * 14.0, ny * 14.0, nz * 14.0, 3);

      let r, g, b;
      if (ridges > 0.56 && fibrousCling > 0.52) {
        const t = Math.min(1.0, (fibrousCling - 0.52) / 0.35);
        r = 165 + (245 - 165) * t;
        g = 32 + (182 - 32) * t;
        b = 28 + (58 - 28) * t;
      } else {
        const depth = Math.pow(ridges, 0.85);
        r = 78 + depth * 92;
        g = 10 + depth * 24;
        b = 14 + depth * 20;
      }

      const idx = (y * size + x) * 4;
      data[idx] = Math.max(0, Math.min(255, Math.round(r)));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      data[idx + 3] = 255;

      const bVal = Math.max(0, Math.min(255, Math.round(ridges * 220 + fibrousCling * 35)));
      bData[idx] = bVal;
      bData[idx + 1] = bVal;
      bData[idx + 2] = bVal;
      bData[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  bCtx.putImageData(bImgData, 0, 0);

  const colorTex = new THREE.CanvasTexture(canvas);
  colorTex.wrapS = THREE.RepeatWrapping;
  colorTex.wrapT = THREE.ClampToEdgeWrapping;
  colorTex.needsUpdate = true;

  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.ClampToEdgeWrapping;
  bumpTex.needsUpdate = true;

  return { colorTex, bumpTex };
}

function getCachedTextures() {
  if (!cachedSkinTextures) cachedSkinTextures = createPeachSkinTextures();
  if (!cachedPulpTextures) cachedPulpTextures = createCutPulpTextures();
  if (!cachedCarozoTextures) cachedCarozoTextures = createCarozoTextures();
  return {
    skin: cachedSkinTextures,
    pulp: cachedPulpTextures,
    carozo: cachedCarozoTextures
  };
}

// ============================================================================
// CONSTRUCTORES DE GEOMETRÍAS 3D BOTÁNICAS
// ============================================================================
function buildWholePeachMesh(skinMaterial) {
  const group = new THREE.Group();

  const geo = new THREE.SphereGeometry(1, 96, 96);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const def = deformPeachVertex(v.x, v.y, v.z, 1.85);
    pos.setXYZ(i, def.x, def.y, def.z);
  }
  geo.computeVertexNormals();

  const peachMesh = new THREE.Mesh(geo, skinMaterial);
  peachMesh.castShadow = true;
  peachMesh.receiveShadow = true;
  group.add(peachMesh);

  // Pedúnculo / tallo leñoso dentro de la cavidad superior
  const stemGeo = new THREE.CylinderGeometry(0.065, 0.11, 0.24, 20, 6);
  const stemPos = stemGeo.attributes.position;
  for (let i = 0; i < stemPos.count; i++) {
    const sx = stemPos.getX(i);
    const sy = stemPos.getY(i);
    const sz = stemPos.getZ(i);
    const n = noise3D(sx * 18, sy * 18, sz * 18) * 0.025;
    stemPos.setXYZ(i, sx + n + sy * 0.08, sy, sz + n);
  }
  stemGeo.computeVertexNormals();

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x4a3520,
    roughness: 0.92,
    metalness: 0.05
  });
  const stemMesh = new THREE.Mesh(stemGeo, stemMat);
  stemMesh.position.set(0.0, 1.38, 0.0);
  stemMesh.rotation.z = -0.15;
  group.add(stemMesh);

  return group;
}

function buildCutPeachGroup(skinMaterial, pulpTextures, carozoTextures) {
  const cutGroup = new THREE.Group();

  // A) HEMISFERIO EXTERIOR DE PIEL (z <= 0)
  const radialSegs = 96;
  const depthRings = 48;
  const skinGeo = new THREE.BufferGeometry();
  const skinVertices = [];
  const skinUVs = [];
  const skinIndices = [];

  for (let r = 0; r <= depthRings; r++) {
    const vRing = r / depthRings;
    const psi = (vRing * Math.PI) / 2.0;
    const sinPsi = Math.sin(psi);
    const cosPsi = Math.cos(psi);

    for (let s = 0; s <= radialSegs; s++) {
      const uSeg = s / radialSegs;
      const alpha = uSeg * Math.PI * 2.0;

      const nx = cosPsi * Math.cos(alpha);
      const ny = cosPsi * Math.sin(alpha);
      const nz = -sinPsi;

      const def = deformPeachVertex(nx, ny, nz, 1.85);
      const finalZ = r === 0 ? 0.0 : def.z;
      skinVertices.push(def.x, def.y, finalZ);

      const phi = Math.acos(Math.max(-1, Math.min(1, ny)));
      const theta = Math.atan2(nz, nx);
      const u = (theta + Math.PI) / (2.0 * Math.PI);
      const v = phi / Math.PI;
      skinUVs.push(u, v);
    }
  }

  for (let r = 0; r < depthRings; r++) {
    for (let s = 0; s < radialSegs; s++) {
      const a = r * (radialSegs + 1) + s;
      const b = a + radialSegs + 1;
      const c = b + 1;
      const d = a + 1;
      skinIndices.push(a, b, d);
      skinIndices.push(b, c, d);
    }
  }

  skinGeo.setAttribute('position', new THREE.Float32BufferAttribute(skinVertices, 3));
  skinGeo.setAttribute('uv', new THREE.Float32BufferAttribute(skinUVs, 2));
  skinGeo.setIndex(skinIndices);
  skinGeo.computeVertexNormals();

  const halfSkinMesh = new THREE.Mesh(skinGeo, skinMaterial);
  halfSkinMesh.castShadow = true;
  halfSkinMesh.receiveShadow = true;
  cutGroup.add(halfSkinMesh);

  // B) CARA DE PULPA CORTADA (MESOCARPO JUGOSO)
  const pulpRings = 64;
  const pulpGeo = new THREE.BufferGeometry();
  const pulpVertices = [];
  const pulpUVs = [];
  const pulpIndices = [];

  const boundaryPoints = [];
  for (let s = 0; s <= radialSegs; s++) {
    const alpha = (s / radialSegs) * Math.PI * 2.0;
    const nx = Math.cos(alpha);
    const ny = Math.sin(alpha);
    const def = deformPeachVertex(nx, ny, 0, 1.85);
    boundaryPoints.push({ x: def.x, y: def.y });
  }

  for (let r = 0; r <= pulpRings; r++) {
    const frac = r / pulpRings;
    for (let s = 0; s <= radialSegs; s++) {
      const alpha = (s / radialSegs) * Math.PI * 2.0;
      const bPt = boundaryPoints[s];

      const px = bPt.x * frac;
      const py = bPt.y * frac;

      let pz = Math.sin(frac * Math.PI) * 0.085;

      const pitNorm = Math.sqrt(Math.pow(px / 0.65, 2) + Math.pow((py + 0.04) / 0.83, 2));
      if (pitNorm < 1.0) {
        const cavityFactor = Math.cos(pitNorm * Math.PI * 0.5);
        const innerGrooves = (fbm3D(px * 11.0, py * 11.0, 2.4, 3) - 0.5) * 0.075 * cavityFactor;
        pz -= Math.pow(cavityFactor, 1.35) * 0.36 - innerGrooves;
      } else {
        if (pitNorm < 1.28) {
          const collarWave =
            Math.sin(((pitNorm - 1.0) / 0.28) * Math.PI) *
            fbm3D(Math.cos(alpha) * 14.0, Math.sin(alpha) * 14.0, 3.1, 2) *
            0.038;
          pz += collarWave;
        }
        const fiberWave =
          (fbm3D(Math.cos(alpha) * 14.0, Math.sin(alpha) * 14.0, frac * 7.0, 2) - 0.5) *
          0.022 *
          Math.sin(frac * Math.PI);
        pz += fiberWave;
      }

      if (r === pulpRings) pz = 0.0;

      pulpVertices.push(px, py, pz);

      const u = 0.5 + 0.49 * frac * Math.cos(alpha);
      const v = 0.5 - 0.49 * frac * Math.sin(alpha);
      pulpUVs.push(u, v);
    }
  }

  for (let r = 0; r < pulpRings; r++) {
    for (let s = 0; s < radialSegs; s++) {
      const a = r * (radialSegs + 1) + s;
      const b = a + radialSegs + 1;
      const c = b + 1;
      const d = a + 1;
      pulpIndices.push(a, b, d);
      pulpIndices.push(b, c, d);
    }
  }

  pulpGeo.setAttribute('position', new THREE.Float32BufferAttribute(pulpVertices, 3));
  pulpGeo.setAttribute('uv', new THREE.Float32BufferAttribute(pulpUVs, 2));
  pulpGeo.setIndex(pulpIndices);
  pulpGeo.computeVertexNormals();

  const pulpMat = new THREE.MeshPhysicalMaterial({
    map: pulpTextures.colorTex,
    bumpMap: pulpTextures.bumpTex,
    bumpScale: 0.032,
    roughness: 0.26,
    metalness: 0.01,
    clearcoat: 0.62,
    clearcoatRoughness: 0.16,
    sheen: 0.35,
    sheenColor: new THREE.Color('#fff2b2'),
    sheenRoughness: 0.38,
    side: THREE.DoubleSide
  });

  const pulpMesh = new THREE.Mesh(pulpGeo, pulpMat);
  pulpMesh.castShadow = true;
  pulpMesh.receiveShadow = true;
  cutGroup.add(pulpMesh);

  // Hebras fibrosas en el borde de la cavidad
  const fibersGroup = new THREE.Group();
  const fiberGeo = new THREE.ConeGeometry(0.028, 0.13, 6);
  const fiberMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4b63d,
    emissive: 0x3a0808,
    roughness: 0.38,
    clearcoat: 0.45
  });

  for (let i = 0; i < 36; i++) {
    const ang = (i / 36) * Math.PI * 2.0;
    const radNoise = 0.92 + hash3(i, 2.1, 5.3) * 0.16;
    const fx = Math.cos(ang) * 0.56 * radNoise;
    const fy = Math.sin(ang) * 0.72 * radNoise - 0.03;
    const fz = 0.02 + (hash3(i, 4.4, 1.9) - 0.5) * 0.04;

    const fiber = new THREE.Mesh(fiberGeo, fiberMat);
    fiber.position.set(fx, fy, fz);
    fiber.rotation.z = ang + Math.PI * 0.5 + (hash3(i, 8.1, 3.2) - 0.5) * 0.4;
    fiber.rotation.x = 0.35 + hash3(i, 6.5, 9.1) * 0.35;
    const fScale = 0.65 + hash3(i, 1.7, 7.4) * 0.75;
    fiber.scale.set(fScale, fScale, fScale);
    fibersGroup.add(fiber);
  }
  cutGroup.add(fibersGroup);

  // C) CAROZO / HUESO 3D ESCULPIDO (ENDOCARPO)
  const carozoGeo = new THREE.SphereGeometry(0.68, 64, 64);
  const cPos = carozoGeo.attributes.position;
  const cv = new THREE.Vector3();

  for (let i = 0; i < cPos.count; i++) {
    cv.fromBufferAttribute(cPos, i).normalize();

    let cx = cv.x * 0.84;
    let cy = cv.y * 1.16;
    let cz = cv.z * 0.62;

    if (cv.y > 0.3) {
      const tip = Math.pow((cv.y - 0.3) / 0.7, 1.5);
      cx *= 1.0 - tip * 0.34;
      cz *= 1.0 - tip * 0.38;
      cy += tip * 0.09;
    }
    if (cv.y < -0.35) {
      const bTip = Math.pow((-cv.y - 0.35) / 0.65, 1.4);
      cx *= 1.0 - bTip * 0.28;
      cz *= 1.0 - bTip * 0.32;
    }

    const w1 = fbm3D(cv.x * 4.2, cv.y * 4.2, cv.z * 4.2, 3);
    const w2 = fbm3D(cv.x * 4.2 + 4.1, cv.y * 4.2 + 2.3, cv.z * 4.2 + 1.7, 3);
    const groovePattern =
      Math.sin((cv.x * 8.5 + w1 * 3.6) * Math.PI) *
      Math.cos((cv.y * 6.8 + w2 * 3.2) * Math.PI);

    const ridgeDisplacement = Math.abs(groovePattern) * 0.115 - 0.045;
    const fineFibersDis = (fbm3D(cv.x * 16.0, cv.y * 16.0, cv.z * 16.0, 2) - 0.5) * 0.035;
    const keel = Math.exp(-cv.z * cv.z * 18.0) * 0.055;

    const scale = 0.68 + ridgeDisplacement + fineFibersDis;
    cPos.setXYZ(
      i,
      (cx + (cv.x > 0 ? keel : -keel * 0.5)) * scale,
      cy * scale - 0.03,
      cz * scale + 0.06
    );
  }
  carozoGeo.computeVertexNormals();

  const carozoMat = new THREE.MeshPhysicalMaterial({
    map: carozoTextures.colorTex,
    bumpMap: carozoTextures.bumpTex,
    bumpScale: 0.045,
    roughness: 0.42,
    metalness: 0.04,
    clearcoat: 0.45,
    clearcoatRoughness: 0.28
  });

  const carozoMesh = new THREE.Mesh(carozoGeo, carozoMat);
  carozoMesh.name = 'carozoMesh';
  carozoMesh.position.set(0, -0.03, 0.06);
  carozoMesh.castShadow = true;
  carozoMesh.receiveShadow = true;
  cutGroup.add(carozoMesh);

  return { cutGroup, carozoMesh, pulpMat, carozoMat };
}

function buildDewDropsGroup() {
  const dropsGroup = new THREE.Group();
  const dropGeo = new THREE.SphereGeometry(0.038, 16, 16);
  const pos = dropGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < 0) pos.setY(i, y * 0.55);
  }
  dropGeo.computeVertexNormals();

  const dropMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.92,
    transparent: true,
    opacity: 0.88,
    ior: 1.333,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05
  });

  for (let i = 0; i < 30; i++) {
    const phi = 0.35 + hash3(i, 1.1, 2.2) * 2.35;
    const theta = hash3(i, 3.3, 4.4) * Math.PI * 2.0;
    const nx = Math.sin(phi) * Math.cos(theta);
    const ny = Math.cos(phi);
    const nz = Math.sin(phi) * Math.sin(theta);

    const surfacePt = deformPeachVertex(nx, ny, nz, 1.85);
    const drop = new THREE.Mesh(dropGeo, dropMat);
    const scale = 0.65 + hash3(i, 7.7, 8.8) * 1.15;
    drop.scale.set(scale, scale * 0.85, scale);
    drop.position.set(surfacePt.x, surfacePt.y, surfacePt.z);

    const normal = new THREE.Vector3(nx, ny, nz).normalize();
    drop.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    dropsGroup.add(drop);
  }

  return dropsGroup;
}

/**
 * Visor 3D Botánico Hiperrealista de DurazBer (Three.js WebGL)
 * Cero elementos obstructivos: sin modales, sin íconos de ojo y sin ángulos informativos.
 * Control táctil y de mouse fluido: 1 dedo = rotación 360°, 2 dedos/rueda = zoom.
 */
const Peach3DCanvas = ({ onReady }) => {
  const containerRef = useRef(null);

  // Estados limpios de visualización
  const [viewMode, setViewMode] = useState('whole'); // 'whole' | 'cut' | 'dual'
  const [autoRotate, setAutoRotate] = useState(true);
  const [pitExtract, setPitExtract] = useState(0); // 0% a 100% de extracción del carozo

  // Referencias Three.js
  const sceneObjectsRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    wholeGroup: null,
    cutGroup: null,
    carozoMesh: null,
    dewWhole: null,
    skinMat: null,
    pulpMat: null,
    carozoMat: null,
    targetSpherical: { rotX: 0.22, rotY: 0.45, dist: 5.4 },
    currentSpherical: { rotX: 0.22, rotY: 0.45, dist: 5.4 },
    viewMode: 'whole',
    autoRotate: true,
    pitExtractValue: 0
  });

  // Inicialización de Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Iluminación de estudio botánico cálido
    const ambientLight = new THREE.HemisphereLight(0xfff4e0, 0x3b1d16, 1.05);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff7e8, 2.45);
    keyLight.position.set(5.5, 7.5, 6.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffb570, 1.75);
    rimLight.position.set(-6.0, 3.5, -5.5);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xffdfba, 1.25, 18);
    fillLight.position.set(0.0, -2.5, 5.5);
    scene.add(fillLight);

    // Texturas cacheadas procedurales
    const { skin, pulp, carozo } = getCachedTextures();

    // Material de piel aterciopelada
    const skinMat = new THREE.MeshPhysicalMaterial({
      map: skin.colorTex,
      bumpMap: skin.bumpTex,
      bumpScale: 0.018,
      roughness: 0.62,
      metalness: 0.01,
      sheen: 1.0,
      sheenRoughness: 0.65,
      sheenColor: new THREE.Color('#ffdfd2'),
      clearcoat: 0.08,
      clearcoatRoughness: 0.45
    });

    // 1. Durazno Entero 360°
    const wholeGroup = buildWholePeachMesh(skinMat);
    const dewWhole = buildDewDropsGroup();
    wholeGroup.add(dewWhole);
    scene.add(wholeGroup);

    // 2. Durazno Cortado por la Mitad (Pulpa jugosa + Carozo 3D)
    const { cutGroup, carozoMesh, pulpMat, carozoMat } = buildCutPeachGroup(
      skinMat,
      pulp,
      carozo
    );
    cutGroup.visible = false;
    scene.add(cutGroup);

    // Sombra de contacto suave
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
    grad.addColorStop(0, 'rgba(15, 6, 4, 0.45)');
    grad.addColorStop(0.5, 'rgba(15, 6, 4, 0.18)');
    grad.addColorStop(1, 'rgba(15, 6, 4, 0.0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 256, 256);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(8.5, 4.8),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.25;
    scene.add(shadowPlane);

    sceneObjectsRef.current.scene = scene;
    sceneObjectsRef.current.camera = camera;
    sceneObjectsRef.current.renderer = renderer;
    sceneObjectsRef.current.wholeGroup = wholeGroup;
    sceneObjectsRef.current.cutGroup = cutGroup;
    sceneObjectsRef.current.carozoMesh = carozoMesh;
    sceneObjectsRef.current.dewWhole = dewWhole;
    sceneObjectsRef.current.skinMat = skinMat;
    sceneObjectsRef.current.pulpMat = pulpMat;
    sceneObjectsRef.current.carozoMat = carozoMat;

    // Interacción táctil y de puntero ultra-fluida (1 dedo/mouse = 360°, 2 dedos = pinch zoom)
    const activePointers = new Map();
    let initialPinchDistance = null;
    let initialPinchDistCamera = null;
    let dragDistance = 0;
    let lastPointerPos = { x: 0, y: 0 };
    let velocityY = 0;

    const onPointerDown = (e) => {
      try {
        domElem.setPointerCapture(e.pointerId);
      } catch { }
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size === 1) {
        dragDistance = 0;
        lastPointerPos = { x: e.clientX, y: e.clientY };
        velocityY = 0;
      } else if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        initialPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        initialPinchDistCamera = sceneObjectsRef.current.targetSpherical.dist;
      }
    };

    const onPointerMove = (e) => {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // Gesto de 2 dedos: Pinch-to-zoom en móviles
      if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        const currentPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (initialPinchDistance && initialPinchDistance > 10) {
          const factor = initialPinchDistance / Math.max(10, currentPinchDistance);
          const targetDist = (initialPinchDistCamera || 5.4) * factor;
          sceneObjectsRef.current.targetSpherical.dist = Math.max(2.8, Math.min(8.5, targetDist));
        }
        return;
      }

      // Gesto de 1 dedo o mouse: Rotación esférica 360° en todos los ángulos
      if (activePointers.size === 1) {
        const dx = e.clientX - lastPointerPos.x;
        const dy = e.clientY - lastPointerPos.y;
        dragDistance += Math.hypot(dx, dy);

        velocityY = -dx * 0.0075;
        sceneObjectsRef.current.targetSpherical.rotY -= dx * 0.0075;

        // Inclinación vertical suave sin inversión brusca de polos
        const nextRotX = sceneObjectsRef.current.targetSpherical.rotX + dy * 0.0075;
        sceneObjectsRef.current.targetSpherical.rotX = Math.max(
          -Math.PI / 2.15,
          Math.min(Math.PI / 2.15, nextRotX)
        );

        lastPointerPos = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerUp = (e) => {
      try {
        domElem.releasePointerCapture(e.pointerId);
      } catch { }

      activePointers.delete(e.pointerId);

      if (activePointers.size < 2) {
        initialPinchDistance = null;
        initialPinchDistCamera = null;
      }

      if (activePointers.size === 0) {
        dragDistance = 0;
      }
    };

    const onPointerCancel = (e) => {
      try {
        domElem.releasePointerCapture(e.pointerId);
      } catch { }
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) {
        initialPinchDistance = null;
        initialPinchDistCamera = null;
      }
      dragDistance = 0;
    };

    const onWheel = (e) => {
      e.preventDefault();
      // Zoom suave con rueda de mouse normalizado
      const zoomFactor = e.deltaY * 0.0035;
      sceneObjectsRef.current.targetSpherical.dist = Math.max(
        2.8,
        Math.min(8.5, sceneObjectsRef.current.targetSpherical.dist + zoomFactor)
      );
    };

    const domElem = renderer.domElement;
    domElem.style.touchAction = 'none';
    domElem.addEventListener('pointerdown', onPointerDown);
    domElem.addEventListener('pointermove', onPointerMove);
    domElem.addEventListener('pointerup', onPointerUp);
    domElem.addEventListener('pointercancel', onPointerCancel);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 300;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Bucle de renderizado 60 FPS
    let reqId;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      const { currentSpherical, targetSpherical } = sceneObjectsRef.current;

      // Giro suave automático cuando no se arrastra
      if (sceneObjectsRef.current.autoRotate && activePointers.size === 0) {
        targetSpherical.rotY += 0.0045;
      }

      // Inercia residual suave al soltar el arrastre
      if (activePointers.size === 0 && Math.abs(velocityY) > 0.0001) {
        targetSpherical.rotY += velocityY;
        velocityY *= 0.92;
      }

      // Amortiguación suave y ultra-reactiva
      currentSpherical.rotX += (targetSpherical.rotX - currentSpherical.rotX) * 0.12;
      currentSpherical.rotY += (targetSpherical.rotY - currentSpherical.rotY) * 0.12;
      currentSpherical.dist += (targetSpherical.dist - currentSpherical.dist) * 0.14;

      const r = currentSpherical.dist;
      const cx = r * Math.cos(currentSpherical.rotX) * Math.sin(currentSpherical.rotY);
      const cy = r * Math.sin(currentSpherical.rotX);
      const cz = r * Math.cos(currentSpherical.rotX) * Math.cos(currentSpherical.rotY);

      camera.position.set(cx, cy, cz);
      camera.lookAt(0, 0, 0);

      // Levitación orgánica
      const floatY = Math.sin(elapsed * 1.6) * 0.055;
      if (wholeGroup.visible) {
        wholeGroup.position.y = floatY;
      }
      if (cutGroup.visible) {
        cutGroup.position.y = -floatY * 0.8;
      }

      // Animación suave de extracción del carozo 3D
      if (carozoMesh) {
        const targetZ = 0.06 + (sceneObjectsRef.current.pitExtractValue || 0) * 1.35;
        carozoMesh.position.z += (targetZ - carozoMesh.position.z) * 0.12;
        carozoMesh.rotation.y = (sceneObjectsRef.current.pitExtractValue || 0) * 0.45;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Notificar que la escena Three.js y texturas están listas
    if (onReady) {
      requestAnimationFrame(() => {
        onReady();
      });
    }

    return () => {
      cancelAnimationFrame(reqId);
      domElem.removeEventListener('pointerdown', onPointerDown);
      domElem.removeEventListener('pointermove', onPointerMove);
      domElem.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('pointercancel', onPointerCancel);
      domElem.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Sincronizar estado de vista y extracción
  useEffect(() => {
    const ref = sceneObjectsRef.current;
    ref.viewMode = viewMode;
    ref.autoRotate = autoRotate;
    ref.pitExtractValue = pitExtract / 100;

    if (!ref.wholeGroup || !ref.cutGroup) return;

    if (viewMode === 'whole') {
      ref.wholeGroup.visible = true;
      ref.cutGroup.visible = false;
      ref.wholeGroup.position.set(0, 0, 0);
      ref.targetSpherical.dist = 5.4;
    } else if (viewMode === 'cut') {
      ref.wholeGroup.visible = false;
      ref.cutGroup.visible = true;
      ref.cutGroup.position.set(0, 0, 0);
      ref.cutGroup.rotation.set(0.12, -0.18, 0);
      ref.targetSpherical.dist = 5.2;
    } else {
      // Vista Dual (Ambos lado a lado)
      ref.wholeGroup.visible = true;
      ref.cutGroup.visible = true;
      ref.wholeGroup.position.set(-1.85, 0, 0);
      ref.cutGroup.position.set(1.85, 0, 0);
      ref.cutGroup.rotation.set(0.15, -0.22, 0);
      ref.targetSpherical.dist = 7.4;
    }
  }, [viewMode, autoRotate, pitExtract]);

  // Restablecer cámara
  const handleResetView = () => {
    sceneObjectsRef.current.targetSpherical = {
      rotX: 0.22,
      rotY: 0.45,
      dist: viewMode === 'dual' ? 7.4 : 5.4
    };
    setPitExtract(0);
  };

  // Botones de Zoom
  const handleZoomIn = () => {
    sceneObjectsRef.current.targetSpherical.dist = Math.max(
      2.8,
      sceneObjectsRef.current.targetSpherical.dist - 0.65
    );
  };

  const handleZoomOut = () => {
    sceneObjectsRef.current.targetSpherical.dist = Math.min(
      8.5,
      sceneObjectsRef.current.targetSpherical.dist + 0.65
    );
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none py-1">
      {/* 1. Selector Superior de Modos 3D y Acciones Rápidas (UN SOLO RENGLÓN) */}
      <div className="w-full flex items-center justify-between gap-1 px-0.5 mb-2 z-20 flex-nowrap">
        {/* Selector de Modos: ENTERO - CAROZO - DUAL */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-surface-container-low p-0.5 sm:p-1 rounded-2xl border border-outline-variant/30 shadow-xs shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('whole')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${viewMode === 'whole'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-primary'
              }`}
          >
            <CircleDot className="w-3.5 h-3.5 shrink-0" />
            <span>ENTERO</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('cut')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${viewMode === 'cut'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-primary'
              }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>CAROZO</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('dual')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${viewMode === 'dual'
              ? 'bg-tertiary text-on-tertiary shadow-xs'
              : 'text-on-surface-variant hover:text-tertiary'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>DUAL</span>
          </button>
        </div>

        {/* Botones de Giro y Reset en el mismo renglón */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Pausar giro automático' : 'Activar giro automático'}
            className={`p-1.5 rounded-xl border transition-all ${autoRotate
              ? 'bg-primary-container text-on-primary-container border-primary/40'
              : 'bg-surface-container text-outline border-outline-variant/20'
              }`}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleResetView}
            title="Restablecer vista 3D"
            className="p-1.5 rounded-xl bg-surface-container text-outline border border-outline-variant/20 hover:text-on-surface transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Lienzo 3D Ultra-Fluido con soporte de gestos (Touch-Action: None) */}
      <div
        style={{ touchAction: 'none' }}
        className="relative w-full h-64 sm:h-72 flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden rounded-2xl bg-gradient-to-b from-surface-container-lowest via-surface-container-low/40 to-surface-container-low/80 border border-outline-variant/20 touch-none"
      >
        <div
          ref={containerRef}
          style={{ touchAction: 'none' }}
          className="absolute inset-0 w-full h-full touch-none"
        />

        {/* Botones flotantes de Zoom rápido (+ / -) */}
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-surface-container-lowest/85 backdrop-blur-md p-1 rounded-xl border border-outline-variant/30 shadow-xs pointer-events-auto">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Acercar durazno (+)"
            className="p-1 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors active:scale-90"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Alejar durazno (-)"
            className="p-1 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors active:scale-90"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Panel de Extracción 3D del Carozo (Activo en 'cut' y 'dual' o si se extrae) */}
      {(viewMode === 'cut' || viewMode === 'dual' || pitExtract > 0) && (
        <div className="w-full mt-2.5 p-3 rounded-2xl bg-surface-container-low/90 border border-outline-variant/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-primary" />
              <span>Extraer Carozo 3D</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-primary">
                {pitExtract}%
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextVal = pitExtract > 50 ? 0 : 100;
                  setPitExtract(nextVal);
                  if (viewMode === 'whole') setViewMode('cut');
                }}
                className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-colors"
              >
                {pitExtract > 50 ? 'Insertar' : 'Extraer'}
              </button>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={pitExtract}
            onChange={(e) => {
              const val = Number(e.target.value);
              setPitExtract(val);
              if (viewMode === 'whole' && val > 0) {
                setViewMode('cut');
              }
            }}
            className="w-full accent-primary cursor-pointer h-1.5 bg-surface-container-high rounded-lg"
          />

          <div className="flex justify-between text-[10px] text-outline">
            <span>En cavidad</span>
            <span>Extraído en el espacio 3D</span>
          </div>
        </div>
      )}

      {/* Indicador de Interacción 360° y Zoom */}
      <div className="text-center mt-1.5">
        <span className="text-[10px] font-semibold text-outline/80 tracking-wide flex items-center justify-center gap-1.5">
          <MoveHorizontal className="w-3.5 h-3.5 text-primary" />
          <span>1 dedo o mouse para rotar 360° · Pellizcá o rueda para Zoom</span>
        </span>
      </div>
    </div>
  );
};

export default Peach3DCanvas;
