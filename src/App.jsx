import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Chess } from 'chess.js'
import ChessBoard from './ChessBoard.tsx'

async function ChessTest() {
    const chess = new Chess();
    const puzzle = await fetch('/api/new-puzzle')
    const puzzleData = await puzzle.json()
    chess.load(puzzleData.fen)
    chess.move(puzzleData.firstMove)
    return chess;
}

function App() {
  const [count, setCount] = useState(0)
  const [chessGame, setChessGame] = useState(null)
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
            const chess = await ChessTest()
            setChessGame(chess)
            console.log(chess.turn())
        }}>
          count is {count}
        </button>
        <button onClick={() => {
            setColorPerspective(colorPerspective === 'w' ? 'b' : 'w')
        }}>
            Flip Perspective (Currently {colorPerspective})
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
        {chessGame && (
        <ChessBoard pxSize={750} chessGame={chessGame} colorPerspective={colorPerspective} />
      )}
      
      {/* <Example /> */}
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
