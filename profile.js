import { db, doc, getDoc, updateDoc } from "./firebase.js";
import { getStudentOnboardingType, isStudentOnboardingComplete } from "./student-onboarding.js";
import { requireRecoveryCodeSetup } from "./student-recovery-setup.js";

const byId = id => document.getElementById(id);
const studentId = String(sessionStorage.getItem("studentId") || "").trim().toUpperCase();

if (sessionStorage.getItem("loggedIn") !== "true" || !studentId) {
  window.location.replace("index.html");
}

const studentRef = doc(db, "students", studentId);
let currentStudentData = null;
let submittingProfile = false;
let submittingRecovery = false;

function setMessage(element, message, type = "") {
  if (!element) return;
  element.textContent = message;
  element.classList.remove("error", "success");
  if (type) element.classList.add(type);
}

function asDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value.toMillis === "function") {
    const date = new Date(value.toMillis());
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(typeof value === "number" ? value : String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = asDate(value);
  return date
    ? new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "short", year: "numeric" }).format(date)
    : "Not recorded";
}

function displayPlatform(value) {
  const labels = {
    android: "Android",
    "apple-mobile": "iPhone / iPad",
    mac: "Mac",
    other: "Other device"
  };
  return labels[String(value || "").toLowerCase()] || "Not recorded";
}

function cohortLabel(data) {
  const type = getStudentOnboardingType(data, studentId);
  if (type === "grade10") return "Grade 10";
  if (type === "grade11") return "Grade 11";
  if (type === "al") {
    const year = Number(data?.alYear || sessionStorage.getItem("alYear") || 0);
    return year ? "A/L " + year : "Advanced Level";
  }
  return String(data?.category || data?.studentCategory || data?.studentType || data?.grade || "Student");
}

function setVisible(node, visible) {
  if (node) node.hidden = !visible;
}

function renderProfile(data) {
  currentStudentData = data || {};
  const name = String(
    data?.fullName || data?.name || data?.studentName ||
    sessionStorage.getItem("studentName") || "Student"
  ).trim() || "Student";
  const category = cohortLabel(data);
  const onboardingComplete = isStudentOnboardingComplete(data);
  const recoveryReady = data?.recoveryCodeSetupComplete === true &&
    /^[a-f0-9]{64}$/i.test(String(data?.recoveryCodeHash || "").trim());

  byId("profileAvatar").textContent = Array.from(name)[0]?.toUpperCase() || "S";
  byId("profileHeroName").textContent = name;
  byId("profileHeroMeta").textContent = studentId + " · " + category;
  byId("profileHeroStatus").textContent = onboardingComplete ? "ONBOARDING COMPLETE" : "ONBOARDING INCOMPLETE";
  byId("profileName").textContent = name;
  byId("profileStudentId").textContent = studentId;
  byId("profileNic").textContent = String(data?.nicNumber || "Not provided");
  byId("profileCategory").textContent = category;
  byId("profileProgramme").textContent = category;
  byId("profileOnboardingStatus").textContent = onboardingComplete ? "Completed" : "Pending";
  byId("profileRegistrationDate").textContent = formatDate(data?.registrationCompletedAt || data?.onboardingCompletedAt || data?.profileCompletedAt);
  byId("profileAccountStatus").textContent = data?.accountLocked === true ? "Temporarily locked" : data?.isActive === false ? "Inactive" : "Active";
  byId("profileAppFirstLogin").textContent = formatDate(data?.lmsAppFirstLoginAt);
  byId("profileAppLastLogin").textContent = formatDate(data?.lmsAppLastLoginAt);
  byId("profileAppFirstPlatform").textContent = displayPlatform(data?.lmsAppFirstPlatform);
  byId("profileAppLastPlatform").textContent = displayPlatform(data?.lmsAppLastPlatform);

  byId("editFullName").value = name;
  byId("editNic").value = String(data?.nicNumber || sessionStorage.getItem("studentNIC") || "");

  byId("recoveryStatusTitle").textContent = recoveryReady ? "Recovery Key saved securely" : "Recovery Key not set up";
  byId("recoveryStatusDetail").textContent = recoveryReady
    ? "A protected verification hash is stored for this account."
    : "Set up a Recovery Key to protect password recovery.";
  byId("replaceRecoveryOpen").textContent = recoveryReady ? "Replace Recovery Key" : "Set up Recovery Key";

  setVisible(byId("profileLoading"), false);
  setVisible(byId("profileContent"), true);
}

async function loadProfile() {
  try {
    if (sessionStorage.getItem("loggedIn") !== "true" || !studentId) {
      window.location.replace("index.html");
      return;
    }
    const snapshot = await getDoc(studentRef);
    if (!snapshot.exists()) {
      setMessage(byId("profileEditMessage"), "Student account could not be found. Please contact the administrator.", "error");
      setVisible(byId("profileLoading"), false);
      return;
    }
    const data = snapshot.data() || {};
    renderProfile(data);
  } catch (error) {
    console.error("Could not load student profile:", error);
    setMessage(byId("profileEditMessage"), "Could not load your profile. Check your connection and try again.", "error");
    setVisible(byId("profileLoading"), false);
  }
}

async function getFreshStudentAfterPasswordCheck(password) {
  const snapshot = await getDoc(studentRef);
  if (!snapshot.exists()) throw new Error("Student account could not be found.");
  const data = snapshot.data() || {};
  const savedPassword = String(data.password ?? "").trim();
  if (!password || savedPassword !== String(password).trim()) {
    throw new Error("The current password is incorrect.");
  }
  return data;
}

function validateName(value) {
  const clean = String(value || "").trim().replace(/\s+/g, " ");
  return clean.length >= 3 ? clean : "";
}

function validateNic(value) {
  const clean = String(value || "").trim().toUpperCase().replace(/\s+/g, "");
  return /^\d{9}[VX]$/.test(clean) || /^\d{12}$/.test(clean) ? clean : "";
}

byId("editProfileOpen")?.addEventListener("click", () => {
  const form = byId("editProfileForm");
  setVisible(form, Boolean(form?.hidden));
  if (form && !form.hidden) {
    byId("editFullName").focus();
    setMessage(byId("profileEditMessage"), "Change your name or NIC. Student ID and programme category remain administrator-managed.");
  }
});

byId("cancelProfileEdit")?.addEventListener("click", () => {
  if (currentStudentData) renderProfile(currentStudentData);
  setVisible(byId("editProfileForm"), false);
  byId("editProfilePassword").value = "";
  setMessage(byId("profileEditMessage"), "");
});

byId("editProfileForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  if (submittingProfile) return;

  const name = validateName(byId("editFullName").value);
  const nic = validateNic(byId("editNic").value);
  const password = byId("editProfilePassword").value;

  if (!name) {
    setMessage(byId("profileEditMessage"), "Enter your full name (at least 3 characters).", "error");
    byId("editFullName").focus();
    return;
  }
  if (!nic) {
    setMessage(byId("profileEditMessage"), "Enter a valid NIC number.", "error");
    byId("editNic").focus();
    return;
  }

  submittingProfile = true;
  byId("saveProfileBtn").disabled = true;
  setMessage(byId("profileEditMessage"), "Verifying your password and saving changes…");

  try {
    await getFreshStudentAfterPasswordCheck(password);
    await updateDoc(studentRef, {
      fullName: name,
      name,
      studentName: name,
      nicNumber: nic,
      lastProfileUpdatedAt: Date.now()
    });
    sessionStorage.setItem("studentName", name);
    sessionStorage.setItem("studentNIC", nic);
    byId("editProfilePassword").value = "";
    setMessage(byId("profileEditMessage"), "Your personal details have been updated.", "success");
    await loadProfile();
    setVisible(byId("editProfileForm"), false);
  } catch (error) {
    console.error("Student profile update failed:", error);
    setMessage(byId("profileEditMessage"), error?.message || "Could not save your profile changes.", "error");
  } finally {
    submittingProfile = false;
    byId("saveProfileBtn").disabled = false;
  }
});

byId("replaceRecoveryOpen")?.addEventListener("click", () => {
  const form = byId("replaceRecoveryForm");
  setVisible(form, Boolean(form?.hidden));
  if (form && !form.hidden) {
    byId("recoveryCurrentPassword").focus();
    setMessage(byId("recoveryMessage"), "Confirm your current password before issuing a replacement key.");
  }
});

byId("cancelRecoveryReplace")?.addEventListener("click", () => {
  byId("recoveryCurrentPassword").value = "";
  setVisible(byId("replaceRecoveryForm"), false);
  setMessage(byId("recoveryMessage"), "");
});

byId("replaceRecoveryForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  if (submittingRecovery) return;

  const password = byId("recoveryCurrentPassword").value;
  submittingRecovery = true;
  byId("generateRecoveryBtn").disabled = true;
  setMessage(byId("recoveryMessage"), "Verifying your password…");

  try {
    const freshData = await getFreshStudentAfterPasswordCheck(password);
    setMessage(byId("recoveryMessage"), "The replacement key will be shown once. Save or print it before continuing.", "success");
    const saved = await requireRecoveryCodeSetup(studentRef, studentId, freshData, { forceRegenerate: true });
    if (saved) {
      byId("recoveryCurrentPassword").value = "";
      setVisible(byId("replaceRecoveryForm"), false);
      await loadProfile();
      setMessage(byId("recoveryMessage"), "A new Recovery Key has been saved. Your previous key is no longer valid.", "success");
    }
  } catch (error) {
    console.error("Recovery key replacement could not start:", error);
    setMessage(byId("recoveryMessage"), error?.message || "Could not create a replacement key.", "error");
  } finally {
    submittingRecovery = false;
    byId("generateRecoveryBtn").disabled = false;
  }
});

loadProfile();
