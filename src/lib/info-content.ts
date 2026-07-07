// src/lib/info-content.ts
// Static, pre-written explanations shown in the info-icon popovers across
// the app. Kept static (not AI-generated) because these are factual
// definitions — health topics are exactly where hallucination risk matters
// most. AI is used separately, only to add a short *personalized* line
// underneath using the person's own data (see info-personalize.ts).

export type InfoTopic =
  | "fertilityWindow"
  | "ovulation"
  | "cycleDay"
  | "avgCycle"
  | "periodLength"
  | "variance"
  | "flow"
  | "symptoms"
  | "mood"
  | "calendarLegend"
  | "insightPattern"
  | "insightTrend"
  | "insightRegularity"
  | "insightSymptom"
  | "insightMood"
  | "insightTip"
  | "flowCurveChart";

export const INFO_CONTENT: Record<InfoTopic, { title: string; body: string }> = {
  fertilityWindow: {
    title: "Fertility Window",
    body: "The days in your cycle when pregnancy is most likely — roughly the 5 days before ovulation through the day of ovulation itself. Sperm can survive several days, which is why the window starts before the egg is actually released.",
  },
  ovulation: {
    title: "Ovulation",
    body: "The day an egg is released from an ovary — usually the single most fertile day of your cycle. It's typically about 14 days before your next period starts, though this can vary from person to person and cycle to cycle.",
  },
  cycleDay: {
    title: "Cycle Day",
    body: "The number of days since your last period started. Day 1 is the first day of bleeding, and the cycle runs until the day before your next period begins.",
  },
  avgCycle: {
    title: "Average Cycle Length",
    body: "The typical number of days from the start of one period to the start of the next, averaged across your logged history. A generally normal range is 21-35 days, but what's normal varies by person.",
  },
  periodLength: {
    title: "Period Length",
    body: "How many days your bleeding typically lasts, averaged across periods you've logged with an end date. Most periods last somewhere between 3 and 7 days.",
  },
  variance: {
    title: "Cycle Variance",
    body: "How much your cycle length changes from month to month. A lower number means your timing is fairly predictable; a higher number means more natural variation cycle to cycle.",
  },
  flow: {
    title: "Flow",
    body: "How much you're bleeding on a given day — spotting (light traces), light, medium, or heavy. Logging it day by day reveals your typical pattern, like heavier early days tapering off later.",
  },
  symptoms: {
    title: "Symptoms",
    body: "Physical or emotional effects you notice around your cycle — cramps, headaches, bloating, and more. Rating severity from mild to severe helps reveal which symptoms tend to show up and roughly when.",
  },
  mood: {
    title: "Mood",
    body: "How you're feeling emotionally on a given day. Moods often shift in patterns across a cycle — many people notice things like irritability before a period or more energy mid-cycle.",
  },
  calendarLegend: {
    title: "Calendar Colors",
    body: "Period = days you've actually logged bleeding. Predicted = a forecasted period based on your history, shown only before it's confirmed. Fertile = days pregnancy is most likely. Ovulation = the estimated release day. A small dot under a date means a symptom or mood was logged that day.",
  },
  insightPattern: {
    title: "Pattern Insights",
    body: "Recurring trends the AI has noticed in your data — like a symptom that tends to show up at a similar point in your cycle more than once.",
  },
  insightTrend: {
    title: "Trend Insights",
    body: "Changes over time — like your cycle length gradually shifting, or a symptom's severity changing across your last few cycles.",
  },
  insightRegularity: {
    title: "Regularity Insights",
    body: "How consistent your cycle timing is from one cycle to the next, and what that means for how confident predictions can be right now.",
  },
  insightSymptom: {
    title: "Symptom Insights",
    body: "Specific observations about a symptom you've logged — like when in your cycle it tends to appear, or how often.",
  },
  insightMood: {
    title: "Mood Insights",
    body: "Patterns in how your mood shifts across your cycle, based on what you've actually logged.",
  },
  insightTip: {
    title: "Tips",
    body: "General suggestions to help you get more out of tracking, or gentle pointers related to your data and health profile.",
  },
  flowCurveChart: {
    title: "Flow Pattern Chart",
    body: "Average flow intensity for each day of your period, averaged across every period you've logged. It reveals your typical shape — like heavy at the start, tapering to light by the end.",
  },
};