import { useState } from 'react'
import { WorkbookContext } from './context/WorkbookContext.js'
import { createWorkbookStore } from './lib/workbookStore.js'
import SplashScreen from './components/SplashScreen.jsx'
import Workspace from './components/Workspace.jsx'

const App = () => {
  // The lazy initializer creates the store once for the life of the app.
  const [store] = useState(createWorkbookStore)
  const [showSplash, setShowSplash] = useState(true)

  return (
    <WorkbookContext value={store}>
      <Workspace inert={showSplash} />
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
    </WorkbookContext>
  )
}

export default App
