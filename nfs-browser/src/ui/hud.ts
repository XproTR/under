export class HUD {
  private speedEl: HTMLElement;

  constructor() {
    this.speedEl = document.querySelector('#speed')!;
  }

  update(speed: number) {
    this.speedEl.textContent = `${Math.round(speed)} km/h`;
  }
}
