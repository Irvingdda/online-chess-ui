import { KeyValuePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GameServiceService } from '../../game-service.service';
import { Board, Game, Hint, Move, Piece, Position, Sound } from '../../types/types';
import { hintToMove, moveToHint } from '../../types/utils';


@Component({
  selector: 'app-chess-board',
  standalone: true,
  imports: [KeyValuePipe],
  templateUrl: './chess-board.component.html',
  styleUrl: './chess-board.component.css'
})
export class ChessBoardComponent {
  defProps = {
    isCastle: false, 
    isCastleReverse: false, 
    isSpecial: false, 
    enPassant: false
  }
  onCheck: null | 'white' | 'black' = null;
  counter = 0;
  pieces: {[key: string]: Piece};
  board: Board;
  highligthedSquares: Hint[] = [];
  selectedPiece: Piece | null = null;
  turn: "white" | "black" = "white";
  boardSimulation: Board | null = null;
  simulatedPieces: {[key: string]: Piece} | null = null;
  runningPawn: null | Piece = null;
  enPassantTake = false;
  nextSoundToBeEmmited: Sound = 'move';

  @Input() playerColor: string = "";
  @Input() game: Game = {id:0, whiteId: "", blackId: ""};
  @Output() onGameOver: EventEmitter<Game> = new EventEmitter<Game>();

  constructor(private gameService: GameServiceService) {

    this.gameService.moveData.subscribe((moveInfo: any) => {
      console.log("move info", moveInfo);
      
      let move = JSON.parse(moveInfo.body);
      this.selectedPiece = this.pieces[move.pieceId];
      this.moveSelectedPiece(moveToHint(move));
    })

    this.pieces = {};

    this.buildWhitePieces()
      .concat(this.buildBlackPieces())
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
    this.calculateAllPossibleNextMoves();
  }

  switchTurn() {
    this.turn = this.turn == "white" ? "black" : "white";
  }

  placePiecesOnBoard() {
    for(let pieceId of Object.keys(this.pieces)) {
      let piece = this.pieces[pieceId];
      this.board[piece.row - 1][piece.column - 1] = piece.id;
    }
  }

  buildWhitePieces(): Piece[] {
    let pieceOrder = "rook,knight,bishop,queen,king,bishop,knight,rook";
    let countColumn = 0;
    let pawns: Piece[] = [];

    for(let i = 0; i < 8; i++) {
      pawns.push({
        ...this.defProps,
        id: ++this.counter,
        row: 2,
        column: i+1,
        name: "pawn",
        team: "white",
        nextMoves: [],
      })
    }

    let whitePieces: Piece[] = pieceOrder.split(",").map((pieceName: string)=> ({
      ...this.defProps,
      id: ++this.counter,
      row: 1,
      column: ++countColumn,
      name: pieceName,
      team: "white",
      nextMoves: [],
    }));

    return whitePieces.concat(pawns);
  }

  buildBlackPieces(): Piece[] {
    let pieceOrder = "rook,knight,bishop,queen,king,bishop,knight,rook";
    let columnCount = 8;
    let pawns: Piece[] = [];

    for(let i = 0; i < 8; i++) {
      pawns.push({
        ...this.defProps,
        id: ++this.counter,
        row: 7,
        column: i+1,
        name: "pawn",
        team: "black",
        nextMoves: [],
      })
    }

    let blackPieces: Piece[] = pieceOrder.split(",")
      .map((pieceName: string)=> ({
        ...this.defProps,
        id: ++this.counter,
        row: 8,
        column: columnCount--,
        name: pieceName,
        team: "black",
        nextMoves: [],
      }));

    return blackPieces.concat(pawns);
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
    if (this.playerColor != "" && this.playerColor != piece.team) return;

    this.selectedPiece = piece;
    //let highligthedMoves:Position[] = this.getPiecePossibleMoves(piece);
    //highligthedMoves = highligthedMoves.filter((pos: Position) => !this.movementLeadsToCheck(piece, pos));
    let i = 0;
    this.highligthedSquares = piece.nextMoves.map((pos) => ({id: ++i, ...pos, pieceId: piece.id}));
  }

  calculateAllPossibleNextMoves() {
    let movementCount = 0;
    let playerInTurnPieces = Object.keys(this.pieces).filter(k => this.pieces[k].team == this.turn);
    let isKingInCheck = this.isKingInCheck();
    playerInTurnPieces.forEach(key => {
      let piece = this.pieces[key];
      let nextMoves = this.getPiecePossibleMoves(piece);
      piece.nextMoves = nextMoves.filter((pos: Position) => !this.movementLeadsToCheck(piece, pos));
      movementCount += piece.nextMoves.length;
    });
    if(isKingInCheck) {
      this.nextSoundToBeEmmited = "check";
    }
    if(movementCount == 0) {
      if(isKingInCheck) {
        alert(this.turn + " has lost the game");
      } else {
        alert("Stalemate")
      }
    }
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

    let willKingBeUnderAttack = this.isSquareUnderAttack(allyKing.row, allyKing.column);
    /* for(let k in this.simulatedPieces) {
      if(this.simulatedPieces[k].team != piece.team) {
        willKingBeUnderAttack = this.getPiecePossibleMoves(this.simulatedPieces[k])
          .findIndex((pos) => pos.row == allyKing.row && pos.column == allyKing.column) != -1;

        if(willKingBeUnderAttack) break;
      }
    } */

    this.boardSimulation = null;
    this.simulatedPieces = null;

    return willKingBeUnderAttack;
  }

  isSquareUnderAttack(row: number, column: number) {
    let team = this.turn;
    let isSquareUnderAttack = false;
    let pieces = this.simulatedPieces || this.pieces;
    let board = this.boardSimulation || this.board;
    let enemies = [];

    let horseJumps = [
      {column: column+2, row: row+1},
      {column: column+2, row: row-1},
      
      {column: column-2, row: row+1},
      {column: column-2, row: row-1},

      {column: column+1, row: row+2},
      {column: column-1, row: row+2},
      
      {column: column+1, row: row-2},
      {column: column-1, row: row-2},
    ]

    enemies.push(this.searchEnemy(team, row, column, 1, 1))
    enemies.push(this.searchEnemy(team, row, column, -1, 1))
    enemies.push(this.searchEnemy(team, row, column, 1, -1))
    enemies.push(this.searchEnemy(team, row, column, -1, -1))
    enemies.push(this.searchEnemy(team, row, column, 1, 0))
    enemies.push(this.searchEnemy(team, row, column, 0, 1))
    enemies.push(this.searchEnemy(team, row, column, -1, 0))
    enemies.push(this.searchEnemy(team, row, column, 0, -1))

    for(let jump of horseJumps) {
      if(jump.column <= 8 && jump.column >= 1 && jump.row <= 8 && jump.row >= 1) {
        let pieceId = board[jump.row-1][jump.column-1];
        if(pieceId) {
          let piece = pieces[pieceId];
          if(piece && piece.team != team && piece.name == "knight") {
            enemies.push(piece);
          }
        }
      }
    }

    enemies = enemies.filter(e => e != null);

    for(let enemy of enemies) {
      isSquareUnderAttack = enemy != null && !!this.getPiecePossibleMoves(enemy)
        .find((pos) => pos.row == row && pos.column == column);
      
      if(isSquareUnderAttack) break;
    }

    return isSquareUnderAttack;
  }

  isKingInCheck() {

    let kingInTurnId = Object.keys(this.pieces)
      .find((pieceId) => 
        this.pieces[pieceId].name == "king" &&
        this.pieces[pieceId].team == this.turn)

    if(!kingInTurnId) return false;

    let king = this.pieces[kingInTurnId];

    return this.isSquareUnderAttack(king.row, king.column);
  }

  move(hint: Hint) {
    console.log("making move");
    
    if(this.playerColor != "") {
      this.gameService.performMove(hintToMove(hint, this.game.id, this.gameService.nickname)).subscribe((moveInfo: any) => {
        console.log("made move");
        
      });
    }
    this.moveSelectedPiece(hint);
  }
  
  moveSelectedPiece(hint: Hint) {
    if(this.selectedPiece) {
      this.nextSoundToBeEmmited = "move";
      let enemyPieceId = this.board[hint.row-1][hint.column-1];
      if(enemyPieceId)  {
        this.nextSoundToBeEmmited = "capture";
        delete this.pieces[enemyPieceId];
      }

      this.board[this.selectedPiece.row-1][this.selectedPiece.column-1] = null;
      let newPiece = {
        ...this.selectedPiece,
        hasMove: true,
        row: hint.row,
        column: hint.column,
      }
      this.pieces[this.selectedPiece.id] = newPiece;
      this.board[newPiece.row-1][newPiece.column-1] = newPiece.id;

      this.performSpecialMoves(hint, newPiece);

      this.selectedPiece = null;
      this.highligthedSquares = [];

      this.switchTurn();
      this.calculateAllPossibleNextMoves();
      this.performSoundEffect();
    }
  }

  performSoundEffect() {
    new Audio(`../../../assets/${this.nextSoundToBeEmmited}.mp3`).play();
  }

  performSpecialMoves(hint: Position, newPiece: Piece) {
    if(hint.enPassant && this.runningPawn) {
      this.board[this.runningPawn.row-1][this.runningPawn.column-1] = null;
      delete this.pieces[this.runningPawn.id];
      this.nextSoundToBeEmmited = "capture";
    }

    //If a pawn makes a double jump mark it to allow it to be taken en passant
    if(hint.isSpecial && newPiece.name == "pawn") {
      this.runningPawn = newPiece;
    } else {
      this.runningPawn = null;
    }

    //Move rook on castle
    /* if(hint.isCastle) {
      let rook = this.board[7][hint.column-1];
      this.board[7][hint.column-1] = null;
      this.board[hint.row-1][hint.column-1] = rook;
      rook && (this.pieces[rook].hasMove = true);
      this.nextSoundToBeEmmited = "castle";
    } */

    //Move rook on castle to the other side
    if(hint.isCastleReverse) {
      let rook = this.board[hint.row-1][0];
      this.board[hint.row-1][0] = null;
      this.board[hint.row-1][hint.column] = rook;
      if(rook) {
        this.pieces[rook].hasMove = true;
        this.pieces[rook].column = hint.column+1;
      }
      this.nextSoundToBeEmmited = "castle";
    }

    //Move rook on castle
    if(hint.isCastle) {
      let rook = this.board[hint.row-1][7];
      this.board[hint.row-1][7] = null;
      this.board[hint.row-1][hint.column-2] = rook;
      if(rook) {
        this.pieces[rook].hasMove = true;
        this.pieces[rook].column = hint.column-1;
      }
      this.nextSoundToBeEmmited = "castle";
    }

    if(newPiece.name == "pawn") {
      if((newPiece.team == "white" && newPiece.row == 8) || (newPiece.team == "black" && newPiece.row == 1)) {
        newPiece.name = "queen";
        this.nextSoundToBeEmmited = "promote";
      }
    }
  }

  explore(piece: Piece, rowStep: number, columnStep: number): Position[] {
    let movementsAllowed = [];
    let actualRow = piece.row + rowStep;
    let actualColumn = piece.column + columnStep;
    //Move to an empty square indefinetelly in one direction or stop at an enemy piece
    while( this.canMoveToTarget(piece.team, actualRow, actualColumn) ) {
      movementsAllowed.push({
        ...this.defProps,
        row: actualRow, 
        column: actualColumn,
      });
      if(this.isTargetEnemy(piece.team,actualRow, actualColumn)) break;
      actualRow = actualRow + rowStep;
      actualColumn = actualColumn + columnStep;
    }

    return movementsAllowed;
  }

  searchEnemy(team: string, startRow: number, startColumn: number, rowStep: number, columnStep: number): Piece | null {
    let enemy = null;
    let actualRow = startRow + rowStep;
    let actualColumn = startColumn + columnStep;
    let pieces = this.simulatedPieces || this.pieces;
    let board = this.boardSimulation || this.board;
    //Move to an empty square indefinetelly in one direction or stop at an enemy piece
    while( this.canMoveToTarget(team, actualRow, actualColumn) ) {
      if(this.isTargetEnemy(team,actualRow, actualColumn)) {
        let enemyId = board[actualRow-1][actualColumn-1];
        if (enemyId) enemy = pieces[enemyId];
        break;
      }
      actualRow = actualRow + rowStep;
      actualColumn = actualColumn + columnStep;
    }

    return enemy;
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
        {...this.defProps, column: piece.column, row: piece.row + 1}
      ]
      if(piece.row == 2) {
        allMovements.push({...this.defProps, column: piece.column, row: piece.row+2, isSpecial: true});
      }
      if(this.isTargetEnemy(piece.team, piece.row + 1, piece.column+1)) {
        allMovements.push({...this.defProps, column: piece.column+1, row: piece.row+1});
      }
      if(this.isTargetEnemy(piece.team, piece.row + 1, piece.column-1)) {
        allMovements.push({...this.defProps, column: piece.column-1, row: piece.row+1});
      }
      if(this.runningPawn && this.runningPawn.row == piece.row && this.runningPawn.column == piece.column + 1) {
        allMovements.push({...this.defProps, column: piece.column+1, row: piece.row+1, enPassant: true});
      }
      if(this.runningPawn && this.runningPawn.row == piece.row && this.runningPawn.column == piece.column - 1) {
        allMovements.push({...this.defProps, column: piece.column-1, row: piece.row+1, enPassant: true});
      }
    } else {

      allMovements = [
        {...this.defProps, column: piece.column, row: piece.row - 1}
      ]
      if(piece.row == 7) {
        allMovements.push({...this.defProps, column: piece.column, row: piece.row-2, isSpecial: true});
      }
      if(this.isTargetEnemy(piece.team, piece.row - 1, piece.column+1)) {
        allMovements.push({...this.defProps, column: piece.column+1, row: piece.row-1});
      }
      if(this.isTargetEnemy(piece.team, piece.row - 1, piece.column-1)) {
        allMovements.push({...this.defProps, column: piece.column-1, row: piece.row-1});
      }
      if(this.runningPawn && this.runningPawn.row == piece.row && this.runningPawn.column == piece.column + 1) {
        allMovements.push({...this.defProps, column: piece.column+1, row: piece.row-1, enPassant: true});
      }
      if(this.runningPawn && this.runningPawn.row == piece.row && this.runningPawn.column == piece.column - 1) {
        allMovements.push({...this.defProps, column: piece.column-1, row: piece.row-1, enPassant: true});
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
    let allMovements: Position[] = [
      {...this.defProps, column: piece.column+1, row: piece.row +1},
      {...this.defProps, column: piece.column+1, row: piece.row -1},
      {...this.defProps, column: piece.column+1, row: piece.row},
      {...this.defProps, column: piece.column, row: piece.row -1},
      {...this.defProps, column: piece.column, row: piece.row +1},
      {...this.defProps, column: piece.column-1, row: piece.row +1},
      {...this.defProps, column: piece.column-1, row: piece.row -1},
      {...this.defProps, column: piece.column-1, row: piece.row},
    ]

    if(!piece.hasMove) {
      if(this.isKingAbleToCastle(piece)) {
        allMovements.push({...this.defProps,column: piece.column+2, row: piece.row, isCastle: true});
      }

      if(this.isKingAbleToCastleToTheOtherSide(piece)) {
        allMovements.push({...this.defProps,column: piece.column-2, row: piece.row, isCastleReverse: true});
      }
    }

    return allMovements.filter((movement) => this.canMoveToTarget(piece.team, movement.row, movement.column));
  }

  isKingAbleToCastle(king: Piece) {
    let board = this.boardSimulation || this.board;
    let pieces = this.simulatedPieces || this.pieces;

    let squaresAreEmpty = true;
    let squaresAlongKingMovementAreSafe = true;

    //Rook should be there and unmoved
    let rookOriginalPlace = board[king.row-1][7];
    let isRookInPlace = rookOriginalPlace && !pieces[rookOriginalPlace].hasMove;

    if(!isRookInPlace) return false;
    //All squares between king and rook should be empty
    for(let i = king.column+1; i<7; i++) {
      if(board[king.row-1][i-1] != null) {
        squaresAreEmpty = false;
        break;
      }
    }
    
    if(squaresAreEmpty) {
      squaresAlongKingMovementAreSafe = !this.isSquareUnderAttack(king.row, king.column+1) 
      squaresAlongKingMovementAreSafe = squaresAlongKingMovementAreSafe && !this.isSquareUnderAttack(king.row, king.column+2);
    }

    return isRookInPlace && squaresAreEmpty && squaresAlongKingMovementAreSafe;
  }

  isKingAbleToCastleToTheOtherSide(king: Piece) {
    let board = this.boardSimulation || this.board;
    let pieces = this.simulatedPieces || this.pieces;

    let squaresAreEmpty = true;
    let squaresAlongKingMovementAreSafe = true;

    //Rook should be there and unmoved
    let rookOriginalPlace = board[king.row-1][0];
    let isRookInPlace = rookOriginalPlace && !pieces[rookOriginalPlace].hasMove;

    if(!isRookInPlace) return false;
    //All squares between king and rook should be empty
    for(let i = king.column-1; i>1; i--) {
      if(board[king.row-1][i-1] != null) {
        squaresAreEmpty = false;
        break;
      }
    }
    
    if(squaresAreEmpty) {
      squaresAlongKingMovementAreSafe = !this.isSquareUnderAttack(king.row, king.column-1) && !this.isSquareUnderAttack(king.row, king.column-2);
    }

    return isRookInPlace && squaresAreEmpty && squaresAlongKingMovementAreSafe;
  }

  getKnightPossibleNextMoves(piece: Piece): Position[] {
    let allMovements: Position[] = [
      {...this.defProps,column: piece.column+2, row: piece.row+1},
      {...this.defProps,column: piece.column+2, row: piece.row-1},
      
      {...this.defProps,column: piece.column-2, row: piece.row+1},
      {...this.defProps,column: piece.column-2, row: piece.row-1},

      {...this.defProps,column: piece.column+1, row: piece.row+2},
      {...this.defProps,column: piece.column-1, row: piece.row+2},
      
      {...this.defProps,column: piece.column+1, row: piece.row-2},
      {...this.defProps,column: piece.column-1, row: piece.row-2},
    ]

    return allMovements.filter(m => this.canMoveToTarget(piece.team, m.row, m.column));
  }

  canMoveToTarget(team:string, row:number, column:number) :boolean {
    if(row > 8 || column > 8 || row < 1 || column < 1) return false;
    return !this.isTargetAlly(team, row, column);
  }

  isTargetAlly(team: string, targetRow: number, targetColumn: number): boolean {
    let board = this.boardSimulation || this.board;
    let pieces = this.simulatedPieces || this.pieces;
    
    let targetSquare = board[targetRow - 1][targetColumn - 1];;
    let targetIsAlly = false;
      
    targetIsAlly = !!targetSquare && team == pieces[targetSquare].team;
    
    return targetIsAlly;
  }

  isTargetEnemy(team: string, targetRow: number, targetColumn: number): boolean {
    let board = this.boardSimulation || this.board;
    let pieces = this.simulatedPieces || this.pieces;

    let targetSquare = board[targetRow - 1][targetColumn - 1];
    
    let targetIsEnemy = false;

    targetIsEnemy = !!targetSquare && pieces[targetSquare].team != team;

    return targetIsEnemy;
  }
}
