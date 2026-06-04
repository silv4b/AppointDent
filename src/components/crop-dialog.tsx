"use client"

import { useCallback, useState } from "react"
import Cropper, { type Area, type Point } from "react-easy-crop"
import { CropIcon, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface CropDialogProps {
  open: boolean
  imageSrc: string
  onCrop: (croppedBase64: string) => void
  onCancel: () => void
}

function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  maxSize: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      let w = pixelCrop.width
      let h = pixelCrop.height
      if (w > maxSize || h > maxSize) {
        const ratio = Math.min(maxSize / w, maxSize / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y,
        pixelCrop.width, pixelCrop.height,
        0, 0,
        w, h
      )
      resolve(canvas.toDataURL("image/png"))
    }
    image.onerror = reject
    image.src = imageSrc
  })
}

export function CropDialog({ open, imageSrc, onCrop, onCancel }: CropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return
    setProcessing(true)
    try {
      const base64 = await getCroppedImage(imageSrc, croppedAreaPixels, 400)
      onCrop(base64)
    } catch {
      setProcessing(false)
    }
  }, [imageSrc, croppedAreaPixels, onCrop])

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v && !processing) onCancel()
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-4 w-4" />
            Ajustar logo
          </DialogTitle>
        </DialogHeader>

        <div className="relative h-80 w-full overflow-hidden rounded-lg bg-black/5">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="text-xs text-muted-foreground shrink-0">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-1.5 cursor-pointer accent-primary"
          />
          <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">
            {zoom.toFixed(1)}x
          </span>
        </div>

        <p className="text-xs text-muted-foreground px-1">
          Arraste para reposicionar. Use a rolagem ou o controle de zoom para ajustar.
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={processing}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={processing || !croppedAreaPixels}>
            {processing ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Processando...
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
