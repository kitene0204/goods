import React, { useState } from 'react';
import { EventConfig, CheckItem } from '../types';
import { 
  X, 
  Settings, 
  Trophy, 
  Save, 
  Plus, 
  Trash2, 
  Sparkles, 
  Layers, 
  Type, 
  MapPin, 
  Calendar, 
  ShieldCheck 
} from 'lucide-react';

interface EventSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EventConfig;
  onSaveConfig: (updatedConfig: EventConfig) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const EventSettingsModal: React.FC<EventSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onShowToast,
}) => {
  const [draft, setDraft] = useState<EventConfig>({ ...config });
  const [newItemName, setNewItemName] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(draft);
    onShowToast('대회 설정이 저장되었습니다.', 'success');
    onClose();
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    const newItem: CheckItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      badgeColor: 'bg-emerald-500',
    };
    setDraft({
      ...draft,
      items: [...draft.items, newItem],
    });
    setNewItemName('');
  };

  const handleRemoveItem = (id: string) => {
    setDraft({
      ...draft,
      items: draft.items.filter((it) => it.id !== id),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-100 text-slate-900 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">대회 정보 및 세부 설정</h2>
              <p className="text-xs text-slate-500 font-medium">대회명, 일자, 장소 및 다중 체크 항목 관리</p>
            </div>
          </div>
          <button
            id="settings-modal-close"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Tournament Title & Club Name */}
          <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">대회 공식 명칭 *</label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="예: 2026년 8월 에이스 테니스클럽 정기 월례대회"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">클럽명</label>
                <input
                  type="text"
                  value={draft.clubName}
                  onChange={(e) => setDraft({ ...draft, clubName: e.target.value })}
                  placeholder="예: 에이스 테니스클럽"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">대회 일자</label>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">대회 코트 및 장소</label>
              <input
                type="text"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                placeholder="예: 올림픽공원 테니스장 1~4번 코트"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>
          </div>

          {/* Primary Item Name */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-lime-600" />
              <span>기본 수령 물품 / 기념품 명칭</span>
            </label>
            <input
              type="text"
              value={draft.primaryItemName}
              onChange={(e) => setDraft({ ...draft, primaryItemName: e.target.value })}
              placeholder="예: 참가 웰컴 패키지 (테니스 타월 & 댐프너)"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500 font-medium"
            />
            <p className="text-[11px] text-slate-500">
              상단 배너 및 엑셀 기록 시 기본 수령 품목으로 표기됩니다.
            </p>
          </div>

          {/* Multi-Item Mode Toggle */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-700" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">다중 항목 상세 체크 모드</div>
                  <div className="text-[11px] text-slate-500">
                    기념품 외에 도시락, 회비납부, 경품 등을 개별 체크할 수 있습니다.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.multiItemMode}
                  onChange={(e) => setDraft({ ...draft, multiItemMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-500"></div>
              </label>
            </div>

            {draft.multiItemMode && (
              <div className="space-y-2 pt-2 border-t border-slate-200 animate-in fade-in">
                <div className="text-xs font-semibold text-slate-700">세부 체크 항목 목록:</div>
                <div className="space-y-1.5">
                  {draft.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-xs"
                    >
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="새 체크 항목 (예: 에너지젤, 그립)"
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                  <button
                    onClick={handleAddItem}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 text-xs font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>추가</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Display & Font Size Option */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-slate-700" />
              <span>야외 시인성 글자 크기</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'large', 'xlarge'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setDraft({ ...draft, fontSize: size })}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    draft.fontSize === size
                      ? 'bg-lime-400 text-slate-950 border-lime-500 shadow-xs font-black'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {size === 'normal' ? '보통 (기본)' : size === 'large' ? '크게 (추천)' : '아주 크게'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
          >
            취소
          </button>
          <button
            id="save-event-settings-btn"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-lime-400 font-black text-xs sm:text-sm shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>설정 저장하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
