"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { checkQuestionnaireStatus } from "@/lib/api";

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const result = await checkQuestionnaireStatus();
        if (result.status === "success" && result.data?.hasCompleted) {
          setProfileData(result.data);
        } else {
          router.replace("/dashboard");
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        router.replace("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p>Loading...</p>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-6 w-6 text-primary" />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          </div>

          {/* Profile Header Card */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <h2 className="text-xl font-medium mb-1">
                Hi {profileData.name},
              </h2>
              <p className="text-primary-foreground/90">
                Here is your profile information
              </p>
            </CardContent>
          </Card>

          {/* Profile Information Card */}
          <Card className="bg-white text-gray-900 shadow-md">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">Name</h3>
                  <p className="text-sm text-gray-500">{profileData.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Age</h3>
                  <p className="text-sm text-gray-500">{profileData.age}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Pre-existing Conditions
                  </h3>
                  <p className="text-sm text-gray-500">
                    {profileData.pre_existing_conditions}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Overall Health</h3>
                  <p className="text-sm text-gray-500">
                    {profileData.overall_health}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
