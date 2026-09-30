export class Controls {
  private keys: { [key: string]: boolean } = {};

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  get throttle(): number {
    if (this.keys['w'] || this.keys['arrowup']) return 1;
    if (this.keys['s'] || this.keys['arrowdown']) return -1;
    return 0;
  }

  get steer(): number {
    if (this.keys['a'] || this.keys['arrowleft']) return 1;
    if (this.keys['d'] || this.keys['arrowright']) return -1;
    return 0;
  }

  get brake(): number {
    if (this.keys[' ']) return 1;
    return 0;
  }
}
