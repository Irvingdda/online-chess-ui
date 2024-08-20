import { KeyValuePipe } from '@angular/common';
import { Component } from '@angular/core';
type PieceName = "pawn" | "king" | "queen" | "rook" | "bishop" | "knight";
type Team = "black" | "white";

type Position = { 
  column: number;
  row: number;
}
type Piece = {
  id: number;
  name: string | PieceName;
  team: string | Team;
} & Position

type Square = number | null;
type Hint = {
  id: number;
} & Position

@Component({
  selector: 'app-chess-board',
  standalone: true,
  imports: [KeyValuePipe],
  templateUrl: './chess-board.component.html',
  styleUrl: './chess-board.component.css'
})
export class ChessBoardComponent {
  counter = 0;
  pieces: {[key: string]: Piece};
  board: Square[][];
  highligthedSquares: Hint[] = [];
  selectedPiece: Piece | null = null;
  constructor() {
    this.pieces = {};
    this.getWhitePieces()
      .concat(this.getBlackPieces())
      .forEach(piece => {
        this.pieces[piece.id] = piece;
      })
    this.board =[
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
      [null,null,null,null,null,null,null,null],
    ];
    this.placePiecesOnBoard();
  }

  placePiecesOnBoard() {
    for(let pieceId of Object.keys(this.pieces)) {
      let piece = this.pieces[pieceId];
      this.board[piece.row - 1][piece.column - 1] = piece.id;
    }
  }

  getWhitePieces(): Piece[] {
    let pieceOrder = "rook,knight,bishop,queen,king,bishop,knight,rook";
    let countColumn = 0;
    let pawns: Piece[] = [];

    for(let i = 0; i < 8; i++) {
      pawns.push({
        id: ++this.counter,
        row: 2,
        column: i+1,
        name: "pawn",
        team: "white",
      })
    }

    let whitePieces: Piece[] = pieceOrder.split(",").map((pieceName: string)=> ({
      id: ++this.counter,
      row: 1,
      column: ++countColumn,
      name: pieceName,
      team: "white",
    })).concat(pawns);
    return whitePieces;
  }
  getBlackPieces(): Piece[] {
    let pieceOrder = "rook,knight,bishop,queen,king,bishop,knight,rook";
    let columnCount = 8;
    let pawns: Piece[] = [];

    for(let i = 0; i < 8; i++) {
      pawns.push({
        id: ++this.counter,
        row: 7,
        column: i+1,
        name: "pawn",
        team: "black",
      })
    }

    let blackPieces: Piece[] = pieceOrder.split(",")
      .map((pieceName: string)=> ({
        id: ++this.counter,
        row: 8,
        column: columnCount--,
        name: pieceName,
        team: "black",
      }))
      .concat(pawns);

    return blackPieces;
  }

  buildPieceClass(piece:Piece):string {
    let classes = `column-${piece.column} row-${piece.row} ${piece.team}-${piece.name}`;
    return classes;
  }

  buildHintClass(hint: Hint): string {
    let classes = `column-${hint.column} row-${hint.row} hint`;
    return classes;
  }

  showPossibleMoves(piece: Piece) {
    if(this.selectedPiece == piece) return;
    this.selectedPiece = piece;
    let highligthedMoves:Position[] = [];
    switch(piece.name) {
      case 'king': {
        highligthedMoves = this.getKingPossibleNextMoves(piece);
        break;
      }
      case 'pawn': {
        highligthedMoves = this.getPawnPossibleNextMoves(piece);
        break;
      }
      case 'bishop': {
        highligthedMoves = this.getBishopPossibleNextMoves(piece);
        break;
      }
      case 'rook': {
        highligthedMoves = this.getRookPossibleNextMoves(piece);
        break;
      }
      case 'queen': {
        highligthedMoves = this.getQueenPossibleNextMoves(piece);
        break;
      }
    }
    let i = 0;
    this.highligthedSquares = highligthedMoves.map((pos) => ({id: ++i, ...pos}));
  }

  moveSelectedPiece(hint: Hint) {
    if(this.selectedPiece) {
      let enemyPieceId = this.board[hint.row-1][hint.column-1];
      if(enemyPieceId)  {
        delete this.pieces[enemyPieceId];
        this.board[hint.row-1][hint.column-1] = null;
      }
      this.board[this.selectedPiece.row-1][this.selectedPiece.column-1] = null;
      let newPiece = {
        ...this.selectedPiece,
        row: hint.row,
        column: hint.column,
      }
      this.pieces[this.selectedPiece.id] = newPiece;
      this.board[newPiece.row-1][newPiece.column-1] = newPiece.id;
      this.selectedPiece = null;
      this.highligthedSquares = [];
    }
  }

  explore(piece: Piece, rowStep: number, columnStep: number): Position[] {
    let movementsAllowed = [];
    let actualRow = piece.row + rowStep;
    let actualColumn = piece.column + columnStep;
    //Move to an empty square indefinetelly in one direction or stop at an enemy piece
    while( this.canMoveToTarget(piece, actualRow, actualColumn) ) {
      movementsAllowed.push({row: actualRow, column: actualColumn});
      if(this.isTargetEnemy(piece,actualRow, actualColumn)) break;
      actualRow = actualRow + rowStep;
      actualColumn = actualColumn + columnStep;
    }
    
    return movementsAllowed;
  }

  getBishopPossibleNextMoves(piece: Piece) {
    let allMovements: any[] = [];
    allMovements = allMovements
      .concat(this.explore(piece, 1, 1))
      .concat(this.explore(piece, -1, 1))
      .concat(this.explore(piece, 1, -1))
      .concat(this.explore(piece, -1, -1));
    return allMovements;
  }

  getRookPossibleNextMoves(piece: Piece) {
    let allMovements: Position[] = [];
    allMovements = allMovements
      .concat(this.explore(piece, 1, 0))
      .concat(this.explore(piece, 0, 1))
      .concat(this.explore(piece, -1, 0))
      .concat(this.explore(piece, 0, -1));
    return allMovements;
  }

  getQueenPossibleNextMoves(piece: Piece) {
    let allMovements: Position[] = [];
    allMovements = allMovements
      .concat(this.explore(piece, 1, 1))
      .concat(this.explore(piece, -1, 1))
      .concat(this.explore(piece, 1, -1))
      .concat(this.explore(piece, -1, -1))
      .concat(this.explore(piece, 1, 0))
      .concat(this.explore(piece, 0, 1))
      .concat(this.explore(piece, -1, 0))
      .concat(this.explore(piece, 0, -1));
    return allMovements;
  }

  getPawnPossibleNextMoves(piece: Piece) {
    let allMovements = [
      {column: piece.column, row: piece.row+1}
    ];
    if(piece.row == 2) {
      allMovements.push({column: piece.column, row: piece.row+2});
    }

    return allMovements;
  }

  /**
   * Get possible next moves of king piece
   * @param piece Piece{id, row, column, name, team}
   * @returns Position[] where first index represents columns and second index represents rows
   */
  getKingPossibleNextMoves(piece: Piece): Position[] {
    let allMovements = [
      {column: piece.column+1, row: piece.row +1},
      {column: piece.column+1, row: piece.row -1},
      {column: piece.column+1, row: piece.row},
      {column: piece.column, row: piece.row -1},
      {column: piece.column, row: piece.row +1},
      {column: piece.column-1, row: piece.row +1},
      {column: piece.column-1, row: piece.row -1},
      {column: piece.column-1, row: piece.row},
    ]

    return allMovements.filter((movement) => this.canMoveToTarget(piece, movement.row, movement.column));
  }

  canMoveToTarget(piece:Piece, targetRow:number, targetColumn:number) :boolean {
    if(targetRow > 8 || targetColumn > 8 || targetRow < 1 || targetColumn < 1) return false;
    return !this.isTargetAlly(piece, targetRow, targetColumn);
  }

  isTargetAlly(piece: Piece, targetRow: number, targetColumn: number): boolean {
    
    let targetSquare = this.board[targetRow - 1][targetColumn - 1];
    let targetIsAlly = false;
    
    targetIsAlly = !!targetSquare && this.pieces[piece.id].team == this.pieces[targetSquare].team;

    return targetIsAlly;
  }

  isTargetEnemy(piece: Piece, targetRow: number, targetColumn: number): boolean {
    let targetSquare = this.board[targetRow - 1][targetColumn - 1];
    let targetIsEnemy = false;

    if(targetSquare) {
      targetIsEnemy = this.pieces[targetSquare].team != piece.team;
    }

    return targetIsEnemy;
  }
}
