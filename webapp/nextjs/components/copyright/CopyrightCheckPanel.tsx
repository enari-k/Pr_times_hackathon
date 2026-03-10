'use client'

import { useState } from 'react'

type Detail = {
  text: string
  reason: string
}

type Result =
  | {
      status: 'success'
      message: string
    }
  | {
      status: 'warning'
      message: string
      details: Detail[]
    }

type Props = {
  content: string
}

export default function CopyrightCheckPanel({ content }: Props) {
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const handleCheck = async () => {
    setIsChecking(true)

    try {
      const res = await fetch('/api/copyright-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      const data = await res.json()
      setResult(data)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div style={{ width: 300, padding: 16, borderLeft: '1px solid #ddd' }}>
      <button
        onClick={handleCheck}
        disabled={isChecking}
        style={{
          width: '100%',
          padding: '8px',
          cursor: isChecking ? 'not-allowed' : 'pointer',
        }}
      >
        {isChecking ? 'チェック中...' : '著作権チェック'}
      </button>

      <div style={{ marginTop: 16 }}>
        {!result && (
          <p style={{ color: '#888' }}>
            チェック結果はここに表示されます
          </p>
        )}

        {result && (
          <>
            <p>{result.message}</p>

            {'details' in result &&
              result.details.map((d, i) => (
                <div
                  key={i}
                  style={{
                    marginTop: 12,
                    padding: 8,
                    border: '1px solid #eee',
                    borderRadius: 4,
                  }}
                >
                  <p>
                    <strong>箇所</strong>
                  </p>
                  <p>{d.text}</p>

                  <p>
                    <strong>理由</strong>
                  </p>
                  <p>{d.reason}</p>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  )
}