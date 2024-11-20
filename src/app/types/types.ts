export type Game = {
    id: number,
    whiteId: String,
    blackId: String,
}

export type Move = {
    id: number,
    gameId: number,
    pieceId: number,
    colNum: number,
    rowNum: number,
    playerId: string,
    isSpecial: boolean;
    enPassant: boolean;
    isCastle: boolean;
    isCastleReverse: boolean;
}

export type PieceName = "pawn" | "king" | "queen" | "rook" | "bishop" | "knight";
export type Team = "black" | "white";

export type Position = { 
    column: number;
    row: number;
    isSpecial: boolean;
    enPassant: boolean;
    isCastle: boolean;
    isCastleReverse: boolean;
}
export type Piece = {
    hasMove?: boolean;
    id: number;
    name: string | PieceName;
    team: string | Team;
    nextMoves: Position[];
} & Position

export type Square = number | null;
export type Board = Square[][];

export type Hint = {
    pieceId: number;
    id: number;
} & Position