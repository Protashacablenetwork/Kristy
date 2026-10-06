import React from 'react';
import { X, User, Phone, MapPin, Download, ZoomIn } from 'lucide-react';
import { Member } from '../types';

interface ImagePreviewModalProps {
  member: Member | null;
  imageUrl?: string | null;
  title?: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  member,
  imageUrl,
  title,
  onClose
}) => {
  if (!member && !imageUrl) return null;

  const displayPhoto = imageUrl || member?.photo;
  const displayName = title || member?.name || 'সদস্যের প্রোফাইল ছবি';

  const handleDownload = () => {
    if (!displayPhoto) return;
    const a = document.createElement('a');
    a.href = displayPhoto;
    a.download = `${displayName.replace(/\s+/g, '_')}_photo.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity cursor-pointer"
      />

      {/* Content Container */}
      <div className="relative w-full max-w-xl bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 overflow-hidden z-10 flex flex-col my-auto animate-scale-up">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <ZoomIn className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg text-white truncate leading-tight">
                {displayName}
              </h3>
              {member && (
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-blue-400">#{member.id}</span>
                  {member.phone && (
                    <span className="flex items-center gap-1">
                      • <Phone className="w-3 h-3 text-slate-400 inline" /> {member.phone}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Display */}
        <div className="p-4 sm:p-6 bg-slate-950/70 flex items-center justify-center min-h-[280px] max-h-[70vh] overflow-hidden relative">
          {displayPhoto ? (
            <img
              src={displayPhoto}
              alt={displayName}
              className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-2xl border border-slate-800/80 transition-transform duration-300 hover:scale-[1.02]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 py-12">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3 border border-slate-700">
                <User className="w-12 h-12" />
              </div>
              <p className="text-sm font-medium text-slate-400">কোনো ছবি আপলোড করা হয়নি</p>
            </div>
          )}
        </div>

        {/* Modal Footer / Member Details */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {member ? (
            <div className="flex flex-wrap items-center gap-3 text-slate-300">
              {member.address && (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate max-w-[200px]">{member.address}</span>
                </span>
              )}
            </div>
          ) : <div />}

          <div className="flex items-center gap-2 ml-auto">
            {displayPhoto && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md text-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ডাউনলোড</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition text-xs cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
