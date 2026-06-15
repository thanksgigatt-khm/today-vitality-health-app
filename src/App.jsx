import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  LogIn,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Utensils,
  Users,
} from "lucide-react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import { appInfo, checkItems, days, emergencyFoods, waterItems } from "./data/routineData";
import "./styles.css";

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

function recordId(uid, dayId) {
  return `${uid}_${dayId}`;
}

function AdminPanel({ currentUser }) {
  const [profiles, setProfiles] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedUid, setSelectedUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadAdminData() {
    setLoading(true);
    setError("");

    try {
      const [profilesSnap, recordsSnap] = await Promise.all([
        getDocs(query(collection(db, "userProfiles"), orderBy("updatedAt", "desc"))),
        getDocs(query(collection(db, "userRoutineRecords"), orderBy("updatedAt", "desc"))),
      ]);

      const nextProfiles = profilesSnap.docs.map((profileDoc) => ({
        id: profileDoc.id,
        ...profileDoc.data(),
      }));
      const nextRecords = recordsSnap.docs.map((recordDoc) => ({
        id: recordDoc.id,
        ...recordDoc.data(),
      }));

      setProfiles(nextProfiles);
      setRecords(nextRecords);
      setSelectedUid((uid) => uid || nextProfiles[0]?.uid || nextRecords[0]?.uid || "");
    } catch (adminError) {
      setError(adminError.message || "관리자 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  const selectedRecords = records.filter((record) => record.uid === selectedUid);

  return (
    <section className="panel adminPanel">
      <div className="panelHead">
        <div>
          <p className="sectionLabel"><ShieldCheck size={17} /> 관리자 화면</p>
          <h2>사용자별 루틴 기록</h2>
        </div>
        <button className="smallButton" onClick={loadAdminData} disabled={loading}>
          {loading ? "불러오는 중" : "새로고침"}
        </button>
      </div>

      {error ? <p className="statusText errorText">{error}</p> : null}

      <div className="adminGrid">
        <div className="adminList">
          <h3><Users size={17} /> 사용자 목록</h3>
          {profiles.length === 0 && !loading ? (
            <p className="statusText">아직 저장된 사용자 프로필이 없습니다.</p>
          ) : null}
          {profiles.map((profile) => (
            <button
              key={profile.uid}
              className={`userRow ${profile.uid === selectedUid ? "active" : ""}`}
              onClick={() => setSelectedUid(profile.uid)}
            >
              <strong>{profile.displayName || "이름 없음"}</strong>
              <span>{profile.email}</span>
            </button>
          ))}
        </div>

        <div className="adminRecords">
          <h3>체크 기록</h3>
          {selectedRecords.length === 0 ? (
            <p className="statusText">선택한 사용자의 기록이 없습니다.</p>
          ) : null}
          {selectedRecords.map((record) => {
            const day = days.find((item) => item.id === record.dayId);
            return (
              <article className="recordCard" key={record.id}>
                <div>
                  <strong>{day?.fullLabel || record.dayId}</strong>
                  <span>{record.email || currentUser.email}</span>
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
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState(getTodayId);
  const [checks, setChecks] = useState({});
  const [waters, setWaters] = useState({});
  const [memo, setMemo] = useState("");
  const [recordLoading, setRecordLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);

  const selectedDay = useMemo(
    () => days.find((day) => day.id === selectedDayId) || days[0],
    [selectedDayId]
  );

  const completedCount = checkItems.filter((_, index) => checks[index]).length;
  const waterCount = waterItems.filter((_, index) => waters[index]).length;
  const percent = Math.round((completedCount / checkItems.length) * 100);
  const isAdmin = user && adminEmails().includes(user.email?.toLowerCase());

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setChecks({});
        setWaters({});
        setMemo("");
        setShowAdmin(false);
        return;
      }

      await setDoc(
        doc(db, "userProfiles", nextUser.uid),
        {
          uid: nextUser.uid,
          email: nextUser.email || "",
          displayName: nextUser.displayName || "",
          photoURL: nextUser.photoURL || "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    setRecordLoading(true);
    setSaveError("");

    const unsubscribe = onSnapshot(
      doc(db, "userRoutineRecords", recordId(user.uid, selectedDayId)),
      (snapshot) => {
        const data = snapshot.data();
        setChecks(normalizeMap(data?.checks));
        setWaters(normalizeMap(data?.waters));
        setMemo(data?.memo || "");
        setRecordLoading(false);
      },
      (error) => {
        setSaveError(error.message || "기록을 불러오지 못했습니다.");
        setRecordLoading(false);
      }
    );

    return unsubscribe;
  }, [selectedDayId, user]);

  async function saveRecord(nextValues) {
    if (!user) return;

    const nextChecks = normalizeMap(nextValues.checks ?? checks);
    const nextWaters = normalizeMap(nextValues.waters ?? waters);
    const nextMemo = nextValues.memo ?? memo;

    setSaveError("");

    try {
      await setDoc(
        doc(db, "userRoutineRecords", recordId(user.uid, selectedDayId)),
        {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          dayId: selectedDayId,
          checks: nextChecks,
          waters: nextWaters,
          memo: nextMemo,
          completedCount: checkItems.filter((_, index) => nextChecks[index]).length,
          waterCount: waterItems.filter((_, index) => nextWaters[index]).length,
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
    const meals = selectedDay.meals.map((meal) => `- ${meal.time}: ${meal.title} (${meal.desc})`).join("\n");
    const text = `[${selectedDay.fullLabel} 건강루틴 기록]\n완료: ${completedCount}/${checkItems.length}\n물: ${waterCount}/${waterItems.length}\n\n식단\n${meals}\n\n메모\n${memo || "없음"}`;
    await navigator.clipboard.writeText(text);
    alert("오늘 기록을 복사했어요.");
  }

  function resetDay() {
    if (!confirm(`${selectedDay.fullLabel} 체크와 메모를 초기화할까요?`)) return;
    setChecks({});
    setWaters({});
    setMemo("");
    saveRecord({ checks: {}, waters: {}, memo: "" });
  }

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
        {user && isAdmin && showAdmin ? <AdminPanel currentUser={user} /> : null}

        {!user ? (
          <section className="panel">
            <p className="sectionLabel"><LogIn size={17} /> 로그인이 필요합니다</p>
            <h2>Google 로그인 후 개인 루틴 기록을 저장할 수 있어요.</h2>
          </section>
        ) : null}

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
            <p className="sectionLabel"><CalendarDays size={17} /> 오늘의 루틴</p>
            <h2>{selectedDay.fullLabel} · {selectedDay.characterName}</h2>
            <p className="motto">"{selectedDay.motto}"</p>
          </div>
          <div className="oilBadge">{recordLoading ? "불러오는 중" : selectedDay.oil}</div>
        </section>

        <section className="mealGrid">
          {selectedDay.meals.map((meal) => (
            <article className="mealCard" key={meal.time}>
              <div className="mealIcon">{meal.emoji}</div>
              <div>
                <p>{meal.time}</p>
                <h3>{meal.title}</h3>
                <span>{meal.desc}</span>
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
              <p className="sectionLabel"><Droplets size={17} /> 물 1.5L</p>
              <h2>나눠 마시기 체크</h2>
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
            <button className="secondary" disabled={!user} onClick={resetDay}><RotateCcw size={16} /> 초기화</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
