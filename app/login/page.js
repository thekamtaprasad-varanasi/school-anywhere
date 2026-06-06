"use client";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm text-center">
        <div className="text-4xl mb-3">🏫</div>
        <div className="text-2xl font-bold text-indigo-700 mb-1">Nishant School</div>
        <div className="text-gray-400 text-xs mb-8">School Management Software</div>

        <div className="space-y-3">
          <button
            onClick={() => { window.location.href = "/api/auth/login"; }}
            className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Admin Login — Google
          </button>

          <a
            href="/teacher-login"
            className="flex items-center justify-center gap-3 w-full border border-indigo-200 rounded-xl px-4 py-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition"
          >
            👨‍🏫 Teacher Login — PIN
          </a>

          <a
            href="/student/login"
            className="flex items-center justify-center gap-3 w-full border border-green-200 rounded-xl px-4 py-3 text-sm font-medium text-green-700 hover:bg-green-50 transition"
          >
            🎓 Student / Parent Login
          </a>
        </div>

        <p className="text-xs text-gray-400 mt-6">First time? 7 days completely free.</p>
      </div>
    </div>
  );
}