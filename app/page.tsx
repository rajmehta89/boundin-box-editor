"use client"
import { BoundingBoxEditor } from "@/components/bounding-box-editor"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Bounding Box Editor</h1>
          <p className="text-muted-foreground text-lg">Create, edit, and manipulate bounding boxes on your images</p>
        </div>
        <BoundingBoxEditor />
      </div>
    </div>
  )
}
