"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CompareInsurancePage() {
  const [plan1, setPlan1] = useState(null)
  const [plan2, setPlan2] = useState(null)
  const [comparison, setComparison] = useState(null)

  const handleFileChange = (e, setPlan) => {
    setPlan(e.target.files[0])
  }

  const handleCompare = async (e) => {
    e.preventDefault()
    if (!plan1 || !plan2) return

    // Here you would typically send the files to your backend for comparison
    // For this example, we'll just simulate a response
    setComparison(
      `Comparing ${plan1.name} and ${plan2.name}... This is a simulated comparison of the two insurance plans.`,
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Compare Insurance Plans</h1>
        <form onSubmit={handleCompare} className="space-y-4">
          <div>
            <Label htmlFor="plan1">Insurance Plan 1</Label>
            <Input id="plan1" type="file" onChange={(e) => handleFileChange(e, setPlan1)} required />
          </div>
          <div>
            <Label htmlFor="plan2">Insurance Plan 2</Label>
            <Input id="plan2" type="file" onChange={(e) => handleFileChange(e, setPlan2)} required />
          </div>
          <Button type="submit">Compare Plans</Button>
        </form>
        {comparison && (
          <div className="mt-8 p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Plan Comparison</h2>
            <p>{comparison}</p>
          </div>
        )}
      </div>
    </div>
  )
}

