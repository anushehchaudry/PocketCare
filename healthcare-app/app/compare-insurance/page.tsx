"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { compareInsurance } from "@/lib/api"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CompareInsurancePage() {
  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const [question, setQuestion] = useState("")
  const [comparison, setComparison] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file1 || !file2 || !question) return

    setLoading(true)
    setError("")

    try {
      const result = await compareInsurance(file1, file2, question)
      if (result.status === "success") {
        setComparison(result.comparison)
      } else {
        setError(result.message || "An error occurred")
      }
    } catch (err) {
      setError("Failed to compare insurance plans")
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
          <h1 className="text-2xl font-semibold">Compare Insurance Plans</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="plan1">Insurance Plan 1</Label>
                <Input
                  id="plan1"
                  type="file"
                  onChange={(e) => setFile1(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="plan2">Insurance Plan 2</Label>
                <Input
                  id="plan2"
                  type="file"
                  onChange={(e) => setFile2(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="question">What would you like to compare?</Label>
                <Textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., What are the differences in prescription drug coverage?"
                  required
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Comparing..." : "Compare Plans"}
              </Button>

              {error && (
                <p className="text-red-500">{error}</p>
              )}
            </form>
          </CardContent>
        </Card>

        {comparison && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Comparison Results</h2>
              <div className="whitespace-pre-wrap">{comparison}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}