"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { analyzeBill, initialAnalyzeBill, saveAnalysis } from "@/lib/api"; // Import saveAnalysis
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UploadBillPage() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [initialAnalysis, setInitialAnalysis] = useState("");
  const [questionAnalysis, setQuestionAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialAnalysisDone, setInitialAnalysisDone] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0] || null;
    setFile(uploadedFile);
    if (uploadedFile) {
      setUploading(true);
      setError("");
      try {
        const result = await initialAnalyzeBill(uploadedFile);
        if (result.status === "success") {
          setInitialAnalysis(result.analysis);
          setInitialAnalysisDone(true);
          setQuestionAnalysis(""); // Clear previous question analysis
          // Save the analysis in the background
          await saveAnalysis(
            uploadedFile.name,
            result.analysis,
            result.content
          );
        } else {
          setError(result.message || "An error occurred");
        }
      } catch (err) {
        setError("Failed to analyze bill");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !question) return;

    setLoading(true);
    setError("");

    try {
      const result = await analyzeBill(file, question);
      if (result.status === "success") {
        setQuestionAnalysis(result.analysis);
      } else {
        setError(result.message || "An error occurred");
      }
    } catch (err) {
      setError("Failed to analyze bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-6 w-6 text-purple-800" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold text-purple-800">
            Upload Medical Bill
          </h1>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 space-y-6">
            <Card className="border-purple-800">
              <CardContent className="p-6">
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="bill" className="text-purple-800">
                      Medical Bill
                    </Label>
                    <Input
                      id="bill"
                      type="file"
                      onChange={handleFileUpload}
                      required
                      className="border-purple-800"
                    />
                  </div>
                  {error && <p className="text-red-500">{error}</p>}
                </form>
              </CardContent>
            </Card>

            {uploading && (
              <Card className="border-purple-800">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-purple-800">
                    Uploading...
                  </h2>
                  <div className="whitespace-pre-wrap">
                    Your file is being uploaded and analyzed. Please wait...
                  </div>
                </CardContent>
              </Card>
            )}

            {initialAnalysisDone && !uploading && (
              <Card className="border-purple-800">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-purple-800">
                    Initial Analysis
                  </h2>
                  <div className="whitespace-pre-wrap">{initialAnalysis}</div>
                </CardContent>
              </Card>
            )}
          </div>

          {initialAnalysisDone && !uploading && (
            <div className="flex-1 space-y-6">
              <Card className="border-purple-800">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="question" className="text-purple-800">
                        What additional information would you like to know?
                      </Label>
                      <Textarea
                        id="question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g., What is my total out-of-pocket cost?"
                        required
                        className="border-purple-800"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-purple-600 text-white"
                    >
                      {loading ? "Answering..." : "Ask Question"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {questionAnalysis && (
                <Card className="border-purple-800">
                  <CardContent className="p-6">
                    <div className="whitespace-pre-wrap">
                      {questionAnalysis}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
