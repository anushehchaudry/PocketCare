"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function UploadBillPage() {
  const [file, setFile] = useState(null)
  const [breakdown, setBreakdown] = useState(null)

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return

    // Here you would typically send the file to your backend for processing
    // For this example, we'll just simulate a response
    setBreakdown("This is a simulated breakdown of your medical bill...")
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Upload Medical Bill</h1>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <Label htmlFor="bill">Select your medical bill (PDF)</Label>
            <Input id="bill" type="file" accept=".pdf" onChange={handleFileChange} required />
          </div>
          <Button type="submit">Upload and Generate Breakdown</Button>
        </form>
        {breakdown && (
          <div className="mt-8 p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Bill Breakdown</h2>
            <p>{breakdown}</p>
          </div>
        )}
      </div>
    </div>
  )
}

