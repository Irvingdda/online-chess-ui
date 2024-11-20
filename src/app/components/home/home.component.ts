import { Component } from '@angular/core';
import { ChessBoardComponent } from '../chess-board/chess-board.component';
import { GameServiceService } from '../../game-service.service';
import { Game, Move } from '../../types/types';
import { MatchmakingComponent } from '../matchmaking/matchmaking.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatchmakingComponent, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  game: null | Game = null;
  nicknameForm = new FormControl("");
  nicknameSet: boolean = false;
  nicknameHasBeenSet = false;

  constructor(private gameService: GameServiceService) {
    this.nicknameForm.setValue(gameService.nickname);
  }

  connect() {
    if(this.nicknameForm.value && this.nicknameForm.value != "") {
      this.nicknameHasBeenSet = true;
      this.gameService.nickname = this.nicknameForm.value;
      this.gameService.connect();
    }
  }

}
