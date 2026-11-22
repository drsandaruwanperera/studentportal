const ORIGINS = new Set([
  "https://drsandaruwanperera.lk",
  "https://www.drsandaruwanperera.lk",
  "https://drsandaruwanperera.github.io"
]);
const PROJECT_FALLBACK = "answersheet2026";
const APP_URL = "https://drsandaruwanperera.lk/studentportal/announcements.html";
const PAGE_SIZE = 25;
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", ...headers }
});
const b64url = bytes => {
  let raw = "";
  for (const byte of new Uint8Array(bytes)) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
};
const pemBytes = pem => Uint8Array.from(atob(String(pem).replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "")), c => c.charCodeAt(0));
const sha256 = async value => {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2, "0")).join("");
};
function corsHeaders(origin) {
  const chosen = ORIGINS.has(origin) ? origin : "https://drsandaruwanperera.lk";
  return {
    "access-control-allow-origin": chosen,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "vary": "Origin"
  };
}
function decodeValue(value) {
  if (!value || typeof value !== "object") return null;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("mapValue" in value) return decodeFields(value.mapValue.fields || {});
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decodeValue);
  return null;
}
function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields || {}).map(([key, value]) => [key, decodeValue(value)]));
}
function encodeValue(value) {
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number" && Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === "number") return { doubleValue: value };
  if (value === null || value === undefined) return { nullValue: null };
  return { stringValue: String(value) };
}
function encodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, encodeValue(value)]));
}
async function readBody(request) {
  try { return await request.json(); } catch { return null; }
}
async function googleAccess(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = b64url(new TextEncoder().encode(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  })));
  const unsigned = header + "." + claims;
  const key = await crypto.subtle.importKey("pkcs8", pemBytes(serviceAccount.private_key), {
    name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"
  }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const assertion = unsigned + "." + b64url(signature);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.access_token) throw new Error("Google service-account authentication failed: " + (result.error_description || result.error || response.status));
  return result.access_token;
}
const firestoreBase = project => "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(project) + "/databases/(default)/documents";
async function firestoreRequest(base, access, path, method = "GET", body = undefined) {
  const response = await fetch(base + "/" + path, {
    method,
    headers: {
      authorization: "Bearer " + access,
      ...(body === undefined ? {} : { "content-type": "application/json" })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}
async function serviceContext(env) {
  if (!env.FIREBASE_SERVICE_ACCOUNT) throw new Error("Firebase service-account secret has not been configured.");
  let serviceAccount;
  try { serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT); }
  catch { throw new Error("FIREBASE_SERVICE_ACCOUNT must contain the complete service-account JSON."); }
  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("Firebase service-account JSON is missing project_id, client_email or private_key.");
  }
  if (serviceAccount.project_id !== PROJECT_FALLBACK) {
    throw new Error("The configured service account does not belong to the LMS Firebase project.");
  }
  const access = await googleAccess(serviceAccount);
  return { access, base: firestoreBase(serviceAccount.project_id), project: serviceAccount.project_id };
}
async function getAdmin(context, username) {
  const direct = await firestoreRequest(context.base, context.access, "admins/" + encodeURIComponent(username));
  let doc = direct.data;
  if (!direct.response.ok && direct.response.status === 404) {
    const query = {
      structuredQuery: {
        from: [{ collectionId: "admins" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "username" },
            op: "EQUAL",
            value: { stringValue: username }
          }
        },
        limit: 1
      }
    };
    const response = await fetch(context.base + ":runQuery", {
      method: "POST",
      headers: { authorization: "Bearer " + context.access, "content-type": "application/json" },
      body: JSON.stringify(query)
    });
    const rows = await response.json().catch(() => []);
    doc = Array.isArray(rows) ? rows.find(x => x.document)?.document : null;
    if (!response.ok) throw new Error("Could not verify the administrator account.");
  } else if (!direct.response.ok) {
    throw new Error("Could not verify the administrator account.");
  }
  return doc ? decodeFields(doc.fields || {}) : null;
}
async function requireSuperAdmin(context, username, password) {
  if (!username || !password) return false;
  const admin = await getAdmin(context, username);
  if (!admin) return false;
  const savedUser = String(admin.username || "").trim().toLowerCase();
  const savedPassword = String(admin.password || "").trim();
  const role = String(admin.role || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  return savedUser === username.trim().toLowerCase()
    && savedPassword === password.trim()
    && ["full", "superadmin", "superadministrator"].includes(role);
}
function audienceMatches(target, grade) {
  const wanted = String(target || "all").toLowerCase();
  const actual = String(grade || "").toLowerCase();
  if (wanted === "all") return true;
  if (wanted === "al") return actual === "al" || actual.startsWith("al");
  return actual === wanted;
}
async function subscribe(request, env, context) {
  const body = await readBody(request);
  const studentId = String(body?.studentId || "").trim().toUpperCase().replace(/\s+/g, "");
  const grade = String(body?.grade || "").trim().toLowerCase();
  const token = String(body?.token || "").trim();
  if (!studentId || studentId.length > 40 || !token || token.length < 20 || token.length > 5000) {
    return json({ error: "A valid student ID and push token are required." }, 400);
  }
  if (!["grade10", "grade11", "al", "al2027", "al2028"].includes(grade)) {
    return json({ error: "Unsupported student group." }, 400);
  }
  const student = await firestoreRequest(context.base, context.access, "students/" + encodeURIComponent(studentId));
  if (!student.response.ok) return json({ error: "Student record was not found. Please sign in again." }, 404);
  const tokenId = await sha256(token);
  const now = new Date().toISOString();
  const fields = {
    token,
    studentId,
    grade,
    updatedAt: now,
    platform: String(body?.platform || "web").slice(0, 40)
  };
  const saved = await firestoreRequest(context.base, context.access, "pushSubscriptions/" + tokenId, "PATCH", { fields: encodeFields(fields) });
  if (!saved.response.ok) return json({ error: "Could not save this notification subscription." }, 502);
  return json({ ok: true, message: "Notifications are enabled for this device." });
}
async function sendPage(request, context) {
  const body = await readBody(request);
  const username = String(body?.username || "").trim();
  const password = String(body?.password || "");
  if (!(await requireSuperAdmin(context, username, password))) {
    return json({ error: "Super Admin credentials were not accepted." }, 403);
  }
  const title = String(body?.title || "").trim().slice(0, 110);
  const messageBody = String(body?.message || "").trim().slice(0, 500);
  const grade = String(body?.grade || "all").trim().toLowerCase();
  if (!title || !messageBody || !["all", "grade10", "grade11", "al", "al2027", "al2028"].includes(grade)) {
    return json({ error: "A title, message and valid audience are required." }, 400);
  }
  const listUrl = new URL(context.base + "/pushSubscriptions");
  listUrl.searchParams.set("pageSize", String(PAGE_SIZE));
  if (body?.pageToken) listUrl.searchParams.set("pageToken", String(body.pageToken));
  const listResponse = await fetch(listUrl, { headers: { authorization: "Bearer " + context.access } });
  const page = await listResponse.json().catch(() => ({}));
  if (!listResponse.ok) return json({ error: "Could not load notification subscribers." }, 502);
  const docs = Array.isArray(page.documents) ? page.documents : [];
  const targets = docs.map(doc => ({ name: doc.name, ...decodeFields(doc.fields || {}) }))
    .filter(x => x.token && audienceMatches(grade, x.grade));
  const destination = APP_URL;
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < targets.length; i += 5) {
    const group = targets.slice(i, i + 5);
    const outcomes = await Promise.all(group.map(async target => {
      const fcmResponse = await fetch("https://fcm.googleapis.com/v1/projects/" + context.project + "/messages:send", {
        method: "POST",
        headers: { authorization: "Bearer " + context.access, "content-type": "application/json" },
        body: JSON.stringify({
          message: {
            token: target.token,
            notification: { title, body: messageBody },
            data: {
              url: destination,
              announcementId: String(body?.announcementId || "")
            },
            webpush: {
              headers: { TTL: "86400", Urgency: "high" },
              notification: {
                icon: "https://drsandaruwanperera.lk/studentportal/icons/dr-sandaruwan-lms-192.png",
                badge: "https://drsandaruwanperera.lk/studentportal/icons/dr-sandaruwan-lms-192.png",
                tag: "dr-sandaruwan-lms-announcement",
                renotify: false
              },
              fcmOptions: { link: destination }
            }
          }
        })
      });
      if (fcmResponse.ok) return true;
      return false;
    }));
    for (const ok of outcomes) ok ? sent++ : failed++;
  }
  return json({
    ok: true,
    sent,
    failed,
    checked: docs.length,
    matched: targets.length,
    nextPageToken: page.nextPageToken || null,
    done: !page.nextPageToken
  });
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (origin && !ORIGINS.has(origin)) return json({ error: "Origin not allowed." }, 403, headers);
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (request.method === "GET" && path === "/health") {
      return json({
        ok: true,
        service: "Dr. Sandaruwan LMS Push",
        configured: Boolean(env.FIREBASE_SERVICE_ACCOUNT),
        project: PROJECT_FALLBACK
      }, 200, headers);
    }
    if (request.method !== "POST" || !["/subscribe", "/send"].includes(path)) {
      return json({ error: "Not found." }, 404, headers);
    }
    try {
      const context = await serviceContext(env);
      const result = path === "/subscribe"
        ? await subscribe(request, env, context)
        : await sendPage(request, context);
      return new Response(result.body, { status: result.status, headers: { ...headers, ...Object.fromEntries(result.headers) } });
    } catch (error) {
      const message = String(error?.message || error || "Unexpected push service error.");
      return json({ error: message }, message.includes("has not been configured") ? 503 : 500, headers);
    }
  }
};
