import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ExperimentalPage from './ExperimentalPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ExperimentalPage />
  </StrictMode>,
)
