import { Link, Outlet } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <div style={{ maxWidth: '1126px', width: '100%', margin: '0 auto', borderInline: '1px solid var(--border)', minHeight: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <nav style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
        <Link to="/">Home</Link> | <Link to="/about">About</Link> | <Link to="/dashboard">Dashboard</Link>
      </nav>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  )
}

export default App
