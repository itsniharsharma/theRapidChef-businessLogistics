import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { CustomerCartProvider } from './context/CustomerCartContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CustomerCartProvider>
        <App />
      </CustomerCartProvider>
    </AuthProvider>
  </StrictMode>,
)
