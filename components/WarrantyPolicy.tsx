
import React from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

const WarrantyPolicy: React.FC = () => {
  return (
    <div className="animate-fade-in bg-white min-h-screen">
      {/* Header */}
      <div className="bg-masuma-dark text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold font-display uppercase tracking-wider mb-4">Warranty & Returns</h1>
          <div className="h-1 w-24 bg-masuma-orange mx-auto"></div>
          <p className="mt-6 text-gray-300 text-lg">
            We stand behind the quality of Masuma parts. Here is our promise to you.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-16 text-gray-700 leading-relaxed">
        
        {/* Warranty Section */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-masuma-orange/10 p-3 rounded-full text-masuma-orange">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-masuma-dark uppercase font-display">12-Month Masuma Warranty</h2>
          </div>
          <div className="bg-gray-50 p-8 border-l-4 border-masuma-orange rounded-r-lg shadow-sm">
            <p className="mb-4">
              Masuma Autoparts East Africa Limited warrants all products to be free from defects in material and workmanship for a period of <strong>12 months</strong> from the date of purchase, regardless of mileage.
            </p>
            <p>
              If a part fails due to a manufacturing defect during normal use, we will replace it free of charge or issue a full refund.
            </p>
          </div>
        </section>

        {/* Returns Section */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-blue-50 p-3 rounded-full text-blue-600">
              <RefreshCw size={32} />
            </div>
            <h2 className="text-2xl font-bold text-masuma-dark uppercase font-display">Returns & Refunds</h2>
          </div>
          <div className="space-y-4">
            <p>
              We understand that sometimes parts may not fit or plans change. You may return items under the following conditions:
            </p>
            <ul className="grid gap-3 list-none mt-4">
              <li className="flex gap-3 items-start">
                <CheckCircle className="text-green-600 shrink-0 mt-1" size={18} />
                <span><strong>7-Day Window:</strong> Returns must be initiated within 7 days of delivery or pickup.</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle className="text-green-600 shrink-0 mt-1" size={18} />
                <span><strong>Condition:</strong> The item must be unused, uninstalled, and in its original, undamaged Masuma packaging.</span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle className="text-green-600 shrink-0 mt-1" size={18} />
                <span><strong>Proof of Purchase:</strong> A valid receipt or order number is required.</span>
              </li>
            </ul>
            <p className="text-sm bg-blue-50 p-4 rounded mt-4 border border-blue-100 text-blue-800">
              <strong>Refund Processing:</strong> Refunds are processed within 3-5 business days via the original payment method (M-Pesa reversal or Bank Transfer) after inspection at our warehouse.
            </p>
          </div>
        </section>

        {/* Exclusions Section */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-red-50 p-3 rounded-full text-red-600">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-masuma-dark uppercase font-display">Warranty Exclusions</h2>
          </div>
          <p className="mb-4">This warranty does not cover damage caused by:</p>
          <ul className="list-disc pl-6 space-y-2 marker:text-masuma-orange">
            <li>Improper installation or use of special tools not recommended by the manufacturer.</li>
            <li>Use in competitive racing, off-road rallying, or commercial heavy-duty applications beyond OEM specs.</li>
            <li>Normal wear and tear (e.g., brake pads wearing down over time is normal; debonding is a defect).</li>
            <li>Accidents, road hazards, or modification of the vehicle.</li>
          </ul>
        </section>

        {/* Claim Process */}
        <section className="bg-masuma-dark text-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <FileText size={32} className="text-masuma-orange" />
            <h2 className="text-2xl font-bold uppercase font-display">How to File a Claim</h2>
          </div>
          <ol className="space-y-4 list-decimal pl-6 text-gray-300">
            <li>Take clear photos of the defective part and the original packaging.</li>
            <li>Contact our support team at <strong className="text-white">sales@masuma.africa</strong> or call <strong className="text-white">+254 792 506 590</strong>.</li>
            <li>Bring the part to our Industrial Area warehouse for technical inspection.</li>
            <li>Upon verification of the defect, an immediate replacement will be issued.</li>
          </ol>
        </section>

      </div>
    </div>
  );
};

export default WarrantyPolicy;
