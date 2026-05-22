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
    className: 'bg-rose-100/80 border-rose-300/70 dark:bg-rose-300/10 dark:border-rose-200/15',
    cardShades: [
      'bg-rose-200/85 border-rose-300/80 dark:bg-rose-300/20 dark:border-rose-200/20',
      'bg-rose-100 border-rose-300/70 dark:bg-rose-200/15 dark:border-rose-100/20',
      'bg-pink-100 border-pink-300/70 dark:bg-pink-300/15 dark:border-pink-100/20',
    ],
  },
  {
    key: 'learned',
    emoji: '💡',
    title: 'What we learned',
    meaning: 'Lessons, discoveries, and insights from the sprint.',
    className: 'bg-emerald-100/80 border-emerald-300/70 dark:bg-emerald-300/10 dark:border-emerald-200/15',
    cardShades: [
      'bg-emerald-200/85 border-emerald-300/80 dark:bg-emerald-300/20 dark:border-emerald-200/20',
      'bg-emerald-100 border-emerald-300/70 dark:bg-emerald-200/15 dark:border-emerald-100/20',
      'bg-teal-100 border-teal-300/70 dark:bg-teal-300/15 dark:border-teal-100/20',
    ],
  },
  {
    key: 'lacked',
    emoji: '🧩',
    title: 'What could be better',
    meaning: 'Gaps, friction, and improvements for next time.',
    className: 'bg-amber-100/80 border-amber-300/70 dark:bg-amber-300/10 dark:border-amber-200/15',
    cardShades: [
      'bg-amber-200/85 border-amber-300/80 dark:bg-amber-300/20 dark:border-amber-200/20',
      'bg-amber-100 border-amber-300/70 dark:bg-amber-200/15 dark:border-amber-100/20',
      'bg-yellow-100 border-yellow-300/70 dark:bg-yellow-300/15 dark:border-yellow-100/20',
    ],
  },
  {
    key: 'longed',
    emoji: '✨',
    title: 'What we want next',
    meaning: 'Changes, support, and experiments to try next.',
    className: 'bg-sky-100/80 border-sky-300/70 dark:bg-sky-300/10 dark:border-sky-200/15',
    cardShades: [
      'bg-sky-200/85 border-sky-300/80 dark:bg-sky-300/20 dark:border-sky-200/20',
      'bg-sky-100 border-sky-300/70 dark:bg-sky-200/15 dark:border-sky-100/20',
      'bg-cyan-100 border-cyan-300/70 dark:bg-cyan-300/15 dark:border-cyan-100/20',
    ],
  },
  {
    key: 'kudos',
    emoji: '👏',
    title: 'Kudos',
    meaning: 'Recognition and thanks for teammates.',
    className: 'bg-violet-100/80 border-violet-300/70 dark:bg-violet-300/10 dark:border-violet-200/15',
    cardShades: [
      'bg-violet-200/85 border-violet-300/80 dark:bg-violet-300/20 dark:border-violet-200/20',
      'bg-fuchsia-100 border-fuchsia-300/70 dark:bg-fuchsia-300/15 dark:border-fuchsia-100/20',
      'bg-indigo-100 border-indigo-300/70 dark:bg-indigo-300/15 dark:border-indigo-100/20',
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
    <Button onClick={handleCopy} variant="secondary" size="sm">
      {copied ? 'Copied' : 'Copy Link'}
    </Button>
  )
}

function CardComposer({
  column,
  onAdd,
}: {
  column: RetrospectiveColumn
  onAdd: (column: RetrospectiveColumn, body: string, showAuthor: boolean) => void
}) {
  const [body, setBody] = useState('')
  const [showAuthor, setShowAuthor] = useState(false)

  const handleSubmit = () => {
    if (!body.trim()) return
    onAdd(column, body.trim(), showAuthor)
    setBody('')
    setShowAuthor(false)
  }

  return (
    <form onSubmit={e => { e.preventDefault(); handleSubmit() }} className="space-y-3">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Add a card"
        maxLength={500}
        className="w-full min-h-24 px-3 py-2 bg-surface-2 border border-surface-3 rounded text-sm text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-y"
      />
      <label className="flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={showAuthor}
          onChange={e => setShowAuthor(e.target.checked)}
          className="h-4 w-4 rounded border-surface-3 bg-surface-2 accent-brand"
        />
        Show my name
      </label>
      <Button type="submit" onClick={handleSubmit} disabled={!body.trim()} size="sm" className="w-full">
        Add Card
      </Button>
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
            className="w-full min-h-24 px-3 py-2 bg-surface-2 border border-surface-3 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand resize-y"
          />
          <label className="flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={showAuthor}
              onChange={e => setShowAuthor(e.target.checked)}
              className="h-4 w-4 rounded border-surface-3 bg-surface-2 accent-brand"
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
          <p className="text-sm text-white whitespace-pre-wrap break-words">{card.body}</p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-white truncate">{card.authorName ?? 'Anonymous'}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleLike(card.cardId)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${card.likedByMe ? 'border-brand bg-brand text-white' : 'border-surface-3 text-white hover:bg-surface-2/60'}`}
                title={card.likedByMe ? 'Unlike' : 'Like'}
              >
                {card.likedByMe ? 'Liked' : 'Like'} {card.likeCount}
              </button>
              {card.canEdit && (
                <button type="button" onClick={() => setEditing(true)} className="text-xs text-white hover:opacity-80 transition-opacity">
                  Edit
                </button>
              )}
              {card.canDelete && (
                <button type="button" onClick={() => onDelete(card.cardId)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                  Delete
                </button>
              )}
            </div>
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
          <h1 className="text-3xl font-bold text-white mb-1">Retrospective</h1>
          <p className="text-white">Enter your name to join the board</p>
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
          <p className="text-white">Connecting...</p>
        </div>
      </div>
    )
  }

  if (state.connecting) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-pulse mb-4"><div className="w-16 h-16 bg-surface-2 rounded-lg mx-auto" /></div>
          <p className="text-white">Joining retrospective...</p>
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
            <div>
              <h1 className="text-3xl font-bold text-white break-words">{title}</h1>
              <p className="text-sm text-white">Retrospective ID: <code>{params.retroId}</code></p>
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
              <span className="text-xs text-white">{participant.name}</span>
              {participant.isModerator && <span className="text-[10px] text-brand">moderator</span>}
              <span className={`h-2 w-2 rounded-full ${participant.isConnected ? 'bg-green-400' : 'bg-surface-3'}`} />
            </div>
          ))}
        </section>

        <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {COLUMNS.map(column => {
            const cards = state.retrospective!.cards.filter(card => card.column === column.key)
            return (
              <section key={column.key} className={`border rounded p-4 flex flex-col gap-4 min-h-[520px] ${column.className}`}>
                <div className="flex min-h-32 flex-col">
                  <h2 className="flex min-h-14 items-start gap-2 text-xl font-semibold text-white">
                    <span aria-hidden="true">{column.emoji}</span>
                    {column.title}
                  </h2>
                  <p className="mt-1 text-sm text-white">{column.meaning}</p>
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
