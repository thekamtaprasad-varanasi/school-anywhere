export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { certificates, students, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

const CERT_LABELS = {
  tc: "Transfer Certificate",
  character: "Character Certificate",
  bonafide: "Bonafide Certificate",
  birth: "Birth Certificate",
};

export default async function EditCertificatePage({ params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) redirect("/login");
  const session = await getSession(token);
  if (!session) redirect("/login");

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  if (!user) redirect("/login");

  const { id } = await params;
  const certId = parseInt(id);
  if (!certId) notFound();

  const rows = await db
    .select({
      id: certificates.id,
      cert_type: certificates.cert_type,
      issue_date: certificates.issue_date,
      serial_no: certificates.serial_no,
      reason: certificates.reason,
      last_class: certificates.last_class,
      last_exam_passed: certificates.last_exam_passed,
      conduct: certificates.conduct,
      custom_content: certificates.custom_content,
      student_name: students.name,
      student_class: students.class,
      student_section: students.section,
    })
    .from(certificates)
    .leftJoin(students, eq(certificates.student_id, students.id))
    .where(
      and(eq(certificates.id, certId), eq(certificates.user_id, 2)),
    );

  if (rows.length === 0) notFound();
  const cert = rows[0];

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Certificate</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {CERT_LABELS[cert.cert_type] || cert.cert_type} — {cert.student_name} (Class {cert.student_class} {cert.student_section || ""})
          </p>
        </div>
        <a
          href="/certificates"
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
        >
          ← Back
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 max-w-2xl">
        <form
          action="/api/certificates/update"
          method="POST"
          className="space-y-4"
        >
          <input type="hidden" name="id" value={cert.id} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="issue_date"
                defaultValue={cert.issue_date || ""}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial No
              </label>
              <input
                type="text"
                name="serial_no"
                defaultValue={cert.serial_no || ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conduct
            </label>
            <select
              name="conduct"
              defaultValue={cert.conduct || "Good"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Satisfactory">Satisfactory</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Class Attended
            </label>
            <input
              type="text"
              name="last_class"
              defaultValue={cert.last_class || ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Exam Passed
            </label>
            <input
              type="text"
              name="last_exam_passed"
              defaultValue={cert.last_exam_passed || ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason / Purpose
            </label>
            <input
              type="text"
              name="reason"
              defaultValue={cert.reason || ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="custom_content"
              rows={3}
              defaultValue={cert.custom_content || ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              Save Changes
            </button>
            <a
              href="/certificates"
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium text-center"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}