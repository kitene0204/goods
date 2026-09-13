import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Calendar, 
  Cake, 
  Users, 
  TrendingUp, 
  Copy, 
  Check, 
  ArrowLeft, 
  Filter,
  Sparkles,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import { 
  HANWOOLIM_BIRTH_YEARS_DATA, 
  CURRENT_YEAR, 
  getFlatMembersList, 
  MemberAgeItem 
} from '../data/memberAges';
import { findMemberGradeInfo, getGradeBadgeStyle } from '../data/memberGrades';
import { extractChosung } from '../utils/chosung';
import { MainAppTab } from '../types';

interface MemberAgeViewProps {
  onBackToCheckin: () => void;
  onSelectTab: (tab: MainAppTab) => void;
}

export const MemberAgeView: React.FC<MemberAgeViewProps> = ({
  onBackToCheckin,
  onSelectTab,
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

  return (
    <main className="flex-1 p-4 sm:p-6 flex flex-col space-y-4 pb-28 min-h-[calc(100vh-68px)]">
      {/* Top Banner & Return Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-400/20 shrink-0">
            🎂
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                한울림 회원 연령 및 출생연도 현황
              </h2>
              <span className="text-xs font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-2xs">
                {CURRENT_YEAR}년 기준
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              등록된 총 <strong>{allMembers.length}명</strong>의 회원 출생연도와 실시간 만 나이 조견표입니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyText}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border border-slate-700"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '복사 완료!' : '조견표 텍스트 복사'}</span>
          </button>

          <button
            onClick={onBackToCheckin}
            className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>대회 출석부로 복귀</span>
          </button>
        </div>
      </div>

      {/* Generation Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
        {Object.entries(generationStats).map(([gen, count]) => {
          const isSelected = selectedGeneration === gen;
          return (
            <button
              key={gen}
              onClick={() => setSelectedGeneration(selectedGeneration === gen ? 'all' : gen)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {gen}
                </span>
                {isSelected && <span className="text-[10px] font-black bg-indigo-500 px-1.5 py-0.2 rounded">선택됨</span>}
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={`text-xl font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {count}
                </span>
                <span className={`text-xs ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>명</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search, Filter & View Mode Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름 검색, 초성 검색(예: ㄱㅌㄱ), 출생연도(예: 1980)..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-2xs"
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

          <div className="flex items-center gap-2">
            {/* Sort Order Selector */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-slate-700 cursor-pointer shadow-2xs focus:outline-none"
            >
              <option value="year-asc">출생년도 오름차순 (연장자순)</option>
              <option value="year-desc">출생년도 내림차순 (막내순)</option>
              <option value="name-asc">이름 가나다순</option>
            </select>

            {/* View Mode Toggle Buttons */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setViewMode('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'year'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                연도별 모음
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                전체 명단순
              </button>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            현재 표시: <strong className="text-slate-900 font-black">{filteredMembers.length}명</strong>
            {selectedGeneration !== 'all' && (
              <span className="ml-2 font-bold text-indigo-600">({selectedGeneration} 필터 적용)</span>
            )}
          </div>
          {(searchTerm || selectedGeneration !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGeneration('all');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
            >
              검색·필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div className="text-4xl">🔍</div>
            <h4 className="text-base font-black text-slate-900">일치하는 회원이 없습니다</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              검색어(이름 또는 연도)를 확인하거나 필터를 전체로 변경해보세요.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedGeneration('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-lime-400 text-xs font-bold shadow-sm cursor-pointer"
            >
              전체 보기
            </button>
          </div>
        ) : viewMode === 'year' ? (
          /* Year Group Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {yearGrouped.map((group) => (
              <div
                key={group.year}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-900 tracking-tight">
                      {group.year}년생
                    </span>
                    <span className="text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                      만 {group.age}세
                    </span>
                  </div>
                  <span className="text-xs font-extrabold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                    {group.generation} · {group.members.length}명
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {group.members.map((m) => {
                    const grade = findMemberGradeInfo(m.name);
                    return (
                      <div
                        key={m.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 text-sm font-black text-slate-800 hover:text-indigo-900 transition-all"
                      >
                        <span>{m.name}</span>
                        {grade && (
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.2 rounded ${getGradeBadgeStyle(
                              grade.tier,
                              false
                            )}`}
                          >
                            {grade.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Detailed Flat Table */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 font-black text-slate-800">이름</th>
                    <th className="py-3 px-4 font-black text-slate-800">등급</th>
                    <th className="py-3 px-4 font-black text-slate-800">출생연도</th>
                    <th className="py-3 px-4 font-black text-slate-800">현재 만 나이</th>
                    <th className="py-3 px-4 font-black text-slate-800">연령대</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((m, idx) => {
                    const grade = findMemberGradeInfo(m.name);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-400 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900 text-sm">
                          {m.name}
                        </td>
                        <td className="py-3 px-4">
                          {grade ? (
                            <span
                              className={`inline-flex items-center text-[11px] font-black px-2 py-0.5 rounded-md ${getGradeBadgeStyle(
                                grade.tier,
                                false
                              )}`}
                            >
                              {grade.label}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {m.birthYear}년생
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-amber-700">
                          만 {m.currentAge}세
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-xs">
                            {m.generation}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
