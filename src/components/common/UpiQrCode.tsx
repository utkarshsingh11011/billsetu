import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export interface UpiQrCodeProps {
  upiId: string;
  payeeName: string;
  amountRupees: number;
  invoiceNumber: string;
  size?: number;
  className?: string;
}

export const UpiQrCode: React.FC<UpiQrCodeProps> = ({
  upiId,
  payeeName,
  amountRupees,
  invoiceNumber,
  size = 120,
  className = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Standard NPCI UPI URI Scheme
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amountRupees.toFixed(2)}&cu=INR&tn=${encodeURIComponent(invoiceNumber)}`;

  useEffect(() => {
    QRCode.toDataURL(upiUrl, {
      width: size,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate UPI QR code', err));
  }, [upiUrl, size]);

  if (!qrDataUrl) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`bg-slate-100 rounded border border-slate-200 animate-pulse flex items-center justify-center text-[10px] text-slate-400 ${className}`}
      >
        Generating QR...
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center text-center ${className}`}>
      <img
        src={qrDataUrl}
        alt={`Scan & Pay via UPI - ${invoiceNumber}`}
        style={{ width: size, height: size }}
        className="rounded border border-slate-300 p-1 bg-white shadow-xs"
      />
      <span className="text-[9px] font-bold text-slate-600 tracking-wider uppercase mt-1">
        Scan &amp; Pay via UPI
      </span>
      <span className="text-[8px] text-slate-400 font-mono">
        {upiId}
      </span>
    </div>
  );
};
