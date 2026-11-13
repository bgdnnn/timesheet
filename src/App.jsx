import './App.css'
import { MotionConfig } from 'framer-motion'
import Pages from "@/pages/index.jsx"
import { Toaster } from "sonner"

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Pages />
      <Toaster />
    </MotionConfig>
  )
}

export default App 