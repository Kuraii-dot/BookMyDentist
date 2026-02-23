import { AuthProvider } from './context/AuthContext'
import AppRouter from './router'
import { Toaster } from 'react-hot-toast'

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            background: '#fff',
            color: '#1c1917',
            border: '1px solid #fde68a',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#fb923c', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  )
}