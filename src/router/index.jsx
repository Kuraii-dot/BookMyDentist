import { Suspense, lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'

const Landing = lazy(() => import('../pages/Landing'))
const Login = lazy(() => import('../pages/Login'))
const Register = lazy(() => import('../pages/Register'))
const VerifyEmail = lazy(() => import('../pages/VerifyEmail'))
const ClinicDetail = lazy(() => import('../pages/ClinicDetail'))
const ProfileEdit = lazy(() => import('../pages/ProfileEdit'))
const AboutUs = lazy(() => import('../pages/AboutUs'))
const ContactUs = lazy(() => import('../pages/ContactUs'))
const BrowseServices = lazy(() => import('../pages/BrowseServices'))
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('../pages/TermsOfService'))

const CustomerLayout = lazy(() => import('../pages/customer/CustomerLayout'))
const CustomerDashboard = lazy(() => import('../pages/customer/CustomerDashboard'))
const MyAppointments = lazy(() => import('../pages/customer/MyAppointment'))
const BookAppointment = lazy(() => import('../pages/customer/BookAppointment'))
const BrowseClinics = lazy(() => import('../pages/customer/BrowseClinics'))

const ClinicLayout = lazy(() => import('../pages/clinic/ClinicLayout'))
const ClinicDashboard = lazy(() => import('../pages/clinic/ClinicDashboard'))
const AppointmentRequests = lazy(() => import('../pages/clinic/AppointmentRequests'))
const ManageServices = lazy(() => import('../pages/clinic/ManageServices'))
const ClinicProfile = lazy(() => import('../pages/clinic/ClinicProfile'))
const ClinicAvailability = lazy(() => import('../pages/clinic/ClinicAvailability'))
const ClinicReports = lazy(() => import('../pages/clinic/ClinicReports'))

const SuperAdminDashboard = lazy(() => import('../pages/admin/SuperAdminDashboard'))

function RouteLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center bg-slate-50">
      <div className="w-9 h-9 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function loadable(Component) {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Component />
    </Suspense>
  )
}

const routes = [
  { path: '/', element: loadable(Landing) },
  { path: '/login', element: loadable(Login) },
  { path: '/register', element: loadable(Register) },
  { path: '/verify-email', element: loadable(VerifyEmail) },
  { path: '/about', element: loadable(AboutUs) },
  { path: '/contact', element: loadable(ContactUs) },
  { path: '/browse', element: loadable(BrowseServices) },
  { path: '/clinic/:id', element: loadable(ClinicDetail) },
  { path: '/terms', element: loadable(TermsOfService) },
  { path: '/privacy', element: loadable(PrivacyPolicy) },

  {
    path: '/dashboard',
    element: <ProtectedRoute allowedRoles={['customer']}>{loadable(CustomerLayout)}</ProtectedRoute>,
    children: [
      { index: true, element: loadable(CustomerDashboard) },
      { path: 'appointments', element: loadable(MyAppointments) },
      { path: 'browse', element: loadable(BrowseClinics) },
      { path: 'profile', element: loadable(ProfileEdit) },
    ],
  },
  {
    path: '/book/:clinicId',
    element: <ProtectedRoute allowedRoles={['customer']}>{loadable(BookAppointment)}</ProtectedRoute>,
  },

  {
    path: '/clinic',
    element: <ProtectedRoute allowedRoles={['clinic_owner']}>{loadable(ClinicLayout)}</ProtectedRoute>,
    children: [
      { index: true, element: loadable(ClinicDashboard) },
      { path: 'appointments', element: loadable(AppointmentRequests) },
      { path: 'services', element: loadable(ManageServices) },
      { path: 'availability', element: loadable(ClinicAvailability) },
      { path: 'reports', element: loadable(ClinicReports) },
      { path: 'profile', element: loadable(ClinicProfile) },
      { path: 'account', element: loadable(ProfileEdit) },
    ],
  },

  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['super_admin']}>{loadable(SuperAdminDashboard)}</ProtectedRoute>,
  },
]

const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
  },
})

export default router
