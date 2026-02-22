import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Dashboard from '../Dashboard'
import Transfers from '../Transfers'
import Memecoins from '../Memecoins'
import Markets from '../Markets'
import Analysis from '../Analysis'
import Reconciliation from '../Reconciliation'
import Audit from '../Audit'
import Settings from '../Settings'

export default function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/reconciliation" element={<Reconciliation />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/memecoins" element={<Memecoins />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/analysis" element={<Analysis />} />
      </Routes>
    </AnimatePresence>
  )
}
