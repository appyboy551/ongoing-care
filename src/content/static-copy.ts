// Static copy used across pages. Lives here so wording is consistent and easy to update.
// All copy is Australian English with no em dashes.

export const COPY = {
  appName: "Ongoing Care",
  appTagline: "David's support network portal",
  loginIntro:
    "Sign in with the email David added you under. We'll email you a six-digit code.",
  loginCodeIntro:
    "Check your email. Codes expire in ten minutes. If it doesn't arrive, check spam, then ask David.",
  helpNow: {
    emergencyTitle: "Immediate danger",
    emergencyNumber: "000",
    emergencyBody:
      "Use 000 first if there is immediate danger to David or anyone around him.",
    supportTitle: "Mental health support",
    supportNumber: "1800 011 511",
    supportBody:
      "NSW Mental Health Line, 24 hours a day. For support and advice when struggling but not in immediate danger.",
  },
  policeScriptIntro:
    "If police are called, the portal will give you a factual script with David's details. Do not add stressors or emotions to the script.",
  network: {
    keysHolders:
      "Shannon Horn and Jackson Stein each hold a front-door key. Building has 18 apartments; buzz a neighbour. Do not involve neighbours beyond buzzing the door.",
    notLocal:
      "Robyn Scott is an optional coordinating call only if both Shannon and Jackson are unreachable. Robyn is not a physical welfare-check contact.",
  },
  consent: {
    melbourneClinicians:
      "David consents to his current care team contacting Dr Ben Bernard and Maria Galatsis for detailed clinical history.",
  },
  privacy: {
    // Numbers now live encrypted in the portal database. Kept as a fallback
    // label in case any older surface still references this copy.
    medicareNumberHidden:
      "Stored encrypted in the portal. Visible to David, Bron and Joanna from the Medical page.",
    medibankNumberHidden:
      "Stored encrypted in the portal. Visible to David, Bron and Joanna from the Medical page.",
  },
} as const;
