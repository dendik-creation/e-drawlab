import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installProbe } from './probe'
import { audio } from './audio/director'

installProbe()
// The audio director outlives every scene, so it starts with the app rather
// than with whatever screen happens to be first.
audio.start()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
