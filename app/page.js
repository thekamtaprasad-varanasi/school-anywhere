// app/page.js
export const dynamic = "force-dynamic";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";

const features = [
  {
    icon: "💰",
    title: "फीस संग्रह — पूरी तरह स्वचालित",
    desc: "क्लास टेम्पलेट एक बार सेट करें। हर बार बच्चा चुनते ही फीस अपने आप भर जाती है। पिछला बकाया, लेट पेमेंट और टोटल — सब अपने आप जुड़ता है।",
  },
  {
    icon: "🎓",
    title: "विद्यार्थी प्रबंधन",
    desc: "हर विद्यार्थी का पूरा रिकॉर्ड — नाम, कक्षा, अनुभाग, रोल नंबर, पिता का नाम और फोन। एक-एक करके या एक साथ सैकड़ों जोड़ें।",
  },
  {
    icon: "✅",
    title: "दैनिक उपस्थिति",
    desc: "कक्षावार उपस्थिति दर्ज करें। उपस्थित-अनुपस्थित संख्या तुरंत दिखे। अनुपस्थित बच्चों के अभिभावकों को WhatsApp अलर्ट।",
  },
  {
    icon: "🔑",
    title: "शिक्षक उपस्थिति PIN से",
    desc: "प्रधानाचार्य हर शिक्षक को 6 अंकों का PIN देते हैं। शिक्षक अपने मोबाइल से लॉगिन करके केवल अपनी कक्षा की उपस्थिति दर्ज करते हैं।",
  },
  {
    icon: "📝",
    title: "परीक्षा और परिणाम",
    desc: "परीक्षा निर्धारित करें, अंक दर्ज करें — ग्रेड, पास/फेल और कक्षा औसत स्वचालित गणना। रिपोर्ट कार्ड प्रिंट।",
  },
  {
    icon: "📄",
    title: "मार्कशीट",
    desc: "त्रैमासिक, अर्धवार्षिक और वार्षिक मार्कशीट पूरी कक्षा के लिए एक साथ। प्रिंट या WhatsApp पर PDF शेयर।",
  },
  {
    icon: "🏅",
    title: "प्रमाण पत्र",
    desc: "स्थानांतरण, चरित्र, बोनाफाइड और जन्म प्रमाण पत्र — एक क्लिक में विद्यालय के नाम, लोगो और प्रधानाचार्य के नाम के साथ।",
  },
  {
    icon: "🚌",
    title: "परिवहन प्रबंधन",
    desc: "बस मार्ग, स्टॉप, मासिक शुल्क, चालक और वाहन विवरण। बच्चों को मार्ग पर असाइन करें।",
  },
  {
    icon: "📊",
    title: "रिपोर्ट",
    desc: "कक्षावार विद्यार्थी संख्या, फीस संग्रह, उपस्थिति प्रतिशत और परीक्षा परिणाम — सब एक पेज पर।",
  },
  {
    icon: "📣",
    title: "सूचना पट्ट",
    desc: "प्राथमिकता के साथ विद्यालय की सूचनाएं पोस्ट करें। अत्यावश्यक सूचनाएं लाल बैज के साथ।",
  },
  {
    icon: "🌐",
    title: "ऑनलाइन एडमिशन",
    desc: "स्कूल वेबसाइट से ही अभिभावक एडमिशन फॉर्म भरें। आपके पास सीधे ERP में आ जाएगा — Approve दबाकर बच्चे को students में जोड़ दें।",
  },
  {
    icon: "📱",
    title: "मोबाइल और डेस्कटॉप",
    desc: "मोबाइल पर Android ऐप की तरह और कंप्यूटर पर ब्राउजर से चलता है।",
  },
];

const feeFlow = [
  {
    step: "1",
    icon: "🏷️",
    title: "क्लास टेम्पलेट बनाएं (एक बार)",
    desc: "Fees पेज पर 🏷️ Templates खोलें। हर क्लास के लिए एक बार Monthly, Transport, Amenity, Exam, Admission, Late Payment की राशि भरें। अगर i-card, यूनिफॉर्म जैसी कोई अलग मद है तो + Add Item से जोड़ें।",
  },
  {
    step: "2",
    icon: "👶",
    title: "बच्चा चुनें",
    desc: "Fees → + Record → क्लास → सेक्शन → बच्चे का नाम। बस इतना करते ही उस क्लास का पूरा टेम्पलेट अपने आप खुल जाएगा — सब checkbox टिक, सब amount भरे हुए।",
  },
  {
    step: "3",
    icon: "📅",
    title: "महीना और मद चुनें",
    desc: "जिस-जिस महीने की फीस लेनी है, उन पर टिक करें। जो मद नहीं चाहिए (जैसे ट्रांसपोर्ट नहीं तो), उससे टिक हटा दें। Exam या Admission जैसी एक-बार वाली मद के लिए महीना चुनें।",
  },
  {
    step: "4",
    icon: "🧮",
    title: "टोटल खुद बने",
    desc: "Previous Dues (पिछला बकाया) अपने आप ऊपर दिखेगा। चुनी हुई सब मदों का जोड़ + पुराना बकाया = Total Payable नीचे साफ दिखेगा। कोई जोड़-घटाव हाथ से नहीं।",
  },
  {
    step: "5",
    icon: "🧾",
    title: "पेमेंट और रसीद",
    desc: "पूरा पैसा मिले या आधा — दोनों चलता है। Cash, UPI, Online, Cheque — कोई भी मोड। Save दबाते ही रसीद नंबर बनकर तैयार, प्रिंट करें या WhatsApp पर भेजें।",
  },
  {
    step: "6",
    icon: "⏰",
    title: "लेट पेमेंट खुद-ब-खुद",
    desc: "महीना बीतने तक अगर फीस नहीं आई, तो अगले महीने ₹100 लेट पेमेंट अपने आप उस बच्चे की फीस में जुड़ जाएगा। अभिभावक से कहने की जरूरत नहीं, सॉफ्टवेयर खुद याद रखता है।",
  },
];

const howTo = [
  {
    step: "1",
    icon: "🔐",
    title: "Google से लॉगिन करें",
    desc: "Admin Login पर क्लिक करें। विद्यालय के Gmail खाते से साइन इन — कोई पासवर्ड बनाने की जरूरत नहीं।",
  },
  {
    step: "2",
    icon: "⚙️",
    title: "विद्यालय की जानकारी",
    desc: "Settings में विद्यालय का नाम, पता, प्रधानाचार्य का नाम और लोगो डालें। हर रसीद और प्रमाण पत्र पर अपने आप आएगा।",
  },
  {
    step: "3",
    icon: "🎓",
    title: "विद्यार्थी और शिक्षक जोड़ें",
    desc: "विद्यार्थियों को एक-एक करके या फाइल से सैकड़ों एक साथ जोड़ें। शिक्षकों को 6 अंकों का PIN दें।",
  },
  {
    step: "4",
    icon: "🏷️",
    title: "फीस टेम्पलेट सेट करें",
    desc: "हर क्लास के लिए एक टेम्पलेट बनाएं। यही टेम्पलेट हर बच्चे की रसीद बनाते वक्त अपने आप खुलेगा।",
  },
  {
    step: "5",
    icon: "📱",
    title: "दैनिक कार्य शुरू",
    desc: "उपस्थिति लें, फीस लें, परीक्षा निर्धारित करें — मोबाइल पर, कहीं से भी।",
  },
];

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = token ? await getSession(token) : null;
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white" style={{ fontSize: "18px" }}>
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-14">
          <div
            className="inline-block px-4 py-1.5 bg-amber-100 text-amber-600 rounded-full font-medium mb-5"
            style={{ fontSize: "18px" }}
          >
            🏫 विद्यालय प्रबंधन सॉफ्टवेयर
          </div>
          <h1
            className="font-bold text-gray-900 mb-4 leading-tight"
            style={{ fontSize: "36px" }}
          >
            आपके विद्यालय की हर जरूरत
            <br />
            <span className="text-amber-600">एक जगह — मोबाइल पर</span>
          </h1>
          <p
            className="text-gray-500 max-w-2xl mx-auto mb-8"
            style={{ fontSize: "18px" }}
          >
            फीस · विद्यार्थी · उपस्थिति · परीक्षा · प्रमाण पत्र · रिपोर्ट — सब
            एक जगह, सब अपने आप।
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 flex-wrap">
            <Link
              href="/login"
              className="bg-amber-600 text-white px-8 py-3 rounded-lg hover:bg-amber-700 font-medium shadow-sm"
              style={{ fontSize: "18px" }}
            >
              प्रशासक लॉगिन →
            </Link>
            <Link
              href="/teacher-login"
              className="bg-gray-800 text-white px-8 py-3 rounded-lg hover:bg-gray-700 font-medium shadow-sm"
              style={{ fontSize: "18px" }}
            >
              🔑 शिक्षक लॉगिन
            </Link>
            <Link
              href="/student/login"
              className="bg-amber-100 text-amber-700 px-8 py-3 rounded-lg hover:bg-amber-200 font-medium shadow-sm"
              style={{ fontSize: "18px" }}
            >
              🎓 विद्यार्थी / अभिभावक लॉगिन
            </Link>
          </div>
          <p className="text-gray-400 mt-3" style={{ fontSize: "14px" }}>
            Android पर इंस्टॉल करने के लिए: Chrome → ⋮ → Add to Home Screen
          </p>
        </div>

        {/* Fees Module — Dedicated Section */}
        <div className="mb-14 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 md:p-8 border border-amber-200">
          <div className="text-center mb-8">
            <div
              className="inline-block px-3 py-1 bg-amber-600 text-white rounded-full font-medium mb-3"
              style={{ fontSize: "14px" }}
            >
              💰 सबसे ज़रूरी मॉड्यूल
            </div>
            <h2
              className="font-bold text-gray-900 mb-2"
              style={{ fontSize: "28px" }}
            >
              फीस लेना — अब बहुत आसान
            </h2>
            <p
              className="text-gray-600 max-w-2xl mx-auto"
              style={{ fontSize: "17px" }}
            >
              न कैलकुलेटर, न कागज़ पर हिसाब, न पुरानी फीस याद रखने की झंझट।
              बच्चा चुनो, बस।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeFlow.map((f) => (
              <div
                key={f.step}
                className="bg-white rounded-xl p-5 shadow-sm border border-amber-100"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 bg-amber-600 text-white font-black rounded-full flex items-center justify-center shrink-0"
                    style={{ fontSize: "16px" }}
                  >
                    {f.step}
                  </div>
                  <div style={{ fontSize: "28px" }}>{f.icon}</div>
                </div>
                <h3
                  className="font-bold text-gray-900 mb-2"
                  style={{ fontSize: "17px" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-gray-600 leading-relaxed"
                  style={{ fontSize: "14px" }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white rounded-xl p-5 border border-amber-200">
            <h3
              className="font-bold text-gray-900 mb-3"
              style={{ fontSize: "18px" }}
            >
              ✨ इसके अलावा क्या मिलेगा?
            </h3>
            <ul
              className="text-gray-700 space-y-2"
              style={{ fontSize: "15px" }}
            >
              <li>
                <strong>+ Add Item</strong> — रसीद बनाते समय कोई नई मद (i-card,
                यूनिफॉर्म, किताबें) टाइप करें और चाहें तो उसी समय टेम्पलेट में
                सेव कर दें। अगली बार अपने आप आएगी।
              </li>
              <li>
                <strong>आंशिक पेमेंट</strong> — पूरा पैसा न मिले तो आधा-अधूरा भी
                रिकॉर्ड हो। Balance अपने आप दिखेगा।
              </li>
              <li>
                <strong>WhatsApp रिमाइंडर</strong> — बकायेदारों के कार्ड में
                Remind बटन, एक क्लिक में अभिभावक को संदेश।
              </li>
              <li>
                <strong>एक नज़र में स्थिति</strong> — Collected, Pending,
                Overdue तीनों आँकड़े ऊपर, बच्चे-वार कार्ड में Total / Paid /
                Balance।
              </li>
              <li>
                <strong>Defaulters टैब</strong> — सिर्फ बकायेदार बच्चे एक क्लिक
                में।
              </li>
              <li>
                <strong>QR Code Payment</strong> — Bank, Trust और UPI तीनों QR
                रसीद पर और pay screen पर। अभिभावक स्कैन करके सीधा भुगतान करे।
              </li>
            </ul>
          </div>
        </div>

        {/* Features */}
        <div className="mb-14">
          <h2
            className="font-bold text-center text-gray-900 mb-2"
            style={{ fontSize: "24px" }}
          >
            और क्या-क्या शामिल है?
          </h2>
          <p
            className="text-center text-gray-400 mb-8"
            style={{ fontSize: "18px" }}
          >
            12 सुविधाएं — एक सॉफ्टवेयर, एक कीमत
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white p-5 rounded-xl shadow-sm border border-amber-100"
              >
                <div className="mb-2" style={{ fontSize: "30px" }}>
                  {f.icon}
                </div>
                <h3
                  className="font-bold text-gray-900 mb-1"
                  style={{ fontSize: "18px" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-gray-500 leading-relaxed"
                  style={{ fontSize: "14px" }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How To */}
        <div className="mb-14">
          <h2
            className="font-bold text-center text-gray-900 mb-2"
            style={{ fontSize: "24px" }}
          >
            शुरू कैसे करें?
          </h2>
          <p
            className="text-center text-gray-400 mb-8"
            style={{ fontSize: "18px" }}
          >
            5 कदम — 15 मिनट में तैयार
          </p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {howTo.map((h) => (
              <div
                key={h.step}
                className="bg-white rounded-xl border border-amber-100 p-4 text-center shadow-sm"
              >
                <div
                  className="w-8 h-8 bg-amber-600 text-white font-black rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{ fontSize: "16px" }}
                >
                  {h.step}
                </div>
                <div className="mb-2" style={{ fontSize: "24px" }}>
                  {h.icon}
                </div>
                <div
                  className="font-bold text-gray-800 mb-1"
                  style={{ fontSize: "16px" }}
                >
                  {h.title}
                </div>
                <div
                  className="text-gray-500 leading-relaxed"
                  style={{ fontSize: "13px" }}
                >
                  {h.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher Attendance */}
        <div className="mb-14 bg-amber-50 rounded-2xl p-6 border border-amber-100">
          <h2
            className="font-bold text-gray-900 mb-1"
            style={{ fontSize: "22px" }}
          >
            🔑 शिक्षक उपस्थिति कैसे दर्ज करते हैं?
          </h2>
          <p className="text-gray-500 mb-5" style={{ fontSize: "18px" }}>
            Email लॉगिन की जरूरत नहीं। बस PIN।
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                step: "1",
                text: "प्रधानाचार्य हर शिक्षक को जोड़ते समय 6 अंकों का PIN सेट करते हैं।",
              },
              {
                step: "2",
                text: "शिक्षक अपने मोबाइल पर वेबसाइट खोलते हैं और Teacher Login पर जाते हैं।",
              },
              {
                step: "3",
                text: "शिक्षक अपना PIN डालते हैं — केवल अपनी असाइन कक्षा दिखती है।",
              },
              {
                step: "4",
                text: "शिक्षक उपस्थिति दर्ज करके Save करते हैं — प्रधानाचार्य तुरंत देख सकते हैं।",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="bg-white rounded-xl p-4 shadow-sm flex gap-3 items-start"
              >
                <div
                  className="w-7 h-7 bg-amber-600 text-white font-black rounded-full flex items-center justify-center shrink-0"
                  style={{ fontSize: "14px" }}
                >
                  {s.step}
                </div>
                <p
                  className="text-gray-700 leading-relaxed"
                  style={{ fontSize: "16px" }}
                >
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-amber-600 rounded-2xl p-10 text-white">
          <h2 className="font-bold mb-2" style={{ fontSize: "24px" }}>
            संपर्क करें
          </h2>
          <p
            className="mb-6"
            style={{ fontSize: "18px", color: "rgba(255,255,255,0.85)" }}
          >
            किसी भी तरह की मदद के लिए सीधे संपर्क करें।
          </p>
          <div
            className="flex flex-col sm:flex-row justify-center gap-4"
            style={{ fontSize: "18px", color: "rgba(255,255,255,0.85)" }}
          >
            <a href="tel:+919996865069" className="hover:text-white">
              📞 9996865069
            </a>
            <span className="hidden sm:inline">|</span>
            <a
              href="https://wa.me/919996865069"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              💬 WhatsApp
            </a>
            <span className="hidden sm:inline">|</span>
            <a
              href="mailto:prasad.kamta@gmail.com"
              className="hover:text-white"
            >
              ✉️ prasad.kamta@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
