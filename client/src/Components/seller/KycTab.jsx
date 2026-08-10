import React, { useState, useEffect } from "react";
import { fetchSellerKyc, submitSellerKycDoc } from "../../services/api";

export default function KycTab({ kycStatus, setKycStatus, triggerToast }) {
  const [uploadedDocs, setUploadedDocs] = useState([
    { name: "NTN_Certificate_2026.pdf", size: "1.2 MB", date: "2026-08-01", status: "Approved" },
    { name: "CNIC_Copy_Front_Back.pdf", size: "850 KB", date: "2026-08-01", status: "Approved" },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKycData();
  }, []);

  async function loadKycData() {
    setLoading(true);
    try {
      const data = await fetchSellerKyc();
      if (data && data.status) {
        setKycStatus(data.status);
      }
      if (data && data.documents && data.documents.length > 0) {
        setUploadedDocs(data.documents);
      }
    } catch (err) {
      console.warn("Using local KYC initial state:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e) {
    e.preventDefault();
    setIsUploading(true);
    const fileName = "Business_Registration_License.pdf";
    try {
      const doc = await submitSellerKycDoc(fileName);
      setUploadedDocs((prev) => [...prev, doc]);
      if (triggerToast) triggerToast("KYC Document uploaded successfully!");
    } catch (err) {
      // Local fallback
      setUploadedDocs((prev) => [
        ...prev,
        {
          name: fileName,
          size: "2.4 MB",
          date: new Date().toISOString().split("T")[0],
          status: "Pending Verification",
        },
      ]);
      if (triggerToast) triggerToast("KYC Document uploaded (local state)!");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-[#E9E8E2] rounded-lg p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-black">Seller Onboarding & KYC Verification</h2>
          <p className="text-xs text-[#5B5B58] mt-1 max-w-xl">
            Complete your business profile and submit verification documents (NTN, CNIC, Chamber Certificate) to gain <strong>Verified Supplier</strong> status across LainDain.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#5B5B58]">Status:</span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              kycStatus === "Approved" || kycStatus === "APPROVED"
                ? "bg-[#EEF3F2] text-[#85A6A3] border-[#A3C1BF]/30"
                : "bg-red-50 text-[#C6564D] border-red-200"
            }`}
          >
            {kycStatus === "Approved" || kycStatus === "APPROVED" ? "✓ APPROVED" : "⏳ PENDING VERIFICATION"}
          </span>
        </div>
      </div>

      {/* Verification Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E9E8E2] rounded-lg p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-black flex items-center gap-2">
            <span>📄</span> Upload Business Documents
          </h3>
          <p className="text-xs text-[#5B5B58] leading-relaxed">
            Attach official scanned copies of your National Tax Number (NTN) registration and government-issued CNIC.
          </p>

          <form onSubmit={handleFileUpload} className="space-y-3">
            <div className="border-2 border-dashed border-[#E9E8E2] hover:border-[#85A6A3] rounded-lg p-4 text-center cursor-pointer bg-[#F9F9F6] transition-colors">
              <span className="text-2xl block mb-1">📁</span>
              <span className="text-xs font-medium text-black block">Click to select PDF files</span>
              <span className="text-[10px] text-[#5B5B58] block mt-0.5">PDF or PNG, max 10MB</span>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-2.5 bg-[#A3C1BF] hover:bg-[#85A6A3] text-black font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
            >
              {isUploading ? "Uploading to Supabase..." : "Submit New Document →"}
            </button>
          </form>
        </div>

        {/* Submitted Documents Record */}
        <div className="bg-white border border-[#E9E8E2] rounded-lg p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-black flex items-center gap-2">
            <span>📑</span> Submitted Verification File Records
          </h3>

          <div className="space-y-2">
            {uploadedDocs.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-[#E9E8E2] bg-[#F9F9F6]">
                <div>
                  <div className="text-xs font-medium text-black">{doc.name}</div>
                  <div className="text-[10px] text-[#5B5B58]">{doc.size} • Uploaded {doc.date}</div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EEF3F2] text-[#85A6A3]">
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
