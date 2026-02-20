'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Sparkles, TreePine, Bike, Users, Zap } from 'lucide-react'
import Image from 'next/image'

interface TransformInterfaceProps {
  originalImage: string
  onTransformRequest: (request: string) => void
  isLoading: boolean
}

// Web Speech API types
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onstart: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: ((event: Event) => void) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
  length: number
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition
    }
    webkitSpeechRecognition: {
      new (): SpeechRecognition
    }
  }
}

const QUICK_OPTIONS = [
  { id: 'green', icon: TreePine, label: 'Meer groen', prompt: 'meer bomen en groenstroken, minder parkeerplaatsen' },
  { id: 'bike', icon: Bike, label: 'Fietsvriendelijk', prompt: 'fietspaden, fietsenstallingen, minder autoverkeer' },
  { id: 'play', icon: Users, label: 'Kindvriendelijk', prompt: 'speeltoestellen, zitbanken, veilige speelruimte voor kinderen' },
  { id: 'social', icon: Zap, label: 'Ontmoeting', prompt: 'terrassen, zitbanken, ontmoetingsplekken, meer sociale ruimte' }
]

export default function TransformInterface({ originalImage, onTransformRequest, isLoading }: TransformInterfaceProps) {
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setSpeechSupported(true)
        recognitionRef.current = new SpeechRecognition()
        
        const recognition = recognitionRef.current
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'nl-BE'

        recognition.onstart = () => {
          setIsListening(true)
        }

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript
          setInputText(prev => (prev + ' ' + transcript).trim())
        }

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }

        recognition.onend = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting speech recognition:', error)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const handleQuickOption = (prompt: string) => {
    setInputText(prompt)
  }

  const handleSubmit = () => {
    if (inputText.trim() && !isLoading) {
      onTransformRequest(inputText.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-6">
      {/* Original Image Preview */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">Je foto:</h3>
        </div>
        <div className="p-4">
          <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={originalImage}
              alt="Originele straat foto"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Transform Interface */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Wat wil je veranderen aan deze straat?
        </h3>

        {/* Quick Options */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {QUICK_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleQuickOption(option.prompt)}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-blue-50 transition-colors text-left"
              disabled={isLoading}
            >
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <option.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700">{option.label}</span>
            </button>
          ))}
        </div>

        {/* Text/Speech Input */}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Bijvoorbeeld: 'Ik wil minder parkeerplaatsen, meer bomen en een fietspad' of 'Vervang de auto's door een speeltuintje met banken'"
              className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary"
              rows={3}
              disabled={isLoading}
            />
            
            {/* Speech Button */}
            {speechSupported && (
              <button
                onClick={isListening ? stopListening : startListening}
                className={`absolute bottom-3 right-3 p-2 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                disabled={isLoading}
                title={isListening ? 'Stop opnemen' : 'Start spraakopname'}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {isListening && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <span>Aan het luisteren... (Nederlands)</span>
            </div>
          )}

          {/* Transform Button */}
          <button
            onClick={handleSubmit}
            disabled={!inputText.trim() || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                <span>AI transformeert je straat...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Transformeer met AI</span>
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>💡 Tip:</strong> Wees specifiek! Vertel wat je weg wilt (parkeerplaatsen, auto's) 
            en wat je ervoor in de plaats wilt (bomen, fietspad, speeltuig, terras).
          </p>
        </div>
      </div>
    </div>
  )
}