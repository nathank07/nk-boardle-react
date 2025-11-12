import { mapSquareToPxRect } from "./DroppableChessCanvasBg";
import pieces from "./ChessBoardPieces/PieceImages";
import { Color, PieceSymbol, Square } from 'chess.js';
import './PromotionView.css'; 

interface PromotionViewProps {
    color: Color;
    pxSize: number;
    moveWithPromotion: (piece: PieceSymbol) => void;
    onClick?: () => void;
    startAtSquare: Square;
}

export default function PromotionView({ color, moveWithPromotion, pxSize, onClick, startAtSquare }: PromotionViewProps) {
    const white = {
        "q": pieces.wQ,
        "r": pieces.wR,
        "b": pieces.wB,
        "n": pieces.wN,
    }
    const black = {
        "q": pieces.bQ,
        "r": pieces.bR,
        "b": pieces.bB,
        "n": pieces.bN,
    };
    const selector = {
        'w': white,
        'b': black
    }
    const pos = mapSquareToPxRect(startAtSquare, pxSize, color);

    const calculateYPos = (piece: PieceSymbol) => {
        const white = color === 'w';
        const startSq = startAtSquare[1];
        const startAtTop = white && startSq == "8" || !white && startSq === '1';
        const order = ['q', 'n', 'r', 'b']
        if (startAtTop) {
            return pos.y + order.indexOf(piece) * (pxSize / 8);
        } else {
            return pos.y - (order.indexOf(piece)) * (pxSize / 8);
        }
    };

    const positions = {
        "q": { x: pos.x, y: calculateYPos("q") },
        "n": { x: pos.x, y: calculateYPos("n") },
        "r": { x: pos.x, y: calculateYPos("r") },
        "b": { x: pos.x, y: calculateYPos("b") },
    }

    return <div
        style={{
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            width: pxSize,
            height: pxSize,
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 9999,
        }}
        onClick={onClick}
    >
        { Object.keys(selector[color]).map((key, idx) =>
            <img
                key={idx}
                className="promotion-piece"
                src={selector[color][key]}
                style={{
                    width: pxSize / 8,
                    height: pxSize / 8,
                    position: 'absolute',
                    left: positions[key as PieceSymbol].x,
                    top: positions[key as PieceSymbol].y,
                    cursor: 'pointer',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    boxShadow: '-1px 0 2px rgba(0, 0, 0, 0.3)',
                    zIndex: 10000,
                }}
                onClick={() => moveWithPromotion(key as PieceSymbol)}
            />
        )}
    </div>;
}