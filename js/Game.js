import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { CONFIG } from './Config.js';
import Audio from './AudioEngine.js';
import { GraphicsEngine } from './GraphicsEngine.js';
import { EntityFactory } from './EntityFactory.js';
import { Player } from './Player.js';
import { InputHandler } from './InputHandler.js';

export class GameController {
    constructor() {
        this.running = false;
        this.isGameOver = false; // Estado do jogo
        
        this.particles = [];
        this.enemies = [];
        this.projectiles = [];
        
        this.engine = new GraphicsEngine();
        this.player = new Player(this.engine.camera, this.engine);
        this.input = new InputHandler(this);
        
        // UI References
        this.ui = {
            hp: document.getElementById('hp-display'),
            score: document.getElementById('score-display'),
            gameOverScreen: document.getElementById('game-over'),
            finalScore: document.getElementById('final-score'),
            runes: {
                q: document.getElementById('ui-red'),
                e: document.getElementById('ui-yellow'),
                r: document.getElementById('ui-blue')
            }
        };

        // Dificuldade
        this.initialSpawnRate = 3000;
        this.spawnRate = this.initialSpawnRate;
        this.minSpawnRate = 800;
        this.lastSpawn = 0;

        // Configura botão de Renascer
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.resetGame();
            document.body.requestPointerLock();
        });

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    updateUI(runes) {
        this.ui.runes.q.className = `rune-box red ${runes.q ? 'active' : ''}`;
        this.ui.runes.e.className = `rune-box yellow ${runes.e ? 'active' : ''}`;
        this.ui.runes.r.className = `rune-box blue ${runes.r ? 'active' : ''}`;
    }

    start() {
        if (this.isGameOver) return; // Não inicia se estiver morto
        this.running = true;
        document.getElementById('overlay').style.display = 'none';
        this.ui.gameOverScreen.style.display = 'none';
        Audio.init();
    }
    
    pause() {
        this.running = false;
        // Só mostra menu de pausa se NÃO estiver na tela de Game Over
        if (!this.isGameOver) {
            document.getElementById('overlay').style.display = 'flex';
        }
    }

    handleGameOver() {
        this.running = false;
        this.isGameOver = true;
        document.exitPointerLock(); // Solta o mouse para clicar no botão
        
        this.ui.finalScore.innerText = this.player.score;
        this.ui.gameOverScreen.style.display = 'flex';
        document.getElementById('overlay').style.display = 'none';
    }

    resetGame() {
        // 1. Limpa todas as entidades da cena e memória
        [...this.enemies, ...this.projectiles, ...this.particles].forEach(obj => {
            this.engine.scene.remove(obj);
            obj.traverse(c => {
                if(c.geometry) c.geometry.dispose();
                if(c.material) c.material.dispose();
            });
        });

        // 2. Limpa Arrays
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];

        // 3. Reseta Lógica
        this.spawnRate = this.initialSpawnRate;
        this.lastSpawn = Date.now();
        this.isGameOver = false;

        // 4. Reseta Player
        this.player.reset();
        
        // 5. Esconde UI de morte
        this.ui.gameOverScreen.style.display = 'none';
        
        // O jogo começará quando o pointer lock for confirmado (via InputHandler)
    }

    loop() {
        if (this.running) {
            const now = Date.now();
            
            this.player.move(this.input.keys);
            
            const col = this.player.getColor(this.input.runes);
            this.engine.updateCrystal(col.hex);

            // Spawner Suavizado
            if (now - this.lastSpawn > this.spawnRate) {
                this.spawnEnemy();
                this.lastSpawn = now;
                // Aumenta dificuldade devagar (tira 15ms por monstro)
                if(this.spawnRate > this.minSpawnRate) {
                    this.spawnRate -= 15; 
                }
            }

            // Inimigos
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const e = this.enemies[i];
                e.lookAt(this.player.position.x, e.position.y, this.player.position.z);
                
                const dir = new THREE.Vector3().subVectors(this.player.position, e.position).normalize();
                e.position.addScaledVector(dir, 0.04); 

                e.position.y = 1 + Math.sin((now * 0.003) + e.userData.floatOffset) * 0.2;
                if(e.children[4]) e.children[4].rotation.x += 0.05; 
                if(e.children[5]) e.children[5].rotation.x -= 0.05;

                if (e.position.distanceTo(this.player.position) < 1.0) {
                    Audio.playSound('damage');
                    // Verifica se morreu
                    const isDead = this.player.takeDamage(15);
                    this.removeEntity(e, this.enemies);
                    
                    if (isDead) {
                        this.handleGameOver();
                        break; // Para o loop
                    }
                }
            }
            
            // Se morreu dentro do loop de inimigos, para aqui para não rodar o resto
            if(!this.running && this.isGameOver) {
                this.engine.render(); 
                requestAnimationFrame(this.loop);
                return;
            }

            // Projéteis
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const p = this.projectiles[i];
                p.position.add(p.userData.velocity);
                p.rotation.x += 0.1; p.rotation.y += 0.1;

                // Animação do halo neon
                if(p.children.length > 1 && p.children[1].isMesh) {
                    p.children[1].rotation.x -= 0.2;
                    p.children[1].rotation.z -= 0.1;
                }

                let hit = false;
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const e = this.enemies[j];
                    if (p.position.distanceTo(e.position) < 1.2) {
                        if (p.userData.type === e.userData.type) {
                            Audio.playSound('hit');
                            EntityFactory.createExplosion(this.engine.scene, e.position, CONFIG.colors[e.userData.type], this.particles);
                            this.removeEntity(e, this.enemies);
                            this.player.addScore(100);
                        }
                        hit = true;
                        break; 
                    }
                }

                if (hit || p.position.distanceTo(this.player.position) > 60) {
                    this.removeEntity(p, this.projectiles);
                }
            }

            // Partículas
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.position.add(p.userData.velocity);
                p.scale.multiplyScalar(0.9);
                p.userData.life--;
                if(p.userData.life <= 0) this.removeEntity(p, this.particles);
            }
        }
        
        this.engine.render();
        requestAnimationFrame(this.loop);
    }

    spawnEnemy() {
        const types = ['red', 'yellow', 'blue', 'orange', 'purple', 'green'];
        const type = types[Math.floor(Math.random() * types.length)];
        const enemy = EntityFactory.createMonster(type);
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 10;
        enemy.position.set(
            this.player.position.x + Math.cos(angle) * dist,
            1,
            this.player.position.z + Math.sin(angle) * dist
        );
        this.engine.scene.add(enemy);
        this.enemies.push(enemy);
    }

    shoot() {
        if (!this.running) return;
        const col = this.player.getColor(this.input.runes);
        if (!col.type) return;

        Audio.playSound('shoot');

        const origin = this.engine.camera.position.clone();
        const right = new THREE.Vector3(1,0,0).applyQuaternion(this.engine.camera.quaternion);
        origin.addScaledVector(right, 0.4);
        origin.y -= 0.3;

        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.engine.camera.quaternion);
        
        const proj = EntityFactory.createProjectile(origin, dir, col);
        this.engine.scene.add(proj);
        this.projectiles.push(proj);

        this.engine.weaponGroup.position.z += 0.3;
        setTimeout(() => this.engine.weaponGroup.position.z -= 0.3, 80);
    }

    removeEntity(obj, list) {
        this.engine.scene.remove(obj);
        const idx = list.indexOf(obj);
        if (idx > -1) list.splice(idx, 1);
        obj.traverse(c => {
            if(c.geometry) c.geometry.dispose();
            if(c.material) c.material.dispose();
        });
    }
}