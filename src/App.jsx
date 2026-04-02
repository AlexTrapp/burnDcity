import { useAuthStore } from './store/auth.js'
import LoginView from './components/LoginView.jsx'
import BurnView from './components/BurnView.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

export default function App() {
  const username = useAuthStore(s => s.username)

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        {username ? <BurnView /> : <LoginView />}
      </div>
    </ErrorBoundary>
  )
}
