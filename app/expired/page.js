export const dynamic = "force-dynamic";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

export default async function ExpiredPage() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);

  const email = session?.email || "";
  const paymentUrl = `https://nishantsoftwares.in/payment?software=school&email=${encodeURIComponent(email)}`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">⏰</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Subscription Expired</h1>
        <p className="text-sm text-gray-500 mb-6">
        Your Nishant School Software subscription has expired.
          Please renew to keep your service active.
        </p>
        <a
          href={paymentUrl}
          className="block w-full bg-indigo-600 text-white text-sm font-semibold py-3 rounded-xl hover:bg-indigo-700 transition mb-3"
        >
          🔄 now Renewal 
        </a>
        <a
          href="https://wa.me/919996865069"
          className="block w-full bg-green-50 text-green-700 text-sm font-semibold py-3 rounded-xl hover:bg-green-100 transition"
        >
          📞 WhatsApp  
        </a>
        <p className="text-xs text-gray-400 mt-4">9996865069</p>
      </div>
    </div>
  );
}