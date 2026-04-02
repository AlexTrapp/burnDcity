import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuthStore } from '../store/auth.js'
import { getAllCityNfts, partitionNfts } from '../api/hiveEngine.js'
import AccountHeader from './AccountHeader.jsx'
import BurnPanel from './BurnPanel.jsx'
import NftGrid from './NftGrid.jsx'
import CombinedSection from './CombinedSection.jsx'
import DelegatedSection from './DelegatedSection.jsx'
import BurnOneModal from './BurnOneModal.jsx'

export default function BurnView() {
  const username = useAuthStore(s => s.username)
  const [excluded, setExcluded] = useState(new Set())
  const [pendingBurnGroup, setPendingBurnGroup] = useState(null)

  function handleBurned(ids) {
    const burnedSet = new Set(ids)
    setAllNfts(prev => prev ? prev.filter(n => !burnedSet.has(n._id)) : prev)
    setExcluded(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.delete(id))
      return next
    })
  }

  const [allNfts, setAllNfts]       = useState(null)
  const [nextOffset, setNextOffset] = useState(0)
  const [hasMore, setHasMore]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)
  const [nodeStatus, setNodeStatus] = useState(null)
  const [error, setError]           = useState(null)

  // Use refs so the async callbacks always see fresh setters
  const nodeStatusRef = useRef(null)
  nodeStatusRef.current = setNodeStatus

  // Incremented on every new load — callbacks from a superseded load are ignored
  const loadIdRef = useRef(0)

  const loadNfts = useCallback(async (startOffset, existing) => {
    const loadId = ++loadIdRef.current
    setLoading(true)
    setError(null)
    setNodeStatus(null)
    try {
      const { nfts, nextOffset: next, hasMore: more } = await getAllCityNfts(
        username,
        startOffset,
        count => {
          if (loadIdRef.current !== loadId) return // stale fetch — discard
          // Math.max so out-of-order batches never make the counter go backwards
          setLoadedCount(prev => Math.max(prev, startOffset + count))
        },
        msg => {
          if (loadIdRef.current !== loadId) return
          nodeStatusRef.current(msg)
        },
      )
      if (loadIdRef.current !== loadId) return // superseded before completion
      setAllNfts([...(existing ?? []), ...nfts])
      setNextOffset(next)
      setHasMore(more)
    } catch (e) {
      if (loadIdRef.current !== loadId) return
      setError(e.message)
    } finally {
      if (loadIdRef.current === loadId) setLoading(false)
    }
  }, [username])

  // Initial load
  useEffect(() => {
    setAllNfts(null)
    setNextOffset(0)
    setHasMore(false)
    setLoadedCount(0)
    setNodeStatus(null)
    setError(null)
    loadNfts(0, null)
  }, [loadNfts])

  function handleLoadMore() {
    loadNfts(nextOffset, allNfts)
  }

  function reload() {
    setAllNfts(null)
    setNextOffset(0)
    setHasMore(false)
    setLoadedCount(0)
    setNodeStatus(null)
    setError(null)
    loadNfts(0, null)
  }

  function toggleExcludeGroup(ids) {
    setExcluded(prev => {
      const next = new Set(prev)
      const allExcluded = ids.every(id => next.has(id))
      if (allExcluded) ids.forEach(id => next.delete(id))
      else ids.forEach(id => next.add(id))
      return next
    })
  }

  const { combined, burnable, delegated } = useMemo(
    () => allNfts ? partitionNfts(allNfts) : { combined: [], burnable: [], delegated: [] },
    [allNfts]
  )

  const selected = useMemo(
    () => burnable.filter(n => !excluded.has(n._id)),
    [burnable, excluded]
  )

  return (
    <div className="flex flex-col min-h-screen">
      <AccountHeader onReload={reload} />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-200">Recover Your SIM</h2>
          <p className="text-sm text-zinc-500 mt-1">
            The city is closing. Select the cards you want to burn below — all are selected by default.
          </p>
        </div>

        {loading && (
          <div className="space-y-1.5">
            <p className="text-sm text-zinc-500">
              Loading your cards…{loadedCount > 0 && ` ${loadedCount.toLocaleString()} found so far`}
            </p>
            {loadedCount > 0 && (
              <div className="h-1 w-48 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full rounded-full bg-amber-600 animate-pulse" style={{ width: '100%' }} />
              </div>
            )}
            {nodeStatus && (
              <p className="text-xs text-amber-600">{nodeStatus}</p>
            )}
          </div>
        )}

        {error && (
          <div className="space-y-2">
            <p className="text-sm text-red-400">Failed to load cards: {error}</p>
            <button
              onClick={() => loadNfts(nextOffset, allNfts)}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-2"
            >
              Retry from {nextOffset.toLocaleString()}
            </button>
          </div>
        )}

        {allNfts && (
          <>
            <BurnPanel
              username={username}
              selectedNfts={selected}
              onBurned={handleBurned}
            />

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                  Your Cards
                  {hasMore && !loading && (
                    <span className="ml-2 text-amber-600 normal-case font-normal">— more not yet loaded</span>
                  )}
                </h3>
                {excluded.size > 0 && (
                  <button
                    onClick={() => setExcluded(new Set())}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Select all
                  </button>
                )}
              </div>

              <NftGrid nfts={burnable} excluded={excluded} onToggleGroup={toggleExcludeGroup} onBurnOne={setPendingBurnGroup} />

              {hasMore && !loading && (
                <button
                  onClick={handleLoadMore}
                  className="mt-2 rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  Load more cards (loaded {allNfts.length.toLocaleString()} so far)
                </button>
              )}
            </section>

            <CombinedSection username={username} combinedNfts={combined} onBurned={handleBurned} />
            <DelegatedSection delegatedNfts={delegated} />
          </>
        )}
      </main>

      <footer className="border-t border-zinc-800 px-6 py-4 text-center">
        <p className="text-xs text-zinc-600">
          dCity Burn Tool — we had a great run.
        </p>
      </footer>

      {pendingBurnGroup && (
        <BurnOneModal
          username={username}
          group={pendingBurnGroup}
          onClose={() => setPendingBurnGroup(null)}
          onBurned={handleBurned}
        />
      )}
    </div>
  )
}
