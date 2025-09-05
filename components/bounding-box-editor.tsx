"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"

interface BoundingBox {
  id: string
  x: number
  y: number
  width: number
  height: number
  label?: string
}

interface Position {
  x: number
  y: number
}

const SAMPLE_IMAGE = "/sample-landscape-photo-for-bounding-box-editing.jpg"

const SAMPLE_BOXES: BoundingBox[] = [
  { id: "1", x: 100, y: 80, width: 150, height: 120, label: "Object 1" },
  { id: "2", x: 300, y: 200, width: 200, height: 100, label: "Object 2" },
  { id: "3", x: 550, y: 150, width: 120, height: 180, label: "Object 3" },
]

export function BoundingBoxEditor() {
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(SAMPLE_BOXES)
  const [selectedBox, setSelectedBox] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 })
  const [resizeHandle, setResizeHandle] = useState<string>("")
  const canvasRef = useRef<HTMLDivElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, boxId: string, action: "drag" | "resize", handle?: string) => {
      e.preventDefault()
      e.stopPropagation()

      setSelectedBox(boxId)
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const startX = e.clientX - rect.left
      const startY = e.clientY - rect.top
      setDragStart({ x: startX, y: startY })

      if (action === "drag") {
        setIsDragging(true)
      } else if (action === "resize" && handle) {
        setIsResizing(true)
        setResizeHandle(handle)
      }
    },
    [],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging && !isResizing) return
      if (!selectedBox || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top
      const deltaX = currentX - dragStart.x
      const deltaY = currentY - dragStart.y

      setBoundingBoxes((prev) =>
        prev.map((box) => {
          if (box.id !== selectedBox) return box

          if (isDragging) {
            return {
              ...box,
              x: Math.max(0, Math.min(rect.width - box.width, box.x + deltaX)),
              y: Math.max(0, Math.min(rect.height - box.height, box.y + deltaY)),
            }
          } else if (isResizing) {
            const newBox = { ...box }

            switch (resizeHandle) {
              case "nw":
                newBox.width = Math.max(20, box.width - deltaX)
                newBox.height = Math.max(20, box.height - deltaY)
                newBox.x = Math.max(0, box.x + deltaX)
                newBox.y = Math.max(0, box.y + deltaY)
                break
              case "ne":
                newBox.width = Math.max(20, box.width + deltaX)
                newBox.height = Math.max(20, box.height - deltaY)
                newBox.y = Math.max(0, box.y + deltaY)
                break
              case "sw":
                newBox.width = Math.max(20, box.width - deltaX)
                newBox.height = Math.max(20, box.height + deltaY)
                newBox.x = Math.max(0, box.x + deltaX)
                break
              case "se":
                newBox.width = Math.max(20, box.width + deltaX)
                newBox.height = Math.max(20, box.height + deltaY)
                break
            }

            return newBox
          }

          return box
        }),
      )

      setDragStart({ x: currentX, y: currentY })
    },
    [isDragging, isResizing, selectedBox, dragStart, resizeHandle],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle("")
  }, [])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging || isResizing) return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Check if click is on any existing box
      const clickedBox = boundingBoxes.find(
        (box) => x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height,
      )

      if (clickedBox) {
        setSelectedBox(clickedBox.id)
      } else {
        setSelectedBox(null)
      }
    },
    [boundingBoxes, isDragging, isResizing],
  )

  const addNewBox = useCallback(() => {
    const newBox: BoundingBox = {
      id: Date.now().toString(),
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      label: `Object ${boundingBoxes.length + 1}`,
    }
    setBoundingBoxes((prev) => [...prev, newBox])
    setSelectedBox(newBox.id)
  }, [boundingBoxes.length])

  const deleteSelectedBox = useCallback(() => {
    if (!selectedBox) return
    setBoundingBoxes((prev) => prev.filter((box) => box.id !== selectedBox))
    setSelectedBox(null)
  }, [selectedBox])

  const exportJSON = useCallback(() => {
    const dataStr = JSON.stringify(boundingBoxes, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "bounding-boxes.json"
    link.click()
    URL.revokeObjectURL(url)
  }, [boundingBoxes])

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedBox) {
        deleteSelectedBox()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [selectedBox, deleteSelectedBox])

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Toolbar */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={addNewBox} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Box
            </Button>
            <Button variant="outline" onClick={deleteSelectedBox} disabled={!selectedBox}>
              Delete Selected
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={exportJSON} className="flex items-center gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export JSON
            </Button>
          </div>
        </div>
      </Card>

      {/* Canvas Area */}
      <Card className="p-6 bg-gradient-to-br from-background to-muted/30">
        <div
          ref={canvasRef}
          className="relative w-full h-[600px] bg-card rounded-lg shadow-inner overflow-hidden cursor-crosshair"
          onClick={handleCanvasClick}
          style={{
            backgroundImage: `url("${SAMPLE_IMAGE}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {boundingBoxes.map((box) => (
            <div
              key={box.id}
              className={`absolute border-2 transition-all duration-200 ${
                selectedBox === box.id ? "border-accent shadow-lg" : "border-primary hover:border-accent"
              }`}
              style={{
                left: box.x,
                top: box.y,
                width: box.width,
                height: box.height,
                backgroundColor: selectedBox === box.id ? "rgba(139, 92, 246, 0.1)" : "rgba(22, 78, 99, 0.1)",
              }}
              onMouseDown={(e) => handleMouseDown(e, box.id, "drag")}
            >
              {/* Label */}
              <div className="absolute -top-6 left-0 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                {box.label}
              </div>

              {/* Resize handles - only show for selected box */}
              {selectedBox === box.id && (
                <>
                  <div
                    className="absolute -top-1 -left-1 w-3 h-3 bg-accent border border-white rounded-full cursor-nw-resize"
                    onMouseDown={(e) => handleMouseDown(e, box.id, "resize", "nw")}
                  />
                  <div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-accent border border-white rounded-full cursor-ne-resize"
                    onMouseDown={(e) => handleMouseDown(e, box.id, "resize", "ne")}
                  />
                  <div
                    className="absolute -bottom-1 -left-1 w-3 h-3 bg-accent border border-white rounded-full cursor-sw-resize"
                    onMouseDown={(e) => handleMouseDown(e, box.id, "resize", "sw")}
                  />
                  <div
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-accent border border-white rounded-full cursor-se-resize"
                    onMouseDown={(e) => handleMouseDown(e, box.id, "resize", "se")}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* JSON Output */}
      <Card className="p-4 mt-6">
        <h3 className="text-lg font-semibold mb-3">Current Bounding Boxes JSON:</h3>
        <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto max-h-60">
          {JSON.stringify(boundingBoxes, null, 2)}
        </pre>
      </Card>
    </div>
  )
}
