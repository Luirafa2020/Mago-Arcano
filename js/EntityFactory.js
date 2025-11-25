import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { CONFIG } from './Config.js';

export class EntityFactory {
    static createMonster(type) {
        const group = new THREE.Group();
        const color = CONFIG.colors[type];

        // Corpo com material Phong e Emissive para brilhar no escuro
        const bodyGeo = new THREE.ConeGeometry(0.5, 1.5, 5);
        const bodyMat = new THREE.MeshPhongMaterial({ 
            color: color, 
            flatShading: true,
            emissive: color,      // O "brilho" interno
            emissiveIntensity: 0.5,
            shininess: 100
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.75;
        
        // Cabeça
        const headGeo = new THREE.SphereGeometry(0.3, 6, 6);
        const headMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.2;

        // Olhos Brilhantes (BasicMaterial ignora luz e brilha 100%)
        const eyeGeo = new THREE.SphereGeometry(0.08, 4, 4);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.15, 1.2, 0.2);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.15, 1.2, 0.2);

        // Mãos
        const handGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const leftHand = new THREE.Mesh(handGeo, bodyMat);
        leftHand.position.set(-0.6, 0.8, 0.2);
        const rightHand = new THREE.Mesh(handGeo, bodyMat);
        rightHand.position.set(0.6, 0.8, 0.2);

        group.add(body, head, leftEye, rightEye, leftHand, rightHand);
        
        group.userData = { 
            type: type, 
            hp: 1,
            floatOffset: Math.random() * 100 // Para desincronizar o balanço
        };
        
        return group;
    }

    static createProjectile(pos, dir, colorData) {
        // Núcleo do tiro (Luz pura)
        const geo = new THREE.IcosahedronGeometry(0.12, 0);
        const mat = new THREE.MeshBasicMaterial({ color: colorData.hex });
        const mesh = new THREE.Mesh(geo, mat);
        
        mesh.position.copy(pos);
        
        // 1. Luz Pontual Forte (Ilumina o chão/paredes na cor do tiro)
        // Cor, Intensidade (3.0), Distância (10m)
        const light = new THREE.PointLight(colorData.hex, 3, 10);
        mesh.add(light);

        // 2. Halo/Glow Externo (Wireframe giratório)
        const glowGeo = new THREE.IcosahedronGeometry(0.25, 0);
        const glowMat = new THREE.MeshBasicMaterial({ 
            color: colorData.hex, 
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        mesh.add(glowMesh); // glowMesh é children[1] (0 é a luz)

        mesh.userData = { velocity: dir.multiplyScalar(0.6), type: colorData.type };
        return mesh;
    }
    
    static createExplosion(scene, pos, color, particleList) {
        const particleCount = 12;
        const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        // Partículas usam BasicMaterial para parecerem faíscas neon
        const mat = new THREE.MeshBasicMaterial({ color: color });
        
        for(let i=0; i<particleCount; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);
            // Pequena variação inicial
            mesh.position.x += (Math.random()-0.5)*0.3;
            mesh.position.y += (Math.random()-0.5)*0.3;
            
            const vel = new THREE.Vector3(
                (Math.random()-0.5), 
                (Math.random()-0.5)+0.5, // Tendência a subir levemente
                (Math.random()-0.5)
            ).normalize().multiplyScalar(0.2 + Math.random() * 0.1);
            
            mesh.userData = { velocity: vel, life: 30 + Math.random() * 10 };
            scene.add(mesh);
            particleList.push(mesh);
        }
    }
}