'use client'

import { type RefObject, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toPng } from 'html-to-image'
import type {
  RetrospectiveCardPublic,
  RetrospectiveColumn,
  RetrospectiveState,
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

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'retroboard'
}

function formatExportDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatExportTimestamp(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function makeRetroEvidenceFileName(title: string, retroId: string, date: Date) {
  return `retroboard-${sanitizeFileName(title)}-${retroId}-${formatExportDate(date)}.png`
}

function DownloadRetroEvidenceButton({
  retroId,
  title,
  targetRef,
  onPrepare,
}: {
  retroId: string
  title: string
  targetRef: RefObject<HTMLDivElement>
  onPrepare: (date: Date) => void
}) {
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    const target = targetRef.current
    if (!target || preparing) return

    setPreparing(true)
    setError(null)

    const exportedAt = new Date()
    onPrepare(exportedAt)

    try {
      await new Promise<void>(resolve => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => resolve())
        })
      })

      const dataUrl = await toPng(target, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f8fafc',
        width: target.scrollWidth,
        height: target.scrollHeight,
      })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = makeRetroEvidenceFileName(title, retroId, exportedAt)
      link.click()
    } catch {
      setError('Could not create image')
    } finally {
      setPreparing(false)
    }
  }

  return (
      <div className="flex flex-col items-start gap-1">
      <Button onClick={handleDownload} variant="secondary" size="sm" disabled={preparing}>
        {preparing ? 'Preparing...' : 'Download Retro'}
      </Button>
      {error && <span className="text-xs text-red-500 dark:text-red-300">{error}</span>}
    </div>
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
    <section className="inline-flex h-11 max-w-full items-center gap-1.5 rounded-md border border-slate-300/80 bg-white/75 px-2.5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/10">
      <div className="min-w-[4.25rem] px-1.5 text-center font-mono text-base font-semibold tabular-nums text-slate-900 dark:text-white">
        {formatTimer(displayedRemainingMs)}
      </div>
      {hasExpired && (
        <span className="whitespace-nowrap rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-semibold leading-none text-red-700 dark:bg-red-950/60 dark:text-red-300">
          Time&apos;s up
        </span>
      )}
      {isModerator && (
        <>
          <span className="mx-0.5 h-5 w-px bg-slate-300 dark:bg-white/15" />
          <div className="flex h-8 w-7 shrink-0 flex-col overflow-hidden rounded-md border border-slate-300/70 dark:border-white/15">
            <button
              type="button"
              onClick={increaseTimer}
              disabled={!canEdit}
              aria-label="Increase timer by 30 seconds"
              title="+30 seconds"
              className="flex h-1/2 items-center justify-center text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
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
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
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
            className={`${iconButtonClass} h-8 w-8`}
          >
            {isRunning ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
                <path d="M7 5h3v14H7zm7 0h3v14h-3z" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor">
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
            className={`${iconButtonClass} h-8 w-8`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  normalCardId,
  onAdd,
  onClose,
}: {
  normalCardId: string
  onAdd: (body: string, showAuthor: boolean, ownerName: string | null, linkedCardIds: string[]) => void
  onClose: () => void
}) {
  const [body, setBody] = useState('')
  const [showAuthor, setShowAuthor] = useState(false)

  const resetForm = () => {
    setBody('')
    setShowAuthor(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = () => {
    if (!body.trim()) return
    onAdd(
      body.trim(),
      showAuthor,
      null,
      [normalCardId],
    )
    resetForm()
    onClose()
  }

  return (
    <form onSubmit={e => { e.preventDefault(); handleSubmit() }} className="space-y-3 rounded border border-red-300/80 bg-red-100 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Action item
        </span>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Collapse action item composer"
          className="inline-flex h-6 w-6 items-center justify-center rounded text-red-800 transition-colors hover:bg-red-200"
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
        placeholder="Action item"
        maxLength={500}
        className="min-h-20 w-full resize-y rounded border border-red-300 bg-white px-3 py-2 text-sm text-slate-900 caret-red-700 placeholder:text-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500"
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
        <Button type="submit" disabled={!body.trim()} size="sm" className="flex-1 shadow-sm">
          Add Action
        </Button>
        <Button type="button" onClick={handleClose} variant="secondary" size="sm">
          Cancel
        </Button>
      </div>
    </form>
  )
}

function ActionItemCard({
  card,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  card: RetrospectiveCardPublic
  onEdit: (cardId: string, body: string, showAuthor: boolean, ownerName?: string | null) => void
  onDelete: (cardId: string) => void
  onDragStart: (cardId: string) => void
  onDragEnd: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(card.body)
  const [showAuthor, setShowAuthor] = useState(card.showAuthor)

  const save = () => {
    if (!body.trim()) return
    onEdit(card.cardId, body.trim(), showAuthor, null)
    setEditing(false)
  }

  return (
    <article
      draggable={!editing}
      onDragStart={event => {
        event.dataTransfer.effectAllowed = 'copy'
        event.dataTransfer.setData('text/plain', card.cardId)
        onDragStart(card.cardId)
      }}
      onDragEnd={onDragEnd}
      className="cursor-grab rounded border border-red-300/80 bg-red-100 p-3 shadow-sm active:cursor-grabbing"
      title="Drag to copy this action item onto another card"
    >
      {editing ? (
        <form onSubmit={e => { e.preventDefault(); save() }} className="space-y-3">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            maxLength={500}
            className="min-h-20 w-full rounded border border-red-300 bg-white px-3 py-2 text-sm text-slate-900 caret-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-300 dark:bg-white dark:text-slate-900"
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
            <Button onClick={() => { setEditing(false); setBody(card.body); setShowAuthor(card.showAuthor) }} variant="secondary" size="sm">
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Action item
            </span>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm text-slate-900">
            {card.body}
          </p>
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
  actionItems,
  draggedActionItemId,
  onAddActionItem,
  onEdit,
  onDelete,
  onToggleLike,
  onDragActionItemStart,
  onDragActionItemEnd,
  onLinkActionItem,
}: {
  card: RetrospectiveCardPublic
  colorClassName: string
  actionItems: RetrospectiveCardPublic[]
  draggedActionItemId: string | null
  onAddActionItem: (body: string, showAuthor: boolean, ownerName: string | null, linkedCardIds: string[]) => void
  onEdit: (cardId: string, body: string, showAuthor: boolean, ownerName?: string | null) => void
  onDelete: (cardId: string) => void
  onToggleLike: (cardId: string) => void
  onDragActionItemStart: (cardId: string) => void
  onDragActionItemEnd: () => void
  onLinkActionItem: (actionItemCardId: string, normalCardId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(card.body)
  const [showAuthor, setShowAuthor] = useState(card.showAuthor)
  const [dropActive, setDropActive] = useState(false)
  const [actionItemComposerOpen, setActionItemComposerOpen] = useState(false)
  const alreadyLinkedDraggedItem = draggedActionItemId
    ? actionItems.some(actionItem => actionItem.cardId === draggedActionItemId)
    : false
  const canDropActionItem = Boolean(draggedActionItemId && !alreadyLinkedDraggedItem)

  useEffect(() => {
    if (!draggedActionItemId) setDropActive(false)
  }, [draggedActionItemId])

  const save = () => {
    if (!body.trim()) return
    onEdit(card.cardId, body.trim(), showAuthor)
    setEditing(false)
  }

  return (
    <article
      onDragEnter={() => {
        if (draggedActionItemId) setDropActive(true)
      }}
      onDragOver={event => {
        if (!draggedActionItemId) return
        event.preventDefault()
        event.dataTransfer.dropEffect = canDropActionItem ? 'copy' : 'none'
      }}
      onDragLeave={() => setDropActive(false)}
      onDrop={event => {
        event.preventDefault()
        setDropActive(false)
        if (!draggedActionItemId) return
        const actionItemId = event.dataTransfer.getData('text/plain') || draggedActionItemId
        if (actionItemId && !actionItems.some(actionItem => actionItem.cardId === actionItemId)) {
          onLinkActionItem(actionItemId, card.cardId)
        }
      }}
      className={`rounded border p-3 space-y-3 transition-shadow ${dropActive && canDropActionItem ? 'ring-2 ring-brand ring-offset-2 ring-offset-transparent' : ''} ${colorClassName}`}
    >
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
            <button
              type="button"
              onClick={() => setActionItemComposerOpen(open => !open)}
              aria-label="Add action item"
              title="Add action item"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-400/80 bg-red-100 text-red-700 transition-colors hover:bg-red-200 hover:text-red-900"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
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
          {actionItemComposerOpen && (
            <ActionItemComposer
              normalCardId={card.cardId}
              onAdd={onAddActionItem}
              onClose={() => setActionItemComposerOpen(false)}
            />
          )}
          {actionItems.length > 0 && (
            <div className="space-y-2 border-t border-slate-400/30 pt-3">
              {actionItems.map(actionItem => (
                <ActionItemCard
                  key={actionItem.cardId}
                  card={actionItem}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDragStart={onDragActionItemStart}
                  onDragEnd={onDragActionItemEnd}
                />
              ))}
            </div>
          )}
        </>
      )}
    </article>
  )
}

function EvidenceActionItemCard({ card }: { card: RetrospectiveCardPublic }) {
  const isDone = card.actionStatus === 'done'

  return (
    <article className="space-y-1 rounded border border-red-300 bg-red-50 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
          Action item
        </span>
        {card.actionStatus && (
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${isDone ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
            {isDone ? 'Done' : 'Open'}
          </span>
        )}
      </div>
      <p className={`whitespace-pre-wrap break-words text-xs leading-5 text-slate-900 ${isDone ? 'line-through decoration-slate-500/70' : ''}`}>
        {card.body}
      </p>
      {card.ownerName && (
        <p className="text-[11px] text-slate-700">Owner: {card.ownerName}</p>
      )}
      {card.authorName && (
        <p className="text-[11px] text-slate-600">Author: {card.authorName}</p>
      )}
    </article>
  )
}

function EvidenceRetroCard({
  card,
  colorClassName,
  actionItems,
}: {
  card: RetrospectiveCardPublic
  colorClassName: string
  actionItems: RetrospectiveCardPublic[]
}) {
  return (
    <article className={`space-y-2 rounded border p-3 ${colorClassName}`}>
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-900">{card.body}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
        {card.authorName ? <span>Author: {card.authorName}</span> : <span />}
        <span className="rounded-full bg-white/75 px-2 py-0.5 font-medium text-slate-800">
          Likes: {card.likeCount}
        </span>
      </div>
      {actionItems.length > 0 && (
        <div className="space-y-2 border-t border-slate-400/30 pt-2">
          {actionItems.map(actionItem => (
            <EvidenceActionItemCard key={actionItem.cardId} card={actionItem} />
          ))}
        </div>
      )}
    </article>
  )
}

function RetrospectiveEvidenceExport({
  retrospective,
  title,
  exportedAt,
  actionItemsByNormalCardId,
}: {
  retrospective: RetrospectiveState
  title: string
  exportedAt: Date
  actionItemsByNormalCardId: Map<string, RetrospectiveCardPublic[]>
}) {
  const displayedRemainingMs = getDisplayedRemainingMs(retrospective.timer, exportedAt.getTime())
  const timerStatus = displayedRemainingMs <= 0
    ? "Time's up"
    : retrospective.timer.status === 'running'
      ? 'Running'
      : 'Paused'

  return (
    <div className="w-[1600px] bg-slate-50 p-8 text-slate-900">
      <header className="mb-6 flex items-start justify-between gap-8 border-b border-slate-300 pb-5">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Retroboard evidence</p>
          <h1 className="break-words text-4xl font-bold leading-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">Retro ID: {retrospective.retroId}</p>
        </div>
        <div className="shrink-0 rounded border border-slate-300 bg-white px-4 py-3 text-right shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Exported</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{formatExportTimestamp(exportedAt)}</p>
        </div>
      </header>

      <section className="mb-6 rounded border border-slate-300 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">Participants</h2>
        <div className="flex flex-wrap gap-2">
          {retrospective.participants.map(participant => (
            <div key={participant.participantId} className="flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${participant.isConnected ? 'bg-green-500' : 'bg-slate-300'}`} />
              <span className="text-xs font-medium text-slate-900">{participant.name}</span>
              {participant.isModerator && <span className="text-[10px] font-semibold uppercase tracking-wide text-brand">moderator</span>}
            </div>
          ))}
        </div>
      </section>

      <main className="grid grid-cols-5 gap-4">
        {COLUMNS.map(column => {
          const cards = retrospective.cards.filter(card => card.kind === 'normal' && card.column === column.key)

          return (
            <section key={column.key} className={`flex min-h-[520px] flex-col gap-3 rounded border p-4 ${column.className}`}>
              <div className="min-h-24">
                <h2 className="flex min-h-10 items-start gap-2 text-xl font-semibold text-slate-900">
                  <span aria-hidden="true">{column.emoji}</span>
                  {column.title}
                </h2>
                <p className="mt-0.5 text-sm leading-5 text-slate-700">{column.meaning}</p>
              </div>
              <div className="space-y-3">
                {cards.length > 0 ? (
                  cards.map(card => (
                    <EvidenceRetroCard
                      key={card.cardId}
                      card={card}
                      colorClassName={cardShade(card.cardId, column.cardShades)}
                      actionItems={actionItemsByNormalCardId.get(card.cardId) ?? []}
                    />
                  ))
                ) : (
                  <div className="rounded border border-dashed border-slate-400/70 bg-white/45 px-3 py-6 text-center text-sm text-slate-600">
                    No cards
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}

export default function RetrospectiveBoardPage({ params }: { params: { retroId: string } }) {
  const router = useRouter()
  const { identity, setName, synced } = useIdentity()
  const { socket, connected, reconnecting } = useSocket(backendUrl)
  const { state, addCard, editCard, deleteCard, toggleLike, addActionItem, linkActionItem, updateTimer, startTimer, pauseTimer, resetTimer } = useRetrospective(
    params.retroId,
    identity,
    socket,
    connected,
  )
  const [draggedActionItemId, setDraggedActionItemId] = useState<string | null>(null)
  const [exportedAt, setExportedAt] = useState(() => new Date())
  const exportRef = useRef<HTMLDivElement>(null)
  const allCards = useMemo(() => state.retrospective?.cards ?? [], [state.retrospective?.cards])
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
      <div aria-hidden="true" className="pointer-events-none fixed left-[-12000px] top-0">
        <div ref={exportRef}>
          <RetrospectiveEvidenceExport
            retrospective={state.retrospective}
            title={title}
            exportedAt={exportedAt}
            actionItemsByNormalCardId={actionItemsByNormalCardId}
          />
        </div>
      </div>
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
            <DownloadRetroEvidenceButton
              retroId={params.retroId}
              title={title}
              targetRef={exportRef}
              onPrepare={setExportedAt}
            />
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
                      actionItems={actionItemsByNormalCardId.get(card.cardId) ?? []}
                      draggedActionItemId={draggedActionItemId}
                      onAddActionItem={addActionItem}
                      onEdit={editCard}
                      onDelete={deleteCard}
                      onToggleLike={toggleLike}
                      onDragActionItemStart={setDraggedActionItemId}
                      onDragActionItemEnd={() => setDraggedActionItemId(null)}
                      onLinkActionItem={linkActionItem}
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
