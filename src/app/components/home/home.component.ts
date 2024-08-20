import { Component } from '@angular/core';
import { ChessBoardComponent } from '../chess-board/chess-board.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ChessBoardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
