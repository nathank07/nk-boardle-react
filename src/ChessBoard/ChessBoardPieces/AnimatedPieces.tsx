import { Chess, Color, Square } from 'chess.js';
import { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { Piece, getPieces } from '../ChessBoard';

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

export const getPieceMovements = (piecesPosA: Record<Square, Piece>, piecesPosB: Record<Square, Piece>) => {
    const historyA = piecesPosA;
    const historyB = piecesPosB;

    const remove: Record<Square, Piece> = Object.keys(historyA)
        .filter(sq => !historyB[sq] || (historyB[sq] && (historyA[sq].piece !== historyB[sq].piece || historyA[sq].color !== historyB[sq].color)))
        .reduce((acc, sq) => {
            acc[sq as Square] = historyA[sq as Square];
            return acc;
        }, {} as Record<Square, Piece>);

    const added: Record<Square, Piece> = Object.keys(historyB)
        .filter(sq => !historyA[sq] || (historyA[sq] && (historyA[sq].piece !== historyB[sq].piece || historyA[sq].color !== historyB[sq].color)))
        .reduce((acc, sq) => {
            acc[sq as Square] = historyB[sq as Square];
            return acc;
        }, {} as Record<Square, Piece>);

    const removedPieces = Object.values(remove).reduce((acc, piece) => {
        const key = piece.color + piece.piece;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    } , {} as Record<string, number>);

    const addedPieces = Object.values(added).reduce((acc, piece) => {
        const key = piece.color + piece.piece;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    } , {} as Record<string, number>);

    const intersection: Record<string, number> = {};
    for (const key in removedPieces) {
        if (addedPieces[key]) {
            intersection[key] = Math.min(removedPieces[key], addedPieces[key]);
        }
    }
    
    const movements: Array<{ from: Square; to: Square }> = [];
    
    for (const pieceType in intersection) {
        const count = intersection[pieceType];
        
        const removedSquares = Object.keys(remove).filter(sq => {
            const piece = remove[sq as Square];
            return (piece.color + piece.piece) === pieceType;
        });
        
        const addedSquares = Object.keys(added).filter(sq => {
            const piece = added[sq as Square];
            return (piece.color + piece.piece) === pieceType;
        });
                
        for (let i = 0; i < count; i++) {
            if (removedSquares[i] && addedSquares[i]) {
                movements.push({
                    from: removedSquares[i] as Square,
                    to: addedSquares[i] as Square
                });
            }
        }
    }
    
    return movements;
}

const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
};

interface ChessPieceAnimation {
    pieces: Record<Square, Piece>;
    pxSize: number;
    colorPerspective: Color;
    suppressAnimations: boolean;
}

// Custom hook for piece animations with automatic movement detection
export const useChessPieceAnimations = ({ pieces, pxSize, colorPerspective, suppressAnimations }: ChessPieceAnimation) => {

    const [animatingPieces, setAnimatingPieces] = useState<Array<{
        id: string;
        piece: Piece;
        fromRect: { x: number; y: number; width: number; height: number };
        toRect: { x: number; y: number; width: number; height: number };
        progress: number;
        toSquare: Square;
    }>>([]);
    
    const [lastPiecesPosition, setLastPiecesPosition] = useState<Record<Square, Piece> | null>(null);
    
    const animateMovements = useCallback((oldPieces: Record<Square, Piece>, movements: Array<{ from: Square; to: Square }>) => {
        const animationDuration = animatingPieces.length > 0 ? 0 : 200; // ms
        const animations = movements.map((movement, index) => {
            const piece = oldPieces[movement.from];
            if (!piece) return null;
            
            const fromRect = mapSquareToPxRect(movement.from, pxSize, colorPerspective);
            const toRect = mapSquareToPxRect(movement.to, pxSize, colorPerspective);
            
            return {
                id: `animation-${movement.from}-${movement.to}-${Date.now()}-${index}`,
                piece,
                fromRect,
                toRect,
                progress: 0,
                toSquare: movement.to
            };
        }).filter(Boolean) as Array<{
            id: string;
            piece: Piece;
            fromRect: { x: number; y: number; width: number; height: number };
            toRect: { x: number; y: number; width: number; height: number };
            progress: number;
            toSquare: Square;
        }>;

        setAnimatingPieces(animations);
        
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / animationDuration, 1);

            setAnimatingPieces(current => 
                current.map(anim => ({
                    ...anim,
                    progress: easeInOutCubic(progress)
                }))
            );

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setAnimatingPieces([]);
            }
        };

        requestAnimationFrame(animate);
    }, [animatingPieces, pxSize, colorPerspective]);

    // Automatically handle position changes and trigger animations
    // useLayoutEffect needs to be used here, otherwise you will get FOUC
    useLayoutEffect(() => {
        if (lastPiecesPosition) {
            const movements = getPieceMovements(lastPiecesPosition, pieces);
            if (movements.length > 0) {
                animateMovements(lastPiecesPosition, movements);
            }
        }
        setLastPiecesPosition(pieces);
    }, [pieces, animateMovements]);


    return suppressAnimations ? [] : animatingPieces;
};

interface AnimatedPiecesProps {
    animatingPieces: Array<{
        id: string;
        piece: Piece;
        fromRect: { x: number; y: number; width: number; height: number };
        toRect: { x: number; y: number; width: number; height: number };
        progress: number;
        toSquare: Square;
    }>;
}

export default function AnimatedPieces({ animatingPieces }: AnimatedPiecesProps) {
    return (
        <>
            {animatingPieces.map((animPiece) => {
                const currentX = animPiece.fromRect.x + (animPiece.toRect.x - animPiece.fromRect.x) * animPiece.progress;
                const currentY = animPiece.fromRect.y + (animPiece.toRect.y - animPiece.fromRect.y) * animPiece.progress;
                const imgKey = (animPiece.piece.color + animPiece.piece.piece.toUpperCase()) as keyof typeof pieceImages;
                
                return (
                    <img
                        key={animPiece.id}
                        src={pieceImages[imgKey]}
                        alt={`animating-${animPiece.piece.color}${animPiece.piece.piece}`}
                        style={{
                            position: 'absolute',
                            left: `${currentX}px`,
                            top: `${currentY}px`,
                            width: `${animPiece.fromRect.width}px`,
                            height: `${animPiece.fromRect.height}px`,
                            zIndex: 9999,
                            pointerEvents: 'none',
                        }}
                    />
                );
            })}
        </>
    );
}
