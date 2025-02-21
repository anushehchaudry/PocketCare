"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { register } from "@/lib/api"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors([])

    try {
      const result = await register(email, password, confirmPassword)
      if (result.status === "success") {
        router.push("/")  // Redirect to login page after successful registration
      } else {
        setErrors(result.errors || [result.message || "Registration failed"])
      }
    } catch (err) {
      setErrors(["Failed to register. Please try again."])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600">Sign up for Pocket Care</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          {errors.length > 0 && (
            <Alert variant="destructive" className="text-left">
              <AlertDescription>
                <ul className="list-disc pl-4 mt-2">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
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
              placeholder="Create a password" 
              required 
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password" 
              required 
              disabled={loading}
            />
          </div>
          
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}