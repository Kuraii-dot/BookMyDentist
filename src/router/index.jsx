import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import Landing from '../pages/Landing'
import Login from '../pages/Login'
import Register from '../pages/Register'

import CustomerLayout from '../pages/customer/CustomerLayout'
import CustomerClinicList from '../pages/customer/CustomerClinicList' 
import BookAppointment from '../pages/customer/BookAppointment'
import MyAppointments from '../pages/customer/MyAppointment'        
import CustomerProfile from '../pages/customer/CustomerProfile'


import ClinicLayout from '../pages/clinic/ClinicLayout'
import ClinicDashboard from '../pages/clinic/ClinicDashboard'
import AppointmentRequests from '../pages/clinic/AppointmentRequests' 
import ManageServices from '../pages/clinic/ManageServices'
import ClinicProfile from '../pages/clinic/ClinicProfile'

import SuperAdminDashboard from '../pages/admin/SuperAdminDashboard'
import ProtectedRoute from '../components/ProtectedRoute'

function RoleRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  const map = { super_admin: '/admin', clinic_owner: '/clinic', customer: '/dashboard' }
  return <Navigate to={map[profile.role] || '/dashboard'} replace />
}

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/me', element: <RoleRedirect /> },

  // Customer routes
  {
    path: '/dashboard',
    element: <ProtectedRoute allowedRoles={['customer']}><CustomerLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <CustomerClinicList /> },
      { path: 'book/:clinicId', element: <BookAppointment /> },
      { path: 'appointments', element: <MyAppointments /> },
      { path: 'profile', element: <CustomerProfile /> },
    ]
  },

  // Clinic routes
  {
    path: '/clinic',
    element: <ProtectedRoute allowedRoles={['clinic_owner']}><ClinicLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <ClinicDashboard /> },
      { path: 'appointments', element: <AppointmentRequests /> },
      { path: 'services', element: <ManageServices /> },
      { path: 'profile', element: <ClinicProfile /> },
    ]
  },

  // Admin routes
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>,
  },

  // Fallback
  { path: '*', element: <Navigate to="/" replace /> }
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}