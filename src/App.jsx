import { useEffect, useMemo, useRef, useState } from "react";
import { toBlob, toPng } from "html-to-image";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Droplets,
  LogIn,
  LogOut,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Utensils,
  Users,
} from "lucide-react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import { defaultFourWeekDietDay, defaultFourWeekDietProgram } from "./data/fourWeekDietPlan";
import { appInfo, checkItems as healthCheckItems, days, emergencyFoods, waterItems as healthWaterItems } from "./data/routineData";
import "./styles.css";

const dayOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const healthProgramTypes = {
  routine: { id: "routine", label: "기본 건강루틴" },
  fourWeekDiet: { id: "fourWeekDiet", label: "4주 식단" },
};
const routineTypes = {
  health: {
    id: "health",
    label: "건강루틴",
    title: "오늘 활력소 건강루틴",
    diaryTitle: "오늘의 건강루틴",
    diaryFooterLabel: "오늘 건강루틴",
    eyebrow: "나만의 건강 체크 앱",
    journalLabel: "Daily wellness journal",
    dayTitle: "오늘의 건강루틴",
    checkTitle: "오늘 성공률",
    secondaryLabel: "물 목표",
    secondaryTitle: "나눠 마시기 체크",
    secondarySummary: "물 체크",
    secondaryFieldLabel: "물 목표",
    memoLabel: "오늘 메모",
    memoTitle: "배고픔·컨디션·실패 포인트 기록",
    memoPlaceholder: "예: 퇴근 후 배고픔 7/10, 아이들 밥 차릴 때 간보기 1번, 물은 1.2L 정도",
    supportLabel: "비상 보완식",
    supportTitle: "무리하지 않고 막는 선택지",
    finalText: "오늘도 흐름을 이어간 나를 칭찬해요",
    accentClass: "routine-health",
  },
  growth: {
    id: "growth",
    label: "성장루틴",
    title: "오늘 활력소 성장루틴",
    diaryTitle: "오늘의 성장루틴",
    diaryFooterLabel: "오늘 성장루틴",
    eyebrow: "작은 반복을 쌓는 성장 기록",
    journalLabel: "Daily growth journal",
    dayTitle: "오늘의 성장루틴",
    checkTitle: "오늘 성장률",
    secondaryLabel: "성장 체크",
    secondaryTitle: "작은 성장 미션 체크",
    secondarySummary: "성장 체크",
    secondaryFieldLabel: "학습 목표",
    memoLabel: "성장 메모",
    memoTitle: "배운 것·느낀 것·내일 계획 기록",
    memoPlaceholder: "예: 책 10쪽 읽음, 오늘 배운 것 한 줄 정리, 감사한 일 1개",
    supportLabel: "성장 아이디어",
    supportTitle: "오늘 바로 해볼 수 있는 작은 선택",
    finalText: "작은 반복이 오늘의 나를 자라게 했어요",
    accentClass: "routine-growth",
  },
};

const growthCheckItems = [
  "아침 성장 목표 1개 적기",
  "독서 10분 또는 강의 1개 듣기",
  "학습 20분 또는 복습하기",
  "오늘 배운 것 한 줄 정리",
  "감사/묵상/마음 정리 1분",
  "책상 정리 또는 내일 준비하기",
  "스마트폰 시간 지키기",
  "성장 메모 남기기",
];

const growthSecondaryItems = [
  { label: "목표", amount: "1개" },
  { label: "독서", amount: "10분" },
  { label: "학습", amount: "20분" },
  { label: "정리", amount: "1줄" },
  { label: "마음", amount: "1분" },
];

const growthIdeas = [
  "책 10쪽 읽기",
  "오늘 배운 것 한 줄 쓰기",
  "숙제/할 일 확인하기",
  "책상 정리하기",
  "감사한 일 1개 적기",
  "말씀·기도 또는 마음 정리 1분",
  "스마트폰 시간 지키기",
];

const growthRoutineTemplates = {
  mon: {
    morning: "오늘의 성장 목표 1개 적기",
    lunch: "독서 10분 또는 강의 1개 듣기",
    afternoon: "학습 20분 또는 복습하기",
    evening: "오늘 배운 것 한 줄 정리",
    closing: "감사한 일 1개 적고 내일 할 일 보기",
    waterGoal: "성장 미션 3개",
    goalText: "작은 반복이 나를 자라게 해요",
  },
  tue: {
    morning: "오늘 꼭 해낼 작은 공부 목표 정하기",
    lunch: "책 10쪽 읽기 또는 좋은 문장 표시하기",
    afternoon: "배운 내용 3줄 복습하기",
    evening: "책상 정리하고 오늘의 배움 남기기",
    closing: "마음 정리 1분과 내일 계획 1개",
    waterGoal: "성장 미션 3개",
    goalText: "조금씩 해도 쌓이면 달라져요",
  },
  wed: {
    morning: "오늘 배우고 싶은 것 하나 고르기",
    lunch: "강의 1개 또는 독서 10분",
    afternoon: "어려웠던 부분 다시 보기",
    evening: "오늘 배운 것 한 줄 쓰기",
    closing: "감사/묵상/기도 또는 마음 정리",
    waterGoal: "성장 미션 3개",
    goalText: "중간에도 다시 시작할 수 있어요",
  },
  thu: {
    morning: "나를 키우는 질문 하나 적기",
    lunch: "책 10쪽 읽고 핵심 단어 적기",
    afternoon: "학습 20분 집중하기",
    evening: "오늘 잘한 습관 하나 칭찬하기",
    closing: "내일의 첫 행동 정하기",
    waterGoal: "성장 미션 3개",
    goalText: "오늘의 작은 집중이 내일의 힘이에요",
  },
  fri: {
    morning: "이번 주 성장 포인트 떠올리기",
    lunch: "독서/강의 10분으로 흐름 잇기",
    afternoon: "한 가지 과제 마무리하기",
    evening: "이번 주 배운 것 한 줄 정리",
    closing: "주말에도 지킬 작은 약속 정하기",
    waterGoal: "성장 미션 3개",
    goalText: "완벽보다 이어가는 힘을 선택해요",
  },
  sat: {
    morning: "오늘의 자유 성장 목표 정하기",
    lunch: "책, 숙제, 취미 중 하나 10분 하기",
    afternoon: "내 공간 또는 책상 정리하기",
    evening: "가족/나에게 감사한 일 1개 적기",
    closing: "스마트폰 시간 돌아보고 마음 정리",
    waterGoal: "성장 미션 2개",
    goalText: "주말에도 나를 돌보는 성장을 해요",
  },
  sun: {
    morning: "다음 주에 자라고 싶은 모습 적기",
    lunch: "가볍게 독서하거나 말씀/묵상하기",
    afternoon: "다음 주 준비물과 할 일 확인하기",
    evening: "이번 주 배운 것 3가지 돌아보기",
    closing: "내일의 첫 목표를 작게 정하기",
    waterGoal: "성장 미션 2개",
    goalText: "새 주를 위한 마음과 책상을 정리해요",
  },
};

function getTodayId() {
  const jsDay = new Date().getDay();
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][jsDay] || "mon";
}

function normalizeMap(value) {
  return value && typeof value === "object" ? value : {};
}

function adminEmails() {
  return (import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function activeCheckItems(routineType) {
  return routineType === "growth" ? growthCheckItems : healthCheckItems;
}

function activeSecondaryItems(routineType) {
  return routineType === "growth" ? growthSecondaryItems : healthWaterItems;
}

function activeSupportItems(routineType) {
  return routineType === "growth" ? growthIdeas : emergencyFoods;
}

function dietRecordCollectionRef(uid) {
  return collection(db, "userRoutineRecords", uid, "types", "health", "programs", "fourWeekDiet", "records");
}

function dietRecordDocRef(uid, date) {
  return doc(db, "userRoutineRecords", uid, "types", "health", "programs", "fourWeekDiet", "records", date);
}

function dietDayDocRef(uid, weekNumber, dayId) {
  return doc(db, "userRoutines", uid, "types", "health", "programs", "fourWeek", "weeks", String(weekNumber), "days", dayId);
}

function dietDayCollectionRef(uid, weekNumber) {
  return collection(db, "userRoutines", uid, "types", "health", "programs", "fourWeek", "weeks", String(weekNumber), "days");
}

function mergeDietDay(weekNumber, dayId, value) {
  const base = defaultFourWeekDietDay(weekNumber, dayId);
  const slotsById = new Map((value?.slots || []).map((slot) => [slot.id, slot]));
  return {
    ...base,
    ...(value || {}),
    slots: base.slots.map((slot) => ({
      ...slot,
      ...(slotsById.get(slot.id) || {}),
      enabled: slotsById.get(slot.id)?.enabled ?? slot.enabled ?? true,
    })),
  };
}

function dietCheckItemsFromDay(dietDay) {
  return (dietDay?.slots || [])
    .filter((slot) => slot.enabled !== false)
    .map((slot) => `${slot.time} - ${slot.title}: ${String(slot.content || "").split("\n")[0] || "식단 확인"}`);
}

function dietSlotSummary(dietDay, checks) {
  return (dietDay?.slots || [])
    .filter((slot) => slot.enabled !== false)
    .map((slot, index) => `${slot.time} ${slot.title}: ${checks[index] ? "완료" : "미완료"}`)
    .join(" / ");
}

function defaultRoutineForDay(day, routineType = "health") {
  if (routineType === "growth") {
    return {
      dayId: day.id,
      routineType,
      ...growthRoutineTemplates[day.id],
    };
  }

  return {
    dayId: day.id,
    routineType,
    morning: `${day.meals[0]?.title || ""} ${day.meals[0]?.desc || ""}`.trim(),
    lunch: `${day.meals[1]?.title || ""} ${day.meals[1]?.desc || ""}`.trim(),
    afternoon: `${day.meals[2]?.title || ""} ${day.meals[2]?.desc || ""}`.trim(),
    evening: `${day.meals[3]?.title || ""} ${day.meals[3]?.desc || ""}`.trim(),
    closing: "오늘 컨디션과 내일 흐름 짧게 정리하기",
    waterGoal: "1.5L",
    goalText: day.motto || "",
  };
}

function defaultRoutines(routineType = "health") {
  return Object.fromEntries(days.map((day) => [day.id, defaultRoutineForDay(day, routineType)]));
}

function mergeRoutine(dayId, routine, routineType = "health") {
  return {
    ...defaultRoutineForDay(days.find((day) => day.id === dayId) || days[0], routineType),
    ...(routine || {}),
    dayId,
    routineType,
  };
}

function formatDate(value) {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : null;
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(dateText) {
  const [year, month, day] = dateText.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, count) {
  const next = new Date(date);
  next.setDate(date.getDate() + count);
  return next;
}

function addWeeks(dateText, count) {
  return formatDate(addDays(parseDate(dateText), count * 7));
}

function getWeekStart(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : parseDate(value);
  const monday = new Date(date);
  const currentIndex = (date.getDay() + 6) % 7;
  monday.setHours(0, 0, 0, 0);
  monday.setDate(date.getDate() - currentIndex);
  return formatDate(monday);
}

function getWeekEnd(weekStart) {
  return formatDate(addDays(parseDate(weekStart), 6));
}

function dateForDayId(dayId, weekStart) {
  const monday = parseDate(weekStart);
  const target = new Date(monday);
  target.setDate(monday.getDate() + dayOrder.indexOf(dayId));
  return formatDate(target);
}

function getWeekKey(weekStart, routineType) {
  const date = parseDate(weekStart);
  const thursday = addDays(date, 3);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const week = Math.ceil((((thursday - yearStart) / 86400000) + yearStart.getDay() + 1) / 7);
  return `${thursday.getFullYear()}-W${String(week).padStart(2, "0")}-${routineType}`;
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function formatTimestamp(value) {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : null;
  return date ? date.toISOString() : "";
}

function friendlyErrorMessage(error, fallback) {
  const message = error?.message || fallback;
  if (message?.includes("Missing or insufficient permissions")) {
    return `${message} Firestore rules에서 로그인 상태, blocked 여부, 저장 경로 권한을 확인해 주세요.`;
  }
  return message || fallback;
}

function checkedSummary(items, checks) {
  return items
    .map((item, index) => `${item}: ${checks[index] ? "완료" : "미완료"}`)
    .join(" / ");
}

function buildWeeklyRows(records, routineType, weekStart) {
  const items = activeCheckItems(routineType);
  const secondaryItems = activeSecondaryItems(routineType);
  const recordsByDate = new Map(records.map((record) => [record.date || record.id, record]));

  return days.map((day) => {
    const date = dateForDayId(day.id, weekStart);
    const record = recordsByDate.get(date) || {};
    const isDietRecord = record.programType === "fourWeekDiet";
    const dietItems = isDietRecord ? dietCheckItemsFromDay(record.dietDay || record.routine) : [];
    const rowItems = isDietRecord ? dietItems : items;
    const checks = normalizeMap(record.checks);
    const secondaryChecks = normalizeMap(record.waterChecks || record.waters);
    const completedCount = Number.isFinite(record.completedCount)
      ? record.completedCount
      : rowItems.filter((_, index) => checks[index]).length;
    const secondaryCount = Number.isFinite(record.waterCount)
      ? record.waterCount
      : secondaryItems.filter((_, index) => secondaryChecks[index]).length;
    const completionRate = Number.isFinite(record.completionRate)
      ? record.completionRate
      : Math.round((completedCount / Math.max(rowItems.length, 1)) * 100);

    return {
      date,
      dayId: day.id,
      dayLabel: day.fullLabel,
      routineType,
      programType: record.programType || "routine",
      weekNumber: record.weekNumber || "",
      completedCount,
      completionRate,
      secondaryCount,
      memo: record.memo || "",
      hasRecord: Boolean(record.date || record.id),
      checkSummary: isDietRecord ? dietSlotSummary(record.dietDay || record.routine, checks) : checkedSummary(items, checks),
    };
  });
}

function summarizeWeeklyRows(rows) {
  const totalCompleted = rows.reduce((sum, row) => sum + row.completedCount, 0);
  const totalSecondary = rows.reduce((sum, row) => sum + row.secondaryCount, 0);
  const averageRate = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.completionRate, 0) / rows.length)
    : 0;
  const bestDay = rows.reduce((best, row) => (row.completionRate > best.completionRate ? row : best), rows[0] || { completionRate: 0, dayLabel: "" });
  const lowestDay = rows.reduce((lowest, row) => (row.completionRate < lowest.completionRate ? row : lowest), rows[0] || { completionRate: 0, dayLabel: "" });
  const weeklyMemo = rows
    .filter((row) => row.memo)
    .map((row) => `${row.dayLabel}: ${row.memo}`)
    .join("\n");

  return {
    averageRate,
    totalCompleted,
    totalSecondary,
    bestDay,
    lowestDay,
    weeklyMemo,
  };
}

function buildWeeklyReportCsv(rows, summary, routineType, weekStart, weekEnd, userName) {
  const routineInfo = routineTypes[routineType] || routineTypes.health;
  const headerRows = [
    ["주간 리포트", `${weekStart} ~ ${weekEnd}`, routineInfo.label],
    ["사용자명", userName],
    ["평균 완료율", `${summary.averageRate}%`],
    ["총 체크 완료 수", summary.totalCompleted],
    [routineType === "growth" ? "총 성장 체크 수" : "총 물 체크 수", summary.totalSecondary],
    ["가장 잘한 날", `${summary.bestDay?.dayLabel || ""} ${summary.bestDay?.completionRate ?? 0}%`],
    ["가장 낮은 날", `${summary.lowestDay?.dayLabel || ""} ${summary.lowestDay?.completionRate ?? 0}%`],
    [],
    ["날짜", "요일", "루틴 유형", "체크 완료 수", "완료율", routineType === "growth" ? "성장 체크 수" : "물 체크 수", "메모", "체크항목"],
  ];
  const dayRows = rows.map((row) => [
    row.date,
    row.dayLabel,
    routineInfo.label,
    row.completedCount,
    `${row.completionRate}%`,
    row.secondaryCount,
    row.memo,
    row.checkSummary,
  ]);

  return [...headerRows, ...dayRows]
    .map((row) => row.map(csvValue).join(","))
    .join("\r\n");
}

function buildRoutineCsv(records, profilesByUid) {
  const headers = [
    "사용자명",
    "이메일",
    "routineType",
    "날짜",
    "요일",
    "weekStart",
    "weekEnd",
    "체크항목",
    "메모",
    "완료개수",
    "완료율",
    "updatedAt",
  ];

  const rows = records.map((record) => {
    const checks = normalizeMap(record.checks);
    const isDietRecord = record.programType === "fourWeekDiet";
    const items = isDietRecord ? dietCheckItemsFromDay(record.dietDay || record.routine) : activeCheckItems(record.routineType || "health");
    const day = days.find((item) => item.id === record.dayId);
    const profile = profilesByUid.get(record.uid);
    const completedCount = items.filter((_, index) => checks[index]).length;
    const completedRate = `${Math.round((completedCount / Math.max(items.length, 1)) * 100)}%`;

    return [
      record.displayName || profile?.displayName || "",
      record.email || profile?.email || "",
      record.programType === "fourWeekDiet" ? "health/fourWeekDiet" : (record.routineType || "health"),
      record.date || formatDate(record.updatedAt),
      day?.fullLabel || record.dayId || "",
      record.weekStart || "",
      record.weekEnd || "",
      checkedSummary(items, checks),
      record.memo || "",
      completedCount,
      completedRate,
      formatTimestamp(record.updatedAt),
    ];
  });

  return [headers, ...rows]
    .map((row) => row.map(csvValue).join(","))
    .join("\r\n");
}

function limitText(text, maxLength) {
  const normalized = String(text || "").trim();
  if (!normalized) return "";
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

function checkedItemsFromMap(items, checkedMap) {
  return items.filter((_, index) => checkedMap[index]).map((item) => limitText(item, 34));
}

function RoutineTypeTabs({ value, onChange, compact = false }) {
  return (
    <section className={`routineTypeTabs ${compact ? "compact" : ""}`} aria-label="루틴 타입 선택">
      {Object.values(routineTypes).map((type) => (
        <button
          type="button"
          key={type.id}
          className={value === type.id ? "active" : ""}
          onClick={() => onChange(type.id)}
        >
          {type.label}
        </button>
      ))}
    </section>
  );
}

function DiaryImageCard({
  checks,
  completedCount,
  dietWeekNumber,
  isDietProgram,
  memo,
  percent,
  routineType,
  selectedDate,
  selectedDietDay,
  selectedDay,
  selectedRoutine,
  userName,
  waterCount,
  waters,
}) {
  const routineInfo = routineTypes[routineType] || routineTypes.health;
  const items = isDietProgram ? dietCheckItemsFromDay(selectedDietDay) : activeCheckItems(routineType);
  const secondaryItems = isDietProgram ? [] : activeSecondaryItems(routineType);
  const checkedRoutineItems = checkedItemsFromMap(items, checks);
  const checkedSecondaryItems = secondaryItems.filter((_, index) => waters[index]);
  const memoText = limitText(memo, 180) || (routineType === "growth" ? "오늘 배운 것과 마음을 짧게 남겨보세요." : "오늘의 컨디션과 마음을 짧게 남겨보세요.");
  const diaryProfileSrc = routineType === "growth" ? "/growth-diary-profile.png" : "/health-diary-profile.png";
  const diaryProfileFallbackSrc = routineType === "growth" ? "/growth-main-image.png" : "/main-image.png";

  function handleDiaryProfileError(event) {
    const image = event.currentTarget;
    const fallbackStep = image.dataset.fallbackStep || "profile";
    if (fallbackStep === "profile") {
      image.dataset.fallbackStep = "character";
      image.src = selectedDay.characterImage;
      return;
    }

    if (fallbackStep === "character") {
      image.dataset.fallbackStep = "main";
      image.src = diaryProfileFallbackSrc;
    }
  }

  return (
    <article className={`diaryImageCard theme-${selectedDay.theme} ${routineInfo.accentClass}`}>
      <div className="diaryTape tapeOne" />
      <div className="diaryTape tapeTwo" />
      <div className="diaryStamp">
        <span>{selectedDate}</span>
        <strong>{selectedDay.fullLabel}</strong>
      </div>

      <header className="diaryHeader">
        <div>
          <p>{routineInfo.journalLabel}</p>
          <h1>{routineInfo.diaryTitle}</h1>
          <span>{userName || "나의 기록"}님의 다이어리 노트</span>
        </div>
        <div className="diaryCharacter">
          <img
            src={diaryProfileSrc}
            alt={`${routineInfo.label} 다이어리 프로필 이미지`}
            onError={handleDiaryProfileError}
          />
        </div>
      </header>

      <section className="diaryGoalNote">
        <span>{isDietProgram ? `4주 식단 · ${dietWeekNumber}주차` : "today's little promise"}</span>
        <strong>{isDietProgram ? `물 섭취 목표 ${selectedDietDay.totalDrink}` : (limitText(selectedRoutine.goalText, 54) || "오늘도 흐름을 이어가요.")}</strong>
      </section>

      <section className="diarySummary">
        <div>
          <strong>{completedCount}/{items.length}</strong>
          <span>체크 완료</span>
        </div>
        <div>
          <strong>{percent}%</strong>
          <span>완료율</span>
        </div>
        <div>
          <strong>{isDietProgram ? selectedDietDay.totalDrink : `${waterCount}/${secondaryItems.length}`}</strong>
          <span>{isDietProgram ? "음료 목표" : routineInfo.secondarySummary}</span>
        </div>
      </section>

      <section className="diaryPaperSection">
        <h2>checked routine</h2>
        <div className="diaryChecklist">
          {(checkedRoutineItems.length ? checkedRoutineItems : ["아직 체크 전이에요. 하나씩 천천히 시작해요."]).slice(0, 7).map((item) => (
            <div className="diaryCheckLine" key={item}>
              <span>{checkedRoutineItems.length ? "✓" : "·"}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="diarySplit">
        <div className="diaryMiniNote">
          <h2>{isDietProgram ? "drink goal" : (routineType === "growth" ? "growth check" : "water")}</h2>
          <p>{isDietProgram ? "총 음료 목표" : `${selectedRoutine.waterGoal} 목표`}</p>
          <strong>{isDietProgram ? selectedDietDay.totalDrink : (checkedSecondaryItems.length ? checkedSecondaryItems.map((item) => item.label).join(" · ") : `아직 ${routineInfo.secondarySummary} 전`)}</strong>
        </div>
        <div className="diaryMiniNote">
          <h2>{isDietProgram ? "diet flow" : (routineType === "growth" ? "growth flow" : "meal flow")}</h2>
          <p>{isDietProgram ? "완료한 시간별 식단" : "아침 · 점심 · 오후 · 저녁"}</p>
          <strong>{isDietProgram ? `${completedCount}/${items.length}개 완료` : limitText(selectedRoutine.closing || selectedRoutine.afternoon || selectedRoutine.evening, 46)}</strong>
        </div>
      </section>

      <section className="diaryMemo">
        <h2>memo</h2>
        <p>{memoText}</p>
      </section>

      <footer className="diaryFooter">
        <strong>{routineInfo.finalText}</strong>
        <span>{routineInfo.diaryFooterLabel} · saved with care</span>
      </footer>
    </article>
  );
}

function WeeklyReportImageCard({ routineType, rows, summary, weekStart, weekEnd, weeklyGoal, userName }) {
  const routineInfo = routineTypes[routineType] || routineTypes.health;

  return (
    <article className={`weeklyImageCard ${routineInfo.accentClass}`}>
      <div className="weeklyImageTape tapeOne" />
      <div className="weeklyImageTape tapeTwo" />
      <header className="weeklyImageHeader">
        <p>{routineType === "growth" ? "Weekly growth journal" : "Weekly wellness journal"}</p>
        <h1>{weekStart} ~ {weekEnd}<br />{routineInfo.dayTitle} 주간 리포트</h1>
        <span>{userName || "나"}님의 한 주 기록</span>
      </header>

      <section className="weeklyImageGoal">
        <span>weekly promise</span>
        <strong>{weeklyGoal || "이번 주도 작은 흐름을 이어갔어요."}</strong>
      </section>

      <section className="weeklyImageStats">
        <div><strong>{summary.averageRate}%</strong><span>평균 완료율</span></div>
        <div><strong>{summary.totalCompleted}</strong><span>총 체크</span></div>
        <div><strong>{summary.totalSecondary}</strong><span>{routineType === "growth" ? "성장 체크" : "물 체크"}</span></div>
      </section>

      <section className="weeklyImageTable">
        {rows.map((row) => (
          <div className="weeklyImageRow" key={row.date}>
            <span>{row.dayLabel}</span>
            <strong>{row.completionRate}%</strong>
            <p>{row.completedCount}개 완료 · {row.secondaryCount}개 체크</p>
          </div>
        ))}
      </section>

      <section className="weeklyImageMemo">
        <h2>week memo</h2>
        <p>{summary.weeklyMemo || "아직 남긴 메모가 없어요. 다음 주의 나에게 한 줄을 남겨보세요."}</p>
      </section>

      <footer className="weeklyImageFooter">
        <strong>{routineInfo.finalText}</strong>
        <span>{routineInfo.diaryFooterLabel} · weekly report</span>
      </footer>
    </article>
  );
}

function WeeklyReportPanel({
  loading,
  onClose,
  onDownloadCsv,
  onSaveImage,
  imageSaving,
  routineType,
  rows,
  summary,
  weekEnd,
  weekKey,
  weekStart,
}) {
  const routineInfo = routineTypes[routineType] || routineTypes.health;

  return (
    <section className="panel weeklyReportPanel">
      <div className="panelHead">
        <div>
          <p className="sectionLabel"><CalendarDays size={17} /> 주간 리포트</p>
          <h2>{weekStart} ~ {weekEnd} · {routineInfo.label}</h2>
          <p className="motto">{weekKey}</p>
        </div>
        <div className="adminActions">
          <button className="smallButton" onClick={onDownloadCsv} disabled={loading}>
            <Download size={16} /> CSV 다운로드
          </button>
          <button className="smallButton" onClick={onSaveImage} disabled={loading || imageSaving}>
            {imageSaving ? "저장 중..." : "주간 이미지 저장"}
          </button>
          <button className="smallButton subtleButton" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>

      <div className="weeklyStatsGrid">
        <article><strong>{summary.averageRate}%</strong><span>평균 완료율</span></article>
        <article><strong>{summary.totalCompleted}</strong><span>총 체크 완료 수</span></article>
        <article><strong>{summary.totalSecondary}</strong><span>{routineType === "growth" ? "총 성장 체크 수" : "총 물 체크 수"}</span></article>
        <article><strong>{summary.bestDay?.dayLabel || "-"}</strong><span>가장 잘한 날 {summary.bestDay?.completionRate ?? 0}%</span></article>
        <article><strong>{summary.lowestDay?.dayLabel || "-"}</strong><span>가장 낮은 날 {summary.lowestDay?.completionRate ?? 0}%</span></article>
      </div>

      <div className="weeklyTableWrap">
        <table className="weeklyTable">
          <thead>
            <tr>
              <th>날짜</th>
              <th>요일</th>
              <th>루틴 유형</th>
              <th>체크 완료 수</th>
              <th>완료율</th>
              <th>{routineType === "growth" ? "성장 체크 수" : "물 체크 수"}</th>
              <th>메모</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date}>
                <td>{row.date}</td>
                <td>{row.dayLabel}</td>
                <td>{routineInfo.label}</td>
                <td>{row.completedCount}</td>
                <td>{row.completionRate}%</td>
                <td>{row.secondaryCount}</td>
                <td>{row.memo || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

async function ensureDefaultRoutine(uid, routineType) {
  const daysRef = collection(db, "userRoutines", uid, "types", routineType, "days");
  const snapshot = await getDocs(daysRef);
  if (!snapshot.empty) return;

  const batch = writeBatch(db);
  if (routineType === "health") {
    const legacySnap = await getDocs(collection(db, "userRoutines", uid, "days"));
    if (!legacySnap.empty) {
      legacySnap.docs.forEach((routineDoc) => {
        batch.set(doc(db, "userRoutines", uid, "types", routineType, "days", routineDoc.id), {
          ...mergeRoutine(routineDoc.id, routineDoc.data(), routineType),
          routineType,
          migratedFromLegacy: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      return;
    }
  }

  days.forEach((day) => {
    batch.set(doc(db, "userRoutines", uid, "types", routineType, "days", day.id), {
      ...defaultRoutineForDay(day, routineType),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

function RoutineSettings({ dietProgram, routines, routineType, onChangeRoutineType, onClose, onSave, onSaveDietProgram }) {
  const routineInfo = routineTypes[routineType] || routineTypes.health;
  const [drafts, setDrafts] = useState(() => defaultRoutines(routineType));
  const [dietDrafts, setDietDrafts] = useState(() => defaultFourWeekDietProgram());
  const [dietWeek, setDietWeek] = useState(1);
  const [dietDayId, setDietDayId] = useState("mon");
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [saveErrorMessage, setSaveErrorMessage] = useState("");

  useEffect(() => {
    setDrafts(Object.fromEntries(days.map((day) => [day.id, mergeRoutine(day.id, routines[day.id], routineType)])));
    setIsDirty(false);
    setSavedMessage("");
    setSaveErrorMessage("");
  }, [routines, routineType]);

  useEffect(() => {
    setDietDrafts(dietProgram || defaultFourWeekDietProgram());
  }, [dietProgram]);

  function updateRoutine(dayId, field, value) {
    setIsDirty(true);
    setSavedMessage("");
    setSaveErrorMessage("");
    setDrafts((current) => ({
      ...current,
      [dayId]: {
        ...current[dayId],
        [field]: value,
      },
    }));
  }

  function updateDietDay(field, value) {
    setIsDirty(true);
    setSavedMessage("");
    setSaveErrorMessage("");
    setDietDrafts((current) => ({
      ...current,
      [dietWeek]: {
        ...current[dietWeek],
        [dietDayId]: {
          ...current[dietWeek][dietDayId],
          [field]: value,
        },
      },
    }));
  }

  function updateDietSlot(slotIndex, field, value) {
    setIsDirty(true);
    setSavedMessage("");
    setSaveErrorMessage("");
    setDietDrafts((current) => {
      const dayDraft = current[dietWeek][dietDayId];
      return {
        ...current,
        [dietWeek]: {
          ...current[dietWeek],
          [dietDayId]: {
            ...dayDraft,
            slots: dayDraft.slots.map((slot, index) => (
              index === slotIndex ? { ...slot, [field]: value } : slot
            )),
          },
        },
      };
    });
  }

  async function saveAll() {
    setSaving(true);
    setSavedMessage("");
    setSaveErrorMessage("");
    try {
      await onSave(drafts);
      setIsDirty(false);
      setSavedMessage("루틴이 저장됐어요.");
    } catch (error) {
      setSaveErrorMessage(`저장 실패: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setSaving(false);
    }
  }

  function resetToDefault() {
    setIsDirty(true);
    setSavedMessage("");
    setSaveErrorMessage("");
    setDrafts(defaultRoutines(routineType));
  }

  async function saveDietProgram() {
    setSaving(true);
    setSavedMessage("");
    setSaveErrorMessage("");
    try {
      await onSaveDietProgram(dietDrafts);
      setIsDirty(false);
      setSavedMessage("4주 식단이 저장됐어요.");
    } catch (error) {
      setSaveErrorMessage(`저장 실패: ${error.message || "알 수 없는 오류"}`);
    } finally {
      setSaving(false);
    }
  }

  function resetDietDayToDefault() {
    setIsDirty(true);
    setSavedMessage("");
    setSaveErrorMessage("");
    setDietDrafts((current) => ({
      ...current,
      [dietWeek]: {
        ...current[dietWeek],
        [dietDayId]: defaultFourWeekDietDay(dietWeek, dietDayId),
      },
    }));
  }

  function closeSettings() {
    if (isDirty && !confirm("저장되지 않은 변경사항이 있어요. 메인으로 돌아갈까요?")) return;
    onClose();
  }

  function changeSettingsRoutineType(nextType) {
    if (nextType === routineType) return;
    if (isDirty && !confirm("저장되지 않은 변경사항이 있어요. 루틴 타입을 바꿀까요?")) return;
    onChangeRoutineType(nextType);
  }

  return (
    <section className="panel routineSettings">
      <div className="panelHead">
        <div>
          <p className="sectionLabel"><Settings size={17} /> 내 루틴 설정</p>
          <h2>월~일 {routineInfo.label} 수정</h2>
        </div>
        <div className="routineSettingsActions">
          <button className="smallButton subtleButton" onClick={closeSettings} disabled={saving}>
            메인으로 돌아가기
          </button>
          <button className="smallButton" onClick={resetToDefault} disabled={saving}>
            기본 루틴으로 되돌리기
          </button>
          <button className="smallButton" onClick={saveAll} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      <RoutineTypeTabs value={routineType} onChange={changeSettingsRoutineType} compact />

      {savedMessage ? (
        <div className="routineSavedBanner">
          <p className="statusText successText">{savedMessage}</p>
          <button className="smallButton subtleButton" onClick={closeSettings} disabled={saving}>
            메인으로 돌아가기
          </button>
        </div>
      ) : null}
      {saveErrorMessage ? <p className="statusText errorText">{saveErrorMessage}</p> : null}

      <div className="routineEditorGrid">
        {days.map((day) => {
          const draft = drafts[day.id] || mergeRoutine(day.id, null, routineType);
          return (
            <article className="routineEditor" key={day.id}>
              <h3>{day.fullLabel}</h3>
              <label>오늘 목표 문구<input value={draft.goalText} onChange={(event) => updateRoutine(day.id, "goalText", event.target.value)} /></label>
              <label>아침<input value={draft.morning} onChange={(event) => updateRoutine(day.id, "morning", event.target.value)} /></label>
              <label>점심/틈새<input value={draft.lunch} onChange={(event) => updateRoutine(day.id, "lunch", event.target.value)} /></label>
              <label>오후/퇴근 전<input value={draft.afternoon} onChange={(event) => updateRoutine(day.id, "afternoon", event.target.value)} /></label>
              <label>저녁<input value={draft.evening} onChange={(event) => updateRoutine(day.id, "evening", event.target.value)} /></label>
              <label>마무리<input value={draft.closing || ""} onChange={(event) => updateRoutine(day.id, "closing", event.target.value)} /></label>
              <label>{routineInfo.secondaryFieldLabel}<input value={draft.waterGoal} onChange={(event) => updateRoutine(day.id, "waterGoal", event.target.value)} /></label>
            </article>
          );
        })}
      </div>

      {routineType === "health" ? (
        <section className="dietSettingsBlock">
          <div className="panelHead">
            <div>
              <p className="sectionLabel"><Utensils size={17} /> 4주 식단</p>
              <h2>주차·요일별 식단 체크리스트</h2>
              <p className="motto">총 음료 목표와 6개 시간대 항목을 직접 수정할 수 있어요.</p>
            </div>
            <div className="routineSettingsActions">
              <button className="smallButton subtleButton" onClick={resetDietDayToDefault} disabled={saving}>
                선택 요일 기본값
              </button>
              <button className="smallButton" onClick={saveDietProgram} disabled={saving}>
                {saving ? "저장 중..." : "4주 식단 저장"}
              </button>
            </div>
          </div>

          <div className="dietPicker">
            {[1, 2, 3, 4].map((weekNumber) => (
              <button
                type="button"
                key={weekNumber}
                className={dietWeek === weekNumber ? "active" : ""}
                onClick={() => setDietWeek(weekNumber)}
              >
                {weekNumber}주차
              </button>
            ))}
          </div>

          <div className="dietPicker dayPicker">
            {days.map((day) => (
              <button
                type="button"
                key={day.id}
                className={dietDayId === day.id ? "active" : ""}
                onClick={() => setDietDayId(day.id)}
              >
                {day.label}
              </button>
            ))}
          </div>

          {(() => {
            const dietDay = dietDrafts[dietWeek]?.[dietDayId] || defaultFourWeekDietDay(dietWeek, dietDayId);
            return (
              <article className="routineEditor dietEditor">
                <h3>{dietWeek}주차 · {days.find((day) => day.id === dietDayId)?.fullLabel}</h3>
                <label>총 음료 목표<input value={dietDay.totalDrink || ""} onChange={(event) => updateDietDay("totalDrink", event.target.value)} /></label>
                <div className="dietSlotEditorGrid">
                  {dietDay.slots.map((slot, index) => (
                    <div className="dietSlotEditor" key={slot.id}>
                      <label className="checkboxLabel">
                        <input
                          type="checkbox"
                          checked={slot.enabled !== false}
                          onChange={(event) => updateDietSlot(index, "enabled", event.target.checked)}
                        />
                        체크 항목 표시
                      </label>
                      <label>시간<input value={slot.time || ""} onChange={(event) => updateDietSlot(index, "time", event.target.value)} /></label>
                      <label>제목<input value={slot.title || ""} onChange={(event) => updateDietSlot(index, "title", event.target.value)} /></label>
                      <label>상세 식단 내용<textarea value={slot.content || ""} onChange={(event) => updateDietSlot(index, "content", event.target.value)} /></label>
                    </div>
                  ))}
                </div>
              </article>
            );
          })()}
        </section>
      ) : null}
    </section>
  );
}

function AdminPanel() {
  const [profiles, setProfiles] = useState([]);
  const [selectedUid, setSelectedUid] = useState("");
  const [adminRoutineType, setAdminRoutineType] = useState("health");
  const [selectedRoutines, setSelectedRoutines] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [adminWeekStart, setAdminWeekStart] = useState(() => getWeekStart());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const profilesByUid = useMemo(
    () => new Map(profiles.map((profile) => [profile.uid, profile])),
    [profiles]
  );

  async function loadProfiles() {
    setLoading(true);
    setError("");
    try {
      const profilesSnap = await getDocs(query(collection(db, "userProfiles"), orderBy("updatedAt", "desc")));
      const nextProfiles = profilesSnap.docs.map((profileDoc) => ({ id: profileDoc.id, ...profileDoc.data() }));
      setProfiles(nextProfiles);
      setSelectedUid((uid) => uid || nextProfiles[0]?.uid || "");
    } catch (adminError) {
      setError(friendlyErrorMessage(adminError, "관리자 데이터를 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  async function updateUserStatus(uid, status) {
    setError("");

    try {
      const nextData = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === "approved") {
        nextData.approvedAt = serverTimestamp();
        nextData.approvedBy = auth.currentUser?.email || "";
      }

      await updateDoc(doc(db, "userProfiles", uid), nextData);
      await loadProfiles();
      if (selectedUid === uid) {
        await loadUserDetails(uid);
      }
    } catch (statusError) {
      setError(friendlyErrorMessage(statusError, "사용자 상태를 변경하지 못했습니다."));
    }
  }

  async function loadUserDetails(uid) {
    if (!uid) return;
    setError("");
    try {
      const [routinesSnap, recordsSnap, legacyRecordsSnap, dietRecordsSnap] = await Promise.all([
        getDocs(collection(db, "userRoutines", uid, "types", adminRoutineType, "days")),
        getDocs(query(collection(db, "userRoutineRecords", uid, "types", adminRoutineType, "records"), orderBy("date", "desc"))),
        adminRoutineType === "health"
          ? getDocs(query(collection(db, "userRoutineRecords", uid, "records"), orderBy("date", "desc")))
          : Promise.resolve({ docs: [] }),
        adminRoutineType === "health"
          ? getDocs(query(collection(db, "userRoutineRecords", uid, "types", "health", "programs", "fourWeekDiet", "records"), orderBy("date", "desc")))
          : Promise.resolve({ docs: [] }),
      ]);
      setSelectedRoutines(routinesSnap.docs.map((routineDoc) => ({ id: routineDoc.id, routineType: adminRoutineType, ...routineDoc.data() })));
      setSelectedRecords(
        [
          ...recordsSnap.docs.map((recordDoc) => ({ id: recordDoc.id, routineType: adminRoutineType, ...recordDoc.data() })),
          ...legacyRecordsSnap.docs.map((recordDoc) => ({ id: `legacy-${recordDoc.id}`, routineType: "health", ...recordDoc.data() })),
          ...dietRecordsSnap.docs.map((recordDoc) => ({ id: `fourWeekDiet-${recordDoc.id}`, routineType: "health", programType: "fourWeekDiet", ...recordDoc.data() })),
        ]
          .filter((record) => record.weekStart === adminWeekStart)
      );
    } catch (detailsError) {
      setError(friendlyErrorMessage(detailsError, "사용자 상세 데이터를 불러오지 못했습니다."));
    }
  }

  async function downloadCsv() {
    setError("");
    try {
      const allRecords = [];
      await Promise.all(
        profiles.map(async (profile) => {
          await Promise.all(
            Object.keys(routineTypes).map(async (type) => {
              const recordsSnap = await getDocs(query(collection(db, "userRoutineRecords", profile.uid, "types", type, "records"), orderBy("date", "desc")));
              recordsSnap.docs.forEach((recordDoc) => {
                allRecords.push({ id: recordDoc.id, uid: profile.uid, routineType: type, ...recordDoc.data() });
              });
            })
          );
          const dietRecordsSnap = await getDocs(query(collection(db, "userRoutineRecords", profile.uid, "types", "health", "programs", "fourWeekDiet", "records"), orderBy("date", "desc")));
          dietRecordsSnap.docs.forEach((recordDoc) => {
            allRecords.push({ id: `fourWeekDiet-${recordDoc.id}`, uid: profile.uid, routineType: "health", programType: "fourWeekDiet", ...recordDoc.data() });
          });
          const legacyRecordsSnap = await getDocs(query(collection(db, "userRoutineRecords", profile.uid, "records"), orderBy("date", "desc")));
          legacyRecordsSnap.docs.forEach((recordDoc) => {
            allRecords.push({ id: `legacy-${recordDoc.id}`, uid: profile.uid, routineType: "health", ...recordDoc.data() });
          });
        })
      );

      if (allRecords.length === 0) {
        setError("다운로드할 루틴 기록이 없습니다.");
        return;
      }

      const csv = buildRoutineCsv(allRecords, profilesByUid);
      const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `routine-records-${formatDate(new Date())}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (csvError) {
      setError(friendlyErrorMessage(csvError, "CSV를 다운로드하지 못했습니다."));
    }
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    loadUserDetails(selectedUid);
  }, [selectedUid, adminWeekStart, adminRoutineType]);

  return (
    <section className="panel adminPanel">
      <div className="panelHead">
        <div>
          <p className="sectionLabel"><ShieldCheck size={17} /> 관리자 화면</p>
          <h2>사용자 루틴과 날짜별 기록</h2>
        </div>
        <div className="adminActions">
          <button className="smallButton" onClick={downloadCsv} disabled={loading || profiles.length === 0}>
            <Download size={16} /> CSV 다운로드
          </button>
          <button className="smallButton" onClick={loadProfiles} disabled={loading}>
            {loading ? "불러오는 중" : "새로고침"}
          </button>
        </div>
      </div>

      {error ? <p className="statusText errorText">{error}</p> : null}

      <RoutineTypeTabs value={adminRoutineType} onChange={setAdminRoutineType} compact />

      <section className="weekNavigator compact">
        <div>
          <span>관리자 조회 주간</span>
          <strong>{adminWeekStart} ~ {getWeekEnd(adminWeekStart)}</strong>
        </div>
        <div className="weekButtons">
          <button onClick={() => setAdminWeekStart((current) => addWeeks(current, -1))}>지난주</button>
          <button className="currentWeekButton" onClick={() => setAdminWeekStart(getWeekStart())}>이번 주</button>
          <button onClick={() => setAdminWeekStart((current) => addWeeks(current, 1))}>다음주</button>
        </div>
      </section>

      <div className="adminGrid">
        <div className="adminList">
          <h3><Users size={17} /> 사용자 목록</h3>
          {profiles.length === 0 && !loading ? <p className="statusText">아직 저장된 사용자가 없습니다.</p> : null}
          {profiles.map((profile) => (
            <button
              key={profile.uid}
              className={`userRow ${profile.uid === selectedUid ? "active" : ""}`}
              onClick={() => setSelectedUid(profile.uid)}
            >
              <strong>{profile.displayName || "이름 없음"}</strong>
              <span>{profile.email}</span>
              <span className={`statusBadge ${profile.status || "active"}`}>{profile.status || "active"}</span>
              <div className="approvalActions">
                {(profile.status || "active") === "pending" ? (
                  <button type="button" onClick={(event) => { event.stopPropagation(); updateUserStatus(profile.uid, "approved"); }}>
                    승인
                  </button>
                ) : null}
                {(profile.status || "active") === "blocked" ? (
                  <button type="button" onClick={(event) => { event.stopPropagation(); updateUserStatus(profile.uid, "active"); }}>
                    활성화
                  </button>
                ) : (
                  <button type="button" onClick={(event) => { event.stopPropagation(); updateUserStatus(profile.uid, "blocked"); }}>
                    차단
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="adminRecords">
          <h3>사용자 루틴</h3>
          <div className="adminRoutineList">
            {selectedRoutines.map((routine) => {
              const day = days.find((item) => item.id === routine.dayId);
              const info = routineTypes[routine.routineType || adminRoutineType] || routineTypes.health;
              return (
                <article className="recordCard" key={routine.dayId}>
                  <strong>{day?.fullLabel || routine.dayId} · {info.label}</strong>
                  <p>{routine.goalText}</p>
                  <p>아침: {routine.morning}</p>
                  <p>점심: {routine.lunch}</p>
                  <p>오후: {routine.afternoon}</p>
                  <p>저녁: {routine.evening}</p>
                  <p>마무리: {routine.closing}</p>
                  <p>{info.secondaryFieldLabel}: {routine.waterGoal}</p>
                </article>
              );
            })}
          </div>

          <h3>날짜별 기록</h3>
          {selectedRecords.length === 0 ? <p className="statusText">선택한 사용자의 기록이 없습니다.</p> : null}
          {selectedRecords.map((record) => {
            const day = days.find((item) => item.id === record.dayId);
            const isDietRecord = record.programType === "fourWeekDiet";
            const items = isDietRecord ? dietCheckItemsFromDay(record.dietDay || record.routine) : activeCheckItems(record.routineType || adminRoutineType);
            const secondaryItems = activeSecondaryItems(record.routineType || adminRoutineType);
            const info = routineTypes[record.routineType || adminRoutineType] || routineTypes.health;
            return (
              <article className="recordCard" key={record.id}>
                <div>
                  <strong>{record.date} · {day?.fullLabel || record.dayId} · {isDietRecord ? `4주 식단 ${record.weekNumber || ""}주차` : info.label}</strong>
                  <span>{record.email}</span>
                </div>
                <p>체크 {record.completedCount || 0}/{items.length}</p>
                <p>{isDietRecord ? `총 음료 목표 ${record.totalDrinkTarget || ""}` : `${info.secondarySummary} ${record.waterCount || 0}/${secondaryItems.length}`}</p>
                {record.memo ? <p className="memoPreview">{record.memo}</p> : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function App() {
  const diaryRef = useRef(null);
  const weeklyReportRef = useRef(null);
  const recordMessageTimerRef = useRef(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [routineType, setRoutineType] = useState("health");
  const [healthProgram, setHealthProgram] = useState("routine");
  const [dietWeekNumber, setDietWeekNumber] = useState(1);
  const [selectedDayId, setSelectedDayId] = useState(getTodayId);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getWeekStart());
  const [routines, setRoutines] = useState(() => defaultRoutines("health"));
  const [dietProgram, setDietProgram] = useState(() => defaultFourWeekDietProgram());
  const [checks, setChecks] = useState({});
  const [waters, setWaters] = useState({});
  const [memo, setMemo] = useState("");
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordSaving, setRecordSaving] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [recordSaveMessage, setRecordSaveMessage] = useState("");
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [weeklyRecords, setWeeklyRecords] = useState([]);
  const [weeklyReportLoading, setWeeklyReportLoading] = useState(false);
  const [weeklyImageSaving, setWeeklyImageSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [routineNotice, setRoutineNotice] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const selectedDay = useMemo(
    () => days.find((day) => day.id === selectedDayId) || days[0],
    [selectedDayId]
  );
  const selectedRoutine = useMemo(
    () => mergeRoutine(selectedDayId, routines[selectedDayId], routineType),
    [routines, routineType, selectedDayId]
  );
  const isDietProgram = routineType === "health" && healthProgram === "fourWeekDiet";
  const selectedDietDay = useMemo(
    () => mergeDietDay(dietWeekNumber, selectedDayId, dietProgram[dietWeekNumber]?.[selectedDayId]),
    [dietProgram, dietWeekNumber, selectedDayId]
  );
  const routineInfo = routineTypes[routineType] || routineTypes.health;
  const heroImageSrc = routineType === "growth" ? "/growth-main-image.png" : "/main-image.png";
  const heroImageAlt = routineType === "growth"
    ? "오늘 활력소 성장루틴 메인 이미지"
    : "오늘 활력소 건강루틴 메인 이미지";
  const currentCheckItems = isDietProgram ? dietCheckItemsFromDay(selectedDietDay) : activeCheckItems(routineType);
  const secondaryItems = isDietProgram ? [] : activeSecondaryItems(routineType);
  const supportItems = activeSupportItems(routineType);
  const selectedWeekEnd = useMemo(() => getWeekEnd(selectedWeekStart), [selectedWeekStart]);
  const selectedDate = useMemo(() => dateForDayId(selectedDayId, selectedWeekStart), [selectedDayId, selectedWeekStart]);
  const weekKey = useMemo(() => getWeekKey(selectedWeekStart, routineType), [routineType, selectedWeekStart]);
  const weeklyRows = useMemo(
    () => buildWeeklyRows(weeklyRecords, routineType, selectedWeekStart),
    [routineType, selectedWeekStart, weeklyRecords]
  );
  const weeklySummary = useMemo(() => summarizeWeeklyRows(weeklyRows), [weeklyRows]);
  const completedCount = currentCheckItems.filter((_, index) => checks[index]).length;
  const waterCount = secondaryItems.filter((_, index) => waters[index]).length;
  const percent = Math.round((completedCount / Math.max(currentCheckItems.length, 1)) * 100);
  const isAdmin = user && adminEmails().includes(user.email?.toLowerCase());
  const canUseApp = Boolean(user && (isAdmin || (profile && profile.status !== "blocked")));
  const userName = user?.displayName || profile?.displayName || user?.email || "나";

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setProfile(null);
        setChecks({});
        setWaters({});
        setMemo("");
        setHasUnsavedChanges(false);
        setPendingNavigation(null);
        setRecordSaveMessage("");
        setShowWeeklyReport(false);
        setWeeklyRecords([]);
        setRoutines(defaultRoutines(routineType));
        setDietProgram(defaultFourWeekDietProgram());
        setHealthProgram("routine");
        setShowAdmin(false);
        setShowSettings(false);
        return;
      }

      const isAdminEmail = adminEmails().includes(nextUser.email?.toLowerCase());
      const profileRef = doc(db, "userProfiles", nextUser.uid);
      const profileSnap = await getDoc(profileRef);
      const existingProfile = profileSnap.exists() ? profileSnap.data() : {};
      if (existingProfile.status === "blocked" && !isAdminEmail) {
        return;
      }
      const nextProfile = {
        uid: nextUser.uid,
        email: nextUser.email || "",
        displayName: nextUser.displayName || "",
        photoURL: nextUser.photoURL || "",
        role: isAdminEmail ? "admin" : existingProfile.role || "user",
        status: existingProfile.status === "blocked" ? "blocked" : existingProfile.status || "active",
        updatedAt: serverTimestamp(),
      };

      await setDoc(
        profileRef,
        nextProfile,
        { merge: true }
      );
    });
  }, []);

  useEffect(() => () => {
    if (recordMessageTimerRef.current) {
      clearTimeout(recordMessageTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    return onSnapshot(doc(db, "userProfiles", user.uid), (snapshot) => {
      setProfile(snapshot.exists() ? snapshot.data() : null);
    }, (error) => {
      setSaveError(friendlyErrorMessage(error, "사용자 상태를 불러오지 못했습니다."));
    });
  }, [user]);

  useEffect(() => {
    if (!canUseApp || !user) return undefined;

    ensureDefaultRoutine(user.uid, routineType).catch((error) => {
      setSaveError(friendlyErrorMessage(error, "개인 루틴 기본값을 만들지 못했습니다."));
    });

    return onSnapshot(collection(db, "userRoutines", user.uid, "types", routineType, "days"), (snapshot) => {
      const nextRoutines = defaultRoutines(routineType);
      snapshot.docs.forEach((routineDoc) => {
        nextRoutines[routineDoc.id] = mergeRoutine(routineDoc.id, routineDoc.data(), routineType);
      });
      setRoutines(nextRoutines);
    }, (error) => {
      setSaveError(friendlyErrorMessage(error, "개인 루틴을 불러오지 못했습니다."));
    });
  }, [canUseApp, routineType, user]);

  useEffect(() => {
    if (!canUseApp || !user || routineType !== "health") return undefined;

    let active = true;
    async function loadDietProgram() {
      const nextProgram = defaultFourWeekDietProgram();
      try {
        await Promise.all([1, 2, 3, 4].map(async (weekNumber) => {
          const snapshot = await getDocs(dietDayCollectionRef(user.uid, weekNumber));
          snapshot.docs.forEach((dietDoc) => {
            nextProgram[weekNumber][dietDoc.id] = mergeDietDay(weekNumber, dietDoc.id, dietDoc.data());
          });
        }));
        if (active) setDietProgram(nextProgram);
      } catch (error) {
        if (active) setSaveError(friendlyErrorMessage(error, "4주 식단을 불러오지 못했습니다."));
      }
    }

    loadDietProgram();

    return () => {
      active = false;
    };
  }, [canUseApp, routineType, user]);

  useEffect(() => {
    if (!canUseApp || !user) return undefined;

    let active = true;
    setRecordLoading(true);
    setSaveError("");
    setRecordSaveMessage("");
    setChecks({});
    setWaters({});
    setMemo("");
    setHasUnsavedChanges(false);

    async function loadRecord() {
      const recordPath = isDietProgram
        ? `userRoutineRecords/${user.uid}/types/health/programs/fourWeekDiet/records/${selectedDate}`
        : `userRoutineRecords/${user.uid}/types/${routineType}/records/${selectedDate}`;
      try {
        const snapshot = await getDoc(isDietProgram
          ? dietRecordDocRef(user.uid, selectedDate)
          : doc(db, "userRoutineRecords", user.uid, "types", routineType, "records", selectedDate));
        let data = snapshot.data();
        if (!snapshot.exists() && routineType === "health" && !isDietProgram) {
          const legacySnap = await getDoc(doc(db, "userRoutineRecords", user.uid, "records", selectedDate));
          data = legacySnap.data();
        }
        if (isDietProgram && data?.weekNumber && Number(data.weekNumber) !== Number(dietWeekNumber)) {
          data = null;
        }
        if (!active) return;
        setChecks(normalizeMap(data?.checks));
        setWaters(normalizeMap(data?.waterChecks || data?.waters));
        setMemo(data?.memo || "");
        setHasUnsavedChanges(false);
        setRecordLoading(false);
      } catch (error) {
        console.error("[daily-record] failed to load record", { path: recordPath, error });
        if (!active) return;
        setSaveError(friendlyErrorMessage(error, "기록을 불러오지 못했습니다."));
        setRecordLoading(false);
      }
    }

    loadRecord();

    return () => {
      active = false;
    };
  }, [canUseApp, dietWeekNumber, isDietProgram, routineType, selectedDate, user]);

  async function saveRoutineSettings(nextRoutines) {
    if (!canUseApp || !user) {
      throw new Error("승인된 로그인 사용자만 루틴을 저장할 수 있습니다.");
    }

    setRoutineNotice("");
    setSaveError("");

    const routinePaths = days.map((day) => `userRoutines/${user.uid}/types/${routineType}/days/${day.id}`);

    try {
      const batch = writeBatch(db);
      const mergedRoutines = {};
      console.info("[routine-editor] saving routines", {
        uid: user.uid,
        routineType,
        paths: routinePaths,
      });
      days.forEach((day) => {
        const routine = mergeRoutine(day.id, nextRoutines[day.id], routineType);
        mergedRoutines[day.id] = routine;
        batch.set(
          doc(db, "userRoutines", user.uid, "types", routineType, "days", day.id),
          {
            ...routine,
            routineType,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });
      await batch.commit();
      const latestSnap = await getDocs(collection(db, "userRoutines", user.uid, "types", routineType, "days"));
      const latestRoutines = defaultRoutines(routineType);
      latestSnap.docs.forEach((routineDoc) => {
        latestRoutines[routineDoc.id] = mergeRoutine(routineDoc.id, routineDoc.data(), routineType);
      });
      setRoutines(Object.keys(latestRoutines).length ? latestRoutines : mergedRoutines);
      setRoutineNotice("루틴이 저장됐어요.");
    } catch (error) {
      const message = friendlyErrorMessage(error, "루틴을 저장하지 못했습니다.");
      console.error("[routine-editor] failed to save routines", {
        uid: user.uid,
        routineType,
        paths: routinePaths,
        error,
      });
      setSaveError(`저장 실패: ${message}`);
      throw new Error(message);
    }
  }

  async function saveDietProgramSettings(nextDietProgram) {
    if (!canUseApp || !user) {
      throw new Error("로그인한 사용자만 4주 식단을 저장할 수 있습니다.");
    }

    setRoutineNotice("");
    setSaveError("");

    try {
      const batch = writeBatch(db);
      [1, 2, 3, 4].forEach((weekNumber) => {
        days.forEach((day) => {
          const dietDay = mergeDietDay(weekNumber, day.id, nextDietProgram[weekNumber]?.[day.id]);
          batch.set(
            dietDayDocRef(user.uid, weekNumber, day.id),
            {
              ...dietDay,
              weekNumber,
              dayId: day.id,
              programType: "fourWeekDiet",
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        });
      });
      await batch.commit();
      setDietProgram(nextDietProgram);
      setRoutineNotice("4주 식단이 저장됐어요.");
    } catch (error) {
      const message = friendlyErrorMessage(error, "4주 식단을 저장하지 못했습니다.");
      setSaveError(`저장 실패: ${message}`);
      throw new Error(message);
    }
  }

  async function saveRecord(nextValues = {}) {
    if (!canUseApp || !user) return false;

    const nextChecks = normalizeMap(nextValues.checks ?? checks);
    const nextWaters = normalizeMap(nextValues.waters ?? waters);
    const nextMemo = nextValues.memo ?? memo;
    const recordPath = isDietProgram
      ? `userRoutineRecords/${user.uid}/types/health/programs/fourWeekDiet/records/${selectedDate}`
      : `userRoutineRecords/${user.uid}/types/${routineType}/records/${selectedDate}`;

    setRecordSaving(true);
    setRecordSaveMessage("");
    setSaveError("");

    try {
      console.info("[daily-record] saving record", {
        uid: user.uid,
        routineType,
        path: recordPath,
        date: selectedDate,
      });
      const completed = currentCheckItems.filter((_, index) => nextChecks[index]).length;
      await setDoc(
        isDietProgram
          ? dietRecordDocRef(user.uid, selectedDate)
          : doc(db, "userRoutineRecords", user.uid, "types", routineType, "records", selectedDate),
        {
          uid: user.uid,
          routineType,
          programType: isDietProgram ? "fourWeekDiet" : "routine",
          weekNumber: isDietProgram ? dietWeekNumber : null,
          email: user.email || "",
          displayName: user.displayName || "",
          date: selectedDate,
          dayId: selectedDayId,
          weekStart: selectedWeekStart,
          weekEnd: selectedWeekEnd,
          routine: selectedRoutine,
          dietDay: isDietProgram ? selectedDietDay : null,
          checks: nextChecks,
          slotChecks: isDietProgram ? nextChecks : null,
          waterChecks: nextWaters,
          waterGoal: isDietProgram ? selectedDietDay.totalDrink : selectedRoutine.waterGoal,
          totalDrinkTarget: isDietProgram ? selectedDietDay.totalDrink : null,
          memo: nextMemo,
          completedCount: completed,
          waterCount: secondaryItems.filter((_, index) => nextWaters[index]).length,
          completionRate: Math.round((completed / Math.max(currentCheckItems.length, 1)) * 100),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setHasUnsavedChanges(false);
      showRecordMessage("저장됐어요.");
      return true;
    } catch (error) {
      const message = friendlyErrorMessage(error, "저장하지 못했습니다.");
      console.error("[daily-record] failed to save record", {
        uid: user.uid,
        routineType,
        path: recordPath,
        date: selectedDate,
        error,
      });
      setSaveError(`저장 실패: ${message}`);
      return false;
    } finally {
      setRecordSaving(false);
    }
  }

  async function loginWithGoogle() {
    setSaveError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setSaveError(friendlyErrorMessage(error, "Google 로그인에 실패했습니다."));
    }
  }

  async function logout() {
    await signOut(auth);
  }

  function markRecordDirty() {
    setHasUnsavedChanges(true);
    setRecordSaveMessage("");
    setSaveError("");
  }

  function requestNavigation(action) {
    if (!hasUnsavedChanges) {
      action();
      return;
    }

    setPendingNavigation({ action });
  }

  async function saveThenNavigate() {
    if (!pendingNavigation) return;
    const saved = await saveRecord();
    if (!saved) return;
    const action = pendingNavigation.action;
    setPendingNavigation(null);
    action();
  }

  function navigateWithoutSaving() {
    if (!pendingNavigation) return;
    const action = pendingNavigation.action;
    setPendingNavigation(null);
    setHasUnsavedChanges(false);
    setRecordSaveMessage("");
    action();
  }

  async function loadWeeklyRecords() {
    if (!canUseApp || !user) return [];
    const recordsPath = isDietProgram
      ? `userRoutineRecords/${user.uid}/types/health/programs/fourWeekDiet/records`
      : `userRoutineRecords/${user.uid}/types/${routineType}/records`;
    setWeeklyReportLoading(true);
    setSaveError("");

    try {
      const recordsSnap = await getDocs(query(
        isDietProgram ? dietRecordCollectionRef(user.uid) : collection(db, "userRoutineRecords", user.uid, "types", routineType, "records"),
        orderBy("date", "asc")
      ));
      const rows = recordsSnap.docs
        .map((recordDoc) => ({ id: recordDoc.id, ...recordDoc.data() }))
        .filter((record) => record.weekStart === selectedWeekStart)
        .filter((record) => !isDietProgram || Number(record.weekNumber) === Number(dietWeekNumber));
      setWeeklyRecords(rows);
      return rows;
    } catch (error) {
      console.error("[weekly-report] failed to load records", { path: recordsPath, routineType, weekStart: selectedWeekStart, error });
      setSaveError(friendlyErrorMessage(error, "주간 기록을 불러오지 못했습니다."));
      return [];
    } finally {
      setWeeklyReportLoading(false);
    }
  }

  async function openWeeklyReport() {
    if (hasUnsavedChanges) {
      const saved = await saveRecord();
      if (!saved) return;
    }
    await loadWeeklyRecords();
    setShowWeeklyReport(true);
  }

  function downloadWeeklyCsv() {
    const csv = buildWeeklyReportCsv(weeklyRows, weeklySummary, routineType, selectedWeekStart, selectedWeekEnd, userName);
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${routineType}-week-${weekKey.replace(`-${routineType}`, "")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function saveWeeklyImage() {
    setWeeklyImageSaving(true);
    try {
      if (hasUnsavedChanges) {
        const saved = await saveRecord();
        if (!saved) return;
        await loadWeeklyRecords();
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      if (!weeklyReportRef.current) {
        throw new Error("주간 리포트 이미지를 준비하지 못했습니다.");
      }

      const dataUrl = await toPng(weeklyReportRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: 1080,
        height: 1920,
        canvasWidth: 1080,
        canvasHeight: 1920,
        backgroundColor: routineType === "growth" ? "#f7fbff" : "#fff7f2",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${routineType}-week-${weekKey.replace(`-${routineType}`, "")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showRecordMessage("주간 이미지가 저장됐어요.");
    } catch (error) {
      setSaveError(friendlyErrorMessage(error, "주간 이미지를 저장하지 못했습니다."));
    } finally {
      setWeeklyImageSaving(false);
    }
  }

  function changeDay(dayId) {
    if (dayId === selectedDayId) return;
    requestNavigation(() => {
      setSelectedDayId(dayId);
      setShowWeeklyReport(false);
    });
  }

  function moveWeek(offset) {
    requestNavigation(() => {
      setSelectedWeekStart((current) => addWeeks(current, offset));
      setShowWeeklyReport(false);
    });
  }

  function goThisWeek() {
    requestNavigation(() => {
      setSelectedWeekStart(getWeekStart());
      setSelectedDayId(getTodayId());
      setShowWeeklyReport(false);
    });
  }

  function changeRoutineType(nextType) {
    if (!routineTypes[nextType]) return;
    if (nextType === routineType) return;
    requestNavigation(() => {
      setRoutineType(nextType);
      setHealthProgram("routine");
      setRoutines(defaultRoutines(nextType));
      setShowWeeklyReport(false);
      setRoutineNotice("");
      setSaveError("");
    });
  }

  function changeHealthProgram(nextProgram) {
    if (!healthProgramTypes[nextProgram] || nextProgram === healthProgram) return;
    requestNavigation(() => {
      setHealthProgram(nextProgram);
      setShowWeeklyReport(false);
      setSaveError("");
    });
  }

  function changeDietWeek(nextWeekNumber) {
    if (nextWeekNumber === dietWeekNumber) return;
    requestNavigation(() => {
      setDietWeekNumber(nextWeekNumber);
      setShowWeeklyReport(false);
    });
  }

  function toggleCheck(index) {
    const next = { ...checks, [index]: !checks[index] };
    setChecks(next);
    markRecordDirty();
  }

  function toggleWater(index) {
    const next = { ...waters, [index]: !waters[index] };
    setWaters(next);
    markRecordDirty();
  }

  function saveMemo(value) {
    setMemo(value);
    markRecordDirty();
  }

  function showRecordMessage(message) {
    setRecordSaveMessage(message);
    if (recordMessageTimerRef.current) {
      clearTimeout(recordMessageTimerRef.current);
    }
    recordMessageTimerRef.current = setTimeout(() => {
      setRecordSaveMessage("");
    }, 2000);
  }

  async function copyToday() {
    const dietText = isDietProgram
      ? `[${selectedDate} ${selectedDay.fullLabel} 4주 식단 · ${dietWeekNumber}주차]\n완료: ${completedCount}/${currentCheckItems.length}\n총 음료 목표: ${selectedDietDay.totalDrink}\n\n식단 체크\n${selectedDietDay.slots.filter((slot) => slot.enabled !== false).map((slot, index) => `- ${checks[index] ? "완료" : "미완료"} ${slot.time} ${slot.title}: ${slot.content}`).join("\n")}\n\n메모\n${memo || "없음"}`
      : "";
    const text = `[${selectedDate} ${selectedDay.fullLabel} ${routineInfo.label} 기록]\n완료: ${completedCount}/${currentCheckItems.length}\n${routineInfo.secondarySummary}: ${waterCount}/${secondaryItems.length}\n\n루틴\n- 아침: ${selectedRoutine.morning}\n- 점심/틈새: ${selectedRoutine.lunch}\n- 오후/퇴근 전: ${selectedRoutine.afternoon}\n- 저녁: ${selectedRoutine.evening}\n- 마무리: ${selectedRoutine.closing || "없음"}\n\n메모\n${memo || "없음"}`;
    try {
      await navigator.clipboard.writeText(isDietProgram ? dietText : text);
      showRecordMessage("텍스트 기록이 복사됐어요.");
    } catch (error) {
      setSaveError(friendlyErrorMessage(error, "텍스트 기록을 복사하지 못했습니다."));
    }
  }

  async function createDiaryPngDataUrl() {
    if (!diaryRef.current) {
      throw new Error("다이어리 이미지를 준비하지 못했습니다.");
    }

    return toPng(diaryRef.current, {
      cacheBust: true,
      pixelRatio: 1,
      width: 1080,
      height: 1920,
      canvasWidth: 1080,
      canvasHeight: 1920,
      backgroundColor: "#fff7f2",
    });
  }

  async function saveDiaryImage() {
    setImageSaving(true);
    try {
      const saved = await saveRecord();
      if (!saved) return;
      const dataUrl = await createDiaryPngDataUrl();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `today-routine-${selectedDate}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showRecordMessage("다이어리 이미지가 저장됐어요.");
    } catch (error) {
      setSaveError(friendlyErrorMessage(error, "다이어리 이미지를 저장하지 못했어요."));
    } finally {
      setImageSaving(false);
    }
  }

  async function copyDiaryImage() {
    if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
      alert("이 브라우저는 이미지 복사를 지원하지 않아요. '다이어리 이미지 저장'을 이용해 주세요.");
      return;
    }

    try {
      const blob = await toBlob(diaryRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: 1080,
        height: 1920,
        canvasWidth: 1080,
        canvasHeight: 1920,
      backgroundColor: "#fff7f2",
      });

      if (!blob) {
        throw new Error("이미지 데이터를 만들지 못했습니다.");
      }

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      alert("다이어리 이미지를 클립보드에 복사했어요.");
    } catch (error) {
      alert(error.message || "이미지 복사를 지원하지 않아 저장 기능을 이용해 주세요.");
    }
  }

  function resetDay() {
    if (!confirm("현재 날짜의 기록을 초기화할까요?")) return;
    setChecks({});
    setWaters({});
    setMemo("");
    markRecordDirty();
  }

  const dietMeals = selectedDietDay.slots.map((slot) => ({
    time: slot.time,
    emoji: slot.id.includes("drink") || slot.id === "wake" ? "💧" : "🍽️",
    title: slot.title,
    desc: slot.content,
  }));
  const routineMeals = [
    { time: "아침", emoji: routineType === "growth" ? "✍️" : "🍙", title: selectedRoutine.morning, desc: "" },
    { time: "점심/틈새", emoji: routineType === "growth" ? "📚" : "🥗", title: selectedRoutine.lunch, desc: "" },
    { time: "오후/퇴근 전", emoji: routineType === "growth" ? "📝" : "🥤", title: selectedRoutine.afternoon, desc: "" },
    { time: "저녁", emoji: routineType === "growth" ? "🌙" : "🌙", title: selectedRoutine.evening, desc: "" },
    { time: "마무리", emoji: routineType === "growth" ? "✨" : "🧡", title: selectedRoutine.closing, desc: "" },
  ];
  const meals = isDietProgram ? dietMeals : routineMeals;

  return (
    <div className={`app theme-${selectedDay.theme} ${routineInfo.accentClass}`}>
      <header className="hero">
        <div className="heroText">
          <p className="eyebrow"><Sparkles size={16} /> {routineInfo.eyebrow}</p>
          <h1>{routineInfo.title}</h1>
          <p>{appInfo.subtitle}</p>
          <div className="authBar">
            {!authReady ? (
              <span className="statusText">로그인 상태 확인 중</span>
            ) : user ? (
              <>
                {user.photoURL ? <img className="avatar" src={user.photoURL} alt="" /> : null}
                <span>{user.displayName || user.email}</span>
                {canUseApp ? (
                  <button className="secondaryButton" onClick={() => { setRoutineNotice(""); setShowSettings((value) => !value); }}>
                    <Settings size={16} /> 내 루틴 설정
                  </button>
                ) : null}
                {isAdmin ? (
                  <button className="secondaryButton" onClick={() => setShowAdmin((value) => !value)}>
                    <ShieldCheck size={16} /> 관리자
                  </button>
                ) : null}
                <button onClick={logout}><LogOut size={16} /> 로그아웃</button>
              </>
            ) : (
              <button onClick={loginWithGoogle}><LogIn size={16} /> Google로 로그인</button>
            )}
          </div>
          {saveError ? <p className="statusText errorText">{saveError}</p> : null}
        </div>
        <div className="heroImageWrap">
          <img src={heroImageSrc} alt={heroImageAlt} />
        </div>
      </header>

      <main className="container">
        {user && isAdmin && showAdmin ? <AdminPanel /> : null}
        {user && canUseApp && showSettings ? (
          <RoutineSettings
            dietProgram={dietProgram}
            routines={routines}
            routineType={routineType}
            onChangeRoutineType={changeRoutineType}
            onClose={() => setShowSettings(false)}
            onSave={saveRoutineSettings}
            onSaveDietProgram={saveDietProgramSettings}
          />
        ) : null}
        {routineNotice && !showSettings ? <p className="statusText successText mainNotice">{routineNotice}</p> : null}

        {!user ? (
          <section className="panel">
            <p className="sectionLabel"><LogIn size={17} /> 로그인이 필요합니다</p>
            <h2>Google 로그인 후 개인 루틴과 날짜별 기록을 저장할 수 있어요.</h2>
          </section>
        ) : null}

        {user && !canUseApp && profile?.status === "blocked" ? (
          <section className="panel accessPanel">
            <p className="sectionLabel"><ShieldCheck size={17} /> 계정 제한</p>
            <h2>사용이 제한된 계정입니다.</h2>
          </section>
        ) : null}

        {canUseApp ? (
          <>
        <RoutineTypeTabs value={routineType} onChange={changeRoutineType} />

        {routineType === "health" ? (
          <section className="programTabs" aria-label="건강루틴 프로그램 선택">
            {Object.values(healthProgramTypes).map((program) => (
              <button
                type="button"
                key={program.id}
                className={healthProgram === program.id ? "active" : ""}
                onClick={() => changeHealthProgram(program.id)}
              >
                {program.label}
              </button>
            ))}
          </section>
        ) : null}

        {isDietProgram ? (
          <section className="dietWeekTabs" aria-label="4주 식단 주차 선택">
            {[1, 2, 3, 4].map((weekNumber) => (
              <button
                type="button"
                key={weekNumber}
                className={dietWeekNumber === weekNumber ? "active" : ""}
                onClick={() => changeDietWeek(weekNumber)}
              >
                {weekNumber}주차
              </button>
            ))}
          </section>
        ) : null}

        <section className="weekNavigator">
          <div>
            <span>{selectedWeekStart === getWeekStart() ? "이번 주 기록" : "선택한 주 기록"}</span>
            <strong>{selectedWeekStart} ~ {selectedWeekEnd}</strong>
          </div>
          <div className="weekButtons">
            <button onClick={() => moveWeek(-1)}>지난주</button>
            <button className="currentWeekButton" onClick={goThisWeek}>이번 주</button>
            <button onClick={() => moveWeek(1)}>다음주</button>
          </div>
        </section>

        <section className="dayTabs">
          {days.map((day) => (
            <button
              key={day.id}
              className={`dayTab ${day.id === selectedDayId ? "active" : ""}`}
              onClick={() => changeDay(day.id)}
            >
              <img src={day.characterIcon} alt="" />
              <span>{day.label}</span>
            </button>
          ))}
        </section>

        <section className="todayCard glass">
          <div>
            <p className="sectionLabel"><CalendarDays size={17} /> {selectedDate} 루틴</p>
            <h2>{selectedDay.fullLabel} · {isDietProgram ? `4주 식단 ${dietWeekNumber}주차` : routineInfo.dayTitle}</h2>
            <p className="motto">"{isDietProgram ? "오늘 식단 흐름을 차분히 체크해요." : selectedRoutine.goalText}"</p>
          </div>
          <div className="oilBadge">{recordLoading ? "불러오는 중" : (isDietProgram ? selectedDietDay.totalDrink : selectedRoutine.waterGoal)}</div>
        </section>

        <section className={`recordSavePanel ${hasUnsavedChanges ? "dirty" : ""}`}>
          <div>
            <strong>{hasUnsavedChanges ? "저장되지 않은 변경사항이 있어요" : recordSaveMessage || "오늘 기록을 확인해 주세요"}</strong>
            <span>{selectedDate} · {routineInfo.label} · {recordLoading ? "불러오는 중" : "수동 저장"}</span>
          </div>
          <button onClick={openWeeklyReport} disabled={recordSaving || weeklyReportLoading}>
            {weeklyReportLoading ? "불러오는 중..." : "이번 주 정리 보기"}
          </button>
        </section>

        {showWeeklyReport ? (
          <WeeklyReportPanel
            loading={weeklyReportLoading}
            imageSaving={weeklyImageSaving}
            onClose={() => setShowWeeklyReport(false)}
            onDownloadCsv={downloadWeeklyCsv}
            onSaveImage={saveWeeklyImage}
            routineType={routineType}
            rows={weeklyRows}
            summary={weeklySummary}
            weekEnd={selectedWeekEnd}
            weekKey={weekKey}
            weekStart={selectedWeekStart}
          />
        ) : null}

        <section className="mealGrid">
          {meals.map((meal) => (
            <article className="mealCard" key={meal.time}>
              <div className="mealIcon">{meal.emoji}</div>
              <div>
                <p>{meal.time}</p>
                <h3>{meal.title}</h3>
                {meal.desc ? <span>{meal.desc}</span> : null}
              </div>
            </article>
          ))}
        </section>

        <section className="panel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel"><ClipboardCheck size={17} /> {isDietProgram ? "4주 식단 체크리스트" : "체크리스트"}</p>
              <h2>{isDietProgram ? "시간별 식단 완료율" : routineInfo.checkTitle} {percent}%</h2>
            </div>
            <strong>{completedCount}/{currentCheckItems.length}</strong>
          </div>
          <div className="progressTrack">
            <div className="progressBar" style={{ width: `${percent}%` }} />
          </div>
          <div className="checkList">
            {currentCheckItems.map((item, index) => (
              <button
                className={`checkItem ${checks[index] ? "done" : ""}`}
                disabled={!user}
                key={`${index}-${item}`}
                onClick={() => toggleCheck(index)}
              >
                <CheckCircle2 size={22} />
                <span>{item}</span>
              </button>
            ))}
          </div>
        </section>

        {!isDietProgram ? (
        <section className="panel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel"><Droplets size={17} /> {routineInfo.secondaryLabel}</p>
              <h2>{selectedRoutine.waterGoal} {routineInfo.secondaryTitle}</h2>
            </div>
            <strong>{waterCount}/{secondaryItems.length}</strong>
          </div>
          <div className="waterGrid">
            {secondaryItems.map((item, index) => (
              <button
                className={`waterItem ${waters[index] ? "done" : ""}`}
                disabled={!user}
                key={item.label}
                onClick={() => toggleWater(index)}
              >
                <b>{item.label}</b>
                <span>{item.amount}</span>
              </button>
            ))}
          </div>
        </section>
        ) : null}

        {!isDietProgram ? (
        <section className="panel">
          <p className="sectionLabel"><Utensils size={17} /> {routineInfo.supportLabel}</p>
          <h2>{routineInfo.supportTitle}</h2>
          <div className="chips">
            {supportItems.map((food) => <span key={food}>{food}</span>)}
          </div>
        </section>
        ) : null}

        <section className="panel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel">{routineInfo.memoLabel}</p>
              <h2>{routineInfo.memoTitle}</h2>
            </div>
          </div>
          <textarea
            disabled={!user}
            value={memo}
            onChange={(event) => saveMemo(event.target.value)}
            placeholder={routineInfo.memoPlaceholder}
          />
          <div className="recordActionGroups">
            <section className="recordActionGroup">
              <h3>오늘의 기록</h3>
              <div className="recordActionGrid">
                <button onClick={copyToday} disabled={recordLoading}>
                  텍스트 복사
                </button>
                <button onClick={saveDiaryImage} disabled={recordSaving || imageSaving || recordLoading}>
                  {imageSaving ? "저장 중..." : "이미지 저장"}
                </button>
              </div>
            </section>
            <section className="recordActionGroup">
              <h3>기록 관리</h3>
              <div className="recordActionGrid">
                <button
                  className={hasUnsavedChanges ? "primaryDirty" : ""}
                  onClick={() => saveRecord()}
                  disabled={recordSaving || recordLoading}
                >
                  {recordSaving ? "저장 중..." : "오늘 기록 저장"}
                </button>
                <button className="secondary" disabled={!user || recordSaving || recordLoading} onClick={resetDay}>
                  <RotateCcw size={16} /> 초기화
                </button>
              </div>
            </section>
          </div>
        </section>
          </>
        ) : null}

        {canUseApp ? (
          <div className="diaryImageStage" aria-hidden="true">
            <div ref={diaryRef}>
              <DiaryImageCard
                checks={checks}
                completedCount={completedCount}
                dietWeekNumber={dietWeekNumber}
                isDietProgram={isDietProgram}
                memo={memo}
                percent={percent}
                routineType={routineType}
                selectedDate={selectedDate}
                selectedDietDay={selectedDietDay}
                selectedDay={selectedDay}
                selectedRoutine={selectedRoutine}
                userName={userName}
                waterCount={waterCount}
                waters={waters}
              />
            </div>
          </div>
        ) : null}

        {canUseApp ? (
          <div className="weeklyImageStage" aria-hidden="true">
            <div ref={weeklyReportRef}>
              <WeeklyReportImageCard
                routineType={routineType}
                rows={weeklyRows}
                summary={weeklySummary}
                weekStart={selectedWeekStart}
                weekEnd={selectedWeekEnd}
                weeklyGoal={selectedRoutine.goalText}
                userName={userName}
              />
            </div>
          </div>
        ) : null}

        {pendingNavigation ? (
          <div className="unsavedOverlay" role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
            <div className="unsavedDialog">
              <p className="sectionLabel"><ClipboardCheck size={17} /> 저장 확인</p>
              <h2 id="unsaved-title">저장하지 않은 내용이 있어요. 이동할까요?</h2>
              <p>현재 날짜의 {routineInfo.label} 기록을 저장한 뒤 이동하거나, 저장하지 않고 이동할 수 있어요.</p>
              <div className="unsavedActions">
                <button onClick={saveThenNavigate} disabled={recordSaving}>
                  {recordSaving ? "저장 중..." : "저장 후 이동"}
                </button>
                <button className="secondary" onClick={navigateWithoutSaving} disabled={recordSaving}>
                  그냥 이동
                </button>
                <button className="ghost" onClick={() => setPendingNavigation(null)} disabled={recordSaving}>
                  취소
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;
