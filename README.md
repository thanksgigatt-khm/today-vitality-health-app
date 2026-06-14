# 오늘 활력소 건강루틴 앱

혜미님의 `오늘 활력소` 캐릭터 이미지를 활용한 월~일 건강 루틴 체크 앱입니다.

## 포함 기능

- 월~일 요일별 건강 루틴
- 아침 / 점심 / 퇴근 전 / 저녁 기준 표시
- 캐릭터 이미지 기반 카드 UI
- 체크리스트 완료율
- 물 1.5L 나눠 마시기 체크
- 비상 보완식 안내
- 오늘 메모 저장
- 오늘 기록 복사
- localStorage 저장

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 표시된 주소를 열면 됩니다.

## 코덱스에서 사용하는 방법

1. 이 프로젝트 폴더를 코덱스에 업로드합니다.
2. `npm install` 실행
3. `npm run dev` 실행
4. 원하는 문구나 식단은 `src/data/routineData.js`에서 수정합니다.

## 주요 파일

- `src/App.jsx` : 앱 화면과 체크 기능
- `src/data/routineData.js` : 월~일 식단/루틴 데이터
- `src/styles.css` : 디자인 스타일
- `src/assets/characters` : 캐릭터 이미지
