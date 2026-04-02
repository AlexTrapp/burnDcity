const TYPE_LABELS = {
  '1st':      { label: '1st Edition', color: 'text-amber-400' },
  '2nd':      { label: '2nd Edition', color: 'text-zinc-300' },
  '3rd':      { label: '3rd Edition', color: 'text-zinc-400' },
  'citizen':  { label: 'Citizen',     color: 'text-zinc-500' },
  'combined': { label: 'Combined',    color: 'text-purple-400' },
}

export default function NftCard({ name, type, count, totalSim, excluded, onToggle, onBurnOne }) {
  const badge = TYPE_LABELS[type] ?? { label: type ?? '—', color: 'text-zinc-400' }

  return (
    <div
      onClick={onBurnOne}
      className={`cursor-pointer rounded-lg border p-3 transition-all select-none ${
        excluded
          ? 'border-zinc-800 bg-zinc-900 opacity-40'
          : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
      }`}
    >
      <p className="text-xs font-medium text-zinc-200 leading-snug">{name}</p>
      <p className={`text-xs mt-1 ${badge.color}`}>{badge.label}</p>

      <div className="mt-2 flex items-end justify-between gap-1">
        <span className="text-xs text-zinc-500">×{count}</span>
        <span className="text-sm font-semibold text-amber-400">
          {totalSim > 0 ? `${totalSim.toLocaleString()} SIM` : '—'}
        </span>
      </div>

      <div className="mt-1.5 text-right">
        <button
          onClick={e => { e.stopPropagation(); onToggle() }}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {excluded ? 'keeping' : 'burning'}
        </button>
      </div>
    </div>
  )
}
