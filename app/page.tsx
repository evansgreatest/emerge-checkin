"use client";

import Image from "next/image";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";

interface Attendee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  occupation?: string;
  expectation?: string;
  checked_in: boolean;
  checked_in_at?: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  // SWR hooks for data fetching
  const { data: stats, isLoading: isLoadingStats } = useSWR<{
    total: number;
    checkedIn: number;
    notCheckedIn: number;
  }>("/api/attendees/stats", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  const { data: tableData, isLoading: isLoadingTable } = useSWR<{
    attendees: Attendee[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/api/attendees/list?page=${currentPage}&limit=10`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  });

  const tableAttendees = tableData?.attendees || [];
  const totalPages = tableData?.pagination.totalPages || 1;
  const totalAttendees = tableData?.pagination.total || 0;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const handleTableCheckIn = async (attendee: Attendee) => {
    if (attendee.checked_in) return;

    setCheckingInId(attendee.id);
    try {
      const response = await fetch("/api/attendees/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: attendee.id }),
      });

      if (response.ok) {
        showSuccessMessage("Successfully checked in!");
        // Revalidate data
        mutate("/api/attendees/stats");
        mutate(`/api/attendees/list?page=${currentPage}&limit=10`);
      }
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Failed to check in attendee");
    } finally {
      setCheckingInId(null);
    }
  };

  const searchAttendees = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/attendees/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setAttendees(data.attendees || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckIn = async (attendee: Attendee) => {
    setIsCheckingIn(true);
    try {
      const response = await fetch("/api/attendees/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: attendee.id }),
      });

      if (response.ok) {
        const { attendee: updatedAttendee } = await response.json();
        setSelectedAttendee(updatedAttendee);
        setAttendees(
          attendees.map((a) => (a.id === attendee.id ? updatedAttendee : a))
        );
        showSuccessMessage("Successfully checked in!");
        setSearchQuery("");
        setAttendees([]);
        setSelectedAttendee(null);
        // Revalidate data
        mutate("/api/attendees/stats");
        mutate(`/api/attendees/list?page=${currentPage}&limit=10`);
      }
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Failed to check in attendee");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      const response = await fetch("/api/attendees/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const { isNew } = await response.json();
        showSuccessMessage(
          isNew
            ? "New attendee registered and checked in!"
            : "Attendee updated and checked in!"
        );
        setFormData({
          firstName: "",
          lastName: "",
          phone: "",
        });
        setShowRegisterForm(false);
        setSearchQuery("");
        setAttendees([]);
        setSelectedAttendee(null);
        // Revalidate data
        mutate("/api/attendees/stats");
        mutate(`/api/attendees/list?page=${currentPage}&limit=10`);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to register attendee");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Failed to register attendee");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/attendees/import", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imported > 0) {
          showSuccessMessage(
            `Successfully imported ${data.imported} attendees!`
          );
        } else {
          const errorMsg =
            data.errors > 0
              ? `Import completed but 0 attendees imported. ${data.errors} error(s). Check console for details.`
              : `No attendees were imported. Please check your file format.`;
          alert(errorMsg);
          if (data.errorDetails && data.errorDetails.length > 0) {
            console.error("Import errors:", data.errorDetails);
            console.log("First few errors:", data.errorDetails.slice(0, 10));
          }
        }
        // Revalidate data
        mutate("/api/attendees/stats");
        mutate(`/api/attendees/list?page=${currentPage}&limit=10`);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to import file");
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import file");
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="mx-auto ">
        {/* Header */}
        <div className="mb-8 text-center">
          {/* logo */}
          <div className="mb-4 flex justify-center">
            <Image src="/logo.jpg" alt="logo" width={100} height={100} />
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 animate-fade-in rounded-2xl bg-emerald-500 px-6 py-4 text-center text-white shadow-lg">
            <p className="text-lg font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-linear-to-br from-[#14662d] to-[#115524] p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">
                  Total Registered Attendees
                </p>
                <p className="mt-2 text-4xl font-bold text-white">
                  {isLoadingStats ? (
                    <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  ) : (
                    stats?.total || 0
                  )}
                </p>
              </div>
              <div className="rounded-full bg-white/20 p-4">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-600 p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">Checked In</p>
                <p className="mt-2 text-4xl font-bold text-white">
                  {isLoadingStats ? (
                    <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  ) : (
                    stats?.checkedIn || 0
                  )}
                </p>
              </div>
              <div className="rounded-full bg-white/20 p-4">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Import Button */}
        <div className="mb-6 flex justify-center">
          <label className="group relative cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileImport}
              className="hidden"
              disabled={isImporting}
            />
            {/* <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-lg transition-all hover:shadow-xl active:scale-95">
              {isImporting ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                  <span className="text-lg font-semibold text-slate-700">
                    Importing...
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="h-6 w-6 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-lg font-semibold text-slate-700">
                    Import Attendees
                  </span>
                </>
              )}
            </div> */}
          </label>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-white p-6 shadow-2xl md:p-10">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg
                    className="h-6 w-6 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && searchQuery.length >= 2) {
                      searchAttendees(searchQuery);
                    }
                  }}
                  placeholder="Search by name or phone..."
                  className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-5 pl-12 pr-4 text-lg text-slate-900 placeholder-slate-400 transition-all focus:border-[#14662d] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#14662d]/20"
                  autoFocus
                />
              </div>
              <button
                onClick={() => {
                  if (searchQuery.length >= 2) {
                    searchAttendees(searchQuery);
                  }
                }}
                disabled={isSearching || searchQuery.length < 2}
                className="rounded-xl bg-[#14662d] px-8 py-5 text-lg font-semibold text-white shadow-lg transition-all hover:bg-[#115524] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Searching...
                  </span>
                ) : (
                  "Search"
                )}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {attendees.length > 0 && (
            <div className="mb-6 space-y-2">
              {attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  onClick={() => setSelectedAttendee(attendee)}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    selectedAttendee?.id === attendee.id
                      ? "border-[#14662d] bg-[#14662d]/10 shadow-lg"
                      : "border-slate-200 bg-slate-50 hover:border-[#14662d]/50 hover:bg-[#14662d]/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">
                        {attendee.first_name} {attendee.last_name}
                      </h3>
                      {attendee.phone && (
                        <p className="text-slate-600">{attendee.phone}</p>
                      )}
                      {attendee.email && (
                        <p className="text-sm text-slate-500">
                          {attendee.email}
                        </p>
                      )}
                    </div>
                    {attendee.checked_in ? (
                      <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2">
                        <svg
                          className="h-5 w-5 text-emerald-600"
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
                        <span className="font-semibold text-emerald-700">
                          Checked In
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-full bg-amber-100 px-4 py-2">
                        <span className="font-semibold text-amber-700">
                          Not Checked In
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Attendee Actions */}
          {selectedAttendee && !selectedAttendee.checked_in && (
            <div className="mb-6">
              <button
                onClick={() => handleCheckIn(selectedAttendee)}
                disabled={isCheckingIn}
                className="w-full rounded-xl bg-[#14662d] px-8 py-5 text-xl font-bold text-white shadow-lg transition-all hover:bg-[#115524] hover:shadow-xl active:scale-95 disabled:opacity-50"
              >
                {isCheckingIn ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Checking In...
                  </span>
                ) : (
                  "Check In"
                )}
              </button>
            </div>
          )}

          {/* Register New Attendee */}
          {!showRegisterForm &&
            attendees.length === 0 &&
            searchQuery.length >= 2 && (
              <div className="mb-6 text-center">
                <p className="mb-4 text-slate-600">No attendees found</p>
                <button
                  onClick={() => setShowRegisterForm(true)}
                  className="rounded-xl border-2 border-[#14662d] bg-white px-8 py-4 text-lg font-semibold text-[#14662d] transition-all hover:bg-[#14662d]/10 active:scale-95"
                >
                  Register New Attendee
                </button>
              </div>
            )}

          {!showRegisterForm && searchQuery.length < 2 && (
            <div className="text-center">
              <button
                onClick={() => setShowRegisterForm(true)}
                className="rounded-xl border-2 border-[#14662d] bg-white px-8 py-4 text-lg font-semibold text-[#14662d] transition-all hover:bg-[#14662d]/10 active:scale-95"
              >
                Register New Attendee
              </button>
            </div>
          )}

          {/* Registration Form */}
          {showRegisterForm && (
            <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                Register New Attendee
              </h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#14662d] focus:outline-none focus:ring-2 focus:ring-[#14662d]/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-[#14662d] focus:outline-none focus:ring-2 focus:ring-[#14662d]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isRegistering}
                    className="flex-1 rounded-xl bg-[#14662d] px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-[#115524] hover:shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {isRegistering ? "Registering..." : "Register & Check In"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegisterForm(false);
                      setFormData({
                        firstName: "",
                        lastName: "",
                        phone: "",
                      });
                    }}
                    className="rounded-xl border-2 border-slate-300 bg-white px-6 py-4 text-lg font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Attendees Table */}
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-2xl md:p-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-slate-900">
              All Registered Attendees
            </h2>
            <div className="text-sm text-slate-600">
              Total: <span className="font-semibold">{totalAttendees}</span>
            </div>
          </div>

          {isLoadingTable ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#14662d]"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider text-slate-700">
                        First Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider text-slate-700">
                        Last Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider text-slate-700">
                        Phone Number
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider text-slate-700">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider text-slate-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableData &&
                    Array.isArray(tableData.attendees) &&
                    tableData.attendees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-slate-500"
                        >
                          No attendees found. Import your Excel file to get
                          started.
                        </td>
                      </tr>
                    ) : tableAttendees.length > 0 ? (
                      tableAttendees.map((attendee) => (
                        <tr
                          key={attendee.id}
                          className="transition-colors hover:bg-slate-50"
                        >
                          <td className="whitespace-nowrap px-6 py-4 text-base font-medium capitalize text-slate-900">
                            {attendee.first_name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-base font-medium capitalize text-slate-900">
                            {attendee.last_name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-base text-slate-600">
                            {attendee.phone || (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {attendee.checked_in ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2">
                                <svg
                                  className="h-4 w-4 text-emerald-600"
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
                                <span className="text-sm font-semibold text-emerald-700">
                                  Checked In
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2">
                                <span className="text-sm font-semibold text-amber-700">
                                  Pending
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center">
                            {attendee.checked_in ? (
                              <span className="text-sm text-slate-400">
                                Already checked in
                              </span>
                            ) : (
                              <button
                                onClick={() => handleTableCheckIn(attendee)}
                                disabled={checkingInId === attendee.id}
                                className="rounded-lg bg-[#14662d] px-6 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#115524] hover:shadow-lg active:scale-95 disabled:opacity-50"
                              >
                                {checkingInId === attendee.id ? (
                                  <span className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    Checking...
                                  </span>
                                ) : (
                                  "Check In"
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : null}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6">
                  <div className="text-sm text-slate-600">
                    Showing page{" "}
                    <span className="font-semibold">{currentPage}</span> of{" "}
                    <span className="font-semibold">{totalPages}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`h-10 w-10 rounded-lg text-sm font-semibold transition-all ${
                                currentPage === pageNum
                                  ? "bg-[#14662d] text-white shadow-md"
                                  : "border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                              } active:scale-95`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
