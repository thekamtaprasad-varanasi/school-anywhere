export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { admission_applications } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ApplicationsPage({ searchParams }) {
  const params = await searchParams;
  const tab = params?.tab || "pending";

  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");

  const all = await db
    .select()
    .from(admission_applications)
    .where(eq(admission_applications.user_id, MASTER_USER_ID))
    .orderBy(desc(admission_applications.created_at));

  const counts = {
    pending: all.filter((a) => a.status === "pending").length,
    approved: all.filter((a) => a.status === "approved").length,
    rejected: all.filter((a) => a.status === "rejected").length,
  };

  const filtered = all.filter((a) => a.status === tab);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Online Admission Applications</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Submitted from www.spsvaranasi.in
        </p>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: "pending", label: "Pending", color: "amber" },
          { key: "approved", label: "Approved", color: "green" },
          { key: "rejected", label: "Rejected", color: "red" },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <a
              key={t.key}
              href={`/admissions/applications?tab=${t.key}`}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium ${
                active
                  ? t.color === "amber"
                    ? "bg-amber-600 text-white"
                    : t.color === "green"
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {t.label} ({counts[t.key]})
            </a>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          No {tab} applications.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="bg-indigo-600 px-4 py-2.5 flex justify-between items-center">
                <div className="min-w-0">
                  <p className="text-white font-bold text-sm truncate">{a.name}</p>
                  <p className="text-indigo-200 text-xs">
                    Class {a.applying_class} · {a.phone}
                  </p>
                </div>
                <p className="text-indigo-100 text-xs">
                  {a.created_at
                    ? new Date(a.created_at).toLocaleDateString("en-IN")
                    : ""}
                </p>
              </div>

              <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {a.dob && <Row label="DOB" value={a.dob} />}
                {a.father_name && <Row label="Father" value={a.father_name} />}
                {a.mother_name && <Row label="Mother" value={a.mother_name} />}
                {a.guardian_name && <Row label="Guardian" value={a.guardian_name} />}
                {a.occupation && <Row label="Occupation" value={a.occupation} />}
                {a.alt_phone && <Row label="Alt Phone" value={a.alt_phone} />}
                {a.religion && <Row label="Religion" value={a.religion} />}
                {a.previous_school && (
                  <Row label="Previous School" value={a.previous_school} />
                )}
                {a.transport_required === 1 && (
                  <Row label="Transport" value="Yes" />
                )}
              </div>

              {a.address && (
                <div className="px-4 pb-2 text-sm text-gray-600">
                  <span className="text-gray-400">Address:</span> {a.address}
                </div>
              )}
              {a.sibling_info && (
                <div className="px-4 pb-2 text-sm text-gray-600">
                  <span className="text-gray-400">Sibling:</span> {a.sibling_info}
                </div>
              )}

              {tab === "pending" && (
                <div className="bg-gray-50 px-4 py-2.5 flex gap-2 justify-end">
                  <form
                    method="POST"
                    action={`/api/admissions/applications/${a.id}/reject`}
                  >
                    <button
                      type="submit"
                      className="bg-white border border-red-300 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </form>
                  <form
                    method="POST"
                    action={`/api/admissions/applications/${a.id}/approve`}
                  >
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700"
                    >
                      Approve & Create Student
                    </button>
                  </form>
                </div>
              )}

              {tab === "rejected" && (
                <div className="bg-red-50 px-4 py-2 text-xs text-red-600">
                  Rejected
                </div>
              )}
              {tab === "approved" && (
                <div className="bg-green-50 px-4 py-2 text-xs text-green-700">
                  Approved · Student created
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <span className="text-gray-400">{label}:</span>{" "}
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}