"use client";
import { useState } from "react";

export default function PasswordInput({
  name,
  placeholder,
  maxLength,
  minLength,
  extraClass,
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <input
        name={name || "password"}
        type={showPassword ? "text" : "password"}
        required
        placeholder={placeholder || ""}
        maxLength={maxLength}
        minLength={minLength}
        className={`appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10 ${extraClass || ""}`}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
      >
        {showPassword ? "🔒" : "👁️"}
      </button>
    </div>
  );
}
