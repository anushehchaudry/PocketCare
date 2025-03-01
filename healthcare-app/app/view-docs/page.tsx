"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDocs, deleteDoc } from "@/lib/api";
import {
  Search,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Trash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ViewDocsPage() {
  const [docs, setDocs] = useState<
    { id: string; file_name: string; analysis: string }[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await getDocs();
        console.log("API response:", response); // Detailed logging
        if (response.status === "success") {
          console.log("Fetched documents:", response.data); // Debugging line
          setDocs(response.data || []);
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    fetchDocs();
  }, []);

  const filteredDocs = docs.filter(
    (doc) =>
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.analysis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedDoc(expandedDoc === id ? null : id);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteDoc(id);
      if (response.status === "success") {
        setDocs(docs.filter((doc) => doc.id !== id));
      } else {
        console.error(response.message);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-6 w-6 text-purple-800" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">
            View Documents
          </h1>
        </div>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search documents by name or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-purple-800"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-800" />
        </div>
        <div className="space-y-6">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => (
              <Card key={doc.id} className="shadow-md">
                <CardContent className="p-6">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpand(doc.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-purple-800" />
                      </div>
                      <h2 className="text-xl font-semibold text-purple-800">
                        {doc.file_name}
                      </h2>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-orange-200 text-orange-800 flex items-center space-x-2">
                        <span>Analysis</span>
                        {expandedDoc === doc.id ? (
                          <ChevronUp className="h-6 w-6 text-orange-800" />
                        ) : (
                          <ChevronDown className="h-6 w-6 text-orange-800" />
                        )}
                      </Badge>
                      <Trash
                        className="h-6 w-6 text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                      />
                    </div>
                  </div>
                  {expandedDoc === doc.id && (
                    <div className="mt-4 text-sm text-gray-600 whitespace-pre-wrap">
                      {doc.analysis}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-gray-600">No documents found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
