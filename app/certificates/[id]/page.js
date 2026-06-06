// app/certificates/[id]/page.js

export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { certificates, students, school_settings } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import PrintButton from "./PrintButton";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { users } from "@/lib/schema";

const CERT_TITLES = {
  tc: "TRANSFER CERTIFICATE",
  character: "CHARACTER CERTIFICATE",
  bonafide: "BONAFIDE CERTIFICATE",
  birth: "BIRTH CERTIFICATE",
};

export default async function CertificatePrintPage({ params }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  const { id } = await params;

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
      roll_number: students.roll_number,
      admission_no: students.admission_no,
      dob: students.dob,
      gender: students.gender,
      father_name: students.father_name,
      mother_name: students.mother_name,
      address: students.address,
      religion: students.religion,
      caste: students.caste,
      admission_date: students.admission_date,
    })
    .from(certificates)
    .leftJoin(students, eq(certificates.student_id, students.id))
    .where(
      and(eq(certificates.id, Number(id)), eq(certificates.user_id, MASTER_USER_ID)),
    );

  if (rows.length === 0) notFound();
  const c = rows[0];

  const settingsRows = await db
    .select()
    .from(school_settings)
    .where(eq(school_settings.user_id, MASTER_USER_ID));
  const school = settingsRows[0] || {};

  const title = CERT_TITLES[c.cert_type] || "CERTIFICATE";

  return (
    <div>
      {/* Screen Controls — hidden on print */}
      <div className="print:hidden flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 text-xs mt-0.5">{c.student_name}</p>
        </div>
        <div className="flex gap-2">
          <PrintButton />
          <a
            href="/certificates"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
          >
            &larr; Back
          </a>
        </div>
      </div>

      {/* Print Area */}
      <div
        id="print-area"
        className="bg-white rounded-xl border border-gray-200 p-6 print:p-8 print:rounded-none print:border-0 print:shadow-none max-w-2xl mx-auto"
      >
        {/* School Header */}
        <div className="text-center mb-6 border-b border-gray-300 pb-4">
          {school.logo_url && (
            <img
              src={school.logo_url}
              alt="School Logo"
              className="h-16 w-16 object-contain mx-auto mb-2"
            />
          )}
          <h2 className="text-xl font-bold text-gray-900 uppercase">
            {school.school_name || "School Name"}
          </h2>
          {school.address && (
            <p className="text-xs text-gray-500 mt-1">{school.address}</p>
          )}
          <div className="flex justify-center gap-4 text-xs text-gray-500 mt-1 flex-wrap">
            {school.phone && <span>📞 {school.phone}</span>}
            {school.affiliation_no && (
              <span>Affiliation No: {school.affiliation_no}</span>
            )}
            {school.school_code && (
              <span>School Code: {school.school_code}</span>
            )}
          </div>
        </div>

        {/* Certificate Title */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold tracking-widest text-gray-900 underline underline-offset-4">
            {title}
          </h3>
          {c.serial_no && (
            <p className="text-xs text-gray-500 mt-1">
              Serial No: <strong>{c.serial_no}</strong>
            </p>
          )}
        </div>

        {/* Certificate Body */}
        <div className="text-sm text-gray-800 leading-relaxed space-y-3 mb-6">
          <p>
            This is to certify that{" "}
            <strong>{c.student_name || "_______________"}</strong>
            {c.gender === "Male"
              ? ", son of "
              : c.gender === "Female"
                ? ", daughter of "
                : ", child of "}
            <strong>{c.father_name || "_______________"}</strong>
            {c.mother_name ? (
              <>
                {" "}
                and <strong>{c.mother_name}</strong>
              </>
            ) : null}
            , is/was a student of this school.
          </p>

          <table className="w-full text-sm border-collapse mt-3">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500 w-44">Admission No.</td>
                <td className="py-2 font-medium">{c.admission_no || "—"}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Roll Number</td>
                <td className="py-2 font-medium">{c.roll_number || "—"}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Date of Birth</td>
                <td className="py-2 font-medium">{c.dob || "—"}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Class</td>
                <td className="py-2 font-medium">
                  {c.student_class || "—"} {c.student_section || ""}
                </td>
              </tr>
              {c.religion && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Religion</td>
                  <td className="py-2 font-medium">{c.religion}</td>
                </tr>
              )}
              {c.caste && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Caste</td>
                  <td className="py-2 font-medium">{c.caste}</td>
                </tr>
              )}
              {c.address && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Address</td>
                  <td className="py-2 font-medium">{c.address}</td>
                </tr>
              )}
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-500">Conduct</td>
                <td className="py-2 font-medium">{c.conduct || "Good"}</td>
              </tr>
              {c.admission_date && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Admission Date</td>
                  <td className="py-2 font-medium">
                    {new Date(c.admission_date).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              )}
              {c.last_class && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Last Class</td>
                  <td className="py-2 font-medium">{c.last_class}</td>
                </tr>
              )}
              {c.last_exam_passed && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Last Exam Passed</td>
                  <td className="py-2 font-medium">{c.last_exam_passed}</td>
                </tr>
              )}
              {c.reason && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-500">Reason</td>
                  <td className="py-2 font-medium">{c.reason}</td>
                </tr>
              )}
            </tbody>
          </table>

          {c.custom_content && (
            <p className="mt-3 text-gray-700">{c.custom_content}</p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 flex justify-between items-end text-sm">
          <div>
            <p className="text-gray-500 text-xs">Date of Issue</p>
            <p className="font-medium">{c.issue_date}</p>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 w-36 mb-1" />
            <p className="text-xs text-gray-500">Class Teacher</p>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 w-36 mb-1" />
            <p className="text-xs text-gray-500">
              {school.principal_name
                ? school.principal_name
                : "Principal / Head"}
            </p>
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
