'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Mic, MicOff, Download, Sparkles, MapPin, Users } from 'lucide-react'
import ImageUploader from '@/components/ImageUploader'
import TransformInterface from '@/components/TransformInterface' 
import ResultDisplay from '@/components/ResultDisplay'
import { TransformationDB } from '@/lib/supabase'

// Declare Puter global for TypeScript
declare global {
  interface Window {
    puter: {
      ai: {
        txt2img: (prompt: string, options: {
          model: string;
          input_image?: string;
          input_image_mime_type?: string;
        }) => Promise<HTMLImageElement>;
      };
    };
  }
}

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'transform' | 'result'>('upload')
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [transformedImage, setTransformedImage] = useState<HTMLImageElement | null>(null)
  const [userRequest, setUserRequest] = useState('')
  const [isTransforming, setIsTransforming] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Get user location (optional)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        () => {
          // Location is optional - continue without it
          console.log('Location access declined - continuing without geolocation')
        }
      )
    }
  }, [])

  const handleImageUploaded = (imageBase64: string) => {
    setOriginalImage(imageBase64)
    setCurrentStep('transform')
  }

  const handleTransformRequest = async (request: string) => {
    if (!originalImage || !window.puter) {
      console.error('Missing originalImage or Puter not loaded')
      return
    }

    setUserRequest(request)
    setIsTransforming(true)

    const startTime = Date.now()
    const sessionId = localStorage.getItem('street-session-id') || crypto.randomUUID()
    localStorage.setItem('street-session-id', sessionId)

    try {
      // Enhanced prompt for better street transformations
      const enhancedPrompt = `Transform this street scene based on the user's request: "${request}". 
      Create a realistic transformation that shows:
      - Less parking spaces and cars if requested
      - More green spaces, trees, and plants if requested  
      - Bicycle lanes and bike infrastructure if requested
      - Playground equipment and child-friendly spaces if requested
      - Outdoor seating, terraces, and community spaces if requested
      - Keep the same architectural style and street layout
      - Make it look realistic and achievable
      - Focus on livability improvements and community benefits`

      const transformedImg = await window.puter.ai.txt2img(enhancedPrompt, {
        model: "gemini-3-pro-image-preview",
        input_image: originalImage.split(',')[1], // Remove data:image/jpeg;base64, prefix
        input_image_mime_type: "image/jpeg"
      })

      setTransformedImage(transformedImg)
      setCurrentStep('result')

      // Calculate processing time
      const processingTime = Date.now() - startTime

      // Extract categories from request
      const categories = extractCategories(request)

      // Save to Supabase database
      await TransformationDB.saveTransformation({
        userRequest: request,
        categories: categories,
        latitude: location?.lat,
        longitude: location?.lng,
        aiModel: "gemini-3-pro-image-preview",
        processingTimeMs: processingTime,
        sessionId: sessionId
      })

      // Update session
      await TransformationDB.upsertSession(sessionId, {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      })

      console.log('✅ Transformation saved to database')

    } catch (error) {
      console.error('Transformation failed:', error)
      
      // Still try to save failed attempt
      try {
        await TransformationDB.saveTransformation({
          userRequest: request,
          categories: extractCategories(request),
          latitude: location?.lat,
          longitude: location?.lng,
          aiModel: "gemini-3-pro-image-preview",
          processingTimeMs: Date.now() - startTime,
          sessionId: sessionId
        })
      } catch (dbError) {
        console.error('Database save failed:', dbError)
      }
      
      alert('Transformatie mislukt. Probeer opnieuw met een andere beschrijving.')
    } finally {
      setIsTransforming(false)
    }
  }

  // Helper function to extract categories from request
  const extractCategories = (request: string): string[] => {
    const categories: string[] = []
    const lowercaseRequest = request.toLowerCase()

    const patterns = {
      groen: /\b(groen|boom|bomen|planten?|tuin|park|natuur|bloemen?)\b/g,
      fiets: /\b(fiets|fietspad|bike|wielr|cycling|fietsenstalling)\b/g,
      speel: /\b(speel|kind|kinderen|playground|speeltuin|spelen|jeugd)\b/g,
      social: /\b(terras|cafe|zitten|bankje?|ontmoet|social|gezellig|samen)\b/g,
      minder_auto: /\b(minder auto|geen auto|parkeren? weg|minder parkeer|auto weg)\b/g
    }

    Object.entries(patterns).forEach(([category, pattern]) => {
      if (pattern.test(lowercaseRequest)) {
        categories.push(category)
      }
    })

    if (categories.length === 0) {
      categories.push('other')
    }

    return categories
  }

  const handleReset = () => {
    setCurrentStep('upload')
    setOriginalImage(null)
    setTransformedImage(null)
    setUserRequest('')
    setIsTransforming(false)
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Transformeer je straat met AI
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Neem een foto van je straat en vertel ons wat je wilt veranderen. 
          Onze AI toont hoe het eruit zou kunnen zien met meer groen, minder auto's, en meer leefruimte.
        </p>
        <div className="flex justify-center gap-6 mt-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            <span>Neem foto</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Beschrijf wens</span>
          </div>
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Download resultaat</span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep === 'upload' ? 'bg-primary text-white' : 
            originalImage ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            1
          </div>
          <div className={`h-1 w-16 ${originalImage ? 'bg-green-500' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep === 'transform' ? 'bg-primary text-white' : 
            transformedImage ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            2
          </div>
          <div className={`h-1 w-16 ${transformedImage ? 'bg-green-500' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            currentStep === 'result' ? 'bg-primary text-white' : 
            transformedImage ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            3
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
        {currentStep === 'upload' && (
          <ImageUploader onImageUploaded={handleImageUploaded} />
        )}

        {currentStep === 'transform' && originalImage && (
          <TransformInterface
            originalImage={originalImage}
            onTransformRequest={handleTransformRequest}
            isLoading={isTransforming}
          />
        )}

        {currentStep === 'result' && transformedImage && originalImage && (
          <ResultDisplay
            originalImage={originalImage}
            transformedImage={transformedImage}
            userRequest={userRequest}
            onReset={handleReset}
          />
        )}
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6 mt-16">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Voor de gemeenschap</h3>
          <p className="text-sm text-gray-600">
            Meer ruimte voor ontmoeting, spel en ontspanning. Minder uitstoot, meer leefkwaliteit.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Lokale impact</h3>
          <p className="text-sm text-gray-600">
            Elke transformatie toont wat mogelijk is in jouw buurt. Inspireer je buren en gemeente.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Deelmobiliteit</h3>
          <p className="text-sm text-gray-600">
            <a href="https://autodelen.net" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Ontdek alternatieven →
            </a> voor de privéwagen. Autodelen, fietsen, openbaar vervoer.
          </p>
        </div>
      </div>
    </div>
  )
}