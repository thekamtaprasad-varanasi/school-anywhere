export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import PackageForm from "./PackageForm";

export default async function AddPackagePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = token ? await getSession(token) : null;
  if (!session) redirect("/login");

  const now = new Date();
  const baseYear =
    now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  const currentAcademicYear = `${baseYear}-${String(baseYear + 1).slice(-2)}`;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Create Fee Package</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Class-wise fee template
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <PackageForm currentAcademicYear={currentAcademicYear} />
      </div>
    </div>
  );
}