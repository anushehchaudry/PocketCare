"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { saveQuestionnaire, checkQuestionnaireStatus } from "@/lib/api"

const questions = [
  { id: "name", question: "What is your name?", type: "text" },
  { id: "age", question: "What is your age?", type: "number" },
  { id: "pre_existing_conditions", question: "Do you have any pre-existing conditions?", type: "text" },
  { id: "overall_health", question: "How would you rate your overall health?", type: "text" },
]

export default function QuestionnairePage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [transitioning, setTransitioning] = useState(false)
  const [direction, setDirection] = useState("next")
  const [showThankYou, setShowThankYou] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      try {
        // Ensure router is ready before making the request
        router.refresh();
        
        const result = await checkQuestionnaireStatus()
        if (!mounted) return;

        if (result.status === 'success') {
          if (result.data?.hasCompleted) {
            router.replace(`/dashboard?name=${encodeURIComponent(result.data.name)}`)
            return;
          }
        } else {
          // If unauthorized or error, redirect to login
          router.replace('/')
          return;
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Error checking questionnaire status:', err)
        router.replace('/')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    checkStatus()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setDirection("next")
      setTransitioning(true)
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
        setTransitioning(false)
      }, 300)
    } else {
      // Submit the questionnaire
      try {
        const result = await saveQuestionnaire({
          name: answers.name || "",
          age: parseInt(answers.age || "0"),
          pre_existing_conditions: answers.pre_existing_conditions || "",
          overall_health: answers.overall_health || ""
        })

        if (result.status === "success") {
          setShowThankYou(true)
          setTimeout(() => {
            router.push(`/dashboard?name=${encodeURIComponent(answers.name || "")}`)
          }, 2000)
        } else {
          setError(result.message || "Failed to save questionnaire")
        }
      } catch (err) {
        setError("Failed to save questionnaire")
      }
    }
  }

  const handleBack = () => {
    if (currentQuestion > 0) {
      setDirection("back")
      setTransitioning(true)
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1)
        setTransitioning(false)
      }, 300)
    }
  }

  const handleInputChange = (value: string) => {
    setAnswers({
      ...answers,
      [questions[currentQuestion].id]: value
    })
  }

  if (showThankYou) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h2 className="text-2xl font-bold text-center">Thank You!</h2>
            <p className="text-gray-600 text-center">Your responses have been saved.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className={`w-full max-w-lg transform transition-all duration-300 ${
        transitioning
          ? direction === "next"
            ? "-translate-x-full opacity-0"
            : "translate-x-full opacity-0"
          : "translate-x-0 opacity-100"
      }`}>
        <CardContent className="p-6">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold">{questions[currentQuestion].question}</h2>
              <div className="mt-4">
                <Input
                  type={questions[currentQuestion].type}
                  value={answers[questions[currentQuestion].id] || ""}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex justify-between">
              <Button
                onClick={handleBack}
                disabled={currentQuestion === 0}
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext}>
                {currentQuestion === questions.length - 1 ? (
                  "Submit"
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
