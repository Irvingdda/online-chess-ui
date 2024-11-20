import { Component } from '@angular/core';
import { ChessBoardComponent } from '../chess-board/chess-board.component';

@Component({
  selector: 'app-solo',
  standalone: true,
  imports: [ChessBoardComponent],
  templateUrl: './solo.component.html',
  styleUrl: './solo.component.css'
})
export class SoloComponent {

}
