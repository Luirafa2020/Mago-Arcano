export class InputHandler {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.keys = {};
        this.runes = { q: false, e: false, r: false };
        
        window.addEventListener('keydown', e => {
            this.keys[e.key.toLowerCase()] = true;
            if(!this.game.running) return;
            
            const k = e.key.toLowerCase();
            if(k === 'q' || k === 'e' || k === 'r') {
                this.runes[k] = !this.runes[k];
                this.game.updateUI(this.runes);
            }
        });
        
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);
        
        document.addEventListener('mousedown', () => {
            if(document.pointerLockElement === document.body) this.game.shoot();
        });

        const btn = document.getElementById('start-btn');
        btn.addEventListener('click', () => {
            document.body.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === document.body) this.game.start();
            else this.game.pause();
        });
        
        document.addEventListener('mousemove', e => {
            if (this.game.running) {
                this.game.player.rotate(e.movementX, e.movementY);
            }
        });
    }
}