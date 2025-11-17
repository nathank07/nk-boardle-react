import { Color, Square } from 'chess.js';
import { useRef, useState, useEffect, act } from 'react';
import { mapSquareToPxRect, mapPxToSquare } from './DroppableChessCanvasBg';

interface DrawableChessArrowsOverlayProps {
    pxSize: number;
    colorPerspective: Color;
    drawnArrows: { from: Square; to: Square, inProgress: boolean, color: string }[];
}

export default function DrawableChessArrowsOverlay({ pxSize, colorPerspective, drawnArrows }: DrawableChessArrowsOverlayProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        // Clear previous arrows
        svg.innerHTML = '';

        drawnArrows.forEach(arrow => {
            const fromRect = mapSquareToPxRect(arrow.from, pxSize, colorPerspective);
            const toRect = mapSquareToPxRect(arrow.to, pxSize, colorPerspective);
            drawArrow(
                fromRect.x + fromRect.width / 2,
                fromRect.y + fromRect.height / 2,
                toRect.x + toRect.width / 2,
                toRect.y + toRect.height / 2,
                svg,
                arrow.inProgress,
                arrow.color
            );
        });
    }, [drawnArrows, pxSize, colorPerspective]);

    return (
        <svg 
            ref={svgRef} 
            width={pxSize} 
            height={pxSize}
            viewBox={`0 0 ${pxSize} ${pxSize}`}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 11000 }}
        />
    );
}

interface DrawableMarkings {
    pxSize: number;
    colorPerspective: Color;
    arrowColor: string;
    squareColor: string;
}
 

export const useMarkings = ({ pxSize, colorPerspective, arrowColor, squareColor }: DrawableMarkings) => {
    const [activeMarking, setActiveMarking] = useState<{ from: Square, to: Square } | null>(null);
    const [userDrawnArrows, setUserDrawnArrows] = useState<{ from: Square; to: Square, inProgress: boolean, color: string }[]>([]);
    const [userDrawnSquares, setUserDrawnSquares] = useState<{ square: Square; inProgress: boolean, color: string }[]>([]);
    const removeInProgress = () => {
        setUserDrawnSquares(prev => prev.filter(obj => !(obj.inProgress && obj.color === squareColor)));
        setUserDrawnArrows(prev => prev.filter(obj => !(obj.inProgress && obj.color === arrowColor)));
    }

    const getSquare = (event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const relativeX = event.clientX - rect.left;
        const relativeY = event.clientY - rect.top;
        return mapPxToSquare(relativeX, relativeY, pxSize, colorPerspective);
    }

    const handleMarkingsMouseDown = (event: React.MouseEvent) => {
        const square = getSquare(event);
        if (!square) return;
        setActiveMarking({ from: square, to: square });
        setUserDrawnSquares(prev => [...prev, { square, inProgress: true, color: squareColor }]);
    }

    const handleMarkingsMouseDrag = (event: React.MouseEvent) => {
        if (!activeMarking) return;
        const square = getSquare(event);
        // Prevent redundant updates
        if (square && activeMarking.to !== square) {
            setActiveMarking({ from: activeMarking.from, to: square });
            removeInProgress();
            if (activeMarking.from !== square) {
                setUserDrawnArrows(prev => [...prev, { from: activeMarking.from, to: square, inProgress: true, color: arrowColor }]);
            } else {
                setUserDrawnSquares(prev => [...prev, { square: activeMarking.from, inProgress: true, color: squareColor }]);
            }
        }
    }

    const handleMarkingsMouseUp = (event: React.MouseEvent) => {
        if (event.button === 2 && activeMarking) { 
            const endSquare = getSquare(event);
            if (endSquare && activeMarking.from !== endSquare) {
                toggleElementInArray(userDrawnArrows, { 
                    from: activeMarking.from, 
                    to: endSquare, 
                    inProgress: false, 
                    color: arrowColor 
                });
                removeInProgress();
            } else {
                toggleElementInArray(userDrawnSquares, {
                    square: activeMarking.from,
                    inProgress: false,
                    color: squareColor
                });
                removeInProgress();
            }
            setActiveMarking(null);
        }
    }

    return {
        userDrawnSquares,
        userDrawnArrows,
        clearUserArrows: () => setUserDrawnArrows([]),
        clearUserSquares: () => setUserDrawnSquares([]),
        handleMarkingsMouseDown,
        handleMarkingsMouseDrag,
        handleMarkingsMouseUp,
        handleMarkingsMouseLeave: () => {
            removeInProgress();
            setActiveMarking(null);
        }
    }
}

const toggleElementInArray = (array: any[], element: any) => {
    const index = array.findIndex(item => 
        Object.entries(element).every(([key, value]) => item[key] === value)
    );
    if (index === -1) {
        array.push(element);
    } else {
        array.splice(index, 1);
    }
    return array;
}

// Modified version of https://github.com/frogcat/canvas-arrow
export function drawArrow(
    fromX: number, 
    fromY: number, 
    toX: number, 
    toY: number, 
    canvas: SVGSVGElement, 
    skinny: boolean = false,
    color: string = 'orange'
): void {
    const size = canvas.viewBox.baseVal.width;
    const width = (size / 80) * (skinny ? 0.75 : 1);
    const arrowHeadWidth = (size / 32) * (skinny ? 0.75 : 1);
    const arrowHeadHeight = (size / -21.5) * (skinny ? 0.75 : 1);
    const offset = size / 21;
    let dx = toX - fromX;
    let dy = toY - fromY;
    let len = Math.sqrt((dx * dx + dy * dy));

    const sin = dy / len;
    const cos = dx / len;

    fromX += offset * cos;
    fromY += offset * sin;
    toX -= skinny ? cos * 11 : cos;
    toY -= skinny ? sin * 11 : sin; // Fixed: was using cos instead of sin
    dx = toX - fromX;
    dy = toY - fromY;
    len = Math.sqrt((dx * dx + dy * dy));

    const controlPoints: number[] = [0, width, arrowHeadHeight, width, arrowHeadHeight, arrowHeadWidth];
    const coordinates: number[] = [];
    coordinates.push(0, 0);
    for (let i = 0; i < controlPoints.length; i += 2) {
      const x = controlPoints[i];
      const y = controlPoints[i + 1];
      coordinates.push(x < 0 ? len + x : x, y);
    }
    coordinates.push(len, 0);
    for (let i = controlPoints.length; i > 0; i -= 2) {
      const x = controlPoints[i - 2];
      const y = controlPoints[i - 1];
      coordinates.push(x < 0 ? len + x : x, -y);
    }
    coordinates.push(0, 0);
    let points = '';
    for (let i = 0; i < coordinates.length; i += 2) {
      const x = coordinates[i] * cos - coordinates[i + 1] * sin + fromX;
      const y = coordinates[i] * sin + coordinates[i + 1] * cos + fromY;
      points += `${x},${y} `;
    }
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', color);
    canvas.appendChild(polygon);
}