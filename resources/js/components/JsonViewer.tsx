'use client'

import { useEffect, useRef, useState } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-json'
import 'prismjs/themes/prism.css'

import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'

interface JsonViewerProps {
  value: unknown
}

export function JsonViewer({ value }: JsonViewerProps) {
  const ref = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  const json = JSON.stringify(value, null, 2)

  useEffect(() => {
    if (ref.current) {
      Prism.highlightElement(ref.current)
    }
  }, [json])

  const copy = async () => {
    await navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative rounded-md border bg-muted">
      <Button
        size="icon"
        variant="ghost"
        onClick={copy}
        className="absolute right-2 top-2 h-7 w-7"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>

      <pre className="overflow-auto p-3 text-xs bg-none">
        <code ref={ref} className="language-json">
          {json}
        </code>
      </pre>
    </div>
  )
}
