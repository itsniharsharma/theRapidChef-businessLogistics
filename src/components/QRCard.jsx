import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import Button from './Button'

export default function QRCard({ tableNumber, slug }) {
  const qrRef = useRef(null)
  const frontendBaseUrl = import.meta.env.VITE_FRONTEND_BASE_URL || window.location.origin
  const value = `${frontendBaseUrl}/r/${slug}/t/${tableNumber}`

  const download = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return

    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `table-${tableNumber}-qr.png`
    link.click()
  }

  return (
    <div className="card p-4">
      <p className="font-semibold text-slate-800">Table {tableNumber}</p>
      <p className="mb-3 mt-1 text-sm text-slate-500">QR: {value}</p>
      <div ref={qrRef} className="mb-3 inline-block rounded-lg border border-slate-200 p-2">
        <QRCodeCanvas value={value} size={150} />
      </div>
      <Button onClick={download}>Download QR</Button>
    </div>
  )
}
