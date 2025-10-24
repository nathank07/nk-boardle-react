import { useRef, useEffect, useState } from 'react';
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

const mapSquareToPxRect = (square: Square, pxSize, colorPerspective) => {
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
    currentPosition: { x: number; y: number } | null;
    children: React.ReactNode;
}

function DroppableChessCanvasBg(props: DroppableChessCanvasBgProps) {
    const boardRef = useRef<HTMLCanvasElement>(null);
    const { isOver, setNodeRef } = useDroppable({
        id: 'chessboard',
    });
    

    const black = props.colorPerspective == 'b';
    const dark = '#b58863';
    const light = '#f0d9b5';


    useEffect(() => {
        const board = boardRef.current;
        if (!board) return;
        
        const ctx = board.getContext('2d');
        if (!ctx) return;

        board.width = props.pxSize;
        board.height = props.pxSize;
        ctx.fillStyle = black ? dark : light;
        ctx.fillRect(0, 0, props.pxSize, props.pxSize);
        ctx.fillStyle = !black ? dark : light;
        chessTypeSquares.forEach((square, i) => {
            const rect = mapSquareToPxRect(square as Square, props.pxSize, props.colorPerspective);
            if (((i % 8) + Math.floor(i / 8)) % 2 === 0) {
                ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            }
        });

        // Highlight current position if piece is being dragged
        if (props.currentPosition) {
            const targetSquare = mapPxToSquare(
                props.currentPosition.x,
                props.currentPosition.y,
                props.pxSize,
                props.colorPerspective
            );
            const rect = mapSquareToPxRect(targetSquare as Square, props.pxSize, props.colorPerspective);
            
            ctx.fillStyle = 'rgba(0, 180, 235, 0.3)';
            ctx.strokeStyle = 'rgba(0, 180, 235, 0.8)';
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }
    }, [props.pxSize, props.colorPerspective, props.currentPosition]);

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

function ChessBoard({ pxSize, chessGame, colorPerspective = 'w' }: { pxSize: number; chessGame: Chess; colorPerspective: Color }) {
    const [hoveringPieceOver, setHoveringPieceOver] = useState<{ x: number, y: number } | null>(null);

    function handleDragEnd(event: any) {
        if(!event.over) return
        setHoveringPieceOver(null);
        const {x, y} = event.delta;
        const oldSquare = event.active.id as Square;
        const rect = mapSquareToPxRect(oldSquare, pxSize, colorPerspective);
        const newX = rect.x + x + rect.width / 2;
        const newY = rect.y + y + rect.height / 2;
        const targetSquare = mapPxToSquare(newX, newY, pxSize, colorPerspective);
        
        if (targetSquare && oldSquare !== targetSquare) {
            const move = chessGame.move({
                from: oldSquare as Square,
                to: targetSquare as Square,
            });
            
            if (move) {
                setPieces(getPieces(chessGame)); 
            }
        }
    }

    function handleDragMove(event: any) {
        if (event.active) {
            event.activatorEvent.target.style.zIndex = 9999;
            const { x, y } = event.delta;
            const { x: oldX, y: oldY } = hoveringPieceOver || {};
            const sourceSquare = event.active.id as Square;
            const rect = mapSquareToPxRect(sourceSquare, pxSize, colorPerspective);
            const newX = rect.x + x + rect.width / 2;
            const newY = rect.y + y + rect.width / 2;

            // Prevent redraws if still over the same square
            const oldSquare = mapPxToSquare(oldX || (rect.x + rect.width / 2), 
                                            oldY || (rect.y + rect.height / 2), 
                                            pxSize, colorPerspective);
            const targetSquare = mapPxToSquare(newX, newY, pxSize, colorPerspective);
            if (targetSquare === null) {
                setHoveringPieceOver(null);
                return;
            }
            if (oldSquare !== targetSquare || hoveringPieceOver === null) {
                setHoveringPieceOver({ x: newX, y: newY });
            }
        }
    }
    
    const [pieces, setPieces] = useState<Record<Square, Piece>>(getPieces(chessGame));

    useEffect(() => {
        setPieces(getPieces(chessGame));
    }, [chessGame]);

    
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
            currentPosition={hoveringPieceOver}
            children={Object.entries(pieces).map(([square, p]) => {
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
        />
        

    </DndContext>)
}

export default ChessBoard;
