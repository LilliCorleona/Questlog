import React from 'react'
import ReactDOM from 'react-dom/client'
import TagesLog from './tageslog-final.jsx'
import Questboard from './questboard-final.jsx'

const path = window.location.pathname

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {path === '/questboard' ? <Questboard /> : <TagesLog />}
  </React.StrictMode>
)
