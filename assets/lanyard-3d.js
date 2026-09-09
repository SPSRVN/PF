/**
 * Interactive 3D Lanyard Component with Realistic Proportions & Authentic Physics
 * Supports multiple instances: Digifox Studio & Madras MindWorks
 */

(function() {
    'use strict';

    function createLanyardInstance(config) {
        const container = document.getElementById(config.containerId);
        if (!container) return;

        // Remove any existing canvas
        const existingCanvas = container.querySelector('canvas');
        if (existingCanvas) existingCanvas.remove();

        let width = container.clientWidth || 340;
        let height = container.clientHeight || 480;
        if (width < 50) width = 340;
        if (height < 50) height = 480;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(24, width / height, 0.1, 100);
        // Camera framing to show full lanyard strap starting exactly flush with top box ceiling
        camera.position.set(0, 0.35, 14.8);

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputEncoding = THREE.sRGBEncoding;

        container.appendChild(renderer.domElement);

        // Soft, authentic diffuse lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        scene.add(ambientLight);

        const frontLight = new THREE.DirectionalLight(0xffffff, 0.42);
        frontLight.position.set(2, 4, 8);
        scene.add(frontLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.38);
        backLight.position.set(-2, 3, -8);
        scene.add(backLight);

        const softCyanRim = new THREE.DirectionalLight(0x00f5ff, 0.3);
        softCyanRim.position.set(-6, -2, 5);
        scene.add(softCyanRim);

        // Metal Hook loop parameter
        let hookLocalY = 1.48;

        // Calculate dynamic ceiling anchor point sitting EXACTLY flush with the top border of the box
        function getCeilingAnchorY() {
            const halfFovRad = THREE.MathUtils.degToRad(camera.fov / 2);
            const visibleHalfHeight = camera.position.z * Math.tan(halfFovRad);
            return camera.position.y + visibleHalfHeight; // Perfectly at the top border
        }

        // Physics parameters (Verlet rope + rigid body)
        const gravity = -38.0;
        const damping = 0.95;
        const angularDamping = 0.93;
        const segmentLength = 0.52;
        const numSegments = 4;

        // Fixed anchor sitting perfectly flush at the top ceiling border of the 3D box
        const fixedPos = new THREE.Vector3(0, getCeilingAnchorY(), 0);
        const joints = [];
        for (let i = 0; i < numSegments; i++) {
            joints.push({
                pos: new THREE.Vector3(0, fixedPos.y - i * segmentLength, 0),
                oldPos: new THREE.Vector3(0, fixedPos.y - i * segmentLength, 0),
                vel: new THREE.Vector3(0, 0, 0)
            });
        }

        // Card state
        const restHookY = fixedPos.y - numSegments * segmentLength;
        const initialCardY = restHookY - hookLocalY;
        const cardState = {
            pos: new THREE.Vector3(0, initialCardY, 0),
            oldPos: new THREE.Vector3(0, initialCardY, 0),
            rot: new THREE.Euler(0, 0, 0, 'YXZ'),
            rotVel: new THREE.Vector3(0, 0, 0),
            dragged: false,
            hovered: false
        };

        // Texture Loader with cache-busting
        const textureLoader = new THREE.TextureLoader();
        const vQuery = '?v=10';
        
        // Load card composite texture
        const cardAtlasTex = textureLoader.load(config.cardTexture + vQuery);
        cardAtlasTex.encoding = THREE.sRGBEncoding;
        cardAtlasTex.flipY = false;
        cardAtlasTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

        // Load lanyard strap texture
        const lanyardTex = textureLoader.load(config.lanyardTexture + vQuery);
        lanyardTex.wrapS = THREE.ClampToEdgeWrapping;
        lanyardTex.wrapT = THREE.ClampToEdgeWrapping;
        lanyardTex.encoding = THREE.sRGBEncoding;
        lanyardTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

        // Create Ribbon Mesh (Wide lanyard strap)
        const ribbonWidth = 0.62;
        const ribbonSegments = 36;
        const ribbonGeom = new THREE.BufferGeometry();
        
        const vertexCount = (ribbonSegments + 1) * 2;
        const positions = new Float32Array(vertexCount * 3);
        const uvs = new Float32Array(vertexCount * 2);
        const indices = [];

        for (let i = 0; i < ribbonSegments; i++) {
            const a = i * 2;
            const b = i * 2 + 1;
            const c = (i + 1) * 2;
            const d = (i + 1) * 2 + 1;
            indices.push(a, b, c);
            indices.push(b, d, c);
        }

        ribbonGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        ribbonGeom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        ribbonGeom.setIndex(indices);

        const ribbonMat = new THREE.MeshLambertMaterial({
            map: lanyardTex,
            side: THREE.DoubleSide
        });
        const ribbonMesh = new THREE.Mesh(ribbonGeom, ribbonMat);
        scene.add(ribbonMesh);

        // Load 3D Card Model
        const cardGroup = new THREE.Group();
        scene.add(cardGroup);

        function setupCardModel(gltf) {
            const model = gltf.scene;
            
            model.traverse((child) => {
                if (child.isMesh) {
                    if (child.name === 'card' || (child.material && child.material.name === 'base')) {
                        child.material = new THREE.MeshLambertMaterial({
                            map: cardAtlasTex,
                            reflectivity: 0.2,
                            side: THREE.DoubleSide
                        });
                    } else if (child.name === 'clip' || child.name === 'clamp' || (child.material && child.material.name === 'metal')) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xd5dfea,
                            metalness: 0.95,
                            roughness: 0.25,
                            side: THREE.DoubleSide
                        });
                    }
                }
            });

            model.scale.set(2.0, 2.0, 2.0);
            
            // Center X & Z
            const tempBox = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            tempBox.getCenter(center);
            
            model.position.set(-center.x, -0.65, -center.z);
            cardGroup.add(model);

            hookLocalY = 1.48;

            const loadingOverlay = container.querySelector('.lanyard-loading');
            if (loadingOverlay) {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => { try { loadingOverlay.remove(); } catch (e) {} }, 400);
            }
        }

        function buildProceduralCard() {
            const pGroup = new THREE.Group();
            
            // Main Card Badge
            const cardGeom = new THREE.BoxGeometry(2.35, 3.45, 0.05);
            const cardMat = new THREE.MeshLambertMaterial({
                map: cardAtlasTex,
                reflectivity: 0.2
            });
            const cardMesh = new THREE.Mesh(cardGeom, cardMat);
            pGroup.add(cardMesh);

            // Metallic Top Clamp
            const clampGeom = new THREE.BoxGeometry(0.75, 0.35, 0.12);
            const metalMat = new THREE.MeshStandardMaterial({
                color: 0xd5dfea,
                metalness: 0.95,
                roughness: 0.25
            });
            const clampMesh = new THREE.Mesh(clampGeom, metalMat);
            clampMesh.position.set(0, 1.82, 0);
            pGroup.add(clampMesh);

            // Metal Ring Loop
            const ringGeom = new THREE.TorusGeometry(0.2, 0.045, 10, 24);
            const ringMesh = new THREE.Mesh(ringGeom, metalMat);
            ringMesh.position.set(0, 2.05, 0);
            pGroup.add(ringMesh);

            pGroup.position.set(0, -0.6, 0);
            cardGroup.add(pGroup);
            hookLocalY = 1.48;

            const loadingOverlay = container.querySelector('.lanyard-loading');
            if (loadingOverlay) {
                loadingOverlay.style.opacity = '0';
                setTimeout(() => { try { loadingOverlay.remove(); } catch (e) {} }, 400);
            }
        }

        function base64ToArrayBuffer(base64) {
            const binary_string = window.atob(base64);
            const len = binary_string.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
            }
            return bytes.buffer;
        }

        const gltfLoader = new THREE.GLTFLoader();

        function loadCardModel() {
            if (window.CARD_GLB_BASE64) {
                try {
                    const arrayBuf = base64ToArrayBuffer(window.CARD_GLB_BASE64);
                    gltfLoader.parse(arrayBuf, '', (gltf) => {
                        setupCardModel(gltf);
                    }, (err) => {
                        console.warn('Fallback to procedural card on parse error:', err);
                        buildProceduralCard();
                    });
                    return;
                } catch (e) {
                    console.warn('Error parsing base64 glb:', e);
                }
            }

            if (window.location.protocol !== 'file:') {
                gltfLoader.load('assets/card.glb', (gltf) => {
                    setupCardModel(gltf);
                }, undefined, (err) => {
                    console.warn('GLTFLoader load failed, fallback to procedural card:', err);
                    buildProceduralCard();
                });
            } else {
                buildProceduralCard();
            }
        }

        loadCardModel();

        function getHookWorldPos() {
            return new THREE.Vector3(0, hookLocalY, 0).applyEuler(cardState.rot).add(cardState.pos);
        }

        // Pointer / Dragging interaction
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const dragOffset = new THREE.Vector3();
        let lastMousePos = new THREE.Vector2();
        let mouseSpeed = new THREE.Vector2();

        function getPointerPos(e) {
            const rect = renderer.domElement.getBoundingClientRect();
            const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
            const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
            return {
                x: ((clientX - rect.left) / rect.width) * 2 - 1,
                y: -((clientY - rect.top) / rect.height) * 2 + 1,
                rawX: clientX,
                rawY: clientY
            };
        }

        function getWorldPointFromPointer(pointerPos) {
            const v = new THREE.Vector3(pointerPos.x, pointerPos.y, 0.5);
            v.unproject(camera);
            const dir = v.sub(camera.position).normalize();
            const distance = -camera.position.z / dir.z;
            return camera.position.clone().add(dir.multiplyScalar(distance));
        }

        function onPointerDown(e) {
            const pos = getPointerPos(e);
            pointer.x = pos.x;
            pointer.y = pos.y;
            lastMousePos.set(pos.rawX, pos.rawY);

            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObjects(cardGroup.children, true);
            const worldPt = getWorldPointFromPointer(pos);

            const distToCard = worldPt.distanceTo(cardState.pos);
            if (intersects.length > 0 || distToCard < 3.8) {
                cardState.dragged = true;
                dragOffset.copy(cardState.pos).sub(worldPt);
                container.style.cursor = 'grabbing';
                if (e.cancelable && e.preventDefault) e.preventDefault();
            }
        }

        function onPointerMove(e) {
            const pos = getPointerPos(e);
            pointer.x = pos.x;
            pointer.y = pos.y;

            mouseSpeed.x = pos.rawX - lastMousePos.x;
            mouseSpeed.y = pos.rawY - lastMousePos.y;
            lastMousePos.set(pos.rawX, pos.rawY);

            if (cardState.dragged) {
                const worldPt = getWorldPointFromPointer(pos);
                cardState.pos.x = worldPt.x + dragOffset.x;
                cardState.pos.y = worldPt.y + dragOffset.y;
                if (e.cancelable && e.preventDefault) e.preventDefault();
            } else {
                raycaster.setFromCamera(pointer, camera);
                const intersects = raycaster.intersectObjects(cardGroup.children, true);
                if (intersects.length > 0) {
                    if (!cardState.hovered) {
                        cardState.hovered = true;
                        container.style.cursor = 'grab';
                    }
                } else if (cardState.hovered) {
                    cardState.hovered = false;
                    container.style.cursor = 'default';
                }
            }
        }

        function onPointerUp() {
            if (cardState.dragged) {
                cardState.dragged = false;
                container.style.cursor = cardState.hovered ? 'grab' : 'default';
                
                cardState.rotVel.y += THREE.MathUtils.clamp(mouseSpeed.x * 0.08, -15, 15);
                cardState.rotVel.x -= THREE.MathUtils.clamp(mouseSpeed.y * 0.05, -10, 10);
            }
        }

        renderer.domElement.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);

        function updateSize() {
            if (!container) return;
            const newW = container.clientWidth || 340;
            const newH = container.clientHeight || 480;
            if (newW > 50 && newH > 50) {
                camera.aspect = newW / newH;
                camera.updateProjectionMatrix();
                renderer.setSize(newW, newH);
                fixedPos.y = getCeilingAnchorY();
                joints[0].pos.copy(fixedPos);
            }
        }

        window.addEventListener('resize', updateSize);
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(updateSize);
            ro.observe(container);
        }

        const curvePoints = [
            fixedPos,
            joints[1].pos,
            joints[2].pos,
            joints[3].pos,
            new THREE.Vector3()
        ];
        const spline = new THREE.CatmullRomCurve3(curvePoints, false, 'chordal');

        let lastTime = performance.now();
        let prevBoxLeft = null;
        let prevBoxTop = null;
        let isVisible = true;
        let animRaf = null;

        function startLoop() {
            if (!isVisible) return;
            if (animRaf) return;
            lastTime = performance.now();
            animRaf = requestAnimationFrame(animate);
        }

        function stopLoop() {
            if (animRaf) {
                cancelAnimationFrame(animRaf);
                animRaf = null;
            }
        }

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    isVisible = entry.isIntersecting;
                    if (isVisible) {
                        startLoop();
                    } else {
                        stopLoop();
                    }
                });
            }, { rootMargin: '150px 0px 150px 0px' });
            io.observe(container);
        }

        function animate() {
            if (!isVisible) {
                animRaf = null;
                return;
            }
            animRaf = requestAnimationFrame(animate);

            const now = performance.now();
            const dt = Math.min((now - lastTime) / 1000, 0.033);
            lastTime = now;

            // 0. Box Motion Inertia Physics (Left / Right sliding during scroll docking & window movement)
            const rect = container.getBoundingClientRect();
            if (prevBoxLeft !== null) {
                const dX = rect.left - prevBoxLeft;
                const dY = rect.top - prevBoxTop;

                if (!cardState.dragged && (Math.abs(dX) > 0.04 || Math.abs(dY) > 0.04)) {
                    // Moving left (dX < 0) pushes card/rope right (+X); moving right (dX > 0) pushes left (-X)
                    const inertiaStrengthX = THREE.MathUtils.clamp(-dX * 0.0075, -0.28, 0.28);
                    const inertiaStrengthY = THREE.MathUtils.clamp(-dY * 0.0012, -0.035, 0.035);

                    // Displace card position in direction of horizontal inertia
                    cardState.pos.x += inertiaStrengthX * 0.75;
                    cardState.pos.y += inertiaStrengthY * 0.1;

                    // Rotational roll & yaw tilt velocity impulses
                    cardState.rotVel.z += inertiaStrengthX * 45.0;
                    cardState.rotVel.y += inertiaStrengthX * 20.0;
                    cardState.rotVel.x += (-inertiaStrengthY * 8.0);

                    // Displace rope joints with gradient weight so ribbon bends naturally
                    for (let i = 1; i < numSegments; i++) {
                        const jointWeight = (i / numSegments);
                        joints[i].pos.x += inertiaStrengthX * 0.65 * jointWeight;
                        joints[i].pos.y += inertiaStrengthY * 0.08 * jointWeight;
                    }
                }
            }
            prevBoxLeft = rect.left;
            prevBoxTop = rect.top;

            // 1. Update Card Position from Drag or Physics
            if (cardState.dragged) {
                cardState.oldPos.copy(cardState.pos);
                const targetRotZ = -THREE.MathUtils.clamp(mouseSpeed.x * 0.02, -0.6, 0.6);
                const targetRotX = THREE.MathUtils.clamp(mouseSpeed.y * 0.02, -0.6, 0.6);
                cardState.rot.z += (targetRotZ - cardState.rot.z) * 0.15;
                cardState.rot.x += (targetRotX - cardState.rot.x) * 0.15;
            } else {
                const vel = cardState.pos.clone().sub(cardState.oldPos).multiplyScalar(damping);
                vel.y += gravity * dt * dt;
                cardState.oldPos.copy(cardState.pos);
                cardState.pos.add(vel);

                cardState.rot.x += cardState.rotVel.x * dt;
                cardState.rot.y += cardState.rotVel.y * dt;
                cardState.rot.z += cardState.rotVel.z * dt;

                cardState.rotVel.x += (-cardState.rot.x * 7.5) * dt;
                cardState.rotVel.y += (-cardState.rot.y * 2.2) * dt;
                cardState.rotVel.z += (-cardState.rot.z * 10.0) * dt;

                cardState.rotVel.multiplyScalar(angularDamping);
            }

            // 2. Verlet Physics for Rope Joints
            joints[0].pos.copy(fixedPos);

            for (let i = 1; i < numSegments; i++) {
                const j = joints[i];
                const jVel = j.pos.clone().sub(j.oldPos).multiplyScalar(damping);
                jVel.y += gravity * dt * dt;
                j.oldPos.copy(j.pos);
                j.pos.add(jVel);
            }

            // 3. Distance Constraints Relaxation
            const iterations = 8;
            for (let iter = 0; iter < iterations; iter++) {
                const d1 = joints[1].pos.clone().sub(joints[0].pos);
                const dist1 = d1.length();
                if (dist1 > 0.001) {
                    const diff1 = (dist1 - segmentLength) / dist1;
                    joints[1].pos.sub(d1.multiplyScalar(diff1));
                }

                for (let i = 1; i < numSegments - 1; i++) {
                    const d = joints[i + 1].pos.clone().sub(joints[i].pos);
                    const dist = d.length();
                    if (dist > 0.001) {
                        const diff = (dist - segmentLength) / dist;
                        joints[i].pos.add(d.clone().multiplyScalar(diff * 0.5));
                        joints[i + 1].pos.sub(d.multiplyScalar(diff * 0.5));
                    }
                }

                const hookPos = getHookWorldPos();
                const dHook = hookPos.clone().sub(joints[numSegments - 1].pos);
                const distHook = dHook.length();
                if (distHook > 0.001) {
                    const diffHook = (distHook - 0.02) / distHook;
                    joints[numSegments - 1].pos.add(dHook.clone().multiplyScalar(diffHook * 0.7));
                    if (!cardState.dragged) {
                        cardState.pos.sub(dHook.multiplyScalar(diffHook * 0.3));
                    }
                }
            }

            // 4. Update 3D Card Transform with Pendulum + Inertial Tilt
            cardGroup.position.copy(cardState.pos);

            const hookPosFinal = getHookWorldPos();
            const swingDir = cardState.pos.clone().sub(joints[numSegments - 1].pos).normalize();
            if (!cardState.dragged) {
                const pendulumAngleZ = -Math.asin(THREE.MathUtils.clamp(swingDir.x, -0.9, 0.9)) * 0.6;
                cardGroup.rotation.z = pendulumAngleZ + cardState.rot.z * 0.65;
                cardGroup.rotation.y = cardState.rot.y;
                cardGroup.rotation.x = cardState.rot.x;
            } else {
                cardGroup.rotation.copy(cardState.rot);
            }

            // 5. Update Ribbon Mesh Geometry along Spline
            curvePoints[0].copy(fixedPos);
            for (let i = 1; i < numSegments; i++) {
                curvePoints[i].copy(joints[i].pos);
            }
            curvePoints[numSegments].copy(hookPosFinal);

            const splinePoints = spline.getPoints(ribbonSegments);
            const posAttr = ribbonGeom.attributes.position;
            const uvAttr = ribbonGeom.attributes.uv;

            const camPos = camera.position;
            const halfW = ribbonWidth * 0.5;

            for (let i = 0; i <= ribbonSegments; i++) {
                const pt = splinePoints[i];
                const t = i / ribbonSegments;

                let tangent;
                if (i === 0) {
                    tangent = splinePoints[1].clone().sub(pt).normalize();
                } else if (i === ribbonSegments) {
                    tangent = pt.clone().sub(splinePoints[i - 1]).normalize();
                } else {
                    tangent = splinePoints[i + 1].clone().sub(splinePoints[i - 1]).normalize();
                }

                const toCam = camPos.clone().sub(pt).normalize();
                const normal = new THREE.Vector3().crossVectors(tangent, toCam).normalize();
                if (normal.lengthSq() < 0.001) normal.set(1, 0, 0);

                const vIndex = i * 2;
                posAttr.setXYZ(vIndex, pt.x - normal.x * halfW, pt.y - normal.y * halfW, pt.z - normal.z * halfW);
                uvAttr.setXY(vIndex, (1.0 - t), 0);

                posAttr.setXYZ(vIndex + 1, pt.x + normal.x * halfW, pt.y + normal.y * halfW, pt.z + normal.z * halfW);
                uvAttr.setXY(vIndex + 1, (1.0 - t), 1);
            }

            posAttr.needsUpdate = true;
            uvAttr.needsUpdate = true;
            ribbonGeom.computeVertexNormals();

            renderer.render(scene, camera);
        }

        // Handle dynamic container resizing during scroll docking & window resizes
        function handleContainerResize() {
            const w = container.clientWidth || 340;
            const h = container.clientHeight || 480;
            if (w < 20 || h < 20) return;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
            fixedPos.set(0, getCeilingAnchorY(), 0);
        }

        window.addEventListener('resize', handleContainerResize);
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                handleContainerResize();
            });
            ro.observe(container);
        }

        animate();
    }

    function initAllLanyards() {
        if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
            setTimeout(initAllLanyards, 100);
            return;
        }

        // 1. Digifox Studio Lanyard
        createLanyardInstance({
            containerId: 'lanyard-container',
            cardTexture: 'assets/card_composite.png',
            lanyardTexture: 'assets/hepl_lanyard.png'
        });

        // 2. Madras MindWorks Lanyard
        createLanyardInstance({
            containerId: 'lanyard-container-mmw',
            cardTexture: 'assets/mmw_card_composite.png',
            lanyardTexture: 'assets/mmw_lanyard.png'
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAllLanyards);
    } else {
        initAllLanyards();
    }

    window.initAllLanyards = initAllLanyards;
})();
