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
import { appInfo, checkItems, days, emergencyFoods, waterItems } from "./data/routineData";
import "./styles.css";

const dayOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

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

function defaultRoutineForDay(day) {
  return {
    dayId: day.id,
    morning: `${day.meals[0]?.title || ""} ${day.meals[0]?.desc || ""}`.trim(),
    lunch: `${day.meals[1]?.title || ""} ${day.meals[1]?.desc || ""}`.trim(),
    afternoon: `${day.meals[2]?.title || ""} ${day.meals[2]?.desc || ""}`.trim(),
    evening: `${day.meals[3]?.title || ""} ${day.meals[3]?.desc || ""}`.trim(),
    waterGoal: "1.5L",
    goalText: day.motto || "",
  };
}

function defaultRoutines() {
  return Object.fromEntries(days.map((day) => [day.id, defaultRoutineForDay(day)]));
}

function mergeRoutine(dayId, routine) {
  return {
    ...defaultRoutineForDay(days.find((day) => day.id === dayId) || days[0]),
    ...(routine || {}),
    dayId,
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

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function checkLabel(value) {
  return value ? "완료" : "";
}

function buildRoutineCsv(records, profilesByUid) {
  const headers = [
    "날짜",
    "요일",
    "사용자명",
    "이메일",
    "아침완료",
    "점심완료",
    "퇴근전쉐이크",
    "물체크",
    "저녁패스",
    "간보기1번",
    "집어먹지않기",
    "메모",
    "완료개수",
    "완료율",
  ];

  const rows = records.map((record) => {
    const checks = normalizeMap(record.checks);
    const day = days.find((item) => item.id === record.dayId);
    const profile = profilesByUid.get(record.uid);
    const completedCount = checkItems.filter((_, index) => checks[index]).length;
    const completedRate = `${Math.round((completedCount / checkItems.length) * 100)}%`;

    return [
      record.date || formatDate(record.updatedAt),
      day?.fullLabel || record.dayId || "",
      record.displayName || profile?.displayName || "",
      record.email || profile?.email || "",
      checkLabel(checks[0]),
      checkLabel(checks[1]),
      checkLabel(checks[2]),
      checkLabel(checks[3]),
      checkLabel(checks[6]),
      checkLabel(checks[5]),
      checkLabel(checks[4]),
      record.memo || "",
      completedCount,
      completedRate,
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

function DiaryImageCard({
  checks,
  completedCount,
  memo,
  percent,
  selectedDate,
  selectedDay,
  selectedRoutine,
  userName,
  waterCount,
  waters,
}) {
  const checkedRoutineItems = checkedItemsFromMap(checkItems, checks);
  const checkedWaterItems = waterItems.filter((_, index) => waters[index]);
  const memoText = limitText(memo, 180) || "오늘의 컨디션과 마음을 짧게 남겨보세요.";

  return (
    <article className={`diaryImageCard theme-${selectedDay.theme}`}>
      <div className="diaryTape tapeOne" />
      <div className="diaryTape tapeTwo" />
      <div className="diaryStamp">
        <span>{selectedDate}</span>
        <strong>{selectedDay.fullLabel}</strong>
      </div>

      <header className="diaryHeader">
        <div>
          <p>Daily wellness journal</p>
          <h1>오늘 활력소 건강루틴</h1>
          <span>{userName || "나의 기록"}님의 다이어리 노트</span>
        </div>
        <div className="diaryCharacter">
          <img src={selectedDay.characterImage} alt="" />
        </div>
      </header>

      <section className="diaryGoalNote">
        <span>today's little promise</span>
        <strong>{limitText(selectedRoutine.goalText, 54) || "오늘도 흐름을 이어가요."}</strong>
      </section>

      <section className="diarySummary">
        <div>
          <strong>{completedCount}/{checkItems.length}</strong>
          <span>체크 완료</span>
        </div>
        <div>
          <strong>{percent}%</strong>
          <span>완료율</span>
        </div>
        <div>
          <strong>{waterCount}/{waterItems.length}</strong>
          <span>물 체크</span>
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
          <h2>water</h2>
          <p>{selectedRoutine.waterGoal} 목표</p>
          <strong>{checkedWaterItems.length ? checkedWaterItems.map((item) => item.label).join(" · ") : "아직 물 체크 전"}</strong>
        </div>
        <div className="diaryMiniNote">
          <h2>meal flow</h2>
          <p>아침 · 점심 · 오후 · 저녁</p>
          <strong>{limitText(selectedRoutine.afternoon || selectedRoutine.evening, 46)}</strong>
        </div>
      </section>

      <section className="diaryMemo">
        <h2>memo</h2>
        <p>{memoText}</p>
      </section>

      <footer className="diaryFooter">
        <strong>오늘도 흐름을 이어간 나를 칭찬해요</strong>
        <span>오늘 활력소 건강루틴 · saved with care</span>
      </footer>
    </article>
  );
}

async function ensureDefaultRoutine(uid) {
  const daysRef = collection(db, "userRoutines", uid, "days");
  const snapshot = await getDocs(daysRef);
  if (!snapshot.empty) return;

  const batch = writeBatch(db);
  days.forEach((day) => {
    batch.set(doc(db, "userRoutines", uid, "days", day.id), {
      ...defaultRoutineForDay(day),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

function RoutineSettings({ routines, onSave }) {
  const [drafts, setDrafts] = useState(defaultRoutines);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    setDrafts(Object.fromEntries(days.map((day) => [day.id, mergeRoutine(day.id, routines[day.id])])));
  }, [routines]);

  function updateRoutine(dayId, field, value) {
    setSavedMessage("");
    setDrafts((current) => ({
      ...current,
      [dayId]: {
        ...current[dayId],
        [field]: value,
      },
    }));
  }

  async function saveAll() {
    setSaving(true);
    setSavedMessage("");
    try {
      await onSave(drafts);
      setSavedMessage("루틴이 저장됐어요.");
    } finally {
      setSaving(false);
    }
  }

  function resetToDefault() {
    setSavedMessage("");
    setDrafts(defaultRoutines());
  }

  return (
    <section className="panel routineSettings">
      <div className="panelHead">
        <div>
          <p className="sectionLabel"><Settings size={17} /> 내 루틴 설정</p>
          <h2>월~일 개인 루틴 수정</h2>
        </div>
        <div className="routineSettingsActions">
          <button className="smallButton" onClick={resetToDefault} disabled={saving}>
            기본 루틴으로 되돌리기
          </button>
          <button className="smallButton" onClick={saveAll} disabled={saving}>
            {saving ? "저장 중" : "저장"}
          </button>
        </div>
      </div>

      {savedMessage ? <p className="statusText successText">{savedMessage}</p> : null}

      <div className="routineEditorGrid">
        {days.map((day) => {
          const draft = drafts[day.id] || mergeRoutine(day.id);
          return (
            <article className="routineEditor" key={day.id}>
              <h3>{day.fullLabel}</h3>
              <label>오늘 목표 문구<input value={draft.goalText} onChange={(event) => updateRoutine(day.id, "goalText", event.target.value)} /></label>
              <label>아침<input value={draft.morning} onChange={(event) => updateRoutine(day.id, "morning", event.target.value)} /></label>
              <label>점심<input value={draft.lunch} onChange={(event) => updateRoutine(day.id, "lunch", event.target.value)} /></label>
              <label>오후/퇴근 전<input value={draft.afternoon} onChange={(event) => updateRoutine(day.id, "afternoon", event.target.value)} /></label>
              <label>저녁<input value={draft.evening} onChange={(event) => updateRoutine(day.id, "evening", event.target.value)} /></label>
              <label>물 목표<input value={draft.waterGoal} onChange={(event) => updateRoutine(day.id, "waterGoal", event.target.value)} /></label>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AdminPanel() {
  const [profiles, setProfiles] = useState([]);
  const [selectedUid, setSelectedUid] = useState("");
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
      setError(adminError.message || "관리자 데이터를 불러오지 못했습니다.");
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
      setError(statusError.message || "사용자 상태를 변경하지 못했습니다.");
    }
  }

  async function loadUserDetails(uid) {
    if (!uid) return;
    setError("");
    try {
      const [routinesSnap, recordsSnap] = await Promise.all([
        getDocs(collection(db, "userRoutines", uid, "days")),
        getDocs(query(collection(db, "userRoutineRecords", uid, "records"), orderBy("date", "desc"))),
      ]);
      setSelectedRoutines(routinesSnap.docs.map((routineDoc) => ({ id: routineDoc.id, ...routineDoc.data() })));
      setSelectedRecords(
        recordsSnap.docs
          .map((recordDoc) => ({ id: recordDoc.id, ...recordDoc.data() }))
          .filter((record) => record.weekStart === adminWeekStart)
      );
    } catch (detailsError) {
      setError(detailsError.message || "사용자 상세 데이터를 불러오지 못했습니다.");
    }
  }

  async function downloadCsv() {
    setError("");
    try {
      const allRecords = [];
      await Promise.all(
        profiles.map(async (profile) => {
          const recordsSnap = await getDocs(query(collection(db, "userRoutineRecords", profile.uid, "records"), orderBy("date", "desc")));
          recordsSnap.docs.forEach((recordDoc) => {
            allRecords.push({ id: recordDoc.id, uid: profile.uid, ...recordDoc.data() });
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
      link.download = `health-routine-records-${formatDate(new Date())}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (csvError) {
      setError(csvError.message || "CSV를 다운로드하지 못했습니다.");
    }
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    loadUserDetails(selectedUid);
  }, [selectedUid, adminWeekStart]);

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
              <span className={`statusBadge ${profile.status || "pending"}`}>{profile.status || "pending"}</span>
              {(profile.status || "pending") === "pending" ? (
                <div className="approvalActions">
                  <button type="button" onClick={(event) => { event.stopPropagation(); updateUserStatus(profile.uid, "approved"); }}>
                    승인
                  </button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); updateUserStatus(profile.uid, "blocked"); }}>
                    차단
                  </button>
                </div>
              ) : null}
            </button>
          ))}
        </div>

        <div className="adminRecords">
          <h3>사용자 루틴</h3>
          <div className="adminRoutineList">
            {selectedRoutines.map((routine) => {
              const day = days.find((item) => item.id === routine.dayId);
              return (
                <article className="recordCard" key={routine.dayId}>
                  <strong>{day?.fullLabel || routine.dayId}</strong>
                  <p>{routine.goalText}</p>
                  <p>아침: {routine.morning}</p>
                  <p>점심: {routine.lunch}</p>
                  <p>오후: {routine.afternoon}</p>
                  <p>저녁: {routine.evening}</p>
                  <p>물 목표: {routine.waterGoal}</p>
                </article>
              );
            })}
          </div>

          <h3>날짜별 기록</h3>
          {selectedRecords.length === 0 ? <p className="statusText">선택한 사용자의 기록이 없습니다.</p> : null}
          {selectedRecords.map((record) => {
            const day = days.find((item) => item.id === record.dayId);
            return (
              <article className="recordCard" key={record.id}>
                <div>
                  <strong>{record.date} · {day?.fullLabel || record.dayId}</strong>
                  <span>{record.email}</span>
                </div>
                <p>체크 {record.completedCount || 0}/{checkItems.length}</p>
                <p>물 {record.waterCount || 0}/{waterItems.length}</p>
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
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState(getTodayId);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getWeekStart());
  const [routines, setRoutines] = useState(defaultRoutines);
  const [checks, setChecks] = useState({});
  const [waters, setWaters] = useState({});
  const [memo, setMemo] = useState("");
  const [recordLoading, setRecordLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [routineNotice, setRoutineNotice] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const selectedDay = useMemo(
    () => days.find((day) => day.id === selectedDayId) || days[0],
    [selectedDayId]
  );
  const selectedRoutine = useMemo(
    () => mergeRoutine(selectedDayId, routines[selectedDayId]),
    [routines, selectedDayId]
  );
  const selectedWeekEnd = useMemo(() => getWeekEnd(selectedWeekStart), [selectedWeekStart]);
  const selectedDate = useMemo(() => dateForDayId(selectedDayId, selectedWeekStart), [selectedDayId, selectedWeekStart]);
  const completedCount = checkItems.filter((_, index) => checks[index]).length;
  const waterCount = waterItems.filter((_, index) => waters[index]).length;
  const percent = Math.round((completedCount / checkItems.length) * 100);
  const isAdmin = user && adminEmails().includes(user.email?.toLowerCase());
  const canUseApp = Boolean(user && (isAdmin || profile?.status === "approved"));
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
        setRoutines(defaultRoutines());
        setShowAdmin(false);
        setShowSettings(false);
        return;
      }

      const isAdminEmail = adminEmails().includes(nextUser.email?.toLowerCase());
      const profileRef = doc(db, "userProfiles", nextUser.uid);
      const profileSnap = await getDoc(profileRef);
      const existingProfile = profileSnap.exists() ? profileSnap.data() : {};
      const nextProfile = {
        uid: nextUser.uid,
        email: nextUser.email || "",
        displayName: nextUser.displayName || "",
        photoURL: nextUser.photoURL || "",
        role: isAdminEmail ? "admin" : existingProfile.role || "user",
        status: isAdminEmail ? "approved" : existingProfile.status || "pending",
        updatedAt: serverTimestamp(),
      };

      await setDoc(
        profileRef,
        nextProfile,
        { merge: true }
      );
    });
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    return onSnapshot(doc(db, "userProfiles", user.uid), (snapshot) => {
      setProfile(snapshot.exists() ? snapshot.data() : null);
    }, (error) => {
      setSaveError(error.message || "사용자 상태를 불러오지 못했습니다.");
    });
  }, [user]);

  useEffect(() => {
    if (!canUseApp || !user) return undefined;

    ensureDefaultRoutine(user.uid);

    return onSnapshot(collection(db, "userRoutines", user.uid, "days"), (snapshot) => {
      const nextRoutines = defaultRoutines();
      snapshot.docs.forEach((routineDoc) => {
        nextRoutines[routineDoc.id] = mergeRoutine(routineDoc.id, routineDoc.data());
      });
      setRoutines(nextRoutines);
    }, (error) => {
      setSaveError(error.message || "개인 루틴을 불러오지 못했습니다.");
    });
  }, [canUseApp, user]);

  useEffect(() => {
    if (!canUseApp || !user) return undefined;

    setRecordLoading(true);
    setSaveError("");

    return onSnapshot(
      doc(db, "userRoutineRecords", user.uid, "records", selectedDate),
      (snapshot) => {
        const data = snapshot.data();
        setChecks(normalizeMap(data?.checks));
        setWaters(normalizeMap(data?.waterChecks || data?.waters));
        setMemo(data?.memo || "");
        setRecordLoading(false);
      },
      (error) => {
        setSaveError(error.message || "기록을 불러오지 못했습니다.");
        setRecordLoading(false);
      }
    );
  }, [canUseApp, selectedDate, user]);

  async function saveRoutineSettings(nextRoutines) {
    if (!canUseApp || !user) return;

    setRoutineNotice("");
    const batch = writeBatch(db);
    days.forEach((day) => {
      batch.set(
        doc(db, "userRoutines", user.uid, "days", day.id),
        {
          ...mergeRoutine(day.id, nextRoutines[day.id]),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
    await batch.commit();
    setRoutineNotice("루틴이 저장됐어요.");
    setShowSettings(false);
  }

  async function saveRecord(nextValues) {
    if (!canUseApp || !user) return;

    const nextChecks = normalizeMap(nextValues.checks ?? checks);
    const nextWaters = normalizeMap(nextValues.waters ?? waters);
    const nextMemo = nextValues.memo ?? memo;

    setSaveError("");

    try {
      await setDoc(
        doc(db, "userRoutineRecords", user.uid, "records", selectedDate),
        {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          date: selectedDate,
          dayId: selectedDayId,
          weekStart: selectedWeekStart,
          weekEnd: selectedWeekEnd,
          routine: selectedRoutine,
          checks: nextChecks,
          waterChecks: nextWaters,
          memo: nextMemo,
          completedCount: checkItems.filter((_, index) => nextChecks[index]).length,
          waterCount: waterItems.filter((_, index) => nextWaters[index]).length,
          completionRate: Math.round((checkItems.filter((_, index) => nextChecks[index]).length / checkItems.length) * 100),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      setSaveError(error.message || "저장하지 못했습니다.");
    }
  }

  async function loginWithGoogle() {
    setSaveError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setSaveError(error.message || "Google 로그인에 실패했습니다.");
    }
  }

  async function logout() {
    await signOut(auth);
  }

  function changeDay(dayId) {
    setSelectedDayId(dayId);
    setChecks({});
    setWaters({});
    setMemo("");
  }

  function moveWeek(offset) {
    setSelectedWeekStart((current) => addWeeks(current, offset));
    setChecks({});
    setWaters({});
    setMemo("");
  }

  function goThisWeek() {
    setSelectedWeekStart(getWeekStart());
    setSelectedDayId(getTodayId());
    setChecks({});
    setWaters({});
    setMemo("");
  }

  function toggleCheck(index) {
    const next = { ...checks, [index]: !checks[index] };
    setChecks(next);
    saveRecord({ checks: next });
  }

  function toggleWater(index) {
    const next = { ...waters, [index]: !waters[index] };
    setWaters(next);
    saveRecord({ waters: next });
  }

  function saveMemo(value) {
    setMemo(value);
    saveRecord({ memo: value });
  }

  async function copyToday() {
    const text = `[${selectedDate} ${selectedDay.fullLabel} 건강루틴 기록]\n완료: ${completedCount}/${checkItems.length}\n물: ${waterCount}/${waterItems.length}\n\n루틴\n- 아침: ${selectedRoutine.morning}\n- 점심: ${selectedRoutine.lunch}\n- 오후/퇴근 전: ${selectedRoutine.afternoon}\n- 저녁: ${selectedRoutine.evening}\n\n메모\n${memo || "없음"}`;
    await navigator.clipboard.writeText(text);
    alert("오늘 기록을 복사했어요.");
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
    try {
      const dataUrl = await createDiaryPngDataUrl();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `today-routine-${selectedDate}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert(error.message || "다이어리 이미지를 저장하지 못했어요.");
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
    if (!confirm(`${selectedDate} 기록을 초기화할까요?`)) return;
    setChecks({});
    setWaters({});
    setMemo("");
    saveRecord({ checks: {}, waters: {}, memo: "" });
  }

  const meals = [
    { time: "아침", emoji: "🍙", title: selectedRoutine.morning, desc: "" },
    { time: "점심", emoji: "🥗", title: selectedRoutine.lunch, desc: "" },
    { time: "오후/퇴근 전", emoji: "🥤", title: selectedRoutine.afternoon, desc: "" },
    { time: "저녁", emoji: "🌙", title: selectedRoutine.evening, desc: "" },
  ];

  return (
    <div className={`app theme-${selectedDay.theme}`}>
      <header className="hero">
        <div className="heroText">
          <p className="eyebrow"><Sparkles size={16} /> 나만의 건강 체크 앱</p>
          <h1>{appInfo.title}</h1>
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
          <img src="/main-image.png" alt="오늘 활력소 메인 이미지" />
        </div>
      </header>

      <main className="container">
        {user && isAdmin && showAdmin ? <AdminPanel /> : null}
        {user && canUseApp && showSettings ? <RoutineSettings routines={routines} onSave={saveRoutineSettings} /> : null}
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

        {user && !canUseApp && profile?.status !== "blocked" ? (
          <section className="panel accessPanel">
            <p className="sectionLabel"><ShieldCheck size={17} /> 승인 대기</p>
            <h2>승인 대기 중입니다. 관리자가 승인하면 건강루틴을 사용할 수 있어요.</h2>
          </section>
        ) : null}

        {canUseApp ? (
          <>
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
            <h2>{selectedDay.fullLabel} · {selectedDay.characterName}</h2>
            <p className="motto">"{selectedRoutine.goalText}"</p>
          </div>
          <div className="oilBadge">{recordLoading ? "불러오는 중" : `물 ${selectedRoutine.waterGoal}`}</div>
        </section>

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
              <p className="sectionLabel"><ClipboardCheck size={17} /> 체크리스트</p>
              <h2>오늘 성공률 {percent}%</h2>
            </div>
            <strong>{completedCount}/{checkItems.length}</strong>
          </div>
          <div className="progressTrack">
            <div className="progressBar" style={{ width: `${percent}%` }} />
          </div>
          <div className="checkList">
            {checkItems.map((item, index) => (
              <button
                className={`checkItem ${checks[index] ? "done" : ""}`}
                disabled={!user}
                key={item}
                onClick={() => toggleCheck(index)}
              >
                <CheckCircle2 size={22} />
                <span>{item}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel"><Droplets size={17} /> 물 목표</p>
              <h2>{selectedRoutine.waterGoal} 나눠 마시기 체크</h2>
            </div>
            <strong>{waterCount}/{waterItems.length}</strong>
          </div>
          <div className="waterGrid">
            {waterItems.map((item, index) => (
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

        <section className="panel">
          <p className="sectionLabel"><Utensils size={17} /> 비상 보완식</p>
          <h2>무리하지 않고 막는 선택지</h2>
          <div className="chips">
            {emergencyFoods.map((food) => <span key={food}>{food}</span>)}
          </div>
        </section>

        <section className="panel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel">오늘 메모</p>
              <h2>배고픔·컨디션·실패 포인트 기록</h2>
            </div>
          </div>
          <textarea
            disabled={!user}
            value={memo}
            onChange={(event) => saveMemo(event.target.value)}
            placeholder="예: 퇴근 후 배고픔 7/10, 아이들 밥 차릴 때 간보기 1번, 물은 1.2L 정도"
          />
          <div className="actions">
            <button onClick={copyToday}>오늘 기록 복사</button>
            <button onClick={saveDiaryImage}>다이어리 이미지 저장</button>
            <button onClick={copyDiaryImage}>다이어리 이미지 복사</button>
            <button className="secondary" disabled={!user} onClick={resetDay}><RotateCcw size={16} /> 초기화</button>
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
                memo={memo}
                percent={percent}
                selectedDate={selectedDate}
                selectedDay={selectedDay}
                selectedRoutine={selectedRoutine}
                userName={userName}
                waterCount={waterCount}
                waters={waters}
              />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;
