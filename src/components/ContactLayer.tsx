'use client'

import { useEffect, useRef, useState } from 'react'
import { Mail, MessageCircle, Phone, X } from 'lucide-react'

const EMAIL = 'whysice937@gmail.com'
const PHONE_DISPLAY = '(207) 554-0991'
const PHONE_TEL = '+12075540991'

export function ContactLayer() {
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Contact Whysice"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-tanzanite-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-tanzanite-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tanzanite-400 focus-visible:ring-offset-2"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Contact</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-layer-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div>
                <h2 id="contact-layer-title" className="text-lg font-bold text-body">
                  Get in touch
                </h2>
                <p className="text-sm text-slate mt-0.5">
                  Questions or feedback. I&apos;d love to hear from you.
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close contact"
                className="-mr-1 -mt-1 p-1 rounded-lg text-slate hover:text-body hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tanzanite-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-tanzanite-200 hover:bg-tanzanite-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tanzanite-400"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-tanzanite-100 text-tanzanite-600">
                  <Mail className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-medium uppercase tracking-wide text-slate">
                    Email
                  </span>
                  <span className="block text-sm font-semibold text-body truncate">
                    {EMAIL}
                  </span>
                </span>
              </a>

              <a
                href={`tel:${PHONE_TEL}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-tanzanite-200 hover:bg-tanzanite-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tanzanite-400"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-tanzanite-100 text-tanzanite-600">
                  <Phone className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-medium uppercase tracking-wide text-slate">
                    Phone
                  </span>
                  <span className="block text-sm font-semibold text-body">
                    {PHONE_DISPLAY}
                  </span>
                </span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
