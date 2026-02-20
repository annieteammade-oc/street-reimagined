'use client'

import { useState } from 'react'
import { Download, RotateCcw, Share2, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

interface ResultDisplayProps {
  originalImage: string
  transformedImage: HTMLImageElement
  userRequest: string
  onReset: () => void
}

export default function ResultDisplay({ 
  originalImage, 
  transformedImage, 
  userRequest, 
  onReset 
}: ResultDisplayProps) {
  const [showComparison, setShowComparison] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  const downloadImage = async () => {
    try {
      setIsDownloading(true)
      
      // Create canvas and draw the transformed image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Canvas context not available')
      }

      // Set canvas size to match image
      canvas.width = transformedImage.naturalWidth || transformedImage.width
      canvas.height = transformedImage.naturalHeight || transformedImage.height

      // Draw the image
      ctx.drawImage(transformedImage, 0, 0)

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `street-reimagined-${Date.now()}.jpg`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, 'image/jpeg', 0.9)

    } catch (error) {
      console.error('Download failed:', error)
      alert('Download mislukt. Probeer het opnieuw.')
    } finally {
      setIsDownloading(false)
    }
  }

  const shareImage = async () => {
    if (navigator.share) {
      try {
        // Convert image to blob for sharing
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          canvas.width = transformedImage.naturalWidth || transformedImage.width
          canvas.height = transformedImage.naturalHeight || transformedImage.height
          ctx.drawImage(transformedImage, 0, 0)
          
          canvas.toBlob(async (blob) => {
            if (blob) {
              const file = new File([blob], 'street-reimagined.jpg', { type: 'image/jpeg' })
              await navigator.share({
                title: 'Mijn straat getransformeerd!',
                text: `Zo zou mijn straat eruit kunnen zien: ${userRequest}`,
                files: [file]
              })
            }
          }, 'image/jpeg', 0.9)
        }
      } catch (error) {
        // Fallback to URL sharing
        const url = window.location.href
        await navigator.share({
          title: 'Street Reimagined',
          text: `Bekijk hoe ik mijn straat heb getransformeerd met AI!`,
          url: url
        })
      }
    } else {
      // Fallback for browsers without Web Share API
      const url = window.location.href
      await navigator.clipboard.writeText(`Bekijk hoe ik mijn straat heb getransformeerd: ${url}`)
      alert('Link gekopieerd naar klembord!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Transformatie voltooid! 🎉
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {userRequest}
        </p>
      </div>

      {/* Comparison Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setShowComparison(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              showComparison 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Voor & Na
          </button>
          <button
            onClick={() => setShowComparison(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !showComparison 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Alleen resultaat
          </button>
        </div>
      </div>

      {/* Image Display */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {showComparison ? (
          <div className="grid md:grid-cols-2 gap-0">
            {/* Original */}
            <div className="p-4 border-b md:border-b-0 md:border-r">
              <div className="text-center mb-3">
                <span className="text-sm font-medium text-gray-500">VOOR</span>
              </div>
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={originalImage}
                  alt="Originele straat"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Transformed */}
            <div className="p-4">
              <div className="text-center mb-3">
                <span className="text-sm font-medium text-green-600">NA</span>
              </div>
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={transformedImage.src}
                  alt="Getransformeerde straat"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="text-center mb-3">
              <span className="text-sm font-medium text-green-600">JOUW GETRANSFORMEERDE STRAAT</span>
            </div>
            <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={transformedImage.src}
                alt="Getransformeerde straat"
                fill
                className="object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={downloadImage}
          disabled={isDownloading}
          className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isDownloading ? (
            <>
              <div className="loading-spinner"></div>
              <span>Downloaden...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Download afbeelding</span>
            </>
          )}
        </button>

        <button
          onClick={shareImage}
          className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span>Delen</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Nieuwe foto</span>
        </button>
      </div>

      {/* Impact Message */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-2">🌱 Positieve impact van deze transformatie:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Minder CO2 uitstoot door vermindering auto-afhankelijkheid</li>
          <li>• Meer groen verhoogt biodiversiteit en luchtkwaliteit</li>
          <li>• Betere leefkwaliteit en sociale cohesie in de buurt</li>
          <li>• Veiligere en aantrekkelijkere openbare ruimte</li>
        </ul>
        <div className="mt-4 pt-4 border-t border-green-200">
          <p className="text-sm text-gray-600">
            Ontdek hoe je nu al kunt beginnen: {' '}
            <a 
              href="https://autodelen.net" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary hover:underline font-medium"
            >
              Bekijk deelmobiliteit opties →
            </a>
          </p>
        </div>
      </div>

      {/* Social Proof */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          💚 Help ons straten overal te transformeren door je resultaat te delen!
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Gemaakt met ❤️ door Team Made • Powered by Google Nano Banana AI
        </p>
      </div>
    </div>
  )
}