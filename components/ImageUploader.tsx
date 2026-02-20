'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, Image as ImageIcon } from 'lucide-react'

interface ImageUploaderProps {
  onImageUploaded: (imageBase64: string) => void
}

export default function ImageUploader({ onImageUploaded }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Selecteer een geldige afbeelding (JPG, PNG, etc.)')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      onImageUploaded(result)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files?.[0]) {
      handleFileSelect(files[0])
    }
  }

  const triggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-6">
      {/* Camera/Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center transition-all
          ${isDragging 
            ? 'border-primary bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Neem een foto van je straat
            </h3>
            <p className="text-gray-600 mb-4">
              Focus op parkeerplaatsen, straatvlak, of gebieden die je wilt transformeren
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={triggerCamera}
              className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-5 h-5" />
              Camera openen
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Foto uploaden
            </button>
          </div>

          {/* Drag & Drop Text */}
          <p className="text-sm text-gray-500">
            Of sleep een foto hiernaartoe
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <ImageIcon className="w-3 h-3 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">💡 Tips voor de beste resultaten:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Maak de foto overdag bij goed licht</li>
              <li>• Zorg dat parkeerplaatsen/straat goed zichtbaar zijn</li>
              <li>• Houd je telefoon horizontaal voor meer detail</li>
              <li>• Focus op één straatvlak of gebied tegelijk</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}