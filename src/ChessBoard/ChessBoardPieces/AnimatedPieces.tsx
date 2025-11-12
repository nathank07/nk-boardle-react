import { Chess, Color, Square } from 'chess.js';
import { useState, useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { Piece, getPieces } from '../ChessBoard';
import { mapSquareToPxRect } from '../DroppableChessCanvasBg';
import pieceImages from './PieceImages';

export const getPieceMovements = (piecesPosA: Record<Square, Piece>, piecesPosB: Record<Square, Piece>) => {
    const historyA = piecesPosA;
    const historyB = piecesPosB;

    const removedSquaresToPieces: Record<Square, Piece> = Object.keys(historyA)
        .filter(sq => !historyB[sq] || (historyB[sq] && (historyA[sq].piece !== historyB[sq].piece || historyA[sq].color !== historyB[sq].color)))
        .reduce((acc, sq) => {
            acc[sq as Square] = historyA[sq as Square];
            return acc;
        }, {} as Record<Square, Piece>);

    const addedSquaresToPieces: Record<Square, Piece> = Object.keys(historyB)
        .filter(sq => !historyA[sq] || (historyA[sq] && (historyA[sq].piece !== historyB[sq].piece || historyA[sq].color !== historyB[sq].color)))
        .reduce((acc, sq) => {
            acc[sq as Square] = historyB[sq as Square];
            return acc;
        }, {} as Record<Square, Piece>);

    const removedPiecesCounter = Object.values(removedSquaresToPieces).reduce((acc, piece) => {
        const key = piece.color + piece.piece;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    } , {} as Record<string, number>);

    const addedPiecesCounter = Object.values(addedSquaresToPieces).reduce((acc, piece) => {
        const key = piece.color + piece.piece;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    } , {} as Record<string, number>);

    // Pieces that were removed from a square and found elsewhere
    const intersection: Record<string, number> = {};
    for (const pieceStr in removedPiecesCounter) {
        if (addedPiecesCounter[pieceStr]) {
            intersection[pieceStr] = Math.min(removedPiecesCounter[pieceStr], addedPiecesCounter[pieceStr]);
        }
    }

    // Pieces where a new non pawn piece was found but a pawn was removed
    const pawnPromotions: Record<string, number> = {};
    for (const removedPieceStr in removedPiecesCounter) {
        if (removedPieceStr.endsWith('p')) {
            for (const addedPieceStr in addedPiecesCounter) {
                const intersect = intersection[addedPieceStr] || 0;
                if (addedPieceStr[0] != removedPieceStr[0]) continue;
                if (addedPieceStr.endsWith('p')) continue;
                if (addedPiecesCounter[addedPieceStr] <= intersect) continue;
                pawnPromotions[removedPieceStr] = Math.min(removedPiecesCounter[removedPieceStr], addedPiecesCounter[addedPieceStr] - intersect);
            }
        }
    }

    // Pieces where a pawn was added but a non pawn piece was removed
    const pawnDemotions: Record<string, number> = {};
    for (const addedPieceStr in addedPiecesCounter) {
        if (addedPieceStr.endsWith('p')) {
            for (const removedPieceStr in removedPiecesCounter) {
                const intersect = intersection[removedPieceStr] || 0;
                if (addedPieceStr[0] != removedPieceStr[0]) continue;
                if (removedPieceStr.endsWith('p')) continue;
                if (removedPiecesCounter[removedPieceStr] <= intersect) continue;
                pawnDemotions[addedPieceStr] = removedPiecesCounter[removedPieceStr] - intersect;
            }
        }
    }

    const movements: Array<{ from: Square; to: Square }> = [];
    
    for (const pieceStr in intersection) {
        const count = intersection[pieceStr];

        const removedSquares = Object.keys(removedSquaresToPieces).filter(sq => {
            const piece = removedSquaresToPieces[sq as Square];
            return (piece.color + piece.piece) === pieceStr;
        });
        
        const addedSquares = Object.keys(addedSquaresToPieces).filter(sq => {
            const piece = addedSquaresToPieces[sq as Square];
            return (piece.color + piece.piece) === pieceStr;
        });

        for (let i = 0; i < count; i++) {
            if (removedSquares[i] && addedSquares[i]) {
                if (addedSquares[i]) {
                    const removedSquare = removedSquares[i] as Square;
                    const addedSquare = addedSquares[i] as Square;
                    movements.push({
                        from: removedSquare,
                        to: addedSquare
                    });
                    delete removedSquaresToPieces[removedSquare];
                    delete addedSquaresToPieces[addedSquare];
                }
            }
        }

    }

    for (const pieceStr in pawnPromotions) {
        const count = pawnPromotions[pieceStr];

        const removedSquares = Object.keys(removedSquaresToPieces).filter(sq => {
            const piece = removedSquaresToPieces[sq as Square];
            const correctRank = sq[1] === (pieceStr[0] === 'w' ? '7' : '2');
            return correctRank && (piece.color) === pieceStr[0];
        });

        const addedSquares = Object.keys(addedSquaresToPieces).filter(sq => {
            const piece = addedSquaresToPieces[sq as Square];
            const correctRank = sq[1] === (pieceStr[0] === 'w' ? '8' : '1');
            return correctRank && (piece.color) === pieceStr[0];
        });

        for (let i = 0; i < count; i++) {
            if (removedSquares[i] && addedSquares[i]) {
                const removedSquare = removedSquares[i] as Square;
                const addedSquare = addedSquares[i] as Square;
                movements.push({
                    from: removedSquare,
                    to: addedSquare
                });
            }
        }
    }

    for (const pieceStr in pawnDemotions) {
        const count = pawnDemotions[pieceStr];
        
        const removedSquares = Object.keys(removedSquaresToPieces).filter(sq => {
            const piece = removedSquaresToPieces[sq as Square];
            const correctRank = sq[1] === (pieceStr[0] === 'w' ? '8' : '1');
            return correctRank && (piece.color) === pieceStr[0];
        });
        
        const addedSquares = Object.keys(addedSquaresToPieces).filter(sq => {
            const piece = addedSquaresToPieces[sq as Square];
            const correctRank = sq[1] === (pieceStr[0] === 'w' ? '7' : '2');
            return correctRank && (piece.color) === pieceStr[0];
        });

        for (let i = 0; i < count; i++) {
            if (removedSquares[i] && addedSquares[i]) {
                const removedSquare = removedSquares[i] as Square;
                const addedSquare = addedSquares[i] as Square;
                movements.push({
                    from: removedSquare,
                    to: addedSquare
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

    const movements = useMemo(
        () => lastPiecesPosition ? getPieceMovements(lastPiecesPosition, pieces) : [],
        [lastPiecesPosition, pieces]
    );
    
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
