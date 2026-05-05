import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import UploadPage from '@/pages/UploadPage'
import JobsPage from '@/pages/JobsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/upload" replace />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="*" element={<Navigate to="/upload" replace />} />
      </Route>
    </Routes>
  )
}
