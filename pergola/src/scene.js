// Pergola Studio 3D scene. Plain three.js, no React. PergolaStudio.jsx loads
// this module with a dynamic import only when the section scrolls into view,
// so three.js never lands in the main bundle of any page.
//
// Geometry is generated from the design's dimensions instead of loading model
// files, so every size renders correctly and no brand CAD files are involved.
// Each TEMO model is drawn to match TEMO's own product photos
// (temosunrooms.com, 2026-09-26):
//   Classic       arched roof, curved rafters with scalloped corbel tails past
//                 doubled header beams, trimmed columns; louvers (operable) or
//                 lattice slats (fixed) follow the arch
//   Contemporary  flat roof inside a flush box frame on square posts
//   Studio        flat insulated patio cover with angled knee braces
//   Santa Fe      flat insulated cover with exposed lattice rafter tails
//   Cathedral     gable insulated cover with a vaulted ceiling
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import rules from "./rules.js";

const IN = 0.0254;
const SKY = { day: ["#8fb9d8", "#e6edf0"], night: ["#0b1320", "#223050"] };

function canvasTexture(w, h, draw, { repeat = false } = {}) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// Deterministic noise so every render of a design looks the same.
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

const skyTexture = ([top, bottom]) =>
  canvasTexture(2, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, top);
    gr.addColorStop(1, bottom);
    g.fillStyle = gr;
    g.fillRect(0, 0, 2, 256);
  });

const grassTexture = () =>
  canvasTexture(
    256,
    256,
    (g) => {
      g.fillStyle = "#5d7a3f";
      g.fillRect(0, 0, 256, 256);
      const r = rng(11);
      for (let i = 0; i < 5000; i++) {
        const v = 70 + Math.floor(r() * 50);
        g.fillStyle = `rgba(${v - 20},${v + 40},${v - 30},${0.25 + r() * 0.3})`;
        g.fillRect(r() * 256, r() * 256, 1.5, 3 + r() * 3);
      }
    },
    { repeat: true }
  );

const paverTexture = () =>
  canvasTexture(
    512,
    512,
    (g) => {
      g.fillStyle = "#9e917b";
      g.fillRect(0, 0, 512, 512);
      const cols = ["#c7b9a0", "#b8a88b", "#cfc2ab", "#ad9d81", "#c1b297"];
      const r = rng(5);
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 4; x++) {
          const px = ((x * 128 + (y % 2) * 64) % 512) + 3;
          g.fillStyle = cols[Math.floor(r() * cols.length)];
          g.fillRect(px, y * 64 + 3, 122, 58);
          g.fillStyle = "rgba(255,255,255,.05)";
          g.fillRect(px, y * 64 + 3, 122, 4);
        }
    },
    { repeat: true }
  );

const sidingTexture = () =>
  canvasTexture(
    64,
    256,
    (g) => {
      g.fillStyle = "#cdc3b2";
      g.fillRect(0, 0, 64, 256);
      for (let y = 0; y < 256; y += 16) {
        const gr = g.createLinearGradient(0, y, 0, y + 16);
        gr.addColorStop(0, "#d8cfbf");
        gr.addColorStop(0.8, "#c6bba9");
        gr.addColorStop(1, "#a99d8a");
        g.fillStyle = gr;
        g.fillRect(0, y, 64, 16);
      }
    },
    { repeat: true }
  );

const woodTexture = () =>
  canvasTexture(
    512,
    64,
    (g) => {
      g.fillStyle = "#8a5a36";
      g.fillRect(0, 0, 512, 64);
      const r = rng(7);
      for (let i = 0; i < 60; i++) {
        g.strokeStyle = `rgba(60,34,18,${0.15 + r() * 0.25})`;
        g.beginPath();
        const y = r() * 64;
        g.moveTo(0, y);
        g.bezierCurveTo(170, y + 6 * r(), 340, y - 6 * r(), 512, y);
        g.stroke();
      }
    },
    { repeat: true }
  );

// Rounded box: soft edges catch the light the way powder-coated aluminum does.
function rbox(w, h, d, m, x, y, z, radius = 0.008) {
  const r = Math.min(radius, w / 2.2, h / 2.2, d / 2.2);
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Straight beam along X with decorative corbel ends (Classic) or square ends.
function beam(len, depth, thick, m, corbel) {
  const s = new THREE.Shape();
  const h = len / 2;
  const cut = Math.min(0.24, len * 0.07);
  if (corbel) {
    s.moveTo(-h, depth);
    s.lineTo(h, depth);
    s.lineTo(h, depth * 0.62);
    s.quadraticCurveTo(h - cut * 0.15, depth * 0.3, h - cut * 0.45, depth * 0.28);
    s.quadraticCurveTo(h - cut * 0.75, depth * 0.24, h - cut, 0);
    s.lineTo(-h + cut, 0);
    s.quadraticCurveTo(-h + cut * 0.75, depth * 0.24, -h + cut * 0.45, depth * 0.28);
    s.quadraticCurveTo(-h + cut * 0.15, depth * 0.3, -h, depth * 0.62);
    s.lineTo(-h, depth);
  } else {
    s.moveTo(-h, 0);
    s.lineTo(h, 0);
    s.lineTo(h, depth);
    s.lineTo(-h, depth);
    s.lineTo(-h, 0);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
  g.translate(0, 0, -thick / 2);
  const mesh = new THREE.Mesh(g, m);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Curved Classic rafter running along Z (depth). The underside follows
// `arch`, which the caller builds so it bears on every beam it crosses. The
// front end finishes in a scalloped corbel tail; the back end does too unless
// it butts a house wall, where it is cut square.
function archRafter(zStart, zEnd, arch, depth, thick, m, squareStart = false) {
  const s = new THREE.Shape();
  const n = 32;
  const tail = Math.min(0.3, (zEnd - zStart) * 0.08);
  // Build in (u = z, v = y) space.
  s.moveTo(zStart, arch(zStart) + depth);
  for (let i = 1; i <= n; i++) {
    const z = zStart + ((zEnd - zStart) * i) / n;
    s.lineTo(z, arch(z) + depth);
  }
  // front scalloped tail
  s.lineTo(zEnd, arch(zEnd) + depth * 0.5);
  s.quadraticCurveTo(zEnd - tail * 0.25, arch(zEnd) + depth * 0.15, zEnd - tail * 0.55, arch(zEnd) + depth * 0.2);
  s.quadraticCurveTo(zEnd - tail * 0.8, arch(zEnd) + depth * 0.25, zEnd - tail, arch(zEnd - tail));
  const backTail = squareStart ? 0 : tail;
  for (let i = n - 1; i >= 1; i--) {
    const z = zStart + ((zEnd - zStart) * i) / n;
    if (z < zEnd - tail && z > zStart + backTail) s.lineTo(z, arch(z));
  }
  if (squareStart) {
    s.lineTo(zStart, arch(zStart));
  } else {
    // back scalloped tail
    s.lineTo(zStart + tail, arch(zStart + tail));
    s.quadraticCurveTo(zStart + tail * 0.8, arch(zStart) + depth * 0.25, zStart + tail * 0.55, arch(zStart) + depth * 0.2);
    s.quadraticCurveTo(zStart + tail * 0.25, arch(zStart) + depth * 0.15, zStart, arch(zStart) + depth * 0.5);
  }
  s.lineTo(zStart, arch(zStart) + depth);
  // Bevel only the long faces; a bevel would push the square end into the wall.
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -thick / 2);
  const mesh = new THREE.Mesh(g, m);
  mesh.rotation.y = -Math.PI / 2; // shape u axis → world z
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createPergolaScene(container, catalog, { reducedMotion = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "3D preview of your pergola design. Drag to rotate.");
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envTarget.texture;
  scene.fog = new THREE.Fog("#dfe8ec", 30, 70);

  const hemi = new THREE.HemisphereLight("#e3eef6", "#6b5f4a", 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff1dc", 2.8);
  sun.position.set(7, 11, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -11, bottom: -11, right: 11, top: 11, near: 1, far: 40 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.015;
  scene.add(sun);

  const disposables = [envTarget, pmrem];
  const grass = grassTexture();
  grass.repeat.set(30, 30);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(45, 64), new THREE.MeshStandardMaterial({ map: grass, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const paverMap = paverTexture();
  const patio = new THREE.Mesh(new RoundedBoxGeometry(1, 0.08, 1, 2, 0.01), new THREE.MeshStandardMaterial({ map: paverMap, roughness: 0.85 }));
  patio.receiveShadow = true;
  scene.add(patio);

  const wallMat = new THREE.MeshStandardMaterial({ map: sidingTexture(), roughness: 0.85 });
  wallMat.map.repeat.set(1, 2.4);
  const trimMat = new THREE.MeshStandardMaterial({ color: "#f1ede6", roughness: 0.6 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: "#2c3a48", roughness: 0.08, metalness: 0.2, reflectivity: 0.6 });
  const house = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.25), wallMat);
  wall.castShadow = wall.receiveShadow = true;
  const makeWindow = (w, h) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.04), trimMat));
    const pane = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), glassMat);
    pane.position.z = 0.01;
    g.add(pane);
    const mull = new THREE.Mesh(new THREE.BoxGeometry(0.04, h, 0.06), trimMat);
    mull.position.z = 0.015;
    g.add(mull);
    return g;
  };
  const win = makeWindow(1.6, 1.3);
  const door = makeWindow(1.8, 2.1);
  house.add(wall, win, door);
  scene.add(house);

  const shrubMat = new THREE.MeshStandardMaterial({ color: "#43602c", roughness: 1 });
  for (const [x, z, r] of [[-6.5, -2.5, 0.8], [-7.2, 0.6, 0.6], [6.8, -2.8, 0.9], [7.5, 0.2, 0.55], [-8, 4.5, 0.5], [9, 3.8, 0.7]]) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), shrubMat);
    b.position.set(x, r * 0.7, z);
    b.scale.y = 0.85;
    b.castShadow = b.receiveShadow = true;
    scene.add(b);
  }

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = !reducedMotion;
  controls.minDistance = 4;
  controls.maxDistance = 26;
  controls.maxPolarAngle = Math.PI * 0.49;

  let structure = null;
  let fans = [];
  let lights = [];
  let mat = {};
  let night = false;
  let plan = false;
  let fitted = false;
  let lastSize = "";
  let skyTex = null;
  let dims = [3.2, 3.2, 2.4];

  function materials(finishId) {
    Object.values(mat).forEach((m) => m.dispose && m.dispose());
    const f = catalog.finishes.find((x) => x.id === finishId) || catalog.finishes[0];
    const powder = (hex) => new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.42, metalness: 0.25, clearcoat: 0.35, clearcoatRoughness: 0.45 });
    mat = {
      frame: powder(f.hex),
      roof: powder(f.roofHex || f.hex),
      panel: new THREE.MeshStandardMaterial({ color: "#f4f2ed", roughness: 0.55, metalness: 0.05 }),
      led: new THREE.MeshStandardMaterial({ color: "#fff2d6", emissive: "#ffd79a", emissiveIntensity: 0 }),
      screen: new THREE.MeshStandardMaterial({ color: "#2f2f2f", roughness: 0.95, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
      heater: new THREE.MeshStandardMaterial({ color: "#2a2a2a", emissive: "#ff5a1f", emissiveIntensity: 0, roughness: 0.4, metalness: 0.6 }),
      sky: new THREE.MeshPhysicalMaterial({ color: "#e4f1ff", roughness: 0.08, transmission: 0.7, transparent: true, opacity: 0.65 }),
    };
  }

  function clearStructure() {
    if (structure) {
      structure.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && o.material.userData && o.material.userData.own) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
      scene.remove(structure);
    }
    lights.forEach((l) => scene.remove(l));
    lights = [];
    fans = [];
  }

  function addLight(x, y, z, distance = 7) {
    const l = new THREE.PointLight("#ffcf8a", 0, distance, 1.6);
    l.position.set(x, y, z);
    scene.add(l);
    lights.push(l);
  }

  function addPosts(g, xs, zs, H, P, trimmed) {
    for (const z of zs)
      for (const x of xs) {
        g.add(rbox(P, H, P, mat.frame, x, H / 2, z, 0.01));
        if (trimmed) {
          // Decorative base and capital trim (TEMO Roma / Venetian columns).
          g.add(rbox(P * 1.55, 0.14, P * 1.55, mat.frame, x, 0.07, z, 0.012));
          g.add(rbox(P * 1.3, 0.05, P * 1.3, mat.frame, x, 0.17, z, 0.01));
          g.add(rbox(P * 1.4, 0.07, P * 1.4, mat.frame, x, H - 0.035, z, 0.01));
          g.add(rbox(P * 1.6, 0.05, P * 1.6, mat.frame, x, H + 0.012, z, 0.01));
        } else {
          g.add(rbox(P * 1.35, 0.03, P * 1.35, mat.frame, x, 0.015, z, 0.006));
        }
      }
  }

  // Every builder returns where add-ons attach, so lights, fans, heaters and
  // screens are always fixed to a real member instead of floating:
  //   front / back  inner face (z) and underside (y) of that beam
  //   side(s)       inner face (x) and underside (y) of a side beam, adding
  //                 one if the model has none; s is -1 (left) or 1 (right)
  //   fanAt(x)      adds any member a fan needs, returns the mount height
  //   strips        LED strip runs (pergolas) or pucks (covers)

  // ----- Classic pergola: arched roof with corbel rafters ------------------
  function buildClassic(g, cfg, line, d) {
    const { W, D, H, P, BD, fr, attached, z0, z1 } = d;
    const over = 0.34;
    const BT = P * 0.32; // one ply of the doubled header
    const HO = P * 0.34; // header ply offset from the post centre
    const LT = 0.06; // house ledger thickness
    const rows = [];
    for (let i = attached ? 1 : 0; i <= fr.baysD; i++) rows.push(z0 + i * (D / fr.baysD));
    const xs = [];
    for (let i = 0; i <= fr.baysW; i++) xs.push(-W / 2 + i * (W / fr.baysW));
    // The rafters bear on every header and, when attached, on the ledger. The
    // arch rises between the outermost supports and is flat beyond them, so
    // each rafter sits on its beams and the corbel tails stay level.
    const supports = attached ? [z0 + LT / 2, ...rows] : rows;
    const zMin = supports[0];
    const zMax = supports[supports.length - 1];
    const yBase = H + BD;
    // TEMO Classic has a clearly visible but gentle arch: about 7.5% of the
    // span, so small and large sizes keep the same proportions.
    const rise = Math.min(0.42, (zMax - zMin) * 0.075);
    const c = (zMin + zMax) / 2;
    const h = (zMax - zMin) / 2;
    const arch = (z) => yBase + rise * Math.max(0, 1 - Math.pow((z - c) / h, 2));
    const slope = (z) => (arch(z + 0.01) - arch(z - 0.01)) / 0.02;
    // Interior rows sit under the rise, so their posts stand taller to meet it.
    for (const z of rows) {
      const top = arch(z) - BD;
      addPosts(g, xs, [z], top, P, true);
      for (const dz of [-HO, HO]) {
        const b = beam(W + over * 2, BD, BT, mat.frame, true);
        b.position.set(0, top, z + dz);
        g.add(b);
      }
    }
    if (attached) g.add(rbox(W + 0.1, BD, LT, mat.frame, 0, H + BD / 2, z0 + LT / 2, 0.006));

    // Inner faces of the front header and the back header or ledger.
    const frontZ = z1 - HO - BT / 2;
    const backZ = attached ? z0 + LT : z0 + HO + BT / 2;

    const fixed = line.roof === "louvers-fixed";
    const RT = P * 0.3;
    const rafterDepth = BD * 0.95;
    const rafterGap = fixed ? 0.42 : W / fr.baysW;
    const nRaft = Math.max(fr.baysW + 1, Math.round(W / rafterGap) + 1);
    const zA = attached ? z0 : z0 - over * 0.8;
    const zB = z1 + over * 0.8;
    for (let i = 0; i < nRaft; i++) {
      const r = archRafter(zA, zB, arch, rafterDepth, RT, mat.frame, attached);
      r.position.x = -W / 2 + (i * W) / (nRaft - 1);
      g.add(r);
    }

    const m4 = new THREE.Matrix4();
    const one = new THREE.Vector3(1, 1, 1);
    const tilt = (z, extra = 0) => new THREE.Quaternion().setFromEuler(new THREE.Euler(extra + Math.atan(-slope(z)), 0, 0));
    if (fixed) {
      // Fixed Classic: lattice slats laid across the tops of the rafters.
      const spacing = 0.085;
      const count = Math.max(1, Math.floor((zMax - zMin) / spacing));
      const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(W + 0.12, 0.07, 0.045), mat.roof, count);
      inst.castShadow = inst.receiveShadow = true;
      for (let i = 0; i < count; i++) {
        const z = zMin + spacing * (i + 0.5);
        m4.compose(new THREE.Vector3(0, arch(z) + rafterDepth + 0.035, z), tilt(z), one);
        inst.setMatrixAt(i, m4);
      }
      g.add(inst);
    } else {
      // Operable Classic: blades pivot between the rafters at mid-depth, so
      // any angle stays inside the rafter line, and stop short of each beam.
      const spacing = d.eng.louverSpacingIn * IN;
      const bw = W / fr.baysW;
      const interior = rows.filter((r) => r > zMin + 0.01 && r < zMax - 0.01);
      const zs = [];
      for (let z = backZ + spacing / 2 + 0.01; z + spacing / 2 + 0.01 <= frontZ; z += spacing) {
        if (!interior.some((r) => Math.abs(z - r) < HO + BT / 2 + spacing / 2)) zs.push(z);
      }
      const inst = new THREE.InstancedMesh(new RoundedBoxGeometry(bw - RT - 0.02, 0.024, spacing, 1, 0.008), mat.roof, Math.max(1, zs.length * fr.baysW));
      inst.castShadow = inst.receiveShadow = true;
      const ang = THREE.MathUtils.degToRad(cfg.louverAngleDeg);
      let k = 0;
      for (const z of zs)
        for (let b = 0; b < fr.baysW; b++) {
          m4.compose(new THREE.Vector3(-W / 2 + bw * (b + 0.5), arch(z) + rafterDepth / 2, z), tilt(z, ang), one);
          inst.setMatrixAt(k++, m4);
        }
      inst.count = k;
      g.add(inst);
    }

    const sideBeams = {};
    return {
      front: { z: frontZ, y: H },
      back: attached ? null : { z: backZ, y: H },
      side(s) {
        // Classic has no side beams; screens get one running post to post.
        if (!sideBeams[s]) {
          sideBeams[s] = true;
          g.add(rbox(BT, BD, zMax - zMin, mat.frame, s * W / 2, H + BD / 2, c, 0.006));
        }
        return { x: W / 2 - BT / 2, y: H, zFrom: backZ, zTo: frontZ };
      },
      fanAt(x) {
        // A fan joist hung between the headers carries the downrod.
        g.add(rbox(0.05, 0.14, frontZ - backZ, mat.frame, x, H + BD - 0.07, (frontZ + backZ) / 2, 0.006));
        return { y: H + BD - 0.14, z: (frontZ + backZ) / 2 };
      },
      strips: [
        { axis: "x", x: 0, y: H - 0.009, z: z1 - HO, len: W - 0.05 },
        { axis: "x", x: 0, y: H - 0.009, z: attached ? z0 + LT / 2 : z0 + HO, len: W - 0.05 },
      ],
    };
  }

  // ----- Contemporary pergola: flush box frame, flat louvers --------------
  function buildContemporary(g, cfg, line, d) {
    const { W, D, H, P, fr, attached, z0, z1 } = d;
    const FD = 0.26; // fascia depth
    const FT = 0.08;
    const rows = [];
    for (let i = attached ? 1 : 0; i <= fr.baysD; i++) rows.push(z0 + i * (D / fr.baysD));
    const xs = [];
    for (let i = 0; i <= fr.baysW; i++) xs.push(-W / 2 + P / 2 + i * ((W - P) / fr.baysW));
    const edgeRows = rows.map((z) => Math.min(z1 - P / 2, Math.max(z0 + P / 2, z)));
    addPosts(g, xs, edgeRows, H, P, false);
    const topY = H + FD / 2;
    // Perimeter frame sits on the posts; when attached its back member is
    // the ledger against the house.
    g.add(rbox(W, FD, FT, mat.frame, 0, topY, z1 - FT / 2, 0.01));
    g.add(rbox(W, FD, FT, mat.frame, 0, topY, z0 + FT / 2, 0.01));
    g.add(rbox(FT, FD, D, mat.frame, -W / 2 + FT / 2, topY, 0, 0.01));
    g.add(rbox(FT, FD, D, mat.frame, W / 2 - FT / 2, topY, 0, 0.01));
    const dividers = [];
    for (let b = 1; b < fr.baysW; b++) {
      const x = -W / 2 + (W / fr.baysW) * b;
      dividers.push(x);
      g.add(rbox(FT * 0.9, FD * 0.8, D - FT * 2, mat.frame, x, topY, 0, 0.01));
    }
    for (let b = 1; b < fr.baysD; b++) g.add(rbox(W - FT * 2, FD * 0.8, FT * 0.9, mat.frame, 0, topY, z0 + (D / fr.baysD) * b, 0.01));
    // Louvers pivot at the frame's mid-height so they stay inside it at any angle.
    const spacing = d.eng.louverSpacingIn * IN;
    const inner = D - FT * 2;
    const count = Math.max(1, Math.floor(inner / spacing));
    const bayW = (W - FT * 2) / fr.baysW;
    const geo = new RoundedBoxGeometry(bayW - 0.02, 0.028, spacing, 1, 0.009);
    const inst = new THREE.InstancedMesh(geo, mat.roof, count * fr.baysW);
    inst.castShadow = inst.receiveShadow = true;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(cfg.louverAngleDeg), 0, 0));
    const m4 = new THREE.Matrix4();
    const one = new THREE.Vector3(1, 1, 1);
    let k = 0;
    for (let b = 0; b < fr.baysW; b++)
      for (let i = 0; i < count; i++) {
        m4.compose(new THREE.Vector3(-W / 2 + FT + bayW * (b + 0.5), topY, z0 + FT + spacing * (i + 0.5)), q, one);
        inst.setMatrixAt(k++, m4);
      }
    g.add(inst);
    const inX = W / 2 - FT;
    return {
      front: { z: z1 - FT, y: H },
      back: attached ? null : { z: z0 + FT, y: H },
      side: () => ({ x: inX, y: H, zFrom: z0 + FT, zTo: z1 - FT }),
      fanAt(x) {
        // Fans hang from a bay divider, or from a flush fan beam added to match.
        if (!dividers.some((dx) => Math.abs(dx - x) < 0.05)) g.add(rbox(FT * 0.8, FD * 0.8, D - FT * 2, mat.frame, x, topY, 0, 0.01));
        return { y: topY - FD * 0.4, z: 0 };
      },
      strips: [
        { axis: "x", x: 0, y: H + 0.03, z: z1 - FT - 0.0125, len: W - FT * 2 },
        { axis: "x", x: 0, y: H + 0.03, z: z0 + FT + 0.0125, len: W - FT * 2 },
        { axis: "z", x: -inX + 0.0125, y: H + 0.03, z: 0, len: D - FT * 2 },
        { axis: "z", x: inX - 0.0125, y: H + 0.03, z: 0, len: D - FT * 2 },
      ],
    };
  }

  // ----- Insulated patio covers (Studio / Santa Fe / Cathedral) ------------
  function buildCover(g, cfg, line, d) {
    const { W, D, H, attached, z0, z1 } = d;
    const P = d.P * 0.8;
    const inset = 0.15;
    const HB = 0.2;
    const HT = 0.09;
    const style = cfg.style;
    const rows = [];
    for (let i = attached ? 1 : 0; i <= d.fr.baysD; i++) rows.push(z0 + i * (D / d.fr.baysD));
    const xs = [];
    for (let i = 0; i <= d.fr.baysW; i++) xs.push(-W / 2 + inset + i * ((W - inset * 2) / d.fr.baysW));
    const edgeRows = rows.map((z) => Math.min(z1 - inset, Math.max(z0 + inset, z)));
    const zf = edgeRows[edgeRows.length - 1];
    const zb = edgeRows[0];
    addPosts(g, xs, edgeRows, H, P, style !== "studio");
    for (const z of edgeRows) g.add(rbox(W - 0.1, HB, HT, mat.frame, 0, H + HB / 2, z, 0.008));
    const top = H + HB; // header tops: the roof bears here
    const pucks = [];
    let ceilingAt;
    let roofZ0;

    if (style === "cathedral") {
      const pitch = THREE.MathUtils.degToRad(20);
      const tan = Math.tan(pitch);
      const xe = W / 2 - 0.05; // header ends: the eaves bear here
      const half = W / 2 + 0.2;
      const under = (x) => top + (xe - Math.abs(x)) * tan;
      const RT = 0.1;
      const depth = attached ? D + 0.125 : D + 0.25;
      const zc = attached ? z0 + depth / 2 : 0;
      roofZ0 = zc - depth / 2;
      const slopeLen = half / Math.cos(pitch);
      for (const side of [-1, 1]) {
        const roof = rbox(slopeLen, RT, depth, mat.panel, (side * half) / 2, under(half / 2) + RT / 2 / Math.cos(pitch), zc, 0.01);
        roof.rotation.z = -side * pitch;
        g.add(roof);
        // Gable trim on the open end(s).
        for (const z of attached ? [zc + depth / 2 + 0.04] : [zc + depth / 2 + 0.04, zc - depth / 2 - 0.04]) {
          const trim = rbox(slopeLen, 0.16, 0.08, mat.frame, (side * half) / 2, under(half / 2) + 0.03, z, 0.008);
          trim.rotation.z = -side * pitch;
          g.add(trim);
        }
      }
      // Ridge beam under the peak, carried by king posts on the headers.
      const ridgeH = 0.16;
      const ridgeBottom = under(0) - ridgeH;
      g.add(rbox(0.1, ridgeH, depth, mat.frame, 0, under(0) - ridgeH / 2, zc, 0.01));
      const kingH = ridgeBottom - top;
      if (kingH > 0.05) for (const z of attached ? [zf] : [zf, zb]) g.add(rbox(0.09, kingH, 0.09, mat.frame, 0, top + kingH / 2, z, 0.008));
      ceilingAt = (x) => (Math.abs(x) < 0.06 ? ridgeBottom : under(x));
      for (const side of [-1, 1]) {
        const x = (side * W) / 4;
        const nz = Math.max(1, Math.round(D / 2));
        for (let j = 0; j < nz; j++) pucks.push({ x, y: under(x) - 0.0075, z: z0 + (D / nz) * (j + 0.5), rz: -side * pitch });
      }
    } else {
      // Flat cover. Attached covers pitch gently away from the house for
      // drainage, bearing on a wall ledger at the high end.
      const a = attached ? 0.025 : 0;
      const RT = 0.11;
      const depth = D + (attached ? 0.15 : 0.3);
      const zc = attached ? z0 + depth / 2 : 0;
      roofZ0 = zc - depth / 2;
      const under = (z) => top + (zf - z) * Math.tan(a);
      const roof = rbox(W + 0.25, RT, depth, mat.panel, 0, under(zc) + RT / 2, zc, 0.012);
      roof.rotation.x = a;
      g.add(roof);
      if (attached) g.add(rbox(W - 0.1, HB, HT, mat.frame, 0, under(z0 + HT / 2) - HB / 2, z0 + HT / 2, 0.008));
      if (cfg.options.tuscany) {
        const t = woodTexture();
        t.repeat.set(1, 7);
        t.rotation = Math.PI / 2;
        const cm = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 });
        cm.userData.own = true;
        const cz = attached ? z0 + (D + 0.1) / 2 : 0;
        const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.2, D + 0.1), cm);
        ceil.rotation.x = Math.PI / 2 + a;
        ceil.position.set(0, under(cz) - 0.004, cz);
        g.add(ceil);
      }
      // Fascia and gutter across the open edge(s), capping the panel ends.
      const front = zc + depth / 2;
      g.add(rbox(W + 0.3, 0.2, 0.1, mat.frame, 0, under(front) + 0.05, front + 0.05, 0.01));
      g.add(rbox(W + 0.3, 0.1, 0.12, mat.frame, 0, under(front) - 0.02, front + 0.16, 0.01));
      if (!attached) g.add(rbox(W + 0.3, 0.2, 0.1, mat.frame, 0, under(roofZ0) + 0.05, roofZ0 - 0.05, 0.01));
      if (style === "studio") {
        // Angled knee braces from post to header.
        for (const z of edgeRows)
          for (const x of xs) {
            for (const dir of [-1, 1]) {
              if ((x <= -W / 2 + 0.2 && dir < 0) || (x >= W / 2 - 0.2 && dir > 0)) continue;
              const br = rbox(0.62, 0.07, 0.06, mat.frame, x + dir * 0.2, H - 0.2, z, 0.006);
              br.rotation.z = dir * Math.PI * 0.25;
              g.add(br);
            }
          }
      }
      if (style === "santa-fe") {
        // Exposed lattice rafter tails running out under the front edge.
        const n = Math.round(W / 0.4);
        for (let i = 0; i <= n; i++) {
          const t = beam(0.55, 0.12, 0.05, mat.frame, true);
          t.rotation.y = Math.PI / 2;
          t.position.set(-W / 2 + (i * W) / n, under(z1) + 0.02, z1 + 0.3);
          g.add(t);
        }
        g.add(rbox(W + 0.3, 0.05, 0.05, mat.frame, 0, under(z1) + 0.15, z1 + 0.45, 0.005));
        g.add(rbox(W + 0.3, 0.05, 0.05, mat.frame, 0, under(z1) + 0.15, z1 + 0.33, 0.005));
      }
      const n = cfg.options.skylights || 0;
      for (let i = 0; i < n; i++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, Math.min(1.6, D * 0.55)), mat.sky);
        s.position.set(-W / 2 + (W / (n + 1)) * (i + 1), under(0) + RT + 0.005, 0);
        s.rotation.x = a;
        g.add(s);
      }
      ceilingAt = (x, z = 0) => under(z);
      const nx = Math.max(2, Math.round(W / 1.6));
      const nz = Math.max(1, Math.round(D / 2));
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < nz; j++) {
          const z = z0 + (D / nz) * (j + 0.5);
          pucks.push({ x: -W / 2 + (W / nx) * (i + 0.5), y: under(z) - 0.0075, z, rx: a });
        }
    }

    const sideX = W / 2 - inset;
    const sideBeams = {};
    const sFrom = attached ? z0 + HT : zb;
    return {
      front: { z: zf - HT / 2, y: H },
      back: attached ? null : { z: zb + HT / 2, y: H },
      side(s) {
        // Side screens need a header along that side, post to post.
        if (!sideBeams[s]) {
          sideBeams[s] = true;
          g.add(rbox(HT, HB, zf - sFrom, mat.frame, s * sideX, H + HB / 2, (zf + sFrom) / 2, 0.008));
        }
        return { x: sideX - HT / 2, y: H, zFrom: sFrom + HT / 2, zTo: zf - HT / 2 };
      },
      fanAt: (x) => ({ y: ceilingAt(x, 0), z: 0 }),
      pucks,
    };
  }

  function update(cfg) {
    clearStructure();
    const line = catalog.lines.find((l) => l.id === cfg.line);
    const eng = catalog.engineering_UNCONFIRMED;
    const fr = rules.frame(catalog, cfg);
    materials(cfg.finish);
    const W = cfg.widthIn * IN;
    const D = cfg.depthIn * IN;
    const H = eng.clearHeightIn * IN;
    const d = { W, D, H, P: eng.postIn * IN, BD: eng.beamDepthIn * IN, fr, eng, attached: cfg.mount === "attached", z0: -D / 2, z1: D / 2 };
    const g = new THREE.Group();
    structure = g;
    const mount = line.roof === "solid-insulated" ? buildCover(g, cfg, line, d) : cfg.style === "contemporary" ? buildContemporary(g, cfg, line, d) : buildClassic(g, cfg, line, d);

    // Lighting: recessed pucks in cover ceilings, LED strips on pergola beams.
    if (cfg.options.led) {
      if (mount.pucks) {
        for (const p of mount.pucks) {
          const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.015, 20), mat.led);
          puck.position.set(p.x, p.y, p.z);
          puck.rotation.set(p.rx || 0, 0, p.rz || 0);
          g.add(puck);
        }
      } else {
        for (const s of mount.strips) g.add(rbox(s.axis === "x" ? s.len : 0.025, 0.018, s.axis === "x" ? 0.025 : s.len, mat.led, s.x, s.y, s.z, 0.005));
      }
      addLight(-W / 3, H - 0.3, 0);
      addLight(W / 3, H - 0.3, 0);
    }
    // Ceiling fans on a downrod from the member returned by fanAt.
    const fanCount = cfg.options.fan || 0;
    for (let i = 0; i < fanCount; i++) {
      const fx = fanCount === 1 ? 0 : i ? W / 4 : -W / 4;
      const { y, z } = mount.fanAt(fx);
      g.add(rbox(0.04, 0.3, 0.04, mat.frame, fx, y - 0.15, z, 0.008));
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.12, 24), mat.frame);
      hub.position.set(fx, y - 0.34, z);
      hub.castShadow = true;
      g.add(hub);
      const blades = new THREE.Group();
      blades.position.set(fx, y - 0.35, z);
      for (let b = 0; b < 5; b++) {
        const piv = new THREE.Group();
        piv.rotation.y = (b / 5) * Math.PI * 2;
        const bl = rbox(0.6, 0.012, 0.13, mat.frame, 0.4, 0, 0, 0.004);
        bl.rotation.x = 0.12;
        piv.add(bl);
        blades.add(piv);
      }
      g.add(blades);
      fans.push(blades);
    }
    // Patio heaters hang on a short bracket under the front beam.
    for (let i = 0; i < (cfg.options.heater || 0); i++) {
      const hx = i ? W / 4 : -W / 4;
      const f = mount.front;
      g.add(rbox(0.04, 0.1, 0.04, mat.frame, hx, f.y - 0.05, f.z - 0.03, 0.006));
      const h = rbox(0.85, 0.11, 0.15, mat.heater, hx, f.y - 0.15, f.z - 0.08, 0.01);
      h.rotation.x = -0.5;
      g.add(h);
    }
    // Retractable screens: cassette tight under the beam, screen part-lowered.
    const sh = H * 0.6;
    for (const s of cfg.options.screen || []) {
      let cas;
      let scr;
      if (s === "front" || s === "back") {
        const m = s === "front" ? mount.front : mount.back;
        if (!m) continue;
        const z = s === "front" ? m.z - 0.05 : m.z + 0.05;
        const len = W - 0.3;
        cas = rbox(len, 0.12, 0.1, mat.frame, 0, m.y - 0.06, z, 0.01);
        scr = new THREE.Mesh(new THREE.PlaneGeometry(len - 0.04, sh), mat.screen);
        scr.position.set(0, m.y - 0.12 - sh / 2, z);
      } else {
        const sd = mount.side(s === "left" ? -1 : 1);
        const x = (s === "left" ? -1 : 1) * (sd.x - 0.05);
        const len = sd.zTo - sd.zFrom - 0.02;
        const zc = (sd.zFrom + sd.zTo) / 2;
        cas = rbox(0.1, 0.12, len, mat.frame, x, sd.y - 0.06, zc, 0.01);
        scr = new THREE.Mesh(new THREE.PlaneGeometry(len - 0.04, sh), mat.screen);
        scr.rotation.y = Math.PI / 2;
        scr.position.set(x, sd.y - 0.12 - sh / 2, zc);
      }
      g.add(cas, scr);
    }
    scene.add(g);

    patio.scale.set(W + 1.8, 1, D + 1.6);
    patio.position.set(0, 0.04, d.attached ? 0.4 : 0);
    house.visible = d.attached;
    if (d.attached) {
      const wallH = H + 2.2;
      wall.scale.set(W + 7, wallH, 1);
      wall.position.set(0, wallH / 2, d.z0 - 0.125); // face flush with the ledger line
      win.position.set(-W / 4, H * 0.55, d.z0 + 0.005);
      door.position.set(W / 5, 1.05, d.z0 + 0.005);
    }
    const sizeKey = `${cfg.widthIn}x${cfg.depthIn}x${cfg.line}x${cfg.style}`;
    if (sizeKey !== lastSize) fitted = false;
    lastSize = sizeKey;
    dims = [W, D, H];
    fit(W, D, H);
    applyLighting();
  }

  function fit(W, D, H) {
    const span = Math.max(W, D, 3.2);
    controls.target.set(0, H * 0.62, 0);
    if (fitted || plan) return;
    const narrow = container.clientWidth < 700;
    const dist = span * (narrow ? 1.9 : 1.45) + 3.3;
    camera.position.set(dist * 0.62, H * 0.95 + span * 0.3, dist * 0.8);
    fitted = true;
  }

  function applyLighting() {
    if (skyTex) skyTex.dispose();
    skyTex = skyTexture(night ? SKY.night : SKY.day);
    scene.background = skyTex;
    scene.fog.color.set(night ? "#1a2336" : "#dfe8ec");
    sun.intensity = night ? 0.1 : 2.8;
    sun.color.set(night ? "#9fb4ff" : "#fff1dc");
    hemi.intensity = night ? 0.1 : 0.85;
    renderer.toneMappingExposure = night ? 1.3 : 0.95;
    scene.environmentIntensity = night ? 0.1 : 0.6;
    if (mat.led) mat.led.emissiveIntensity = night ? 3 : 0.2;
    if (mat.heater) mat.heater.emissiveIntensity = night ? 1.4 : 0;
    lights.forEach((l) => (l.intensity = night ? 9 : 0));
  }

  function resize() {
    const r = container.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  let raf = 0;
  const onScreen = () => {
    const r = container.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
  };
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    if (!onScreen()) return;
    if (!reducedMotion) fans.forEach((b) => (b.rotation.y = t * 0.004));
    controls.update();
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);

  return {
    update,
    setNight(v) {
      night = Boolean(v);
      applyLighting();
    },
    setPlan(v) {
      plan = Boolean(v);
      if (plan) {
        camera.position.set(0, 15, 0.01);
        controls.maxPolarAngle = 0.01;
      } else {
        controls.maxPolarAngle = Math.PI * 0.49;
        fitted = false;
        fit(...dims);
      }
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      clearStructure();
      controls.dispose();
      disposables.forEach((x) => x.dispose && x.dispose());
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
      if (skyTex) skyTex.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
