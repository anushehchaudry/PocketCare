"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Activity, Files, ArrowLeft, UserCircle } from "lucide-react"

export default function DashboardPage() {
  const [isVisible, setIsVisible] = useState(false)
  const searchParams = useSearchParams()
  const name = searchParams.get("name") || "User"

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div
          className={`space-y-8 transition-opacity duration-500 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-6 w-6" />
                </Link>
              </Button>
              <h1 className="text-2xl font-semibold text-gray-900">Home</h1>
            </div>
            <Button size="icon" variant="ghost" className="rounded-full">
              <UserCircle className="h-6 w-6" />
            </Button>
          </div>

          {/* Welcome Card */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <h2 className="text-xl font-medium mb-1">Hi {name},</h2>
              <p className="text-primary-foreground/90">Welcome to your healthcare dashboard</p>
            </CardContent>
          </Card>

          {/* Main Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/upload-bill" className="group">
              <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Upload Medical Bill</h3>
                    <p className="text-sm text-gray-500">Upload and analyze your medical bills</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/compare-insurance" className="group">
              <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Compare Insurance</h3>
                    <p className="text-sm text-gray-500">Compare different insurance plans</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/view-bills" className="group">
              <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Files className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">View Bills</h3>
                    <p className="text-sm text-gray-500">Access your uploaded medical bills</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

