"use client";

import { useState } from "react";
import { usePurchaseSubscriptionMutation } from "@/lib/features/portal/portalApi";
import { useAppSelector } from "@/lib/hooks";

export default function PurchasePage() {
  const user = useAppSelector((state) => state.auth.user);
  const role = String(user?.role ?? "").toUpperCase();
  const isSuperAdmin = role === "SUPER_ADMIN";

  const [purchaseSubscription, { isLoading }] = usePurchaseSubscriptionMutation();
  const [message, setMessage] = useState("");

  const [societyId, setSocietyId] = useState("");
  const [planName, setPlanName] = useState("");
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    try {
      await purchaseSubscription({
        societyId: Number(societyId),
        planName,
        price: Number(price),
        startDate,
        endDate,
        status: status as "ACTIVE" | "EXPIRED",
      }).unwrap();
      setMessage("Purchase/subscription created successfully.");
      setSocietyId("");
      setPlanName("");
      setPrice("");
      setStartDate("");
      setEndDate("");
      setStatus("ACTIVE");
    } catch {
      setMessage("Failed to create purchase/subscription.");
    }
  };

  if (!isSuperAdmin) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-rose-600">Purchase</h2>
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4">
          Only SUPER_ADMIN can access purchase.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-rose-600">Purchase Subscription</h2>
      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4 max-w-xl">
        <div className="text-left">
          <label className="block text-sm font-medium mb-1">Society ID</label>
          <input
            type="number"
            value={societyId}
            onChange={(e) => setSocietyId(e.target.value)}
            required
            className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
          />
        </div>
        <div className="text-left">
          <label className="block text-sm font-medium mb-1">Plan Name</label>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            required
            className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
          />
        </div>
        <div className="text-left">
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
          />
        </div>
        <div className="text-left">
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
          />
        </div>
        <div className="text-left">
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
          />
        </div>
        <div className="text-left">
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border-b-2 border-rose-400 focus:outline-none focus:border-rose-600"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg text-white ${
            isLoading ? "bg-rose-300 cursor-not-allowed" : "bg-rose-500 hover:bg-rose-600"
          }`}
        >
          {isLoading ? "Submitting..." : "Create Purchase"}
        </button>

        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </form>
    </section>
  );
}
