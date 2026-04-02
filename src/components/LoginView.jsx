import { useState } from 'react'
import { useAuthStore } from '../store/auth.js'

export default function LoginView() {
  const login = useAuthStore(s => s.login)
  const [username, setUsername] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const u = username.trim().toLowerCase()
    if (!u) return
    login(u)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-amber-400">
            dCity Burn Tool
          </h1>
          <p className="text-sm text-zinc-400">
            The city is closing. Recover your SIM.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-xs text-zinc-400 uppercase tracking-wider">
              Hive Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="yourusername"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Look up cards
          </button>
        </form>
      </div>
    </div>
  )
}
