import { AuthProvider } from './context/AuthContext'
import { RouterProvider } from 'react-router-dom'  // ← add this
import router from './router'                        // ← change this
import { Toaster } from 'react-hot-toast'

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />              {/* ← change this */}
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