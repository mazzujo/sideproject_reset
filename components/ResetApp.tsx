'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { categories, videos, routines, DAYS_KO } from '@/lib/data';

const BRIGHTCOVE_BASE = 'https://players.brightcove.net/4714746360001/rklIcHxO1f_default/index.html?videoId=';

const getTodayKey = () => new Date().toISOString().split('T')[0];

function calcStreak(history: Record<string, number[]>): number {
  const todayKey = getTodayKey();
  const todayDone = (history[todayKey]?.length ?? 0) > 0;
  let streak = 0;
  for (let i = todayDone ? 0 : 1; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if ((history[key]?.length ?? 0) > 0) streak++;
    else break;
  }
  return streak;
}

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const lastDate = new Date(year, month + 1, 0).getDate();
  const offset = (firstDow + 6) % 7; // Mon-based
  const days: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= lastDate; d++) days.push(new Date(year, month, d));
  return days;
}

export default function ResetApp() {
  const [selectedCategory, setSelectedCategory] = useState<string>('today');
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, number[]>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionShownFor, setCompletionShownFor] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  const todayKey = getTodayKey();
  const today = new Date().getDay();
  const checkedToday = new Set<number>(history[todayKey] ?? []);

  // 초기 로딩 — 날짜 기반 기록으로 마이그레이션
  useEffect(() => {
    const savedHistory = localStorage.getItem('reset-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    } else {
      const old = localStorage.getItem('reset-checked');
      if (old) {
        const migrated = { [todayKey]: JSON.parse(old) as number[] };
        setHistory(migrated);
        localStorage.setItem('reset-history', JSON.stringify(migrated));
        localStorage.removeItem('reset-checked');
      }
    }
    const savedRoutine = localStorage.getItem('reset-routine');
    if (savedRoutine) setSelectedRoutineId(savedRoutine);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [selectedCategory]);

  const toggleCheck = (id: number) => {
    setHistory(prev => {
      const todayList = [...(prev[todayKey] ?? [])];
      const idx = todayList.indexOf(id);
      if (idx >= 0) todayList.splice(idx, 1);
      else todayList.push(id);
      const next = { ...prev, [todayKey]: todayList };
      localStorage.setItem('reset-history', JSON.stringify(next));
      return next;
    });
  };

  const selectRoutine = (id: string) => {
    setSelectedRoutineId(id);
    localStorage.setItem('reset-routine', id);
    setShowRoutineModal(false);
  };

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.offsetWidth - 32;
    setActiveIndex(Math.round(el.scrollLeft / (cardWidth + 12)));
  }, []);

  const currentRoutine = routines.find(r => r.id === selectedRoutineId);
  const todayCategoryIds: string[] = currentRoutine?.schedule[today] ?? [];
  const isRestDay = !!selectedRoutineId && todayCategoryIds.length === 0;
  const todayVideos = videos.filter(v => todayCategoryIds.includes(v.category));
  const todayCheckedCount = todayVideos.filter(v => checkedToday.has(v.id)).length;
  const streak = calcStreak(history);

  // 오늘 루틴 완료 감지
  useEffect(() => {
    if (
      selectedCategory === 'today' &&
      todayVideos.length > 0 &&
      todayCheckedCount === todayVideos.length &&
      completionShownFor !== todayKey
    ) {
      setShowCompletion(true);
      setCompletionShownFor(todayKey);
    }
  }, [todayCheckedCount, todayVideos.length, selectedCategory]);

  const filteredVideos =
    selectedCategory === 'all'   ? videos :
    selectedCategory === 'today' ? todayVideos :
    videos.filter(v => v.category === selectedCategory);

  const navItems = [
    ...(selectedRoutineId && !isRestDay
      ? [{ id: 'today', shortName: '오늘' }]
      : []),
    ...categories.map(c => ({ id: c.id, shortName: c.shortName })),
    { id: 'all', shortName: '전체' },
  ];

  // 캘린더
  const calDays = getCalendarDays(calendarDate.year, calendarDate.month);
  const moveMonth = (dir: number) => {
    setCalendarDate(prev => {
      const d = new Date(prev.year, prev.month + dir, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-stone-50">

      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-stone-200 px-5 py-3 flex items-center justify-between">
        <h1 className="text-base font-semibold tracking-wide text-stone-800">상체 리셋</h1>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <span className="text-xs text-orange-500 font-semibold tracking-wide">
              🔥 {streak}일 연속
            </span>
          )}
          <button
            onClick={() => setShowCalendar(true)}
            className="text-stone-400 text-xs px-2 py-1 rounded-lg border border-stone-200 tracking-wide"
          >
            기록
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        <aside className="flex-shrink-0 w-[4.5rem] border-r border-stone-200 bg-white flex flex-col">
          <div className="flex-1 overflow-y-auto flex flex-col py-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedCategory(item.id)}
                className={`relative w-full text-left px-3 py-2.5 text-[11px] leading-snug tracking-wide transition-all ${
                  selectedCategory === item.id
                    ? 'text-green-800 font-semibold bg-green-50'
                    : 'text-stone-400 active:bg-stone-50'
                }`}
              >
                {selectedCategory === item.id && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-green-700 rounded-r-full" />
                )}
                {item.shortName}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowRoutineModal(true)}
            className={`flex-shrink-0 w-full border-t px-2 py-3 text-[10px] tracking-wide text-center leading-snug transition-all ${
              !selectedRoutineId
                ? 'border-green-200 bg-green-50 text-green-700 font-semibold'
                : 'border-stone-100 text-stone-400 active:bg-stone-50'
            }`}
          >
            {selectedRoutineId ? '루틴\n변경' : '루틴\n선택'}
          </button>
        </aside>

        {/* Swipe carousel area */}
        <main className="flex-1 overflow-hidden flex flex-col py-3">

          {/* 카드 위 정보 */}
          {filteredVideos.length > 0 && (
            <div className="px-4 mb-2 flex-shrink-0">
              {selectedCategory === 'today' && currentRoutine && (
                <>
                  <p className="text-[11px] text-stone-400 tracking-wide mb-0.5">
                    {currentRoutine.name} —{' '}
                    {todayCategoryIds.map(id => categories.find(c => c.id === id)?.shortName).join(', ')}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-stone-600 tracking-wide">
                      오늘 루틴 영상 {filteredVideos.length}개
                    </p>
                    <p className="text-xs text-stone-400 tracking-wide">
                      {todayCheckedCount}/{todayVideos.length} 완료
                    </p>
                  </div>
                  {/* 오늘 진행률 바 */}
                  <div className="w-full bg-stone-100 rounded-full h-0.5 mt-1.5">
                    <div
                      className="bg-green-700 h-0.5 rounded-full transition-all duration-500"
                      style={{ width: todayVideos.length ? `${(todayCheckedCount / todayVideos.length) * 100}%` : '0%' }}
                    />
                  </div>
                </>
              )}
              {selectedCategory !== 'today' && (
                <p className="text-xs font-medium text-stone-600 tracking-wide">
                  {selectedCategory === 'all'
                    ? `전체 영상 ${filteredVideos.length}개`
                    : `${categories.find(c => c.id === selectedCategory)?.shortName} 영상 ${filteredVideos.length}개`}
                </p>
              )}
            </div>
          )}

          {/* Empty state */}
          {filteredVideos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
              {!selectedRoutineId ? (
                <>
                  <p className="text-stone-600 text-sm font-medium tracking-wide">루틴을 먼저 선택해주세요</p>
                  <p className="text-stone-400 text-xs tracking-wide leading-relaxed">
                    좌측 하단 <span className="text-green-700 font-semibold">루틴 선택</span> 버튼을 눌러<br />오늘 할 동작을 설정해보세요
                  </p>
                  <button
                    onClick={() => setShowRoutineModal(true)}
                    className="mt-1 px-6 py-2.5 bg-green-700 text-white text-xs rounded-2xl font-medium tracking-wide"
                  >
                    루틴 선택하기
                  </button>
                </>
              ) : isRestDay ? (
                <p className="text-stone-300 text-sm tracking-wide">오늘은 휴식일이에요</p>
              ) : (
                <p className="text-stone-300 text-sm tracking-wide">동작이 없어요</p>
              )}
            </div>
          ) : (
            <>
              {/* Horizontal swipe cards */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 flex overflow-x-auto snap-x snap-mandatory gap-3 px-4"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {filteredVideos.map((video, index) => {
                  const isChecked = checkedToday.has(video.id);
                  const cat = categories.find(c => c.id === video.category);
                  const shouldRender = Math.abs(index - activeIndex) <= 1;

                  return (
                    <div
                      key={video.id}
                      className={`snap-start flex-shrink-0 h-full flex flex-col bg-white rounded-2xl border overflow-hidden transition-all ${
                        isChecked ? 'border-green-200' : 'border-stone-200'
                      }`}
                      style={{ width: 'calc(100% - 2rem)' }}
                    >
                      <div className={`flex items-center gap-3 px-4 py-3 flex-shrink-0 ${isChecked ? 'bg-green-50/50' : ''}`}>
                        <button
                          onClick={() => toggleCheck(video.id)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isChecked ? 'bg-green-700 border-green-700 text-white' : 'border-stone-300'
                          }`}
                        >
                          {isChecked && (
                            <svg className="w-2.5 h-2.5" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate tracking-wide ${
                            isChecked ? 'text-stone-300 line-through' : 'text-stone-700'
                          }`}>
                            {video.title}
                          </p>
                          {(selectedCategory === 'all' || selectedCategory === 'today') && (
                            <p className="text-[10px] text-stone-300 mt-0.5 tracking-widest">{cat?.shortName}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-h-0 px-3 pb-3">
                        <div className="relative w-full h-full rounded-xl overflow-hidden bg-stone-100">
                          {shouldRender ? (
                            <iframe
                              src={`${BRIGHTCOVE_BASE}${video.videoId}`}
                              className="absolute inset-0 w-full h-full"
                              allowFullScreen
                              allow="encrypted-media"
                              title={video.title}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
                              <span className="text-stone-300 text-xs tracking-wide">로딩 중</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Position indicator */}
              <div className="flex-shrink-0 flex items-center justify-center gap-2 pt-2 pb-1">
                {filteredVideos.length <= 12 ? (
                  filteredVideos.map((_, i) => (
                    <span
                      key={i}
                      className={`rounded-full transition-all duration-200 ${
                        i === activeIndex ? 'w-4 h-1.5 bg-green-700' : 'w-1.5 h-1.5 bg-stone-300'
                      }`}
                    />
                  ))
                ) : (
                  <span className="text-[11px] text-stone-400 tracking-wide">
                    {activeIndex + 1} / {filteredVideos.length}
                  </span>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* 루틴 완료 피드백 */}
      {showCompletion && (
        <div className="fixed inset-0 z-40 flex items-end">
          <div className="w-full bg-white rounded-t-3xl px-6 py-8 shadow-xl border-t border-stone-100">
            <div className="text-center">
              <p className="text-2xl mb-2">🌿</p>
              <p className="text-base font-semibold text-stone-800 tracking-wide mb-1">오늘 루틴 완료!</p>
              <p className="text-sm text-stone-400 tracking-wide mb-1">정말 수고했어요</p>
              {streak > 0 && (
                <p className="text-sm text-orange-500 font-semibold tracking-wide mt-2">
                  🔥 {streak}일 연속 달성 중이에요
                </p>
              )}
            </div>
            <button
              onClick={() => setShowCompletion(false)}
              className="w-full mt-6 py-3 bg-green-700 text-white text-sm rounded-2xl font-medium tracking-wide"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 캘린더 모달 */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black/30 z-30 flex items-end" onClick={() => setShowCalendar(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-8 h-0.5 bg-stone-200 rounded-full mx-auto mb-4" />

            {/* 캘린더 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => moveMonth(-1)} className="text-stone-400 px-2 py-1 text-sm">‹</button>
              <p className="text-sm font-semibold text-stone-700 tracking-wide">
                {calendarDate.year}년 {calendarDate.month + 1}월
              </p>
              <button onClick={() => moveMonth(1)} className="text-stone-400 px-2 py-1 text-sm">›</button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 mb-1">
              {['월','화','수','목','금','토','일'].map(d => (
                <p key={d} className="text-center text-[10px] text-stone-400 py-1 tracking-wide">{d}</p>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-y-1">
              {calDays.map((date, i) => {
                if (!date) return <div key={i} />;
                const key = date.toISOString().split('T')[0];
                const hasDone = (history[key]?.length ?? 0) > 0;
                const isToday = key === todayKey;
                return (
                  <div key={key} className="flex flex-col items-center py-1">
                    <span className={`text-xs w-7 h-7 flex items-center justify-center rounded-full tracking-wide ${
                      isToday ? 'bg-green-700 text-white font-semibold' : 'text-stone-600'
                    }`}>
                      {date.getDate()}
                    </span>
                    {hasDone && (
                      <span className={`w-1 h-1 rounded-full mt-0.5 ${isToday ? 'bg-white' : 'bg-green-600'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* 요약 */}
            <div className="mt-4 pt-4 border-t border-stone-100 flex justify-around text-center">
              <div>
                <p className="text-base font-semibold text-stone-800">
                  {Object.values(history).filter(v => v.length > 0).length}
                </p>
                <p className="text-[10px] text-stone-400 tracking-wide mt-0.5">총 운동일</p>
              </div>
              <div>
                <p className="text-base font-semibold text-orange-500">{streak}</p>
                <p className="text-[10px] text-stone-400 tracking-wide mt-0.5">연속 달성</p>
              </div>
              <div>
                <p className="text-base font-semibold text-stone-800">
                  {Object.values(history).reduce((acc, v) => acc + v.length, 0)}
                </p>
                <p className="text-[10px] text-stone-400 tracking-wide mt-0.5">총 완료 동작</p>
              </div>
            </div>

            <button onClick={() => setShowCalendar(false)} className="w-full mt-4 py-2 text-stone-300 text-xs tracking-widest">
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 루틴 모달 */}
      {showRoutineModal && (
        <div className="fixed inset-0 bg-black/30 z-30 flex items-end" onClick={() => setShowRoutineModal(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5 pb-10" onClick={e => e.stopPropagation()}>
            <div className="w-8 h-0.5 bg-stone-200 rounded-full mx-auto mb-5" />
            <h2 className="text-sm font-semibold text-stone-700 mb-1 tracking-wide">루틴 선택</h2>
            <p className="text-[11px] text-stone-400 mb-4 tracking-wide">나에게 맞는 흐름을 선택해보세요</p>

            {routines.map(r => {
              const isSelected = selectedRoutineId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => selectRoutine(r.id)}
                  className={`w-full text-left p-4 rounded-2xl border mb-3 transition-all ${
                    isSelected ? 'border-green-600 bg-green-50' : 'border-stone-200 bg-white active:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-stone-700 tracking-wide">{r.name}</p>
                    {isSelected && <span className="text-green-700 text-xs tracking-wide">선택됨</span>}
                  </div>
                  <p className="text-[11px] text-stone-400 mb-3 tracking-wide">{r.description}</p>
                  <div className="grid grid-cols-7 gap-1">
                    {[1,2,3,4,5,6,0].map(day => {
                      const cats = r.schedule[day] ?? [];
                      const isToday = day === today;
                      return (
                        <div key={day} className={`rounded-lg p-1.5 text-center ${isToday ? 'bg-green-700' : 'bg-stone-100'}`}>
                          <p className={`text-[10px] font-medium tracking-wide ${isToday ? 'text-white' : 'text-stone-500'}`}>{DAYS_KO[day]}</p>
                          <p className={`text-[9px] mt-0.5 tracking-wide ${isToday ? 'text-green-200' : 'text-stone-400'}`}>
                            {cats.length === 0 ? '휴식' : cats.map(id => categories.find(c => c.id === id)?.shortName).join('·')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}

            <button onClick={() => setShowRoutineModal(false)} className="w-full py-3 text-stone-300 text-xs tracking-widest">
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
