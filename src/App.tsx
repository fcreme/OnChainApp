import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Transfers from './pages/Transfers'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transfers" element={<Transfers />} />
      </Routes>
    </Router>
  )
}

export default App
