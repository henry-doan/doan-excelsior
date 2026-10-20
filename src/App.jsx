import { useState } from 'react'
import { WorkbookContext } from './context/WorkbookContext.js'
import { createWorkbookStore } from './lib/workbookStore.js'
import CastleGate from './components/CastleGate.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import Workspace from './components/Workspace.jsx'

const App = () => {
  // The lazy initializer creates the store once for the life of the app.
  const [store] = useState(createWorkbookStore)
  // Arrival goes castle gate → loading screen → the app, which renders underneath throughout.
  const [phase, setPhase] = useState('gate')
  // A file chosen at the gate starts opening behind the loading screen.
  const [fileToOpen, setFileToOpen] = useState(null)

  const enterKeep = (file) => {
    setFileToOpen(file)
    setPhase('loading')
  }

  return (
    <WorkbookContext value={store}>
      <Workspace inert={phase !== 'app'} fileToOpen={fileToOpen} />
      {phase === 'gate' && <CastleGate onEnter={enterKeep} />}
      {phase === 'loading' && <SplashScreen onDone={() => setPhase('app')} />}
    </WorkbookContext>
  )
}

export default App
