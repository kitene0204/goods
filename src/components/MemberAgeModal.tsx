import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Calendar, 
  Users, 
  Cake, 
  TrendingUp, 
  Filter, 
  Sparkles,
  ArrowUpDown,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { 
  HANWOOLIM_BIRTH_YEARS_DATA, 
  CURRENT_YEAR, 
  getFlatMembersList, 
  MemberAgeItem 
} from '../data/memberAges';
import { findMemberGradeInfo, getGradeBadgeStyle } from '../data/memberGrades';
import { extractChosung } from '../utils/chosung';

interface MemberAgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemberAgeModal: React.FC<MemberAgeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'year' | 'list'>('year');
  const [sortOrder, setSortOrder] = useState<'year-asc' | 'year-desc' | 'name-asc'>('year-asc');
  const [copied, setCopied] = useState(false);

  const allMembers = useMemo(() => getFlatMembersList(), []);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    let result = allMembers;

    if (selectedGeneration !== 'all') {
      result = result.filter(m => m.generation === selectedGeneration);
    }

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      const queryChosung = extractChosung(query);

      result = result.filter(m => {
        const nameMatch = m.name.toLowerCase().includes(query);
        const chosungMatch = extractChosung(m.name).includes(queryChosung);
        const yearMatch = m.birthYear.toString().includes(query);
        const ageMatch = m.currentAge.toString() === query;
        return nameMatch || chosungMatch || yearMatch || ageMatch;
      });
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortOrder === 'year-asc') return a.birthYear - b.birthYear || a.name.localeCompare(b.name, 'ko');
      if (sortOrder === 'year-desc') return b.birthYear - a.birthYear || a.name.localeCompare(b.name, 'ko');
      return a.name.localeCompare(b.name, 'ko');
    });
  }, [allMembers, selectedGeneration, searchTerm, sortOrder]);

  // Group by year for year view
  const yearGrouped = useMemo(() => {
    const groups: { [year: number]: MemberAgeItem[] } = {};
    filteredMembers.forEach(m => {
      if (!groups[m.birthYear]) groups[m.birthYear] = [];
      groups[m.birthYear].push(m);
    });

    const years = Object.keys(groups).map(Number);
    if (sortOrder === 'year-desc') {
      years.sort((a, b) => b - a);
    } else {
      years.sort((a, b) => a - b);
    }

    return years.map(year => ({
      year,
      age: CURRENT_YEAR - year,
      generation: groups[year][0].generation,
      members: groups[year],
    }));
  }, [filteredMembers, sortOrder]);

  // Generation stats
  const generationStats = useMemo(() => {
    const stats: { [gen: string]: number } = {
      '70대 이상': 0,
      '60대': 0,
      '50대': 0,
      '40대': 0,
      '30대': 0,
      '20대': 0,
      '10대 이하': 0,
    };
    allMembers.forEach(m => {
      if (stats[m.generation] !== undefined) {
        stats[m.generation]++;
      }
    });
    return stats;
  }, [allMembers]);

  const handleCopyText = () => {
    const text = HANWOOLIM_BIRTH_YEARS_DATA
      .map(g => `${g.year}년생 (${CURRENT_YEAR - g.year}세): ${g.names.join(', ')}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shadow-amber-400/20">
              🎂
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  한울림 회원 연령 및 출생연도 조견표
                </h3>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  {CURRENT_YEAR}년 기준
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                총 {allMembers.length}명의 출생연도 및 실시간 나이 정보
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyText}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="전체 명단 텍스트 복사"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? '복사됨' : '복사'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Quick Filter Controls Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="회원 이름, 초성(예: ㄱㅌㄱ), 또는 출생연도(예: 1980) 검색..."
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Generation Badges Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedGeneration('all')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                selectedGeneration === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              전체 ({allMembers.length}명)
            </button>
            {Object.entries(generationStats).map(([gen, count]) => {
              if (count === 0) return null;
              return (
                <button
                  key={gen}
                  onClick={() => setSelectedGeneration(gen)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                    selectedGeneration === gen
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {gen} ({count}명)
                </button>
              );
            })}
          </div>

          {/* View mode & sort controls */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500 font-medium">
              조회 결과: <strong className="text-slate-900 font-black">{filteredMembers.length}명</strong>
            </span>
            <div className="flex items-center gap-2">
              {/* Sort selector */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="year-asc">출생년도 오름차순 (연장자순)</option>
                <option value="year-desc">출생년도 내림차순 (막내순)</option>
                <option value="name-asc">이름 가나다순</option>
              </select>

              {/* View mode toggle */}
              <div className="flex rounded-lg bg-slate-200 p-0.5">
                <button
                  onClick={() => setViewMode('year')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                    viewMode === 'year' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  연도별
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  명단순
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/50">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <div className="text-3xl">🔍</div>
              <p className="text-sm font-bold">일치하는 회원 정보가 없습니다.</p>
              <p className="text-xs text-slate-400">검색어(이름 또는 연도)를 다시 확인해주세요.</p>
            </div>
          ) : viewMode === 'year' ? (
            /* Year Groups View */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {yearGrouped.map((group) => (
                <div
                  key={group.year}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900">
                        {group.year}년생
                      </span>
                      <span className="text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                        만 {group.age}세
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {group.generation} · {group.members.length}명
                    </span>
                  </div>

                  {/* Names list */}
                  <div className="flex flex-wrap gap-1.5">
                    {group.members.map((m) => {
                      const grade = findMemberGradeInfo(m.name);
                      return (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-900 border border-slate-200 text-xs font-bold text-slate-800 transition-colors"
                        >
                          <span>{m.name}</span>
                          {grade && (
                            <span
                              className={`text-[9px] font-black px-1 rounded ${getGradeBadgeStyle(
                                grade.tier,
                                false
                              )}`}
                            >
                              {grade.label}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Detailed Members Flat List */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
              {filteredMembers.map((m, idx) => {
                const grade = findMemberGradeInfo(m.name);
                return (
                  <div
                    key={m.id}
                    className="p-3 sm:px-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-slate-400 w-6">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {m.name}
                      </span>
                      {grade && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${getGradeBadgeStyle(
                            grade.tier,
                            false
                          )}`}
                        >
                          {grade.label}
                        </span>
                      )}
                      <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {m.generation}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-600 font-mono">
                        {m.birthYear}년생
                      </span>
                      <span className="text-xs font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                        만 {m.currentAge}세
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white p-3.5 sm:px-5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500">💡</span>
            <span>대회 조 편성, 연령별 핸디캡 적용 시 참고 자료로 활용하실 수 있습니다.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs transition-colors cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
