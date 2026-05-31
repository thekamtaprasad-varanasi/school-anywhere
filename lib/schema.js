// lib/schema.js

import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const students = sqliteTable(
  "students",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: integer("user_id").references(() => users.id),
    name: text("name").notNull(),
    class: text("class").notNull(),
    section: text("section"),
    roll_number: text("roll_number"),
    admission_no: text("admission_no"),
    pen: text("pen"),
    photo_url: text("photo_url"),
    gender: text("gender"),
    dob: text("dob"),
    religion: text("religion"),
    caste: text("caste"),
    aadhaar: text("aadhaar"),
    address: text("address"),
    father_name: text("father_name"),
    mother_name: text("mother_name"),
    guardian_name: text("guardian_name"),
    phone: text("phone"),
    alt_phone: text("alt_phone"),
    fee_status: text("fee_status").default("pending"),
    academic_year: text("academic_year"),
    admission_date: integer("admission_date", {
      mode: "timestamp",
    }).defaultNow(),
    created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
  },
  (table) => ({
    uniq_roll: uniqueIndex("uniq_students_roll").on(
      table.user_id,
      table.class,
      table.section,
      table.roll_number,
    ),
    uniq_admission: uniqueIndex("uniq_students_admission").on(
      table.user_id,
      table.admission_no,
    ),
  }),
);

export const teachers = sqliteTable("teachers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  qualification: text("qualification"),
  phone: text("phone"),
  email: text("email"),
  joining_date: integer("joining_date", { mode: "timestamp" }).defaultNow(),
  pin: text("pin").unique(),
});

export const teacher_subjects = sqliteTable("teacher_subjects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teacher_id: integer("teacher_id").references(() => teachers.id),
  user_id: integer("user_id").references(() => users.id),
  subject: text("subject").notNull(),
  class: text("class").notNull(),
  section: text("section"),
});

export const fees = sqliteTable(
  "fees",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    student_id: integer("student_id").references(() => students.id),
    user_id: integer("user_id").references(() => users.id),
    amount: integer("amount").notNull(),
    fee_type: text("fee_type").default("monthly"),
    academic_year: text("academic_year"),
    month: text("month"),
    due_date: integer("due_date", { mode: "timestamp" }).notNull(),
    paid_date: integer("paid_date", { mode: "timestamp" }),
    status: text("status").default("pending"),
    receipt_no: text("receipt_no"),
    paid_amount: integer("paid_amount").default(0),
    last_reminder_at: integer("last_reminder_at", { mode: "timestamp" }),
    reminder_count: integer("reminder_count").default(0),
    auto_late: integer("auto_late").default(0),
    discount: integer("discount").default(0),
  },
  (table) => ({
    uniq_fee: uniqueIndex("uniq_fees_period").on(
      table.user_id,
      table.student_id,
      table.month,
      table.academic_year,
      table.fee_type,
    ),
  }),
);

export const fee_payments = sqliteTable("fee_payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fee_id: integer("fee_id")
    .references(() => fees.id)
    .notNull(),
  student_id: integer("student_id")
    .references(() => students.id)
    .notNull(),
  user_id: integer("user_id")
    .references(() => users.id)
    .notNull(),
  amount: integer("amount").notNull(),
  payment_mode: text("payment_mode").notNull().default("cash"),
  paid_date: integer("paid_date", { mode: "timestamp" }).notNull(),
  receipt_no: text("receipt_no"),
  note: text("note"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const attendance = sqliteTable(
  "attendance",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    student_id: integer("student_id").references(() => students.id),
    user_id: integer("user_id").references(() => users.id),
    date: text("date").notNull(),
    status: text("status").notNull().default("present"),
    created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
    alert_sent: integer("alert_sent").default(0),
  },
  (table) => ({
    uniq_attendance: uniqueIndex("uniq_attendance_day").on(
      table.user_id,
      table.student_id,
      table.date,
    ),
  }),
);

export const exams = sqliteTable("exams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  class: text("class").notNull(),
  subject: text("subject").notNull(),
  exam_date: text("exam_date").notNull(),
  exam_type: text("exam_type").default("unit"),
  academic_year: text("academic_year"),
  max_marks: integer("max_marks").notNull().default(100),
  passing_marks: integer("passing_marks").notNull().default(33),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const results = sqliteTable("results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  exam_id: integer("exam_id").references(() => exams.id),
  student_id: integer("student_id").references(() => students.id),
  user_id: integer("user_id").references(() => users.id),
  marks_obtained: integer("marks_obtained").notNull(),
  grade: text("grade"),
  remarks: text("remarks"),
  academic_year: text("academic_year"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const notices = sqliteTable("notices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("general"),
  priority: text("priority").default("normal"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const timetable = sqliteTable("timetable", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id),
  class: text("class").notNull(),
  day: text("day").notNull(),
  period: integer("period").notNull(),
  subject: text("subject").notNull(),
  teacher_name: text("teacher_name"),
  start_time: text("start_time").notNull(),
  end_time: text("end_time").notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const period_timings = sqliteTable("period_timings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id),
  period_no: integer("period_no").notNull(),
  start_time: text("start_time").notNull(),
  end_time: text("end_time").notNull(),
  label: text("label").default("teaching"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const parents = sqliteTable("parents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  student_id: integer("student_id").references(() => students.id),
  user_id: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  password: text("password").notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatar: text("avatar"),
  status: text("status").notNull().default("trial"),
  trial_start: integer("trial_start", { mode: "timestamp" }).defaultNow(),
  expiry_date: text("expiry_date"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
  reminder_sent: integer("reminder_sent").default(0),
});

export const school_settings = sqliteTable("school_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id),
  school_name: text("school_name").notNull().default("My School"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  principal_name: text("principal_name"),
  affiliation_no: text("affiliation_no"),
  school_code: text("school_code"),
  logo_url: text("logo_url"),
  upi_id: text("upi_id"),
  qr_code_url: text("qr_code_url"),
  principal_signature_url: text("principal_signature_url"),
  late_fee_amount: integer("late_fee_amount").default(100),
  late_fee_day: integer("late_fee_day").default(30),
  updated_at: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

export const certificates = sqliteTable("certificates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  student_id: integer("student_id").references(() => students.id),
  user_id: integer("user_id").references(() => users.id),
  cert_type: text("cert_type").notNull(),
  issue_date: text("issue_date").notNull(),
  serial_no: text("serial_no"),
  reason: text("reason"),
  last_class: text("last_class"),
  last_exam_passed: text("last_exam_passed"),
  conduct: text("conduct").default("Good"),
  custom_content: text("custom_content"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const transport = sqliteTable("transport", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id),
  route_name: text("route_name").notNull(),
  stop_name: text("stop_name").notNull(),
  monthly_fee: integer("monthly_fee").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  driver_name: text("driver_name"),
  vehicle_no: text("vehicle_no"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const student_transport = sqliteTable("student_transport", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  student_id: integer("student_id").references(() => students.id),
  user_id: integer("user_id").references(() => users.id),
  transport_id: integer("transport_id").references(() => transport.id),
  academic_year: text("academic_year"),
  joined_date: text("joined_date"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const pre_activations = sqliteTable("pre_activations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  created_at: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const homeworks = sqliteTable("homeworks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teacher_id: integer("teacher_id").references(() => teachers.id),
  user_id: integer("user_id").references(() => users.id),
  class: text("class").notNull(),
  section: text("section"),
  subject: text("subject").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  due_date: text("due_date").notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const teacher_attendance = sqliteTable("teacher_attendance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teacher_id: integer("teacher_id").references(() => teachers.id),
  user_id: integer("user_id").references(() => users.id),
  date: text("date").notNull(),
  status: text("status").notNull().default("present"),
  note: text("note"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const fee_structures = sqliteTable("fee_structures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id),
  class: text("class").notNull(),
  fee_type: text("fee_type").notNull().default("monthly"),
  amount: integer("amount").notNull(),
  academic_year: text("academic_year"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const fee_concessions = sqliteTable("fee_concessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  student_id: integer("student_id").references(() => students.id),
  user_id: integer("user_id").references(() => users.id),
  reason: text("reason"),
  discount_type: text("discount_type").notNull().default("amount"),
  discount_value: integer("discount_value").notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const fee_packages = sqliteTable(
  "fee_packages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: integer("user_id").references(() => users.id),
    class: text("class").notNull(),
    academic_year: text("academic_year").notNull(),
    total_amount: integer("total_amount").notNull().default(0),
    created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
  },
  (table) => ({
    uniq_package: uniqueIndex("uniq_fee_package").on(
      table.user_id,
      table.class,
      table.academic_year,
    ),
  }),
);

export const fee_package_items = sqliteTable("fee_package_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  package_id: integer("package_id")
    .references(() => fee_packages.id)
    .notNull(),
  fee_type: text("fee_type").notNull(),
  amount: integer("amount").notNull(),
});

export const admission_applications = sqliteTable("admission_applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  dob: text("dob"),
  applying_class: text("applying_class").notNull(),
  mother_name: text("mother_name"),
  father_name: text("father_name"),
  guardian_name: text("guardian_name"),
  occupation: text("occupation"),
  address: text("address"),
  phone: text("phone").notNull(),
  alt_phone: text("alt_phone"),
  religion: text("religion"),
  previous_school: text("previous_school"),
  transport_required: integer("transport_required").default(0),
  sibling_info: text("sibling_info"),
  status: text("status").default("pending"),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});
