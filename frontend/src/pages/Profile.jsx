import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Download, Printer, User, MapPin, Phone, Mail, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';

export function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  // If profile not yet set up, show a banner directing user to setup
  if (!user?.isProfileSetup) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Citizen Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Complete your profile to access your Nagrik ID Card.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-amber-800">Profile Setup Incomplete</h3>
            <p className="text-sm text-amber-700 mt-0.5">
              You haven't completed your citizen profile setup yet. Please fill in your details to generate your official Delhi Nagrik ID Card.
            </p>
          </div>
          <button
            onClick={() => navigate('/setup-profile')}
            className="flex-shrink-0 px-5 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-all shadow-sm"
          >
            Setup Profile Now
          </button>
        </div>
      </div>
    );
  }


  // Generate dynamic QR data
  const qrData = `CivicFlow Citizen ID: ${user?.nagrikId || 'N/A'}\nName: ${user?.name || ''} ${user?.surname || ''}\nDOB: ${user?.dob || ''}\nStatus: Verified Delhi Citizen`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  const photoUrl = user?.photo 
    ? (user.photo.startsWith('http') ? user.photo : `http://localhost:5001${user.photo}`)
    : '';

  const generateCardCanvas = (format, callback) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 640, 400);
    grad.addColorStop(0, '#ffffff'); 
    grad.addColorStop(1, '#f0f9ff'); // Soft sky blue
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 400);

    // Tricolor Bands (Saffron at top, Green at bottom)
    ctx.fillStyle = '#ff9933'; // saffron
    ctx.fillRect(0, 0, 640, 12);
    ctx.fillStyle = '#138808'; // green
    ctx.fillRect(0, 388, 640, 12);

    // Card border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 636, 396);

    // Header Title
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('GOVERNMENT OF NCT OF DELHI', 180, 45);

    ctx.fillStyle = '#475569';
    ctx.font = 'semibold 13px system-ui, -apple-system, sans-serif';
    ctx.fillText('DELHI CITIZEN PORTAL (CIVICSENSE)', 180, 68);

    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('NAGRIK IDENTITY CARD', 180, 92);

    // Divider Line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(180, 105);
    ctx.lineTo(600, 105);
    ctx.stroke();

    // Async Image Loader
    const loadImage = (src, isAvatarFallback) => {
      return new Promise((resolve) => {
        if (!src) {
          resolve(null);
          return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.warn('Failed to load image:', src);
          resolve(null);
        };
        img.src = src;
      });
    };

    Promise.all([
      loadImage(photoUrl),
      loadImage(qrCodeUrl)
    ]).then(([photoImg, qrImg]) => {
      // 1. Draw Profile Photo
      if (photoImg) {
        ctx.drawImage(photoImg, 30, 130, 120, 150);
      } else {
        // Draw Placeholder Avatar
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(30, 130, 120, 150);
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 36px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(user?.name ? user.name.charAt(0).toUpperCase() : 'U', 90, 215);
        ctx.textAlign = 'left';
      }
      
      // Draw photo border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 130, 120, 150);

      // 2. Draw Text Labels
      ctx.fillStyle = '#475569'; // slate-600
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('CITIZEN NAME', 180, 140);
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText(`${user?.name || ''} ${user?.surname || ''}`.toUpperCase(), 180, 160);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('DATE OF BIRTH', 180, 200);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'semibold 14px system-ui, sans-serif';
      ctx.fillText(user?.dob || 'N/A', 180, 220);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('NAGRIK IDENTITY CODE', 180, 260);
      ctx.fillStyle = '#2563eb'; // blue-600
      ctx.font = 'black 17px system-ui, sans-serif';
      ctx.fillText(user?.nagrikId || 'PENDING', 180, 282);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('STATUS', 180, 320);
      ctx.fillStyle = '#16a34a'; // green-600
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText('VERIFIED DELHI CITIZEN', 180, 338);

      // 3. Draw QR Code
      if (qrImg) {
        ctx.drawImage(qrImg, 470, 130, 130, 130);
      } else {
        ctx.strokeRect(470, 130, 130, 130);
      }
      ctx.fillStyle = '#64748b';
      ctx.font = 'normal 9px system-ui, sans-serif';
      ctx.fillText('SCAN CARD TO VERIFY', 485, 275);

      // 4. Draw card disclaimer footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'normal 9px system-ui, sans-serif';
      ctx.fillText('CivicSense Portal Official ID Card. Issued by authority of NCT of Delhi.', 30, 365);

      callback(canvas);
    });
  };

  const handleDownloadJpg = () => {
    setDownloading(true);
    generateCardCanvas('jpg', (canvas) => {
      const url = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `NagrikCard_${user?.nagrikId || 'Citizen'}.jpg`;
      link.href = url;
      link.click();
      setDownloading(false);
    });
  };

  const handleDownloadPdf = () => {
    setDownloading(true);
    generateCardCanvas('pdf', (canvas) => {
      const imgUrl = canvas.toDataURL('image/jpeg', 0.95);
      const win = window.open('', '_blank');
      win.document.write(`
        <html>
          <head>
            <title>Print Nagrik ID Card</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f1f5f9; font-family: sans-serif; }
              .container { text-align: center; }
              img { max-width: 100%; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 12px; }
              .btn-print { margin-top: 20px; padding: 10px 20px; font-weight: bold; color: white; background: #2563eb; border: none; border-radius: 6px; cursor: pointer; }
              @media print {
                body { background: white; }
                .btn-print { display: none; }
                img { box-shadow: none; border-radius: 0; width: 100%; max-height: 100%; }
                @page { size: landscape; margin: 0; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="${imgUrl}" />
              <br/>
              <button class="btn-print" onclick="window.print();">Print / Save as PDF</button>
            </div>
          </body>
        </html>
      `);
      win.document.close();
      setDownloading(false);
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Citizen Profile</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">View your registered details and download your official Delhi Nagrik ID Card.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Citizen Official Card View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
            <h2 className="text-sm font-bold text-slate-700 mb-4 self-start flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Delhi Nagrik ID Card (Government Issued)
            </h2>
            
            {/* Styled ID Card */}
            <div 
              ref={cardRef} 
              className="relative w-full max-w-[500px] aspect-[1.6/1] bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden select-none flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
              }}
            >
              {/* Saffron & Green bands */}
              <div className="h-2 w-full bg-[#ff9933]"></div>
              <div className="h-2 w-full bg-[#138808] absolute bottom-0 left-0"></div>

              {/* Header */}
              <div className="px-4 pt-3 flex flex-col">
                <span className="text-[12px] font-black text-blue-900 tracking-wider">GOVERNMENT OF NCT OF DELHI</span>
                <span className="text-[8px] font-bold text-slate-500 tracking-widest uppercase">Delhi Citizen Portal (CivicSense)</span>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-0.5">Nagrik Identity Card</span>
              </div>
              
              {/* Divider */}
              <div className="h-[1px] bg-slate-200 mx-4"></div>

              {/* Card Body */}
              <div className="flex px-4 py-2 justify-between items-start gap-4 flex-1">
                {/* Photo Area */}
                <div className="w-[85px] aspect-[3/3.8] bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Citizen photo" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-slate-400" />
                  )}
                </div>

                {/* Details Area */}
                <div className="flex-1 flex flex-col justify-between h-full py-0.5 text-left">
                  <div>
                    <span className="text-[7px] font-bold text-slate-400 block leading-none">NAME</span>
                    <span className="text-[11px] font-bold text-slate-800 leading-tight uppercase truncate block max-w-[180px]">
                      {user?.name || ''} {user?.surname || ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[7px] font-bold text-slate-400 block leading-none">DATE OF BIRTH</span>
                    <span className="text-[10px] font-semibold text-slate-700 block">{user?.dob || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[7px] font-bold text-slate-400 block leading-none font-sans">NAGRIK CODE</span>
                    <span className="text-[12px] font-black text-blue-600 block tracking-wider">{user?.nagrikId || 'PENDING'}</span>
                  </div>
                  <div>
                    <span className="text-[7px] font-bold text-slate-400 block leading-none">STATUS</span>
                    <span className="text-[9px] font-black text-emerald-600 block">VERIFIED DELHI CITIZEN</span>
                  </div>
                </div>

                {/* QR Code Area */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <img src={qrCodeUrl} alt="Validation QR Code" className="w-[85px] h-[85px] border border-slate-200 p-0.5 bg-white rounded" />
                  <span className="text-[6px] font-bold text-slate-400 mt-1 uppercase">Scan to Verify</span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 pb-3 flex justify-between items-center text-[7px] text-slate-400 leading-none">
                <span>CivicSense Portal Official ID Card</span>
                <span>NCT Delhi Government</span>
              </div>
            </div>

            {/* Download Action Buttons */}
            <div className="flex gap-4 mt-6 w-full max-w-[500px]">
              <button
                onClick={handleDownloadJpg}
                disabled={downloading}
                className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                Download JPG
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="flex-1 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Printer className="h-4 w-4 text-blue-600" />
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Profile Details List */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Citizen Account Details
            </h3>

            {/* Profile Avatar / Photo */}
            <div className="flex items-center gap-4 py-2 border-b border-slate-50">
              <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-50 flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt="Citizen Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 uppercase leading-none mb-1">
                  {user?.name} {user?.surname}
                </span>
                <span className="text-xs text-slate-400">Delhi Registered Citizen</span>
              </div>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5">Email</span>
                  <span className="text-slate-700 font-medium">{user?.email}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5">Phone Number</span>
                  <span className="text-slate-700 font-medium">{user?.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5">Date of Birth</span>
                  <span className="text-slate-700 font-medium">{user?.dob || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5">Gender</span>
                  <span className="text-slate-700 font-medium">{user?.gender || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5">Residential Address</span>
                  <span className="text-slate-700 font-medium leading-relaxed">{user?.address || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
