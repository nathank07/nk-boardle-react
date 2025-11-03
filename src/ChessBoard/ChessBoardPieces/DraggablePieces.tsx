import { Chess, PieceSymbol, Color, Square } from 'chess.js';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState, useCallback } from 'react';

import bB from '../../assets/cburnett/bB.svg';
import bK from '../../assets/cburnett/bK.svg';
import bN from '../../assets/cburnett/bN.svg';
import bP from '../../assets/cburnett/bP.svg';
import bQ from '../../assets/cburnett/bQ.svg';
import bR from '../../assets/cburnett/bR.svg';
import wB from '../../assets/cburnett/wB.svg';
import wK from '../../assets/cburnett/wK.svg';
import wN from '../../assets/cburnett/wN.svg';
import wP from '../../assets/cburnett/wP.svg';
import wQ from '../../assets/cburnett/wQ.svg';
import wR from '../../assets/cburnett/wR.svg';

const pieceImages = {
    "wR": wR, "wN": wN, "wB": wB, "wQ": wQ, "wK": wK, "wP": wP,
    "bR": bR, "bN": bN, "bB": bB, "bQ": bQ, "bK": bK, "bP": bP,
};

interface Piece {
    piece: PieceSymbol;
    color: Color;
}

const mapSquareToPxRect = (square: Square, pxSize: number, colorPerspective: Color) => {
    const squareSize = pxSize / 8;
    const col = colorPerspective === 'b' ? 7 - (square.charCodeAt(0) - 97) : square.charCodeAt(0) - 97;
    const row = colorPerspective === 'b' ? parseInt(square[1]) - 1 : 8 - parseInt(square[1]);

    return {
        x: col * squareSize,
        y: row * squareSize,
        width: squareSize,
        height: squareSize,
    };
};

export const mapPxToSquare = (x: number, y: number, pxSize: number, colorPerspective: Color): Square | null => {
    const squareSize = pxSize / 8;
    const col = Math.floor(x / squareSize);
    const row = Math.floor(y / squareSize);
    const mappedCol = colorPerspective === 'b' ? 7 - col : col;
    const mappedRow = colorPerspective === 'b' ? row : 7 - row;
    if (mappedCol < 0 || mappedCol > 7 || mappedRow < 0 || mappedRow > 7) {
        return null;
    }
    return String.fromCharCode(97 + mappedCol) + (mappedRow + 1) as Square;
};

export { mapSquareToPxRect };

export const getMovesForSquare = (game: Chess, square: Square): { moves: Square[], takeables: Square[] } => {
    const moves = game.moves({ square: square, verbose: true });
    return moves
        .map(m => m.to)
        .map(m => {
            return game.get(m) ? { move: null, take: m } : { move: m, take: null };
        })
        .reduce(
            (acc, curr) => {
                if (curr.move) acc.moves.push(curr.move);
                if (curr.take) acc.takeables.push(curr.take);
                return acc;
            },
            { moves: [] as Square[], takeables: [] as Square[] }
        );
}

interface ChessBoardDragHandlers {
    pxSize: number;
    colorPerspective: Color;
    chessGame: Chess;
    onMove: (from: Square, to: Square) => void;
}

export const useChessDragHandlers = ({ pxSize, colorPerspective, chessGame, onMove }: ChessBoardDragHandlers) => {
    const [hoveringPieceOver, setHoveringPieceOver] = useState<Square | null>(null);
    const [delta, setDelta] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [previewMoves, setPreviewMoves] = useState<{ moves: Square[]; takeables: Square[] }>({ moves: [], takeables: [] });

    const dropPiece = useCallback((from: Square, to: Square) => {
        try {   
            chessGame.move({
                from: from,
                to: to,
            });
            onMove(from, to);
        } catch {
            console.error("Invalid move");
        }
    }, [chessGame, onMove]);

    const handleDragEnd = useCallback((event: any) => {
        event.activatorEvent.target.style.zIndex = 1;
        setHoveringPieceOver(null);
        setPreviewMoves({ moves: [], takeables: [] });
        if(!event.over) return        
        const {x, y} = event.delta;
        const oldSquare = event.active.id as Square;
        const rect = mapSquareToPxRect(oldSquare, pxSize, colorPerspective);
        const newX = rect.x + x + rect.width / 2;
        const newY = rect.y + y + rect.height / 2;
        const targetSquare = mapPxToSquare(newX, newY, pxSize, colorPerspective);
        
        if (targetSquare && oldSquare !== targetSquare) {
            dropPiece(oldSquare, targetSquare);
        }
    }, [pxSize, colorPerspective, dropPiece]);

    const handleDragMove = useCallback((event: any) => {
        if (event.active) {
            // Keep the dragged piece on top
            event.activatorEvent.target.style.zIndex = 9999;

            // Get current position of dragged piece based on delta
            const { x, y } = event.delta;
            const { x: oldX, y: oldY } = delta || {};
            const sourceSquare = event.active.id as Square;
            const rect = mapSquareToPxRect(sourceSquare, pxSize, colorPerspective);
            const newX = rect.x + x + rect.width / 2;
            const newY = rect.y + y + rect.width / 2;

            // Update preview moves for the piece being dragged
            setPreviewMoves(getMovesForSquare(chessGame, sourceSquare));

            // Prevent redraws if still over the same square 
            const oldSquare = mapPxToSquare(oldX || (rect.x + rect.width / 2), 
                                            oldY || (rect.y + rect.height / 2), 
                                            pxSize, colorPerspective);
            const targetSquare = mapPxToSquare(newX, newY, pxSize, colorPerspective);

            // If the piece is not over a square then you don't need to highlight anything
            if (targetSquare === null) {
                setHoveringPieceOver(null);
                return;
            }

            // Only update if the square has changed
            if (oldSquare !== targetSquare || hoveringPieceOver === null) {
                setDelta({ x, y });
                setHoveringPieceOver(targetSquare);
            }
        }
    }, [pxSize, colorPerspective, chessGame, delta, hoveringPieceOver]);

    return { 
        hoveringPieceOver, 
        previewMoves,  
        handleDragMove,
        handleDragEnd 
    };
};

function DraggablePiece({id, src, style}: {id: string; src: string; style?: React.CSSProperties}) {
    const {attributes, listeners, setNodeRef, transform} = useDraggable({
        id: id,
        data: { square: id }
    });
    
    const pieceStyle: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        ...style,
        zIndex: 1,
    };
    
    return (
        <img
            ref={setNodeRef}
            src={src}
            alt={id}
            style={pieceStyle}
            {...listeners}
            {...attributes}
        />
    );
}

interface DraggablePiecesProps {
    pieces: Record<Square, Piece>;
    animatingPieces?: Array<{
        id: string;
        piece: Piece;
        fromRect: { x: number; y: number; width: number; height: number };
        toRect: { x: number; y: number; width: number; height: number };
        progress: number;
        toSquare: Square;
    }> | null;
    pxSize: number;
    colorPerspective: Color;
}

export default function DraggablePieces({ pieces, animatingPieces, pxSize, colorPerspective }: DraggablePiecesProps) {
    return (
        <>
            {Object.entries(pieces).map(([square, p]) => {
                // Hide pieces that are currently being animated to this square
                const isBeingAnimatedTo = animatingPieces?.some(anim => anim.toSquare === square) ?? false;
                if (isBeingAnimatedTo) {
                    return null;
                }
                
                const rect = mapSquareToPxRect(square as Square, pxSize, colorPerspective);
                const imgKey = (p.color + p.piece.toUpperCase()) as keyof typeof pieceImages;
                return (
                    <DraggablePiece
                        key={square}
                        id={square}
                        src={pieceImages[imgKey]}
                        style={{
                            position: 'absolute',
                            left: `${rect.x}px`,
                            top: `${rect.y}px`,
                            width: `${rect.width}px`,
                            height: `${rect.height}px`,
                        }}
                    />
                );
            })}
        </>
    );
}