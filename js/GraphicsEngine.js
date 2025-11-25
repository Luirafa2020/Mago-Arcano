import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { CONFIG } from './Config.js';

export class GraphicsEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        // Fog escuro para esconder o horizonte
        this.scene.fog = new THREE.Fog(0x050505, 5, 45);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        
        // High Performance para lidar com as luzes dinâmicas
        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(CONFIG.pixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Luzes Ambientais (Base escura)
        const amb = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(amb);
        const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 0.3);
        this.scene.add(hemi);

        this.createEnvironment();
        this.createWeapon();
        this.setupResize();
    }

    createEnvironment() {
        // Grid
        const size = 200;
        const divisions = 80;
        const gridHelper = new THREE.GridHelper(size, divisions, 0x333333, 0x111111);
        this.scene.add(gridHelper);

        // Chão (MeshStandardMaterial para reagir às luzes dos tiros)
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 200),
            new THREE.MeshStandardMaterial({ 
                color: 0x0a0a0a, 
                roughness: 0.8,
                metalness: 0.2
            })
        );
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -0.1;
        this.scene.add(plane);

        // Detalhes flutuantes no céu
        const geo = new THREE.TetrahedronGeometry(2);
        const mat = new THREE.MeshBasicMaterial({ color: 0x111111, wireframe: true });
        for(let i=0; i<30; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(
                (Math.random()-0.5)*100,
                10 + Math.random()*20,
                (Math.random()-0.5)*100
            );
            mesh.rotation.set(Math.random(), Math.random(), Math.random());
            this.scene.add(mesh);
        }
    }

    createWeapon() {
        this.weaponGroup = new THREE.Group();
        
        // Haste (Escura)
        const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.05, 1, 6),
            new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        shaft.rotation.x = Math.PI/2;
        shaft.position.z = 0.5;
        
        // Cabeça
        const head = new THREE.Mesh(
            new THREE.TorusGeometry(0.15, 0.02, 8, 20),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        head.position.z = 0;
        
        // Cristal (BasicMaterial para brilho próprio)
        this.crystal = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.08),
            new THREE.MeshBasicMaterial({ color: 0x333333, wireframe: true })
        );
        this.crystal.position.z = 0;

        // Luz do Cajado (Ilumina a área do jogador quando carregado)
        this.staffLight = new THREE.PointLight(0xffffff, 0, 8); // Inicia desligada (intensidade 0)
        this.crystal.add(this.staffLight);

        this.weaponGroup.add(shaft, head, this.crystal);
        this.weaponGroup.position.set(0.4, -0.4, -0.8);
        this.camera.add(this.weaponGroup);
        this.scene.add(this.camera);
    }

    updateCrystal(color) {
        this.crystal.material.color.setHex(color);
        this.crystal.material.wireframe = (color === CONFIG.colors.grey);
        
        // Se tem cor (magia ativa), liga a luz. Se cinza, desliga.
        if (color !== CONFIG.colors.grey) {
            this.staffLight.color.setHex(color);
            this.staffLight.intensity = 1.5;
        } else {
            this.staffLight.intensity = 0;
        }

        this.crystal.rotation.y += 0.05;
        this.crystal.rotation.z += 0.02;
    }

    setupResize() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}