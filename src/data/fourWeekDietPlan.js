const slotTemplates = [
  { id: "wake", time: "기상 후", title: "기상 후 음료" },
  { id: "lunch", time: "11:30", title: "점심" },
  { id: "drink1", time: "13:30", title: "음료" },
  { id: "snack", time: "14:30", title: "간식" },
  { id: "drink2", time: "16:30", title: "음료" },
  { id: "dinner", time: "17:30", title: "저녁" },
];

const groups = {
  1: {
    early: {
      totalDrink: "히비스커스 물 2L",
      contents: [
        "히비스커스 물 1L\n20분 동안 천천히 씹어서 마시기",
        "수박 100g + 피스타치오 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 1개\n방울토마토 5개",
        "히비스커스 물 500ml\n10분 동안 천천히 씹어서 마시기",
        "수박 100g + 피스타치오 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 1개\n방울토마토 5개",
        "히비스커스 물 500ml\n10분 동안 천천히 씹어서 마시기",
        "수박 100g + 피스타치오 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 1개\n방울토마토 5개",
      ],
    },
    mid: {
      totalDrink: "히비스커스 물 3L",
      contents: [
        "히비스커스 물 1.5L\n30분 동안 천천히 씹어서 마시기",
        "수박 100g + 피스타치오 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 1개\n방울토마토 5개",
        "히비스커스 물 1L\n10분 동안 천천히 씹어서 마시기",
        "수박 80g + 피스타치오 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 2개\n방울토마토 5개",
        "히비스커스 물 500ml\n10분 동안 천천히 씹어서 마시기",
        "수박 50g + 피스타치오 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 2개\n방울토마토 7개",
      ],
    },
    weekend: {
      totalDrink: "히비스커스 물 800ml",
      contents: [
        "히비스커스 물 300ml\n10분 동안 천천히 씹어서 마시기",
        "수박 50g + 피스타치오 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 2개\n오이 100g",
        "히비스커스 물 300ml\n10분 동안 천천히 씹어서 마시기",
        "수박 50g + 피스타치오 8알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 2개\n오이 50g",
        "히비스커스 물 200ml\n10분 동안 천천히 씹어서 마시기",
        "수박 50g + 피스타치오 8알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 2개\n오이 50g",
      ],
    },
  },
  2: {
    early: {
      totalDrink: "녹차 물 3L",
      contents: [
        "녹차 물 1.5L\n30분 동안 천천히 씹어서 마시기",
        "키위 1개 + 캐슈넛 10알 + 생수 50ml 블렌더 주스\n1컵 연두부 50g\n방울토마토 5개\n오이피클 20g",
        "녹차 물 1L\n10분 동안 천천히 씹어서 마시기",
        "키위 1개 + 캐슈넛 10알 + 생수 50ml 블렌더 주스\n1컵 연두부 50g\n방울토마토 5개\n오이피클 20g",
        "녹차 물 500ml\n10분 동안 천천히 씹어서 마시기",
        "키위 1개 + 캐슈넛 10알 + 생수 50ml 블렌더 주스\n1컵 연두부 50g\n방울토마토 5개",
      ],
    },
    mid: {
      totalDrink: "녹차 물 1.5L",
      contents: [
        "녹차 물 1L\n20분 동안 천천히 씹어서 마시기",
        "키위 1/2개 + 캐슈넛 10알 + 생수 50ml 블렌더 주스\n1컵 연두부 70g\n방울토마토 5개\n오이피클 20g",
        "녹차 물 300ml\n10분 동안 천천히 씹어서 마시기",
        "키위 1/2개 + 캐슈넛 10알 + 생수 50ml 블렌더 주스\n1컵 연두부 70g\n방울토마토 5개\n오이피클 20g",
        "녹차 물 200ml\n10분 동안 천천히 씹어서 마시기",
        "키위 1/2개 + 캐슈넛 10알 + 생수 50ml 블렌더 주스\n1컵 연두부 70g\n방울토마토 5개",
      ],
    },
    weekend: {
      totalDrink: "녹차 물 700ml",
      contents: [
        "녹차 물 300ml\n10분 동안 천천히 씹어서 마시기",
        "키위 1/2개 + 캐슈넛 10알 + 생수 50ml 블렌더 주스\n1컵 연두부 50g\n당근 100g",
        "녹차 물 200ml\n10분 동안 천천히 씹어서 마시기",
        "키위 1/2개 + 캐슈넛 8알 + 생수 50ml 블렌더 주스\n1컵 연두부 50g\n당근 80g",
        "녹차 물 200ml\n10분 동안 천천히 씹어서 마시기",
        "키위 1/2개 + 캐슈넛 8알 + 생수 50ml 블렌더 주스\n1컵 연두부 50g\n당근 50g",
      ],
    },
  },
  3: {
    early: {
      totalDrink: "보리차 물 2.5L",
      contents: [
        "보리차 물 1.2L\n20분 동안 천천히 씹어서 마시기",
        "복숭아 100g + 아몬드 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 1개\n오이 50g\n오이피클 20g",
        "보리차 물 800ml\n10분 동안 천천히 씹어서 마시기",
        "복숭아 100g + 아몬드 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 1개\n오이 50g\n오이피클 20g",
        "보리차 물 500ml\n10분 동안 천천히 씹어서 마시기",
        "복숭아 100g + 아몬드 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 1개\n오이 50g",
      ],
    },
    mid: {
      totalDrink: "보리차 물 2L",
      contents: [
        "보리차 물 1L\n20분 동안 천천히 씹어서 마시기",
        "복숭아 80g + 아몬드 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 2개\n오이 100g\n오이피클 20g",
        "보리차 물 500ml\n10분 동안 천천히 씹어서 마시기",
        "복숭아 80g + 아몬드 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 2개\n오이 100g\n오이피클 20g",
        "보리차 물 500ml\n10분 동안 천천히 씹어서 마시기",
        "복숭아 50g + 아몬드 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 3개\n오이 100g",
      ],
    },
    weekend: {
      totalDrink: "보리차 물 900ml",
      contents: [
        "보리차 물 400ml\n10분 동안 천천히 씹어서 마시기",
        "복숭아 50g + 아몬드 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 3개\n오이 120g",
        "보리차 물 300ml\n10분 동안 천천히 씹어서 마시기",
        "복숭아 50g + 아몬드 10알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 3개\n오이 120g",
        "보리차 물 200ml\n10분 동안 천천히 씹어서 마시기",
        "복숭아 50g + 아몬드 8알 + 생수 50ml 블렌더 주스\n삶은 계란 흰자 3개\n오이 100g",
      ],
    },
  },
  4: {
    early: {
      totalDrink: "히비스커스 물 3L",
      contents: [
        "히비스커스 물 1.5L\n30분 동안 천천히 씹어서 마시기",
        "블루베리 100g + 헤이즐넛 10알 + 생수 50ml 블렌더 주스\n1컵 연두부 50g\n당근 100g",
        "히비스커스 물 1L\n10분 동안 천천히 씹어서 마시기",
        "블루베리 100g + 헤이즐넛 10알 + 생수 50ml 블렌더 주스\n1컵 연두부 50g\n당근 100g",
        "히비스커스 물 500ml\n10분 동안 천천히 씹어서 마시기",
        "블루베리 100g + 헤이즐넛 10알 + 생수 50ml 블렌더 주스\n1컵 연두부 50g\n당근 100g",
      ],
    },
    mid: {
      totalDrink: "히비스커스 물 1.5L",
      contents: [
        "히비스커스 물 1L\n20분 동안 천천히 씹어서 마시기",
        "블루베리 80g + 헤이즐넛 10알 + 생수 50ml 블렌더 주스\n1컵 연두부 100g\n당근 100g",
        "히비스커스 물 300ml\n10분 동안 천천히 씹어서 마시기",
        "블루베리 50g + 헤이즐넛 10알 + 생수 50ml 블렌더 주스\n1컵 연두부 100g\n당근 100g",
        "히비스커스 물 200ml\n10분 동안 천천히 씹어서 마시기",
        "블루베리 50g + 헤이즐넛 8알 + 생수 50ml 블렌더 주스\n1컵 연두부 80g\n당근 100g",
      ],
    },
    weekend: {
      totalDrink: "히비스커스 물 800ml",
      contents: [
        "히비스커스 물 400ml\n10분 동안 천천히 씹어서 마시기",
        "블루베리 50g + 헤이즐넛 8알 + 생수 50ml 블렌더 주스\n1컵 연두부 80g\n당근 80g",
        "히비스커스 물 200ml\n10분 동안 천천히 씹어서 마시기",
        "블루베리 50g + 헤이즐넛 8알 + 생수 50ml 블렌더 주스\n1컵 연두부 80g\n당근 80g",
        "히비스커스 물 200ml\n10분 동안 천천히 씹어서 마시기",
        "블루베리 50g + 헤이즐넛 8알 + 생수 50ml 블렌더 주스\n1컵 연두부 50g\n당근 80g",
      ],
    },
  },
};

function makeDay(group) {
  return {
    totalDrink: group.totalDrink,
    slots: slotTemplates.map((slot, index) => ({
      ...slot,
      content: group.contents[index],
      enabled: true,
    })),
  };
}

function makeWeek(weekNumber) {
  const week = groups[weekNumber];
  return {
    mon: makeDay(week.early),
    tue: makeDay(week.early),
    wed: makeDay(week.mid),
    thu: makeDay(week.mid),
    fri: makeDay(week.mid),
    sat: makeDay(week.weekend),
    sun: makeDay(week.weekend),
  };
}

export const fourWeekDietPlan = {
  1: makeWeek(1),
  2: makeWeek(2),
  3: makeWeek(3),
  4: makeWeek(4),
};

export function defaultFourWeekDietDay(weekNumber, dayId) {
  return JSON.parse(JSON.stringify(fourWeekDietPlan[weekNumber]?.[dayId] || fourWeekDietPlan[1].mon));
}

export function defaultFourWeekDietProgram() {
  return Object.fromEntries(
    [1, 2, 3, 4].map((weekNumber) => [
      weekNumber,
      Object.fromEntries(Object.keys(fourWeekDietPlan[weekNumber]).map((dayId) => [
        dayId,
        defaultFourWeekDietDay(weekNumber, dayId),
      ])),
    ])
  );
}
