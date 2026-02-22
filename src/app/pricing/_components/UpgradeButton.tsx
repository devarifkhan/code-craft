"use client";
import { Zap } from "lucide-react";
import { useState } from "react";

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white
        bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg
        hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <Zap className="w-5 h-5" />
      {loading ? "Redirecting..." : "Upgrade to Pro"}
    </button>
  );
}
