export class Controls {
  private keys: { [key: string]: boolean } = {};

  constructor() {
    // Focus için body'ye tıklama dinle
    document.body.setAttribute('tabindex', '0');

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;

      // Ok tuşları sayfayı kaydırmasın
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = false;
    });

    // Sayfa odak kaybedince tüm tuşları bırak
    window.addEventListener('blur', () => {
      this.keys = {};
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

  // Debug için
  get activeKeys(): string[] {
    return Object.keys(this.keys).filter((k) => this.keys[k]);
  }
}
