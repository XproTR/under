// Diğer oyuncuların pozisyon senkronu — sonra doldurulacak

export interface PlayerState {
  id: string;
  x: number;
  y: number;
  z: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
}

export class PlayerSync {
  players: Map<string, PlayerState> = new Map();

  update(state: PlayerState) {
    this.players.set(state.id, state);
  }

  remove(id: string) {
    this.players.delete(id);
  }
}
