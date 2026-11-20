export function isStudentOnboardingComplete(data = {}) {
  if (data?.mustChangePassword === true) return false;

  return data?.registrationCompleted === true ||
    data?.profileCompleted === true ||
    data?.onboardingCompleted === true ||
    data?.firstLoginCompleted === true;
}

function normalizeCategory(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export function getStudentOnboardingType(data = {}, studentId = "") {
  const values = [
    data?.studentType,
    data?.category,
    data?.studentCategory,
    data?.grade
  ].map(normalizeCategory).filter(Boolean);

  for (const value of values) {
    if (value === "grade10" || value === "10" || value.includes("grade10")) {
      return "grade10";
    }
    if (value === "grade11" || value === "11" || value.includes("grade11")) {
      return "grade11";
    }
    if (
      value === "al" ||
      value.startsWith("al") ||
      value.startsWith("a/l") ||
      value.includes("advanced")
    ) {
      return "al";
    }
  }

  const id = String(studentId || "").trim().toUpperCase();
  if (/^A2[789]\d{3}$/.test(id) || /^(?:27|28|29)[CN]/.test(id)) {
    return "al";
  }

  if (/^\d{5}$/.test(id)) {
    const number = Number(id);
    if (number >= 26000 && number <= 26999) return "grade11";
    if (number >= 27000 && number <= 27999) return "grade10";
  }

  return "";
}
