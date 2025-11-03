import { Chess, PieceSymbol, Color, Square } from 'chess.js'
import { useRef, useEffect, useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { chessTypeSquares } from '../ChessBoard/ChessBoard';

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


interface DroppableChessCanvasBgProps {
    pxSize: number;
    colorPerspective: Color;
    highlightHover: Square | null;
    previousMove: { from: Square; to: Square } | null;
    previewMoves: { moves: Square[]; takeables: Square[] } | null;
    children: React.ReactNode;
}

export default function DroppableChessCanvasBg(props: DroppableChessCanvasBgProps) {
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
            // Moves that are not captures
            props.previewMoves.moves.forEach((square) => {
                if (square === props.highlightHover) return;
                const rect = mapSquareToPxRect(square, props.pxSize, props.colorPerspective);
                ctx.fillStyle = 'rgba(0, 180, 235, 0.3)';
                ctx.strokeStyle = 'rgba(10, 10, 10, 0.8)';
                
                ctx.beginPath();
                ctx.arc(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width / 6, 0, 2 * Math.PI);
                ctx.fill();
            });

            // Moves that have a piece that can be captured
            props.previewMoves.takeables.forEach((square) => {
                if (square === props.highlightHover) return;
                const rect = mapSquareToPxRect(square, props.pxSize, props.colorPerspective);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.strokeStyle = 'rgba(10, 10, 10, 0.8)';
                ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
                ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            });
        }        
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