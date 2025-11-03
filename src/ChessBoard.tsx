import { useRef, useEffect, useState, useMemo } from 'react';
import { Chess, PieceSymbol, Color, Square } from 'chess.js'
import { DndContext, PointerSensor, pointerWithin, rectIntersection, useSensor, useSensors } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import bB from './assets/cburnett/bB.svg';
import bK from './assets/cburnett/bK.svg';
import bN from './assets/cburnett/bN.svg';
import bP from './assets/cburnett/bP.svg';
import bQ from './assets/cburnett/bQ.svg';
import bR from './assets/cburnett/bR.svg';
import wB from './assets/cburnett/wB.svg';
import wK from './assets/cburnett/wK.svg';
import wN from './assets/cburnett/wN.svg';
import wP from './assets/cburnett/wP.svg';
import wQ from './assets/cburnett/wQ.svg';
import wR from './assets/cburnett/wR.svg';
import { snapCenterToCursor } from '@dnd-kit/modifiers';


interface Piece {
    piece: PieceSymbol;
    color: Color;
}

const getPieces = (game: Chess) => chessTypeSquares
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

const getPreviousMove = (game: Chess): { from: Square; to: Square } | null => {
    const history = game.history({ verbose: true });
    const lastMove = history.at(-1);
    return lastMove ? { from: lastMove.from, to: lastMove.to } : null;
}

const getMovesForSquare = (game: Chess, square: Square): { moves: Square[], takeables: Square[] } => {
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

const getPieceMovements = (chessGameA: Chess, chessGameB: Chess) => {
    const historyA = getPieces(chessGameA);
    const historyB = getPieces(chessGameB);
    
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
        
        // Find squares where this piece type was removed
        const removedSquares = Object.keys(remove).filter(sq => {
            const piece = remove[sq as Square];
            return (piece.color + piece.piece) === pieceType;
        });
        
        // Find squares where this piece type was added
        const addedSquares = Object.keys(added).filter(sq => {
            const piece = added[sq as Square];
            return (piece.color + piece.piece) === pieceType;
        });
                
        // Match removed and added squares for movements
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


const mapPxToSquare = (x: number, y: number, pxSize: number, colorPerspective: Color): Square | null => {
        const squareSize = pxSize / 8;
        const col = Math.floor(x / squareSize);
        const row = Math.floor(y / squareSize);
        const mappedCol = colorPerspective === 'b' ? 7 - col : col;
        const mappedRow = colorPerspective === 'b' ? row : 7 - row;
        if (mappedCol < 0 || mappedCol > 7 || mappedRow < 0 || mappedRow > 7) {
            return null;
        }
        return String.fromCharCode(97 + mappedCol) + (mappedRow + 1) as Square;
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
}

const chessTypeSquares =  [ "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8",
                            "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8",
                            "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8",
                            "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8",
                            "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8",
                            "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8",
                            "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8",
                            "h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8" ];


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



interface DroppableChessCanvasBgProps {
    pxSize: number;
    colorPerspective: Color;
    highlightHover: Square | null;
    previousMove: { from: Square; to: Square } | null;
    previewMoves: { moves: Square[]; takeables: Square[] } | null;
    children: React.ReactNode;
}

function DroppableChessCanvasBg(props: DroppableChessCanvasBgProps) {
    const boardRef = useRef<HTMLCanvasElement>(null);
    const { isOver, setNodeRef } = useDroppable({
        id: 'chessboard',
    });
    

    const dark = '#b58863';
    const light = '#f0d9b5';


    useEffect(() => {
        const board = boardRef.current;
        if (!board) return;
        
        const ctx = board.getContext('2d');
        if (!ctx) return;


        // 8x8 chessboard bg drawing
        board.width = props.pxSize;
        board.height = props.pxSize;
        ctx.fillStyle = light;
        ctx.fillRect(0, 0, props.pxSize, props.pxSize);
        ctx.fillStyle = dark;
        chessTypeSquares.forEach((square, i) => {
            const rect = mapSquareToPxRect(square as Square, props.pxSize, props.colorPerspective);
            if (((i % 8) + Math.floor(i / 8)) % 2 === 0) {
                ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            }
        });

        // Show previous move
        if (props.previousMove) {
            const fromRect = mapSquareToPxRect(props.previousMove.from, props.pxSize, props.colorPerspective);
            const toRect = mapSquareToPxRect(props.previousMove.to, props.pxSize, props.colorPerspective);
            
            ctx.fillStyle = 'rgba(246, 246, 105, 0.6)';
            ctx.fillRect(fromRect.x, fromRect.y, fromRect.width, fromRect.height);
            ctx.fillRect(toRect.x, toRect.y, toRect.width, toRect.height);
        }

        // Show hover highlight
        if (props.highlightHover) {
            const rect = mapSquareToPxRect(props.highlightHover, props.pxSize, props.colorPerspective);
            ctx.fillStyle = 'rgba(0, 180, 235, 0.3)';
            ctx.strokeStyle = 'rgba(0, 180, 235, 0.8)';
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }

        // Show squares piece can move to
        if (props.previewMoves) {
            props.previewMoves.moves.forEach((square) => {
                if (square === props.highlightHover) return;
                const rect = mapSquareToPxRect(square, props.pxSize, props.colorPerspective);
                ctx.fillStyle = 'rgba(0, 180, 235, 0.3)';
                ctx.strokeStyle = 'rgba(10, 10, 10, 0.8)';
                
                ctx.beginPath();
                ctx.arc(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width / 6, 0, 2 * Math.PI);
                ctx.fill();
            });

            props.previewMoves.takeables.forEach((square) => {
                if (square === props.highlightHover) return;
                const rect = mapSquareToPxRect(square, props.pxSize, props.colorPerspective);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.strokeStyle = 'rgba(10, 10, 10, 0.8)';
                ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
                ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            });
        }

        // Show squares piece can move to and take
    }, [props.pxSize, props.colorPerspective, props.highlightHover, props.previousMove, props.previewMoves]);

    return (
            <div
            ref={setNodeRef}
                style={{
                    position: 'relative',
                    width: `${props.pxSize}px`,
                    height: `${props.pxSize}px`,
                    // border: isOver ? '4px solid blue' : '4px solid transparent',
            }}>
                <canvas
                    className="chessboard"
                    style={{ position: 'absolute', left: 0, top: 0 }}
                    ref={boardRef}
                />
                {props.children}
            </div>
    );
}

function ChessBoard({ pxSize, chessGame, colorPerspective = 'w', forceReloadCounter }: { pxSize: number; chessGame: Chess; colorPerspective: Color; forceReloadCounter: number }) {
    const [hoveringPieceOver, setHoveringPieceOver] = useState<Square | null>(null);
    const [delta, setDelta] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [animatingPieces, setAnimatingPieces] = useState<Array<{
        id: string;
        piece: Piece;
        fromRect: { x: number; y: number; width: number; height: number };
        toRect: { x: number; y: number; width: number; height: number };
        progress: number;
        toSquare: Square;
    }>>([]);

    const animateMovements = (oldPieces: Record<Square, Piece>, movements: Array<{ from: Square; to: Square }>) => {
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
    };

    const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };

    function handleDragEnd(event: any) {
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
    }

    function handleDragMove(event: any) {
        if (event.active) {
            // Keep the dragged piece on top
            event.activatorEvent.target.style.zIndex = 9999;

            // Get current position of dragged piece based on delta
            // The new position can be found with mapPxToSquare
            const { x, y } = event.delta;
            const { x: oldX, y: oldY } = delta || {};
            const sourceSquare = event.active.id as Square;
            const rect = mapSquareToPxRect(sourceSquare, pxSize, colorPerspective);
            const newX = rect.x + x + rect.width / 2;
            const newY = rect.y + y + rect.width / 2;

            // Update preview moves for the piece being dragged
            setPreviewMoves(getMovesForSquare(chessGame, sourceSquare));

            // Prevent redraws if still over the same square 
            // by comparing old and new square positions
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
    }
    
    const [pieces, setPieces] = useState<Record<Square, Piece>>(getPieces(chessGame));
    
    const [previewMoves, setPreviewMoves] = useState<{ moves: Square[]; takeables: Square[] }>({ moves: [], takeables: [] });
    // Keeping track of the previous game allows you to compare board state and animate changes
    const [lastPiecesPosition, setLastPiecesPosition] = useState<Chess | null>(null);

    const previousMove = useMemo<{ from: Square; to: Square } | null>(() => getPreviousMove(chessGame), [chessGame.fen(), forceReloadCounter]);

    function dropPiece(from: Square, to: Square) {
        try {   
            chessGame.move({
                from: from,
                to: to,
            });
            setLastPiecesPosition(new Chess(chessGame.fen()));
            setPieces(getPieces(chessGame));
        } catch {
            console.error("Invalid move");
        }
    }

    useEffect(() => {
        if (lastPiecesPosition) {
            const movements = getPieceMovements(lastPiecesPosition, chessGame);
            if (movements.length > 0) {
                const previousPieces = getPieces(lastPiecesPosition);
                animateMovements(previousPieces, movements);
            }
        }
        setPieces(getPieces(chessGame));
        setLastPiecesPosition(new Chess(chessGame.fen()));
        setPreviewMoves({ moves: [], takeables: [] });
    }, [chessGame, forceReloadCounter]);

    const pieceImages = {
        "wR": wR, "wN": wN, "wB": wB, "wQ": wQ, "wK": wK, "wP": wP,
        "bR": bR, "bN": bN, "bB": bB, "bQ": bQ, "bK": bK, "bP": bP,
    }

    return (
    <DndContext 
        onDragEnd={handleDragEnd} 
        onDragMove={handleDragMove}
        modifiers={[snapCenterToCursor]}
    >
        <DroppableChessCanvasBg
            pxSize={pxSize}
            colorPerspective={colorPerspective}
            highlightHover={hoveringPieceOver}
            previousMove={previousMove}
            previewMoves={previewMoves}
            children={
                <>
                    {Object.entries(pieces).map(([square, p]) => {
                        // Hide pieces that are currently being animated to this square
                        const isBeingAnimatedTo = animatingPieces.some(anim => anim.toSquare === square);
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
            }
        />
        

    </DndContext>)
}

export default ChessBoard;
