/* eslint-disable react-refresh/only-export-components -- route config, not a component module */
import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import RouteError from './pages/RouteError'
import FullPageSpinner from './components/ui/FullPageSpinner'

// The admin panel is a separate chunk, so public visitors never download it.
const AdminApp = lazy(() => import('./pages/admin/AdminApp'))

export const router = createBrowserRouter([
  {
    // Pathless layout route so one error page covers everything.
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Home /> },
      {
        path: '/admin/*',
        element: (
          <Suspense fallback={<FullPageSpinner />}>
            <AdminApp />
          </Suspense>
        ),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])
