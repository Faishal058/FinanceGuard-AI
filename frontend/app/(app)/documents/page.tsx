'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard } from '@/components/common/glass-card'
import { PageHeader, SectionHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { pageVariants, containerVariants, itemVariants } from '@/lib/animations'
import { formatShortDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Document } from '@/lib/types'
import { ApiClient } from '@/lib/api-client'
import {
  Upload, FileText, File, Table2, CheckCircle2, Loader2,
  AlertCircle, Trash2, Eye, Download, Search, Plus, X, CheckCircle,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────
   TOAST NOTIFICATION
───────────────────────────────────────────────────────── */
function Toast({ message, type, onClose }: {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96 }}
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl max-w-sm',
        type === 'success'
          ? 'bg-success/10 border-success/25 text-success'
          : 'bg-destructive/10 border-destructive/25 text-destructive'
      )}
    >
      {type === 'success'
        ? <CheckCircle className="h-5 w-5 shrink-0" />
        : <AlertCircle className="h-5 w-5 shrink-0" />
      }
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────
   FILE ICON
───────────────────────────────────────────────────────── */
function FileTypeIcon({ type }: { type: Document['type'] }) {
  const map: Record<Document['type'], { Icon: React.ElementType; color: string; bg: string }> = {
    pdf: { Icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10' },
    spreadsheet: { Icon: Table2, color: 'text-green-400', bg: 'bg-green-500/10' },
    statement: { Icon: File, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    other: { Icon: File, color: 'text-muted-foreground', bg: 'bg-surface-3' },
  }
  const { Icon, color, bg } = map[type] ?? map.other
  return (
    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
      <Icon className={cn('h-5 w-5', color)} strokeWidth={1.7} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   DRAG & DROP ZONE
───────────────────────────────────────────────────────── */
function DropZone({
  onFilesDropped, onBrowseClick, uploading,
}: {
  onFilesDropped: (files: FileList) => void
  onBrowseClick: () => void
  uploading: boolean
}) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesDropped(e.dataTransfer.files)
    }
  }

  return (
    <motion.div
      variants={itemVariants}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={uploading ? undefined : onBrowseClick}
      className={cn(
        'relative rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200 group',
        uploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
        dragOver
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border hover:border-primary/40 hover:bg-surface-2/50'
      )}
    >
      <div className={cn(
        'absolute inset-0 rounded-2xl transition-opacity duration-300',
        'bg-gradient-to-br from-primary/5 to-secondary/5',
        dragOver ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
      )} />

      <div className="relative">
        <div className={cn(
          'mx-auto mb-4 h-16 w-16 rounded-2xl flex items-center justify-center transition-colors',
          uploading ? 'bg-primary/20' : 'bg-primary/10'
        )}>
          {uploading
            ? <Loader2 className="h-8 w-8 text-primary animate-spin" strokeWidth={1.5} />
            : <Upload className="h-8 w-8 text-primary" strokeWidth={1.5} />
          }
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {uploading
            ? 'Processing your document…'
            : dragOver ? 'Drop files here' : 'Upload Financial Documents'
          }
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {uploading
            ? 'AI agents are parsing and indexing your file. This may take up to a minute.'
            : 'Drag and drop, or click to browse'
          }
        </p>
        {!uploading && (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['PDF', 'CSV', 'Excel', 'Word'].map(ext => (
                <Badge key={ext} variant="outline" size="sm">{ext}</Badge>
              ))}
            </div>
            <p className="text-xs text-tertiary mt-3">Max file size: 50MB</p>
          </>
        )}
        {uploading && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-1.5 w-48 bg-surface-3 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: ['5%', '85%'] }}
                transition={{ duration: 50, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────
   DOCUMENT ROW
───────────────────────────────────────────────────────── */
function DocumentRow({ doc, onDelete }: { doc: Document; onDelete: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex items-center gap-4 rounded-xl bg-surface-2 p-4 hover:bg-surface-3 transition-smooth"
    >
      <FileTypeIcon type={doc.type} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground text-sm truncate">{doc.name}</p>
          <StatusBadge status={doc.status} size="xs" />
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-muted-foreground">{doc.size}MB</span>
          <span className="text-xs text-tertiary">•</span>
          <span className="text-xs text-muted-foreground">{formatShortDate(new Date(doc.uploadedAt))}</span>
          {doc.chunks && (
            <>
              <span className="text-xs text-tertiary">•</span>
              <span className="text-xs text-muted-foreground">{doc.chunks} chunks indexed</span>
            </>
          )}
        </div>
        {doc.status === 'processing' && (
          <Progress value={65} variant="gradient" size="xs" animated className="mt-2 max-w-[120px]" />
        )}
      </div>

      <div className="shrink-0">
        {doc.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-success" />}
        {doc.status === 'processing' && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
        {doc.status === 'failed' && <AlertCircle className="h-5 w-5 text-destructive" />}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-smooth">
        <Button variant="ghost" size="icon-sm" title="Preview">
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" title="Download">
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Delete"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(doc.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────
   DOCUMENTS PAGE
───────────────────────────────────────────────────────── */
export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | Document['status']>('all')
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDocuments = useCallback(async () => {
    try {
      const res = await ApiClient.get('/api/v2/documents')
      setDocuments(res.documents || [])
    } catch (e) {
      console.error('Failed to load documents', e)
      setDocuments([])
    }
  }, [])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  const uploadFile = async (file: File) => {
    if (uploading) return
    setUploading(true)
    try {
      await ApiClient.uploadFile('/api/v2/documents', file)
      await loadDocuments()
      setToast({ message: `"${file.name}" uploaded and indexed successfully!`, type: 'success' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed. Please try again.'
      setToast({ message: msg, type: 'error' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleBrowseClick = () => { if (!uploading) fileInputRef.current?.click() }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
  }

  const handleFilesDropped = async (files: FileList) => {
    const file = files[0]
    if (file) await uploadFile(file)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? All associated analyses will be purged.')) return
    try {
      await ApiClient.delete('/api/v2/documents', { id })
      await loadDocuments()
      setToast({ message: 'Document deleted successfully.', type: 'success' })
    } catch {
      setToast({ message: 'Failed to delete document.', type: 'error' })
    }
  }

  const filtered = documents.filter(doc => {
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || doc.status === filter
    return matchSearch && matchFilter
  })

  const stats = {
    total: documents.length,
    completed: documents.filter(d => d.status === 'completed').length,
    processing: documents.filter(d => d.status === 'processing').length,
    totalChunks: documents.reduce((acc, d) => acc + (d.chunks ?? 0), 0),
  }

  return (
    <motion.div
      className="space-y-8 p-6 md:p-8 max-w-[1400px] mx-auto"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".pdf,.csv,.xlsx,.xls,.doc,.docx"
      />

      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      <PageHeader
        title="Documents"
        description="Upload and manage your financial documents for AI analysis"
        actions={
          <Button
            variant="gradient"
            size="sm"
            leftIcon={uploading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Plus className="h-3.5 w-3.5" />
            }
            glow
            onClick={handleBrowseClick}
            disabled={uploading}
          >
            {uploading ? 'Processing…' : 'Upload'}
          </Button>
        }
      />

      {/* Stats */}
      <motion.div variants={containerVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Files', value: stats.total },
          { label: 'Processed', value: stats.completed, color: 'text-success' },
          { label: 'Processing', value: stats.processing, color: 'text-primary' },
          { label: 'Vector Chunks', value: stats.totalChunks },
        ].map((s, i) => (
          <motion.div key={i} variants={itemVariants}>
            <GlassCard padding="md" className="text-center">
              <p className={cn('text-2xl font-bold tabular-nums', s.color ?? 'text-foreground')}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      <DropZone
        onFilesDropped={handleFilesDropped}
        onBrowseClick={handleBrowseClick}
        uploading={uploading}
      />

      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <SectionHeader
            title="Your Documents"
            description={`${filtered.length} file${filtered.length !== 1 ? 's' : ''}`}
          />
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 rounded-xl border border-border bg-surface-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-smooth w-44"
              />
            </div>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="h-8 rounded-xl border border-border bg-surface-2 px-3 text-xs text-foreground outline-none focus:border-primary/50 transition-smooth"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <EmptyState preset="documents" size="sm" action={{ label: 'Upload File', onClick: handleBrowseClick }} />
          ) : (
            filtered.map(doc => <DocumentRow key={doc.id} doc={doc} onDelete={handleDelete} />)
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}
