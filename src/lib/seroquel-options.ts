// Fixed option lists for the Seroquel log form.
// Order and labels match the spec in the Safety Care Plan.

export const STRESSORS = [
  { slug: "money", label: "Money pressure", emoji: "💸" },
  { slug: "work", label: "Work and business stress", emoji: "💼" },
  { slug: "job-hunt", label: "Job hunt knockback", emoji: "🪪" },
  { slug: "housing", label: "Housing or tenancy", emoji: "🏠" },
  { slug: "health", label: "Health worry", emoji: "🩺" },
  { slug: "fairwork-appetise", label: "Fair Work / Appetise", emoji: "⚖️" },
  { slug: "difficult-convo", label: "Difficult conversation", emoji: "🗣️" },
  { slug: "family", label: "Family", emoji: "👪" },
  { slug: "alone", label: "Feeling alone", emoji: "🌧️" },
  { slug: "unheard", label: "Feeling unheard", emoji: "🙉" },
  { slug: "switch-off", label: "Couldn't switch off", emoji: "🌀" },
] as const;

export const EMOTIONS = [
  { slug: "sad", label: "Sad", emoji: "😔" },
  { slug: "anxious", label: "Anxious", emoji: "😬" },
  { slug: "angry", label: "Angry", emoji: "😠" },
  { slug: "overwhelmed", label: "Overwhelmed", emoji: "🌊" },
  { slug: "defeated", label: "Defeated", emoji: "😞" },
  { slug: "scared", label: "Scared", emoji: "😨" },
  { slug: "numb", label: "Numb", emoji: "😶" },
  { slug: "frustrated", label: "Frustrated", emoji: "😤" },
  { slug: "lonely", label: "Lonely", emoji: "🧍" },
  { slug: "ashamed", label: "Ashamed", emoji: "😶‍🌫️" },
  { slug: "exhausted", label: "Exhausted", emoji: "🥱" },
] as const;

export const FACILITY_OPTIONS = [
  { slug: "stv", label: "St Vincent's" },
  { slug: "pow", label: "Prince of Wales" },
  { slug: "rpa", label: "Royal Prince Alfred" },
  { slug: "other", label: "Other" },
] as const;

export const DRIVING_THIS = [
  { slug: "specific-event", label: "A specific event" },
  { slug: "build-up", label: "A build-up over time" },
  { slug: "no-clear-reason", label: "No clear reason" },
  { slug: "dont-know", label: "Don't know" },
] as const;

export const WHAT_WOULD_HELP = [
  { slug: "rest", label: "Rest" },
  { slug: "check-on-me", label: "Check on me" },
  { slug: "left-alone", label: "Left alone" },
  { slug: "not-sure", label: "Not sure" },
] as const;
