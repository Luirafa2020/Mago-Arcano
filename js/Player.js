import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { CONFIG } from './Config.js';

export class Player {
    constructor(camera, gameEngine) {
        this.camera = camera;
        this.gameEngine = gameEngine;
        // Posição inicial padrão
        this.startPos = new THREE.Vector3(0, 1.7, 0);
        
        // Inicializa stats chamando reset
        this.reset();
    }

    reset() {
        this.position = this.startPos.clone();
        this.camera.position.copy(this.position);
        
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(this.euler);
        
        this.hp = 100;
        this.score = 0;
        
        // Reseta UI
        const hpBar = document.getElementById('hp-display');
        const scoreDisp = document.getElementById('score-display');
        if(hpBar) hpBar.style.width = '100%';
        if(scoreDisp) scoreDisp.innerText = '0';
    }

    rotate(mx, my) {
        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= mx * CONFIG.mouseSensitivity;
        this.euler.x -= my * CONFIG.mouseSensitivity;
        this.euler.x = Math.max(-1.5, Math.min(1.5, this.euler.x));
        this.camera.quaternion.setFromEuler(this.euler);
    }

    move(keys) {
        const dir = new THREE.Vector3();
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        fwd.y = 0; fwd.normalize();
        const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        rgt.y = 0; rgt.normalize();

        if(keys.w) dir.add(fwd);
        if(keys.s) dir.sub(fwd);
        if(keys.d) dir.add(rgt);
        if(keys.a) dir.sub(rgt);

        if(dir.length() > 0) dir.normalize();
        this.position.addScaledVector(dir, CONFIG.playerSpeed);
        
        // Limites do mapa
        this.position.x = Math.max(-95, Math.min(95, this.position.x));
        this.position.z = Math.max(-95, Math.min(95, this.position.z));
        
        this.camera.position.copy(this.position);

        // Weapon Bobbing (Balanço da arma)
        if(dir.length() > 0) {
            const time = Date.now() * 0.015;
            this.gameEngine.weaponGroup.position.y = -0.4 + Math.sin(time)*0.03;
            this.gameEngine.weaponGroup.position.x = 0.4 + Math.cos(time*0.5)*0.02;
        }
    }

    getColor(runes) {
        const { q, e, r } = runes;
        if (q && !e && !r) return { hex: CONFIG.colors.red, type: 'red' };
        if (!q && e && !r) return { hex: CONFIG.colors.yellow, type: 'yellow' };
        if (!q && !e && r) return { hex: CONFIG.colors.blue, type: 'blue' };
        if (q && e && !r) return { hex: CONFIG.colors.orange, type: 'orange' };
        if (q && !e && r) return { hex: CONFIG.colors.purple, type: 'purple' };
        if (!q && e && r) return { hex: CONFIG.colors.green, type: 'green' };
        return { hex: CONFIG.colors.grey, type: null };
    }

    takeDamage(amt) {
        this.hp -= amt;
        const hpPercent = Math.max(0, this.hp);
        document.getElementById('hp-display').style.width = hpPercent + '%';
        
        // Flash Vermelho na tela
        const flash = document.createElement('div');
        flash.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(255,0,0,0.3);pointer-events:none;z-index:9;";
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 100);

        // Retorna TRUE se morreu
        return this.hp <= 0;
    }

    addScore(amt) {
        this.score += amt;
        document.getElementById('score-display').innerText = this.score;
    }
}