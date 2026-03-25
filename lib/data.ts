export interface Video {
  id: number;
  category: string;
  title: string;
  videoId: string;
}

export interface Category {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  schedule: Record<number, string[]>; // 0=Sun ... 6=Sat
}

export const categories: Category[] = [
  { id: 'break',    name: '틈틈이 리셋',       shortName: '틈틈이',  emoji: '' },
  { id: 'spine',    name: '척추 리셋',          shortName: '척추',    emoji: '' },
  { id: 'rib',      name: '늑골 리셋',          shortName: '늑골',    emoji: '' },
  { id: 'shoulder', name: '견갑골·쇄골 리셋',   shortName: '견갑골',  emoji: '' },
  { id: 'pelvis',   name: '골반 리셋',          shortName: '골반',    emoji: '' },
  { id: 'hip',      name: '고관절 리셋',        shortName: '고관절',  emoji: '' },
  { id: 'foot',     name: '거골·발바닥 리셋',   shortName: '거골',    emoji: '' },
  { id: 'beauty',   name: '더 예뻐지는 리셋',   shortName: '더예뻐',  emoji: '' },
];

export const videos: Video[] = [
  // 틈틈이 리셋
  { id: 1,  category: 'break',    title: '틈틈이 손 & 팔 스트레칭',    videoId: '6324378041112' },
  { id: 2,  category: 'break',    title: '틈틈이 팔 리셋',              videoId: '6324376480112' },
  { id: 3,  category: 'break',    title: '틈틈이 골반 리셋',            videoId: '6324375568112' },
  { id: 4,  category: 'break',    title: '틈틈이 목 풀기',              videoId: '6324395708112' },
  { id: 5,  category: 'break',    title: '틈틈이 목뒤 스트레칭',        videoId: '6324397643112' },
  { id: 6,  category: 'break',    title: '틈틈이 목 옆 스트레칭',       videoId: '6324394933112' },
  { id: 7,  category: 'break',    title: '틈틈이 목 앞 스트레칭',       videoId: '6324397485112' },
  { id: 8,  category: 'break',    title: '틈틈이 머리 위치 리셋',       videoId: '6324395796112' },
  // 척추 리셋
  { id: 9,  category: 'spine',    title: '고양이 자세',                 videoId: '6324400845112' },
  { id: 10, category: 'spine',    title: '등 스트레칭',                 videoId: '6324395695112' },
  { id: 11, category: 'spine',    title: '척추 트위스트',               videoId: '6324394440112' },
  { id: 12, category: 'spine',    title: '사이드 스트레칭',             videoId: '6324400747112' },
  { id: 13, category: 'spine',    title: '쭉쭉 스트레칭',              videoId: '6324395593112' },
  { id: 14, category: 'spine',    title: '백조 스트레칭',               videoId: '6324400239112' },
  // 늑골 리셋
  { id: 15, category: 'rib',      title: '늑골 말기 스트레칭',          videoId: '6324395889112' },
  { id: 16, category: 'rib',      title: '흉추 말기 스트레칭',          videoId: '6324395410112' },
  { id: 17, category: 'rib',      title: '흉곽 트위스트 1',             videoId: '6324394514112' },
  { id: 18, category: 'rib',      title: '흉곽 트위스트 2',             videoId: '6324394204112' },
  { id: 19, category: 'rib',      title: '옆구리 풀기',                 videoId: '6324393227112' },
  { id: 20, category: 'rib',      title: '늑골 세우기',                 videoId: '6324394376112' },
  { id: 21, category: 'rib',      title: '늑골 트위스트',               videoId: '6324392915112' },
  { id: 22, category: 'rib',      title: '등 젖히기',                   videoId: '6324391518112' },
  { id: 23, category: 'rib',      title: '코어 암스',                   videoId: '6324392354112' },
  // 견갑골×쇄골 리셋
  { id: 24, category: 'shoulder', title: '견갑골 움직이기',             videoId: '6324391621112' },
  { id: 25, category: 'shoulder', title: '견갑골 스트레칭',             videoId: '6324400836112' },
  { id: 26, category: 'shoulder', title: '관음보살 자세',               videoId: '6324391676112' },
  { id: 27, category: 'shoulder', title: '돌리기 운동',                 videoId: '6324391270112' },
  { id: 28, category: 'shoulder', title: '견갑골 업다운',               videoId: '6324406543112' },
  { id: 29, category: 'shoulder', title: '속 근육 운동',                videoId: '6324398488112' },
  { id: 30, category: 'shoulder', title: '겨드랑이 밑 깨우기',          videoId: '6324388901112' },
  { id: 31, category: 'shoulder', title: '엎드려 속 근육 강화하기',     videoId: '6324398967112' },
  { id: 32, category: 'shoulder', title: '누워서 견갑골 움직이기',      videoId: '6324390159112' },
  // 골반 리셋
  { id: 33, category: 'pelvis',   title: '골반 움직이기',               videoId: '6324398761112' },
  { id: 34, category: 'pelvis',   title: '천골 조이기',                 videoId: '6324390743112' },
  // 고관절 리셋
  { id: 35, category: 'hip',      title: '엉덩이 스트레칭',             videoId: '6324390334112' },
  { id: 36, category: 'hip',      title: '허벅지 앞 스트레칭',          videoId: '6324389105112' },
  { id: 37, category: 'hip',      title: '허벅지 뒤 스트레칭',          videoId: '6324390234112' },
  { id: 38, category: 'hip',      title: '고관절 접었다 펴기',          videoId: '6324398647112' },
  // 거골×발바닥 리셋
  { id: 39, category: 'foot',     title: '발바닥 풀기',                 videoId: '6324388095112' },
  { id: 40, category: 'foot',     title: '발바닥 아치 운동',            videoId: '6324389663112' },
  { id: 41, category: 'foot',     title: '발목 리셋',                   videoId: '6324388487112' },
  { id: 42, category: 'foot',     title: '전신 연결 운동',              videoId: '6324381084112' },
  { id: 43, category: 'foot',     title: '중력 내 편 만들기 운동',      videoId: '6324389163112' },
  // 더 예뻐지는 상체 리셋
  { id: 44, category: 'beauty',   title: '얼굴 라인 다듬기',            videoId: '6324388481112' },
  { id: 45, category: 'beauty',   title: '목 길게 늘이기',              videoId: '6324382045112' },
  { id: 46, category: 'beauty',   title: '드러나는 쇄골 만들기',        videoId: '6324389732112' },
  { id: 47, category: 'beauty',   title: '탄탄한 팔뚝 만들기',          videoId: '6324381274112' },
  { id: 48, category: 'beauty',   title: '등 라인 만들기',              videoId: '6324379591112' },
  { id: 49, category: 'beauty',   title: '잘록한 허리 만들기',          videoId: '6324378859112' },
];

// 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
export const routines: Routine[] = [
  {
    id: 'daily',
    name: '매일 꾸준히',
    description: '매일 한 세트 이상, 부위를 나눠 꾸준히',
    schedule: {
      0: ['spine', 'rib'],
      1: ['break', 'spine'],
      2: ['rib'],
      3: ['shoulder'],
      4: ['pelvis', 'hip'],
      5: [],
      6: ['foot'],
    },
  },
  {
    id: 'full',
    name: '한번에 전신',
    description: '주 2회 집중적으로 전신 운동',
    schedule: {
      0: [],
      1: [],
      2: [],
      3: ['break', 'spine', 'rib', 'shoulder'],
      4: [],
      5: [],
      6: ['pelvis', 'hip', 'foot'],
    },
  },
];

export const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
