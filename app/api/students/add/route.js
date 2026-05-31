// app/api/students/add/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { setFlash } from "@/lib/flash";
import { z } from "zod";

const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  class: z.string().min(1, "Class is required"),
  section: z.string().min(1, "Section is required"),
  roll_number: z.string().optional(),
  father_name: z.string().optional(),
  mother_name: z.string().optional(),
  guardian_name: z.string().optional(),
  phone: z.string().optional(),
  alt_phone: z.string().optional(),
  admission_no: z.string().optional(),
  admission_date: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
  address: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  aadhaar: z.string().optional(),
  pen: z.string().optional(),
  photo_url: z.string().optional(),
  academic_year: z.string().optional(),
});

export async function POST(request) {
  // ─── Auth ──────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  }
  const session = await getSession(token);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  }

  const userResult = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, session.email));
  const user = userResult[0];
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  }

  // ─── Parse form ────────────────────────────────────────────────────────
  const formData = await request.formData();

  const raw = {
    name: formData.get("name"),
    class: formData.get("class"),
    section: formData.get("section"),
    roll_number: formData.get("roll_number") || undefined,
    father_name: formData.get("father_name") || undefined,
    mother_name: formData.get("mother_name") || undefined,
    guardian_name: formData.get("guardian_name") || undefined,
    phone: formData.get("phone") || undefined,
    alt_phone: formData.get("alt_phone") || undefined,
    admission_no: formData.get("admission_no") || undefined,
    admission_date: formData.get("admission_date") || undefined,
    gender: formData.get("gender") || undefined,
    dob: formData.get("dob") || undefined,
    address: formData.get("address") || undefined,
    religion: formData.get("religion") || undefined,
    caste: formData.get("caste") || undefined,
    aadhaar: formData.get("aadhaar") || undefined,
    pen: formData.get("pen") || undefined,
    photo_url: formData.get("photo_url") || undefined,
    academic_year: formData.get("academic_year") || undefined,
  };

  const parsed = studentSchema.safeParse(raw);
  if (!parsed.success) {
    await setFlash(
      "error",
      "Invalid data: " + JSON.stringify(parsed.error.flatten().fieldErrors),
    );
    return NextResponse.redirect(new URL("/students/add", request.url), {
      status: 303,
    });
  }

  const data = parsed.data;

  // ─── Duplicate check 1: same class + section + roll_number ─────────────
  if (data.roll_number) {
    const existingRoll = await db
      .select()
      .from(schema.students)
      .where(
        and(
          eq(schema.students.user_id, 2),
          eq(schema.students.class, data.class),
          eq(schema.students.section, data.section),
          eq(schema.students.roll_number, data.roll_number),
        ),
      );
    if (existingRoll.length > 0) {
      await setFlash(
        "error",
        `Roll No. ${data.roll_number} already exists in Class ${data.class}-${data.section} (${existingRoll[0].name})`,
      );
      return NextResponse.redirect(new URL("/students/add", request.url), {
        status: 303,
      });
    }
  }

  // ─── Duplicate check 2: same admission_no ──────────────────────────────
  if (data.admission_no) {
    const existingAdm = await db
      .select()
      .from(schema.students)
      .where(
        and(
          eq(schema.students.user_id, 2),
          eq(schema.students.admission_no, data.admission_no),
        ),
      );
    if (existingAdm.length > 0) {
      await setFlash(
        "error",
        `Admission No. ${data.admission_no} already exists (${existingAdm[0].name} — Class ${existingAdm[0].class}-${existingAdm[0].section})`,
      );
      return NextResponse.redirect(new URL("/students/add", request.url), {
        status: 303,
      });
    }
  }

  // ─── Insert ────────────────────────────────────────────────────────────
  await db.insert(schema.students).values({
    ...data,
    admission_date: data.admission_date
      ? new Date(data.admission_date)
      : new Date(),
    fee_status: "pending",
    user_id: 2,
  });

  await setFlash("success", "Student added successfully!");
  return NextResponse.redirect(new URL("/students", request.url), {
    status: 303,
  });
}
