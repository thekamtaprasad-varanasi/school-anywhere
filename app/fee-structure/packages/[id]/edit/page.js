export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { fee_packages, fee_package_items } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import EditPackageForm from "./EditPackageForm";

export default async function EditPackagePage({ params }) {
  const { id } = await params;
  const packageId = parseInt(id, 10);
  if (!packageId) redirect("/fee-structure");

  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");

  const pkgRows = await db
    .select()
    .from(fee_packages)
    .where(and(eq(fee_packages.id, packageId), eq(fee_packages.user_id, 2)));
  const pkg = pkgRows[0];
  if (!pkg) redirect("/fee-structure");

  const items = await db
    .select()
    .from(fee_package_items)
    .where(eq(fee_package_items.package_id, packageId));

  const pkgWithItems = { ...pkg, items };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Edit Fee Package</h1>
        <p className="text-gray-500 text-xs mt-0.5">Update class-wise fee template</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <EditPackageForm pkg={pkgWithItems} />
      </div>
    </div>
  );
}