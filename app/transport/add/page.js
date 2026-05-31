// app/transport/add/page.js

export const dynamic = "force-dynamic";

import AddRouteForm from "./AddRouteForm";

export default async function AddRoutePage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Add Route / Stop</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Transport route and stop details
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <AddRouteForm />{" "}
      </div>
    </div>
  );
}
