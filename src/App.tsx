import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Chess } from 'chess.js'
import ChessBoard, { getMovesForSquare } from './ChessBoard/ChessBoard.tsx'
import ChessBoardView, { getPreviousMove, getPieces } from './ChessBoard/ChessBoard.tsx'
import { Square, Color, PieceSymbol } from 'chess.js'

async function ChessTest(_) {
    const chess = new Chess();
    const puzzle = await fetch('/api/new-puzzle')
    const puzzleData = await puzzle.json()
    chess.load(puzzleData.fen)
    chess.move(puzzleData.firstMove)
    return chess;
}

function ChessTest2(_) {
    const chess = new Chess();
    const pgn = `
    [Event "FIDE record - The longest game ever played"]
[Site "Chess.com"]
[Date "2012.03.11"]
[Round "?"]
[White "MSC157"]
[Black "KimJongUn"]
[Result "1/2-1/2"]
[TimeControl "1/864000"]
[WhiteElo "2168"]
[BlackElo "1835"]
[Termination "Game drawn by agreement"]
[ECO "A05"]
[EndDate "2012.07.03"]
[Link "https://www.chess.com/game/daily/51161661?move=0"]

1. Nf3 Nf6 2. Ng1 Ng8 3. Nf3 Nf6 4. e3 d5 5. Ng1 Ng8 6. Nf3 Nf6 7. Ng1 Ng8 8.
Nc3 Nf6 9. Nf3 Nc6 10. Ne2 Bg4 11. Ng3 Bc8 12. d4 Bg4 13. Bd3 e6 14. Bf1 Ng8 15.
Bd3 Nb8 16. Nf1 Ba3 17. N1d2 Bf8 18. O-O Nf6 19. Re1 Bd6 20. Nf1 O-O 21. Re2 Re8
22. N1d2 Re7 23. Kf1 Rd7 24. Ke1 Bb4 25. a3 Rd6 26. Kf1 Rc6 27. Re1 Ra6 28. Ke2
Ra4 29. Nf1 Na6 30. Qd2 Nc5 31. Rd1 Nce4 32. Re1 Ng3+ 33. Kd1 Nh1 34. Qe2 Ne4
35. Bd2 Neg3 36. Kc1 Nh5 37. Kb1 Nf4 38. Ka2 Nh3 39. Reb1 Ng1 40. Bc4 Qh4 41.
Bb3 Qg3 42. Bc1 Bf8 43. c3 Qd6 44. Qc2 f6 45. N1d2 Kf7 46. Bc4 Ke7 47. Nb3 Bh5
48. Bd2 Be8 49. Rc1 Bd7 50. h3 Nxh3 51. Rab1 Bc8 52. Ka1 Ra6 53. Na5 Qc5 54. Ba2
Rd6 55. Nb3 Rd7 56. Qf5 Kd6 57. Rc2 g6 58. Bc1 Rg7 59. Qe4 Rg8 60. Qd3 Rh8 61.
Qd2 Ke7 62. Qd1 Ke8 63. Qe1 Qd6 64. Qf1 Qd8 65. Qa6 Ng5 66. Qd6 Ne4 67. Re2 Nc5
68. Re1 Na6 69. Nbd2 Nb8 70. Bc4 Ng3 71. Rh1 Nf5 72. Ka2 Ne7 73. Ra1 Ng8 74. Kb1
Nh6 75. Kc2 Ng8 76. Kd1 Nh6 77. Ke1 Ng8 78. Ng1 Nh6 79. Bf1 Ng8 80. Nb1 Nh6 81.
Qb6 Ng8 82. Qb3 Nh6 83. Qd1 Ng8 84. Rh2 Nh6 85. Rh1 Ng8 86. Rh4 Kd7 87. Bb5+ Kd6
88. Ke2 e5 89. Be8 Bg4+ 90. Kd3 Be2+ 91. Kc2 Bf1 92. Qg4 Ne7 93. Qc8 Nf5 94. Kb3
Ng3 95. Nf3 Ne2 96. Nbd2 Ng1 97. Ka4 Rg8 98. Rh5 Nc6 99. Rh6 Na5 100. Rxh7 Nb3
101. Ne4+ dxe4 102. Rh8 Nd2 103. Qf5 Rg7 104. Rg8 Nb1 105. Rh8 Rh7 106. Qf4 Rh6
107. Rh7 Rh5 108. Rh6 Rh4 109. Rh5 Rh3 110. Rh4 Rh2 111. Rh3 Rh1 112. Rh2 Qd7+
113. Kb4 Qc6 114. Ka5 Qc4 115. Ra2 Qe2 116. Bd2 Qd1 117. Rh3 Kd5 118. Rh4 Kc4
119. Rh5 Kd3 120. Rh6 Ke2 121. Rh7 Rd8 122. Rh8 Rd7 123. Rh7 Bc5 124. Nh2 Rd6
125. Bc1 Ke1 126. Qh6 Rb6 127. a4 Bd6 128. Qh3 Rc6 129. Qc8 Rb6 130. Ra3 Rc6
131. Rb3 Rb6 132. Rb4 Rc6 133. Rc4 Rb6 134. Rc5 Rc6 135. Rd5 Rc4 136. Rb5 Rc5
137. b3 Rc6 138. Ba3 Be7 139. Ng4 Bd8 140. Bf8 Be7 141. Nh6 Ba3 142. Ng8 Bc1
143. Rh8 Rc4 144. Rd5 Rb4 145. Rd8 Rc4 146. Qe6 Rxc3 147. Ra8 Rc2 148. Bd7 Ra2
149. Bc8 Ra1 150. Kb4 Qe2 151. Kc5 Kd1 152. Qe8 Qe1 153. Kd5 Ra2 154. Ke6 Ra1
155. Kd7 Ra2 156. Kd8 Ra1 157. Rh7 Rh2 158. Rh6 Rh3 159. Rh5 Rh4 160. Rg5 Rh5
161. Rf5 Rg5 162. Rf4 Rf5 163. Rf3 Rf4 164. Rg3 Rf3 165. Rh3 Rg3 166. Rh4 Rh3
167. Rh5 Rh4 168. Rg5 Rh5 169. Rf5 Rg5 170. Rf3 Rf5 171. Rb8 Rf4 172. Rg3 Rf3
173. Rh3 Rg3 174. Rh4 Rh3 175. Rh5 Rh4 176. Rg5 Rh5 177. Rf5 Rg5 178. Rf4 Rf5
179. Rf3 Rf4 180. Rg3 Rf3 181. Rh3 Rg3 182. Rh4 Rh3 183. Rh8 Rh1 184. Ra8 Rh2
185. d5 Rh3 186. d6 Rh4 187. d7 Rh5 188. Ke7 Rh6 189. d8=N Rh7+ 190. Ke6 Rh6 1/2-1/2`
    chess.loadPgn(pgn);
    return chess;
}

function ChessTest3(chessGame) {
    if (chessGame.fen() == '8/r5pk/3R4/p1p3PK/Pp6/8/2P5/b7 w - - 9 38') {
        const chess = new Chess();
        chess.load("r1bq1rk1/pp4pp/2nbp3/3p4/3Pn3/P2B1N2/1P2NPPP/R1BQR1K1 b - - 0 13");
        return chess;
    } else {
        const chess = new Chess();
        chess.load("8/r5pk/3R4/p1p3PK/Pp6/8/2P5/b7 w - - 9 38");
        return chess;
    }
}

function ChessTest4(chessGame) {
    if (chessGame.fen() == '4Q3/8/8/8/8/8/2k5/K7 w - - 0 1') {
        const chess = new Chess();
        chess.load("8/4P3/8/8/8/8/2k5/K7 w - - 0 1");
        return chess;
    } else {
        const chess = new Chess();
        chess.load("4Q3/8/8/8/8/8/2k5/K7 w - - 0 1");
        return chess;
    }
}

function ChessTest5(chessGame) {
    if (chessGame.fen() == '8/7P/8/8/8/8/2k5/K7 w - - 0 1') {
        const chess = new Chess();
        chess.load("R7/8/8/8/8/8/2k5/K7 w - - 0 1");
        return chess;
    } else {
        const chess = new Chess();
        chess.load("8/7P/8/8/8/8/2k5/K7 w - - 0 1");
        return chess;
    }
}

function ChessTest6(chessGame) {
    if (chessGame.fen() == 'rnbqkb1r/ppppp1Pp/5n2/8/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1') {
        const chess = new Chess();
        chess.load("rnbqkb1Q/ppppp2p/5n2/8/8/8/PPPP1PPP/RNBQKBNR w KQq - 0 1");
        return chess;
    }
    else {
        const chess = new Chess();
        chess.load("rnbqkb1r/ppppp1Pp/5n2/8/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1");
        return chess;
    }
}

function App() {
  const [count, setCount] = useState(0)
  const [chessGame, setChessGame] = useState(new Chess())
  const [pieces, setPieces] = useState(getPieces(chessGame));
  const [colorPerspective, setColorPerspective] = useState('w')


  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={async () =>  {
            setCount((count) => count + 1)
            const newChessGame = await ChessTest(chessGame);
            setChessGame(newChessGame);
            setPieces(getPieces(newChessGame));
        }}>
          count is {count}
        </button>
        <button onClick={() => {
            setColorPerspective(colorPerspective === 'w' ? 'b' : 'w')
        }}>
            Flip Perspective (Currently {colorPerspective})
        </button>
        <button onClick={() => {
            chessGame?.undo();
            setPieces(getPieces(chessGame));
        }}>
            Back
        </button>

        <ChessBoardView
            pieces={pieces}
            pxSize={750}
            colorPerspective={colorPerspective as Color}
            moveFunctionForDragging={(from: Square, to: Square, promotion?: PieceSymbol) => {
                chessGame.move(!promotion ? { from, to } : { from, to, promotion });
                setPieces(getPieces(chessGame));
            }}
            showAvailableMovesForSquare={(squares) => getMovesForSquare(chessGame, squares)}
            showPreviousMove={() => getPreviousMove(chessGame)}
        />

        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
          </div>
          {/* <Example /> */}
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
