import { Component } from '@angular/core';
import { ChessBoardComponent } from '../chess-board/chess-board.component';
import { GameServiceService } from '../../game-service.service';
import { Game } from '../../types/types';

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [ChessBoardComponent],
  templateUrl: './matchmaking.component.html',
  styleUrl: './matchmaking.component.css'
})
export class MatchmakingComponent {
  game: null | Game = null;
  nickname: string = '';
  
  constructor(private gameService: GameServiceService) {
    this.nickname = gameService.nickname;
    this.gameService.gameData.subscribe((gameInfo: any) => {
      console.log('game data', gameInfo);
      
      this.game = JSON.parse(gameInfo.body);
    });
    this.gameService.resignData.subscribe((userId: any) => {
      alert(userId + 'has resigned. You won!')
      this.gameOver();
    })
  }

  play() {
    this.gameService.play();
  }

  resign() {
    if(this.game) {
      this.gameService.resignGame(this.game.id);
    }
    this.gameOver();
  }

  gameOver() {
    this.game = null;
  }
}
