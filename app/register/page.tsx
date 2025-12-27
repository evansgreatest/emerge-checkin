"use client";

import Image from "next/image";
import { useState } from "react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    occupation: "",
    expectation: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      setError("First name, last name, and phone number are required");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/attendees/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || null,
          phone: formData.phone,
          occupation: formData.occupation || null,
          expectation: formData.expectation || null,
          checkIn: false, // Don't auto-check-in for online registration
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          occupation: "",
          expectation: "",
        });
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to register. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Image src="/logo.jpg" alt="logo" width={100} height={100} />
          </div>
          <h1 className="mb-2 text-5xl font-bold tracking-tight text-slate-900 md:text-6xl">
            Event Registration
          </h1>
          <p className="text-lg text-slate-600">
            Register online to secure your spot at our event
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 animate-fade-in rounded-2xl bg-emerald-500 px-6 py-4 text-center text-white shadow-lg">
            <div className="flex items-center justify-center gap-3">
              <svg
                className="h-6 w-6"
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
              <div>
                <p className="text-lg font-semibold">
                  Registration Successful!
                </p>
                <p className="text-sm text-emerald-100">
                  You&apos;re all set. We&apos;ll see you at the event!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 animate-fade-in rounded-2xl bg-red-500 px-6 py-4 text-center text-white shadow-lg">
            <p className="text-lg font-semibold">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <div className="rounded-3xl bg-white p-6 shadow-2xl md:p-10">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            Complete Your Registration
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Name and Last Name */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all focus:border-[#14662d] focus:outline-none focus:ring-2 focus:ring-[#14662d]/20"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all focus:border-[#14662d] focus:outline-none focus:ring-2 focus:ring-[#14662d]/20"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all focus:border-[#14662d] focus:outline-none focus:ring-2 focus:ring-[#14662d]/20"
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all focus:border-[#14662d] focus:outline-none focus:ring-2 focus:ring-[#14662d]/20"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            {/* Occupation */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Occupation
              </label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) =>
                  setFormData({ ...formData, occupation: e.target.value })
                }
                className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all focus:border-[#14662d] focus:outline-none focus:ring-2 focus:ring-[#14662d]/20"
                placeholder="Your current occupation or job title"
              />
            </div>

            {/* Expectation */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Your Expectation
              </label>
              <textarea
                value={formData.expectation}
                onChange={(e) =>
                  setFormData({ ...formData, expectation: e.target.value })
                }
                rows={4}
                className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all focus:border-[#14662d] focus:outline-none focus:ring-2 focus:ring-[#14662d]/20"
                placeholder="What are you looking forward to at this event?"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#14662d] px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-[#115524] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Registering...
                  </span>
                ) : (
                  "Complete Registration"
                )}
              </button>
            </div>

            <p className="text-center text-sm text-slate-500">
              <span className="text-red-500">*</span> Required fields
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

