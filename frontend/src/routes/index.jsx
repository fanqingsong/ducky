import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import ProcessList from '../pages/ProcessList'
import InstanceList from '../pages/InstanceList'
import WorkflowDemo from '../pages/WorkflowDemo'
import WorkflowFlow from '../pages/WorkflowFlow'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/processes" element={<ProcessList />} />
      <Route path="/instances" element={<InstanceList />} />
      <Route path="/demo" element={<WorkflowDemo />} />
      <Route path="/flow" element={<WorkflowFlow />} />
    </Routes>
  )
}

export default AppRoutes

