import TeacherAddForm from "./TeacherAddForm";

export default function AddTeacherPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Teacher</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details below</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <TeacherAddForm />
      </div>
    </div>
  );
}
