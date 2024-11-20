import { Hint, Move } from "./types";

export function moveToHint(move: Move): Hint {
    return {
        ...move,
        id: move.id,
        row: move.rowNum,
        column: move.colNum,
        pieceId: move.pieceId,
    }
}

export function hintToMove(hint: Hint, gameId: number, playerId: string): Move {
    return {
        ...hint,
        gameId,
        playerId,
        rowNum: hint.row,
        colNum: hint.column,
    }
}