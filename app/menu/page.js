export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const menuItems = [
  { href: "/dashboard", icon: "🏠", label: "Home" },
  { href: "/students", icon: "🎓", label: "Students" },
  { href: "/admissions", icon: "📋", label: "Admissions" },
  { href: "/teachers", icon: "👨‍🏫", label: "Teachers" },
  { href: "/teacher-login", icon: "🔑", label: "Teacher Login" },
  { href: "/fees", icon: "💰", label: "Fees" },
  { href: "/fee-structure", icon: "🏷️", label: "Fee Structure" },
  { href: "/attendance", icon: "✅", label: "Attendance" },
  { href: "/exams", icon: "📝", label: "Exams & Results" },
  { href: "/marksheet", icon: "📄", label: "Marksheet" },
  { href: "/certificates", icon: "🏅", label: "Certificates" },
  { href: "/transport", icon: "🚌", label: "Transport" },
  { href: "/promote", icon: "⬆️", label: "Promote" },
  { href: "/notices", icon: "📢", label: "Notice Board" },
  { href: "/timetable", icon: "🗓️", label: "Timetable" },
  { href: "/reports", icon: "📊", label: "Reports" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
];

export default async function MenuPage() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");

  return (
    <div className="pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Menu</h1>
      <p className="text-gray-500 text-xs mb-5">All features in one place</p>

      <div className="grid grid-cols-3 gap-3">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center justify-center text-center active:scale-95 transition aspect-square"
          >
            <span className="text-3xl mb-2">{item.icon}</span>
            <span className="text-xs font-medium text-gray-700 leading-tight">
              {item.label}
            </span>
          </Link>
        ))}
        <form action="/logout" method="POST" className="contents">
          <button
            type="submit"
            className="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-4 flex flex-col items-center justify-center text-center active:scale-95 transition aspect-square w-full"
          >
            <span className="text-3xl mb-2">🚪</span>
            <span className="text-xs font-medium text-red-600 leading-tight">
              Logout
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}