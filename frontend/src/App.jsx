import { BrowserRouter } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import AppRoutes from './routes'

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    </BrowserRouter>
  )
}

export default App

