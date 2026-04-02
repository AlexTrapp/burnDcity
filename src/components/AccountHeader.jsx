import { useAuthStore } from '../store/auth.js'

export default function AccountHeader({ onReload }) {
  const username = useAuthStore(s => s.username)
  const logout = useAuthStore(s => s.logout)

  return (
    <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Signed in as</span>
        <span className="text-sm font-medium text-amber-400">@{username}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <button
            onClick={onReload}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Reload cards
          </button>
          <p className="text-xs text-zinc-700 mt-0.5">this may take some time</p>
        </div>
        <button
          onClick={logout}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
