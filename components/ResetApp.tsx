'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { categories, videos, routines, DAYS_KO } from '@/lib/data';

const BRIGHTCOVE_BASE = 'https://players.brightcove.net/4714746360001/rklIcHxO1f_default/index.html?videoId=';

const getTodayKey = () => new Date().toISOString().split('T')[0];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return '좋은 아침이에요';
  if (h < 17) return '좋은 오후예요';
  return '좋은 저녁이에요';
};

const getDateLabel = () => {
  const now = new Date();
  return `${now.getMonth() + 1}월 ${now.getDate()}일 ${DAYS_KO[now.getDay()]}요일`;
};

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
  const firstDow = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const offset = (firstDow + 6) % 7;
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

  const checkAll = (ids: number[]) => {
    setHistory(prev => {
      const todayList = [...(prev[todayKey] ?? [])];
      const allChecked = ids.every(id => todayList.includes(id));
      const next = allChecked
        ? { ...prev, [todayKey]: todayList.filter(id => !ids.includes(id)) }
        : { ...prev, [todayKey]: [...new Set([...todayList, ...ids])] };
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
    ...(selectedRoutineId
      ? [{ id: 'today', shortName: '오늘' }]
      : []),
    ...categories.map(c => ({ id: c.id, shortName: c.shortName })),
    { id: 'all', shortName: '전체' },
  ];

  const calDays = getCalendarDays(calendarDate.year, calendarDate.month);
  const moveMonth = (dir: number) => {
    setCalendarDate(prev => {
      const d = new Date(prev.year, prev.month + dir, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#F1F5F9' }}>

      {/* Header */}
      <header className="flex-shrink-0 px-5 pt-5 pb-4" style={{ background: '#F1F5F9' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-barlow text-xs tracking-widest uppercase mb-1" style={{ color: '#64748B' }}>
              {getDateLabel()}
            </p>
            <h1 className="font-barlow text-xl font-bold leading-tight tracking-tight" style={{ color: '#0F172A' }}>상체 리셋</h1>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {streak > 0 && (
              <span className="font-barlow text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#FEF3C7', color: '#D97706' }}>
                🔥 {streak}일
              </span>
            )}
            <button
              onClick={() => setShowCalendar(true)}
              className="text-xs px-3 py-1.5 rounded-full font-medium tracking-wide border"
              style={{ background: '#FFFFFF', borderColor: '#E2E8F0', color: '#334155' }}
            >
              기록
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden gap-3 px-3 pb-3">

        {/* Left sidebar */}
        <aside className="flex-shrink-0 w-[4.5rem] flex flex-col rounded-2xl overflow-hidden" style={{ background: '#1E293B' }}>
          <div className="flex-1 overflow-y-auto flex flex-col py-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedCategory(item.id)}
                className="relative w-full text-left px-3 py-3 text-[11px] leading-snug tracking-wide transition-all"
                style={
                  selectedCategory === item.id
                    ? { background: '#2D3F55', color: '#FFFFFF', fontWeight: 600 }
                    : { color: '#64748B' }
                }
              >
                {selectedCategory === item.id && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full" style={{ background: '#6366F1' }} />
                )}
                {item.shortName}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowRoutineModal(true)}
            className="flex-shrink-0 w-full px-2 py-3 text-[10px] tracking-wide text-center leading-snug transition-all border-t"
            style={
              !selectedRoutineId
                ? { background: '#6366F1', color: '#FFFFFF', fontWeight: 600, borderColor: '#6366F1' }
                : { background: '#1E293B', color: '#64748B', borderColor: '#2D3F55' }
            }
          >
            {selectedRoutineId ? '루틴\n변경' : '루틴\n선택'}
          </button>
        </aside>

        {/* Swipe carousel area */}
        <main className="flex-1 overflow-hidden flex flex-col py-3">

          {/* 카드 위 정보 */}
          {filteredVideos.length > 0 && (() => {
            const filteredIds = filteredVideos.map(v => v.id);
            const allChecked = filteredIds.every(id => checkedToday.has(id));
            return (
              <div className="px-4 mb-2 flex-shrink-0">
                {selectedCategory === 'today' && currentRoutine && (
                  <>
                    <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: '#64748B' }}>
                      {currentRoutine.name} · {todayCategoryIds.map(id => categories.find(c => c.id === id)?.shortName).join(', ')}
                    </p>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold tracking-wide" style={{ color: '#0F172A' }}>
                        오늘 루틴 영상 {filteredVideos.length}개
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs tracking-wide" style={{ color: '#64748B' }}>
                          {todayCheckedCount}/{todayVideos.length} 완료
                        </p>
                        <button
                          onClick={() => checkAll(filteredIds)}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all"
                          style={allChecked
                            ? { borderColor: '#6366F1', color: '#6366F1', background: '#EEF2FF' }
                            : { borderColor: '#CBD5E1', color: '#64748B', background: 'transparent' }
                          }
                        >
                          {allChecked ? '전체 해제' : '전체 체크'}
                        </button>
                      </div>
                    </div>
                    <div className="w-full rounded-full h-0.5" style={{ background: '#E2E8F0' }}>
                      <div
                        className="h-0.5 rounded-full transition-all duration-500"
                        style={{
                          width: todayVideos.length ? `${(todayCheckedCount / todayVideos.length) * 100}%` : '0%',
                          background: '#6366F1'
                        }}
                      />
                    </div>
                  </>
                )}
                {selectedCategory !== 'today' && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold tracking-wide" style={{ color: '#0F172A' }}>
                      {selectedCategory === 'all'
                        ? `전체 영상 ${filteredVideos.length}개`
                        : `${categories.find(c => c.id === selectedCategory)?.shortName} 영상 ${filteredVideos.length}개`}
                    </p>
                    <button
                      onClick={() => checkAll(filteredIds)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all"
                      style={allChecked
                        ? { borderColor: '#6366F1', color: '#6366F1', background: '#EEF2FF' }
                        : { borderColor: '#CBD5E1', color: '#64748B', background: 'transparent' }
                      }
                    >
                      {allChecked ? '전체 해제' : '전체 체크'}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Empty state */}
          {filteredVideos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
              {!selectedRoutineId ? (
                <>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ background: '#EEF2FF' }}>
                    🌿
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-wide mb-1" style={{ color: '#0F172A' }}>루틴을 먼저 선택해주세요</p>
                    <p className="text-xs leading-relaxed tracking-wide" style={{ color: '#64748B' }}>
                      좌측 하단 <span className="font-semibold" style={{ color: '#6366F1' }}>루틴 선택</span> 버튼을 눌러<br />오늘 할 동작을 설정해보세요
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRoutineModal(true)}
                    className="px-8 py-3 rounded-2xl text-xs font-semibold tracking-wide"
                    style={{ background: '#6366F1', color: '#FFFFFF' }}
                  >
                    루틴 선택하기
                  </button>
                </>
              ) : isRestDay ? (
                <>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ background: '#EEF2FF' }}>
                    🌙
                  </div>
                  <p className="text-sm tracking-wide" style={{ color: '#64748B' }}>오늘은 몸이 쉬어가는 날이에요</p>
                </>
              ) : (
                <p className="text-sm tracking-wide" style={{ color: '#64748B' }}>동작이 없어요</p>
              )}
            </div>
          ) : (
            <>
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
                      className="snap-start flex-shrink-0 h-full flex flex-col rounded-3xl overflow-hidden transition-all"
                      style={{
                        width: 'calc(100% - 2rem)',
                        background: '#FFFFFF',
                        border: `1.5px solid ${isChecked ? '#A5B4FC' : '#E2E8F0'}`,
                        boxShadow: '0 2px 12px rgba(15,23,42,0.06)',
                      }}
                    >
                      {/* Title row */}
                      <div
                        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
                        style={{ background: isChecked ? '#EEF2FF' : 'transparent' }}
                      >
                        <button
                          onClick={() => toggleCheck(video.id)}
                          className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={
                            isChecked
                              ? { background: '#6366F1', borderColor: '#6366F1', color: '#fff' }
                              : { borderColor: '#CBD5E1' }
                          }
                        >
                          {isChecked && (
                            <svg className="w-3 h-3" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold truncate tracking-wide"
                            style={{ color: isChecked ? '#94A3B8' : '#0F172A', textDecoration: isChecked ? 'line-through' : 'none' }}
                          >
                            {video.title}
                          </p>
                          {(selectedCategory === 'all' || selectedCategory === 'today') && (
                            <p className="text-[10px] mt-0.5 tracking-widest uppercase" style={{ color: '#94A3B8' }}>
                              {cat?.shortName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Video */}
                      <div className="flex-1 min-h-0 px-3 pb-3">
                        <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ background: '#0F172A' }}>
                          {shouldRender ? (
                            <iframe
                              src={`${BRIGHTCOVE_BASE}${video.videoId}`}
                              className="absolute inset-0 w-full h-full"
                              allowFullScreen
                              allow="encrypted-media"
                              title={video.title}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs tracking-wide" style={{ color: '#475569' }}>로딩 중</span>
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
                      className="rounded-full transition-all duration-200"
                      style={{
                        width: i === activeIndex ? '1rem' : '0.375rem',
                        height: '0.375rem',
                        background: i === activeIndex ? '#6366F1' : '#CBD5E1',
                      }}
                    />
                  ))
                ) : (
                  <span className="text-[11px] tracking-wide" style={{ color: '#64748B' }}>
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
        <div className="fixed inset-0 z-40 flex items-end" style={{ background: 'rgba(15,23,42,0.5)' }}>
          <div className="w-full rounded-t-3xl px-6 py-10" style={{ background: '#FFFFFF' }}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: '#EEF2FF' }}>
                🌿
              </div>
              <p className="font-barlow text-xl font-bold tracking-tight mb-1" style={{ color: '#0F172A' }}>오늘 루틴 완료!</p>
              <p className="text-sm tracking-wide" style={{ color: '#64748B' }}>정말 수고했어요</p>
              {streak > 0 && (
                <p className="font-barlow text-sm font-semibold mt-3" style={{ color: '#D97706' }}>
                  🔥 {streak}일 연속 달성 중이에요
                </p>
              )}
            </div>
            <button
              onClick={() => setShowCompletion(false)}
              className="w-full mt-8 py-3.5 rounded-2xl text-sm font-semibold tracking-wide"
              style={{ background: '#6366F1', color: '#FFFFFF' }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 캘린더 모달 */}
      {showCalendar && (
        <div className="fixed inset-0 z-30 flex items-end" style={{ background: 'rgba(15,23,42,0.5)' }} onClick={() => setShowCalendar(false)}>
          <div className="w-full rounded-t-3xl p-5 pb-10" style={{ background: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
            <div className="w-8 h-0.5 rounded-full mx-auto mb-4" style={{ background: '#E2E8F0' }} />
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => moveMonth(-1)} className="text-lg px-2 py-1" style={{ color: '#64748B' }}>‹</button>
              <p className="text-sm font-semibold tracking-wide" style={{ color: '#0F172A' }}>
                {calendarDate.year}년 {calendarDate.month + 1}월
              </p>
              <button onClick={() => moveMonth(1)} className="text-lg px-2 py-1" style={{ color: '#64748B' }}>›</button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {['월','화','수','목','금','토','일'].map(d => (
                <p key={d} className="text-center text-[10px] py-1 tracking-wide" style={{ color: '#94A3B8' }}>{d}</p>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {calDays.map((date, i) => {
                if (!date) return <div key={i} />;
                const key = date.toISOString().split('T')[0];
                const hasDone = (history[key]?.length ?? 0) > 0;
                const isToday = key === todayKey;
                return (
                  <div key={key} className="flex flex-col items-center py-1">
                    <span
                      className="text-xs w-7 h-7 flex items-center justify-center rounded-full tracking-wide"
                      style={isToday ? { background: '#6366F1', color: '#FFFFFF', fontWeight: 600 } : { color: '#334155' }}
                    >
                      {date.getDate()}
                    </span>
                    {hasDone && (
                      <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: '#818CF8' }} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-5 pt-4 flex justify-around text-center" style={{ borderTop: '1px solid #E2E8F0' }}>
              <div>
                <p className="font-barlow text-xl font-bold" style={{ color: '#0F172A' }}>
                  {Object.values(history).filter(v => v.length > 0).length}
                </p>
                <p className="text-[10px] mt-0.5 tracking-wide" style={{ color: '#64748B' }}>총 운동일</p>
              </div>
              <div>
                <p className="font-barlow text-xl font-bold" style={{ color: '#D97706' }}>{streak}</p>
                <p className="text-[10px] mt-0.5 tracking-wide" style={{ color: '#64748B' }}>연속 달성</p>
              </div>
              <div>
                <p className="font-barlow text-xl font-bold" style={{ color: '#0F172A' }}>
                  {Object.values(history).reduce((acc, v) => acc + v.length, 0)}
                </p>
                <p className="text-[10px] mt-0.5 tracking-wide" style={{ color: '#64748B' }}>총 완료 동작</p>
              </div>
            </div>
            <button onClick={() => setShowCalendar(false)} className="w-full mt-4 py-2 text-xs tracking-widest" style={{ color: '#94A3B8' }}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 루틴 모달 */}
      {showRoutineModal && (
        <div className="fixed inset-0 z-30 flex items-end" style={{ background: 'rgba(15,23,42,0.5)' }} onClick={() => setShowRoutineModal(false)}>
          <div className="w-full rounded-t-3xl p-5 pb-10" style={{ background: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
            <div className="w-8 h-0.5 rounded-full mx-auto mb-5" style={{ background: '#E2E8F0' }} />
            <h2 className="font-barlow text-base font-bold tracking-tight mb-1" style={{ color: '#0F172A' }}>루틴 선택</h2>
            <p className="text-[11px] mb-4 tracking-wide" style={{ color: '#64748B' }}>나에게 맞는 흐름을 선택해보세요</p>

            {routines.map(r => {
              const isSelected = selectedRoutineId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => selectRoutine(r.id)}
                  className="w-full text-left p-4 rounded-2xl border mb-3 transition-all"
                  style={{
                    borderColor: isSelected ? '#6366F1' : '#E2E8F0',
                    background: isSelected ? '#EEF2FF' : '#F8FAFC',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold tracking-wide text-sm" style={{ color: '#0F172A' }}>{r.name}</p>
                    {isSelected && <span className="text-xs tracking-wide" style={{ color: '#6366F1' }}>선택됨</span>}
                  </div>
                  <p className="text-[11px] mb-3 tracking-wide" style={{ color: '#64748B' }}>{r.description}</p>
                  <div className="grid grid-cols-7 gap-1">
                    {[1,2,3,4,5,6,0].map(day => {
                      const cats = r.schedule[day] ?? [];
                      const isToday = day === today;
                      return (
                        <div
                          key={day}
                          className="rounded-lg p-1.5 text-center"
                          style={{ background: isToday ? '#6366F1' : '#F1F5F9' }}
                        >
                          <p className="text-[10px] font-semibold tracking-wide" style={{ color: isToday ? '#FFFFFF' : '#64748B' }}>{DAYS_KO[day]}</p>
                          <p className="text-[9px] mt-0.5 tracking-wide" style={{ color: isToday ? '#C7D2FE' : '#94A3B8' }}>
                            {cats.length === 0 ? '휴식' : cats.map(id => categories.find(c => c.id === id)?.shortName).join('·')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}
            <button onClick={() => setShowRoutineModal(false)} className="w-full py-3 text-xs tracking-widest" style={{ color: '#94A3B8' }}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
