'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type {
  RetrospectiveCardPublic,
  RetrospectiveColumn,
  RetrospectiveTimerState,
} from '@pokaface/shared'
import { useIdentity } from '@/hooks/useIdentity'
import { useRetrospective } from '@/hooks/useRetrospective'
import { getBackendUrl } from '@/lib/backendUrl'
import { useSocket } from '@/hooks/useSocket'
import { NameForm } from '@/components/home/NameForm'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UserIdentityControl } from '@/components/UserIdentityControl'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ConnectionBadge } from '@/components/room/ConnectionBadge'

const backendUrl = getBackendUrl()

const COLUMNS: Array<{
  key: RetrospectiveColumn
  emoji: string
  title: string
  meaning: string
  className: string
  cardShades: string[]
}> = [
  {
    key: 'loved',
    emoji: '❤️',
    title: 'What went well',
    meaning: 'Positive outcomes, practices, and moments to keep.',
    className: 'bg-rose-100/85 border-rose-300/70',
    cardShades: [
      'bg-rose-200/90 border-rose-300/80',
      'bg-rose-100 border-rose-300/70',
      'bg-pink-100 border-pink-300/70',
    ],
  },
  {
    key: 'learned',
    emoji: '💡',
    title: 'What we learned',
    meaning: 'Lessons, discoveries, and insights from the sprint.',
    className: 'bg-emerald-100/85 border-emerald-300/70',
    cardShades: [
      'bg-emerald-200/90 border-emerald-300/80',
      'bg-emerald-100 border-emerald-300/70',
      'bg-teal-100 border-teal-300/70',
    ],
  },
  {
    key: 'lacked',
    emoji: '🧩',
    title: 'What could be better',
    meaning: 'Gaps, friction, and improvements for next time.',
    className: 'bg-amber-100/85 border-amber-300/70',
    cardShades: [
      'bg-amber-200/90 border-amber-300/80',
      'bg-amber-100 border-amber-300/70',
      'bg-yellow-100 border-yellow-300/70',
    ],
  },
  {
    key: 'longed',
    emoji: '✨',
    title: 'What we want next',
    meaning: 'Changes, support, and experiments to try next.',
    className: 'bg-sky-100/85 border-sky-300/70',
    cardShades: [
      'bg-sky-200/90 border-sky-300/80',
      'bg-sky-100 border-sky-300/70',
      'bg-cyan-100 border-cyan-300/70',
    ],
  },
  {
    key: 'kudos',
    emoji: '👏',
    title: 'Kudos',
    meaning: 'Recognition and thanks for teammates.',
    className: 'bg-violet-100/85 border-violet-300/70',
    cardShades: [
      'bg-violet-200/90 border-violet-300/80',
      'bg-fuchsia-100 border-fuchsia-300/70',
      'bg-indigo-100 border-indigo-300/70',
    ],
  },
]

function cardShade(cardId: string, shades: string[]) {
  let hash = 0

  for (let index = 0; index < cardId.length; index += 1) {
    hash = ((hash << 5) - hash + cardId.charCodeAt(index)) | 0
  }

  return shades[(hash >>> 0) % shades.length]
}

function CopyRetroLinkButton({ retroId }: { retroId: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/retrospective/${retroId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Button onClick={handleCopy} variant={copied ? 'secondary' : 'primary'} size="sm">
      {copied ? 'Copied' : 'Copy Link'}
    </Button>
  )
}

function AppreciationIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-6.716-4.35-9-8.318C1.32 9.758 3.432 6 7.09 6c2.04 0 3.187 1.126 4.01 2.21C11.723 7.126 12.87 6 14.91 6 18.568 6 20.68 9.758 21 12.682 18.716 16.65 12 21 12 21Z" />
    </svg>
  )
}

function formatTimer(totalMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(totalMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getDisplayedRemainingMs(timer: RetrospectiveTimerState, nowMs: number) {
  if (timer.status !== 'running' || !timer.startedAt) {
    return timer.remainingMs
  }

  const startedAtMs = Date.parse(timer.startedAt)
  if (Number.isNaN(startedAtMs)) {
    return timer.remainingMs
  }

  const elapsedMs = Math.max(0, nowMs - startedAtMs)
  return Math.max(0, timer.remainingMs - elapsedMs)
}

function RetroTimeUpBanner({ timer }: { timer: RetrospectiveTimerState }) {
  const [visible, setVisible] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const mounted = useRef(false)
  const wasExpired = useRef(false)

  useEffect(() => {
    setNowMs(Date.now())
    if (timer.status !== 'running') return

    const interval = window.setInterval(() => {
      setNowMs(Date.now())
    }, 250)

    return () => window.clearInterval(interval)
  }, [timer.status, timer.startedAt, timer.remainingMs])

  const remainingMs = useMemo(
    () => getDisplayedRemainingMs(timer, nowMs),
    [timer, nowMs],
  )

  useEffect(() => {
    const isExpired = remainingMs <= 0

    if (!mounted.current) {
      mounted.current = true
      wasExpired.current = isExpired
      return
    }

    if (isExpired && !wasExpired.current) {
      setVisible(true)
      const timeout = window.setTimeout(() => setVisible(false), 1800)
      wasExpired.current = true
      return () => window.clearTimeout(timeout)
    }

    wasExpired.current = isExpired
  }, [remainingMs])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-vote-start rounded-2xl bg-red-600 px-10 py-7 text-center text-white shadow-2xl">
        <div className="mb-3 text-5xl">⏱️</div>
        <p className="text-2xl font-bold tracking-wide">Time&apos;s up!</p>
      </div>
    </div>
  )
}

function RetroTimerPanel({
  timer,
  isModerator,
  onUpdate,
  onStart,
  onPause,
  onReset,
}: {
  timer: RetrospectiveTimerState
  isModerator: boolean
  onUpdate: (durationMs: number) => void
  onStart: () => void
  onPause: () => void
  onReset: () => void
}) {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    setNowMs(Date.now())
    if (timer.status !== 'running') return

    const interval = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [timer.status, timer.startedAt, timer.remainingMs])

  const displayedRemainingMs = useMemo(
    () => getDisplayedRemainingMs(timer, nowMs),
    [timer, nowMs],
  )
  const hasExpired = displayedRemainingMs <= 0
  const isRunning = timer.status === 'running' && !hasExpired
  const canEdit = isModerator && !isRunning
  const iconButtonClass = 'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
  const timerStepMs = 30 * 1000

  const decreaseTimer = () => {
    if (!canEdit) return
    onUpdate(Math.max(timerStepMs, timer.durationMs - timerStepMs))
  }

  const increaseTimer = () => {
    if (!canEdit) return
    onUpdate(timer.durationMs + timerStepMs)
  }

  return (
    <section className="inline-flex h-9 max-w-full items-center gap-1 rounded-md border border-slate-300/80 bg-white/75 px-2 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/10">
      <div className="min-w-[3.25rem] px-1 text-center font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
        {formatTimer(displayedRemainingMs)}
      </div>
      {hasExpired && (
        <span className="whitespace-nowrap rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-red-700 dark:bg-red-950/60 dark:text-red-300">
          Time&apos;s up
        </span>
      )}
      {isModerator && (
        <>
          <span className="mx-0.5 h-4 w-px bg-slate-300 dark:bg-white/15" />
          <div className="flex h-7 w-6 shrink-0 flex-col overflow-hidden rounded-md border border-slate-300/70 dark:border-white/15">
            <button
              type="button"
              onClick={increaseTimer}
              disabled={!canEdit}
              aria-label="Increase timer by 30 seconds"
              title="+30 seconds"
              className="flex h-1/2 items-center justify-center text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 15l6-6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={decreaseTimer}
              disabled={!canEdit || timer.durationMs <= timerStepMs}
              aria-label="Decrease timer by 30 seconds"
              title="-30 seconds"
              className="flex h-1/2 items-center justify-center border-t border-slate-300/70 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={isRunning ? onPause : onStart}
            disabled={hasExpired}
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
            title={isRunning ? 'Pause timer' : 'Start timer'}
            className={iconButtonClass}
          >
            {isRunning ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M7 5h3v14H7zm7 0h3v14h-3z" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={isRunning}
            aria-label="Reset timer"
            title="Reset timer"
            className={iconButtonClass}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 3v6h6" />
            </svg>
          </button>
        </>
      )}
    </section>
  )
}

function CardComposer({
  column,
  onAdd,
}: {
  column: RetrospectiveColumn
  onAdd: (column: RetrospectiveColumn, body: string, showAuthor: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [body, setBody] = useState('')
  const [showAuthor, setShowAuthor] = useState(false)

  const resetForm = () => {
    setBody('')
    setShowAuthor(false)
  }

  const handleClose = () => {
    resetForm()
    setExpanded(false)
  }

  const handleSubmit = () => {
    if (!body.trim()) return
    onAdd(column, body.trim(), showAuthor)
    resetForm()
    setExpanded(false)
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-500/80 bg-white/70 px-3 py-2 text-sm font-medium text-slate-900 shadow-sm backdrop-blur-sm transition-colors hover:border-slate-700 hover:bg-white dark:border-slate-600 dark:bg-white/75 dark:text-slate-900 dark:hover:border-slate-800 dark:hover:bg-white"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add a card
      </button>
    )
  }

  return (
    <form onSubmit={e => { e.preventDefault(); handleSubmit() }} className="space-y-3 rounded-lg border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur-sm dark:border-white/80 dark:bg-white/75">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">Add a card</span>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Collapse card composer"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-white/70"
          title="Close"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 rotate-45" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Add a card"
        maxLength={500}
        className="w-full min-h-24 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 placeholder:text-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand resize-y dark:border-slate-300 dark:bg-white dark:text-slate-900 dark:caret-slate-900"
        style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#0f172a' }}
      />
      <label className="flex items-center gap-2 text-sm text-slate-800">
        <input
          type="checkbox"
          checked={showAuthor}
          onChange={e => setShowAuthor(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 bg-white accent-brand"
        />
        Show my name
      </label>
      <div className="flex gap-2">
        <Button type="submit" onClick={handleSubmit} disabled={!body.trim()} size="sm" className="flex-1 shadow-sm">
          Add Card
        </Button>
        <Button type="button" onClick={handleClose} variant="secondary" size="sm">
          Cancel
        </Button>
      </div>
    </form>
  )
}

function ActionItemComposer({
  selectedCards,
  onAdd,
  onClear,
}: {
  selectedCards: RetrospectiveCardPublic[]
  onAdd: (body: string, showAuthor: boolean, ownerName: string | null, linkedCardIds: string[]) => void
  onClear: () => void
}) {
  const [body, setBody] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [showAuthor, setShowAuthor] = useState(false)

  const resetForm = () => {
    setBody('')
    setOwnerName('')
    setShowAuthor(false)
  }

  const handleSubmit = () => {
    if (!body.trim() || selectedCards.length === 0) return
    onAdd(
      body.trim(),
      showAuthor,
      ownerName.trim() || null,
      selectedCards.map(card => card.cardId),
    )
    resetForm()
    onClear()
  }

  return (
    <section className="rounded border border-slate-300 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Action item</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Linked to {selectedCards.length} selected card{selectedCards.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button type="button" onClick={onClear} variant="secondary" size="sm">
          Clear
        </Button>
      </div>
      <form onSubmit={e => { e.preventDefault(); handleSubmit() }} className="grid gap-3 lg:grid-cols-[1fr_14rem_auto] lg:items-start">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Action item"
          maxLength={500}
          className="min-h-20 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 placeholder:text-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand dark:border-slate-300 dark:bg-white dark:text-slate-900"
          style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#0f172a' }}
        />
        <div className="space-y-2">
          <input
            value={ownerName}
            onChange={e => setOwnerName(e.target.value)}
            placeholder="Owner"
            maxLength={80}
            className="h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-900 caret-slate-900 placeholder:text-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand dark:border-slate-300 dark:bg-white dark:text-slate-900"
            style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#0f172a' }}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={showAuthor}
              onChange={e => setShowAuthor(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 bg-white accent-brand"
            />
            Show my name
          </label>
        </div>
        <Button type="submit" disabled={!body.trim()} size="sm" className="min-h-10">
          Add Action
        </Button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {selectedCards.map(card => (
          <span key={card.cardId} className="max-w-[16rem] truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:bg-white/10 dark:text-slate-200">
            {card.body}
          </span>
        ))}
      </div>
    </section>
  )
}

function ActionItemCard({
  card,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  card: RetrospectiveCardPublic
  onEdit: (cardId: string, body: string, showAuthor: boolean, ownerName?: string | null) => void
  onDelete: (cardId: string) => void
  onToggleStatus: (cardId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(card.body)
  const [ownerName, setOwnerName] = useState(card.ownerName ?? '')
  const [showAuthor, setShowAuthor] = useState(card.showAuthor)
  const isDone = card.actionStatus === 'done'

  const save = () => {
    if (!body.trim()) return
    onEdit(card.cardId, body.trim(), showAuthor, ownerName.trim() || null)
    setEditing(false)
  }

  return (
    <article className={`rounded border border-slate-300 bg-white/80 p-3 shadow-sm ${isDone ? 'opacity-75' : ''}`}>
      {editing ? (
        <form onSubmit={e => { e.preventDefault(); save() }} className="space-y-3">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            maxLength={500}
            className="min-h-20 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 focus:outline-none focus:ring-2 focus:ring-brand dark:border-slate-300 dark:bg-white dark:text-slate-900"
            style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#0f172a' }}
          />
          <input
            value={ownerName}
            onChange={e => setOwnerName(e.target.value)}
            placeholder="Owner"
            maxLength={80}
            className="h-9 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-900 caret-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand dark:border-slate-300 dark:bg-white dark:text-slate-900"
            style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#0f172a' }}
          />
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={showAuthor}
              onChange={e => setShowAuthor(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 bg-white accent-brand"
            />
            Show my name
          </label>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!body.trim()}>Save</Button>
            <Button onClick={() => { setEditing(false); setBody(card.body); setOwnerName(card.ownerName ?? ''); setShowAuthor(card.showAuthor) }} variant="secondary" size="sm">
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDone ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {isDone ? 'Done' : 'Open'}
            </span>
            <button
              type="button"
              onClick={() => onToggleStatus(card.cardId)}
              className="text-xs font-medium text-slate-700 hover:text-slate-950"
            >
              {isDone ? 'Reopen' : 'Mark Done'}
            </button>
          </div>
          <p className={`whitespace-pre-wrap break-words text-sm text-slate-900 ${isDone ? 'line-through decoration-slate-500/70' : ''}`}>
            {card.body}
          </p>
          {card.ownerName && (
            <p className="text-xs text-slate-700">Owner: {card.ownerName}</p>
          )}
          {card.linkedCards.length > 1 && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Linked to {card.linkedCards.length} cards
              </p>
              <div className="flex flex-wrap gap-1.5">
                {card.linkedCards.map(linkedCard => (
                  <span key={linkedCard.cardId} className="max-w-[10rem] truncate rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                    {linkedCard.body}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            {card.canEdit && (
              <button type="button" onClick={() => setEditing(true)} className="text-xs text-slate-800 hover:opacity-80 transition-opacity">
                Edit
              </button>
            )}
            {card.canDelete && (
              <button type="button" onClick={() => onDelete(card.cardId)} className="text-xs text-red-500 dark:text-red-700 hover:text-red-300 dark:hover:text-red-800 transition-colors">
                Delete
              </button>
            )}
          </div>
          {card.authorName && (
            <div className="text-xs text-slate-700 break-words">
              {card.authorName}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function RetroCard({
  card,
  colorClassName,
  selected,
  actionItems,
  onEdit,
  onDelete,
  onToggleLike,
  onToggleSelect,
  onToggleActionItemStatus,
}: {
  card: RetrospectiveCardPublic
  colorClassName: string
  selected: boolean
  actionItems: RetrospectiveCardPublic[]
  onEdit: (cardId: string, body: string, showAuthor: boolean, ownerName?: string | null) => void
  onDelete: (cardId: string) => void
  onToggleLike: (cardId: string) => void
  onToggleSelect: (cardId: string) => void
  onToggleActionItemStatus: (cardId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(card.body)
  const [showAuthor, setShowAuthor] = useState(card.showAuthor)

  const save = () => {
    if (!body.trim()) return
    onEdit(card.cardId, body.trim(), showAuthor)
    setEditing(false)
  }

  return (
    <article className={`rounded border p-3 space-y-3 ${selected ? 'ring-2 ring-brand ring-offset-2 ring-offset-transparent' : ''} ${colorClassName}`}>
      {editing ? (
        <form onSubmit={e => { e.preventDefault(); save() }} className="space-y-3">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            maxLength={500}
            className="w-full min-h-24 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 caret-slate-900 focus:outline-none focus:ring-2 focus:ring-brand resize-y dark:border-slate-300 dark:bg-white dark:text-slate-900 dark:caret-slate-900"
            style={{ colorScheme: 'light', backgroundColor: '#ffffff', color: '#0f172a' }}
          />
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={showAuthor}
              onChange={e => setShowAuthor(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 bg-white accent-brand"
            />
            Show my name
          </label>
          <div className="flex gap-2">
            <Button type="submit" onClick={save} size="sm" disabled={!body.trim()}>Save</Button>
            <Button onClick={() => { setEditing(false); setBody(card.body); setShowAuthor(card.showAuthor) }} variant="secondary" size="sm">
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect(card.cardId)}
                className="h-4 w-4 rounded border-slate-300 bg-white accent-brand"
              />
              Select
            </label>
          </div>
          <p className="text-sm text-slate-900 whitespace-pre-wrap break-words">{card.body}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onToggleLike(card.cardId)}
                aria-label={card.likedByMe ? `Remove appreciation from card. ${card.likeCount} total.` : `Appreciate card. ${card.likeCount} total.`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${card.likedByMe ? 'border-brand bg-brand text-white' : 'border-slate-400/80 bg-white/70 text-slate-800 hover:bg-white'}`}
                title={card.likedByMe ? 'Unlike' : 'Like'}
              >
                <AppreciationIcon filled={card.likedByMe} />
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] leading-none ${card.likedByMe ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {card.likeCount}
                </span>
              </button>
              {card.canEdit && (
                <button type="button" onClick={() => setEditing(true)} className="text-xs text-slate-800 hover:opacity-80 transition-opacity">
                  Edit
                </button>
              )}
              {card.canDelete && (
                <button type="button" onClick={() => onDelete(card.cardId)} className="text-xs text-red-500 dark:text-red-700 hover:text-red-300 dark:hover:text-red-800 transition-colors">
                  Delete
                </button>
              )}
            </div>
            {card.authorName && (
              <div className="text-xs text-slate-700 break-words">
                {card.authorName}
              </div>
            )}
          </div>
          {actionItems.length > 0 && (
            <div className="space-y-2 border-t border-slate-400/30 pt-3">
              {actionItems.map(actionItem => (
                <ActionItemCard
                  key={actionItem.cardId}
                  card={actionItem}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleStatus={onToggleActionItemStatus}
                />
              ))}
            </div>
          )}
        </>
      )}
    </article>
  )
}

export default function RetrospectiveBoardPage({ params }: { params: { retroId: string } }) {
  const router = useRouter()
  const { identity, setName, synced } = useIdentity()
  const { socket, connected, reconnecting } = useSocket(backendUrl)
  const { state, addCard, editCard, deleteCard, toggleLike, addActionItem, toggleActionItemStatus, updateTimer, startTimer, pauseTimer, resetTimer } = useRetrospective(
    params.retroId,
    identity,
    socket,
    connected,
  )
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])
  const allCards = useMemo(() => state.retrospective?.cards ?? [], [state.retrospective?.cards])
  const selectedCards = useMemo(() => {
    const selectedIds = new Set(selectedCardIds)
    return allCards.filter(card => card.kind === 'normal' && selectedIds.has(card.cardId))
  }, [allCards, selectedCardIds])
  const actionItemsByNormalCardId = useMemo(() => {
    const actionItems = allCards.filter(card => card.kind === 'action_item')
    const actionMap = new Map<string, RetrospectiveCardPublic[]>()

    for (const actionItem of actionItems) {
      for (const linkedCardId of actionItem.linkedCardIds) {
        const existing = actionMap.get(linkedCardId) ?? []
        existing.push(actionItem)
        actionMap.set(linkedCardId, existing)
      }
    }

    return actionMap
  }, [allCards])

  useEffect(() => {
    const normalCardIds = new Set(allCards.filter(card => card.kind === 'normal').map(card => card.cardId))
    setSelectedCardIds(current => current.filter(cardId => normalCardIds.has(cardId)))
  }, [allCards])

  const toggleSelectedCard = (cardId: string) => {
    setSelectedCardIds(current => (
      current.includes(cardId)
        ? current.filter(selectedCardId => selectedCardId !== cardId)
        : [...current, cardId]
    ))
  }

  const clearSelectedCards = () => setSelectedCardIds([])

  if (synced && !identity.name) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Retrospective</h1>
          <p className="text-slate-700 dark:text-slate-200">Enter your name to join the board</p>
        </div>
        <NameForm defaultName="" onContinue={setName} />
      </div>
    )
  }

  if (!connected && !state.retrospective) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-pulse mb-4"><div className="w-16 h-16 bg-surface-2 rounded-lg mx-auto" /></div>
          <p className="text-slate-900 dark:text-white">Connecting...</p>
        </div>
      </div>
    )
  }

  if (state.connecting) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-pulse mb-4"><div className="w-16 h-16 bg-surface-2 rounded-lg mx-auto" /></div>
          <p className="text-slate-900 dark:text-white">Joining retrospective...</p>
        </div>
      </div>
    )
  }

  if (!state.retrospective) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-red-400">{state.error ?? 'Retrospective not found'}</p>
          <Button onClick={() => router.push('/retrospective')}>Go Back</Button>
        </div>
      </div>
    )
  }

  const title = state.retrospective.title || 'Sprint Retrospective'

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8">
      <RetroTimeUpBanner timer={state.retrospective.timer} />
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-start gap-4">
            <Link href="/">
              <Button variant="secondary" size="sm">
                Home
              </Button>
            </Link>
            <div className="flex flex-col items-start gap-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white break-words">{title}</h1>
              <RetroTimerPanel
                timer={state.retrospective.timer}
                isModerator={state.isModerator}
                onUpdate={updateTimer}
                onStart={startTimer}
                onPause={pauseTimer}
                onReset={resetTimer}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <UserIdentityControl name={identity.name} onRename={setName} />
            <ThemeToggle />
            <ConnectionBadge connected={connected} reconnecting={reconnecting} />
            <Link href="/retrospective"><Button variant="secondary" size="sm">New Retro</Button></Link>
            <CopyRetroLinkButton retroId={params.retroId} />
          </div>
        </header>

        {state.error && (
          <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg text-red-400 text-sm">
            {state.error}
          </div>
        )}

        <section className="flex flex-wrap gap-2">
          {state.retrospective.participants.map(participant => (
            <div key={participant.participantId} className="flex items-center gap-2 px-3 py-2 bg-surface-1 border border-surface-3 rounded-full">
              <Avatar seed={participant.name} size={20} />
              <span className="text-xs text-slate-900 dark:text-white">{participant.name}</span>
              {participant.isModerator && <span className="text-[10px] text-brand">moderator</span>}
              <span className={`h-2 w-2 rounded-full ${participant.isConnected ? 'bg-green-400' : 'bg-surface-3'}`} />
            </div>
          ))}
        </section>

        {selectedCards.length > 0 && (
          <ActionItemComposer
            selectedCards={selectedCards}
            onAdd={addActionItem}
            onClear={clearSelectedCards}
          />
        )}

        <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {COLUMNS.map(column => {
            const cards = state.retrospective!.cards.filter(card => card.kind === 'normal' && card.column === column.key)
            return (
              <section key={column.key} className={`border rounded p-4 flex flex-col gap-3 min-h-[520px] ${column.className}`}>
                <div className="flex min-h-24 flex-col">
                  <h2 className="flex min-h-10 items-start gap-2 text-xl font-semibold text-slate-900">
                    <span aria-hidden="true">{column.emoji}</span>
                    {column.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-700">{column.meaning}</p>
                </div>
                <CardComposer column={column.key} onAdd={addCard} />
                <div className="space-y-3">
                  {cards.map(card => (
                    <RetroCard
                      key={card.cardId}
                      card={card}
                      colorClassName={cardShade(card.cardId, column.cardShades)}
                      selected={selectedCardIds.includes(card.cardId)}
                      actionItems={actionItemsByNormalCardId.get(card.cardId) ?? []}
                      onEdit={editCard}
                      onDelete={deleteCard}
                      onToggleLike={toggleLike}
                      onToggleSelect={toggleSelectedCard}
                      onToggleActionItemStatus={toggleActionItemStatus}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </main>
      </div>
    </div>
  )
}
