'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { categories, videos, routines, DAYS_KO } from '@/lib/data';

const BRIGHTCOVE_BASE = 'https://players.brightcove.net/4714746360001/rklIcHxO1f_default/index.html?videoId=';

export default function ResetApp() {
  const [selectedCategory, setSelectedCategory] = useState<string>('today');
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [checkedVideos, setCheckedVideos] = useState<Set<number>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = new Date().getDay();

  useEffect(() => {
    const savedChecked = localStorage.getItem('reset-checked');
    if (savedChecked) setCheckedVideos(new Set(JSON.parse(savedChecked)));
    const savedRoutine = localStorage.getItem('reset-routine');
    if (savedRoutine) setSelectedRoutineId(savedRoutine);
  }, []);

  // 카테고리 바뀔 때 스크롤 리셋
  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  }, [selectedCategory]);

  const toggleCheck = (id: number) => {
    setCheckedVideos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('reset-checked', JSON.stringify([...next]));
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
    const cardWidth = el.offsetWidth - 32; // 카드 너비 (px-4 양쪽)
    const index = Math.round(el.scrollLeft / (cardWidth + 12)); // gap-3 = 12px
    setActiveIndex(index);
  }, []);

  const currentRoutine = routines.find(r => r.id === selectedRoutineId);
  const todayCategoryIds: string[] = currentRoutine?.schedule[today] ?? [];
  const isRestDay = !!selectedRoutineId && todayCategoryIds.length === 0;

  const todayVideos = videos.filter(v => todayCategoryIds.includes(v.category));
  const todayCheckedCount = todayVideos.filter(v => checkedVideos.has(v.id)).length;

  const filteredVideos =
    selectedCategory === 'all'   ? videos :
    selectedCategory === 'today' ? todayVideos :
    videos.filter(v => v.category === selectedCategory);

  const navItems = [
    ...(selectedRoutineId && !isRestDay
      ? [{ id: 'today', shortName: '오늘', count: todayVideos.length }]
      : []),
    ...categories.map(c => ({ id: c.id, shortName: c.shortName, count: videos.filter(v => v.category === c.id).length })),
    { id: 'all', shortName: '전체', count: videos.length },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-stone-50">

      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-stone-200 px-5 py-4">
        <h1 className="text-base font-semibold tracking-wide text-stone-800">상체 리셋</h1>
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
                <span className="block">{item.shortName}</span>
                <span className="block text-[9px] mt-0.5 text-stone-300">{item.count}</span>
              </button>
            ))}
          </div>
          {/* Routine button */}
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

          {/* Empty state */}
          {filteredVideos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
              {!selectedRoutineId ? (
                <>
                  <p className="text-stone-600 text-sm font-medium tracking-wide">루틴을 먼저 선택해주세요</p>
                  <p className="text-stone-400 text-xs tracking-wide leading-relaxed">
                    좌측 하단 <span className="text-green-700 font-semibold">루틴 선택</span> 버튼을 눌러<br/>오늘 할 동작을 설정해보세요
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
                  const isChecked = checkedVideos.has(video.id);
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
                      {/* Title row */}
                      <div className={`flex items-center gap-3 px-4 py-3 flex-shrink-0 ${isChecked ? 'bg-green-50/50' : ''}`}>
                        <button
                          onClick={() => toggleCheck(video.id)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isChecked
                              ? 'bg-green-700 border-green-700 text-white'
                              : 'border-stone-300'
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

                      {/* Embedded video — fills remaining card height */}
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
                        i === activeIndex
                          ? 'w-4 h-1.5 bg-green-700'
                          : 'w-1.5 h-1.5 bg-stone-300'
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

      {/* Routine Modal */}
      {showRoutineModal && (
        <div
          className="fixed inset-0 bg-black/30 z-30 flex items-end"
          onClick={() => setShowRoutineModal(false)}
        >
          <div
            className="bg-white w-full rounded-t-3xl p-5 pb-10"
            onClick={e => e.stopPropagation()}
          >
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
                    isSelected
                      ? 'border-green-600 bg-green-50'
                      : 'border-stone-200 bg-white active:bg-stone-50'
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
                      const isRest = cats.length === 0;
                      return (
                        <div
                          key={day}
                          className={`rounded-lg p-1.5 text-center ${
                            isToday ? 'bg-green-700 text-white' : 'bg-stone-100'
                          }`}
                        >
                          <p className={`text-[10px] font-medium tracking-wide ${isToday ? 'text-white' : 'text-stone-500'}`}>{DAYS_KO[day]}</p>
                          <p className={`text-[9px] mt-0.5 tracking-wide ${isToday ? 'text-green-200' : 'text-stone-400'}`}>
                            {isRest
                              ? '휴식'
                              : cats.map(id => categories.find(c => c.id === id)?.shortName).join('·')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </button>
              );
            })}

            <button
              onClick={() => setShowRoutineModal(false)}
              className="w-full py-3 text-stone-300 text-xs tracking-widest"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
