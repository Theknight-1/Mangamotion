'use client'

import { useState, useRef } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImageUploaderProps {
  onImageSelect: (url: string, file: File) => void
  disabled?: boolean
}

export function ImageUploader({ onImageSelect, disabled }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setUploading(true)

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include', // Required for session cookie
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Upload failed')
      }

      const data = await res.json()
      onImageSelect(data.url, file)
      toast.success('Image uploaded')
    } catch (error: any) {
      console.error('[image-uploader] error:', error)
      toast.error(error.message || 'Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (disabled || uploading) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0]
    if (file) handleFile(file)
    e.currentTarget.value = ''
  }

  function clearPreview() {
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-[#0a0a0f] border border-white/[0.07] aspect-video w-full group">
        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#bbdf50] border-t-transparent animate-spin" />
              <span className="text-sm text-white/60">Uploading…</span>
            </div>
          </div>
        )}
        {!uploading && (
          <button
            onClick={clearPreview}
            className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-red-600 rounded-lg text-white transition opacity-0 group-hover:opacity-100"
          >
            <X size={16} />
          </button>
        )}
      </div>
    )
  }

  const isDisabled = disabled || uploading

  return (
    <div
      onDragOver={e => { e.preventDefault(); if (!isDisabled) setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !isDisabled && fileInputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition
        ${isDisabled
          ? 'opacity-40 cursor-not-allowed border-white/6'
          : dragOver
            ? 'border-[#bbdf50] bg-[#bbdf50]/5'
            : 'border-white/8 hover:border-[#bbdf50]/50 hover:bg-white/2'
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={isDisabled}
        className="hidden"
      />

      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition ${
        dragOver ? 'bg-[#bbdf50]/20 border border-[#bbdf50]/40' : 'bg-white/4 border border-white/8'
      }`}>
        <ImageIcon size={24} className={dragOver ? 'text-[#bbdf50]' : 'text-white/30'} />
      </div>

      <p className="text-white/70 font-medium mb-1.5">
        {uploading ? 'Uploading…' : dragOver ? 'Drop to upload' : 'Drop your manga panel here'}
      </p>
      <p className="text-white/30 text-sm">
        or <span className="text-[#bbdf50] hover:text-[#b8d85b] transition">click to browse</span> · JPG, PNG, WebP up to 10MB
      </p>
    </div>
  )
}