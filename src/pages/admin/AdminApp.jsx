import { Route, Routes } from 'react-router-dom'
import AuthProvider from '../../components/admin/AuthProvider'
import RequireAuth from '../../components/admin/RequireAuth'
import AdminLayout from '../../components/admin/AdminLayout'
import ToastProvider from '../../components/ui/ToastProvider'
import { ADMIN_NAV } from '../../lib/adminNav'
import Login from './Login'
import Dashboard from './Dashboard'
import Settings from './Settings'
import ProjectsList from './ProjectsList'
import ProjectEdit from './ProjectEdit'
import Messages from './Messages'
import ComingSoon from './ComingSoon'
import NotFound from '../NotFound'
import CrudPage from '../../components/admin/crud/CrudPage'
import { MODULES } from '../../lib/adminModules'

/** Admin pages by path. The simple list modules all use CrudPage with their config. */
const PAGES = {
  settings: <Settings />,
  projects: <ProjectsList />,
  messages: <Messages />,
  ...Object.fromEntries(
    Object.entries(MODULES).map(([path, config]) => [
      path,
      <CrudPage key={path} config={config} />,
    ]),
  ),
}

/** Everything under /admin. Loaded lazily so visitors never download it. */
export default function AdminApp() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            {ADMIN_NAV.filter((n) => n.path).map((n) => (
              <Route
                key={n.path}
                path={n.path}
                element={PAGES[n.path] ?? <ComingSoon title={n.label} />}
              />
            ))}
            <Route path="projects/:id" element={<ProjectEdit />} />
            <Route path="*" element={<NotFound admin />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
