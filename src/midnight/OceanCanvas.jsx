"use client";

import { useEffect, useRef } from "react";

const WATER_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vCrest;

  void main() {
    vec3 pos = position;
    float h = 0.0;
    vec2 grad = vec2(0.0);

    // Sum of directional sine waves with analytic gradient for smooth normals.
    vec2 d1 = normalize(vec2(0.8, 0.4));
    vec2 d2 = normalize(vec2(-0.5, 0.9));
    vec2 d3 = normalize(vec2(0.2, -1.0));
    vec2 d4 = normalize(vec2(1.0, 0.15));

    float p1 = dot(pos.xy, d1) * 0.30 + uTime * 0.50;
    float p2 = dot(pos.xy, d2) * 0.50 + uTime * 0.68;
    float p3 = dot(pos.xy, d3) * 1.00 + uTime * 0.95;
    float p4 = dot(pos.xy, d4) * 1.90 + uTime * 1.40;

    h += sin(p1) * 0.34; grad += cos(p1) * 0.30 * 0.34 * d1;
    h += sin(p2) * 0.22; grad += cos(p2) * 0.50 * 0.22 * d2;
    h += sin(p3) * 0.10; grad += cos(p3) * 1.00 * 0.10 * d3;
    h += sin(p4) * 0.035; grad += cos(p4) * 1.90 * 0.035 * d4;

    pos.z += h;
    vCrest = h;

    // Local-space normal for a plane displaced along +z.
    vec3 localNormal = normalize(vec3(-grad.x, -grad.y, 1.0));
    vNormal = normalize((modelMatrix * vec4(localNormal, 0.0)).xyz);

    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const WATER_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCameraPos;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uGold;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vCrest;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(uCameraPos - vWorldPos);
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.4);

    float depthMix = smoothstep(-60.0, 6.0, vWorldPos.z);
    vec3 base = mix(uDeep, uShallow, depthMix * 0.5 + fresnel * 0.3);

    // Champagne moon-path: a narrow shimmering lane toward the horizon.
    vec3 moonDir = normalize(vec3(-0.22, 0.5, -1.0));
    vec3 halfDir = normalize(moonDir + viewDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 90.0);
    float lane = exp(-abs(vWorldPos.x + 5.0 + sin(vWorldPos.z * 0.06 + uTime * 0.35) * 1.2) * 0.30);
    float laneFalloff = smoothstep(4.0, -30.0, vWorldPos.z);
    base += uGold * spec * lane * 1.6;
    base += uGold * lane * laneFalloff * 0.07 * (0.7 + 0.3 * sin(uTime * 0.7 + vWorldPos.z * 0.4));

    // gentle crest sheen
    base += uGold * smoothstep(0.42, 0.72, vCrest) * fresnel * 0.10;

    // fade far edge into the sky gradient behind the canvas
    float fade = 1.0 - smoothstep(-38.0, -62.0, vWorldPos.z);
    float alpha = mix(0.0, 0.94, fade);

    gl_FragColor = vec4(base, alpha);
  }
`;

export default function OceanCanvas({ enabled = true }) {
  const hostRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let disposed = false;
    let teardown = null;

    (async () => {
      const THREE = await import("three");
      const host = hostRef.current;
      if (disposed || !host) return;

      const isMobile = window.innerWidth < 768;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0);
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 220);
      camera.position.set(0, 3.4, 10);
      camera.lookAt(0, 0.6, -30);

      // Daylight Marina: pale sea glass with a restrained warm navigation lane.
      const palette = { deep: "#82b9b8", shallow: "#d8eee7", gold: "#d7b06b", dust: 0xffffff, dustOpacity: 0.18 };

      const uniforms = {
        uTime: { value: 0 },
        uCameraPos: { value: camera.position },
        uDeep: { value: new THREE.Color(palette.deep) },
        uShallow: { value: new THREE.Color(palette.shallow) },
        uGold: { value: new THREE.Color(palette.gold) },
      };

      const waterGeo = new THREE.PlaneGeometry(160, 90, isMobile ? 72 : 140, isMobile ? 52 : 96);
      const waterMat = new THREE.ShaderMaterial({
        vertexShader: WATER_VERTEX,
        fragmentShader: WATER_FRAGMENT,
        uniforms,
        transparent: true,
        depthWrite: false,
      });
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.rotation.x = -Math.PI / 2;
      water.position.y = 0;
      scene.add(water);

      // Champagne dust drifting above the water line.
      const dustCount = isMobile ? 90 : 220;
      const dustGeo = new THREE.BufferGeometry();
      const dustPos = new Float32Array(dustCount * 3);
      const dustSeed = new Float32Array(dustCount);
      for (let i = 0; i < dustCount; i += 1) {
        dustPos[i * 3] = (Math.random() - 0.5) * 90;
        dustPos[i * 3 + 1] = Math.random() * 16 + 0.5;
        dustPos[i * 3 + 2] = -Math.random() * 70 + 4;
        dustSeed[i] = Math.random() * Math.PI * 2;
      }
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      const dustMat = new THREE.PointsMaterial({
        color: palette.dust,
        size: isMobile ? 0.14 : 0.11,
        transparent: true,
        opacity: palette.dustOpacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const dust = new THREE.Points(dustGeo, dustMat);
      scene.add(dust);

      const startTime = performance.now();
      const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
      let sceneOpacity = 1;

      const onPointerMove = (event) => {
        pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
        pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
      };

      const onScroll = () => {
        // The ocean belongs to the hero: recede as the user descends to operations.
        const progress = window.scrollY / (window.innerHeight * 1.05);
        sceneOpacity = Math.max(0, 1 - progress);
        host.style.opacity = String(sceneOpacity);
      };

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      const render = () => {
        if (sceneOpacity <= 0.01) return; // hidden — skip the draw, keep the loop cheap
        const t = (performance.now() - startTime) / 1000;
        uniforms.uTime.value = t;
        pointer.x += (pointer.tx - pointer.x) * 0.04;
        pointer.y += (pointer.ty - pointer.y) * 0.04;
        camera.position.x = pointer.x * 0.9;
        camera.position.y = 3.4 - pointer.y * 0.35;
        camera.lookAt(0, 0.6, -30);

        const positions = dustGeo.attributes.position.array;
        for (let i = 0; i < dustCount; i += 1) {
          positions[i * 3 + 1] += Math.sin(t * 0.6 + dustSeed[i]) * 0.0035;
        }
        dustGeo.attributes.position.needsUpdate = true;
        dust.rotation.y = t * 0.008;

        renderer.render(scene, camera);
      };

      renderer.setAnimationLoop(render);

      const onVisibility = () => {
        renderer.setAnimationLoop(document.hidden ? null : render);
      };

      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      onScroll();

      teardown = () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("visibilitychange", onVisibility);
        renderer.setAnimationLoop(null);
        waterGeo.dispose();
        waterMat.dispose();
        dustGeo.dispose();
        dustMat.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      };

      if (disposed) teardown();
    })();

    return () => {
      disposed = true;
      teardown?.();
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={hostRef} className="midnight-ocean-canvas" aria-hidden="true" />;
}
