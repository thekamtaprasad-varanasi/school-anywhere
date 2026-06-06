"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FlashMessageClient({ flashData }) {
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!flashData) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [flashData]);

  if (!flashData || !isVisible) return null;

  const bgColor =
    {
      success: "bg-green-50 border-green-400 text-green-700",
      error: "bg-red-50 border-red-400 text-red-700",
      warning: "bg-yellow-50 border-yellow-400 text-yellow-700",
    }[flashData.type] || "bg-blue-50 border-blue-400 text-blue-700";

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${bgColor} shadow-lg max-w-md animate-slideIn`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{flashData.message}</p>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  );
}
