import { Chess, Color, Square, PieceSymbol } from 'chess.js';
import { useState, useMemo } from 'react';
import { DndContext } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';

import DroppableChessCanvasBg from './DroppableChessCanvasBg';
import { useChessPieceAnimations } from './ChessBoardPieces/AnimatedPieces';
import AnimatedPieces from './ChessBoardPieces/AnimatedPieces';
import DraggablePieces, { useChessDragHandlers } from './ChessBoardPieces/DraggablePieces';

export const chessTypeSquares = [
    "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8",
    "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8",
    "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8",
    "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8",
    "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8",
    "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8",
    "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8",
    "h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8"
];

export interface Piece {
    piece: PieceSymbol;
    color: Color;
}

interface ChessBoardProps {
    pieces: Record<Square, Piece>;
    pxSize: number;
    colorPerspective: Color;
    moveFunctionForDragging?: (from: Square, to: Square) => void;
    showAvailableMovesForSquare?: (square: Square) => Square[];
    showPreviousMove?: () => { from: Square, to: Square } | null;
}

export const getMovesForSquare = (game: Chess, square: Square): Square[] => {
    const moves = game.moves({ square: square, verbose: true });
    return moves.map(m => m.to);
}

// This function can be surpringly quite expensive for large PGNs,
// it's ok to call it on small puzzles but for full chess games
// consider storing the last move separately
export const getPreviousMove = (game: Chess): { from: Square; to: Square } | null => {
    const history = game.history({ verbose: true });
    const lastMove = history.at(-1);
    return lastMove ? { from: lastMove.from, to: lastMove.to } : null;
}

export const getPieces = (game: Chess) => chessTypeSquares
    .map((square) => {
        const piece = game.get(square as Square);
        if (piece) {
            return {
                square: square as Square,
                piece: piece.type,
                color: piece.color
            };
        }
        return null;
    })
    .filter(x => x !== null)
    .reduce((acc, curr) => {
        acc[curr!.square] = { piece: curr!.piece, color: curr!.color };
        return acc;
    }, {} as Record<Square, Piece>);


export default function ChessBoardView({ pieces, pxSize, colorPerspective, moveFunctionForDragging, showAvailableMovesForSquare, showPreviousMove }: ChessBoardProps) {
    const [suppressAnimations, setSuppressAnimations] = useState(false);

    const animatingPieces = useChessPieceAnimations({
        pieces: pieces,
        pxSize: pxSize,
        colorPerspective: colorPerspective,
        suppressAnimations: suppressAnimations
    });

    // Handle drag interactions  
    const { hoveringPieceOver, previewMoves, handleDragMove, handleDragNoMove } = useChessDragHandlers({
        pieces: pieces,
        pxSize,
        colorPerspective,
        move: moveFunctionForDragging ? (...args) => {
            setSuppressAnimations(true);
            moveFunctionForDragging(...args);
            setTimeout(() => setSuppressAnimations(false), 250);
        } : () => {},
        showAvailableMovesForSquare: moveFunctionForDragging && showAvailableMovesForSquare ? showAvailableMovesForSquare : () => []
    });

    const previousMove = useMemo(
        () => (showPreviousMove ? showPreviousMove() ?? null : null),
        [showPreviousMove]
    );

    return (
        <div style={{ position: 'relative', width: pxSize, height: pxSize }}>
            <DndContext 
                onDragEnd={handleDragNoMove} 
                onDragMove={handleDragMove}
                modifiers={[snapCenterToCursor]}
            >
                <DroppableChessCanvasBg
                    pxSize={pxSize}
                    colorPerspective={colorPerspective}
                    highlightHover={hoveringPieceOver}
                    previousMove={previousMove}
                    previewMoves={previewMoves}
                >
                    <DraggablePieces
                        pieces={pieces}
                        animatingPieces={animatingPieces}
                        pxSize={pxSize}
                        colorPerspective={colorPerspective}
                    />
                    
                    <AnimatedPieces
                        animatingPieces={animatingPieces}
                    />
                </DroppableChessCanvasBg>
            </DndContext>
        </div>
    );
}