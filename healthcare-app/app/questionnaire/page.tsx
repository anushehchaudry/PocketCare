"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

const questions = [
  { id: 1, question: "What is your name?", type: "text" },
  { id: 2, question: "What is your age?", type: "number" },
  { id: 3, question: "Do you have any pre-existing conditions?", type: "text" },
  { id: 4, question: "How would you rate your overall health?", type: "text" },
]

export default function QuestionnairePage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [transitioning, setTransitioning] = useState(false)
  const [direction, setDirection] = useState("next")
  const [showThankYou, setShowThankYou] = useState(false)
  const router = useRouter()

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setDirection("next")
      setTransitioning(true)
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
      }, 300)
    } else {
      setShowThankYou(true)
      setTimeout(() => {
        router.push(`/dashboard?name=${encodeURIComponent(answers[1] || "")}`)
      }, 3000)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setDirection("prev")
      setTransitioning(true)
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1)
      }, 300)
    }
  }

  const handleAnswer = (e) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: e.target.value })
  }

  useEffect(() => {
    if (transitioning) {
      const timer = setTimeout(() => {
        setTransitioning(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [transitioning])

  const getNextQuestion = () => {
    if (direction === "next" && currentQuestion < questions.length - 1) {
      return questions[currentQuestion + 1]
    }
    if (direction === "prev" && currentQuestion > 0) {
      return questions[currentQuestion - 1]
    }
    return null
  }

  const nextQuestion = getNextQuestion()

  if (showThankYou) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Thank You, {answers[1]}!</h2>
            <p className="text-gray-500">We appreciate your responses. Redirecting to your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 space-y-8">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrevious} disabled={currentQuestion === 0}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Health Questionnaire</h1>
            <div className="w-10 h-10" /> {/* Spacer for alignment */}
          </div>

          <div className="relative overflow-hidden" style={{ height: "150px" }}>
            <Card
              className={`absolute w-full transition-all duration-300 ease-in-out ${
                transitioning
                  ? (direction === "next" ? "-translate-x-full" : "translate-x-full") + " opacity-0"
                  : "translate-x-0 opacity-100"
              }`}
            >
              <CardContent className="p-6">
                <Label htmlFor="answer" className="block mb-3 text-gray-900">
                  {questions[currentQuestion].question}
                </Label>
                <Input
                  id="answer"
                  type={questions[currentQuestion].type}
                  value={answers[questions[currentQuestion].id] || ""}
                  onChange={handleAnswer}
                  required
                  className="text-lg"
                />
              </CardContent>
            </Card>
            {transitioning && nextQuestion && (
              <Card
                className={`absolute w-full transition-all duration-300 ease-in-out ${
                  direction === "next" ? "translate-x-full" : "-translate-x-full"
                }`}
              >
                <CardContent className="p-6">
                  <Label htmlFor="next-answer" className="block mb-3 text-gray-900">
                    {nextQuestion.question}
                  </Label>
                  <Input
                    id="next-answer"
                    type={nextQuestion.type}
                    value={answers[nextQuestion.id] || ""}
                    readOnly
                    className="text-lg"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <Button onClick={handleNext} className="w-full">
            {currentQuestion === questions.length - 1 ? (
              "Finish"
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

