// components/PaymentQR.js
export default function PaymentQR() {
  const qrs = [
    {
      src: "/qr/1.jpeg",
      label: "Shashwat Public School",
      upi: "8840202071@okbizaxis",
    },
    {
      src: "/qr/2.jpeg",
      label: "Suman Tiwari",
      upi: "sumantiwari1108@okicici",
    },
    {
      src: "/qr/3.jpeg",
      label: "Shashwat Shikshan Prashikshan Sewa Trust",
      upi: "boism-8840202071@boi",
    },
  ];

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <h3 className="text-sm font-bold text-gray-800 text-center mb-3">
        Pay Online — Scan any QR
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {qrs.map((q) => (
          <div key={q.upi} className="text-center">
            <img
              src={q.src}
              alt={q.label}
              className="w-full aspect-square object-contain border border-gray-200 rounded"
            />
            <p className="text-[10px] font-semibold text-gray-700 mt-1 leading-tight">
              {q.label}
            </p>
            <p className="text-[9px] text-gray-500 break-all">{q.upi}</p>
          </div>
        ))}
      </div>
    </div>
  );
}