const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'components', 'client', 'ClientPortalPwa.tsx');
let content = fs.readFileSync(file, 'utf8');

// Normalize to LF for matching
const isCrlf = content.includes('\r\n');
if (isCrlf) {
  content = content.replace(/\r\n/g, '\n');
}

const target = `  const handleOpenFirmWhatsApp = () => {
    openWhatsAppPreset(
      DEFAULT_FIRM_BRANDING.whatsappNumber,
      "DOC_CHASE",
      {
        clientName: currentClient.name,
        serviceName: "Compliance Desk",
        period: "Current Statutory Period",
      }
    );
  };

  return (`;

const replacement = `  const handleOpenFirmWhatsApp = () => {
    if (!currentClient) return;
    openWhatsAppPreset(
      DEFAULT_FIRM_BRANDING.whatsappNumber,
      "DOC_CHASE",
      {
        clientName: currentClient?.name || "Client",
        serviceName: "Compliance Desk",
        period: "Current Statutory Period",
      }
    );
  };

  if (!currentClient) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-28 sm:pb-20">
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-3xl mx-auto flex items-center justify-center text-slate-400">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Client Profiles Enrolled</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Your practice database has been initialized clean with 0 dummy clients. Switch to the <strong>CA Partner Cockpit</strong> to onboard your real clients or bulk import your client master.
          </p>
        </div>
      </div>
    );
  }

  return (`;

if (!content.includes(target)) {
  console.error('Target block not found in ClientPortalPwa.tsx');
  process.exit(1);
}

content = content.replace(target, replacement);

if (isCrlf) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated ClientPortalPwa.tsx with empty state guard!');
