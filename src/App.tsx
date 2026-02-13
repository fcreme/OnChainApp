import { BrowserRouter as Router } from 'react-router-dom'
import AnimatedRoutes from './pages/components/AnimatedRoutes'
import Layout from './pages/components/Layout'

function App() {
  return (
    <Router>
      <Layout>
        <AnimatedRoutes />
      </Layout>
    </Router>
  )
}

export default App
