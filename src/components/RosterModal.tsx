import React, { useState, useMemo, useEffect } from 'react';
import { Participant, ClubMember, TournamentDivision } from '../types';
import { 
  X, 
  Clipboard, 
  Users, 
  UserPlus, 
  Sparkles, 
  Check, 
  Trash2, 
  Plus, 
  RotateCcw,
  ArrowRight,
  Info
} from 'lucide-react';
import { parsePastedRoster, SAMPLE_CLUB_MEMBERS } from '../utils/storage';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  clubMembers: ClubMember[];
  onSetParticipants: (newParticipants: Participant[]) => void;
  onAddParticipant: (participant: Participant) => void;
  onUpdateClubMembers: (members: ClubMember[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  participants = [],
  clubMembers = [],
  onSetParticipants,
  onAddParticipant,
  onUpdateClubMembers,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'clubDb' | 'manual'>('paste');
  
  // Safe array guards
  const safeClubMembers = useMemo(() => {
    return Array.isArray(clubMembers) ? clubMembers.filter(Boolean) : [];
  }, [clubMembers]);

  const safeParticipants = useMemo(() => {
    return Array.isArray(participants) ? participants.filter(Boolean) : [];
  }, [participants]);

  // Tab 1: Paste text state
  const [pasteText, setPasteText] = useState('');
  const [replaceMode, setReplaceMode] = useState<'replace' | 'append'>('replace');

  // Tab 2: Club Member Selection state
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(() => {
    const pList = Array.isArray(participants) ? participants.filter(Boolean) : [];
    const cList = Array.isArray(clubMembers) ? clubMembers.filter(Boolean) : [];
    const existingNames = new Set(pList.map((p) => p?.name).filter(Boolean));
    return new Set(
      cList
        .filter((m) => m && m.id && m.name && existingNames.has(m.name))
        .map((m) => m.id)
    );
  });

  // Keep selection synchronized when modal opens or members list updates
  useEffect(() => {
    if (isOpen) {
      const existingNames = new Set(safeParticipants.map((p) => p?.name).filter(Boolean));
      setSelectedMemberIds(
        new Set(
          safeClubMembers
            .filter((m) => m && m.id && m.name && existingNames.has(m.name))
            .map((m) => m.id)
        )
      );
    }
  }, [isOpen, safeClubMembers, safeParticipants]);

  // Tab 3: Manual single add state
  const [newName, setNewName] = useState('');
  const [newDivision, setNewDivision] = useState<TournamentDivision>('일반');
  const [newPhone, setNewPhone] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [saveToClubDb, setSaveToClubDb] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Parsed preview for Tab 1
  const parsedPreview = useMemo(() => {
    return parsePastedRoster(pasteText, safeClubMembers);
  }, [pasteText, safeClubMembers]);

  if (!isOpen) return null;

  const handleApplyPastedRoster = () => {
    if (!parsedPreview || parsedPreview.length === 0) {
      onShowToast('추출된 참석자 명단이 없습니다. 텍스트를 확인해주세요.', 'error');
      return;
    }

    if (replaceMode === 'replace') {
      onSetParticipants(parsedPreview);
      onShowToast(`총 ${parsedPreview.length}명의 새로운 대회 참석자 명단이 적용되었습니다!`, 'success');
    } else {
      // Append mode: merge without duplicate names
      const existingNames = new Set(safeParticipants.map((p) => p?.name).filter(Boolean));
      const newItems = parsedPreview.filter((p) => p && !existingNames.has(p.name));
      onSetParticipants([...safeParticipants, ...newItems]);
      onShowToast(`${newItems.length}명이 기존 명단에 추가되었습니다!`, 'success');
    }
    setPasteText('');
    onClose();
  };

  const handleApplyClubMembers = () => {
    const selectedMembers = safeClubMembers.filter((m) => m && m.id && selectedMemberIds.has(m.id));
    if (selectedMembers.length === 0) {
      onShowToast('선택된 회원이 없습니다.', 'error');
      return;
    }

    const newParticipants: Participant[] = selectedMembers.map((m) => {
      const existing = safeParticipants.find((p) => p && p.name === m.name);
      return {
        id: existing?.id || `p-${Date.now()}-${m.id}`,
        name: m.name || '무명',
        phone: m.phone || '',
        division: m.division || '일반',
        group: existing?.group || '',
        checked: existing?.checked || false,
        checkedAt: existing?.checkedAt || null,
        items: existing?.items || {},
        notes: existing?.notes || '',
      };
    });

    onSetParticipants(newParticipants);
    onShowToast(`클럽 회원 ${newParticipants.length}명이 대회 명단으로 등록되었습니다.`, 'success');
    onClose();
  };

  const handleToggleMemberSelection = (id: string) => {
    const next = new Set(selectedMemberIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMemberIds(next);
  };

  const handleSelectAllMembers = () => {
    setSelectedMemberIds(new Set(safeClubMembers.filter((m) => m && m.id).map((m) => m.id)));
  };

  const handleDeselectAllMembers = () => {
    setSelectedMemberIds(new Set());
  };

  const handleLoadSampleRoster = () => {
    onUpdateClubMembers(SAMPLE_CLUB_MEMBERS);
    setSelectedMemberIds(new Set(SAMPLE_CLUB_MEMBERS.map((m) => m.id)));
    onShowToast(`한울림 전체 회원 (${SAMPLE_CLUB_MEMBERS.length}명) DB가 로드되었습니다.`, 'info');
  };

  // Club Member DB operations
  const handleDeleteSingleMember = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const updated = safeClubMembers.filter((m) => m && m.id !== id);
    onUpdateClubMembers(updated);
    
    // Also remove from selected
    const nextSelected = new Set(selectedMemberIds);
    nextSelected.delete(id);
    setSelectedMemberIds(nextSelected);

    onShowToast(`회원 '${name}' 님이 클럽 DB에서 삭제되었습니다.`, 'info');
  };

  const handleDeleteSelectedMembers = () => {
    if (selectedMemberIds.size === 0) {
      onShowToast('삭제할 회원을 먼저 선택해주세요.', 'error');
      return;
    }

    const count = selectedMemberIds.size;
    const updated = safeClubMembers.filter((m) => m && !selectedMemberIds.has(m.id));
    onUpdateClubMembers(updated);
    setSelectedMemberIds(new Set());
    onShowToast(`선택한 회원 ${count}명이 클럽 DB에서 삭제되었습니다.`, 'info');
  };

  const handleClearAllClubMembers = () => {
    onUpdateClubMembers([]);
    setSelectedMemberIds(new Set());
    setShowClearConfirm(false);
    onShowToast('클럽 회원 DB가 모두 삭제되었습니다.', 'info');
  };

  const handleAddManualParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      onShowToast('이름을 입력해주세요.', 'error');
      return;
    }

    const newP: Participant = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newName.trim(),
      division: newDivision,
      phone: newPhone.trim(),
      group: newGroup.trim(),
      checked: false,
      checkedAt: null,
      items: {},
      notes: '',
    };

    onAddParticipant(newP);

    if (saveToClubDb) {
      const newMember: ClubMember = {
        id: `cm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: newP.name,
        phone: newP.phone,
        division: newP.division,
      };
      onUpdateClubMembers([...safeClubMembers, newMember]);
      onShowToast(`${newP.name} 님이 대회 명단 및 클럽 회원 DB에 추가되었습니다!`, 'success');
    } else {
      onShowToast(`${newP.name} 님이 대회 명단에 추가되었습니다!`, 'success');
    }

    setNewName('');
    setNewPhone('');
    setNewGroup('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-100 text-slate-900 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">참석자 및 회원 명단 관리</h2>
              <p className="text-xs text-slate-500 font-medium">카카오톡 투표 복사 붙여넣기 또는 클럽 회원 DB 연동</p>
            </div>
          </div>
          <button
            id="roster-modal-close"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 gap-2">
          <button
            id="roster-tab-paste"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clipboard className="w-4 h-4 text-slate-700" />
            <span>카톡 투표 복사 붙여넣기</span>
            <span className="text-[10px] bg-lime-400 text-slate-950 font-extrabold px-1.5 py-0.2 rounded-full">추천</span>
          </button>

          <button
            id="roster-tab-clubdb"
            onClick={() => setActiveTab('clubDb')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer ${
              activeTab === 'clubDb'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-slate-700" />
            <span>클럽 회원 DB ({safeClubMembers.length})</span>
          </button>

          <button
            id="roster-tab-manual"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4 text-slate-700" />
            <span>수기 추가</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* TAB 1: PASTE */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-lime-50 border border-lime-200 text-xs text-lime-950 space-y-1">
                <div className="font-black flex items-center gap-1.5 text-lime-900">
                  <Sparkles className="w-4 h-4 text-lime-600" />
                  스마트 자동 파싱 지원
                </div>
                <p className="text-slate-700 font-medium leading-relaxed">
                  카카오톡 투표 명단, 엑셀 표, 단톡방 복사글을 그대로 붙여넣으세요.
                  이름, 부수(금배/은배/동배/신인), 전화번호를 자동으로 감지합니다.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">참석자 명단 텍스트 붙여넣기:</label>
                  <button
                    onClick={() =>
                      setPasteText(`1. 김민수(금배) 010-2345-6789 1코트
2. 이수진(은배) 010-3456-7890 2코트
3. 박준형(금배) 010-4567-8901
4. 최유나(동배) 010-5678-9012 3코트
5. 정태우(신인) 010-6789-0123
6. 강동원(마스터즈) 010-7890-1234
7. 한지민(은배)
8. 윤도현(동배)
9. 송혜교(은배)
10. 조인성(금배)`)
                    }
                    className="text-[11px] text-slate-900 hover:text-lime-600 font-bold cursor-pointer underline"
                  >
                    예시 샘플 텍스트 넣기
                  </button>
                </div>
                <textarea
                  id="paste-roster-textarea"
                  rows={6}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={`예시:\n1. 홍길동(금배) 010-1234-5678\n2. 김철수(은배)\n3. 박영희(동배)\n또는 "홍길동, 김철수, 박영희"`}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs sm:text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:bg-white transition-all"
                />
              </div>

              {/* Parsing live preview */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      인식된 참석자: <span className="text-slate-900 font-black">{parsedPreview.length}명</span>
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-2xl bg-slate-50 border border-slate-200 p-2 space-y-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {parsedPreview.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-2.5 py-1.5 bg-white rounded-xl border border-slate-200 text-xs shadow-xs"
                        >
                          <span className="font-bold text-slate-900 truncate">{p.name}</span>
                          <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                            {p.division}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mode Selector */}
              <div className="flex flex-wrap items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-700">적용 방식:</div>
                <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="replaceMode"
                    value="replace"
                    checked={replaceMode === 'replace'}
                    onChange={() => setReplaceMode('replace')}
                    className="text-lime-600 focus:ring-lime-500"
                  />
                  <span>새 대회 명단으로 교체 (기존 명단 대체)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="replaceMode"
                    value="append"
                    checked={replaceMode === 'append'}
                    onChange={() => setReplaceMode('append')}
                    className="text-lime-600 focus:ring-lime-500"
                  />
                  <span>기존 명단에 추가</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: CLUB MASTER DB */}
          {activeTab === 'clubDb' && (
            <div className="space-y-4">
              {/* Header & Action Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>클럽 상시 회원 명단</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-extrabold text-xs font-mono">
                      {safeClubMembers.length}명
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">대회에 참석할 회원을 체크하여 대회 명단으로 등록합니다.</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={handleSelectAllMembers}
                    disabled={safeClubMembers.length === 0}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                  >
                    전체 선택
                  </button>
                  <button
                    onClick={handleDeselectAllMembers}
                    disabled={selectedMemberIds.size === 0}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                  >
                    선택 해제
                  </button>

                  {/* Selected Delete button */}
                  {selectedMemberIds.size > 0 && (
                    <button
                      id="delete-selected-members-btn"
                      onClick={handleDeleteSelectedMembers}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors"
                      title="선택한 회원들을 클럽 DB에서 삭제합니다"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      <span>선택 {selectedMemberIds.size}명 삭제</span>
                    </button>
                  )}

                  {/* Clear All DB button */}
                  {safeClubMembers.length > 0 && (
                    <button
                      id="clear-club-db-btn"
                      onClick={() => setShowClearConfirm(true)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold cursor-pointer flex items-center gap-1 transition-colors"
                      title="클럽 회원 DB 전체 비우기"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>전체 비우기</span>
                    </button>
                  )}

                  {/* Sample DB button */}
                  <button
                    onClick={handleLoadSampleRoster}
                    className="px-2.5 py-1 rounded-lg bg-lime-100 text-slate-900 hover:bg-lime-200 text-xs font-black cursor-pointer flex items-center gap-1 transition-colors"
                    title="한울림 전체 회원 DB (73명) 불러오기"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>한울림 전체 회원 (73명)</span>
                  </button>
                </div>
              </div>

              {/* Clear All Confirmation Dialog */}
              {showClearConfirm && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-2 animate-in fade-in">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>정말로 클럽 회원 DB (총 {safeClubMembers.length}명)을 모두 삭제하시겠습니까?</span>
                  </div>
                  <p className="text-rose-800 text-[11px] font-medium leading-relaxed">
                    삭제 시 상시 회원 명단이 완전히 비워지며, 필요할 때 언제든 '한울림 전체 회원' 버튼이나 카톡 투표 붙여넣기로 다시 등록하실 수 있습니다.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleClearAllClubMembers}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      전체 삭제 확인
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {safeClubMembers.length === 0 ? (
                <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 mx-auto flex items-center justify-center font-bold">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">등록된 클럽 회원이 없습니다</h4>
                    <p className="text-xs text-slate-500">
                      클럽 상시 회원 DB가 비어 있습니다. 한울림 전체 명부를 불러오거나 카톡 투표 명단을 붙여넣어 등록해보세요.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={handleLoadSampleRoster}
                      className="px-3.5 py-2 rounded-xl bg-lime-400 hover:bg-lime-500 text-slate-950 font-black text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>한울림 전체 회원 DB 불러오기</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('paste')}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Clipboard className="w-3.5 h-3.5 text-slate-700" />
                      <span>카톡 명단 붙여넣기</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Members List with checkboxes and individual delete buttons */
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                  {safeClubMembers.map((member) => {
                    if (!member || !member.id) return null;
                    const isSelected = selectedMemberIds.has(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => handleToggleMemberSelection(member.id)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-lime-50/80 border-lime-400 text-slate-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                              isSelected
                                ? 'bg-lime-500 border-lime-500 text-slate-950 font-bold'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className="font-black text-sm text-slate-900 truncate">{member.name || '이름 없음'}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold shrink-0">
                            {member.division || '일반'}
                          </span>
                          {member.ntrp && (
                            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline shrink-0">
                              NTRP {member.ntrp}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-mono text-slate-500 hidden sm:inline">{member.phone || ''}</span>

                          {/* Individual Delete Button */}
                          <button
                            id={`delete-member-${member.id}`}
                            onClick={(e) => handleDeleteSingleMember(e, member.id, member.name || '')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                            title={`'${member.name}' 회원을 DB에서 삭제`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANUAL ADD */}
          {activeTab === 'manual' && (
            <form onSubmit={handleAddManualParticipant} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                대회 현장에 갑자기 찾아온 게스트나 미등록 회원을 1명씩 즉시 추가할 수 있습니다.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">회원 이름 *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="예: 김동현"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">구분 / 부수</label>
                  <select
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value as TournamentDivision)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  >
                    <option value="금배부">금배부</option>
                    <option value="은배부">은배부</option>
                    <option value="동배부">동배부</option>
                    <option value="신인부">신인부</option>
                    <option value="마스터즈">마스터즈</option>
                    <option value="일반">일반</option>
                    <option value="게스트">게스트</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">전화번호</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">조 / 코트 지정</label>
                  <input
                    type="text"
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    placeholder="예: 1코트, A조"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="save-to-club-db-checkbox"
                  checked={saveToClubDb}
                  onChange={(e) => setSaveToClubDb(e.target.checked)}
                  className="w-4 h-4 rounded text-lime-600 focus:ring-lime-500 cursor-pointer"
                />
                <label htmlFor="save-to-club-db-checkbox" className="text-xs font-bold text-slate-800 cursor-pointer">
                  클럽 상시 회원 DB에도 함께 등록하기
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-lime-400 font-black text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-lime-400" />
                <span>참가자 1명 추가하기</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
          >
            닫기
          </button>

          {activeTab === 'paste' && (
            <button
              id="apply-pasted-roster-btn"
              onClick={handleApplyPastedRoster}
              disabled={parsedPreview.length === 0}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-lime-400 font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{parsedPreview.length}명 명단 확정 및 적용</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {activeTab === 'clubDb' && (
            <button
              id="apply-club-members-btn"
              onClick={handleApplyClubMembers}
              disabled={selectedMemberIds.size === 0}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none text-lime-400 font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>선택 회원 ({selectedMemberIds.size}명) 대회 참가 등록</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
