import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import { SKDB } from 'skdb'
import './App.css'

const resetSKDBOnReload = true

function App() {
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const runSKDB = async () => {
      const skdb = await SKDB.create(resetSKDBOnReload)
      skdb.sql('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)')
      skdb.sql(`INSERT INTO test (id, name) VALUES (1, 'test')`)
      const result = skdb.sql('SELECT * FROM test')

      return result
    }

    runSKDB().then(setResult)
  }, [])

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <h2>Result from SKDB</h2>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  )
}

export default App
