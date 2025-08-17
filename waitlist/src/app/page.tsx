"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitted(true);
        setEmail("");
      } else {
        console.error("Failed to join waitlist");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-6xl font-extrabold text-foreground mb-6">
              The Open-Source OpusClip Alternative
            </h1>
          </div>

          {/* Waitlist Form */}
          <div className="border rounded-lg p-8 bg-card">
            {!submitted ? (
              <>
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  Join the Waitlist
                </h3>
                <p className="text-muted-foreground mb-6">
                  Be among the first to experience SupoClip when we launch.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-lg py-6"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 text-lg font-semibold"
                  >
                    {loading ? "Joining..." : "Join Waitlist"}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-foreground text-background rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  You&apos;re On The List!
                </h3>
                <p className="text-muted-foreground">
                  Thanks for joining! We&apos;ll send you updates and early access when SupoClip is ready.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
