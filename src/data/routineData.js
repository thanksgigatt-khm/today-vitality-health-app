import pinkFull from "../assets/characters/pink_full.png";
import yellowFull from "../assets/characters/yellow_full.png";
import orangeFull from "../assets/characters/orange_full.png";
import mintFull from "../assets/characters/mint_full.png";
import blueFull from "../assets/characters/blue_full.png";
import purpleFull from "../assets/characters/purple_full.png";
import teamBanner from "../assets/characters/team_banner.png";

import pinkIcon from "../assets/characters/pink_icon.png";
import blueIcon from "../assets/characters/blue_icon.png";
import purpleIcon from "../assets/characters/purple_icon.png";
import mintIcon from "../assets/characters/mint_icon.png";
import yellowIcon from "../assets/characters/yellow_icon.png";
import orangeIcon from "../assets/characters/orange_icon.png";

export const appInfo = {
  title: "오늘 활력소 건강루틴",
  subtitle: "이번 주 목표는 완벽함보다 무너지지 않는 흐름 만들기",
  teamBanner,
};

export const days = [
  {
    id: "mon",
    label: "월",
    fullLabel: "월요일",
    theme: "pink",
    characterName: "핑크 활력",
    characterImage: pinkFull,
    characterIcon: pinkIcon,
    motto: "첫날은 크게 말고, 흐름만 잡기!",
    meals: [
      { time: "아침", emoji: "🍙", title: "작은 주먹밥 1개", desc: "밥 반공기 정도 + 물 300ml" },
      { time: "점심", emoji: "🥗", title: "샐러드 + 삶은 달걀 1개", desc: "고기/참치 조금 추가 가능" },
      { time: "퇴근 전 5~6시", emoji: "🥤", title: "단백질 쉐이크 1포", desc: "회사에서 먹고 집에 들어가기" },
      { time: "저녁", emoji: "🌙", title: "패스", desc: "아이들 밥은 아이들 식사, 내 식사는 이미 완료" },
    ],
    oil: "오일 쉬기",
  },
  {
    id: "tue",
    label: "화",
    fullLabel: "화요일",
    theme: "yellow",
    characterName: "옐로 활력",
    characterImage: yellowFull,
    characterIcon: yellowIcon,
    motto: "가벼운 아침으로 부담 줄이는 날",
    meals: [
      { time: "아침", emoji: "🍎", title: "과일 반 개 + 오일 1회분", desc: "물 300ml, 속 불편하면 오일은 식후/점심으로 이동" },
      { time: "점심", emoji: "🥗", title: "샐러드 + 삶은 달걀 1개", desc: "고기 조금으로 포만감 보강" },
      { time: "퇴근 전 5~6시", emoji: "🥤", title: "단백질 쉐이크 1포", desc: "저녁 폭주 방지용 핵심 루틴" },
      { time: "저녁", emoji: "🌙", title: "패스", desc: "너무 힘들면 오이/토마토/요거트 소량" },
    ],
    oil: "오일 O",
  },
  {
    id: "wed",
    label: "수",
    fullLabel: "수요일",
    theme: "blue",
    characterName: "블루 활력",
    characterImage: blueFull,
    characterIcon: blueIcon,
    motto: "중간 고비는 체크로 넘기기!",
    meals: [
      { time: "아침", emoji: "🍙", title: "작은 주먹밥 1개", desc: "물 300ml + 오일은 선택" },
      { time: "점심", emoji: "🥗", title: "샐러드 + 참치/고기 조금", desc: "계란 1개는 선택, 부담되면 빼기" },
      { time: "퇴근 전 5~6시", emoji: "🥤", title: "단백질 쉐이크 1포", desc: "집에 가기 전에 완료 체크" },
      { time: "저녁", emoji: "🌙", title: "패스", desc: "간보기는 딱 1번" },
    ],
    oil: "오일 선택",
  },
  {
    id: "thu",
    label: "목",
    fullLabel: "목요일",
    theme: "mint",
    characterName: "민트 활력",
    characterImage: mintFull,
    characterIcon: mintIcon,
    motto: "목요일은 단단하게, 배고픔을 미리 막기",
    meals: [
      { time: "아침", emoji: "🍙", title: "작은 주먹밥 1개", desc: "물 300ml" },
      { time: "점심", emoji: "🥗", title: "샐러드 + 삶은 달걀 1개 + 고기 조금", desc: "너무 배고프면 주먹밥 반 개 추가" },
      { time: "퇴근 전 5~6시", emoji: "🥤", title: "단백질 쉐이크 1포", desc: "마지막 식사처럼 천천히 마시기" },
      { time: "저녁", emoji: "🌙", title: "패스", desc: "서서 먹기 금지" },
    ],
    oil: "오일 쉬기",
  },
  {
    id: "fri",
    label: "금",
    fullLabel: "금요일",
    theme: "orange",
    characterName: "오렌지 활력",
    characterImage: orangeFull,
    characterIcon: orangeIcon,
    motto: "금요일까지 왔으면 이미 대성공!",
    meals: [
      { time: "아침", emoji: "🍎", title: "과일 반 개 + 오일 1회분", desc: "물 300ml" },
      { time: "점심", emoji: "🥗", title: "샐러드 + 삶은 달걀 1개", desc: "참치/고기 조금 추가" },
      { time: "퇴근 전 5~6시", emoji: "🥤", title: "단백질 쉐이크 1포", desc: "주말 전 흐름 지키기" },
      { time: "저녁", emoji: "🌙", title: "패스", desc: "주말 보상 폭식으로 넘기지 않기" },
    ],
    oil: "오일 O",
  },
  {
    id: "sat",
    label: "토",
    fullLabel: "토요일",
    theme: "purple",
    characterName: "퍼플 활력",
    characterImage: purpleFull,
    characterIcon: purpleIcon,
    motto: "주말은 무너지지 않게, 여유 있게!",
    meals: [
      { time: "아침", emoji: "🍎", title: "가벼운 아침", desc: "과일 반 개 또는 주먹밥 반~1개" },
      { time: "점심", emoji: "🍚", title: "가족식 가능", desc: "밥은 반공기 기준, 고기와 채소 먼저" },
      { time: "오후", emoji: "🥤", title: "쉐이크 선택", desc: "외식/간식 욕구가 크면 1포" },
      { time: "저녁", emoji: "🥗", title: "가볍게 마무리", desc: "샐러드/고기 조금/요거트 중 선택" },
    ],
    oil: "속 괜찮으면 선택",
  },
  {
    id: "sun",
    label: "일",
    fullLabel: "일요일",
    theme: "team",
    characterName: "풍성활력단",
    characterImage: teamBanner,
    characterIcon: teamBanner,
    motto: "다음 주를 준비하는 회복 루틴",
    meals: [
      { time: "아침", emoji: "💧", title: "물 300ml + 가벼운 식사", desc: "과일/주먹밥/요거트 중 선택" },
      { time: "점심", emoji: "🍚", title: "가족식 가능", desc: "천천히 먹고 과식만 피하기" },
      { time: "오후", emoji: "📝", title: "다음 주 준비", desc: "주먹밥 재료, 샐러드, 쉐이크 챙기기" },
      { time: "저녁", emoji: "🌙", title: "가볍게", desc: "월요일을 위해 너무 늦게 먹지 않기" },
    ],
    oil: "쉬어도 됨",
  },
];

export const checkItems = [
  "아침 루틴 완료",
  "점심 조절식 완료",
  "퇴근 전/오후 쉐이크 또는 방어식 완료",
  "물 1.5L 체크",
  "아이들 밥 차리며 집어먹지 않기",
  "간보기는 딱 1번만",
  "저녁 기준 지키기",
  "오늘 컨디션 메모 남기기",
];

export const waterItems = [
  { label: "아침", amount: "300ml" },
  { label: "오전", amount: "400ml" },
  { label: "점심 전후", amount: "300ml" },
  { label: "오후~퇴근 전", amount: "400ml" },
  { label: "집 도착 후", amount: "100~200ml" },
];

export const emergencyFoods = [
  "오이",
  "방울토마토",
  "따뜻한 물",
  "그릭요거트 몇 숟가락",
  "쉐이크 반 포",
];
