export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { fee_packages, fee_package_items, users } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

const FIXED_LABELS = {
  monthly: "Monthly Fee",
  transport: "Transport Fee",
  amenity: "Amenity Fee",
  exam: "Exam Fee",
  admission: "Admission Fee",
  late: "Late Payment",
};

function labelOf(type) {
  if (FIXED_LABELS[type]) return FIXED_LABELS[type];
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function FeeStructurePage() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];

  const allPackages = await db
    .select()
    .from(fee_packages)
    .where(eq(fee_packages.user_id, MASTER_USER_ID))
    .orderBy(fee_packages.class);

  const packageIds = allPackages.map((p) => p.id);
  const allItems =
    packageIds.length > 0
      ? await db
          .select()
          .from(fee_package_items)
          .where(inArray(fee_package_items.package_id, packageIds))
      : [];

  const packagesWithItems = allPackages.map((pkg) => ({
    ...pkg,
    items: allItems.filter((item) => item.package_id === pkg.id),
  }));

  const sortedPackages = packagesWithItems.sort((a, b) => {
    const na = parseInt(a.class),
      nb = parseInt(b.class);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return (a.class || "").localeCompare(b.class || "");
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fee Packages</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Class-wise fee template
          </p>
        </div>
        <Link
          href="/fee-structure/packages/add"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Package
        </Link>
      </div>

      {sortedPackages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          No packages defined yet. Create your first package.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden"
            >
              <div className="bg-indigo-600 px-4 py-2.5 flex justify-between items-center">
                <span className="text-white font-bold text-sm">
                  Class {pkg.class}
                </span>
                <span className="text-indigo-200 text-xs">
                  {pkg.academic_year}
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {pkg.items.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-2.5 flex justify-between items-center"
                  >
                    <p className="text-sm text-gray-700">
                      {labelOf(item.fee_type)}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      ₹{item.amount}
                    </p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 px-4 py-2.5 flex justify-between items-center">
                <span className="text-xs text-gray-500">Total</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-indigo-600">
                    ₹{pkg.total_amount}
                  </span>
                  <Link
                    href={`/fee-structure/packages/${pkg.id}/edit`}
                    className="text-xs text-indigo-600 font-medium"
                  >
                    Edit
                  </Link>
                  <form
                    method="POST"
                    action="/api/fee-structure/packages/delete"
                  >
                    <input type="hidden" name="id" value={pkg.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-500 font-medium"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}