import React from 'react';
import { Download, X, Copy, Check, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ThumbnailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ThumbnailModal: React.FC<ThumbnailModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleDownloadSvg = () => {
    fetch('/src/assets/thumbnail.svg')
      .then((res) => res.text())
      .then((svgText) => {
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tennis-checkin-thumbnail.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onShowToast('정사각형 SVG 썸네일 파일이 다운로드되었습니다!', 'success');
      })
      .catch(() => {
        onShowToast('다운로드 중 오류가 발생했습니다.', 'error');
      });
  };

  const handleDownloadPng = () => {
    fetch('/src/assets/thumbnail.svg')
      .then((res) => res.text())
      .then((svgText) => {
        const img = new Image();
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = 1024;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 1024, 1024);
            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = 'tennis-checkin-thumbnail-1024x1024.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            onShowToast('고해상도 1024x1024 PNG 썸네일이 저장되었습니다!', 'success');
          }
          URL.revokeObjectURL(url);
        };
        img.src = url;
      })
      .catch(() => {
        onShowToast('PNG 변환 중 오류가 발생했습니다.', 'error');
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-lime-500/20 text-lime-400 border border-lime-500/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                앱 정사각형 썸네일 (1:1)
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-400 border border-lime-500/30">
                  1024 × 1024
                </span>
              </h2>
              <p className="text-xs text-slate-400">교사 연수 발표 자료 및 모바일 홈 화면 아이콘용</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail Preview Area */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-950/50">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-700/80 group">
            <img
              src="/src/assets/thumbnail.svg"
              alt="Tennis Checkin App Thumbnail"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">
            선명한 테니스 코트 에메랄드 & 네온 라임 컬러와 실시간 클라우드 0.1s 동기화 뱃지
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleDownloadPng}
            className="flex-1 py-3 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-lime-400/20 active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>고화질 PNG 다운로드 (1024px)</span>
          </button>

          <button
            onClick={handleDownloadSvg}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>SVG 벡터 다운로드</span>
          </button>
        </div>
      </div>
    </div>
  );
};
