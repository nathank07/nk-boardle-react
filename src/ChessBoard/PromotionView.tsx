import pieces from "./ChessBoardPieces/PieceImages";
import { Color, PieceSymbol } from 'chess.js' 

interface PromotionViewProps {
    color: Color;
    pxSize: number;
    moveWithPromotion: (piece: PieceSymbol) => void;
    onClick?: () => void;
}

export default function PromotionView({ color, moveWithPromotion, pxSize, onClick }: PromotionViewProps) {
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

    return <div
        style={{
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
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
                src={selector[color][key]}
                style={{
                    width: pxSize / 4,
                    height: pxSize / 4,
                    cursor: 'pointer',
                    margin: 2,
                    zIndex: 10000,
                }}
                onClick={() => moveWithPromotion(key as PieceSymbol)}
            />
        )}
    </div>;
}