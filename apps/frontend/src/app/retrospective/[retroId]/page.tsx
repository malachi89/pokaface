'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { RetrospectiveCardPublic, RetrospectiveColumn } from '@pokaface/shared'
import { useIdentity } from '@/hooks/useIdentity'
import { useRetrospective } from '@/hooks/useRetrospective'
import { useSocket } from '@/hooks/useSocket'
import { NameForm } from '@/components/home/NameForm'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UserIdentityControl } from '@/components/UserIdentityControl'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ConnectionBadge } from '@/components/room/ConnectionBadge'

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? (process.env.NODE_ENV === 'production' ? 'https://api.pokaface.win' : 'http://localhost:3001')

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

function RetroCard({
  card,
  colorClassName,
  onEdit,
  onDelete,
  onToggleLike,
}: {
  card: RetrospectiveCardPublic
  colorClassName: string
  onEdit: (cardId: string, body: string, showAuthor: boolean) => void
  onDelete: (cardId: string) => void
  onToggleLike: (cardId: string) => void
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
    <article className={`rounded border p-3 space-y-3 ${colorClassName}`}>
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
        </>
      )}
    </article>
  )
}

export default function RetrospectiveBoardPage({ params }: { params: { retroId: string } }) {
  const router = useRouter()
  const { identity, setName, synced } = useIdentity()
  const { socket, connected, reconnecting } = useSocket(backendUrl)
  const { state, addCard, editCard, deleteCard, toggleLike } = useRetrospective(
    params.retroId,
    identity,
    socket,
    connected,
  )

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
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-start gap-4">
            <Link href="/">
              <Button variant="secondary" size="sm">
                Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white break-words">{title}</h1>
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

        <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {COLUMNS.map(column => {
            const cards = state.retrospective!.cards.filter(card => card.column === column.key)
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
                      onEdit={editCard}
                      onDelete={deleteCard}
                      onToggleLike={toggleLike}
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
