// Multiplayer istemcisi — sunucu hazır olduğunda doldurulacak
// Şimdilik placeholder

export class NetworkClient {
  private ws: WebSocket | null = null;
  private serverUrl: string;

  constructor(serverUrl = import.meta.env.VITE_SERVER_URL || '') {
    this.serverUrl = serverUrl;
  }

  connect() {
    if (!this.serverUrl) {
      console.log('[Network] Sunucu URL yok, offline mod');
      return;
    }
    // WebSocket bağlantısı — sunucu kurulunca açılacak
  }

  disconnect() {
    this.ws?.close();
  }
}
