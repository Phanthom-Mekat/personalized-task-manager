import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import router from './router/router.jsx'
import ThemeProvider from './provider/ThemeProvider.jsx'
import AuthProvider from './provider/AuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
    <RouterProvider router={router} />
    </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
