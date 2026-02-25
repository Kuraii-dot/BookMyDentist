import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'

import Landing from '../pages/Landing'
import Login from '../pages/Login'
import Register from '../pages/Register'
import ClinicDetail from '../pages/ClinicDetail'
import ProfileEdit from '../pages/ProfileEdit'

// Customer
import CustomerLayout from '../pages/customer/CustomerLayout'
import CustomerDashboard from '../pages/customer/CustomerDashboard'
import MyAppointments from '../pages/customer/MyAppointment'
import BookAppointment from '../pages/customer/BookAppointment'
import BrowseClinics from '../pages/customer/BrowseClinics'

// Clinic
import ClinicLayout from '../pages/clinic/ClinicLayout'
import ClinicDashboard from '../pages/clinic/ClinicDashboard'
import AppointmentRequests from '../pages/clinic/AppointmentRequests'
import ManageServices from '../pages/clinic/ManageServices'
import ClinicProfile from '../pages/clinic/ClinicProfile'
import ClinicAvailability from '../pages/clinic/ClinicAvailability'

// Admin
import SuperAdminDashboard from '../pages/admin/SuperAdminDashboard'

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/clinic/:id', element: <ClinicDetail /> },

  // Customer routes
  {
    path: '/dashboard',
    element: <ProtectedRoute allowedRoles={['customer']}><CustomerLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <CustomerDashboard /> },
      { path: 'appointments', element: <MyAppointments /> },
      { path: 'browse', element: <BrowseClinics /> },
      { path: 'profile', element: <ProfileEdit /> },
    ]
  },
  {
    path: '/book/:clinicId',
    element: <ProtectedRoute allowedRoles={['customer']}><BookAppointment /></ProtectedRoute>
  },

  // Clinic routes
  {
    path: '/clinic',
    element: <ProtectedRoute allowedRoles={['clinic_owner']}><ClinicLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <ClinicDashboard /> },
      { path: 'appointments', element: <AppointmentRequests /> },
      { path: 'services', element: <ManageServices /> },
      { path: 'availability', element: <ClinicAvailability /> },
      { path: 'profile', element: <ClinicProfile /> },
      { path: 'account', element: <ProfileEdit /> },
    ]
  },

  // Admin
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>
  }
])

export default router