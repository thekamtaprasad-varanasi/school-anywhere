// app/transport/page.js

export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { transport, student_transport, students } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { users } from "@/lib/schema";

export default async function TransportPage() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  const allRoutes = await db
    .select()
    .from(transport)
    .where(eq(transport.user_id, MASTER_USER_ID))
    .orderBy(transport.route_name);

  const allAssignments = await db
    .select({
      id: student_transport.id,
      student_id: student_transport.student_id,
      transport_id: student_transport.transport_id,
      academic_year: student_transport.academic_year,
      student_name: students.name,
      student_class: students.class,
      student_section: students.section,
      roll_number: students.roll_number,
      phone: students.phone,
    })
    .from(student_transport)
    .leftJoin(students, eq(student_transport.student_id, students.id));

  const assignMap = {};
  allAssignments.forEach((a) => {
    if (!assignMap[a.transport_id]) assignMap[a.transport_id] = [];
    assignMap[a.transport_id].push(a);
  });

  const totalStudents = allAssignments.length;
  const totalRoutes = allRoutes.length;
  const totalCollection = allAssignments.reduce((sum, a) => {
    const route = allRoutes.find((r) => r.id === a.transport_id);
    return sum + (route?.monthly_fee || 0);
  }, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transport</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Routes · Stops · Students
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/transport/students/add"
            className="bg-white border border-indigo-300 text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium"
          >
            + Assign
          </Link>
          <Link
            href="/transport/add"
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
          >
            + Route
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-indigo-700">{totalRoutes}</p>
          <p className="text-xs text-indigo-500">Routes</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-green-700">{totalStudents}</p>
          <p className="text-xs text-green-500">Students</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-yellow-700">
            ₹{totalCollection}
          </p>
          <p className="text-xs text-yellow-600">Monthly</p>
        </div>
      </div>

      {/* Routes List */}
      {allRoutes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          No routes added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {allRoutes.map((route) => {
            const routeStudents = assignMap[route.id] || [];
            return (
              <div
                key={route.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="bg-indigo-600 px-4 py-2.5 flex justify-between items-center">
                  <div>
                    <span className="text-white font-bold text-sm">
                      {route.route_name}
                    </span>
                    <span className="text-indigo-200 text-xs ml-2">
                      — {route.stop_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-200 text-xs">
                      ₹{route.monthly_fee}/mo
                    </span>
                    <span className="bg-white text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {routeStudents.length} students
                    </span>
                  </div>
                </div>

                {(route.driver_name || route.vehicle_no) && (
                  <div className="px-4 py-2 bg-indigo-50 flex gap-4 text-xs text-indigo-600">
                    {route.driver_name && <span>🚌 {route.driver_name}</span>}
                    {route.vehicle_no && <span>🔢 {route.vehicle_no}</span>}
                  </div>
                )}

                {routeStudents.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-gray-400">
                    No students assigned.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {routeStudents.map((a, idx) => {
                      const phone = a.phone?.replace(/\D/g, "") || "";
                      const fullPhone = phone.startsWith("91")
                        ? phone
                        : `91${phone}`;
                      const msg = encodeURIComponent(
                        `Dear Parent, transport fee of ₹${route.monthly_fee} for ${a.student_name} is due. — School`,
                      );
                      return (
                        <div
                          key={a.id}
                          className="px-4 py-2.5 flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-gray-400 w-5 shrink-0">
                              {idx + 1}.
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {a.student_name}
                              </p>
                              <p className="text-xs text-gray-400">
                                Class {a.student_class}{" "}
                                {a.student_section || ""}
                                {a.roll_number
                                  ? ` · Roll ${a.roll_number}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <div className="ml-2 shrink-0 text-right">
                            <p className="text-xs font-bold text-green-700">
                              ₹{route.monthly_fee}
                            </p>
                            <div className="flex flex-col gap-0.5 items-end">
                              <Link
                                href={`/transport/receipt?student_id=${a.student_id}`}
                                className="text-xs text-indigo-600 font-medium"
                              >
                                🖨️ Receipt
                              </Link>
                              {a.phone && (
                                <a
                                  href={`https://wa.me/${fullPhone}?text=${msg}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-green-600"
                                >
                                  📲 Remind
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
