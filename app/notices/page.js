export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { notices } from "@/lib/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function NoticesPage() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  const allNotices = await db
    .select()
    .from(notices)
    .where(eq(notices.user_id, 2))
    .orderBy(desc(notices.created_at));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notice Board</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Announcements and circulars
          </p>
        </div>
        <Link
          href="/notices/add"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Post
        </Link>
      </div>

      {allNotices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          No notices yet. Post your first notice.
        </div>
      ) : (
        <div className="space-y-3">
          {allNotices.map((notice) => (
            <div
              key={notice.id}
              className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="font-semibold text-gray-900 text-sm">
                      {notice.title}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        notice.priority === "urgent"
                          ? "bg-red-100 text-red-700"
                          : notice.priority === "important"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {notice.priority === "urgent"
                        ? "🔴 Urgent"
                        : notice.priority === "important"
                          ? "🟡 Important"
                          : "🟢 Normal"}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                      {notice.category}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {notice.content}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    {new Date(notice.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Link
                  href={`/notices/${notice.id}/delete`}
                  className="ml-3 shrink-0 text-red-400 text-lg"
                >
                  🗑️
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
