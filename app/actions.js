// app/actions.js
"use server";

import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { setFlash } from "@/lib/flash";
import { z } from "zod";

// ─── Auth Helper ────────────────────────────────────────────────────────────

async function getAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) redirect("/login");
  const session = await getSession(token);
  if (!session) redirect("/login");
  return session;
}

async function getAuthUser() {
  const session = await getAuth();
  const userResult = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, session.email));
  const user = userResult[0];
  if (!user) redirect("/login");
  return user;
}

// ─── Students ────────────────────────────────────────────────────────────────

const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  class: z.string().min(1, "Class is required"),
  section: z.string().min(1, "Section is required"),
  roll_number: z.string().optional(),
  father_name: z.string().optional(),
  phone: z.string().optional(),
  admission_no: z.string().optional(),
  admission_date: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
  mother_name: z.string().optional(),
  address: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  aadhaar: z.string().optional(),
  pen: z.string().optional(),
  photo_url: z.string().optional(),
  academic_year: z.string().optional(),
});

export async function addStudent(formData) {
  const user = await getAuthUser();

  const raw = {
    name: formData.get("name"),
    class: formData.get("class"),
    section: formData.get("section"),
    roll_number: formData.get("roll_number") || undefined,
    father_name: formData.get("father_name") || undefined,
    phone: formData.get("phone") || undefined,
    admission_no: formData.get("admission_no") || undefined,
    admission_date: formData.get("admission_date") || undefined,
    gender: formData.get("gender") || undefined,
    dob: formData.get("dob") || undefined,
    mother_name: formData.get("mother_name") || undefined,
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
    redirect("/students/add");
  }

  await db.insert(schema.students).values({
    ...parsed.data,
    admission_date: parsed.data.admission_date
      ? new Date(parsed.data.admission_date)
      : new Date(),
    fee_status: parsed.data.fee_status || "pending",
    user_id: 2,
  });

  await setFlash("success", "Student added successfully!");
  redirect("/students");
}

export async function updateStudent(formData) {
  const user = await getAuthUser();

  const id = formData.get("id");
  const password = formData.get("password");

  const studentCheck = await db
    .select()
    .from(schema.students)
    .where(
      and(
        eq(schema.students.id, Number(id)),
        eq(schema.students.user_id, 2),
      ),
    );
  if (!studentCheck.length) redirect("/students");

  const updateData = {
    name: formData.get("name"),
    class: formData.get("class"),
    section: formData.get("section"),
    roll_number: formData.get("roll_number"),
    father_name: formData.get("father_name") || undefined,
    phone: formData.get("phone") || undefined,
    fee_status: formData.get("fee_status"),
    admission_no: formData.get("admission_no") || null,
    gender: formData.get("gender") || null,
    dob: formData.get("dob") || null,
    mother_name: formData.get("mother_name") || null,
    address: formData.get("address") || null,
    religion: formData.get("religion") || null,
    caste: formData.get("caste") || null,
    aadhaar: formData.get("aadhaar") || null,
    academic_year: formData.get("academic_year") || null,
    pen: formData.get("pen") || null,
    photo_url: formData.get("photo_url") || null,
    admission_date: formData.get("admission_date")
      ? new Date(formData.get("admission_date"))
      : undefined,
  };

  if (password && password.trim() !== "") {
    updateData.password = password.trim();
  }

  await db
    .update(schema.students)
    .set(updateData)
    .where(
      and(
        eq(schema.students.id, Number(id)),
        eq(schema.students.user_id, 2),
      ),
    );

  await setFlash("success", "Student updated successfully!");
  redirect(`/students/${id}`);
}

export async function importStudents(formData) {
  const user = await getAuthUser();

  const csvText = formData.get("csv_data");
  if (!csvText) {
    await setFlash("error", "No data found.");
    redirect("/students/import");
  }

  const className = formData.get("class");
  const section = formData.get("section");

  if (!className) {
    await setFlash("error", "Please select a class.");
    redirect("/students/import");
  }

  const lines = csvText.trim().split("\n").filter(Boolean);
  const dataLines = lines[0]?.toLowerCase().includes("name")
    ? lines.slice(1)
    : lines;

  let count = 0;
  for (const line of dataLines) {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [name, roll_number, phone] = cols;
    if (!name) continue;
    try {
      await db.insert(schema.students).values({
        name,
        class: className,
        section: section || "",
        roll_number: roll_number || null,
        phone: phone || null,
        fee_status: "pending",
        user_id: 2,
      });
      count++;
    } catch {
      // skip duplicate roll_number
    }
  }

  await setFlash("success", `${count} students imported!`);
  redirect("/students");
}

export async function promoteStudents(formData) {
  const user = await getAuthUser();

  const from_class = formData.get("from_class");
  const to_class = formData.get("to_class");
  const new_academic_year = formData.get("new_academic_year");

  if (!from_class || !to_class || !new_academic_year) redirect("/promote");

  await db
    .update(schema.students)
    .set({
      class: to_class,
      academic_year: new_academic_year,
      fee_status: "pending",
    })
    .where(
      and(
        eq(schema.students.class, from_class),
        eq(schema.students.user_id, 2),
      ),
    );

  await setFlash(
    "success",
    `Class ${from_class} → Class ${to_class} promoted!`,
  );
  redirect("/promote");
}

// ─── Parent ───────────────────────────────────────────────────────────────────

export async function saveParent(formData) {
  const user = await getAuthUser();

  const student_id = parseInt(formData.get("student_id"));

  const studentCheck = await db
    .select()
    .from(schema.students)
    .where(
      and(
        eq(schema.students.id, student_id),
        eq(schema.students.user_id, 2),
      ),
    );
  if (!studentCheck.length) redirect("/students");

  const data = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
    user_id: 2,
  };

  const existing = await db
    .select()
    .from(schema.parents)
    .where(
      and(
        eq(schema.parents.student_id, student_id),
        eq(schema.parents.user_id, 2),
      ),
    );

  if (existing.length > 0) {
    await db
      .update(schema.parents)
      .set(data)
      .where(eq(schema.parents.student_id, student_id));
    await setFlash("success", "Parent account updated successfully!");
  } else {
    await db.insert(schema.parents).values({ student_id, ...data });
    await setFlash("success", "Parent account created successfully!");
  }

  redirect("/students");
}

// ─── Teachers ─────────────────────────────────────────────────────────────────

export async function addTeacher(formData) {
  const user = await getAuthUser();

  await db.insert(schema.teachers).values({
    name: formData.get("name"),
    qualification: formData.get("qualification"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    pin: formData.get("pin"),
    user_id: 2,
  });

  await setFlash("success", "Teacher added successfully!");
  redirect("/teachers");
}

// ─── Fees ─────────────────────────────────────────────────────────────────────

const paymentSchema = z.object({
  student_id: z.string().min(1, "Student is required"),
  amount: z.string().min(1, "Amount is required"),
  due_date: z.string().min(1, "Due date is required"),
  fee_type: z.string().optional(),
  academic_year: z.string().optional(),
  fee_status: z.string().optional(),
  month: z.string().optional(),
  receipt_no: z.string().optional(),
  paid_date: z.string().optional(),
});

export async function addPayment(formData) {
  const user = await getAuthUser();

  const raw = {
    student_id: formData.get("student_id"),
    amount: formData.get("amount"),
    due_date: formData.get("due_date"),
    fee_type: formData.get("fee_type") || undefined,
    academic_year: formData.get("academic_year") || undefined,
    month: formData.get("month") || undefined,
    receipt_no: formData.get("receipt_no") || undefined,
    paid_date: formData.get("paid_date") || undefined,
  };

  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) {
    await setFlash(
      "error",
      "Invalid data: " + JSON.stringify(parsed.error.flatten().fieldErrors),
    );
    redirect("/fees/add");
  }

  const paidDate = parsed.data.paid_date || null;
  const net_amount =
    parseInt(formData.get("net_amount")) || parseFloat(parsed.data.amount);
  await db.insert(schema.fees).values({
    student_id: parseInt(parsed.data.student_id),
    amount: net_amount,
    due_date: new Date(parsed.data.due_date),
    paid_date: paidDate ? new Date(paidDate) : null,
    status: paidDate ? "paid" : "pending",
    paid_amount: paidDate ? net_amount : 0,
    fee_type: parsed.data.fee_type || "tuition",
    academic_year: parsed.data.academic_year || null,
    month: parsed.data.month || null,
    receipt_no: parsed.data.receipt_no || null,
    user_id: 2,
  });

  if (paidDate) {
    const insertedFee = await db
      .select()
      .from(schema.fees)
      .where(eq(schema.fees.user_id, 2))
      .orderBy(schema.fees.id);
    const lastFee = insertedFee[insertedFee.length - 1];
    if (lastFee) {
      await db.insert(schema.fee_payments).values({
        fee_id: lastFee.id,
        student_id: parseInt(parsed.data.student_id),
        user_id: 2,
        amount: net_amount,
        payment_mode: formData.get("payment_mode") || "cash",
        paid_date: new Date(paidDate),
        receipt_no: parsed.data.receipt_no || null,
      });
    }
  }

  await setFlash("success", "Fee record saved successfully!");
  redirect("/fees");
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export async function saveAttendance(formData) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("session")?.value;
  const teacherToken = cookieStore.get("teacher_session")?.value;
  if (!adminToken && !teacherToken) redirect("/login");

  let userId = null;
  if (adminToken) {
    const session = await getSession(adminToken);
    if (!session) redirect("/login");
    const userResult = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, session.email));
    userId = userResult[0]?.id;
  } else if (teacherToken) {
    const teacherSession = await getSession(teacherToken);
    if (!teacherSession) redirect("/teacher-login");
    const teacherResult = await db
      .select()
      .from(schema.teachers)
      .where(eq(schema.teachers.id, teacherSession.teacherId));
    userId = teacherResult[0]?.user_id;
  }

  const date = formData.get("date");
  const studentIds = formData.getAll("student_id");
  const presentIds = formData.getAll("present");

  for (const id of studentIds) {
    const status = presentIds.includes(id) ? "present" : "absent";
    const existing = await db
      .select()
      .from(schema.attendance)
      .where(
        and(
          eq(schema.attendance.student_id, parseInt(id)),
          eq(schema.attendance.date, date),
        ),
      );

    if (existing.length > 0) {
      await db
        .update(schema.attendance)
        .set({ status })
        .where(
          and(
            eq(schema.attendance.student_id, parseInt(id)),
            eq(schema.attendance.date, date),
            eq(schema.attendance.user_id, userId),
          ),
        );
    } else {
      await db.insert(schema.attendance).values({
        student_id: parseInt(id),
        date,
        status,
        user_id: userId,
      });
    }
  }

  await setFlash("success", "Attendance saved!");
  if (teacherToken) {
    redirect("/teacher/attendance");
  }
  redirect("/attendance");
}

export async function addPeriod(formData) {
  const user = await getAuthUser();

  const className = formData.get("class");

  await db.insert(schema.timetable).values({
    class: className,
    day: formData.get("day"),
    period: parseInt(formData.get("period")),
    subject: formData.get("subject"),
    teacher_name: formData.get("teacher_name"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    user_id: 2,
  });

  await setFlash("success", "Period added successfully!");
  redirect(`/timetable?class=${className}`);
}

export async function createExam(formData) {
  const user = await getAuthUser();

  await db.insert(schema.exams).values({
    name: formData.get("name"),
    class: formData.get("class"),
    subject: formData.get("subject"),
    exam_date: formData.get("exam_date"),
    exam_type: formData.get("exam_type") || "unit",
    academic_year: formData.get("academic_year") || null,
    max_marks: parseInt(formData.get("max_marks")),
    passing_marks: parseInt(formData.get("passing_marks")),
    user_id: 2,
  });

  await setFlash("success", "Exam scheduled successfully!");
  redirect("/exams");
}

// ─── Notices ──────────────────────────────────────────────────────────────────

export async function createNotice(formData) {
  const user = await getAuthUser();

  await db.insert(schema.notices).values({
    title: formData.get("title"),
    content: formData.get("content"),
    category: formData.get("category"),
    priority: formData.get("priority"),
    user_id: 2,
  });

  await setFlash("success", "Notice posted successfully!");
  redirect("/notices");
}

// ─── Timetable ────────────────────────────────────────────────────────────────

export async function savePeriodTimings(formData) {
  const user = await getAuthUser();

  const totalPeriods = parseInt(formData.get("total_periods"));
  if (!totalPeriods || totalPeriods < 1) {
    await setFlash("error", "Invalid number of periods");
    redirect("/settings/periods");
  }

  // Delete all existing timings first (re-save support)
  await db
    .delete(schema.period_timings)
    .where(eq(schema.period_timings.user_id, 2));

  // Insert new timings
  const rows = [];
  for (let i = 1; i <= totalPeriods; i++) {
    const start = formData.get(`start_${i}`);
    const end = formData.get(`end_${i}`);
    const label = formData.get(`label_${i}`) || "teaching";
    if (!start || !end) continue;
    rows.push({
      user_id: 2,
      period_no: i,
      start_time: start,
      end_time: end,
      label,
    });
  }

  if (rows.length > 0) {
    await db.insert(schema.period_timings).values(rows);
  }

  await setFlash("success", "Period timings saved!");
  redirect("/settings/periods");
}

export async function saveTeacherWeekSchedule(formData) {
  const user = await getAuthUser();

  const teacherId = parseInt(formData.get("teacher_id"));
  if (!teacherId) {
    await setFlash("error", "Invalid teacher");
    redirect("/teachers");
  }

  const teacherResult = await db
    .select()
    .from(schema.teachers)
    .where(
      and(
        eq(schema.teachers.id, teacherId),
        eq(schema.teachers.user_id, 2),
      ),
    );
  const teacher = teacherResult[0];
  if (!teacher) {
    await setFlash("error", "Teacher not found");
    redirect("/teachers");
  }

  const totalPeriods = parseInt(formData.get("total_periods"));
  if (!totalPeriods || totalPeriods < 1) {
    await setFlash("error", "Invalid periods count");
    redirect(`/teachers/${teacherId}/timetable`);
  }

  // Fetch period_timings for start/end time
  const timings = await db
    .select()
    .from(schema.period_timings)
    .where(eq(schema.period_timings.user_id, 2));

  const timingMap = {};
  timings.forEach((t) => {
    timingMap[t.period_no] = { start: t.start_time, end: t.end_time };
  });

  // Delete all existing periods for this teacher (re-save support)
  await db
    .delete(schema.timetable)
    .where(
      and(
        eq(schema.timetable.user_id, 2),
        eq(schema.timetable.teacher_name, teacher.name),
      ),
    );

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Helper: extract one period for one day from form data
  const getPeriodData = (day, p) => {
    return {
      subject: formData.get(`subject_${day}_${p}`),
      className: formData.get(`class_${day}_${p}`),
      section: formData.get(`section_${day}_${p}`),
    };
  };

  // Helper: build period rows for a single day
  const buildDayRows = (sourceDay, targetDay) => {
    const rows = [];
    for (let p = 1; p <= totalPeriods; p++) {
      const { subject, className, section } = getPeriodData(sourceDay, p);
      if (!subject || !className) continue;
      const timing = timingMap[p];
      const startTime = timing?.start || "00:00";
      const endTime = timing?.end || "00:00";
      const fullClass = section ? `${className}-${section}` : className;
      rows.push({
        user_id: 2,
        class: fullClass,
        day: targetDay,
        period: p,
        subject,
        teacher_name: teacher.name,
        start_time: startTime,
        end_time: endTime,
      });
    }
    return rows;
  };

  const allRows = [];
  for (const day of days) {
    // Check if this day is marked "same as Monday"
    const sameAsMonday = formData.get(`same_${day}`) === "1";
    const sourceDay =
      day === "Monday" ? "Monday" : sameAsMonday ? "Monday" : day;
    const dayRows = buildDayRows(sourceDay, day);
    allRows.push(...dayRows);
  }

  if (allRows.length > 0) {
    await db.insert(schema.timetable).values(allRows);
  }

  await setFlash(
    "success",
    `Weekly timetable saved for ${teacher.name} (${allRows.length} entries)`,
  );
  redirect(`/teachers/${teacherId}`);
}

// ─── Transport ────────────────────────────────────────────────────────────────

export async function addRoute(formData) {
  const user = await getAuthUser();

  await db.insert(schema.transport).values({
    route_name: formData.get("route_name"),
    stop_name: formData.get("stop_name"),
    monthly_fee: parseFloat(formData.get("monthly_fee")) || 0,
    driver_name: formData.get("driver_name") || null,
    vehicle_no: formData.get("vehicle_no") || null,
    user_id: 2,
  });

  await setFlash("success", "Route added successfully!");
  redirect("/transport");
}

export async function assignStudent(formData) {
  const user = await getAuthUser();

  const student_id = parseInt(formData.get("student_id"));
  const transport_id = parseInt(formData.get("transport_id"));

  if (!student_id || !transport_id) redirect("/transport");

  await db.insert(schema.student_transport).values({
    student_id,
    transport_id,
    academic_year: formData.get("academic_year") || null,
    joined_date: formData.get("joined_date") || null,
    user_id: 2,
  });

  await setFlash("success", "Student assigned to transport successfully!");
  redirect("/transport");
}

// ─── Certificates ─────────────────────────────────────────────────────────────

export async function issueCertificate(formData) {
  const user = await getAuthUser();

  await db.insert(schema.certificates).values({
    student_id: parseInt(formData.get("student_id")),
    cert_type: formData.get("cert_type"),
    issue_date: formData.get("issue_date"),
    serial_no: formData.get("serial_no") || null,
    reason: formData.get("reason") || null,
    last_class: formData.get("last_class") || null,
    last_exam_passed: formData.get("last_exam_passed") || null,
    conduct: formData.get("conduct") || "Good",
    custom_content: formData.get("custom_content") || null,
    user_id: 2,
  });

  await setFlash("success", "Certificate issued successfully!");
  redirect("/certificates");
}

// ─── Settings ─────────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  school_name: z.string().min(1, "School name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  principal_name: z.string().optional(),
  affiliation_no: z.string().optional(),
  school_code: z.string().optional(),
  logo_url: z.string().optional(),
  upi_id: z.string().optional(),
  qr_code_url: z.string().optional(),
});

export async function saveSettings(formData) {
  const user = await getAuthUser();

  const existing = await db
    .select()
    .from(schema.school_settings)
    .where(eq(schema.school_settings.user_id, 2));
  const current = existing[0] || {};

  let logo_url = current.logo_url || null;
  const logoFile = formData.get("logo");
  if (logoFile && logoFile.size > 0) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const fd = new FormData();
    fd.append("file", logoFile);
    fd.append("upload_preset", uploadPreset);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: fd },
    );
    const data = await res.json();
    logo_url = data.secure_url;
  }
  let qr_code_url = current.qr_code_url || null;
  const qrFile = formData.get("qr_code");
  if (qrFile && qrFile.size > 0) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const fd = new FormData();
    fd.append("file", qrFile);

    fd.append("upload_preset", uploadPreset);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: fd },
    );
    const data = await res.json();
    qr_code_url = data.secure_url;
  }

  const raw = {
    school_name: formData.get("school_name"),
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    principal_name: formData.get("principal_name") || undefined,
    affiliation_no: formData.get("affiliation_no") || undefined,
    school_code: formData.get("school_code") || undefined,
    upi_id: formData.get("upi_id") || undefined,
  };

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    await setFlash(
      "error",
      "Invalid data: " + JSON.stringify(parsed.error.flatten().fieldErrors),
    );
    redirect("/settings");
  }

  const data = {
    user_id: 2,
    ...parsed.data,
    logo_url,
    qr_code_url,
    updated_at: new Date(),
  };

  if (existing.length > 0) {
    await db
      .update(schema.school_settings)
      .set(data)
      .where(eq(schema.school_settings.user_id, 2));
  } else {
    await db.insert(schema.school_settings).values(data);
  }

  await setFlash("success", "Settings saved successfully!");
  redirect("/settings");
}

// ─── Teacher Subjects ─────────────────────────────────────────────────────────

export async function addTeacherSubject(formData) {
  const user = await getAuthUser();

  const teacher_id = parseInt(formData.get("teacher_id"));
  const subject = formData.get("subject");
  const className = formData.get("class");
  const section = formData.get("section") || null;

  if (!teacher_id || !subject || !className)
    redirect(`/teachers/${teacher_id}`);

  await db.insert(schema.teacher_subjects).values({
    teacher_id,
    subject,
    class: className,
    section,
    user_id: 2,
  });

  await setFlash("success", "Subject assigned successfully!");
  redirect(`/teachers/${teacher_id}`);
}

export async function deleteStudent(formData) {
  const user = await getAuthUser();
  const id = parseInt(formData.get("id"));

  const studentCheck = await db
    .select()
    .from(schema.students)
    .where(
      and(eq(schema.students.id, id), eq(schema.students.user_id, 2)),
    );
  if (!studentCheck.length) redirect("/students");

  await db.delete(schema.fees).where(eq(schema.fees.student_id, id));
  await db
    .delete(schema.attendance)
    .where(eq(schema.attendance.student_id, id));
  await db.delete(schema.results).where(eq(schema.results.student_id, id));
  await db.delete(schema.parents).where(eq(schema.parents.student_id, id));
  await db
    .delete(schema.student_transport)
    .where(eq(schema.student_transport.student_id, id));
  await db
    .delete(schema.certificates)
    .where(eq(schema.certificates.student_id, id));
  await db.delete(schema.students).where(eq(schema.students.id, id));

  await setFlash("success", "Student deleted successfully!");
  redirect("/students");
}

// ─── Delete Teacher ───────────────────────────────────────────────────────────

export async function deleteTeacher(formData) {
  const user = await getAuthUser();
  const id = parseInt(formData.get("id"));

  const teacherCheck = await db
    .select()
    .from(schema.teachers)
    .where(
      and(eq(schema.teachers.id, id), eq(schema.teachers.user_id, 2)),
    );
  if (!teacherCheck.length) redirect("/teachers");

  await db
    .delete(schema.teacher_subjects)
    .where(eq(schema.teacher_subjects.teacher_id, id));
  await db.delete(schema.teachers).where(eq(schema.teachers.id, id));

  await setFlash("success", "Teacher deleted successfully!");
  redirect("/teachers");
}

export async function updateTeacher(formData) {
  const user = await getAuthUser();
  const id = parseInt(formData.get("id"));

  const teacherCheck = await db
    .select()
    .from(schema.teachers)
    .where(
      and(eq(schema.teachers.id, id), eq(schema.teachers.user_id, 2)),
    );
  if (!teacherCheck.length) redirect("/teachers");

  await db
    .update(schema.teachers)
    .set({
      name: formData.get("name"),
      qualification: formData.get("qualification") || null,
      phone: formData.get("phone") || null,
      email: formData.get("email") || null,
    })
    .where(
      and(eq(schema.teachers.id, id), eq(schema.teachers.user_id, 2)),
    );

  await setFlash("success", "Teacher updated successfully!");
  redirect(`/teachers/${id}`);
}

export async function deleteTeacherSubject(formData) {
  const user = await getAuthUser();
  const id = parseInt(formData.get("id"));
  const result = await db
    .select()
    .from(schema.teacher_subjects)
    .where(eq(schema.teacher_subjects.id, id));
  const teacher_id = result[0]?.teacher_id;
  const teacherOwner = await db
    .select()
    .from(schema.teachers)
    .where(
      and(
        eq(schema.teachers.id, teacher_id),
        eq(schema.teachers.user_id, 2),
      ),
    );
  if (!teacherOwner.length) redirect(`/teachers/${teacher_id}`);
  await db
    .delete(schema.teacher_subjects)
    .where(eq(schema.teacher_subjects.id, id));
  await setFlash("success", "Subject removed!");
  redirect(`/teachers/${teacher_id}`);
}

export async function markFeePaid(formData) {
  const user = await getAuthUser();
  const fee_id = parseInt(formData.get("fee_id"));
  const paid_date = formData.get("paid_date");
  const receipt_no = formData.get("receipt_no") || null;
  const payment_mode = formData.get("payment_mode") || "cash";
  const paid_amount = parseInt(formData.get("paid_amount"));

  const feeResult = await db
    .select()
    .from(schema.fees)
    .where(eq(schema.fees.id, fee_id));
  const fee = feeResult[0];
  if (!fee) redirect("/fees");

  await db.insert(schema.fee_payments).values({
    fee_id,
    student_id: fee.student_id,
    user_id: 2,
    amount: paid_amount,
    payment_mode,
    paid_date: new Date(paid_date),
    receipt_no,
  });

  const newPaidAmount = (fee.paid_amount || 0) + paid_amount;
  const newStatus = newPaidAmount >= fee.amount ? "paid" : "partial";

  await db
    .update(schema.fees)
    .set({
      status: newStatus,
      paid_date: newStatus === "paid" ? new Date(paid_date) : null,
      receipt_no: newStatus === "paid" ? receipt_no : null,
      paid_amount: newPaidAmount,
    })
    .where(eq(schema.fees.id, fee_id));

  await setFlash("success", "Payment recorded!");
  redirect(`/fees/${fee_id}/receipt`);
}

export async function addFeeStructure(formData) {
  const user = await getAuthUser();

  const cls = formData.get("class");
  const fee_type = formData.get("fee_type");
  const amount = parseInt(formData.get("amount"));
  const academic_year = formData.get("academic_year") || null;

  if (!cls || !fee_type || !amount) redirect("/fee-structure/add");

  await db.insert(schema.fee_structures).values({
    user_id: 2,
    class: cls,
    fee_type,
    amount,
    academic_year,
    created_at: new Date(),
  });

  await setFlash("success", "Fee structure saved!");
  redirect("/fee-structure");
}

export async function deleteFeeStructure(formData) {
  const user = await getAuthUser();
  const id = parseInt(formData.get("id"));

  await db
    .delete(schema.fee_structures)
    .where(
      and(
        eq(schema.fee_structures.id, id),
        eq(schema.fee_structures.user_id, 2),
      ),
    );

  await setFlash("success", "Fee structure deleted!");
  redirect("/fee-structure");
}

export async function addConcession(formData) {
  const user = await getAuthUser();
  const student_id = parseInt(formData.get("student_id"));
  const reason = formData.get("reason") || null;
  const discount_type = formData.get("discount_type");
  const discount_value = parseInt(formData.get("discount_value"));

  if (!student_id || !discount_value) redirect(`/students/${student_id}`);

  await db.insert(schema.fee_concessions).values({
    student_id,
    reason,
    discount_type,
    discount_value,
    user_id: 2,
    created_at: new Date(),
  });

  await setFlash("success", "Concession added!");
  redirect(`/students/${student_id}`);
}

export async function deleteConcession(formData) {
  const user = await getAuthUser();
  const id = parseInt(formData.get("id"));
  const student_id = parseInt(formData.get("student_id"));

  await db
    .delete(schema.fee_concessions)
    .where(
      and(
        eq(schema.fee_concessions.id, id),
        eq(schema.fee_concessions.student_id, student_id),
      ),
    );

  await setFlash("success", "Concession removed!");
  redirect(`/students/${student_id}`);
}
