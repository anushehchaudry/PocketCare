"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { analyzeBill } from "@/lib/api"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function UploadBillPage() {
  const [file, setFile] = useState<File | null>(null)
  const [question, setQuestion] = useState("")
  const [analysis, setAnalysis] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !question) return

    setLoading(true)
    setError("")

    try {
      const result = await analyzeBill(file, question)
      if (result.status === "success") {
        setAnalysis(result.analysis)
      } else {
        setError(result.message || "An error occurred")
      }
    } catch (err) {
      setError("Failed to analyze bill")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Upload Medical Bill</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="bill">Medical Bill</Label>
                <Input
                  id="bill"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="question">What would you like to know?</Label>
                <Textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., What is my total out-of-pocket cost?"
                  required
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Analyzing..." : "Analyze Bill"}
              </Button>

              {error && (
                <p className="text-red-500">{error}</p>
              )}
            </form>
          </CardContent>
        </Card>

        {analysis && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Analysis</h2>
              <div className="whitespace-pre-wrap">{analysis}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}