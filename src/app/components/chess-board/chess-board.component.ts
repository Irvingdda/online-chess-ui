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
type Board = Square[][];

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
  board: Board;
  highligthedSquares: Hint[] = [];
  selectedPiece: Piece | null = null;
  turn: "white" | "black" = "white";
  boardSimulation: Board | null = null;
  simulatedPieces: {[key: string]: Piece} | null = null;

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
    let pieceOrder = "rook,knight,bishop,king,queen,bishop,knight,rook";
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
    let pieceOrder = "rook,knight,bishop,king,queen,bishop,knight,rook";
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

  getPiecePossibleMoves(piece: Piece): Position[] {
    let possibleMoves: Position[] = [];

    switch(piece.name) {
      case 'king': {
        possibleMoves = this.getKingPossibleNextMoves(piece);
        break;
      }
      case 'pawn': {
        possibleMoves = this.getPawnPossibleNextMoves(piece);
        break;
      }
      case 'bishop': {
        possibleMoves = this.getBishopPossibleNextMoves(piece);
        break;
      }
      case 'rook': {
        possibleMoves = this.getRookPossibleNextMoves(piece);
        break;
      }
      case 'queen': {
        possibleMoves = this.getQueenPossibleNextMoves(piece);
        break;
      }
      case 'knight': {
        possibleMoves = this.getKnightPossibleNextMoves(piece);
      }
    }

    return possibleMoves;
  }

  showPossibleMoves(piece: Piece) {
    if(this.selectedPiece == piece || this.turn != piece.team) return;
    this.selectedPiece = piece;
    let highligthedMoves:Position[] = this.getPiecePossibleMoves(piece);
    let i = 0;
    highligthedMoves = highligthedMoves.filter((pos: Position) => !this.movementLeadsToCheck(piece, pos));
    this.highligthedSquares = highligthedMoves.map((pos) => ({id: ++i, ...pos}));
  }

  movementLeadsToCheck(piece: Piece, pos: Position): boolean {
    let allyKingId = Object.keys(this.pieces)
      .find((pieceId) => 
        this.pieces[pieceId].name == "king" &&
        this.pieces[pieceId].team == piece.team)
    if(!allyKingId) return false;
    let allyKing = {...this.pieces[allyKingId]};
    if(piece.name == "king") {
      allyKing.column = pos.column;
      allyKing.row = pos.row;
    }
    // Setting boardSimulation with possible next move to check if this movement accordingly prevent ally check
    this.boardSimulation = [];
    this.simulatedPieces = JSON.parse(JSON.stringify(this.pieces));
    this.board.forEach(row => this.boardSimulation?.push([...row]));
    this.boardSimulation[piece.row -1][piece.column -1] = null;
    let target = this.boardSimulation[pos.row -1][pos.column -1];
    if(target != null && this.simulatedPieces) {
      delete this.simulatedPieces[target];
    }
    this.boardSimulation[pos.row -1][pos.column -1] = piece.id;

    let willKingBeUnderAttack = false;
    for(let k in this.simulatedPieces) {
      if(this.simulatedPieces[k].team != piece.team) {
        willKingBeUnderAttack = this.getPiecePossibleMoves(this.simulatedPieces[k])
          .findIndex((pos) => pos.row == allyKing.row && pos.column == allyKing.column) != -1;

        if(willKingBeUnderAttack) break;
      }
    }

    this.boardSimulation = null;
    this.simulatedPieces = null;

    return willKingBeUnderAttack;
  }
  
  moveSelectedPiece(hint: Hint) {
    if(this.selectedPiece) {
      let enemyPieceId = this.board[hint.row-1][hint.column-1];
      if(enemyPieceId)  {
        delete this.pieces[enemyPieceId];
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

      this.turn = this.turn == "black" ? "white" : "black";
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
    allMovements = this.explore(piece, 1, 1)
      .concat(this.explore(piece, -1, 1))
      .concat(this.explore(piece, 1, -1))
      .concat(this.explore(piece, -1, -1));
    return allMovements;
  }

  getRookPossibleNextMoves(piece: Piece) {
    let allMovements: Position[] = [];
    allMovements = this.explore(piece, 1, 0)
      .concat(this.explore(piece, 0, 1))
      .concat(this.explore(piece, -1, 0))
      .concat(this.explore(piece, 0, -1));
    return allMovements;
  }

  getQueenPossibleNextMoves(piece: Piece) {
    let allMovements: Position[] = [];
    allMovements = this.explore(piece, 1, 1)
      .concat(this.explore(piece, -1, 1))
      .concat(this.explore(piece, 1, -1))
      .concat(this.explore(piece, -1, -1))
      .concat(this.explore(piece, 1, 0))
      .concat(this.explore(piece, 0, 1))
      .concat(this.explore(piece, -1, 0))
      .concat(this.explore(piece, 0, -1));
    return allMovements;
  }

  getPawnPossibleNextMoves(piece: Piece): Position[] {
    let allMovements: Position[];
    if(piece.team == "white") {
      allMovements = [
        {column: piece.column, row: piece.row + 1}
      ]
      if(piece.row == 2) {
        allMovements.push({column: piece.column, row: piece.row+2});
      }
    } else {
      allMovements = [
        {column: piece.column, row: piece.row - 1}
      ]
      if(piece.row == 7) {
        allMovements.push({column: piece.column, row: piece.row-2});
      }
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

  getKnightPossibleNextMoves(piece: Piece): Position[] {
    let allMovements: Position[] = [
      {column: piece.column+2, row: piece.row+1},
      {column: piece.column+2, row: piece.row-1},
      
      {column: piece.column-2, row: piece.row+1},
      {column: piece.column-2, row: piece.row-1},

      {column: piece.column+1, row: piece.row+2},
      {column: piece.column-1, row: piece.row+2},
      
      {column: piece.column+1, row: piece.row-2},
      {column: piece.column-1, row: piece.row-2},
    ]

    return allMovements.filter(m => this.canMoveToTarget(piece, m.row, m.column));
  }

  canMoveToTarget(piece:Piece, row:number, column:number) :boolean {
    if(row > 8 || column > 8 || row < 1 || column < 1) return false;
    return !this.isTargetAlly(piece, row, column);
  }

  isTargetAlly(piece: Piece, targetRow: number, targetColumn: number): boolean {
    let board = this.boardSimulation || this.board;
    let pieces = this.simulatedPieces || this.pieces;
    
    let targetSquare = board[targetRow - 1][targetColumn - 1];;
    let targetIsAlly = false;
      
    targetIsAlly = !!targetSquare && pieces[piece.id].team == pieces[targetSquare].team;
    
    return targetIsAlly;
  }

  isTargetEnemy(piece: Piece, targetRow: number, targetColumn: number): boolean {
    let board = this.boardSimulation || this.board;
    let pieces = this.simulatedPieces || this.pieces;

    let targetSquare = board[targetRow - 1][targetColumn - 1];
    
    let targetIsEnemy = false;

    targetIsEnemy = !!targetSquare && pieces[targetSquare].team != piece.team;

    return targetIsEnemy;
  }
}
