import { db } from "@/lib/db";
import { students, teachers } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { setFlash } from "@/lib/flash";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("teacher_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/teacher-login", request.url), { status: 303 });
  }

  let payload;
  try {
    const verified = await jwtVerify(token, SECRET);
    payload = verified.payload;
  } catch {
    return NextResponse.redirect(new URL("/teacher-login", request.url), { status: 303 });
  }

  const teacherResult = await db
    .select()
    .from(teachers)
    .where(eq(teachers.id, payload.teacherId));
  const teacher = teacherResult[0];
  if (!teacher) {
    return NextResponse.redirect(new URL("/teacher-login", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const name = formData.get("name");
  const className = formData.get("class");
  const section = formData.get("section");
  const roll_number = formData.get("roll_number");
  const phone = formData.get("phone");
  const admission_no = formData.get("admission_no") || null;

  if (!name || !className || !section || !roll_number || !phone) {
    await setFlash("error", "Name, class, section, roll number and phone are required");
    return NextResponse.redirect(
      new URL("/teacher/students/add", request.url),
      { status: 303 },
    );
  }

  // ─── Duplicate check 1: same class + section + roll_number ─────────────
  const rollConflict = await db
    .select()
    .from(students)
    .where(
      and(
        eq(students.user_id, teacher.user_id),
        eq(students.class, className),
        eq(students.section, section),
        eq(students.roll_number, roll_number),
      ),
    );
  if (rollConflict.length > 0) {
    await setFlash(
      "error",
      `Roll No. ${roll_number} already exists in Class ${className}-${section} (${rollConflict[0].name})`,
    );
    return NextResponse.redirect(
      new URL("/teacher/students/add", request.url),
      { status: 303 },
    );
  }

  // ─── Duplicate check 2: same admission_no ──────────────────────────────
  if (admission_no) {
    const admConflict = await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.user_id, teacher.user_id),
          eq(students.admission_no, admission_no),
        ),
      );
    if (admConflict.length > 0) {
      await setFlash(
        "error",
        `Admission No. ${admission_no} already exists (${admConflict[0].name} — Class ${admConflict[0].class}-${admConflict[0].section})`,
      );
      return NextResponse.redirect(
        new URL("/teacher/students/add", request.url),
        { status: 303 },
      );
    }
  }

  const admission_date = formData.get("admission_date");

  // ─── Insert ────────────────────────────────────────────────────────────
  await db.insert(students).values({
    name,
    class: className,
    section,
    roll_number,
    phone,
    admission_no,
    admission_date: admission_date ? new Date(admission_date) : new Date(),
    gender: formData.get("gender") || null,
    dob: formData.get("dob") || null,
    father_name: formData.get("father_name") || null,
    mother_name: formData.get("mother_name") || null,
    guardian_name: formData.get("guardian_name") || null,
    alt_phone: formData.get("alt_phone") || null,
    religion: formData.get("religion") || null,
    caste: formData.get("caste") || null,
    address: formData.get("address") || null,
    academic_year: formData.get("academic_year") || null,
    fee_status: formData.get("fee_status") || "pending",
    user_id: teacher.user_id,
  });

  await setFlash("success", "Student added successfully!");
  return NextResponse.redirect(
    new URL("/teacher/students", request.url),
    { status: 303 },
  );
}