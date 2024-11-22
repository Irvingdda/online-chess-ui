import { Injectable } from '@angular/core';
import SockJS from 'sockjs-client';
import * as Stomp from "stompjs";
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameServiceService {
  socketClient: any = null;
  ws: any = null;
  public nickname = "Test" + Math.random();
  url: string = "http://localhost:8080";
  private gameSubject = new Subject<Game>();
  private moveSubject = new Subject<Move>();
  private gameSurrenderSubject = new Subject<String>();
  constructor(private http: HttpClient) {}

  get gameData() {
    return this.gameSubject.asObservable();
  }

  get moveData() {
    return this.moveSubject.asObservable();
  }

  get resignData() {
    return this.gameSurrenderSubject.asObservable();
  }

  connect () {
    this.ws = new SockJS(this.url + "/ws")
    this.socketClient = Stomp.over(this.ws);
    this.socketClient.connect({}, () => {
      this.subscribeToUsersQueue();
    })
  }

  subscribeToUsersQueue() {
    this.socketClient.subscribe(`/user/${this.nickname}/queue/game`, (gameInfo: Game) => {
      console.log("game has started :", gameInfo);
      this.gameSubject.next(gameInfo)
    })
    this.socketClient.subscribe(`/user/${this.nickname}/queue/move`, (moveInfo: Move) => {
      console.log("move has been made :", moveInfo);
      this.moveSubject.next(moveInfo);
    });
    this.socketClient.subscribe(`/user/${this.nickname}/queue/surrender`, (userId: string) =>{
      this.gameSurrenderSubject.next(userId);
    })
  }

  unsuscribeToActualQueue() {
    this.socketClient.unsuscribe(`/user/${this.nickname}/queue/game`, () => {
      console.log( 'Unsuscribed from ', this.nickname );
    })
    this.socketClient.unsuscribe(`/user/${this.nickname}/queue/move`, () => {
      console.log( 'Unsuscribed from ', this.nickname );
    })
  }

  onConnect() {
    
  }

  play() {
    this.http.get(`${this.url}/play/${this.nickname}`).subscribe(() => {
      console.log("Waiting in queue");
    })
  }

  onGameStart(info: any) {
    console.log(info);
    
  }

  performMove(move: Move): Observable<Object> {
    return this.http.post(`${this.url}/move`, move)
  }

  get game( ): Observable<Game> {
    return this.gameSubject.asObservable();
  }

  resignGame(gameId: number) {
    this.http.get(`${this.url}/surrender/${this.nickname}/${gameId}`).subscribe(() => {
      console.log("User has resigned");
    })
  }
} import { Game, Move } from './types/types';

