import AddNoticeForm from "./AddNoticeForm";

export default function AddNoticePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Post New Notice</h1>
        <p className="text-gray-500 text-sm mt-1">
          This will be visible to all staff and parents
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <AddNoticeForm />
      </div>
    </div>
  );
}
