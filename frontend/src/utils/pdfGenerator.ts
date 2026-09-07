import { PredictionResponse, PredictionRequest } from '../services/api';

export const generateSecurityAuditPDF = (
  jobData: PredictionRequest,
  result: PredictionResponse
) => {
  const auditId = `SH-AUDIT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const timestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const isReal = result.prediction === 'REAL';
  const scorePercent = Math.round(result.probability * 100);
  const statusColor = isReal ? '#10b981' : '#ef4444';
  const statusBg = isReal ? '#064e3b' : '#7f1d1d';
  const riskColor =
    result.risk_level === 'Low'
      ? '#10b981'
      : result.risk_level === 'Medium'
      ? '#f59e0b'
      : '#ef4444';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SAFE HIRE Security Audit Certificate - ${jobData.company_name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap');
    
    @page {
      size: A4;
      margin: 15mm;
    }
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #ffffff;
      color: #0f172a;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }

    .certificate-container {
      border: 3px solid #0284c7;
      border-radius: 16px;
      padding: 32px;
      background: #ffffff;
      position: relative;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      max-width: 800px;
      margin: 0 auto;
    }

    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 72px;
      font-weight: 900;
      color: rgba(2, 132, 199, 0.04);
      letter-spacing: 12px;
      pointer-events: none;
      white-space: nowrap;
      text-transform: uppercase;
      z-index: 0;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .shield-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #0284c7, #06b6d4);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 900;
      font-size: 24px;
    }

    .title-group h1 {
      font-size: 24px;
      font-weight: 900;
      color: #0284c7;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .title-group p {
      font-size: 11px;
      color: #64748b;
      margin: 2px 0 0 0;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .cert-meta {
      text-align: right;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #475569;
    }

    .cert-id {
      font-weight: 700;
      color: #0f172a;
      font-size: 13px;
    }

    .banner {
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .verdict-badge {
      display: inline-block;
      padding: 8px 18px;
      border-radius: 9999px;
      background: ${statusBg};
      color: ${statusColor};
      border: 1px solid ${statusColor};
      font-weight: 800;
      font-size: 15px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .score-box {
      text-align: right;
    }

    .score-value {
      font-size: 32px;
      font-weight: 900;
      color: ${statusColor};
      line-height: 1;
    }

    .score-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .detail-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
    }

    .detail-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .detail-val {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      word-break: break-all;
    }

    .mca-verified-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      margin-top: 4px;
    }

    .reasons-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }

    .reasons-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .reasons-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .reasons-list li {
      padding: 6px 0;
      font-size: 12px;
      color: #334155;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      border-bottom: 1px dashed #e2e8f0;
    }

    .reasons-list li:last-child {
      border-bottom: none;
    }

    .stamp-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 2px solid #e2e8f0;
      padding-top: 20px;
      position: relative;
      z-index: 1;
    }

    .stamp-seal {
      width: 110px;
      height: 110px;
      border: 3px dashed #0284c7;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #0284c7;
      font-size: 9px;
      font-weight: 800;
      line-height: 1.2;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transform: rotate(-5deg);
    }

    .stamp-seal span {
      font-size: 14px;
      font-weight: 900;
      color: #0369a1;
    }

    .disclaimer {
      max-width: 480px;
      font-size: 10px;
      color: #64748b;
      line-height: 1.4;
    }

    @media print {
      body {
        padding: 0;
      }
      .certificate-container {
        border-width: 2px;
        box-shadow: none;
        padding: 24px;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="watermark">SAFE HIRE AUDIT</div>

    <div class="header">
      <div class="logo-section">
        <div class="shield-icon">🛡️</div>
        <div class="title-group">
          <h1>SAFE HIRE</h1>
          <p>AI Cyber Fraud Defense & Legitimacy Audit System</p>
        </div>
      </div>
      <div class="cert-meta">
        <div>CERTIFICATE ID:</div>
        <div class="cert-id">${auditId}</div>
        <div style="margin-top: 4px; font-size: 10px; color: #64748b;">${timestamp}</div>
      </div>
    </div>

    <div class="banner">
      <div>
        <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Official Audit Status</div>
        <div class="verdict-badge">${result.prediction === 'REAL' ? '✓ VERIFIED LEGITIMATE' : '⚠ FRAUDULENT / HIGH RISK'}</div>
        <div style="margin-top: 8px; font-size: 12px; color: #cbd5e1;">Risk Rating: <strong style="color: ${riskColor};">${result.risk_level} Risk</strong></div>
      </div>
      <div class="score-box">
        <div class="score-value">${scorePercent}%</div>
        <div class="score-label">Legitimacy Confidence</div>
      </div>
    </div>

    <div class="details-grid">
      <div class="detail-card">
        <div class="detail-label">Subject Company</div>
        <div class="detail-val">${jobData.company_name}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Evaluated Role</div>
        <div class="detail-val">${jobData.title}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Contact Email</div>
        <div class="detail-val">${jobData.email || 'Not Provided (Skipped)'}</div>
      </div>
      <div class="detail-card">
        <div class="detail-label">Official Website</div>
        <div class="detail-val">${jobData.website || 'Not Provided'}</div>
      </div>
      <div class="detail-card" style="grid-column: span 2;">
        <div class="detail-label">MCA Corporate Identification (CIN)</div>
        <div class="detail-val" style="display: flex; align-items: center; justify-content: space-between;">
          <span>${jobData.cin || 'Not Provided'}</span>
          ${
            result.cin_verified === true
              ? `<span class="mca-verified-badge">✓ MCA Government Registry Match: ${result.registered_company_name || 'Active'}</span>`
              : result.cin_verified
              ? `<span style="font-size: 11px; color: #f59e0b; font-weight: 600;">Status: ${result.cin_verified}</span>`
              : ''
          }
        </div>
      </div>
    </div>

    <div class="reasons-box">
      <div class="reasons-title">
        <span>🔍</span> Diagnostic Findings & Verification Signals
      </div>
      <ul class="reasons-list">
        ${(result.reasons || ['All standard heuristic checks evaluated.'])
          .map((r) => `<li><span>•</span><span>${r}</span></li>`)
          .join('')}
      </ul>
    </div>

    <div class="stamp-footer">
      <div class="disclaimer">
        <strong>SECURITY AUDIT DISCLAIMER:</strong> This report is generated by Safe Hire AI Ensemble Machine Learning models combined with Ministry of Corporate Affairs (MCA) registries. This certificate serves as an empirical risk assessment benchmark.
        <br/><br/>
        Report Authenticity Key: <code>${auditId.replace('SH-AUDIT-', '')}</code>
      </div>
      <div class="stamp-seal">
        <div>OFFICIAL</div>
        <span>SAFE HIRE</span>
        <div>AI VERIFIED</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    alert('Please allow popups for this site to download your PDF Security Audit Certificate.');
  }
};
