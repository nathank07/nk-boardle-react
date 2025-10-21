import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Chess } from 'chess.js'

async function ChessTest() {
    const chess = new Chess();
    const puzzle = await fetch('/new-puzzle')
    const puzzleData = await puzzle.json()
    console.log(puzzleData)
    chess.load(puzzleData.fen)
    console.log(chess.ascii());
    return null;
}

function App() {
  const [count, setCount] = useState(0)

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
        <button onClick={() =>  {
            setCount((count) => count + 1)
            ChessTest()
        }
            }>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
