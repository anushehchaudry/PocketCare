"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login } from "@/lib/api"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await login(email, password)
      if (result.status === "success") {
        router.push("/questionnaire")
      } else {
        setError(result.message || "Invalid email or password")
      }
    } catch (err) {
      setError("Failed to login. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Pocket Care</h1>
          <p className="text-gray-600">Welcome back! Please sign in to continue.</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email" 
              required 
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password" 
              required 
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
