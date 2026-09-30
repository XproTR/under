export class NetworkClient {
  private ws: WebSocket | null = null;

  constructor() {
    console.log('[Network] Offline mod');
  }

  connect() {
    // Sunucu kurulunca doldurulacak
  }

  disconnect() {
    this.ws?.close();
  }
}
