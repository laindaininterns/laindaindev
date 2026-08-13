import React from "react";

export default function KycTab({ kycStatus, setKycStatus, uploadedDocs, handleFileUpload, isUploading }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-black tracking-tight">KYC Status & Verification</h1>
        <p className="text-[13px] text-[#5B5B58] mt-0.5">
          Verify your manufacturing business to access wholesale buying circles and product listings.
        </p>
      </div>

      {/* Verification Status Card */}
      <div className={`p-6 rounded-[20px] border transition-all ${
        kycStatus === "Approved"
          ? "bg-[#EEF3F2] border-[#A3C1BF]"
          : "bg-amber-50/50 border-amber-200"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="text-[32px]">
              {kycStatus === "Approved" ? "✅" : "⏳"}
            </div>
            <div>
              <h3 className="font-semibold text-[17px]">
                {kycStatus === "Approved" ? "Business Verified & Approved" : "Verification Pending"}
              </h3>
              <p className="text-[13px] text-[#5B5B58] mt-1">
                {kycStatus === "Approved"
                  ? "Your store is currently live. Buyers can find your products in the wholesale marketplace catalog."
                  : "Our administration team is reviewing your documents. We will notify you via email once approved."}
              </p>
            </div>
          </div>
          {kycStatus !== "Approved" && (
            <button
              onClick={() => setKycStatus("Approved")}
              className="h-[38px] px-4 rounded-[12px] bg-black text-white text-[13px] font-medium hover:bg-neutral-800 transition-all active:scale-[0.97]"
            >
              Simulate Approval
            </button>
          )}
        </div>
      </div>

      {/* Document Upload Zone */}
      <div className="bg-white p-6 rounded-[24px] border border-[#E9E8E2] shadow-sm">
        <h3 className="font-semibold text-[17px] mb-4">Upload Verification Documents</h3>
        
        <div
          onClick={handleFileUpload}
          className="cursor-pointer border-2 border-dashed border-[#A3C1BF] hover:border-[#85A6A3] bg-[#EEF3F2]/30 rounded-[16px] p-8 text-center transition-all hover:scale-[0.99] active:scale-[0.98]"
        >
          <div className="text-[36px] mb-2">📄</div>
          <p className="font-medium text-[15px] text-black">
            {isUploading ? "Uploading file..." : "Click to select or drag and drop files"}
          </p>
          <p className="text-[12px] text-[#5B5B58] mt-1">
            PDF, JPEG, or PNG up to 10MB. Please upload NTN certificate, CNIC copy, or business registration papers.
          </p>
        </div>

        {/* Uploaded Documents List */}
        <div className="mt-6">
          <h4 className="font-medium text-[13px] uppercase tracking-wider text-[#5B5B58] mb-3">Submitted Files</h4>
          <div className="space-y-2">
            {uploadedDocs.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 rounded-[12px] bg-[#F9F9F6] border border-[#E9E8E2]">
                <div className="flex items-center gap-3">
                  <span className="text-[18px]">📄</span>
                  <div>
                    <p className="font-medium text-[13px] text-black">{doc.name}</p>
                    <p className="text-[11px] text-[#5B5B58]">{doc.size} • Submitted on {doc.date}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  doc.status === "Approved"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
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
