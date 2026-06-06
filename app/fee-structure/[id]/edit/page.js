export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { fee_structures } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import EditFeeStructureForm from "./EditFeeStructureForm";

export default async function EditFeeStructurePage({ params }) {
  const { id } = await params;
  const structureId = parseInt(id, 10);
  if (!structureId) redirect("/fee-structure");

  const rows = await db
    .select()
    .from(fee_structures)
    .where(
      and(
        eq(fee_structures.id, structureId),
        eq(fee_structures.user_id, MASTER_USER_ID),
      ),
    );
  const structure = rows[0];
  if (!structure) redirect("/fee-structure");

  const classes = [
    "Nursery",
    "LKG",
    "UKG",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Edit Fee Structure</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Update class-wise fee
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 max-w-md">
        <EditFeeStructureForm structure={structure} classes={classes} />
      </div>
    </div>
  );
}