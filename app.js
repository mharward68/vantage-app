/* ==========================================================================
   🚀 VANTAGE PRM - CENTRALIZED APPLICATION CONTROLLER
   ========================================================================== */

let state = {
  companies: [],
  prospects: [],
  media: [],
  campaigns: [],
  activeView: "dashboard",
  selectedProspectId: null,
  activeProspectFilterCompany: "all",
  activeMediaFilterStatus: "all",
  activeMediaFilterType: "all",
  activeMediaFilterTags: [],
  forceShowAllContacts: false,
  forceShowAllCompanies: false,
  customSortOrder: [],
  mediaTypes: ["Article", "Video", "Newsletter"],
  developmentPhases: ["Priority", "Idea", "Draft", "In Review", "Finished", "Published", "This Week", "Next Week", "Archive"],
  platforms: ["YouTube", "Substack", "Medium", "LinkedIn", "Twitter", "General"],
  media_tags: ["Frontend", "React", "Fintech", "Developer", "General"],
  company_tags: ["Enterprise", "SMB", "Agency", "Startup"],
  emailAccounts: [],
  emailProviders: ["Gmail", "Outlook / Microsoft 365", "Zoho Mail", "Custom SMTP"],
  emailProviderDefaultUrls: {},
  domains: [],
  domainRegistrars: ["GoDaddy", "Namecheap", "Cloudflare", "Porkbun"],
  domainHosts: ["Cloudflare", "AWS Route 53", "Namecheap", "Bluehost"],
  domainRegistrarDefaultUrls: {},
  domainHostDefaultUrls: {},
  theme: "dark"
};

// Global Modals tracking variables
let editingProspectId = null;
let editingMediaId = null;
let pendingAttachedFiles = []; // Memory tracker for files during media modal session
let editingPublishEventId = null; // Track current publish event being edited
let editingMasterFileId = null; // Track master file being edited/linked

// Tag selection globals
let currentProspectTags = [];
let currentCompanyTags = [];
let currentCampaignTags = [];
let tagSelectionTarget = "media"; // "media", "prospect", "company", or "campaign"

// Media type icon glyphs — shared between the Media Hub type filter bar and
// the type badge on each media card. Falls back to a generic folder icon
// for any custom type added via Settings that isn't listed here.
const MEDIA_TYPE_ICON_GLYPHS = {
  "Article": "📄",
  "Video": "🎥",
  "Newsletter": "✉️",
  "Post": "📢",
  "Sequence": "🔁",
  "Graphic": "🖼️"
};

function getMediaTypeIcon(type) {
  return MEDIA_TYPE_ICON_GLYPHS[type] || "📁";
}

// Status Pipeline (development phase) icon glyphs — shared between the
// Media Hub status filter bar and every status dropdown (media card select,
// Content Dashboard select) so the icons always stay in sync. Falls back to
// no icon for any custom phase added via Settings that isn't listed here.
const DEVELOPMENT_PHASE_ICON_GLYPHS = {
  "Priority": "🌟",
  "Idea": "💡",
  "Draft": "📝",
  "In Review": "🔍",
  "Finished": "✅",
  "Published": "📢",
  "This Week": "🗓️",
  "Next Week": "🔜",
  "Archive": "📦"
};

function getDevelopmentPhaseIcon(phase) {
  return DEVELOPMENT_PHASE_ICON_GLYPHS[phase] || "";
}

// Email Account status icon glyphs — shared between the Email Accounts
// status filter bar, table rows, and the Add/Edit modal's status select.
const EMAIL_ACCOUNT_STATUS_ICON_GLYPHS = {
  "Active": "🟢",
  "Warming": "🌡️",
  "Paused": "⏸️",
  "Banned": "🚫"
};

function getEmailAccountStatusIcon(status) {
  return EMAIL_ACCOUNT_STATUS_ICON_GLYPHS[status] || "";
}

// Domain status icon glyphs — shared between the Domain Management status
// filter bar, table rows, and the Add/Edit modal's status select.
const DOMAIN_STATUS_ICON_GLYPHS = {
  "Active": "🟢",
  "Expiring Soon": "⏳",
  "Expired": "🔴",
  "Parked": "🅿️"
};

function getDomainStatusIcon(status) {
  return DOMAIN_STATUS_ICON_GLYPHS[status] || "";
}

const DOMAIN_DNS_HEALTH_ICON_GLYPHS = {
  "Configured": "✅",
  "Partial": "⚠️",
  "Not Configured": "❌"
};

function getDomainDnsHealthIcon(dnsHealth) {
  return DOMAIN_DNS_HEALTH_ICON_GLYPHS[dnsHealth] || "";
}

// Seed values only — one-time starting point copied into
// state.domainRegistrarDefaultUrls / state.domainHostDefaultUrls /
// state.emailProviderDefaultUrls the first time the app runs. From then on
// the *state* copies are the source of truth: they're user-editable from
// Settings (each provider/registrar/host row has a "Default URL" input) and
// travel with backup/restore. Never read these seed consts directly outside
// ensureStateDefaults() — always look up state.*DefaultUrls instead.
const DOMAIN_REGISTRAR_DASHBOARD_URL_SEED = {
  "GoDaddy": "https://dcc.godaddy.com/manage",
  "Namecheap": "https://ap.www.namecheap.com/domains/list",
  "Cloudflare": "https://dash.cloudflare.com",
  "Porkbun": "https://porkbun.com/account/domainsSpeedy"
};

const DOMAIN_HOST_DASHBOARD_URL_SEED = {
  "Cloudflare": "https://dash.cloudflare.com",
  "AWS Route 53": "https://console.aws.amazon.com/route53/v2/hostedzones",
  "Namecheap": "https://ap.www.namecheap.com/domains/list",
  "Bluehost": "https://my.bluehost.com/hosting/app"
};

const EMAIL_PROVIDER_DASHBOARD_URL_SEED = {
  "Gmail": "https://mail.google.com/mail/u/0/",
  "Outlook / Microsoft 365": "https://outlook.office.com/mail/",
  "Zoho Mail": "https://mail.zoho.com/",
  "Custom SMTP": ""
};

/* ==========================================================================
   💾 INDEXEDDB MANAGER (VantageDB) FOR MULTI-FILE BINARY STORAGE
   ========================================================================== */
let fileDB;

function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VantagePRMFiles", 2);
    request.onupgradeneeded = function(e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("handles")) {
        db.createObjectStore("handles", { keyPath: "id" });
      }
    };
    request.onsuccess = function(e) {
      fileDB = e.target.result;
      console.log("[IndexedDB] VantagePRMFiles database connected.");
      resolve();
    };
    request.onerror = function(e) {
      console.error("[IndexedDB] Database connection error:", e.target.error);
      reject(e.target.error);
    };
  });
}

function saveFileBlob(id, blob) {
  return new Promise((resolve, reject) => {
    if (!fileDB) {
      console.error("[IndexedDB] Database not initialized.");
      return reject("DB not initialized");
    }
    const transaction = fileDB.transaction(["files"], "readwrite");
    const store = transaction.objectStore("files");
    const request = store.put({ id, blob });
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

function getFileBlob(id) {
  return new Promise((resolve, reject) => {
    if (!fileDB) return reject("DB not initialized");
    const transaction = fileDB.transaction(["files"], "readonly");
    const store = transaction.objectStore("files");
    const request = store.get(id);
    request.onsuccess = (e) => resolve(e.target.result ? e.target.result.blob : null);
    request.onerror = (e) => reject(e.target.error);
  });
}

function deleteFileBlob(id) {
  return new Promise((resolve, reject) => {
    if (!fileDB) return reject("DB not initialized");
    const transaction = fileDB.transaction(["files"], "readwrite");
    const store = transaction.objectStore("files");
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

/* ==========================================================================
   📁 BACKUP FOLDER (File System Access API)
   Desktop Chrome/Edge/Opera only — window.showDirectoryPicker() is not
   available in Firefox, Safari, or any mobile browser. When unsupported,
   every function below no-ops or is skipped, and callers silently fall
   back to the existing download-dialog / drag-and-drop behavior.
   ========================================================================== */
const SUPPORTS_FS_ACCESS = typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
let backupFolderSessionDisabled = false;

function saveBackupFolderHandle(handle) {
  return new Promise((resolve, reject) => {
    if (!fileDB) return reject("DB not initialized");
    const tx = fileDB.transaction(["handles"], "readwrite");
    tx.objectStore("handles").put({ id: "backupFolder", handle });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

function getStoredBackupFolderHandle() {
  return new Promise((resolve) => {
    if (!fileDB) return resolve(null);
    try {
      const tx = fileDB.transaction(["handles"], "readonly");
      const req = tx.objectStore("handles").get("backupFolder");
      req.onsuccess = (e) => resolve(e.target.result ? e.target.result.handle : null);
      req.onerror = () => resolve(null);
    } catch (err) {
      resolve(null);
    }
  });
}

function clearBackupFolderHandle() {
  return new Promise((resolve) => {
    if (!fileDB) return resolve();
    const tx = fileDB.transaction(["handles"], "readwrite");
    tx.objectStore("handles").delete("backupFolder");
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

// Verifies (and if needed, requests) readwrite permission on a stored
// directory handle, and confirms the folder is still actually there.
// Returns false on any failure — callers should fall back to a normal
// download rather than throw.
async function ensureFolderWritePermission(handle) {
  try {
    const opts = { mode: "readwrite" };
    let perm = await handle.queryPermission(opts);
    if (perm !== "granted") {
      perm = await handle.requestPermission(opts);
    }
    if (perm !== "granted") return false;
    // Touch the directory to confirm it still exists on disk.
    await handle.values().next();
    return true;
  } catch (err) {
    console.error("[Backup Folder] Folder is no longer accessible:", err);
    return false;
  }
}

// Lets the user pick (or change) the folder Vantage saves backups into.
async function chooseBackupFolder() {
  if (!SUPPORTS_FS_ACCESS) return;
  try {
    const handle = await window.showDirectoryPicker({ id: "vantage-backup-folder", mode: "readwrite" });
    const perm = await handle.requestPermission({ mode: "readwrite" });
    if (perm !== "granted") {
      alert("Vantage needs write access to this folder to save backups there.");
      return;
    }
    await saveBackupFolderHandle(handle);
    backupFolderSessionDisabled = false;
    await updateBackupFolderUI();
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("[Backup Folder] Choose failed:", err);
      alert("Couldn't set that folder as your backup location.");
    }
  }
}

// Refreshes the "Backup Folder" display in Data Management.
async function updateBackupFolderUI() {
  const nameEl = document.getElementById("backup-folder-name");
  if (!nameEl) return;
  const handle = SUPPORTS_FS_ACCESS ? await getStoredBackupFolderHandle() : null;
  const chooseBtn = document.getElementById("btn-choose-backup-folder");
  if (handle) {
    nameEl.textContent = handle.name;
    nameEl.title = `Backups save directly into the "${handle.name}" folder.`;
    if (chooseBtn) chooseBtn.textContent = "Change Folder";
  } else {
    nameEl.textContent = "Not set";
    nameEl.title = "";
    if (chooseBtn) chooseBtn.textContent = "Choose Folder";
  }
}

// Central write path for every backup export (CSV or ZIP/JSON blob).
// Saves directly into the chosen backup folder when one is set and the
// browser supports it; otherwise falls back to a normal file download.
async function saveBackupFile(name, content) {
  const blob = (content instanceof Blob)
    ? content
    : new Blob([content], { type: name.endsWith(".json") ? "application/json" : "text/csv;charset=utf-8;" });

  if (SUPPORTS_FS_ACCESS && !backupFolderSessionDisabled) {
    const handle = await getStoredBackupFolderHandle();
    if (handle) {
      const ok = await ensureFolderWritePermission(handle);
      if (ok) {
        try {
          const fileHandle = await handle.getFileHandle(name, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          return true;
        } catch (err) {
          console.error("[Backup Folder] Write failed:", err);
          backupFolderSessionDisabled = true;
          alert(`Couldn't save to your backup folder "${handle.name}" — it may have been moved, renamed, or deleted.\n\nFiles will download normally for the rest of this session. Re-choose your backup folder in Data Management if you'd like to fix this.`);
        }
      }
    }
  }
  downloadBlob(name, blob);
  return false;
}

// Opens a native file picker (starting inside the backup folder when one
// is set) and feeds the chosen file into the existing restore pipeline.
async function restoreFromBackupFolder() {
  if (!SUPPORTS_FS_ACCESS) return;
  const handle = await getStoredBackupFolderHandle();
  const pickerOpts = {
    types: [{
      description: "Vantage Backup Files",
      accept: {
        "application/zip": [".zip"],
        "text/csv": [".csv"],
        "application/json": [".json"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
      }
    }],
    excludeAcceptAllOption: false,
    multiple: false
  };
  if (handle) pickerOpts.startIn = handle;

  let fileHandles;
  try {
    fileHandles = await window.showOpenFilePicker(pickerOpts);
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("[Restore] File picker failed:", err);
      alert("Couldn't open the file picker.");
    }
    return;
  }
  const file = await fileHandles[0].getFile();
  processRestoreFile(file, null);
}

/* ==========================================================================
   📸 LOCAL SNAPSHOTS (Tier 1 recovery) — phase-1 contracts C12 / C13
   --------------------------------------------------------------------------
   Automatic, debounced state snapshots written into <backup folder>/snapshots/.

   Three rules this code exists to enforce, all from DIRECTIVES §0 / C13:

     1. A write is confirmed by READ-BACK, never by close() resolving.
        lastConfirmedAt is stamped in exactly one place — writeSnapshotNow().
     2. The WATCHDOG decides the health state, not the error handler. Red is
        derived from staleness, so it fires for causes nobody anticipated
        (a cleared debounce, an exception upstream of the try block, a hook
        lost in a later refactor). An error handler cannot catch "it simply
        never ran."
     3. There is NO DOWNLOAD FALLBACK. This path must never call
        saveBackupFile() (which degrades to downloadBlob()) and must never
        read backupFolderSessionDisabled (one failed manual export would
        otherwise silently disable snapshots for the rest of the session).
        A failed snapshot writes nothing and goes red.

   state.snapshotHealth is deliberately NOT covered by backup/restore. It
   describes this machine's filesystem, not the user's data — restoring a
   stale lastConfirmedAt would make the app claim protection it does not
   have. It is stripped on write and recomputed from the directory on boot.
   ========================================================================== */

const SNAPSHOT_DIR = "snapshots";
const SNAPSHOT_FILES_DIR = "files";    // <backup folder>/snapshots/files/ — C12.
                                       // NEVER touched by the pruner.
const SNAPSHOT_KEEP_ROLLING = 10;      // C12 rule 1 — last 10 rolling
const SNAPSHOT_KEEP_DAYS = 14;         // C12 rule 2 — newest-of-day × 14
const SNAPSHOT_KEEP_WEEKS = 8;         // C12 rule 3 — newest-of-week × 8
const SNAPSHOT_DEBOUNCE_MS = 120000;   // ~2 min after the last mutation
const SNAPSHOT_RED_GRACE_MS = 300000;  // 5 min = 2 min debounce + 3 min grace
const SNAPSHOT_AMBER_MS = 86400000;    // 24 h with no confirmed snapshot
const SNAPSHOT_WATCHDOG_MS = 60000;    // re-evaluate every 60 s

let snapshotDebounceHandle = null;     // exposed at module scope on purpose:
                                       // clearTimeout(snapshotDebounceHandle)
                                       // from the console is the "silent
                                       // non-execution" drill.
let snapshotWatchdogHandle = null;
let snapshotWriteInFlight = false;
let snapshotRedModalArmed = false;
let snapshotRedModalShownThisSession = false;
let snapshotLastRenderedState = null;
let snapshotLastEmptyCount = 0;
let snapshotLastPruneReport = null;    // last pruneSnapshots() result, for the
                                       // Data Management panel and for drills.
let snapshotLastMirrorDay = null;      // "YYYY-MM-DD" of the last mirror run.
                                       // Deliberately module scope, not state:
                                       // like snapshotHealth it describes this
                                       // machine's filesystem, and unlike
                                       // snapshotHealth it needs no storage at
                                       // all — the mirror is idempotent, so a
                                       // forgotten run costs one directory
                                       // listing and writes nothing.
let snapshotMirrorStats = null;        // { at, added, skipped, total } | null

function freshSnapshotHealth() {
  return {
    lastConfirmedAt: null,  // epoch ms of the last READ-BACK-CONFIRMED snapshot
    lastMutationAt: null,   // epoch ms, stamped by saveState()
    lastError: null,        // { at, kind, message } | null
    failed: false           // sticky — only a confirmed write clears it
  };
}

// C12: <backup folder>/snapshots/vantage_snapshot_<YYYY-MM-DD>_<HHmm><ss>.json
function snapshotFileName(d = new Date()) {
  const p = n => String(n).padStart(2, "0");
  return `vantage_snapshot_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
       + `_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.json`;
}

// The inverse of snapshotFileName(). Returns { at, day } or null when the name
// is not a snapshot name this code wrote.
//
// The FILENAME is the authority on when a snapshot was taken, not the file's
// mtime. C12 encodes the timestamp in the name precisely because it is the one
// field that survives being copied, synced or restored — a backup folder pulled
// down from cloud storage arrives with every mtime set to the copy time, which
// would otherwise make a ten-week-old snapshot look like it was written just
// now. That is the exact lie C13 exists to prevent, so retention and the boot
// freshness check both read the name.
function parseSnapshotName(name) {
  const m = /^vantage_snapshot_(\d{4})-(\d{2})-(\d{2})_(\d{2})(\d{2})(\d{2})\.json$/.exec(name);
  if (!m) return null;
  const t = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  if (isNaN(t.getTime())) return null;
  return { at: t.getTime(), day: `${m[1]}-${m[2]}-${m[3]}` };
}

function snapshotDayKey(ms) {
  const d = new Date(ms);
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Monday-anchored week bucket, expressed as that Monday's date key.
function snapshotWeekKey(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));   // getDay(): Sun=0 → Mon=0
  return snapshotDayKey(d.getTime());
}

// Reuses the existing persisted directory handle and its re-permission check
// (assumption 7), but NOT saveBackupFile() and NOT backupFolderSessionDisabled.
async function getSnapshotDirHandle(create = false) {
  if (!SUPPORTS_FS_ACCESS) return null;
  const root = await getStoredBackupFolderHandle();
  if (!root) return null;
  const ok = await ensureFolderWritePermission(root);
  if (!ok) return null;
  try {
    return await root.getDirectoryHandle(SNAPSHOT_DIR, { create });
  } catch (err) {
    return null;
  }
}

// Returns an array newest-first, or null when the directory cannot be read
// at all — null is itself a red state, per C13.
//
// ZERO-BYTE FILES ARE NOT SNAPSHOTS and are skipped here. This is not
// defensive tidiness — it is the same confirmation standard writeSnapshotNow()
// applies, enforced on the read side. A beforeunload write that the page dies
// in the middle of leaves a real, zero-byte, correctly-named file on disk;
// without this filter the next boot reads it as the newest snapshot, stamps
// lastConfirmedAt from it, and reports GREEN while the newest snapshot on disk
// is empty. Observed 2026-08-29, Session 1.1. Do not remove this check.
async function listSnapshotFiles() {
  const dir = await getSnapshotDirHandle(false);
  if (!dir) return null;
  const out = [];
  let empties = 0;
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind !== "file") continue;
    if (!name.startsWith("vantage_snapshot_") || !name.endsWith(".json")) continue;
    const f = await handle.getFile();
    if (f.size === 0) { empties++; continue; }
    const parsed = parseSnapshotName(name);
    out.push({
      name,
      size: f.size,
      lastModified: f.lastModified,
      // `at` is when the snapshot was TAKEN, per the filename. mtime is only a
      // fallback for a name this code did not write. See parseSnapshotName().
      at: parsed ? parsed.at : f.lastModified
    });
  }
  if (empties !== snapshotLastEmptyCount) {
    if (empties) console.warn(`[Snapshot] Ignoring ${empties} zero-byte snapshot file(s) — truncated writes, not snapshots.`);
    snapshotLastEmptyCount = empties;
  }
  out.sort((a, b) => b.at - a.at);
  return out;
}

// snapshotHealth never rides in a snapshot — see the header comment.
function buildSnapshotPayload() {
  const { snapshotHealth, ...rest } = state;
  return JSON.stringify(rest);
}

function markSnapshotFailure(kind, message) {
  if (!state.snapshotHealth) state.snapshotHealth = freshSnapshotHealth();
  state.snapshotHealth.failed = true;
  state.snapshotHealth.lastError = { at: Date.now(), kind, message };
  console.error(`[Snapshot] FAILED (${kind}): ${message}`);
  evaluateSnapshotHealth();
}

// The ONLY place lastConfirmedAt is stamped, and only after read-back.
async function writeSnapshotNow(reason = "debounce") {
  if (!SUPPORTS_FS_ACCESS) return false;
  if (!state.snapshotHealth) state.snapshotHealth = freshSnapshotHealth();
  if (snapshotWriteInFlight) return false;
  snapshotWriteInFlight = true;
  const name = snapshotFileName();
  try {
    const dir = await getSnapshotDirHandle(true);
    if (!dir) {
      markSnapshotFailure("no-folder", "Backup folder is not set, unreachable, or write permission was refused.");
      return false;
    }
    const fileHandle = await dir.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(new Blob([buildSnapshotPayload()], { type: "application/json" }));
    await writable.close();

    // close() resolving means the call did not throw. It does not mean the
    // file exists. Look it up again and confirm a non-zero size.
    const verifyHandle = await dir.getFileHandle(name);
    const verifyFile = await verifyHandle.getFile();
    if (!verifyFile || verifyFile.size === 0) {
      markSnapshotFailure("empty-readback", `${name} read back as ${verifyFile ? verifyFile.size : "missing"} bytes.`);
      return false;
    }

    state.snapshotHealth.lastConfirmedAt = verifyFile.lastModified || Date.now();
    state.snapshotHealth.failed = false;
    state.snapshotHealth.lastError = null;
    console.log(`[Snapshot] Confirmed ${name} — ${verifyFile.size} bytes (${reason})`);

    // Housekeeping runs on the back of a confirmed write, which is the only
    // moment we know the folder is reachable and writable. Both feed the same
    // health state on failure (C13 rule 4), so neither can fail quietly.
    await pruneSnapshots(dir);
    await mirrorSnapshotBlobs(dir);

    evaluateSnapshotHealth();
    return true;
  } catch (err) {
    markSnapshotFailure("write-error", (err && err.message) ? err.message : String(err));
    return false;
  } finally {
    snapshotWriteInFlight = false;
  }
}

function scheduleSnapshot() {
  if (!SUPPORTS_FS_ACCESS) return;
  if (snapshotDebounceHandle) clearTimeout(snapshotDebounceHandle);
  snapshotDebounceHandle = setTimeout(() => {
    snapshotDebounceHandle = null;
    writeSnapshotNow("debounce");
  }, SNAPSHOT_DEBOUNCE_MS);
}

/* --- Retention (C12) ------------------------------------------------------
   Three overlapping keep-rules: last 10 rolling, newest-of-day for 14 days,
   newest-of-week for 8 weeks. A file surviving ANY ONE rule is kept — the
   rules are a union, never an intersection, so the arithmetic can only ever
   err toward keeping too much.

   Two things this must never do:

     1. Touch snapshots/files/. That directory is the attachment mirror and is
        excluded by C12. It is skipped three times over: entries whose kind is
        not "file", entries whose name does not match the snapshot pattern, and
        an explicit name guard. Deleting it would silently strip every
        attachment from every snapshot that references one.
     2. Delete a file it does not understand. An unparseable name is left
        alone rather than swept — if something else is writing into this
        folder, that is the user's business, not the pruner's.

   Zero-byte snapshot files ARE swept. They are the corpses of a beforeunload
   write the page died in the middle of (see listSnapshotFiles) — correctly
   named, entirely empty, already ignored everywhere else, and otherwise
   accumulating one console warning per boot forever.

   The day and week buckets are the most recent buckets that CONTAIN snapshots,
   not the last 14 calendar days counted back from today. After a fortnight
   away from the app, the calendar reading would keep nothing under rules 2 and
   3 and collapse retention to the rolling 10 on the very first run back —
   pruning history precisely when it is least replaceable.                    */
// The retention rules themselves, as a pure function over
// [{ name, at, day, week }] → Map(name → [reasons kept]). Pure and separate
// from the directory walk on purpose: this is the one piece of Phase 1 with no
// precedent anywhere in app.js, and a function that only takes an array can be
// exercised against a decade of fabricated dates without touching a disk.
// A name absent from the returned map survived no rule and is deletable.
function planSnapshotRetention(files) {
  const sorted = files.slice().sort((a, b) => b.at - a.at);   // newest first
  const reasons = new Map();
  const mark = (name, why) => {
    if (!reasons.has(name)) reasons.set(name, []);
    reasons.get(name).push(why);
  };

  // Rule 1 — the N newest, whatever their dates.
  sorted.slice(0, SNAPSHOT_KEEP_ROLLING).forEach(f => mark(f.name, "rolling-10"));

  // Rules 2 and 3 — the newest file in each of the N most recent buckets.
  // sorted is newest-first, so the first file seen for a bucket IS its newest.
  const firstPerBucket = (key) => {
    const seen = new Set();
    const out = [];
    for (const f of sorted) {
      if (seen.has(f[key])) continue;
      seen.add(f[key]);
      out.push(f);
    }
    return out;
  };
  firstPerBucket("day").slice(0, SNAPSHOT_KEEP_DAYS).forEach(f => mark(f.name, "newest-of-day"));
  firstPerBucket("week").slice(0, SNAPSHOT_KEEP_WEEKS).forEach(f => mark(f.name, "newest-of-week"));

  return reasons;
}

async function pruneSnapshots(dirHandle = null) {
  const dir = dirHandle || await getSnapshotDirHandle(false);
  if (!dir) {
    markSnapshotFailure("prune-error", "Snapshots folder unreachable — retention did not run.");
    return null;
  }

  const files = [];
  const empties = [];
  try {
    for await (const [name, handle] of dir.entries()) {
      if (name === SNAPSHOT_FILES_DIR) continue;      // C12: never the mirror
      if (handle.kind !== "file") continue;
      const parsed = parseSnapshotName(name);
      if (!parsed) continue;                          // not ours — leave it
      const f = await handle.getFile();
      if (f.size === 0) { empties.push(name); continue; }
      files.push({ name, at: parsed.at, day: parsed.day, week: snapshotWeekKey(parsed.at) });
    }
  } catch (err) {
    markSnapshotFailure("prune-error", `Could not read the snapshots folder: ${(err && err.message) || err}`);
    return null;
  }

  files.sort((a, b) => b.at - a.at);                  // newest first

  const reasons = planSnapshotRetention(files);
  const doomed = files.filter(f => !reasons.has(f.name)).map(f => f.name);
  const removed = [];
  const failures = [];
  for (const name of doomed.concat(empties)) {
    try {
      await dir.removeEntry(name);
      removed.push(name);
    } catch (err) {
      failures.push(`${name}: ${(err && err.message) || err}`);
    }
  }

  snapshotLastPruneReport = {
    at: Date.now(),
    scanned: files.length,
    kept: files.filter(f => reasons.has(f.name))
               .map(f => ({ name: f.name, why: reasons.get(f.name) })),
    removed,
    emptiesRemoved: empties.length,
    failures
  };

  if (removed.length || empties.length) {
    console.log(`[Snapshot] Pruned ${removed.length} file(s) — ${empties.length} zero-byte, `
      + `${removed.length - empties.length} aged out. ${snapshotLastPruneReport.kept.length} kept.`);
  }
  // C13 rule 4: a retention failure is not given a quieter path than a write
  // failure. It goes red like anything else.
  if (failures.length) {
    markSnapshotFailure("prune-error", `Could not delete ${failures.length} snapshot file(s): ${failures[0]}`);
  }
  return snapshotLastPruneReport;
}

/* --- Binary mirror (C12) --------------------------------------------------
   A snapshot is state JSON. Attachments live in IndexedDB and are not in it,
   so a snapshot restored without them is text-only: every media record still
   lists its files and not one of them opens. The mirror is what makes a
   restored snapshot complete.

   Deduped by blob id, which is safe because ids are unique-per-upload and a
   blob is never rewritten under an existing id — a file already in the mirror
   is byte-identical to the one in IndexedDB. Mirrored files are never deleted,
   including when the attachment is deleted in the app: an older snapshot may
   still reference it, and a recovery mirror that forgets in step with the live
   database is not a recovery mirror.                                          */
function listAllFileBlobIds() {
  return new Promise((resolve, reject) => {
    if (!fileDB) return resolve([]);
    try {
      const tx = fileDB.transaction(["files"], "readonly");
      const req = tx.objectStore("files").getAllKeys();
      req.onsuccess = (e) => resolve((e.target.result || []).map(String));
      req.onerror = (e) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

async function getSnapshotFilesDirHandle(dir, create = false) {
  return dir.getDirectoryHandle(SNAPSHOT_FILES_DIR, { create });
}

async function mirrorSnapshotBlobs(dirHandle = null, opts = {}) {
  const today = snapshotDayKey(Date.now());
  if (!opts.force && snapshotLastMirrorDay === today) return snapshotMirrorStats;

  const dir = dirHandle || await getSnapshotDirHandle(true);
  if (!dir) {
    markSnapshotFailure("mirror-error", "Backup folder unreachable — attachments were not mirrored.");
    return null;
  }

  try {
    const filesDir = await getSnapshotFilesDirHandle(dir, true);
    const alreadyMirrored = new Set();
    for await (const [name, h] of filesDir.entries()) {
      if (h.kind === "file") alreadyMirrored.add(name);
    }

    const ids = await listAllFileBlobIds();
    let added = 0, skipped = 0, absent = 0;
    for (const id of ids) {
      if (alreadyMirrored.has(id)) { skipped++; continue; }
      const blob = await getFileBlob(id);
      if (!blob) { absent++; continue; }
      const fh = await filesDir.getFileHandle(id, { create: true });
      const writable = await fh.createWritable();
      await writable.write(blob);
      await writable.close();
      // Same read-back standard the snapshot writer uses (C13 D). close()
      // resolving is not evidence that the file exists.
      const back = await (await filesDir.getFileHandle(id)).getFile();
      if (!back || back.size === 0) throw new Error(`${id} mirrored as ${back ? back.size : "missing"} bytes`);
      added++;
    }

    snapshotLastMirrorDay = today;
    snapshotMirrorStats = {
      at: Date.now(),
      added,
      skipped,
      absent,
      total: alreadyMirrored.size + added
    };
    console.log(`[Snapshot] Mirror (${opts.force ? "forced" : "daily"}): ${added} added, `
      + `${skipped} already mirrored, ${snapshotMirrorStats.total} blob(s) in ${SNAPSHOT_DIR}/${SNAPSHOT_FILES_DIR}/`);
    renderSnapshotStatusPanel();
    return snapshotMirrorStats;
  } catch (err) {
    // C13 rule 4 again: same health state, same red, no quieter path.
    markSnapshotFailure("mirror-error", `Attachment mirror failed: ${(err && err.message) || err}`);
    return null;
  }
}

// Pulls back every attachment the restored state references but IndexedDB no
// longer holds. Called after a snapshot restore — this is the half of "restore"
// that applyJSONBackupText() cannot do, because state JSON has no blobs in it.
async function restoreBlobsFromMirror() {
  const empty = { recovered: 0, alreadyPresent: 0, missing: 0, mirrored: 0, unreachable: true };
  const dir = await getSnapshotDirHandle(false);
  if (!dir) return empty;
  let filesDir;
  try {
    filesDir = await getSnapshotFilesDirHandle(dir, false);
  } catch (err) {
    return empty;   // no mirror directory yet — nothing to recover from
  }

  const mirrored = new Set();
  for await (const [name, h] of filesDir.entries()) {
    if (h.kind === "file") mirrored.add(name);
  }

  const referenced = new Set();
  (state.media || []).forEach(m => {
    (m.files || []).forEach(f => { if (f && f.id) referenced.add(String(f.id)); });
    (m.masterFiles || []).forEach(f => { if (f && f.id) referenced.add(String(f.id)); });
  });

  let present;
  try { present = new Set(await listAllFileBlobIds()); }
  catch (err) { present = new Set(); }

  let recovered = 0, alreadyPresent = 0, missing = 0;
  for (const id of referenced) {
    if (present.has(id)) { alreadyPresent++; continue; }
    if (!mirrored.has(id)) { missing++; continue; }
    try {
      const blob = await (await filesDir.getFileHandle(id)).getFile();
      await saveFileBlob(id, blob);
      recovered++;
    } catch (err) {
      console.error(`[Snapshot] Could not recover attachment ${id}:`, err);
      missing++;
    }
  }
  return { recovered, alreadyPresent, missing, mirrored: mirrored.size, unreachable: false };
}

/* --- Watchdog -------------------------------------------------------------
   Red is derived from staleness rather than from a caught exception. The
   contract line "lastMutationAt > lastConfirmedAt by more than 5 minutes" is
   implemented as BOTH readings, OR'd: the snapshot is more than 5 min behind
   the mutation, or an unprotected mutation has been sitting for 5 min. The
   second is what makes the "clearTimeout the debounce and wait" drill go red;
   the first is the literal text. OR'ing them can only over-report risk, never
   claim protection that isn't there.                                        */
function computeSnapshotState() {
  const h = state.snapshotHealth;
  if (!h) return "red";
  const now = Date.now();
  if (h.failed) return "red";
  if (!h.lastConfirmedAt) return "red";
  const pending = h.lastMutationAt && h.lastMutationAt > h.lastConfirmedAt;
  if (pending && (h.lastMutationAt - h.lastConfirmedAt) > SNAPSHOT_RED_GRACE_MS) return "red";
  if (pending && (now - h.lastMutationAt) > SNAPSHOT_RED_GRACE_MS) return "red";
  if ((now - h.lastConfirmedAt) > SNAPSHOT_AMBER_MS) return "amber";
  return "green";
}

function snapshotStateCopy() {
  const s = computeSnapshotState();
  const h = state.snapshotHealth || {};
  if (s === "green") {
    return {
      label: "Protected",
      detail: `Last confirmed snapshot ${formatSnapshotAge(h.lastConfirmedAt)}.`
    };
  }
  if (s === "amber") {
    return {
      label: "Snapshot stale",
      detail: `No confirmed snapshot in over 24 hours (last: ${formatSnapshotAge(h.lastConfirmedAt)}). `
            + "The snapshot mechanism may have stopped working and nothing has tested it."
    };
  }
  let why;
  if (!h.lastConfirmedAt && !h.failed) why = "No snapshot has ever been confirmed on this machine.";
  else if (h.lastError && h.lastError.kind === "no-folder") why = "Vantage cannot reach your backup folder.";
  else if (h.lastError && h.lastError.kind === "dir-unreadable") why = "The snapshots folder could not be read.";
  else if (h.lastError && h.lastError.kind === "no-snapshots") why = "The snapshots folder is empty.";
  else if (h.failed) why = `The last snapshot attempt failed: ${h.lastError ? h.lastError.message : "unknown error"}`;
  else why = "Changes you have made are newer than the last confirmed snapshot.";
  return {
    label: "Not protected",
    detail: `${why} Your recent changes are not backed up. `
          + "Clicking here re-grants folder access and writes a snapshot immediately."
  };
}

function formatSnapshotAge(ts) {
  if (!ts) return "never";
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} d ago`;
}

function renderSnapshotHealthChip() {
  const chip = document.getElementById("snapshot-health-chip");
  if (!chip) return;
  const s = computeSnapshotState();
  const copy = snapshotStateCopy();
  chip.classList.remove("snapshot-chip-green", "snapshot-chip-amber", "snapshot-chip-red");
  chip.classList.add(`snapshot-chip-${s}`);
  const label = chip.querySelector(".snapshot-chip-label");
  if (label) label.textContent = copy.label;
  chip.title = copy.detail;
}

function evaluateSnapshotHealth() {
  const s = computeSnapshotState();
  renderSnapshotHealthChip();
  renderSnapshotStatusPanel();
  if (s === "red" && snapshotLastRenderedState !== "red" && !snapshotRedModalShownThisSession) {
    snapshotRedModalArmed = true;   // fires on the next user interaction
  }
  snapshotLastRenderedState = s;
  return s;
}

function armSnapshotRedModalListener() {
  const fire = () => {
    if (!snapshotRedModalArmed || snapshotRedModalShownThisSession) return;
    if (computeSnapshotState() !== "red") { snapshotRedModalArmed = false; return; }
    snapshotRedModalArmed = false;
    snapshotRedModalShownThisSession = true;
    const copy = snapshotStateCopy();
    setTimeout(() => {
      alert("⚠️ Vantage is not backing up your data.\n\n"
        + copy.detail.replace("Clicking here", 'Clicking the red "Not protected" chip in the sidebar')
        + "\n\nNothing has been lost. Until a snapshot is confirmed, changes exist only in this browser.");
    }, 0);
  };
  document.addEventListener("pointerdown", fire, true);
  document.addEventListener("keydown", fire, true);
}

async function handleSnapshotChipClick() {
  const chip = document.getElementById("snapshot-health-chip");
  const label = chip ? chip.querySelector(".snapshot-chip-label") : null;
  const restore = label ? label.textContent : null;
  if (chip) chip.disabled = true;
  if (label) label.textContent = "Snapshotting…";
  try {
    // The click is the user gesture the File System Access API needs, which is
    // why the thing that reports the problem is also the thing that fixes it.
    let root = await getStoredBackupFolderHandle();
    if (!root) {
      await chooseBackupFolder();
      root = await getStoredBackupFolderHandle();
    }
    if (root) await ensureFolderWritePermission(root);
    await writeSnapshotNow("chip-click");
  } finally {
    if (chip) chip.disabled = false;
    if (label && restore) label.textContent = restore;
    evaluateSnapshotHealth();
  }
}

/* --- Data Management panel ------------------------------------------------ */

async function renderSnapshotStatusPanel() {
  const summary = document.getElementById("snapshot-status-summary");
  if (!summary) return;
  // This panel lists the snapshots directory, which means a getFile() per
  // entry. evaluateSnapshotHealth() runs on every saveState() and every
  // watchdog tick, so rendering it while the panel is off-screen would put a
  // directory walk behind every keystroke-level mutation in the app. The
  // sidebar chip is the always-on surface; this one only refreshes when the
  // Data Management view is actually showing.
  if (state.activeView !== "data-management") return;
  const h = state.snapshotHealth || {};
  const s = computeSnapshotState();
  const dot = { green: "🟢", amber: "🟡", red: "🔴" }[s];
  let files = null;
  try { files = await listSnapshotFiles(); } catch (err) { files = null; }
  const count = files === null ? "—" : files.length;
  summary.textContent = `${dot} ${snapshotStateCopy().label} · last confirmed: `
    + (h.lastConfirmedAt ? new Date(h.lastConfirmedAt).toLocaleString() : "never")
    + ` · ${count} snapshot${count === 1 ? "" : "s"} on disk`;

  const mirrorEl = document.getElementById("snapshot-mirror-summary");
  if (mirrorEl) {
    if (!snapshotMirrorStats) {
      mirrorEl.textContent = "📎 Attachments not mirrored yet this session.";
    } else {
      const m = snapshotMirrorStats;
      // Kept to two facts deliberately. The retention numbers live in
      // snapshotLastPruneReport for drills; on screen they only pushed this
      // line past the panel width, and a status line that truncates is a
      // status line that can mislead.
      mirrorEl.textContent = `📎 ${m.total} attachment${m.total === 1 ? "" : "s"} mirrored`
        + ` · ${formatSnapshotAge(m.at)}`
        + (m.added ? ` (+${m.added})` : "");
    }
  }

  const select = document.getElementById("snapshot-restore-select");
  if (select) {
    const prev = select.value;
    select.innerHTML = "";
    if (!files || files.length === 0) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = files === null ? "Snapshots folder unreadable" : "No snapshots yet";
      select.appendChild(o);
      select.disabled = true;
    } else {
      select.disabled = false;
      files.forEach(f => {
        const o = document.createElement("option");
        o.value = f.name;
        o.textContent = `${new Date(f.at).toLocaleString()} — ${formatFileSize(f.size)}`;
        select.appendChild(o);
      });
      if (prev && files.some(f => f.name === prev)) select.value = prev;
    }
  }
}

// Routed through the same JSON restore engine the manual .json backup uses.
// Callable from the console with an explicit filename — no dialog in the way.
async function restoreFromSnapshotFile(name) {
  const dir = await getSnapshotDirHandle(false);
  if (!dir) { alert("Can't reach the snapshots folder."); return false; }
  let text;
  try {
    const fh = await dir.getFileHandle(name);
    text = await (await fh.getFile()).text();
  } catch (err) {
    alert(`Couldn't read snapshot "${name}".`);
    return false;
  }
  if (!applyJSONBackupText(text, `snapshot ${name}`)) return false;

  // State JSON carries no binaries. Without this step a restored snapshot is
  // text-only: every media record lists its attachments and none of them open.
  const blobs = await restoreBlobsFromMirror();
  console.log(`[Snapshot] Attachment recovery: ${blobs.recovered} recovered, `
    + `${blobs.alreadyPresent} already present, ${blobs.missing} unrecoverable `
    + `(${blobs.mirrored} blob(s) in ${SNAPSHOT_DIR}/${SNAPSHOT_FILES_DIR}/)`);
  if (blobs.recovered || blobs.missing) {
    alert(`Attachments: ${blobs.recovered} recovered from the snapshot mirror.`
      + (blobs.missing
          ? `\n\n⚠️ ${blobs.missing} attachment${blobs.missing === 1 ? " is" : "s are"} referenced by this snapshot `
            + `but ${blobs.missing === 1 ? "was" : "were"} not in the mirror. `
            + `The record${blobs.missing === 1 ? "" : "s"} restored; the file${blobs.missing === 1 ? "" : "s"} did not.`
          : ""));
  }
  renderApp();
  return true;
}

// The manual escape hatch for the daily gate: a user who has just added
// attachments should not have to wait for midnight to see them mirrored.
async function handleMirrorNowClick() {
  const btn = document.getElementById("btn-mirror-now");
  if (btn) { btn.disabled = true; btn.textContent = "Mirroring…"; }
  try {
    await mirrorSnapshotBlobs(null, { force: true });
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Mirror Now"; }
    renderSnapshotStatusPanel();
  }
}

function handleRestoreFromSnapshotClick() {
  const select = document.getElementById("snapshot-restore-select");
  const name = select ? select.value : "";
  if (!name) { alert("No snapshot selected."); return; }
  if (!confirm(`Replace the entire current database with the snapshot taken ${select.options[select.selectedIndex].textContent}?\n\nThis cannot be undone.`)) return;
  restoreFromSnapshotFile(name);
}

async function initSnapshotSystem() {
  if (!state.snapshotHealth) state.snapshotHealth = freshSnapshotHealth();

  // C13 D: the stored timestamp is NOT trusted on boot. The filesystem is the
  // source of truth and lastConfirmedAt is a cache of it.
  state.snapshotHealth.lastConfirmedAt = null;
  state.snapshotHealth.failed = false;
  state.snapshotHealth.lastError = null;

  if (SUPPORTS_FS_ACCESS) {
    let files = null;
    let threw = null;
    try { files = await listSnapshotFiles(); } catch (err) { threw = err; files = null; }
    if (files === null) {
      markSnapshotFailure("dir-unreadable",
        threw ? String(threw.message || threw) : "No backup folder set, or the snapshots folder could not be read.");
    } else if (files.length === 0) {
      markSnapshotFailure("no-snapshots", "No snapshot files found in the snapshots folder.");
    } else {
      state.snapshotHealth.lastConfirmedAt = files[0].at;
      console.log(`[Snapshot] Boot: newest on disk is ${files[0].name} (${new Date(files[0].at).toLocaleString()})`);
      // Only once the folder has proven readable. Both are fire-and-forget:
      // boot must not wait on a directory walk, and both report through the
      // health state rather than through this call site.
      pruneSnapshots().then(() => mirrorSnapshotBlobs());
    }
  }

  const chip = document.getElementById("snapshot-health-chip");
  if (chip) chip.addEventListener("click", handleSnapshotChipClick);
  armSnapshotRedModalListener();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      if (snapshotDebounceHandle) { clearTimeout(snapshotDebounceHandle); snapshotDebounceHandle = null; }
      writeSnapshotNow("visibilitychange");   // never alert() from here
    }
  });
  window.addEventListener("beforeunload", () => {
    // Best effort. Browsers suppress dialogs here and the page usually dies
    // mid-write — visibilitychange is the reliable one. Only attempt it when
    // there is actually an unprotected mutation to save: an unconditional
    // write here leaves a zero-byte file on disk after every single reload.
    // (Those are filtered out by listSnapshotFiles(), so they cannot lie about
    // protection, but there is no reason to manufacture them.)
    const h = state.snapshotHealth;
    if (!h || !h.lastMutationAt) return;
    if (h.lastConfirmedAt && h.lastMutationAt <= h.lastConfirmedAt) return;
    writeSnapshotNow("beforeunload");
  });

  if (snapshotWatchdogHandle) clearInterval(snapshotWatchdogHandle);
  snapshotWatchdogHandle = setInterval(snapshotWatchdogTick, SNAPSHOT_WATCHDOG_MS);
  evaluateSnapshotHealth();
}

// The watchdog tick, not evaluateSnapshotHealth() itself, is where the daily
// mirror rolls over. evaluateSnapshotHealth() runs on every single saveState()
// — anything expensive hung off it lands behind every mutation in the app.
function snapshotWatchdogTick() {
  evaluateSnapshotHealth();
  if (!SUPPORTS_FS_ACCESS) return;
  if (snapshotLastMirrorDay && snapshotLastMirrorDay !== snapshotDayKey(Date.now())) {
    mirrorSnapshotBlobs();
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function ensureUrlProtocol(url) {
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    return "https://" + url;
  }
  return url;
}

// Used to decide whether a Master File's "Link or File Location" value is a
// web link (should be clickable, opens in a new tab) or a local filesystem
// path (browsers can't open those directly — gets a Copy Path button
// instead). People often paste a link without "http(s)://" in front (e.g.
// straight from a browser's address bar: "docs.google.com/document/d/..."),
// so this can't just check for a URL scheme — it also recognizes bare
// domain-looking strings, as long as they don't look like a filesystem path.
function looksLikeLocalPath(str) {
  if (!str) return false;
  const s = str.trim();
  if (/^[a-zA-Z]:[\\/]/.test(s)) return true; // Windows drive letter: C:\ or C:/
  if (/^\\\\/.test(s)) return true;           // UNC path: \\server\share
  if (s.includes("\\")) return true;          // backslashes never appear in URLs
  if (/^\//.test(s) && !/^\/\//.test(s)) return true; // Unix absolute path (not a protocol-relative //url)
  return false;
}

function looksLikeUrl(str) {
  if (!str) return false;
  const s = str.trim();
  if (/^https?:\/\//i.test(s)) return true;
  if (looksLikeLocalPath(s)) return false;
  // Bare domain, optionally followed by a path — e.g. "docs.google.com/document/d/xyz"
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(\/.*)?$/i.test(s);
}

/* ==========================================================================
   📦 STATE MANAGEMENT & INITIALIZATION
   ========================================================================== */

window.addEventListener("DOMContentLoaded", async () => {
  // 1. Load data from Cache or Seed JSON
  await loadDatabase();

  // 1b. Initialize IndexedDB binary storage
  await initIndexedDB().catch(err => console.error("Could not load IndexedDB:", err));

  // 2. Initialize Theme & Module Classes
  initTheme();
  updateThemeColors();

  // 3. Register Event Listeners
  setupEventListeners();

  // 4. Initial Render & Header Title/Subtitle Load
  switchView("dashboard");

  // 5. Snapshot health — recomputed from the snapshots directory, never from
  //    the cached timestamp. Runs after setupEventListeners() so the sidebar
  //    chip exists to bind to.
  await initSnapshotSystem();
});

function deriveSeniority(title) {
  if (!title) return "Individual Contributor";
  const t = title.toLowerCase();
  if (t.includes("vp") || t.includes("vice president")) return "VP";
  if (t.includes("chief") || t.includes("ceo") || t.includes("cto") || t.includes("cfo") || t.includes("coo") || t.includes("cmo") || t.includes("executive") || t.includes("founder") || t.includes("president") || t.includes("c-level")) return "C-Level";
  if (t.includes("director")) return "Director";
  if (t.includes("manager")) return "Manager";
  return "Individual Contributor";
}

function ensureStateDefaults() {
  // Snapshot health describes this machine's filesystem, not the user's data.
  // It is never carried in a backup, so a restored state arrives without it and
  // gets a fresh one here; initSnapshotSystem() then recomputes it from disk.
  if (!state.snapshotHealth || typeof state.snapshotHealth !== "object") {
    state.snapshotHealth = freshSnapshotHealth();
  }
  if (!state.companies) state.companies = [];
  if (!state.prospects) state.prospects = [];
  if (!state.media) state.media = [];
  if (!state.campaigns) state.campaigns = [];
  if (!state.audienceLists) state.audienceLists = [];
  // Phase 1 / C1 + C2. Tasks are a first-class stored entity, not derived.
  if (!state.tasks) state.tasks = [];
  if (!state.taskSettings || typeof state.taskSettings !== "object") {
    state.taskSettings = { dateMode: "business" };
  }
  if (state.taskSettings.dateMode !== "business" && state.taskSettings.dateMode !== "all") {
    state.taskSettings.dateMode = "business";
  }
  /* Phase 1 / C15 (Session 1.10). The app's ONE persisted-UI-layout record,
     keyed by table id so a second table adopts it without a second
     implementation. Only "taskhub" is populated in Phase 1.

     ANY future persisted UI layout — panel sizes, pane splits — joins this
     record under its own key rather than starting a sibling store. Two stores
     means two migrations, two backup rows, and two chances to miss one in
     wipeAllData(). Rename the field to state.uiLayouts at that point if
     "columnLayouts" reads wrong; that is a rename with a defaults migration,
     not a new store.

     `order` holds column KEYS — not labels (they change) and not indices
     (they lie after a reorder). `widths` is px integers where 0 means
     "unset — use the code default"; not null, not absent. The leftmost
     checkbox column is in neither: it is structural and always first.

     Backup coverage is contract C17: one ["Column Layouts", <json>] row in
     prm_settings.csv, which reaches every path the settings CSV already
     reaches. */
  if (!state.columnLayouts || typeof state.columnLayouts !== "object") state.columnLayouts = {};
  /* P7 (Session 2B.2): the default record is now derived from COLUMN_TABLES
     rather than written out by hand, so registering a second table is one
     registry entry and no edit here. Only keys the registry knows are seeded;
     a key already present is left exactly as it is, which is what keeps a
     restored backup's saved widths and order from being overwritten at boot.

     C15's own example record shows `dueDate: 104`; every column ships as 0
     here instead. 0 is C15's "unset — use the code default", and 104 was
     simply Session 1.5's code default copied into the example. Under
     table-layout:fixed that value truncates the label, so freezing it into
     every first-run record would ship a header reading "DUE DAT…" that no
     later code-default fix could reach. The record's shape, keys and
     semantics are exactly as C15 specifies — only the example's seed value
     differs, and 0 is the value C15 defines for "I have not chosen one". */
  Object.keys(COLUMN_TABLES).forEach(tableId => {
    if (state.columnLayouts[tableId] && typeof state.columnLayouts[tableId] === "object") return;
    const cols = COLUMN_TABLES[tableId].columns || [];
    const widths = {};
    cols.forEach(c => { widths[c.key] = 0; });
    state.columnLayouts[tableId] = { order: cols.map(c => c.key), widths };
  });
  // Field-level defaults so records predating a field read "" / null, never undefined.
  state.tasks.forEach(t => {
    if (t.notes === undefined || t.notes === null) t.notes = "";
    if (!t.status) t.status = "open";
    if (t.completedDate === undefined) t.completedDate = null;
    if (t.createdAt === undefined) t.createdAt = "";
    if (t.source === undefined) t.source = "manual";
    if (t.sourceRef === undefined) t.sourceRef = null;
  });
  // Migrate: ensure all audience lists have a status field
  state.audienceLists.forEach(al => {
    if (!al.status) al.status = "active";
    if (al.notes === undefined) al.notes = "";
  });
  if (!state.campaignPhases || state.campaignPhases.length === 0) {
    state.campaignPhases = ["Development", "Launch", "Archive"];
  }
  state.activeCampaignFilterPhase = state.activeCampaignFilterPhase || "all";
  state.activeCampaignFilterTags = state.activeCampaignFilterTags || [];
  state.activeView = state.activeView || "dashboard";
  state.selectedProspectId = state.selectedProspectId || null;
  state.activeMediaFilterStatus = state.activeMediaFilterStatus || "all";
  state.activeMediaFilterTags = state.activeMediaFilterTags || [];
  if (state.activeMediaFilterTag) delete state.activeMediaFilterTag;
  state.activeMediaFilterType = state.activeMediaFilterType || "all";
  if (!state.customSortOrder) state.customSortOrder = [];
  
  if (!state.mediaTypes || state.mediaTypes.length === 0) {
    state.mediaTypes = ["Article", "Video", "Newsletter"];
  }
  // Standard development phases
  const targetPhases = ["Priority", "Idea", "Draft", "In Review", "Finished", "Published", "This Week", "Next Week", "Archive"];

  if (!state.developmentPhases || state.developmentPhases.length === 0) {
    state.developmentPhases = targetPhases;
  } else {
    // Migrate standard phase names to clean singular & title case
    state.developmentPhases = state.developmentPhases.map(p => {
      if (p === "Ideas") return "Idea";
      if (p === "Drafts") return "Draft";
      if (p === "inReview" || p === "Review") return "In Review";
      return p;
    });
    // Remove duplicates if any were created
    state.developmentPhases = [...new Set(state.developmentPhases)];

    // Ensure all standard target phases are present in the list. Newly
    // introduced ones (This Week / Next Week) are inserted just before
    // Archive to match the top filter bar order, instead of tacking them
    // onto the very end past a pre-existing Archive phase.
    targetPhases.forEach(tp => {
      if (!state.developmentPhases.includes(tp)) {
        const archiveIdx = state.developmentPhases.indexOf("Archive");
        if (archiveIdx !== -1) {
          state.developmentPhases.splice(archiveIdx, 0, tp);
        } else {
          state.developmentPhases.push(tp);
        }
      }
    });
  }

  // Migrate existing media status values to the normalized ones
  if (state.media) {
    state.media.forEach(m => {
      if (m.status === "Ideas" || m.status === "Review" || m.status === "inReview" || m.status === "Drafts") {
        if (m.status === "Ideas") m.status = "Idea";
        else if (m.status === "Drafts") m.status = "Draft";
        else if (m.status === "inReview" || m.status === "Review") m.status = "In Review";
      }
    });
  }

  // Migrate activeMediaFilterStatus if it matches any of the old ones
  if (state.activeMediaFilterStatus === "Ideas") state.activeMediaFilterStatus = "Idea";
  else if (state.activeMediaFilterStatus === "Drafts") state.activeMediaFilterStatus = "Draft";
  else if (state.activeMediaFilterStatus === "inReview" || state.activeMediaFilterStatus === "Review") {
    state.activeMediaFilterStatus = "In Review";
  }
  if (!state.platforms || state.platforms.length === 0) {
    state.platforms = ["YouTube", "Substack", "Medium", "LinkedIn", "Twitter", "General"];
  }
  
  // Lossless migration: rename state.tags → state.media_tags
  if (state.tags && !state.media_tags) {
    state.media_tags = state.tags;
    delete state.tags;
  }
  if (!state.media_tags || state.media_tags.length === 0) {
    state.media_tags = ["Frontend", "React", "Fintech", "Developer", "General"];
  }
  if (!state.prospect_tags || state.prospect_tags.length === 0) {
    state.prospect_tags = ["Decision Maker", "Executive", "Manager", "Hot Lead"];
  }
  if (!state.campaign_tags || state.campaign_tags.length === 0) {
    state.campaign_tags = ["Q1 Outreach", "Enterprise", "SMB", "Newsletter"];
  }
  if (!state.company_tags || state.company_tags.length === 0) {
    state.company_tags = ["Enterprise", "SMB", "Agency", "Startup"];
  }
  if (!state.reachoutTypes || state.reachoutTypes.length === 0) {
    state.reachoutTypes = ["Email", "Call", "Campaign", "LinkedIn", "In-Person", "Entered into Vantage", "Added to Vantage", "Task Completed"];
  } else {
    if (!state.reachoutTypes.includes("Entered into Vantage")) {
      state.reachoutTypes.push("Entered into Vantage");
    }
    if (!state.reachoutTypes.includes("Added to Vantage")) {
      state.reachoutTypes.push("Added to Vantage");
    }
    // Phase 1 / C6. Both this push AND the first-run literal above are required:
    // restoreSettingsFromCSV() replaces state.reachoutTypes wholesale whenever a
    // settings CSV carries any "Reachout Type" row, so restoring a backup taken
    // before Phase 1 would otherwise silently drop the type. ensureStateDefaults()
    // always runs after a restore, which is what makes this push the fix.
    if (!state.reachoutTypes.includes("Task Completed")) {
      state.reachoutTypes.push("Task Completed");
    }
  }

  // Ensure default tags for prospects and companies
  state.companies.forEach(c => {
    if (!c.tags || c.tags.length === 0) {
      c.tags = ["No Company Tag"];
    }
    if (c.employees === undefined) c.employees = "";
    if (c.employeeRange === undefined) c.employeeRange = "";
    // Migrate: if employeeRange holds a plain number and employees is empty, move it over
    if (!c.employees && c.employeeRange && /^\d+$/.test(c.employeeRange.trim())) {
      c.employees = c.employeeRange.trim();
      c.employeeRange = "";
    }
    if (c.description === undefined) c.description = "";
    if (c.specialities === undefined) c.specialities = "";
    if (c.headquarters === undefined) c.headquarters = "";
    if (c.website === undefined) c.website = c.domain || "";
  });
  state.prospects.forEach(p => {
    if (!p.tags || p.tags.length === 0) {
      p.tags = ["No Prospect Tag"];
    }
    if (p.linkedin === undefined) p.linkedin = "";
    if (!p.seniority) {
      p.seniority = deriveSeniority(p.title);
    }
  });

  // Lossless migration: rename m.tags → m.media_tags on each media item
  state.media.forEach(m => {
    if (!m.media_tags || m.media_tags.length === 0) {
      if (m.tags && m.tags.length > 0) {
        m.media_tags = Array.isArray(m.tags) ? m.tags : m.tags.split(/[;,]/).map(t => t.trim()).filter(Boolean);
      }
    }
    if (m.tags) {
      delete m.tags;
    }
    if (!m.masterFiles) m.masterFiles = [];
    if (!m.publishEvents) m.publishEvents = [];
    if (m.views === undefined) m.views = 0;
    if (m.clicks === undefined) m.clicks = 0;
    if (m.shares === undefined) m.shares = 0;
    if (m.comments === undefined) m.comments = 0;
    if (m.outline === undefined) {
      m.outline = m.content || "";
      m.content = "";
    }
  });

  // Synchronize dynamic settings options from records to prevent loss of custom options
  if (state.media) {
    state.media.forEach(m => {
      if (m.type) {
        const foundType = state.mediaTypes.find(t => t.trim().toLowerCase() === m.type.trim().toLowerCase());
        if (foundType) {
          m.type = foundType;
        } else {
          state.mediaTypes.push(m.type);
        }
      }
      if (m.media_tags) {
        m.media_tags = m.media_tags.map(t => {
          if (!t) return t;
          const foundTag = state.media_tags.find(tg => tg.trim().toLowerCase() === t.trim().toLowerCase());
          if (foundTag) {
            return foundTag;
          } else {
            state.media_tags.push(t);
            return t;
          }
        });
      }
    });
  }
  if (state.prospects) {
    state.prospects.forEach(p => {
      if (p.tags) {
        p.tags = p.tags.map(t => {
          if (!t || t === "No Prospect Tag") return t;
          const foundTag = state.prospect_tags.find(tg => tg.trim().toLowerCase() === t.trim().toLowerCase());
          if (foundTag) {
            return foundTag;
          } else {
            state.prospect_tags.push(t);
            return t;
          }
        });
      }
    });
  }
  if (state.companies) {
    state.companies.forEach(c => {
      if (c.tags) {
        c.tags = c.tags.map(t => {
          if (!t || t === "No Company Tag") return t;
          const foundTag = state.company_tags.find(tg => tg.trim().toLowerCase() === t.trim().toLowerCase());
          if (foundTag) {
            return foundTag;
          } else {
            state.company_tags.push(t);
            return t;
          }
        });
      }
    });
  }
  if (state.campaigns) {
    state.campaigns.forEach(c => {
      // Migrate prospectIds to standalone Audience List
      if (c.prospectIds && !c.audienceListId) {
        const audId = `aud-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        state.audienceLists.push({
          id: audId,
          name: `${c.title} Audience`,
          prospectIds: c.prospectIds || [],
          status: "active"
        });
        c.audienceListId = audId;
        delete c.prospectIds;
      }

      // Normalize status to campaignPhases
      if (c.status === "Pending") c.status = "Development";
      if (c.status === "Active") c.status = "Launch";
      if (c.status) {
        const foundPhase = state.campaignPhases.find(p => p.trim().toLowerCase() === c.status.trim().toLowerCase());
        if (foundPhase) {
          c.status = foundPhase;
        } else {
          state.campaignPhases.push(c.status);
        }
      } else {
        c.status = state.campaignPhases[0] || "Development";
      }

      if (c.tags) {
        c.tags = c.tags.map(t => {
          if (!t) return t;
          const foundTag = state.campaign_tags.find(tg => tg.trim().toLowerCase() === t.trim().toLowerCase());
          if (foundTag) {
            return foundTag;
          } else {
            state.campaign_tags.push(t);
            return t;
          }
        });
      }
    });
  }

  // Email Accounts (Campaign Hub) — independent mini database for Smart
  // Leads sending accounts. Kept generic/array-driven like the other managed
  // lists so it rides along automatically with backup/restore.
  if (!state.emailAccounts) state.emailAccounts = [];
  if (!state.emailProviders || state.emailProviders.length === 0) {
    state.emailProviders = ["Gmail", "Outlook / Microsoft 365", "Zoho Mail", "Custom SMTP"];
  }
  if (!state.emailProviderDefaultUrls || Object.keys(state.emailProviderDefaultUrls).length === 0) {
    state.emailProviderDefaultUrls = { ...EMAIL_PROVIDER_DASHBOARD_URL_SEED };
  }
  state.emailAccounts.forEach(a => {
    if (!a.status) a.status = "Active";
    if (a.dashboardUrl === undefined) a.dashboardUrl = "";
    if (a.dailyLimit === undefined) a.dailyLimit = "";
    if (a.domain === undefined) a.domain = "";
    if (a.notes === undefined) a.notes = "";
    if (!a.dateAdded) a.dateAdded = new Date().toISOString().split("T")[0];
    // Preserve any custom provider value used on a record even if it isn't
    // (yet) in the managed list, same pattern used for media types/tags above.
    if (a.provider && !state.emailProviders.some(p => p.trim().toLowerCase() === a.provider.trim().toLowerCase())) {
      state.emailProviders.push(a.provider);
    }
  });

  // Domain Management (Campaign Hub) — independent mini database for domains
  // used with Smart Leads sending. Same array-driven pattern as Email
  // Accounts above so it rides along automatically with backup/restore.
  if (!state.domains) state.domains = [];
  if (!state.domainRegistrars || state.domainRegistrars.length === 0) {
    state.domainRegistrars = ["GoDaddy", "Namecheap", "Cloudflare", "Porkbun"];
  }
  if (!state.domainHosts || state.domainHosts.length === 0) {
    state.domainHosts = ["Cloudflare", "AWS Route 53", "Namecheap", "Bluehost"];
  }
  if (!state.domainRegistrarDefaultUrls || Object.keys(state.domainRegistrarDefaultUrls).length === 0) {
    state.domainRegistrarDefaultUrls = { ...DOMAIN_REGISTRAR_DASHBOARD_URL_SEED };
  }
  if (!state.domainHostDefaultUrls || Object.keys(state.domainHostDefaultUrls).length === 0) {
    state.domainHostDefaultUrls = { ...DOMAIN_HOST_DASHBOARD_URL_SEED };
  }
  state.domains.forEach(d => {
    if (!d.status) d.status = "Active";
    if (d.ip === undefined) d.ip = "";
    if (d.userId === undefined) d.userId = "";
    if (d.password === undefined) d.password = "";
    if (d.annualCost === undefined) d.annualCost = "";
    if (d.expirationDate === undefined) d.expirationDate = "";
    if (!d.autoRenew) d.autoRenew = "No";
    if (!d.dnsHealth) d.dnsHealth = "Not Configured";
    if (!d.linkedEmailAccountIds) d.linkedEmailAccountIds = [];
    if (d.registrarDashboardUrl === undefined) {
      d.registrarDashboardUrl = state.domainRegistrarDefaultUrls[d.registrar] || "";
    }
    if (d.hostDashboardUrl === undefined) {
      d.hostDashboardUrl = state.domainHostDefaultUrls[d.host] || "";
    }
    if (d.notes === undefined) d.notes = "";
    if (!d.dateAdded) d.dateAdded = new Date().toISOString().split("T")[0];
    if (d.registrar && !state.domainRegistrars.some(r => r.trim().toLowerCase() === d.registrar.trim().toLowerCase())) {
      state.domainRegistrars.push(d.registrar);
    }
    if (d.host && !state.domainHosts.some(h => h.trim().toLowerCase() === d.host.trim().toLowerCase())) {
      state.domainHosts.push(d.host);
    }
    // Clean up stale references to deleted email accounts
    d.linkedEmailAccountIds = d.linkedEmailAccountIds.filter(id => state.emailAccounts.some(a => a.id === id));
  });
}

async function loadDatabase() {
  const cache = localStorage.getItem("vantage_prm_database");
  if (cache) {
    try {
      state = JSON.parse(cache);
      ensureStateDefaults();
      console.log("[Database] Loaded from localStorage");
    } catch (e) {
      console.error("[Database] Error parsing localStorage database, reloading seeds.", e);
      await fetchFreshSeed();
    }
  } else {
    await fetchFreshSeed();
  }
}

async function fetchFreshSeed() {
  const sandboxSeed = localStorage.getItem("vantage_prm_sandbox_seed");
  if (sandboxSeed) {
    try {
      const data = JSON.parse(sandboxSeed);
      state.companies = data.companies || [];
      state.prospects = data.prospects || [];
      state.media = data.media || [];
      state.campaigns = data.campaigns || [];
      state.audienceLists = data.audienceLists || [];
      ensureStateDefaults();
      saveState();
      console.log("[Database] Seeded successfully from custom sandbox seed in localStorage");
      return;
    } catch (e) {
      console.error("[Database] Error parsing custom sandbox seed, falling back to JSON file.", e);
    }
  }

  try {
    const res = await fetch(`./prm_data.json?t=${Date.now()}`);
    const data = await res.json();
    state.companies = data.companies || [];
    state.prospects = data.prospects || [];
    state.media = data.media || [];
    state.campaigns = data.campaigns || [];
    ensureStateDefaults();
    saveState();
    console.log("[Database] Seeded successfully from prm_data.json");
  } catch (err) {
    console.error("[Database] Failed to fetch seed file. Initializing empty.", err);
  }
}

function saveState() {
  localStorage.setItem("vantage_prm_database", JSON.stringify(state));
  // Every mutation stamps the watchdog and restarts the snapshot debounce.
  // Guarded because saveState() also runs during boot seeding, before
  // initSnapshotSystem() has created the health object.
  if (state.snapshotHealth) {
    state.snapshotHealth.lastMutationAt = Date.now();
    scheduleSnapshot();
    evaluateSnapshotHealth();
  }
}

function wipeIndexedDB() {
  return new Promise((resolve, reject) => {
    if (!fileDB) return resolve();
    try {
      const transaction = fileDB.transaction(["files"], "readwrite");
      const store = transaction.objectStore("files");
      const request = store.clear();
      request.onsuccess = () => {
        console.log("[IndexedDB] Object store cleared successfully.");
        resolve();
      };
      request.onerror = (e) => reject(e.target.error);
    } catch (err) {
      console.error("Error clearing IndexedDB store:", err);
      reject(err);
    }
  });
}

async function wipeAllData() {
  const userInput = prompt("This will completely wipe ALL DATA from Vantage. Are you sure? Type 'YES' to confirm");
  if (userInput !== "YES") return;

  localStorage.removeItem("vantage_prm_database");
  localStorage.removeItem("vantage_prm_sandbox_seed");

  await wipeIndexedDB().catch(err => console.error("Error wiping files:", err));

  state.companies = [];
  state.prospects = [];
  state.media = [];
  state.campaigns = [];
  state.audienceLists = [];
  state.emailAccounts = [];
  state.domains = [];
  state.tasks = [];   // Phase 1 / Session 1.3 — a new store must be wiped too.
  // Phase 1 / C15 (Session 1.10). This function clears an EXPLICIT list, not
  // everything, so every new top-level store has to be added here by hand —
  // state.tasks was missed on the first pass in 1.3. A store left out survives
  // the wipe, which silently turns any export→wipe→restore drill into a test
  // that cannot fail. ensureStateDefaults() refills the taskhub default on the
  // next load or restore.
  state.columnLayouts = {};
  state.selectedProspectId = null;
  state.activeView = "dashboard";

  saveState();
  updateThemeColors();
  renderApp();
  alert("Vantage database and all files have been completely wiped.");
}

function makeNewSandbox() {
  const userInput = prompt("This will make current state of Vantage your new sandbox. Are you sure? Type 'YES' to confirm");
  if (userInput !== "YES") return;

  localStorage.setItem("vantage_prm_sandbox_seed", JSON.stringify(state));
  alert("Current Vantage state saved as your new Sandbox seed template!");
}

async function resetSandbox() {
  const userInput = prompt("This will reset the sandbox. Are you sure? Type 'YES' to confirm.");
  if (userInput !== "YES") return;

  localStorage.removeItem("vantage_prm_database");
  state.activeView = "dashboard";
  await loadDatabase();
  updateThemeColors();
  renderApp();
  alert("Vantage sandbox has been reset successfully!");
}

/* ==========================================================================
   🗄️ DATA MANAGEMENT CORE BACKUP & RESTORE CONTROLLERS
   ========================================================================== */

function renderDataManagementView() {
  document.getElementById("db-prospects-count").textContent = state.prospects.length;
  document.getElementById("db-media-count").textContent = state.media.length;
  document.getElementById("db-campaigns-count").textContent = state.campaigns.length;
  document.getElementById("db-companies-count").textContent = state.companies.length;
  document.getElementById("db-email-accounts-count").textContent = (state.emailAccounts || []).length;
  document.getElementById("db-domains-count").textContent = (state.domains || []).length;

  // Backup Folder controls only exist on desktop Chrome/Edge/Opera.
  if (SUPPORTS_FS_ACCESS) {
    const folderSection = document.getElementById("backup-folder-section");
    const restoreFolderBtn = document.getElementById("btn-restore-from-folder");
    if (folderSection) folderSection.classList.remove("hidden");
    if (restoreFolderBtn) restoreFolderBtn.classList.remove("hidden");
    updateBackupFolderUI();
    const snapSection = document.getElementById("snapshot-section");
    if (snapSection) snapSection.classList.remove("hidden");
    renderSnapshotStatusPanel();
  }
}

function convertToCSV(array, headers, mapper) {
  const csvRows = [];
  csvRows.push(headers.join(","));
  for (const item of array) {
    const values = mapper(item);
    const escapedValues = values.map(val => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(escapedValues.join(","));
  }
  return csvRows.join("\n");
}

function getBackupTimestamp() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const year = String(now.getFullYear()).slice(-2);
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${month}-${day}-${year}_${hours}${minutes}`;
}

function downloadCSVFile(name, csvContent) {
  const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"});
  downloadBlob(name, blob);
}

function exportProspectsCSV() {
  const csv = convertToCSV(state.prospects, 
    ["ID", "First Name", "Last Name", "Email", "Phone", "Title", "LinkedIn", "Company ID", "Location", "City", "State", "Seniority", "Notes", "Tags", "History"],
    p => [p.id, p.firstName, p.lastName, p.email, p.phone || "", p.title || "", p.linkedin || "", p.companyId, p.location || "", p.city || "", p.state || "", p.seniority || "", p.notes || "", (p.tags || []).join(";"), p.history ? JSON.stringify(p.history) : ""]
  );
  saveBackupFile(`vantage_data_backup_prospects_${getBackupTimestamp()}.csv`, csv);
}

function exportMediaCSV() {
  const csv = convertToCSV(state.media,
    ["ID", "Title", "Status", "Type", "Platform", "Outline", "Content", "Media Tags", "Views", "Clicks", "Shares", "Comments", "Publish Date", "Publish Events", "Master Files", "Files"],
    m => [
      m.id, 
      m.title, 
      m.status, 
      m.type, 
      m.platform || "", 
      m.outline || "", 
      m.content || "", 
      (m.media_tags || []).join(";"), 
      m.views || 0, 
      m.clicks || 0, 
      m.shares || 0, 
      m.comments || 0, 
      m.publishDate || "", 
      m.publishEvents ? JSON.stringify(m.publishEvents) : "", 
      m.masterFiles ? JSON.stringify(m.masterFiles) : "",
      m.files ? JSON.stringify(m.files) : ""
    ]
  );
  saveBackupFile(`vantage_data_backup_media_${getBackupTimestamp()}.csv`, csv);
}

function exportCampaignsCSV() {
  const csv = convertToCSV(state.campaigns,
    ["ID", "Title", "Sequence Media ID", "Launch Date", "Status", "Tags", "Audience List ID", "Intended Audience", "Goal Summary"],
    c => [c.id, c.title, c.sequenceMediaId, c.launchDate, c.status, (c.tags || []).join(";"), c.audienceListId || "", c.intendedAudience || "", c.goalSummary || ""]
  );
  saveBackupFile(`vantage_data_backup_campaigns_${getBackupTimestamp()}.csv`, csv);
}

function exportAudienceListsCSV() {
  const csv = convertToCSV(state.audienceLists || [],
    ["ID", "Name", "Prospect IDs", "Status", "Notes"],
    al => [al.id, al.name, (al.prospectIds || []).join(";"), al.status || "active", al.notes || ""]
  );
  saveBackupFile(`vantage_data_backup_audience_lists_${getBackupTimestamp()}.csv`, csv);
}

// Phase 1 / C3. First Name, Last Name and Company are EXPORT-ONLY columns —
// they exist so a human can read the file. They are never stored on the task
// record and restoreTasksFromCSV() ignores all three, keying on Prospect ID.
const TASKS_CSV_HEADERS = [
  "Task ID", "Prospect ID", "First Name", "Last Name", "Company", "Task Title", "Notes",
  "Due Date", "Status", "Completed Date", "Created At", "Source", "Source Ref"
];

function taskCSVRow(t) {
  const p = state.prospects.find(x => x.id === t.prospectId);
  return [
    t.id,
    t.prospectId || "",
    p ? (p.firstName || "") : "",
    p ? (p.lastName || "") : "",
    p ? getCompanyName(p.companyId) : "",
    t.title || "",
    t.notes || "",
    t.dueDate || "",
    t.status || "open",
    t.completedDate || "",
    t.createdAt || "",
    t.source || "manual",
    t.sourceRef || ""
  ];
}

function generateTasksCSV() {
  return convertToCSV(state.tasks || [], TASKS_CSV_HEADERS, taskCSVRow);
}

function exportTasksCSV() {
  saveBackupFile(`vantage_data_backup_tasks_${getBackupTimestamp()}.csv`, generateTasksCSV());
}

function exportCompaniesCSV() {
  const csv = convertToCSV(state.companies,
    ["ID", "Name", "Domain", "Website", "Employees", "Employee Range", "Location", "Industry", "Description", "Specialities", "Headquarters", "Address", "City", "State", "Postal", "Phone", "LinkedIn", "Notes", "Tags"],
    co => [
      co.id, 
      co.name, 
      co.domain, 
      co.website || "", 
      co.employees || "", 
      co.employeeRange || "", 
      co.location || "", 
      co.industry || "General", 
      co.description || "", 
      co.specialities || "", 
      co.headquarters || "",
      co.address || "",
      co.city || "",
      co.state || "",
      co.postal || "",
      co.phone || "",
      co.linkedin || "",
      co.notes || "",
      (co.tags || []).join(";")
    ]
  );
  saveBackupFile(`vantage_data_backup_companies_${getBackupTimestamp()}.csv`, csv);
}

function exportEmailAccountsCSV() {
  const csv = convertToCSV(state.emailAccounts || [],
    ["ID", "Email", "Password", "Provider", "Dashboard URL", "Status", "Daily Send Limit", "Sending Domain", "Notes", "Date Added"],
    a => [a.id, a.email, a.password || "", a.provider || "", a.dashboardUrl || "", a.status || "Active", a.dailyLimit || "", a.domain || "", a.notes || "", a.dateAdded || ""]
  );
  saveBackupFile(`vantage_data_backup_email_accounts_${getBackupTimestamp()}.csv`, csv);
}

function exportDomainsCSV() {
  const csv = convertToCSV(state.domains || [],
    ["ID", "URL", "Registrar", "Registrar Dashboard URL", "Host", "Host Dashboard URL", "IP", "User ID", "Password", "Annual Cost", "Expiration Date", "Status", "Auto-Renew", "DNS Health", "Linked Email Account IDs", "Notes", "Date Added"],
    d => [d.id, d.url, d.registrar || "", d.registrarDashboardUrl || "", d.host || "", d.hostDashboardUrl || "", d.ip || "", d.userId || "", d.password || "", d.annualCost || "", d.expirationDate || "", d.status || "Active", d.autoRenew || "No", d.dnsHealth || "Not Configured", (d.linkedEmailAccountIds || []).join(";"), d.notes || "", d.dateAdded || ""]
  );
  saveBackupFile(`vantage_data_backup_domains_${getBackupTimestamp()}.csv`, csv);
}

// Exports whatever contacts are currently visible in the Prospect Hub table
// (filtered by search/geo/tags). Falls back to the entire contacts database
// when no filters or tags are applied.
function exportFilteredContactsCSV() {
  const list = lastFilteredProspects;
  if (!list || list.length === 0) {
    alert("No contacts to export.");
    return;
  }
  const csv = convertToCSV(list,
    ["ID", "First Name", "Last Name", "Email", "Phone", "Title", "LinkedIn", "Company ID", "Location", "City", "State", "Seniority", "Notes", "Tags", "History"],
    p => [p.id, p.firstName, p.lastName, p.email, p.phone || "", p.title || "", p.linkedin || "", p.companyId, p.location || "", p.city || "", p.state || "", p.seniority || "", p.notes || "", (p.tags || []).join(";"), p.history ? JSON.stringify(p.history) : ""]
  );
  downloadCSVFile(`vantage_contacts_export_${getBackupTimestamp()}.csv`, csv);
}

// Exports the contacts of one specific audience list to its own CSV file
// (name-stamped), same column set as the Prospect Hub contact export plus
// a resolved Company name column for convenience.
function exportAudienceContactsCSV(audienceId) {
  const aud = state.audienceLists.find(a => a.id === audienceId);
  if (!aud) return;
  const list = (aud.prospectIds || []).map(pid => state.prospects.find(p => p.id === pid)).filter(Boolean);
  if (list.length === 0) {
    alert(`"${aud.name}" has no contacts to export.`);
    return;
  }
  const csv = convertToCSV(list,
    ["ID", "First Name", "Last Name", "Email", "Phone", "Title", "LinkedIn", "Company ID", "Company", "Location", "City", "State", "Seniority", "Notes", "Tags", "History"],
    p => [p.id, p.firstName, p.lastName, p.email, p.phone || "", p.title || "", p.linkedin || "", p.companyId, getCompanyName(p.companyId) || "", p.location || "", p.city || "", p.state || "", p.seniority || "", p.notes || "", (p.tags || []).join(";"), p.history ? JSON.stringify(p.history) : ""]
  );
  const safeName = aud.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase().replace(/^_+|_+$/g, "");
  downloadCSVFile(`vantage_audience_${safeName || "list"}_${getBackupTimestamp()}.csv`, csv);
}

// Exports whatever companies are currently visible in the Prospect Hub table
// (filtered by search/geo/tags). Falls back to the entire companies database
// when no filters or tags are applied.
function exportFilteredCompaniesCSV() {
  const list = lastFilteredCompanies;
  if (!list || list.length === 0) {
    alert("No companies to export.");
    return;
  }
  const csv = convertToCSV(list,
    ["ID", "Name", "Domain", "Website", "Employees", "Employee Range", "Location", "Industry", "Description", "Specialities", "Headquarters", "Address", "City", "State", "Postal", "Phone", "LinkedIn", "Notes", "Tags"],
    co => [
      co.id,
      co.name,
      co.domain,
      co.website || "",
      co.employees || "",
      co.employeeRange || "",
      co.location || "",
      co.industry || "General",
      co.description || "",
      co.specialities || "",
      co.headquarters || "",
      co.address || "",
      co.city || "",
      co.state || "",
      co.postal || "",
      co.phone || "",
      co.linkedin || "",
      co.notes || "",
      (co.tags || []).join(";")
    ]
  );
  downloadCSVFile(`vantage_companies_export_${getBackupTimestamp()}.csv`, csv);
}

function generateSettingsCSV() {
  const rows = [];
  state.mediaTypes.forEach(t => rows.push(["Media Type", t]));
  state.developmentPhases.forEach(p => rows.push(["Development Phase", p]));
  state.platforms.forEach(pl => rows.push(["Publishing Platform", pl]));
  state.media_tags.forEach(tg => rows.push(["Media Hub Tag", tg]));
  state.prospect_tags.forEach(tg => rows.push(["Prospect Tag", tg]));
  state.campaign_tags.forEach(tg => rows.push(["Campaign Tag", tg]));
  (state.campaignPhases || []).forEach(p => rows.push(["Campaign Phase", p]));
  state.company_tags.forEach(tg => rows.push(["Company Tag", tg]));
  state.reachoutTypes.forEach(t => rows.push(["Reachout Type", t]));
  (state.emailProviders || []).forEach(p => rows.push(["Email Provider", p]));
  (state.domainRegistrars || []).forEach(r => rows.push(["Domain Registrar", r]));
  (state.domainHosts || []).forEach(h => rows.push(["Domain Host", h]));
  // Default dashboard URL lookups (see buildRowWithUrl in renderSettingsLists)
  // — stored as "Name=URL" so a single CSV row round-trips both fields.
  // Split on the *first* "=" only when restoring, since URLs can contain
  // their own "=" in query strings.
  Object.entries(state.emailProviderDefaultUrls || {}).forEach(([name, url]) => {
    if (url) rows.push(["Email Provider Default URL", `${name}=${url}`]);
  });
  Object.entries(state.domainRegistrarDefaultUrls || {}).forEach(([name, url]) => {
    if (url) rows.push(["Domain Registrar Default URL", `${name}=${url}`]);
  });
  Object.entries(state.domainHostDefaultUrls || {}).forEach(([name, url]) => {
    if (url) rows.push(["Domain Host Default URL", `${name}=${url}`]);
  });
  if (state.customSortOrder && state.customSortOrder.length > 0) {
    rows.push(["Custom Sort Order", state.customSortOrder.join(";")]);
  }
  // Phase 1 / C4. A scalar setting rides in the settings CSV alongside
  // Custom Sort Order rather than in a file of its own. This is what gives
  // state.taskSettings its DIRECTIVES §4 backup coverage.
  rows.push(["Task Date Mode", (state.taskSettings && state.taskSettings.dateMode) || "business"]);
  // Phase 1 / C17. state.columnLayouts' ENTIRE DIRECTIVES §4 coverage is this
  // one row, following the Custom Sort Order precedent. The payload is JSON
  // and therefore full of `"` characters — the round trip depends on
  // convertToCSV() quoting unconditionally and parseCSV() tracking quote
  // state, which Session 1.3 verified against a note holding embedded quotes.
  // If it ever fails, base64 the payload into this same cell; do not add a
  // file.
  rows.push(["Column Layouts", JSON.stringify(state.columnLayouts || {})]);

  return convertToCSV(rows, ["Option Type", "Option Value"], r => r);
}

function exportSettingsCSV() {
  const csv = generateSettingsCSV();
  saveBackupFile(`vantage_data_backup_settings_${getBackupTimestamp()}.csv`, csv);
}

async function exportZIPBackup() {
  const zip = new JSZip();
  
  const prospectsCSV = convertToCSV(state.prospects, 
    ["ID", "First Name", "Last Name", "Email", "Phone", "Title", "LinkedIn", "Company ID", "Location", "City", "State", "Seniority", "Notes", "Tags", "History"],
    p => [p.id, p.firstName, p.lastName, p.email, p.phone || "", p.title || "", p.linkedin || "", p.companyId, p.location || "", p.city || "", p.state || "", p.seniority || "", p.notes || "", (p.tags || []).join(";"), p.history ? JSON.stringify(p.history) : ""]
  );
  
  const mediaCSV = convertToCSV(state.media,
    ["ID", "Title", "Status", "Type", "Platform", "Outline", "Content", "Media Tags", "Views", "Clicks", "Shares", "Comments", "Publish Date", "Publish Events", "Master Files", "Files"],
    m => [
      m.id, 
      m.title, 
      m.status, 
      m.type, 
      m.platform || "", 
      m.outline || "", 
      m.content || "", 
      (m.media_tags || []).join(";"), 
      m.views || 0, 
      m.clicks || 0, 
      m.shares || 0, 
      m.comments || 0, 
      m.publishDate || "", 
      m.publishEvents ? JSON.stringify(m.publishEvents) : "", 
      m.masterFiles ? JSON.stringify(m.masterFiles) : "",
      m.files ? JSON.stringify(m.files) : ""
    ]
  );
  
  const campaignsCSV = convertToCSV(state.campaigns,
    ["ID", "Title", "Sequence Media ID", "Launch Date", "Status", "Tags", "Audience List ID", "Intended Audience", "Goal Summary"],
    c => [c.id, c.title, c.sequenceMediaId, c.launchDate, c.status, (c.tags || []).join(";"), c.audienceListId || "", c.intendedAudience || "", c.goalSummary || ""]
  );
  
  const audienceListsCSV = convertToCSV(state.audienceLists || [],
    ["ID", "Name", "Prospect IDs", "Status", "Notes"],
    al => [al.id, al.name, (al.prospectIds || []).join(";"), al.status || "active", al.notes || ""]
  );
  
  const companiesCSV = convertToCSV(state.companies,
    ["ID", "Name", "Domain", "Website", "Employees", "Employee Range", "Location", "Industry", "Description", "Specialities", "Headquarters", "Address", "City", "State", "Postal", "Phone", "LinkedIn", "Notes", "Tags"],
    co => [
      co.id, 
      co.name, 
      co.domain, 
      co.website || "", 
      co.employees || "", 
      co.employeeRange || "", 
      co.location || "", 
      co.industry || "General", 
      co.description || "", 
      co.specialities || "", 
      co.headquarters || "",
      co.address || "",
      co.city || "",
      co.state || "",
      co.postal || "",
      co.phone || "",
      co.linkedin || "",
      co.notes || "",
      (co.tags || []).join(";")
    ]
  );
  
  const emailAccountsCSV = convertToCSV(state.emailAccounts || [],
    ["ID", "Email", "Password", "Provider", "Dashboard URL", "Status", "Daily Send Limit", "Sending Domain", "Notes", "Date Added"],
    a => [a.id, a.email, a.password || "", a.provider || "", a.dashboardUrl || "", a.status || "Active", a.dailyLimit || "", a.domain || "", a.notes || "", a.dateAdded || ""]
  );

  const domainsCSV = convertToCSV(state.domains || [],
    ["ID", "URL", "Registrar", "Registrar Dashboard URL", "Host", "Host Dashboard URL", "IP", "User ID", "Password", "Annual Cost", "Expiration Date", "Status", "Auto-Renew", "DNS Health", "Linked Email Account IDs", "Notes", "Date Added"],
    d => [d.id, d.url, d.registrar || "", d.registrarDashboardUrl || "", d.host || "", d.hostDashboardUrl || "", d.ip || "", d.userId || "", d.password || "", d.annualCost || "", d.expirationDate || "", d.status || "Active", d.autoRenew || "No", d.dnsHealth || "Not Configured", (d.linkedEmailAccountIds || []).join(";"), d.notes || "", d.dateAdded || ""]
  );

  const settingsCSV = generateSettingsCSV();

  const tasksCSV = generateTasksCSV();

  zip.file("prm_prospects.csv", prospectsCSV);
  zip.file("prm_media_content.csv", mediaCSV);
  zip.file("prm_campaigns.csv", campaignsCSV);
  zip.file("prm_audience_lists.csv", audienceListsCSV);
  zip.file("prm_companies.csv", companiesCSV);
  zip.file("prm_email_accounts.csv", emailAccountsCSV);
  zip.file("prm_domains.csv", domainsCSV);
  zip.file("prm_settings.csv", settingsCSV);
  zip.file("prm_tasks.csv", tasksCSV);

  const filesFolder = zip.folder("files");
  const fileIds = new Map();
  state.media.forEach(m => {
    if (m.files) m.files.forEach(f => fileIds.set(f.id, f));
    if (m.masterFiles) m.masterFiles.forEach(f => fileIds.set(f.id, f));
  });
  
  for (const [id, fileMeta] of fileIds) {
    try {
      const blob = await getFileBlob(id);
      if (blob) {
        filesFolder.file(id, blob);
      }
    } catch(e) {
      console.error(`Error loading blob for ${id}:`, e);
    }
  }
  
  zip.generateAsync({type: "blob"}).then(function(content) {
    saveBackupFile(`vantage_data_backup_${getBackupTimestamp()}.zip`, content);
  });
}

function findFileInZip(zip, targetName) {
  let found = null;
  zip.forEach(function (relativePath, zipEntry) {
    if (zipEntry.name.toLowerCase().endsWith(targetName) && !zipEntry.dir) {
      found = zipEntry;
    }
  });
  return found;
}

function restoreProspectsFromCSV(text, fileName = "") {
  const rows = parseCSV(text);
  if (rows.length <= 1) return;
  state.prospects = [];
  const headers = rows[0];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length === 0 || cols.every(c => !c.trim())) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      const cleanHeader = h.trim().replace(/^\ufeff/, "");
      if (cleanHeader) {
        const val = cols[idx]?.trim() || "";
        obj[cleanHeader] = val;
        obj[cleanHeader.toLowerCase()] = val;
        obj[cleanHeader.toLowerCase().replace(/\s+/g, "")] = val;
        obj[cleanHeader.toLowerCase().replace(/[^a-z0-9]/g, "")] = val;
      }
    });

    const lookup = (keys) => {
      for (const key of keys) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (obj[cleanKey] !== undefined) {
          return obj[cleanKey];
        }
      }
      return "";
    };

    let history = [];
    const rawHistory = lookup(["history"]);
    if (rawHistory) {
      try {
        history = JSON.parse(rawHistory);
      } catch(e) {
        history = [];
      }
    }
    
    const isApollo = (fileName.toLowerCase().includes("apollo") || fileName.toLowerCase().includes("apolllo")) ||
                     headers.some(h => {
                       const nh = h.toLowerCase().replace(/[^a-z0-9]/g, "");
                       return nh.includes("reachoutinteraction") || nh.includes("companywebiste") || nh === "phonemobile";
                     });

    if (isApollo && history.length === 0) {
      history.push({
        id: `hist-${Date.now()}-${i}-init`,
        date: new Date().toISOString().split("T")[0],
        type: "Added to Vantage",
        content: "Added to Vantage"
      });
    }

    const tagsStr = lookup(["tags", "prospecttags"]);
    const tags = tagsStr ? tagsStr.split(";").map(t => t.trim()).filter(Boolean) : [];

    // Resolve companyId: if Company ID is missing, fall back to Company Name / domain
    let companyIdVal = lookup(["company id", "companyid"]);
    if (!companyIdVal) {
      const companyName = lookup(["company name", "company", "companyname"]);
      const websiteVal = lookup(["company website", "website", "domain", "companywebiste"]);
      let domainVal = websiteVal.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
      if (!domainVal && companyName) {
        domainVal = companyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      }
      companyIdVal = domainVal;
    }

    const phoneVal = lookup(["phone", "phone (mobile)", "mobile phone", "mobile", "contact phone"]);

    state.prospects.push({
      id: lookup(["id"]) || lookup(["email", "emailaddress"]) || `pros-${Date.now()}-${i}`,
      firstName: lookup(["first name", "firstname", "first"]),
      lastName: lookup(["last name", "lastname", "last"]),
      email: lookup(["email", "emailaddress"]),
      phone: phoneVal,
      title: lookup(["title", "job title"]),
      linkedin: lookup(["linkedin", "personlinkedinurl", "linkedinurl"]),
      companyId: companyIdVal,
      location: lookup(["location", "companylocation"]),
      city: lookup(["city", "companycity"]),
      state: lookup(["state", "region", "companystate"]),
      seniority: lookup(["seniority", "senioritylevel"]),
      notes: lookup(["notes", "contactnotes"]),
      tags,
      history
    });
  }
}

function restoreMediaFromCSV(text) {
  const rows = parseCSV(text);
  if (rows.length <= 1) return;
  state.media = [];
  const headers = rows[0];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length === 0 || cols.every(c => !c.trim())) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = cols[idx]?.trim() || "";
    });
    let publishEvents = [];
    const rawEvents = obj["Publish Events"] || obj["publishevents"] || "";
    if (rawEvents) {
      try {
        publishEvents = JSON.parse(rawEvents);
      } catch(e) {
        publishEvents = [];
      }
    }
    let masterFiles = [];
    const rawMasterFiles = obj["Master Files"] || obj["masterfiles"] || "";
    if (rawMasterFiles) {
      try {
        masterFiles = JSON.parse(rawMasterFiles);
      } catch(e) {
        masterFiles = [];
      }
    }
    let files = [];
    const rawFiles = obj["Files"] || obj["files"] || "";
    if (rawFiles) {
      try {
        files = JSON.parse(rawFiles);
      } catch(e) {
        files = [];
      }
    }
    const outlineVal = obj["Outline"] || obj["outline"] || "";
    let contentVal = obj["Content"] || obj["content"] || "";
    let finalOutline = outlineVal;
    let finalContent = contentVal;
    if (!outlineVal && contentVal) {
      finalOutline = contentVal;
      finalContent = "";
    }
    const media_tags = (obj["Media Tags"] || obj["Tags"] || obj["media_tags"] || obj["tags"] || "").split(/[;,]/).map(t => t.trim()).filter(Boolean);
    state.media.push({
      id: obj["ID"] || obj["id"] || `med-${Date.now()}-${i}`,
      title: obj["Title"] || obj["title"] || "Untitled Media",
      status: obj["Status"] || obj["status"] || "Idea",
      type: obj["Type"] || obj["type"] || "Article",
      platform: obj["Platform"] || obj["platform"] || "",
      outline: finalOutline,
      content: finalContent,
      media_tags,
      views: parseInt(obj["Views"] || 0) || 0,
      clicks: parseInt(obj["Clicks"] || 0) || 0,
      shares: parseInt(obj["Shares"] || 0) || 0,
      comments: parseInt(obj["Comments"] || obj["comments"] || obj["Shares"] || 0) || 0,
      publishDate: obj["Publish Date"] || obj["publishdate"] || obj["publishDate"] || "",
      files,
      publishEvents,
      masterFiles
    });
  }
}

function restoreCampaignsFromCSV(text) {
  const rows = parseCSV(text);
  if (rows.length <= 1) return;
  state.campaigns = [];
  const headers = rows[0];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length === 0 || cols.every(c => !c.trim())) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = cols[idx]?.trim() || "";
    });
    const prospectIds = obj["Prospect IDs"] ? obj["Prospect IDs"].split(";").map(t => t.trim()).filter(Boolean) : [];
    const tags = obj["Tags"] ? obj["Tags"].split(";").map(t => t.trim()).filter(Boolean) : [];
    state.campaigns.push({
      id: obj["ID"] || obj["id"] || `camp-${Date.now()}-${i}`,
      title: obj["Title"] || obj["title"] || "Untitled Campaign",
      sequenceMediaId: obj["Sequence Media ID"] || obj["sequencemediaid"] || "",
      launchDate: obj["Launch Date"] || obj["launchdate"] || "",
      status: obj["Status"] || obj["status"] || "Active",
      tags,
      audienceListId: obj["Audience List ID"] || obj["audiencelistid"] || "",
      prospectIds,
      intendedAudience: obj["Intended Audience"] || obj["intendedaudience"] || obj["intendedAudience"] || "",
      goalSummary: obj["Goal Summary"] || obj["goalsummary"] || obj["goalSummary"] || ""
    });
  }
}

function restoreAudienceListsFromCSV(text) {
  const rows = parseCSV(text);
  if (rows.length <= 1) return;
  state.audienceLists = [];
  const headers = rows[0];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length === 0 || cols.every(c => !c.trim())) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = cols[idx]?.trim() || "";
    });
    const prospectIds = (obj["Prospect IDs"] || obj["prospectids"] || "").split(";").map(t => t.trim()).filter(Boolean);
    state.audienceLists.push({
      id: obj["ID"] || obj["id"] || `aud-${Date.now()}-${i}`,
      name: obj["Name"] || obj["name"] || "Untitled Audience List",
      prospectIds: prospectIds,
      status: obj["Status"] || obj["status"] || "active",
      notes: obj["Notes"] || obj["notes"] || ""
    });
  }
}

function restoreCompaniesFromCSV(text) {
  const rows = parseCSV(text);
  if (rows.length <= 1) return;
  state.companies = [];
  const headers = rows[0];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length === 0 || cols.every(c => !c.trim())) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = cols[idx]?.trim() || "";
    });
    const tags = obj["Tags"] ? obj["Tags"].split(";").map(t => t.trim()).filter(Boolean) : ["No Company Tag"];
    state.companies.push({
      id: obj["ID"] || obj["id"] || `comp-${Date.now()}-${i}`,
      name: obj["Name"] || obj["name"] || "Unnamed Company",
      domain: obj["Domain"] || obj["domain"] || "",
      website: obj["Website"] || obj["website"] || "",
      employees: obj["Employees"] || obj["employees"] || "",
      employeeRange: obj["Employee Range"] || obj["employeerange"] || "",
      location: obj["Location"] || obj["location"] || "",
      industry: obj["Industry"] || obj["industry"] || "General",
      description: obj["Description"] || obj["description"] || "",
      specialities: obj["Specialities"] || obj["specialities"] || "",
      headquarters: obj["Headquarters"] || obj["headquarters"] || "",
      address: obj["Address"] || obj["address"] || "",
      city: obj["City"] || obj["city"] || "",
      state: obj["State"] || obj["state"] || "",
      postal: obj["Postal"] || obj["postal"] || "",
      phone: obj["Phone"] || obj["phone"] || "",
      linkedin: obj["LinkedIn"] || obj["linkedin"] || "",
      notes: obj["Notes"] || obj["notes"] || "",
      tags
    });
  }
}

function restoreEmailAccountsFromCSV(text) {
  const rows = parseCSV(text);
  if (rows.length <= 1) return;
  state.emailAccounts = [];
  const headers = rows[0];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length === 0 || cols.every(c => !c.trim())) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = cols[idx]?.trim() || "";
    });
    state.emailAccounts.push({
      id: obj["ID"] || obj["id"] || `ea-${Date.now()}-${i}`,
      email: obj["Email"] || obj["email"] || "",
      password: obj["Password"] || obj["password"] || "",
      provider: obj["Provider"] || obj["provider"] || "",
      dashboardUrl: obj["Dashboard URL"] || obj["dashboardurl"] || "",
      status: obj["Status"] || obj["status"] || "Active",
      dailyLimit: obj["Daily Send Limit"] || obj["dailysendlimit"] || "",
      domain: obj["Sending Domain"] || obj["sendingdomain"] || "",
      notes: obj["Notes"] || obj["notes"] || "",
      dateAdded: obj["Date Added"] || obj["dateadded"] || new Date().toISOString().split("T")[0]
    });
  }
}

function restoreDomainsFromCSV(text) {
  const rows = parseCSV(text);
  if (rows.length <= 1) return;
  state.domains = [];
  const headers = rows[0];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length === 0 || cols.every(c => !c.trim())) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = cols[idx]?.trim() || "";
    });
    const linkedIdsStr = obj["Linked Email Account IDs"] || obj["linkedemailaccountids"] || "";
    state.domains.push({
      id: obj["ID"] || obj["id"] || `dom-${Date.now()}-${i}`,
      url: obj["URL"] || obj["url"] || "",
      registrar: obj["Registrar"] || obj["registrar"] || "",
      registrarDashboardUrl: obj["Registrar Dashboard URL"] || obj["registrardashboardurl"] || "",
      host: obj["Host"] || obj["host"] || "",
      hostDashboardUrl: obj["Host Dashboard URL"] || obj["hostdashboardurl"] || "",
      ip: obj["IP"] || obj["ip"] || "",
      userId: obj["User ID"] || obj["userid"] || "",
      password: obj["Password"] || obj["password"] || "",
      annualCost: obj["Annual Cost"] || obj["annualcost"] || "",
      expirationDate: obj["Expiration Date"] || obj["expirationdate"] || "",
      status: obj["Status"] || obj["status"] || "Active",
      autoRenew: obj["Auto-Renew"] || obj["autorenew"] || "No",
      dnsHealth: obj["DNS Health"] || obj["dnshealth"] || "Not Configured",
      linkedEmailAccountIds: linkedIdsStr ? linkedIdsStr.split(";").map(t => t.trim()).filter(Boolean) : [],
      notes: obj["Notes"] || obj["notes"] || "",
      dateAdded: obj["Date Added"] || obj["dateadded"] || new Date().toISOString().split("T")[0]
    });
  }
}

function restoreSettingsFromCSV(text) {
  const rows = parseCSV(text);
  if (rows.length <= 1) return;
  
  const mediaTypes = [];
  const developmentPhases = [];
  const platforms = [];
  const media_tags = [];
  const prospect_tags = [];
  const campaign_tags = [];
  const campaignPhases = [];
  const company_tags = [];
  const reachoutTypes = [];
  const emailProviders = [];
  const domainRegistrars = [];
  const domainHosts = [];
  const emailProviderDefaultUrls = {};
  const domainRegistrarDefaultUrls = {};
  const domainHostDefaultUrls = {};

  let sawMediaTypes = false;
  let sawDevelopmentPhases = false;
  let sawPlatforms = false;
  let sawMediaTags = false;
  let sawProspectTags = false;
  let sawCampaignTags = false;
  let sawCampaignPhases = false;
  let sawCompanyTags = false;
  let sawReachoutTypes = false;
  let sawEmailProviders = false;
  let sawDomainRegistrars = false;
  let sawDomainHosts = false;
  let sawEmailProviderDefaultUrls = false;
  let sawDomainRegistrarDefaultUrls = false;
  let sawDomainHostDefaultUrls = false;
  let sawTaskDateMode = false;
  let taskDateMode = "business";
  let sawColumnLayouts = false;
  let columnLayouts = null;

  const headers = rows[0];
  let typeIdx = 0;
  let valIdx = 1;
  headers.forEach((h, idx) => {
    const clean = h.trim().toLowerCase();
    if (clean.includes("type")) typeIdx = idx;
    if (clean.includes("value")) valIdx = idx;
  });
  
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length === 0 || cols.every(c => !c.trim())) continue;
    
    const type = cols[typeIdx]?.trim() || "";
    const val = cols[valIdx]?.trim() || "";
    if (!type) continue;
    
    const typeLower = type.toLowerCase();
    if (typeLower === "media type") {
      sawMediaTypes = true;
      if (val) mediaTypes.push(val);
    } else if (typeLower === "development phase") {
      sawDevelopmentPhases = true;
      if (val) developmentPhases.push(val);
    } else if (typeLower === "publishing platform") {
      sawPlatforms = true;
      if (val) platforms.push(val);
    } else if (typeLower === "managed tag" || typeLower === "media hub tag" || typeLower === "media hub tags") {
      sawMediaTags = true;
      if (val) media_tags.push(val);
    } else if (typeLower === "prospect tag") {
      sawProspectTags = true;
      if (val) prospect_tags.push(val);
    } else if (typeLower === "campaign tag") {
      sawCampaignTags = true;
      if (val) campaign_tags.push(val);
    } else if (typeLower === "campaign phase") {
      sawCampaignPhases = true;
      if (val) campaignPhases.push(val);
    } else if (typeLower === "company tag") {
      sawCompanyTags = true;
      if (val) company_tags.push(val);
    } else if (typeLower === "reachout type") {
      sawReachoutTypes = true;
      if (val) reachoutTypes.push(val);
    } else if (typeLower === "email provider") {
      sawEmailProviders = true;
      if (val) emailProviders.push(val);
    } else if (typeLower === "domain registrar") {
      sawDomainRegistrars = true;
      if (val) domainRegistrars.push(val);
    } else if (typeLower === "domain host") {
      sawDomainHosts = true;
      if (val) domainHosts.push(val);
    } else if (typeLower === "email provider default url" || typeLower === "domain registrar default url" || typeLower === "domain host default url") {
      // "Name=URL" — split on the *first* "=" only, since URLs can contain
      // their own "=" in query strings.
      const eqIdx = val.indexOf("=");
      if (eqIdx > -1) {
        const name = val.slice(0, eqIdx);
        const url = val.slice(eqIdx + 1);
        if (typeLower === "email provider default url") {
          sawEmailProviderDefaultUrls = true;
          emailProviderDefaultUrls[name] = url;
        } else if (typeLower === "domain registrar default url") {
          sawDomainRegistrarDefaultUrls = true;
          domainRegistrarDefaultUrls[name] = url;
        } else {
          sawDomainHostDefaultUrls = true;
          domainHostDefaultUrls[name] = url;
        }
      }
    } else if (typeLower === "custom sort order") {
      state.customSortOrder = val ? val.split(";").map(id => id.trim()).filter(Boolean) : [];
    } else if (typeLower === "task date mode") {
      // Phase 1 / C4.
      sawTaskDateMode = true;
      taskDateMode = val.toLowerCase() === "all" ? "all" : "business";
    } else if (typeLower === "column layouts") {
      // Phase 1 / C17. A malformed cell must not take the whole settings
      // restore down with it — a corrupt column width is cosmetic, and losing
      // every tag and reachout type in the same file is not. Leave the flag
      // down so the current layout survives untouched.
      try {
        const parsed = JSON.parse(val);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          sawColumnLayouts = true;
          columnLayouts = parsed;
        }
      } catch (err) {
        console.warn("Settings restore: 'Column Layouts' could not be parsed; keeping the current layout.", err);
      }
    }
  }

  if (sawMediaTypes) state.mediaTypes = mediaTypes;
  if (sawDevelopmentPhases) state.developmentPhases = developmentPhases;
  if (sawPlatforms) state.platforms = platforms;
  if (sawMediaTags) state.media_tags = media_tags;
  if (sawProspectTags) state.prospect_tags = prospect_tags;
  if (sawCampaignTags) state.campaign_tags = campaign_tags;
  if (sawCampaignPhases) state.campaignPhases = campaignPhases;
  if (sawCompanyTags) state.company_tags = company_tags;
  if (sawReachoutTypes) state.reachoutTypes = reachoutTypes;
  if (sawEmailProviders) state.emailProviders = emailProviders;
  if (sawDomainRegistrars) state.domainRegistrars = domainRegistrars;
  if (sawDomainHosts) state.domainHosts = domainHosts;
  if (sawEmailProviderDefaultUrls) state.emailProviderDefaultUrls = emailProviderDefaultUrls;
  if (sawDomainRegistrarDefaultUrls) state.domainRegistrarDefaultUrls = domainRegistrarDefaultUrls;
  if (sawDomainHostDefaultUrls) state.domainHostDefaultUrls = domainHostDefaultUrls;
  if (sawTaskDateMode) {
    if (!state.taskSettings || typeof state.taskSettings !== "object") state.taskSettings = {};
    state.taskSettings.dateMode = taskDateMode;
  }
  // C17. Restored wholesale like every sibling list. Unknown keys inside it
  // and keys missing from it are handled at READ time by the C15 migration
  // rule (layoutColumns / layoutColumnWidth), not here — that is what makes
  // restoring an older backup, or one written by a later version with an
  // extra column, safe.
  if (sawColumnLayouts) state.columnLayouts = columnLayouts;
}

// Phase 1 / C3. The CSV carries First Name, Last Name and Company as
// EXPORT-ONLY columns so a human can read the file. This function IGNORES all
// three and keys on Prospect ID — the only stored link to the prospect.
// Returns { total, orphans } so the caller can report the orphan count.
// An orphan (a Prospect ID that resolves to nothing) is KEPT, never discarded.
function restoreTasksFromCSV(text) {
  const rows = parseCSV(text);
  if (rows.length <= 1) return { total: 0, orphans: 0 };
  state.tasks = [];
  const headers = rows[0];
  let orphans = 0;
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length === 0 || cols.every(c => !c.trim())) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      // Header trimmed and BOM-stripped; the VALUE is not trimmed — Notes may
      // legitimately hold a multi-paragraph body whose whitespace is content.
      obj[h.trim().replace(/^\ufeff/, "")] = cols[idx] === undefined ? "" : cols[idx];
    });
    const pick = (...keys) => {
      for (const k of keys) if (obj[k] !== undefined) return obj[k];
      return "";
    };
    const prospectId = pick("Prospect ID", "prospectid", "ProspectID").trim();
    const status = pick("Status", "status").trim().toLowerCase() === "completed" ? "completed" : "open";
    const completedDate = pick("Completed Date", "completeddate").trim();
    const sourceRef = pick("Source Ref", "sourceref").trim();
    if (!prospectId || !state.prospects.some(p => p.id === prospectId)) orphans++;
    state.tasks.push({
      id: pick("Task ID", "taskid", "ID", "id").trim() || `task-${Date.now()}-${i}`,
      prospectId: prospectId,
      title: pick("Task Title", "Title", "tasktitle").trim(),
      notes: pick("Notes", "notes"),
      dueDate: pick("Due Date", "duedate").trim(),
      status: status,
      completedDate: completedDate || null,
      createdAt: pick("Created At", "createdat").trim(),
      source: pick("Source", "source").trim() || "manual",
      sourceRef: sourceRef || null
    });
  }
  return { total: state.tasks.length, orphans: orphans };
}

// Phase 1 / Session 1.3. Appended to the restore alert whenever tasks were
// part of the restore. Orphans are KEPT — this reports them, it never
// discards them, because the prospect may be restored in a later step.
function describeTaskRestore(result) {
  if (!result) return "";
  let msg = `\n\nTasks restored: ${result.total}`;
  if (result.orphans > 0) {
    msg += `\n⚠️ ${result.orphans} task${result.orphans === 1 ? " references" : "s reference"} a Prospect ID that is not in this database. Kept, not discarded.`;
  }
  return msg;
}

function handleRestoreFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  processRestoreFile(file, e.target);
}

// Shared restore engine — accepts a raw File object from either the
// drag-and-drop/<input type=file> path or the File System Access folder
// picker path. resetInputEl (optional) is cleared after a successful
// restore; only applies to the <input> path.
function processRestoreFile(file, resetInputEl) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".zip")) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      JSZip.loadAsync(evt.target.result).then(async function(zip) {
        let restoredModules = [];
        
        const prospectsFile = findFileInZip(zip, "prospects.csv");
        if (prospectsFile) {
          const text = await prospectsFile.async("string");
          restoreProspectsFromCSV(text, "prospects.csv");
          restoredModules.push("Prospects 👥");
        }
        
        const mediaFile = findFileInZip(zip, "media_content.csv") || findFileInZip(zip, "media.csv");
        if (mediaFile) {
          const text = await mediaFile.async("string");
          restoreMediaFromCSV(text);
          restoredModules.push("Media Hub 📁");
        }
        
        const campaignsFile = findFileInZip(zip, "campaigns.csv");
        if (campaignsFile) {
          const text = await campaignsFile.async("string");
          restoreCampaignsFromCSV(text);
          restoredModules.push("Campaigns 🎯");
        }
        
        const audienceListsFile = findFileInZip(zip, "prm_audience_lists.csv") || findFileInZip(zip, "audience_lists.csv") || findFileInZip(zip, "audience.csv");
        if (audienceListsFile) {
          const text = await audienceListsFile.async("string");
          restoreAudienceListsFromCSV(text);
          restoredModules.push("Audience Lists 👥");
        }
        
        const companiesFile = findFileInZip(zip, "companies.csv");
        if (companiesFile) {
          const text = await companiesFile.async("string");
          restoreCompaniesFromCSV(text);
          restoredModules.push("Companies 🏢");
        }
        
        const emailAccountsFile = findFileInZip(zip, "prm_email_accounts.csv") || findFileInZip(zip, "email_accounts.csv");
        if (emailAccountsFile) {
          const text = await emailAccountsFile.async("string");
          restoreEmailAccountsFromCSV(text);
          restoredModules.push("Email Accounts 📧");
        }

        const domainsFile = findFileInZip(zip, "prm_domains.csv") || findFileInZip(zip, "domains.csv");
        if (domainsFile) {
          const text = await domainsFile.async("string");
          restoreDomainsFromCSV(text);
          restoredModules.push("Domain Management 🌐");
        }

        // Phase 1 / C7. Tasks restore before settings so that a settings CSV
        // in the same ZIP still gets the last word on Task Date Mode.
        let zipTaskResult = null;
        const tasksFile = findFileInZip(zip, "tasks.csv");
        if (tasksFile) {
          const text = await tasksFile.async("string");
          zipTaskResult = restoreTasksFromCSV(text);
          restoredModules.push("Tasks ✅");
        }

        const settingsFile = findFileInZip(zip, "settings.csv");
        if (settingsFile) {
          const text = await settingsFile.async("string");
          restoreSettingsFromCSV(text);
          restoredModules.push("Media Hub Settings ⚙️");
        }

        const filesFolder = zip.folder("files");
        if (filesFolder) {
          const filePromises = [];
          filesFolder.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
              filePromises.push(zipEntry.async("blob").then(blob => saveFileBlob(relativePath, blob)));
            }
          });
          await Promise.all(filePromises);
          restoredModules.push("Binary Files 📎");
        }
        
        if (restoredModules.length > 0) {
          ensureStateDefaults();
          saveState();
          alert(`Successfully cleared and restored tables from ZIP:\n- ${restoredModules.join("\n- ")}${describeTaskRestore(zipTaskResult)}`);
          if (resetInputEl) resetInputEl.value = "";
          renderApp();
        } else {
          alert("No compatible CSV tables found inside the ZIP file.");
        }
      }).catch(err => {
        console.error("ZIP Load error:", err);
        alert("Error loading ZIP backup file.");
      });
    };
    reader.readAsArrayBuffer(file);
  } else if (fileName.endsWith(".csv")) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      const text = evt.target.result;
      let restoredName = "";
      let csvTaskResult = null;
      if (fileName.includes("prospect") || fileName.includes("apollo") || fileName.includes("apolllo")) {
        restoreProspectsFromCSV(text, fileName);
        restoredName = "Prospects 👥";
      } else if (fileName.includes("media")) {
        restoreMediaFromCSV(text);
        restoredName = "Media Hub 📁";
      } else if (fileName.includes("campaign")) {
        restoreCampaignsFromCSV(text);
        restoredName = "Campaigns 🎯";
      } else if (fileName.includes("audience")) {
        restoreAudienceListsFromCSV(text);
        restoredName = "Audience Lists 👥";
      } else if (fileName.includes("compan")) {
        restoreCompaniesFromCSV(text);
        restoredName = "Companies 🏢";
      } else if (fileName.includes("email")) {
        restoreEmailAccountsFromCSV(text);
        restoredName = "Email Accounts 📧";
      } else if (fileName.includes("domain")) {
        restoreDomainsFromCSV(text);
        restoredName = "Domain Management 🌐";
      } else if (fileName.includes("task")) {
        // Phase 1 / C7. "task" collides with none of the other branches.
        csvTaskResult = restoreTasksFromCSV(text);
        restoredName = "Tasks ✅";
      } else if (fileName.includes("setting")) {
        restoreSettingsFromCSV(text);
        restoredName = "Media Hub Settings ⚙️";
      } else {
        alert("Unable to detect target table from CSV filename. Name file 'prospects.csv', 'media.csv', 'campaigns.csv', 'audience_lists.csv', 'companies.csv', 'email_accounts.csv', 'domains.csv', 'tasks.csv', or 'settings.csv'.");
        return;
      }

      ensureStateDefaults();
      saveState();
      alert(`Successfully cleared and restored table: ${restoredName}${describeTaskRestore(csvTaskResult)}`);
      if (resetInputEl) resetInputEl.value = "";
      renderApp();
    };
    reader.readAsText(file);
  } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        if (workbook.SheetNames.length === 0) {
          alert("No sheets found in Excel file.");
          return;
        }
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        const csvText = rows.map(r => r.map(cell => {
          const str = cell?.toString() || "";
          return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(",")).join("\n");

        let restoredName = "";
        let xlsxTaskResult = null;
        if (fileName.includes("prospect") || fileName.includes("apollo") || fileName.includes("apolllo")) {
          restoreProspectsFromCSV(csvText, fileName);
          restoredName = "Prospects 👥";
        } else if (fileName.includes("media")) {
          restoreMediaFromCSV(csvText);
          restoredName = "Media Hub 📁";
        } else if (fileName.includes("campaign")) {
          restoreCampaignsFromCSV(csvText);
          restoredName = "Campaigns 🎯";
        } else if (fileName.includes("audience")) {
          restoreAudienceListsFromCSV(csvText);
          restoredName = "Audience Lists 👥";
        } else if (fileName.includes("compan")) {
          restoreCompaniesFromCSV(csvText);
          restoredName = "Companies 🏢";
        } else if (fileName.includes("email")) {
          restoreEmailAccountsFromCSV(csvText);
          restoredName = "Email Accounts 📧";
        } else if (fileName.includes("domain")) {
          restoreDomainsFromCSV(csvText);
          restoredName = "Domain Management 🌐";
        } else if (fileName.includes("task")) {
          // Phase 1 / C7.
          xlsxTaskResult = restoreTasksFromCSV(csvText);
          restoredName = "Tasks ✅";
        } else if (fileName.includes("setting")) {
          restoreSettingsFromCSV(csvText);
          restoredName = "Media Hub Settings ⚙️";
        } else {
          alert("Unable to detect target table from Excel filename. Name file 'prospects.xlsx', 'media.xlsx', 'campaigns.xlsx', 'audience_lists.xlsx', 'companies.xlsx', 'email_accounts.xlsx', 'domains.xlsx', 'tasks.xlsx', or 'settings.xlsx'.");
          return;
        }

        ensureStateDefaults();
        saveState();
        alert(`Successfully cleared and restored table: ${restoredName}${describeTaskRestore(xlsxTaskResult)}`);
        if (resetInputEl) resetInputEl.value = "";
        renderApp();
      } catch(err) {
        alert("Error parsing Excel restore file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert("Please select a valid ZIP, CSV or Excel backup file.");
  }
}

function initTheme() {
  const isLight = state.theme === "light";
  if (isLight) {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.remove("light-theme");
  }
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  initTheme();
  saveState();
}

/* ==========================================================================
   🔀 SPA NAVIGATION & INTERFACE COLORING
   ========================================================================== */

function switchView(viewName) {
  state.activeView = viewName;
  saveState();

  if (viewName === "media") {
    // Clear tags and all other media hub filters when opening the Media Hub
    state.activeMediaFilterTags = [];
    state.activeMediaFilterStatus = "all";
    state.activeMediaFilterType = "all";
    
    const searchInput = document.getElementById("media-search");
    if (searchInput) searchInput.value = "";
    
    const dateFilterSelect = document.getElementById("media-date-filter");
    if (dateFilterSelect) dateFilterSelect.value = "all";
    
    const startDateInput = document.getElementById("media-start-date");
    if (startDateInput) startDateInput.value = "";
    
    const endDateInput = document.getElementById("media-end-date");
    if (endDateInput) endDateInput.value = "";
    
    const sortBySelect = document.getElementById("media-sort-by");
    if (sortBySelect) sortBySelect.value = "none";
  }

  // Update navbar styling
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.classList.remove("active-tab");
    if (tab.getAttribute("data-view") === viewName) {
      tab.classList.add("active-tab");
    }
  });

  // Dynamic colors: apply appropriate CSS variables
  updateThemeColors();

  // Title Bar Header rename
  const titles = {
    "dashboard": "Dashboard",
    "prospects": "Prospect Hub",
    "media": "Media Hub",
    "campaigns": "Campaign Hub",
    "tasks": "TaskHub",
    "data-management": "Data Management"
  };
  
  const subtitles = {
    "dashboard": "",
    "prospects": "",
    "media": "Formulate articles, videos, and newsletters from raw ideas to finished, published resources.",
    "campaigns": "",
    "tasks": "",
    "data-management": "Securely back up database structures as standard ZIP/CSVs and restore existing tables."
  };
  
  document.getElementById("view-title").textContent = titles[viewName] || "Vantage PRM";
  const subtitleEl = document.getElementById("view-subtitle");
  if (subtitleEl) {
    const subText = subtitles[viewName];
    if (subText) {
      subtitleEl.textContent = subText;
      subtitleEl.style.display = "block";
    } else {
      subtitleEl.style.display = "none";
    }
  }

  // Auto-close sidebar on mobile
  if (window.innerWidth <= 900) {
    document.getElementById("sidebar").classList.remove("sidebar-visible");
  }

  renderApp();
}

function updateThemeColors() {
  document.body.className = ""; // Wipe styling classes
  initTheme(); // re-apply light theme if present
  document.body.classList.add(`module-${state.activeView}`);
}

/* ==========================================================================
   🛠️ VIEW RENDERING ENGINE
   ========================================================================== */

function renderApp() {
  // Hide all panels
  const panels = document.querySelectorAll(".view-panel");
  panels.forEach(p => p.classList.remove("active-panel"));

  // Show active view panel
  const activeEl = document.getElementById(`view-${state.activeView}`);
  if (activeEl) activeEl.classList.add("active-panel");

  if (state.activeView === "dashboard") {
    renderDashboardView();
  } else if (state.activeView === "prospects") {
    renderProspectsView();
  } else if (state.activeView === "media") {
    renderMediaView();
  } else if (state.activeView === "campaigns") {
    renderCampaignsView();
  } else if (state.activeView === "tasks") {
    renderTasksView();
  } else if (state.activeView === "data-management") {
    renderDataManagementView();
  }
}

/* ==========================================================================
   📊 RENDER VIEW: DASHBOARD
   ========================================================================== */

function renderDashboardView() {
  // Stat counts
  document.getElementById("stat-prospects-count").textContent = state.prospects.length;
  document.getElementById("stat-campaigns-count").textContent = state.campaigns.length;
  document.getElementById("stat-media-count").textContent = state.media.length;
  
  // NON_REACHOUT_TYPES / isRealReachout are now module-scope, defined above
  // getLastReachoutDate(). The local copies that used to live here were the
  // second of two lists that had to agree; they no longer exist.

  let totalReach = 0;
  state.prospects.forEach(p => {
    if (p.history) totalReach += p.history.filter(isRealReachout).length;
  });
  document.getElementById("stat-reachouts-count").textContent = totalReach;

  // Recent reachouts feed (flatten and sort chronologically)
  let reachouts = [];
  state.prospects.forEach(p => {
    if (p.history) {
      p.history.filter(isRealReachout).forEach(h => {
        reachouts.push({
          prospectName: `${p.firstName} ${p.lastName}`,
          companyName: getCompanyName(p.companyId),
          ...h
        });
      });
    }
  });

  // Sort descending by date
  reachouts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const feedContainer = document.getElementById("dashboard-recent-reachouts");
  feedContainer.innerHTML = "";

  if (reachouts.length === 0) {
    feedContainer.innerHTML = `<p style="color:var(--color-text-muted);font-size:13px;text-align:center;padding:24px;">No outreach records found yet.</p>`;
  } else {
    reachouts.slice(0, 5).forEach(r => {
      const item = document.createElement("div");
      item.className = "feed-item";
      item.innerHTML = `
        <div class="feed-left">
          <span class="feed-name">${escapeHTML(r.prospectName)} <span style="font-weight:400;color:var(--color-text-muted);">at ${escapeHTML(r.companyName)}</span></span>
          <span class="feed-detail">${escapeHTML(r.content)}</span>
        </div>
        <div class="feed-right">
          <span class="feed-type-tag">${r.type}</span>
          <span class="feed-date">${r.date}</span>
        </div>
      `;
      feedContainer.appendChild(item);
    });
  }

  // Top media list sorted by views descending
  const topMedia = [...state.media].sort((a, b) => (b.views || 0) - (a.views || 0));
  const mediaRankContainer = document.getElementById("dashboard-top-media");
  mediaRankContainer.innerHTML = "";

  if (topMedia.length === 0) {
    mediaRankContainer.innerHTML = `<p style="color:var(--color-text-muted);font-size:13px;text-align:center;padding:24px;">No media assets found.</p>`;
  } else {
    topMedia.slice(0, 5).forEach(m => {
      const item = document.createElement("div");
      item.className = "rank-item";
      item.innerHTML = `
        <div>
          <div class="rank-title" title="${escapeHTML(m.title)}">${escapeHTML(m.title)}</div>
          <span class="rank-platform">${getMediaTypeIcon(m.type)} ${escapeHTML(m.type)} • ${escapeHTML(m.platform || "Not Published")}</span>
        </div>
        <div class="rank-views">${(m.views || 0).toLocaleString()} views</div>
      `;
      mediaRankContainer.appendChild(item);
    });
  }
}

/* ==========================================================================
   👥 RENDER VIEW: PROSPECT DATABASE
   ========================================================================== */

let selectedCompanyId = null;
let lastFilteredProspects = [];
let lastFilteredCompanies = [];

function populateTagChooser() {
  const select = document.getElementById("prospect-tag-chooser");
  if (!select || select.tagName !== "SELECT") return;
  
  // Save current selection
  const selected = Array.from(select.selectedOptions).map(opt => opt.value);
  
  const allCompanyTagsStr = Array.from(new Set(state.companies.flatMap(c => c.tags || []))).map(t => t.trim()).filter(Boolean);
  const allProspectTagsStr = Array.from(new Set(state.prospects.flatMap(p => p.tags || []))).map(t => t.trim()).filter(Boolean);

  // Include the managed Prospect Tags list too, so tags added/renamed in the
  // Prospect Hub section of Settings show up immediately as filter options —
  // not just tags already assigned to a prospect record.
  // NOTE: intentionally NOT pulling in the full state.company_tags managed list
  // here — that list gets auto-seeded with placeholder defaults ("Enterprise",
  // "SMB", "Agency", "Startup") whenever it's empty, and those defaults would
  // leak into this dropdown even when no company actually carries the tag.
  // Company tags stay filter options only once a real company is tagged with them.
  const dedupePreserveOrder = (arr) => {
    const seen = new Set();
    const out = [];
    arr.forEach(item => {
      const key = item.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(item);
      }
    });
    return out;
  };

  const managedProspectTags = dedupePreserveOrder((state.prospect_tags || []).map(t => t.trim()).filter(Boolean));
  const managedSet = new Set(managedProspectTags.map(t => t.toLowerCase()));

  // Any tags actually in use (company tags on real companies, or legacy prospect
  // tags) that aren't part of the managed Prospect Tags list — keep these, but
  // list them after the managed ones, alphabetically, since they have no
  // configured order in Settings.
  const otherTags = dedupePreserveOrder([...allCompanyTagsStr, ...allProspectTagsStr])
    .filter(t => !managedSet.has(t.toLowerCase()))
    .sort();

  // Managed Prospect Tags first, in the exact order shown in Settings.
  const allTags = [...managedProspectTags, ...otherTags];

  select.innerHTML = "";
  allTags.forEach(tag => {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    if (selected.includes(tag)) opt.selected = true;
    select.appendChild(opt);
  });
}

function renderProspectsView() {
  populateTagChooser();
  const query = document.getElementById("prospect-search").value.toLowerCase().trim();
  const geoQueryStr = document.getElementById("prospect-geo-search").value.toLowerCase().trim();
  const tagSelect = document.getElementById("prospect-tag-chooser");
  
  // Parse comma-separated geo terms
  let geoTerms = [];
  if (geoQueryStr) {
    geoTerms = geoQueryStr.split(",").map(s => s.trim()).filter(Boolean);
  }
  
  // Parse comma-separated tag terms or get from select
  let tagTerms = [];
  if (tagSelect && tagSelect.tagName === "SELECT") {
    tagTerms = Array.from(tagSelect.selectedOptions).map(opt => opt.value.toLowerCase().trim());
  } else if (tagSelect) {
    const tagQueryStr = tagSelect.value.toLowerCase().trim();
    if (tagQueryStr) tagTerms = tagQueryStr.split(",").map(s => s.trim()).filter(Boolean);
  }

  // Classify tag queries into company tags vs prospect tags
  const allCompanyTagsStr = Array.from(new Set(state.companies.flatMap(c => c.tags || []))).map(t => t.toLowerCase());
  const allProspectTagsStr = Array.from(new Set(state.prospects.flatMap(p => p.tags || []))).map(t => t.toLowerCase());

  let companyTagQueries = [];
  let prospectTagQueries = [];
  
  tagTerms.forEach(term => {
    const isComp = allCompanyTagsStr.some(ct => ct.includes(term));
    const isPros = allProspectTagsStr.some(pt => pt.includes(term));
    
    if (isComp && !isPros) companyTagQueries.push(term);
    else if (isPros && !isComp) prospectTagQueries.push(term);
    else if (isComp && isPros) {
      // If it matches both types of tags, we don't know which they meant.
      // But typically they want it to match either. Let's just require it on the appropriate table.
      companyTagQueries.push(term);
      prospectTagQueries.push(term);
    } else {
      // Not found globally, push to both so it fails
      companyTagQueries.push(term);
      prospectTagQueries.push(term);
    }
  });

  if (query || geoQueryStr || tagTerms.length > 0) {
    state.forceShowAllContacts = false;
    state.forceShowAllCompanies = false;
  }

  const isBlankState = !query && !geoQueryStr && tagTerms.length === 0;

  // --- FILTER COMPANIES ---
  const compBody = document.getElementById("companies-table-body");
  compBody.innerHTML = "";
  
  let filteredCompanies = [];
  if (!isBlankState || state.forceShowAllCompanies) {
    filteredCompanies = state.companies;
    if (!state.forceShowAllCompanies) {
      filteredCompanies = state.companies.filter(c => {
      let matchGeo = true;
      if (geoTerms.length > 0) {
        const cLoc = (c.location || "").toLowerCase();
        const cCity = (c.city || "").toLowerCase();
        const cState = (c.state || "").toLowerCase();
        
        // Also check if any prospect from this company matches the geography
        const prospectsForCompany = state.prospects.filter(p => p.companyId === c.id);
        
        matchGeo = geoTerms.some(term => {
          if (term.length === 2) {
            return cState === term || prospectsForCompany.some(p => (p.state || "").toLowerCase() === term);
          }
          const pGeosMatch = prospectsForCompany.some(p => 
            (p.location || "").toLowerCase().includes(term) ||
            (p.city || "").toLowerCase().includes(term) ||
            (p.state || "").toLowerCase().includes(term)
          );
          return cLoc.includes(term) || 
                 cCity.includes(term) || 
                 cState.includes(term) || 
                 pGeosMatch;
        });
      }
      
      let matchCompTags = true;
      if (companyTagQueries.length > 0) {
        const cTags = (c.tags || []).map(t => t.toLowerCase());
        // For companies that match both, we should only require the tag if it's strictly a company tag, 
        // or if it's meant as a company tag. To be safe, we require it.
        matchCompTags = companyTagQueries.every(q => cTags.some(t => t.includes(q)));
      }
      
      let matchProsTagsForComp = true;
      if (prospectTagQueries.length > 0) {
        const prospectsForCompany = state.prospects.filter(p => p.companyId === c.id);
        matchProsTagsForComp = prospectsForCompany.some(p => {
          const pTags = (p.tags || []).map(t => t.toLowerCase());
          return prospectTagQueries.every(q => pTags.some(t => t.includes(q)));
        });
      }

      // Handle OR logic for tags that are in both
      const bothQueries = companyTagQueries.filter(q => prospectTagQueries.includes(q));
      if (bothQueries.length > 0) {
        const cTags = (c.tags || []).map(t => t.toLowerCase());
        const prospectsForCompany = state.prospects.filter(p => p.companyId === c.id);
        
        let matchBoth = bothQueries.every(q => {
          const compHasTag = cTags.some(t => t.includes(q));
          const prosHasTag = prospectsForCompany.some(p => (p.tags || []).map(t => t.toLowerCase()).some(t => t.includes(q)));
          return compHasTag || prosHasTag;
        });

        const strictCompQueries = companyTagQueries.filter(q => !bothQueries.includes(q));
        const strictProsQueries = prospectTagQueries.filter(q => !bothQueries.includes(q));

        matchCompTags = strictCompQueries.length === 0 || strictCompQueries.every(q => cTags.some(t => t.includes(q)));
        matchProsTagsForComp = strictProsQueries.length === 0 || strictProsQueries.every(q => {
          return prospectsForCompany.some(p => {
            const pTags = (p.tags || []).map(t => t.toLowerCase());
            return strictProsQueries.every(sq => pTags.some(t => t.includes(sq)));
          });
        });

        if (!matchBoth) {
          matchProsTagsForComp = false;
        }
      }

      let matchQuery = true;
      if (query) {
        const name = (c.name || "").toLowerCase();
        const tags = (c.tags || []).join(" ").toLowerCase();
        matchQuery = name.includes(query) || tags.includes(query);
      }
      
      return matchGeo && matchCompTags && matchProsTagsForComp && matchQuery;
    });
    }
  }

  // Track the effective companies list for export: full DB when no filters/tags are active, otherwise the filtered set.
  lastFilteredCompanies = (isBlankState && !state.forceShowAllCompanies) ? state.companies : filteredCompanies;

  document.getElementById("companies-count").textContent = (!isBlankState || state.forceShowAllCompanies) ? filteredCompanies.length : 0;
  if (isBlankState && !state.forceShowAllCompanies) {
    compBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--color-text-muted);">Enter search criteria above or click 'See All Companies' to view.</td></tr>`;
  } else if (filteredCompanies.length === 0) {
    compBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--color-text-muted);">No companies match your criteria.</td></tr>`;
  } else {
    filteredCompanies.forEach(c => {
      const tr = document.createElement("tr");
      if (selectedCompanyId === c.id) {
        tr.className = "active-row";
      }
      
      const tagBadges = (c.tags || []).map(t => `<span class="tag-badge">${escapeHTML(t)}</span>`).join("");
      const validWebsite = ensureUrlProtocol(c.website);
      const websiteLink = c.website ? `<a href="${escapeHTML(validWebsite)}" target="_blank" style="color:var(--color-primary); text-decoration:none;" onclick="event.stopPropagation()">Link</a>` : "—";
      
      tr.innerHTML = `
        <td style="font-weight:600;">${escapeHTML(c.name)}</td>
        <td>${escapeHTML(c.industry || "—")}</td>
        <td>${escapeHTML(c.location || "—")}</td>
        <td>${websiteLink}</td>
        <td>${tagBadges}</td>
      `;
      
      tr.addEventListener("click", () => {
        if (selectedCompanyId === c.id) {
          closeInspectorPanel();
        } else {
          selectCompany(c.id);
        }
      });

      compBody.appendChild(tr);
    });
  }

  // --- FILTER CONTACTS ---
  const tbody = document.getElementById("prospects-table-body");
  tbody.innerHTML = "";

  let filteredContacts = [];
  if (!isBlankState || state.forceShowAllContacts) {
    filteredContacts = state.prospects;
    if (!state.forceShowAllContacts) {
      filteredContacts = state.prospects.filter(p => {
        let matchGeo = true;
        if (geoTerms.length > 0) {
          const loc = (p.location || "").toLowerCase();
          const city = (p.city || "").toLowerCase();
          const stateStr = (p.state || "").toLowerCase();
          
          matchGeo = geoTerms.some(term => {
            if (term.length === 2) {
              return stateStr === term;
            }
            return loc.includes(term) || 
                   city.includes(term) || 
                   stateStr.includes(term);
          });
        }

      let matchProsTags = true;
      if (prospectTagQueries.length > 0) {
        const pTags = (p.tags || []).map(t => t.toLowerCase());
        matchProsTags = prospectTagQueries.every(q => pTags.some(t => t.includes(q)));
      }

      let matchCompTagsForPros = true;
      if (companyTagQueries.length > 0) {
        const c = state.companies.find(x => x.id === p.companyId);
        const cTags = c ? (c.tags || []).map(t => t.toLowerCase()) : [];
        matchCompTagsForPros = companyTagQueries.every(q => cTags.some(t => t.includes(q)));
      }

      // If a tag is in BOTH queries (meaning it's both a company and prospect tag globally),
      // we should allow a match if the prospect OR the company has it, to avoid being too strict.
      const bothQueries = companyTagQueries.filter(q => prospectTagQueries.includes(q));
      if (bothQueries.length > 0) {
        const c = state.companies.find(x => x.id === p.companyId);
        const cTags = c ? (c.tags || []).map(t => t.toLowerCase()) : [];
        const pTags = (p.tags || []).map(t => t.toLowerCase());
        
        let matchBoth = bothQueries.every(q => cTags.some(t => t.includes(q)) || pTags.some(t => t.includes(q)));
        
        // Remove them from strict requirements since we checked them via OR
        const strictCompQueries = companyTagQueries.filter(q => !bothQueries.includes(q));
        const strictProsQueries = prospectTagQueries.filter(q => !bothQueries.includes(q));
        
        matchCompTagsForPros = strictCompQueries.length === 0 || strictCompQueries.every(q => cTags.some(t => t.includes(q)));
        matchProsTags = strictProsQueries.length === 0 || strictProsQueries.every(q => pTags.some(t => t.includes(q)));
        
        if (!matchBoth) {
          matchProsTags = false;
        }
      }

      let matchQuery = true;
      if (query) {
        const companyName = getCompanyName(p.companyId).toLowerCase();
        const tags = (p.tags || []).join(" ").toLowerCase();
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        const title = (p.title || "").toLowerCase();
        const normTitle = normalizeTitle(title);
        const normQuery = normalizeTitle(query);

        matchQuery = fullName.includes(query) ||
               companyName.includes(query) ||
               title.includes(query) ||
               normTitle.includes(normQuery) ||
               tags.includes(query);
      }
      return matchGeo && matchProsTags && matchCompTagsForPros && matchQuery;
    });
    }
  }

  // Track the effective contacts list for export: full DB when no filters/tags are active, otherwise the filtered set.
  lastFilteredProspects = (isBlankState && !state.forceShowAllContacts) ? state.prospects : filteredContacts;

  document.getElementById("contacts-count").textContent = (!isBlankState || state.forceShowAllContacts) ? filteredContacts.length : 0;
  if (isBlankState && !state.forceShowAllContacts) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--color-text-muted);">Enter search criteria above or click 'See All Contacts' to view.</td></tr>`;
  } else if (filteredContacts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--color-text-muted);">No prospects match your criteria.</td></tr>`;
  } else {
    filteredContacts.forEach(p => {
      const tr = document.createElement("tr");
      if (state.selectedProspectId === p.id) {
        tr.className = "active-row";
      }
      
      const tagBadges = (p.tags || []).map(t => `<span class="tag-badge">${escapeHTML(t)}</span>`).join("");
      const compName = getCompanyName(p.companyId);

      tr.innerHTML = `
        <td style="font-weight:600;">${escapeHTML(p.firstName)} ${escapeHTML(p.lastName)}</td>
        <td>${escapeHTML(p.title || "—")}</td>
        <td>${escapeHTML(compName || "—")}</td>
        <td>${escapeHTML(p.city || "—")}</td>
        <td>${escapeHTML(p.state || "—")}</td>
        <td>${escapeHTML(p.location || "—")}</td>
        <td>${tagBadges}</td>
      `;

      tr.addEventListener("click", () => {
        if (state.selectedProspectId === p.id) {
          closeInspectorPanel();
        } else {
          selectProspect(p.id);
        }
      });

      tbody.appendChild(tr);
    });
  }

  renderInspector(isBlankState && !state.forceShowAllContacts && !state.forceShowAllCompanies);
}

function selectProspect(id) {
  state.selectedProspectId = id;
  selectedCompanyId = null; // Clear company selection
  saveState();
  renderProspectsView();
}

function selectCompany(id) {
  selectedCompanyId = id;
  state.selectedProspectId = null; // Clear prospect selection
  saveState();
  renderProspectsView();
}

// Closes the inspector slide-out and returns the directory to full width.
function closeInspectorPanel() {
  state.selectedProspectId = null;
  selectedCompanyId = null;
  saveState();
  renderProspectsView();
}

// Note: isBlankState no longer forces the panel closed on its own — the
// inspector is a closable slide-out now, so visibility is driven purely by
// whether a prospect/company is selected (see hasSelection below). The
// parameter is kept for backward compatibility with existing callers.
function renderInspector(isBlankState = false) {
  const emptyCard = document.getElementById("prospect-inspector-empty");
  const prospectCard = document.getElementById("prospect-inspector");
  const companyCard = document.getElementById("company-inspector");
  const layoutContainer = document.querySelector(".prospects-layout-container");

  // Hide all initially
  emptyCard.classList.add("hidden");
  prospectCard.classList.add("hidden");
  companyCard.classList.add("hidden");

  const hasSelection = !!(state.selectedProspectId || selectedCompanyId);
  layoutContainer?.classList.toggle("inspector-open", hasSelection);

  if (!hasSelection) {
    // Nothing selected — panel stays closed, directory at full width.
    return;
  }

  if (state.selectedProspectId) {
    const current = state.prospects.find(p => p.id === state.selectedProspectId);
    if (!current) {
      // Stale/deleted selection — close the panel instead of showing a
      // placeholder inside it.
      state.selectedProspectId = null;
      layoutContainer?.classList.remove("inspector-open");
      return;
    }

    prospectCard.classList.remove("hidden");

    // Load fields
    document.getElementById("inspector-name").textContent = `${current.firstName} ${current.lastName}`;
    const compName = getCompanyName(current.companyId);
    document.getElementById("inspector-title-company").innerHTML = `${escapeHTML(current.title || "—")} at <a href="#" id="link-to-company" style="color:var(--color-primary);text-decoration:none;">${escapeHTML(compName)}</a>`;
    
    document.getElementById("link-to-company").addEventListener("click", (e) => {
      e.preventDefault();
      if (current.companyId) {
        selectCompany(current.companyId);
      }
    });
    document.getElementById("inspector-email").innerHTML = current.email ? `📧 <a href="mailto:${escapeHTML(current.email)}" style="color:inherit;text-decoration:none;">${escapeHTML(current.email)}</a>` : "📧 No email";
    document.getElementById("inspector-phone").innerHTML = current.phone ? `📞 <a href="tel:${escapeHTML(current.phone)}" style="color:inherit;text-decoration:none;">${escapeHTML(current.phone)}</a>` : "📞 No phone";
    
    const cityState = [current.city, current.state].filter(Boolean).join(", ");
    document.getElementById("inspector-location").innerHTML = `📍 ${escapeHTML(cityState || "City, State")} <span style="opacity:0.7;margin-left:6px;">| Metro: ${escapeHTML(current.location || "—")}</span>`;
    
    const validLinkedin = ensureUrlProtocol(current.linkedin);
    document.getElementById("inspector-linkedin").innerHTML = current.linkedin ? `🔗 <a href="${escapeHTML(validLinkedin)}" target="_blank" style="color:#0a66c2;">LinkedIn</a>` : "🔗 No LinkedIn";

    // Render Tags
    const tagList = document.getElementById("inspector-tags-list");
    tagList.innerHTML = "";
    if (current.tags) {
      current.tags.forEach(t => {
        const chip = document.createElement("span");
        chip.className = "tag-badge";
        chip.textContent = t;
        tagList.appendChild(chip);
      });
    }

    const notesEl = document.getElementById("inspector-notes");
    if (current.notes) {
      notesEl.value = current.notes;
    } else {
      notesEl.value = "";
    }
    document.getElementById("btn-save-pros-notes")?.classList.add("hidden");

    // Render interaction rows
    const histBody = document.getElementById("inspector-history-body");
    histBody.innerHTML = "";

    if (!current.history || current.history.length === 0) {
      histBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--color-text-muted);padding:16px;">No reachout records stored.</td></tr>`;
    } else {
      const historySorted = [...current.history].sort((a, b) => new Date(b.date) - new Date(a.date));
      historySorted.forEach(h => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="font-weight:600;white-space:nowrap;">${h.date}</td>
          <td><span class="feed-type-tag">${h.type}</span></td>
          <td style="line-height:1.4;">${escapeHTML(h.content)}</td>
          <td style="text-align:center;">
            <button class="delete-interaction-btn" data-id="${h.id}" title="Remove reachout log">✕</button>
          </td>
        `;
        tr.querySelector(".delete-interaction-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          deleteInteraction(current.id, h.id);
        });
        histBody.appendChild(tr);
      });
    }

    // Render memberships & tasks — three labeled subsections, built in
    // renderInspectorMemberships() (Phase 1 / Session 1.4).
    renderInspectorMemberships(current);
  } else if (selectedCompanyId) {
    const c = state.companies.find(x => x.id === selectedCompanyId);
    if (!c) {
      // Stale/deleted selection — close the panel instead of showing a
      // placeholder inside it.
      selectedCompanyId = null;
      layoutContainer?.classList.remove("inspector-open");
      return;
    }

    companyCard.classList.remove("hidden");

    document.getElementById("inspector-comp-name").textContent = c.name;
    document.getElementById("inspector-comp-industry").textContent = c.industry || "General";
    
    const fullAddress = [c.address, c.city, c.state, c.postal].filter(Boolean).join(", ");
    document.getElementById("inspector-comp-address").innerHTML = fullAddress ? `📍 ${escapeHTML(fullAddress)}` : "📍 No address";
    document.getElementById("inspector-comp-phone").innerHTML = c.phone ? `📞 <a href="tel:${escapeHTML(c.phone)}" style="color:inherit;text-decoration:none;">${escapeHTML(c.phone)}</a>` : "📞 No phone";
    
    const validWebsite = ensureUrlProtocol(c.website);
    document.getElementById("inspector-comp-website").innerHTML = c.website ? `🌐 <a href="${escapeHTML(validWebsite)}" target="_blank" style="color:var(--color-primary);">${escapeHTML(c.website)}</a>` : "🌐 No website";
    
    const validLinkedin = ensureUrlProtocol(c.linkedin);
    document.getElementById("inspector-comp-linkedin").innerHTML = c.linkedin ? `🔗 <a href="${escapeHTML(validLinkedin)}" target="_blank" style="color:#0a66c2;">LinkedIn</a>` : "🔗 No LinkedIn";

    document.getElementById("inspector-comp-hq").innerHTML = (c.headquarters || c.location) ? `🏢 HQ: ${escapeHTML(c.headquarters || c.location)}` : "🏢 HQ: —";
    const empVal = c.employees || (c.employeeRange && /^\d+$/.test(c.employeeRange.trim()) ? c.employeeRange.trim() : "");
    document.getElementById("inspector-comp-employees").innerHTML = empVal ? `👥 ${escapeHTML(empVal)} employees` : "👥 Employees: —";
    document.getElementById("inspector-comp-description").textContent = c.description || "No description available.";
    document.getElementById("inspector-comp-specialities").textContent = c.specialities ? `Specialities: ${c.specialities}` : "Specialities: —";

    const tagList = document.getElementById("inspector-comp-tags-list");
    tagList.innerHTML = "";
    if (c.tags) {
      c.tags.forEach(t => {
        const chip = document.createElement("span");
        chip.className = "tag-badge";
        chip.textContent = t;
        tagList.appendChild(chip);
      });
    }

    const compNotesEl = document.getElementById("inspector-comp-notes");
    if (c.notes) {
      compNotesEl.value = c.notes;
    } else {
      compNotesEl.value = "";
    }
    document.getElementById("btn-save-comp-notes")?.classList.add("hidden");

    const contactsBody = document.getElementById("inspector-comp-contacts-body");
    contactsBody.innerHTML = "";
    const compContacts = state.prospects.filter(p => p.companyId === c.id);

    if (compContacts.length === 0) {
      contactsBody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--color-text-muted);padding:16px;">No contacts associated with this company.</td></tr>`;
    } else {
      compContacts.forEach(p => {
        const tr = document.createElement("tr");
        tr.style.cursor = "pointer";
        tr.innerHTML = `
          <td style="font-weight:600;">${escapeHTML(p.firstName)} ${escapeHTML(p.lastName)}</td>
          <td>${escapeHTML(p.title || "—")}</td>
          <td><button class="text-btn" style="font-size:11px;">View Profile</button></td>
        `;
        tr.addEventListener("click", () => {
          selectProspect(p.id);
        });
        contactsBody.appendChild(tr);
      });
    }
    
    const editBtn = document.getElementById("btn-edit-company-inspector");
    // Remove old listeners to prevent duplicates
    const newEditBtn = editBtn.cloneNode(true);
    editBtn.parentNode.replaceChild(newEditBtn, editBtn);
    newEditBtn.addEventListener("click", () => openCompanyModal(c.id));
  }
}


/* ==========================================================================
   ✅ INSPECTOR MEMBERSHIPS & TASKS  (Phase 1 / Session 1.4)

   #inspector-memberships is three labeled subsections — Campaigns,
   Audiences, Tasks — plus the pre-existing "Add to audience…" control,
   which is deliberately kept at the very top of the block where it has
   always been.

   Everything here is built with createElement/appendChild. `innerHTML +=`
   destroys existing listeners and has already bitten this inspector once;
   see BUILD_NOTES.md. The only innerHTML use below is a whole-container
   reset (`memEl.innerHTML = ""`), which is not the += pattern.
   ========================================================================== */

// A small labeled subsection: a heading in the given color, then a body
// element the caller fills. Returns the body so rows can be appended.
function buildInspectorSubsection(title, colorVar, headerAction) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "margin-bottom:12px;";

  const bar = document.createElement("div");
  bar.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:4px;";

  const label = document.createElement("div");
  label.style.fontWeight = "600";
  label.style.color = colorVar;
  label.textContent = title;
  bar.appendChild(label);

  if (headerAction) bar.appendChild(headerAction);
  wrap.appendChild(bar);

  const body = document.createElement("div");
  wrap.appendChild(body);

  wrap._body = body;
  return wrap;
}

function buildInspectorEmptyNote(text) {
  const note = document.createElement("div");
  note.style.cssText = "color:var(--color-text-muted); font-style:italic;";
  note.textContent = text;
  return note;
}

// A clickable membership chip. onClick is optional; without it the chip is
// inert, which is what a non-navigable row should look like.
function buildMembershipChip(text, bg, color, border, onClick) {
  const span = document.createElement("span");
  span.className = "tag-badge";
  span.style.background = bg;
  span.style.color = color;
  span.style.border = `1px solid ${border}`;
  span.textContent = text;
  if (onClick) {
    span.style.cursor = "pointer";
    span.title = "Open this record";
    span.addEventListener("click", onClick);
  }
  return span;
}

function renderInspectorMemberships(prospect) {
  const memEl = document.getElementById("inspector-memberships");
  if (!memEl || !prospect) return;   // Missing element kills the whole render otherwise.

  memEl.innerHTML = "";

  const matchedLists = state.audienceLists.filter(al => al.prospectIds && al.prospectIds.includes(prospect.id));
  const matchedCampaigns = state.campaigns.filter(c => matchedLists.some(al => al.id === c.audienceListId));

  /* --- "Add to audience…" row — PRESERVED from the pre-1.4 block. It stays
         at the top of the memberships area, outside the three subsections,
         so the restructure cannot break the add path. --- */
  const activeAuds = state.audienceLists.filter(al =>
    (al.status || "active") === "active" && !(al.prospectIds || []).includes(prospect.id)
  );
  const addRow = document.createElement("div");
  addRow.style.cssText = "display:flex; gap:6px; align-items:center; margin-bottom:10px;";
  if (activeAuds.length > 0) {
    const sel = document.createElement("select");
    sel.id = "inspector-aud-select";
    sel.style.cssText = "flex:1; background:rgba(0,0,0,0.2); border:1px solid var(--color-border); color:var(--color-text-main); padding:5px 8px; border-radius:var(--border-radius-md); font-size:12px; outline:none;";
    sel.innerHTML = `<option value="">Add to audience…</option>` +
      activeAuds.map(al => `<option value="${al.id}">${escapeHTML(al.name)}</option>`).join("");
    const addBtn = document.createElement("button");
    addBtn.className = "header-action-btn primary-btn";
    addBtn.style.cssText = "padding:5px 10px; font-size:12px; height:auto; white-space:nowrap;";
    addBtn.textContent = "+ Add";
    addBtn.addEventListener("click", () => {
      const audId = sel.value;
      if (!audId) return;
      const aud = state.audienceLists.find(a => a.id === audId);
      if (!aud) return;
      if (!aud.prospectIds) aud.prospectIds = [];
      aud.prospectIds.push(prospect.id);
      addAudienceTagToProspects([prospect.id], aud.name);
      saveState();
      renderProspectsView();
    });
    addRow.appendChild(sel);
    addRow.appendChild(addBtn);
  } else {
    const note = document.createElement("span");
    note.style.cssText = "font-size:12px; color:var(--color-text-muted); font-style:italic;";
    note.textContent = "Already in all active audiences.";
    addRow.appendChild(note);
  }
  memEl.appendChild(addRow);

  /* --- 1. Campaigns --- */
  const campSec = buildInspectorSubsection("Campaigns", "var(--color-primary)");
  if (matchedCampaigns.length === 0) {
    campSec._body.appendChild(buildInspectorEmptyNote("Not in any outreach campaign."));
  } else {
    const row = document.createElement("div");
    row.style.cssText = "display:flex; flex-wrap:wrap; gap:6px;";
    matchedCampaigns.forEach(c => {
      row.appendChild(buildMembershipChip(
        `${c.title} (${c.status})`,
        "rgba(79, 70, 229, 0.15)", "var(--color-primary)", "rgba(79, 70, 229, 0.3)",
        () => {
          switchView("campaigns");
          campaignViewSubState = "campaigns";
          renderCampaignsView();
          openCampaignDetail(c.id);
        }
      ));
    });
    campSec._body.appendChild(row);
  }
  memEl.appendChild(campSec);

  /* --- 2. Audiences --- */
  const audSec = buildInspectorSubsection("Audiences", "var(--color-secondary)");
  if (matchedLists.length === 0) {
    audSec._body.appendChild(buildInspectorEmptyNote("Not in any audience list."));
  } else {
    const row = document.createElement("div");
    row.style.cssText = "display:flex; flex-wrap:wrap; gap:6px;";
    matchedLists.forEach(al => {
      row.appendChild(buildMembershipChip(
        al.name,
        "rgba(6, 182, 212, 0.15)", "var(--color-secondary)", "rgba(6, 182, 212, 0.3)",
        () => {
          switchView("campaigns");
          campaignViewSubState = "audiences";
          selectedAudienceListId = al.id;
          renderCampaignsView();
        }
      ));
    });
    audSec._body.appendChild(row);
  }
  memEl.appendChild(audSec);

  /* --- 3. Tasks --- */
  memEl.appendChild(renderProspectInspectorTasks(prospect));
}

// Contract C8. Returns the Tasks subsection element for this prospect:
// a two-column table (Due Date · Title) of ALL tasks, completed included,
// sorted due date DESCENDING. Row click opens the editor inline (a modal
// over the inspector) — it never navigates to TaskHub, which would throw
// away the context the prospect was opened for.
function renderProspectInspectorTasks(prospect) {
  const newBtn = document.createElement("button");
  newBtn.className = "header-action-btn primary-btn";
  newBtn.style.cssText = "padding:3px 8px; font-size:11px; height:auto; white-space:nowrap;";
  newBtn.textContent = "+ New Task";
  newBtn.addEventListener("click", () => openTaskEditor(null, prospect.id));

  const sec = buildInspectorSubsection("Tasks", "var(--color-primary)", newBtn);

  const mine = (state.tasks || [])
    .filter(t => t.prospectId === prospect.id)
    .sort((a, b) => String(b.dueDate || "").localeCompare(String(a.dueDate || "")));

  if (mine.length === 0) {
    sec._body.appendChild(buildInspectorEmptyNote("No tasks for this prospect."));
    return sec;
  }

  const table = document.createElement("table");
  table.className = "premium-table";
  table.style.cssText = "width:100%; font-size:12px;";

  const thead = document.createElement("thead");
  const htr = document.createElement("tr");
  ["Due Date", "Title"].forEach((h, i) => {
    const th = document.createElement("th");
    th.textContent = h;
    if (i === 0) th.style.width = "96px";
    htr.appendChild(th);
  });
  thead.appendChild(htr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  mine.forEach(t => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.title = "Open task";

    const dateTd = document.createElement("td");
    dateTd.style.cssText = "white-space:nowrap; font-weight:600;";
    dateTd.textContent = t.dueDate || "—";

    const titleTd = document.createElement("td");
    titleTd.style.lineHeight = "1.4";
    titleTd.textContent = t.title || "(untitled)";

    if (t.status === "completed") {
      tr.style.opacity = "0.55";
      dateTd.style.textDecoration = "line-through";
      titleTd.style.textDecoration = "line-through";
    }

    tr.appendChild(dateTd);
    tr.appendChild(titleTd);
    tr.addEventListener("click", () => openTaskEditor(t.id));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  sec._body.appendChild(table);

  return sec;
}

/* ==========================================================================
   ✅ TASK EDITOR  (Phase 1 / Session 1.4, contract C8)

   One editor, two call sites: the inspector's Tasks subsection today, and
   TaskHub row clicks from Session 1.5. That is why it is a modal over the
   current view rather than a form rendered into the inspector — a form
   inside #inspector-memberships could not serve TaskHub without a second
   implementation, and C8 freezes exactly one openTaskEditor().
   ========================================================================== */

let editingTaskId = null;

function openTaskEditor(taskId = null, prospectId = null) {
  const modal = document.getElementById("modal-task");
  if (!modal) return;

  const task = taskId ? (state.tasks || []).find(t => t.id === taskId) : null;
  editingTaskId = task ? task.id : null;

  /* The prospect id lives in a HIDDEN INPUT (contract C14, Session 1.9).
     It was a <select> populated with every contact in the database, which is
     fine at four seed contacts and unusable at four hundred. It keeps its id
     and keeps carrying the value, so saveTaskFromEditor() did not change —
     that is the whole reason C14 froze the id rather than the element.
     The full-list population loop that stood here is DELETED; nothing should
     ever build a list of every contact for this field again. */
  const wanted = task ? task.prospectId : prospectId;
  document.getElementById("task-prospect").value = wanted || "";

  document.getElementById("task-modal-heading").textContent = task ? "Edit Task" : "New Task";
  document.getElementById("task-due-date").value = task ? (task.dueDate || "") : todayLocalDateStr();
  document.getElementById("task-title").value = task ? (task.title || "") : "";
  document.getElementById("task-notes").value = task ? (task.notes || "") : "";

  // Creating: prospect is implied and there is nothing to complete or
  // delete yet, so the form asks only title, due date and notes.
  const isNew = !task;
  document.getElementById("task-complete-group").classList.toggle("hidden", isNew);
  document.getElementById("task-modal-delete").classList.toggle("hidden", isNew);

  // Scope §13.5: a checkbox, not a two-value <select>. C1 is unchanged —
  // this only reads and writes the same status/completedDate fields.
  const completeBox = document.getElementById("task-complete");
  completeBox.checked = !!task && task.status === "completed";
  // §14.4: transposition is offered only when this open→completed transition
  // is actually available. Re-opening a completed task is not a completion.
  taskWasOpenOnEditorOpen = !!task && task.status !== "completed";
  resetTaskReachoutBlock();

  /* --- Prospect field: wired, not chosen. -------------------------------
     Amended 2026-08-29 (Michael, mid-1.4), amended again the same day by
     scope §13.1. Scope §3 called for an editable picker in the ordinary
     editor; it is gone. A task belongs to the prospect it was created under
     and the normal workflow offers no way to move it — not from the
     inspector, not from TaskHub. A task filed under the wrong person is
     still delete-and-recreate.

     The search is revealed in exactly ONE state, and it is not a workflow
     choice:
       ORPHAN REPAIR — the task points at a contact that no longer resolves.
     Anything else shows the prospect as fixed text.

     Session 1.5 deleted the isOrphan branch when repair lived in the
     resolution window; §13.1 made that window a list and brought repair back
     here, because a list row cannot show a task's notes and deciding whether
     to reattach or discard means reading the task.

     §15.4 (Session 1.10) DELETED the second half, `isNew && !prospectId`.
     TaskHub's "+ New Task" was its only caller and it is gone; every
     inspector create passes a prospect in. This was argued the other way
     first — keep the branch as a safety net for some future
     create-without-prospect surface — and Michael overruled it: creating a
     task without a prospect is to be prevented ON PURPOSE. The dead end is
     not a failure mode to guard against, it IS the guard. A branch that would
     let a future surface create a prospect-less task is not a safety net; it
     is the hole. saveTaskFromEditor()'s `if (!prospectId)` refusal is the
     enforcement — intended behavior, not a bug to fix.

     THE DISTINCTION THAT MUST SURVIVE: "a task cannot exist without a
     prospect" is FALSE as stated. Creation is forbidden; a task can still
     BECOME prospect-less through a restore taken before that contact existed
     or after they were deleted. Those are orphans, and they are preserved,
     chip-surfaced and repairable. Reading §15.4 as license to blank an
     unresolved prospectId or drop orphans on restore would turn orphan
     preservation into silent orphan loss — the exact failure scope §3 has
     been protecting against since the beginning.

     DO NOT WIDEN THIS TEST TO "editing". That is the part of §12.1 that
     survived every amendment and it is the load-bearing one. §15.4 narrows
     the test by removing a state; it never widens it. */
  const wantedProspect = state.prospects.find(x => x.id === wanted);
  const isOrphan = !!task && !wantedProspect;
  const needsPicker = isOrphan;

  document.getElementById("task-prospect-group").classList.toggle("hidden", !needsPicker);
  document.getElementById("task-prospect-fixed-group").classList.toggle("hidden", needsPicker);
  document.getElementById("task-orphan-warning").classList.toggle("hidden", !isOrphan);

  if (needsPicker) {
    // Repair opens on the search itself, not on a stale chosen state: an
    // orphan's stored id is preserved in the hidden input (so cancelling
    // keeps it findable) but there is no contact to display.
    syncTaskProspectSearchUI(wantedProspect || null);
  } else {
    const company = wantedProspect ? getCompanyName(wantedProspect.companyId) : "";
    const fixed = document.getElementById("task-prospect-fixed");
    fixed.textContent = wantedProspect
      ? `${wantedProspect.firstName} ${wantedProspect.lastName}${company ? " — " + company : ""}`
      : "(missing prospect)";
    // §13.8: the name is a link to that contact. Only when it resolves —
    // "(missing prospect)" has nowhere to go.
    fixed.classList.toggle("task-prospect-link", !!wantedProspect);
    fixed.title = wantedProspect ? "Save and open this contact in Prospect Hub" : "";
  }

  modal.classList.remove("hidden");
  document.getElementById("task-title").focus();
}

/* --------------------------------------------------------------------------
   Contact search — contract C14, scope §13.2 (Session 1.9)

   Three frozen elements: #task-prospect-search (query), #task-prospect-results
   (matches, built at input time), #task-prospect (hidden, carries the id).

   AN EMPTY QUERY RENDERS NOTHING. Not the full list. That is the requirement
   the whole change exists for, not an optimization — and the cap below is the
   other half of it: a query matching 400 people must not build 400 rows.
   -------------------------------------------------------------------------- */

const TASK_SEARCH_CAP = 20;
let taskSearchMatches = [];    // the prospects currently RENDERED, in order
let taskSearchActive = -1;     // keyboard highlight into taskSearchMatches

// Case-insensitive substring against first, last, "first last", and the
// resolved company name. Company is included because "who was the person at
// Acme" is how an orphan is usually remembered.
function taskProspectMatches(p, q) {
  const company = getCompanyName(p.companyId) || "";
  const hay = [
    p.firstName || "",
    p.lastName || "",
    `${p.firstName || ""} ${p.lastName || ""}`.trim(),
    company
  ];
  return hay.some(h => h.toLowerCase().includes(q));
}

function renderTaskProspectResults() {
  const box = document.getElementById("task-prospect-results");
  if (!box) return;
  box.innerHTML = "";
  taskSearchMatches = [];
  taskSearchActive = -1;

  const q = (document.getElementById("task-prospect-search").value || "").trim().toLowerCase();
  if (!q) return;   // the rule, stated once, in one place

  const all = (state.prospects || []).filter(p => taskProspectMatches(p, q));
  const shown = all.slice(0, TASK_SEARCH_CAP);
  taskSearchMatches = shown;

  if (shown.length === 0) {
    const none = document.createElement("div");
    none.className = "task-prospect-result-empty";
    none.textContent = "No contact matches that.";
    box.appendChild(none);
    return;
  }

  // createElement + addEventListener, not innerHTML +=: these rows carry
  // listeners, and += rebuilds the subtree and detaches them.
  shown.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "task-prospect-result";
    row.dataset.index = String(i);
    const company = getCompanyName(p.companyId) || "No company";
    row.textContent = `${p.firstName || ""} ${p.lastName || ""}`.trim() + ` — ${company}`;
    row.addEventListener("mousedown", (e) => {
      e.preventDefault();          // keep focus in the query field
      chooseTaskProspect(p);
    });
    box.appendChild(row);
  });

  if (all.length > shown.length) {
    const more = document.createElement("div");
    more.className = "task-prospect-result-more";
    more.textContent = `…${all.length - shown.length} more — keep typing`;
    box.appendChild(more);
  }
}

function highlightTaskSearchRow(next) {
  const box = document.getElementById("task-prospect-results");
  if (!box || taskSearchMatches.length === 0) return;
  taskSearchActive = (next + taskSearchMatches.length) % taskSearchMatches.length;
  [...box.querySelectorAll(".task-prospect-result")].forEach((el, i) => {
    el.classList.toggle("is-active", i === taskSearchActive);
  });
  const el = box.querySelector(`.task-prospect-result.is-active`);
  if (el) el.scrollIntoView({ block: "nearest" });
}

// On select the field shows the chosen contact as text with a visible way
// back to searching, and the hidden input is stamped (C14).
function chooseTaskProspect(p) {
  document.getElementById("task-prospect").value = p.id;
  syncTaskProspectSearchUI(p);
}

function syncTaskProspectSearchUI(prospect) {
  const search = document.getElementById("task-prospect-search");
  const results = document.getElementById("task-prospect-results");
  const chosen = document.getElementById("task-prospect-chosen");
  if (!search || !results || !chosen) return;

  search.value = "";
  results.innerHTML = "";
  taskSearchMatches = [];
  taskSearchActive = -1;

  const has = !!prospect;
  search.classList.toggle("hidden", has);
  results.classList.toggle("hidden", has);
  chosen.classList.toggle("hidden", !has);

  if (has) {
    const company = getCompanyName(prospect.companyId) || "No company";
    document.getElementById("task-prospect-chosen-name").textContent =
      `${prospect.firstName || ""} ${prospect.lastName || ""}`.trim() + ` — ${company}`;
  }
}

// "Change" — back to searching. Clears the hidden input too, so a half-made
// change cannot save the old id under a field that reads as empty.
function clearTaskProspectChoice() {
  document.getElementById("task-prospect").value = "";
  syncTaskProspectSearchUI(null);
  document.getElementById("task-prospect-search").focus();
}

/* --------------------------------------------------------------------------
   §14.4 transposition — a task that WAS contact logs a real reachout

   Scope §14 reversed §8: "Task Completed" is a timeline entry and never a
   reachout, because counting internal prep walks a prospect's last-contact
   date forward without anyone having spoken to them. This is the other half:
   completing "Email Jane about the RFP" SHOULD write an Email entry.

   Off by default, single-completion only. Bulk Mark Complete does not offer
   it — a selection of twelve rarely shares one contact type, and getting it
   wrong writes twelve wrong reachouts in one click.
   -------------------------------------------------------------------------- */

let taskWasOpenOnEditorOpen = false;

function resetTaskReachoutBlock() {
  const block = document.getElementById("task-log-reachout-block");
  const box = document.getElementById("task-log-reachout");
  const sel = document.getElementById("task-reachout-type");
  if (!block || !box || !sel) return;

  box.checked = false;
  sel.classList.add("hidden");

  // Contact types only — the same filter openInteractionModal() uses, and
  // for the same reason: hand-logging "Task Completed" as outreach is never
  // the intent.
  const selectable = (state.reachoutTypes || []).filter(t => !NON_REACHOUT_TYPES.includes(t));
  sel.innerHTML = "";
  selectable.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    sel.appendChild(opt);
  });
  sel.value = selectable[0] || "";

  syncTaskReachoutBlock();
}

// Visible only at the point of completion: the task was open when the editor
// opened AND the box is now ticked.
function syncTaskReachoutBlock() {
  const block = document.getElementById("task-log-reachout-block");
  const completing = taskWasOpenOnEditorOpen && document.getElementById("task-complete").checked;
  block.classList.toggle("hidden", !completing);
  if (!completing) document.getElementById("task-log-reachout").checked = false;
  document.getElementById("task-reachout-type").classList.toggle(
    "hidden", !completing || !document.getElementById("task-log-reachout").checked
  );
}

// The chosen contact type, or null for the ordinary "Task Completed" entry.
function taskReachoutTypeFromEditor() {
  if (!taskWasOpenOnEditorOpen) return null;
  if (!document.getElementById("task-complete").checked) return null;
  if (!document.getElementById("task-log-reachout").checked) return null;
  return document.getElementById("task-reachout-type").value || null;
}

function closeTaskEditor() {
  document.getElementById("modal-task")?.classList.add("hidden");
  editingTaskId = null;
}

function saveTaskFromEditor() {
  const prospectId = document.getElementById("task-prospect").value;
  const dueDate = document.getElementById("task-due-date").value;
  const title = document.getElementById("task-title").value.trim();
  // Notes is NOT trimmed: it may hold an email body, where leading and
  // trailing whitespace is content (same rule as restoreTasksFromCSV).
  const notes = document.getElementById("task-notes").value;
  // Scope §13.5: a checkbox now, not a two-value <select>. Hidden on create,
  // where an unchecked box reads "open" — the same rule Status followed.
  const status = document.getElementById("task-complete").checked ? "completed" : "open";
  const reachoutType = taskReachoutTypeFromEditor();   // §14.4, null in the ordinary case

  /* Returns TRUE on save, FALSE when validation rejected. The §13.8 prospect
     link is the caller that needs to know: it saves before navigating and must
     NOT navigate if the save was refused — the alert stands and the editor
     stays open. Every other caller ignores the value. */
  if (!prospectId) { alert("Pick a prospect for this task."); return false; }
  if (!title) { alert("A task needs a title."); return false; }
  if (!dueDate) { alert("A task needs a due date."); return false; }

  const existing = editingTaskId ? (state.tasks || []).find(t => t.id === editingTaskId) : null;

  if (existing) {
    const wasCompleted = existing.status === "completed";
    existing.prospectId = prospectId;
    existing.title = title;
    existing.notes = notes;
    existing.dueDate = dueDate;

    /* Completion transition. This does NOT set status/completedDate itself:
       it hands the open→completed transition to completeTask(), which is the
       only route to the C5 history entry (Session 1.6, scope §8). The bulk
       action bar calls the same function. Do not inline these assignments
       back here — a second completion path is how history silently stops
       being written, and the Advanced Query date filters go quietly wrong
       rather than visibly broken.
       completeTask() also handles the scope §5 sticky-visibility grace
       period, so a task completed under a filter that excludes completed
       tasks does not vanish under the cursor. */
    if (status === "completed") {
      if (!wasCompleted) {
        // reachoutType is §14.4's one branch; null gives the ordinary
        // "Task Completed" timeline entry.
        completeTask(existing.id, reachoutType);
      } else if (!existing.completedDate) {
        // Already completed, but predates completedDate. Keep it completed
        // and stamp a date; no second history entry.
        existing.completedDate = todayLocalDateStr();
      }
    } else {
      existing.status = "open";
      existing.completedDate = null;
    }
  } else {
    state.tasks.push({
      id: `task-${Date.now()}`,
      prospectId: prospectId,
      title: title,
      notes: notes,
      dueDate: dueDate,
      status: status,
      completedDate: status === "completed" ? todayLocalDateStr() : null,
      createdAt: todayLocalDateStr(),
      source: "manual",
      sourceRef: null
    });
  }

  saveState();
  closeTaskEditor();
  refreshAfterTaskChange();
  return true;
}

function deleteTask(id) {
  const idx = (state.tasks || []).findIndex(t => t.id === id);
  if (idx === -1) return;
  if (!confirm("Delete this task permanently? Completed history is not affected.")) return;
  state.tasks.splice(idx, 1);
  saveState();
  closeTaskEditor();
  refreshAfterTaskChange();
}

// Re-render whichever surface is showing tasks. Both branches are required:
// an edit made from TaskHub saves but does not repaint without the second.
function refreshAfterTaskChange() {
  if (state.activeView === "prospects") renderProspectsView();
  else if (state.activeView === "tasks") renderTasksView();

  /* Session 1.9, scope §13.1: repairing or deleting an orphan from the editor
     refreshes the list BEHIND it without closing it. The guard is the whole
     point — this must never OPEN a window the user has closed, so it acts
     only on one that is already visible. renderTaskOrphanWindow() closes
     itself and drops the chip when the last orphan is gone. */
  const ow = document.getElementById("modal-task-orphans");
  if (ow && !ow.classList.contains("hidden")) renderTaskOrphanWindow();
}

/* ==========================================================================
   ✅ RENDER VIEW: TASKHUB  (Phase 1 / Session 1.5, contracts C8 · C9 · C10)

   The sixth top-level hub. Opens on all open tasks, due date ascending, so
   past-due sits at the top and overdue work is never hidden behind a filter
   click (scope §5).

   First name, last name and company are NEVER stored on a task (contract
   C1) — they are looked up from prospectId at render time, here. An id that
   does not resolve renders "(missing prospect)" and the task is kept; see
   the orphan block at the bottom of this section for how it gets repaired.

   Selection (taskSelectedIds) is tracked but nothing consumes it yet: the
   bulk action bar is Session 1.6. The row checkbox is pure selection and
   changes nothing about the task (scope §5).
   ========================================================================== */

// Module-scope selection and paging state, contract C8. Mirrors
// aqSelectedIds / aqPage / aqPerPage rather than inventing a new pattern.
let taskSelectedIds = new Set();
let taskPage = 1;
let taskPerPage = 25;
let taskFilter = "open";   // open | pastdue | today | upcoming | range | completed | orphan
let taskSort = { key: "dueDate", dir: "asc" };

// "orphan" is present in the C8 filter list above but is NOT reachable from
// the filter strip: scope §12.2 moved Missing Prospect out of the strip and
// made it a chip that opens a resolution window. Do not rebuild it as a
// filter.

// Scope §5: a task completed while the active filter excludes completed
// tasks stays visible, struck through and dimmed, until the filter changes
// or the view reloads. This Set is that grace period and nothing else — it
// is deliberately module-scope and never persisted.
let taskStickyCompletedIds = new Set();

function markTaskStickyCompleted(id) {
  if (taskFilter !== "completed") taskStickyCompletedIds.add(id);
}

// What the last table render put on screen. Ticking a checkbox must NOT
// re-render the table — that detaches the row under the cursor, drops focus
// and scrolls the list — so the summary line is repainted from this instead.
// `ids` (Session 1.6) is the current page's task ids, so the header
// checkbox's three states can be recomputed without a render either.
let taskLastPageInfo = { total: 0, startIdx: 0, shown: 0, ids: [] };

function renderTaskHubSummary() {
  const summary = document.getElementById("taskhub-summary");
  if (!summary) return;
  const { total, startIdx, shown } = taskLastPageInfo;
  summary.textContent = total === 0
    ? "No tasks match this filter."
    : `Showing ${startIdx + 1}–${startIdx + shown} of ${total} task${total === 1 ? "" : "s"} · ${taskSelectedIds.size} selected`;
}

// The bulk action bar shows the count (scope §5).
//
// `.hidden` remains the single source of truth for "is anything selected",
// unchanged since Session 1.6. What CHANGED is what that class means for this
// one bar: §15.1 as first shipped made it display:none inside a
// height-reserved slot, and an empty 50px gap between the filters and the Per
// Page row read as a component that had failed to load. Michael amended it
// 2026-08-30 after using it — the bar is now ALWAYS VISIBLE, faded and inert
// at zero and lit on the first tick. The fade is the CSS rule on
// `#taskhub-bulk-slot > #taskhub-bulk-actions.hidden`.
//
// `disabled` is not decoration on top of that fade. `pointer-events: none`
// stops the mouse and nothing else: without this the three controls stay in
// the tab order and fire on Enter while looking greyed out — a control that
// lies about its own state, which is exactly what DIRECTIVES ladder rung 2
// rules out.
function renderTaskHubBulkBar() {
  const bar = document.getElementById("taskhub-bulk-actions");
  if (!bar) return;
  const count = taskSelectedIds.size;
  const countEl = document.getElementById("taskhub-selected-count");
  if (countEl) countEl.textContent = count;
  bar.classList.toggle("hidden", count === 0);
  bar.querySelectorAll("button").forEach(btn => { btn.disabled = count === 0; });
}

// Header select-all checkbox: checked when every row on this page is
// selected, indeterminate when some are. It reads taskLastPageInfo.ids, so
// it never needs a table render to stay honest.
function syncTaskHubHeaderCheckbox() {
  const box = document.getElementById("taskhub-select-page");
  if (!box) return;
  const ids = taskLastPageInfo.ids || [];
  const selectedOnPage = ids.filter(id => taskSelectedIds.has(id)).length;
  box.checked = ids.length > 0 && selectedOnPage === ids.length;
  box.indeterminate = selectedOnPage > 0 && selectedOnPage < ids.length;
}

// Everything a selection change must repaint — and nothing else. A row
// checkbox handler calls THIS, never renderTaskHubTable(): re-rendering
// detaches the row under the cursor and swallows the next click. See
// BUILD_NOTES, "A checkbox handler must not re-render its own table."
function syncTaskHubSelectionUI() {
  renderTaskHubSummary();
  renderTaskHubBulkBar();
  syncTaskHubHeaderCheckbox();
}

/* --------------------------------------------------------------------------
   Completion and prospect history (Session 1.6, contract C5 · scope §8)

   EXACTLY ONE function writes a "Task Completed" history entry, and every
   completion path — the editor's single completion and the bulk action —
   goes through completeTask() to reach it. This is not tidiness. The failure
   mode of a completion path that skips history is INVISIBLE: the Advanced
   Query date filters keep returning results, just wrong ones, because
   getLastReachoutDate() derives "last reachout" from history. A second
   completion path with its own field assignments is how that happens.
   -------------------------------------------------------------------------- */

// C5 ids are `hist-${Date.now()}`, which collides inside a bulk loop —
// several tasks complete in the same millisecond. Duplicate ids are not
// cosmetic: deleteInteraction() filters on `h.id !== histId`, so deleting
// one entry would silently delete every twin. The suffix follows the
// existing `task-${Date.now()}-${i}` restore precedent (plan Assumption 8);
// the C5 entry SHAPE is unchanged.
function newHistoryId(prospect) {
  const base = `hist-${Date.now()}`;
  const taken = new Set((prospect.history || []).map(h => h.id));
  if (!taken.has(base)) return base;
  let n = 1;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// The ONE writer. Returns true if an entry landed, false if the task is an
// orphan (no prospect to write to) — the task still completes either way.
// The entry is a TIMELINE record, not a reachout. "Task Completed" is IN
// NON_REACHOUT_TYPES (see that block above getLastReachoutDate), so it shows
// on the prospect's history and is excluded from last-reachout, the dashboard
// reachout counts and the Advanced Query date filters. This reverses scope §8
// and C5 as first frozen — Michael, 2026-08-29, scope §14. Do not "restore"
// the old behavior by removing it from that list; §8's premise was wrong.
//
// §14.4 TRANSPOSITION lives here as ONE BRANCH, and that is deliberate: the
// rule above ("exactly one function writes a given history entry type") does
// not get an exception for the interesting case. A second writer for "the
// completion that was really an email" is exactly the second completion path
// this whole block exists to prevent. reachoutType is null in the ordinary
// case and a registered contact type when the person said this completion WAS
// contact — the task title stays the content either way.
function logTaskCompletionHistory(task, reachoutType = null) {
  const p = state.prospects.find(x => x.id === task.prospectId);
  if (!p) return false;
  if (!p.history) p.history = [];
  p.history.push({
    id: newHistoryId(p),
    date: task.completedDate,
    type: reachoutType || "Task Completed",
    content: task.title
  });
  return true;
}

// C8. Transitions one open task to completed: status, completedDate, the
// C5 history entry, and the scope §5 sticky-visibility grace period.
// Does NOT saveState() or re-render — the caller owns that, so a bulk run
// writes once instead of N times. Already-completed tasks are skipped so a
// second Mark Complete cannot append a duplicate entry.
// reachoutType (§14.4, Session 1.9) is passed only by the editor's single
// completion. bulkCompleteTasks() never passes it — see the note there.
function completeTask(id, reachoutType = null) {
  const t = (state.tasks || []).find(x => x.id === id);
  if (!t) return { completed: false, reason: "missing" };
  if (t.status === "completed") return { completed: false, reason: "already" };

  t.status = "completed";
  t.completedDate = todayLocalDateStr();
  const logged = logTaskCompletionHistory(t, reachoutType);
  markTaskStickyCompleted(t.id);

  return { completed: true, logged: logged, reason: logged ? "ok" : "orphan" };
}

// C8. Bulk Mark Complete: confirms with the count, then one completeTask()
// per id. Completed tasks in the selection are skipped and reported, the
// same way scope §6 treats them in the bulk due-date editor.
//
// §14.4 SETTLED HERE, Session 1.9: bulk does NOT offer transposition. It
// calls completeTask() with no reachout type, so every entry is the ordinary
// "Task Completed". The scope left this open and named single-only the safe
// default; a selection of twelve rarely shares one contact type, and one
// wrong pick writes twelve wrong reachouts in a single click — into the
// reachout math, which is precisely what §14 reversed §8 to protect.
// Reversible: it is an argument, not a structure.
function bulkCompleteTasks(ids) {
  const list = [...ids];
  if (list.length === 0) { alert("Select at least one task first."); return; }

  const tasks = list
    .map(id => (state.tasks || []).find(t => t.id === id))
    .filter(Boolean);
  const open = tasks.filter(t => t.status !== "completed");
  const alreadyDone = tasks.length - open.length;

  if (open.length === 0) {
    alert(`Nothing to do — ${alreadyDone === 1 ? "that task is" : "all " + alreadyDone + " selected tasks are"} already completed.`);
    return;
  }

  let msg = `Mark ${open.length} task${open.length === 1 ? "" : "s"} complete?`;
  if (alreadyDone > 0) msg += `\n\n${alreadyDone} already-completed task${alreadyDone === 1 ? " is" : "s are"} in the selection and will be skipped.`;
  msg += `\n\nThis logs a "Task Completed" entry on each contact's history.`;
  if (!confirm(msg)) return;

  let completed = 0, orphaned = 0;
  open.forEach(t => {
    const r = completeTask(t.id);
    if (!r.completed) return;
    completed++;
    if (!r.logged) orphaned++;
  });

  saveState();

  // The rows stay visible via taskStickyCompletedIds; the selection does
  // not, because the action has been applied and re-running it on the same
  // rows is never the intent. Filter change still clears both.
  taskSelectedIds = new Set();
  renderTasksView();

  if (orphaned > 0) {
    alert(`${completed} task${completed === 1 ? "" : "s"} completed.\n\n${orphaned} had no contact to log against (missing prospect), so no history entry was written for ${orphaned === 1 ? "it" : "them"}. Resolve ${orphaned === 1 ? "it" : "them"} from the Missing Prospect chip.`);
  }
}

// Clears a selection that may span pages, which the header checkbox cannot
// reach. A full table render is correct here — every row's checkbox changes,
// and no single row is under the cursor mid-click.
function clearTaskSelection() {
  taskSelectedIds = new Set();
  renderTaskHubTable();
}

/* --------------------------------------------------------------------------
   Bulk due-date editor (Session 1.7, contract C11 · scope §6, §7)

   One modal, two modes. The global setting governs COUNTING and nothing
   else: it never snaps a hand-picked date, never warns, and is never
   retroactive. Changing state.taskSettings.dateMode does not move a single
   existing task, now or in any future session — scope §7 is explicit that a
   later session must not "helpfully" migrate them.
   -------------------------------------------------------------------------- */

// C11. Steps day by day from dateStr WITHOUT normalizing the start, counting
// only Mon-Fri when mode === "business" and every day when mode === "all",
// until |n| days have been counted. Sign of n sets direction.
//
// The arithmetic is done in UTC on purpose. A local-time Date advanced by
// setDate() across a DST boundary lands on the same calendar day it started
// (the 23-hour day), which silently loses a step — the off-by-one-day class
// BUILD_NOTES already flags for toISOString(). UTC days are always 24 hours,
// and the string is formatted back from the UTC fields, so no local offset
// ever touches the value.
//
// Frozen test vectors (C11, from scope §7) — Session 1.7 Done-when runs
// exactly these:
//   shiftTaskDate("2026-09-05", +2, "business") === "2026-09-08"  // Sat -> Tue
//   shiftTaskDate("2026-09-05", -2, "business") === "2026-09-03"  // Sat -> Thu
//   shiftTaskDate("2026-09-04", +2, "business") === "2026-09-08"  // Fri -> Tue
function shiftTaskDate(dateStr, n, mode) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || "").trim());
  if (!m) return dateStr;                     // not a YYYY-MM-DD date; leave it alone

  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (isNaN(d.getTime())) return dateStr;

  const step = Number(n) < 0 ? -1 : 1;
  let remaining = Math.abs(Math.trunc(Number(n) || 0));
  const businessOnly = mode !== "all";        // anything but "all" counts weekdays

  while (remaining > 0) {
    d.setUTCDate(d.getUTCDate() + step);
    const dow = d.getUTCDay();                // 0 Sun ... 6 Sat
    if (!businessOnly || (dow !== 0 && dow !== 6)) remaining--;
  }

  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function taskDateMode() {
  return (state.taskSettings && state.taskSettings.dateMode === "all") ? "all" : "business";
}

// Splits a selection the way scope §6 requires: completed tasks are skipped,
// never moved. Retroactively moving the due date of finished work is never
// the intent, and the skip count is reported rather than swallowed. Same
// shape bulkCompleteTasks() uses, deliberately.
function splitTaskSelectionForDueDate(ids) {
  const tasks = [...ids]
    .map(id => (state.tasks || []).find(t => t.id === id))
    .filter(Boolean);
  const open = tasks.filter(t => t.status !== "completed");
  return { tasks, open, skipped: tasks.length - open.length };
}

// C8. Opens the modal against the current selection. Refuses an empty or
// all-completed selection here rather than at apply time, so the user is
// never asked to fill in a form that cannot do anything.
function openBulkDueDateModal() {
  const modal = document.getElementById("modal-task-due-date");
  if (!modal) return;

  if (taskSelectedIds.size === 0) { alert("Select at least one task first."); return; }

  const { open, skipped } = splitTaskSelectionForDueDate(taskSelectedIds);
  if (open.length === 0) {
    alert(`Nothing to move — ${skipped === 1 ? "that task is" : "all " + skipped + " selected tasks are"} already completed.\n\nCompleted tasks are never re-dated.`);
    return;
  }

  // Defaults: shift mode, +1, and today in the date field so the picker has
  // something to open on. The date is honored exactly as typed or picked —
  // weekend or not, nothing snaps (scope §7).
  const shiftRadio = document.getElementById("bulk-due-mode-shift");
  if (shiftRadio) shiftRadio.checked = true;
  const dirSel = document.getElementById("bulk-due-direction");
  if (dirSel) dirSel.value = "1";
  const daysInput = document.getElementById("bulk-due-days");
  if (daysInput) daysInput.value = "1";
  const dateInput = document.getElementById("bulk-due-date");
  if (dateInput && !dateInput.value) dateInput.value = todayLocalDateStr();

  syncBulkDueDateModal();
  modal.classList.remove("hidden");
}

function closeBulkDueDateModal() {
  const modal = document.getElementById("modal-task-due-date");
  if (modal) modal.classList.add("hidden");
}

// Repaints the modal's mode-dependent parts: which group is visible, the
// counting note, and the affected/skipped line. Called on open and whenever
// the mode radio changes.
function syncBulkDueDateModal() {
  const setMode = document.getElementById("bulk-due-mode-set");
  const usingSet = !!(setMode && setMode.checked);

  const shiftGroup = document.getElementById("bulk-due-shift-group");
  const setGroup = document.getElementById("bulk-due-set-group");
  if (shiftGroup) shiftGroup.classList.toggle("hidden", usingSet);
  if (setGroup) setGroup.classList.toggle("hidden", !usingSet);

  const note = document.getElementById("bulk-due-mode-note");
  if (note) {
    note.textContent = usingSet
      ? "The date you pick is used exactly as entered — weekend or not."
      : (taskDateMode() === "business"
          ? "Counting business days (Mon–Fri). Change this in ⚙️ Settings → TaskHub."
          : "Counting calendar days (every day). Change this in ⚙️ Settings → TaskHub.");
  }

  const { open, skipped } = splitTaskSelectionForDueDate(taskSelectedIds);
  const summary = document.getElementById("bulk-due-summary");
  if (summary) {
    summary.textContent = skipped > 0
      ? `${open.length} task${open.length === 1 ? "" : "s"} will move · ${skipped} completed task${skipped === 1 ? "" : "s"} will be skipped`
      : `${open.length} task${open.length === 1 ? "" : "s"} will move`;
  }
}

// C8. Validates, confirms with the affected count (scope §6), then commits.
// Completed tasks in the selection are skipped and the skip count is
// reported in both the confirm and the result.
function applyBulkDueDate() {
  const { open, skipped } = splitTaskSelectionForDueDate(taskSelectedIds);
  if (open.length === 0) { alert("Nothing to move — every selected task is already completed."); return; }

  const usingSet = !!document.getElementById("bulk-due-mode-set")?.checked;
  const mode = taskDateMode();

  let describe, compute;

  if (usingSet) {
    const target = (document.getElementById("bulk-due-date")?.value || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(target)) { alert("Pick a date first."); return; }
    describe = `set to ${target}`;
    compute = () => target;                   // honored as typed, weekend or not
  } else {
    const dir = Number(document.getElementById("bulk-due-direction")?.value || 1) < 0 ? -1 : 1;
    const raw = Math.trunc(Number(document.getElementById("bulk-due-days")?.value));
    if (!Number.isFinite(raw) || raw <= 0) { alert("Enter a whole number of days, 1 or more."); return; }
    const n = dir * raw;
    const unit = mode === "business" ? "business day" : "calendar day";
    describe = `shifted ${dir < 0 ? "−" : "+"}${raw} ${unit}${raw === 1 ? "" : "s"}`;
    compute = (t) => shiftTaskDate(t.dueDate, n, mode);
  }

  let msg = `${open.length} task${open.length === 1 ? "" : "s"} will be ${describe}.`;
  if (skipped > 0) msg += `\n\n${skipped} already-completed task${skipped === 1 ? " is" : "s are"} in the selection and will be skipped.`;
  msg += `\n\nApply?`;
  if (!confirm(msg)) return;

  let moved = 0;
  open.forEach(t => {
    const next = compute(t);
    if (!next || next === t.dueDate) return;
    t.dueDate = next;
    moved++;
  });

  saveState();

  // Same convention as bulkCompleteTasks(): the action has been applied, so
  // the selection is cleared. Re-shifting the same rows a second time is not
  // the normal intent, and a shift can move a row out of the active filter.
  taskSelectedIds = new Set();
  closeBulkDueDateModal();
  renderTasksView();

  let done = `${open.length} task${open.length === 1 ? "" : "s"} ${describe}.`;
  if (moved !== open.length) done += `\n\n${open.length - moved} already had that date and did not change.`;
  if (skipped > 0) done += `\n\n${skipped} completed task${skipped === 1 ? " was" : "s were"} skipped.`;
  alert(done);
}

const TASKHUB_FILTERS = [
  { key: "open",      label: "All Open" },
  { key: "pastdue",   label: "Past Due" },
  { key: "today",     label: "Due Today" },
  { key: "upcoming",  label: "Upcoming" },
  { key: "range",     label: "Date Range" },
  { key: "completed", label: "Completed" }
];

/* TASKHUB_COLUMNS is the definition of what a column IS — its key, its label
   and its CODE DEFAULT width in px. It is NOT the on-screen sequence: that is
   `order` in the C15 record, resolved by layoutColumns("taskhub") below.
   Session 1.11
   adds the drag that writes `order`; nothing else about this changes.

   Every column carries a default width because the table is table-layout:fixed
   (per-column pixel widths do not stick otherwise) and the trailing spacer
   column absorbs whatever the real columns leave over. */
const TASKHUB_COLUMNS = [
  // 124, not Session 1.5's 104: under table-layout:fixed a column can no
  // longer grow to fit, and "DUE DATE ▲" (the default sort, so the arrow is
  // always there) needs 113px inside .premium-table th's 32px of horizontal
  // padding. At 104 the header rendered as "DUE DAT…". Found by screenshot.
  { key: "dueDate",   label: "Due Date",   width: 124 },
  { key: "firstName", label: "First Name", width: 140 },
  { key: "lastName",  label: "Last Name",  width: 160 },
  { key: "company",   label: "Company",    width: 220 },
  { key: "title",     label: "Task Title", width: 340 }
];

// C16 hit zones and the resize floor. All three zones are implemented in
// Session 1.10 even though only resize is built, so 1.11 adds a branch rather
// than rewriting the handler.
//
// Session 2B.2 renamed these from TASKHUB_* to LAYOUT_*: they are gesture
// geometry, not TaskHub's, and every table the registry below carries uses
// the same numbers. Values unchanged — 6 is the amended straddling zone from
// Session 1.8, not the original 5.
const LAYOUT_RESIZE_EDGE_PX = 6;        // C16 row 1 — resize. EACH SIDE of the divider (amended 1.8)
const LAYOUT_REORDER_THRESHOLD_PX = 4;  // C16 row 2 — reorder (Session 1.11)
const LAYOUT_MIN_COL_PX = 60;

/* --------------------------------------------------------------------------
   P7 — COLUMN_TABLES, the registry. Frozen contract, Phase 2B.

   One implementation, N consumers. A table joins the resizable/reorderable
   machinery by adding an entry here and nothing else: the resolvers, the
   writers and the drag handler all read their ids and their column list
   from this object, and `state.columnLayouts` is keyed by the same id.

   `taskhub` is the ONLY entry as of Session 2B.2 — PROSPECTS_COLUMNS and
   COMPANIES_COLUMNS are Session 2B.8's and are deliberately not written here
   yet, because this session's entire point is proving the generalisation
   against the one consumer that already works.

   Fields: `columns` the definition list (key/label/default width),
   `theadId` the STATIC <thead> the drag delegates to (the <tr> and its <th>s
   are rebuilt every render, so the binding cannot live on them), `tableId`
   the <table>, and `rowSelector` the body rows that carry real columns — the
   empty-state row is a single colSpan cell and must not be swapped.
   The <tbody> and the scroll wrapper are derived from `tableId` rather than
   listed, so a consumer cannot register half of itself.
   -------------------------------------------------------------------------- */
const COLUMN_TABLES = {
  taskhub: {
    columns: TASKHUB_COLUMNS,
    theadId: "taskhub-thead",
    tableId: "taskhub-table",
    rowSelector: "tr[data-task-id]"
  }
};

// Every function below goes through this. An unregistered id returns null and
// each caller degrades to a no-op rather than throwing mid-render.
function columnTable(tableId) {
  const def = COLUMN_TABLES[tableId];
  return (def && typeof def === "object") ? def : null;
}

/* --------------------------------------------------------------------------
   C15 read/fallback rule — the migration rule, and it is NOT optional.

   UNKNOWN keys in a saved layout are IGNORED on read; keys MISSING from it
   fall back to the code default. That is what lets a later session add a
   column without a saved layout breaking, and what makes restoring an older
   backup — or one written by a newer version with an extra column — safe.
   An unknown key is dropped from what gets RENDERED and is never deleted from
   state: deleting it would destroy a newer build's data on a round trip.
   Nothing else in the app may read state.columnLayouts.<table> directly.

   Session 2B.2 parameterised these by table id (P7). The rule itself is
   moved verbatim, not rewritten — the only change on every line is where the
   column list and the record key come from.
   -------------------------------------------------------------------------- */

function layoutRecord(tableId) {
  if (!state.columnLayouts || typeof state.columnLayouts !== "object") return {};
  const rec = state.columnLayouts[tableId];
  return (rec && typeof rec === "object") ? rec : {};
}

// The columns to render, in order. Saved keys first (unknown ones dropped),
// then any known column the saved order never mentioned.
function layoutColumns(tableId) {
  const def = columnTable(tableId);
  if (!def) return [];
  const saved = layoutRecord(tableId).order;
  const savedOrder = Array.isArray(saved) ? saved : [];
  const out = [];
  savedOrder.forEach(key => {
    const col = def.columns.find(c => c.key === key);
    if (col && !out.includes(col)) out.push(col);
  });
  def.columns.forEach(col => { if (!out.includes(col)) out.push(col); });
  return out;
}

// C15: 0 means "unset — use the code default". Not null, not absent.
function layoutColumnWidth(tableId, key) {
  const widths = layoutRecord(tableId).widths;
  const saved = (widths && typeof widths === "object") ? widths[key] : undefined;
  if (typeof saved === "number" && isFinite(saved) && saved > 0) return Math.round(saved);
  const def = columnTable(tableId);
  const col = def ? def.columns.find(c => c.key === key) : null;
  return col && col.width ? col.width : 120;
}

// Both writers need a well-formed record before they touch it, and both used
// to inline the same four lines. One place now, so a third writer cannot
// disagree with them about what an empty record looks like.
function ensureLayoutRecord(tableId) {
  const def = columnTable(tableId);
  if (!def) return null;
  if (!state.columnLayouts || typeof state.columnLayouts !== "object") state.columnLayouts = {};
  if (!state.columnLayouts[tableId] || typeof state.columnLayouts[tableId] !== "object") {
    state.columnLayouts[tableId] = { order: def.columns.map(c => c.key), widths: {} };
  }
  return state.columnLayouts[tableId];
}

// Called once per drag, on mouseup — never on mousemove. A width written on
// every frame would push a saveState() (and its debounced snapshot) through
// localStorage sixty times a second for one gesture.
function setLayoutColumnWidth(tableId, key, px) {
  const rec = ensureLayoutRecord(tableId);
  if (!rec) return;
  if (!rec.widths || typeof rec.widths !== "object") rec.widths = {};
  rec.widths[key] = Math.max(LAYOUT_MIN_COL_PX, Math.round(px));
  saveState();
}

// The order writer (Session 1.11). Same shape and the same rule as the width
// writer above: called ONCE per gesture, on drop — never on mousemove.
//
// It launders the list through the registry's column list on the way in, so
// what lands in state is always a full, valid, duplicate-free order even if
// the DOM it was read from were somehow short a column. That is the C15 read
// rule applied at write time as well, and it is why nothing downstream has to
// defend itself.
function setLayoutColumnOrder(tableId, keys) {
  const def = columnTable(tableId);
  const rec = ensureLayoutRecord(tableId);
  if (!def || !rec) return;
  const clean = [];
  (Array.isArray(keys) ? keys : []).forEach(k => {
    if (def.columns.some(c => c.key === k) && !clean.includes(k)) clean.push(k);
  });
  def.columns.forEach(c => { if (!clean.includes(c.key)) clean.push(c.key); });
  rec.order = clean;
  saveState();
}

// The prospect a task points at, or null. One lookup helper so the table,
// the sort comparator and the orphan count all agree on what "resolves"
// means.
function taskProspect(t) {
  return state.prospects.find(p => p.id === t.prospectId) || null;
}

function taskOrphanCount() {
  return (state.tasks || []).filter(t => !taskProspect(t)).length;
}

// Due-date boundary uses todayLocalDateStr(), NOT toISOString(): the latter
// is UTC and would call a task due tonight "upcoming" after 8pm local.
function taskMatchesFilter(t) {
  const today = todayLocalDateStr();
  const isOpen = t.status !== "completed";
  const due = t.dueDate || "";

  switch (taskFilter) {
    case "pastdue":   return isOpen && !!due && due < today;
    case "today":     return isOpen && due === today;
    case "upcoming":  return isOpen && !!due && due > today;
    case "completed": return !isOpen;
    case "range": {
      if (!isOpen || !due) return false;
      const start = document.getElementById("taskhub-range-start")?.value || "";
      const end = document.getElementById("taskhub-range-end")?.value || "";
      if (start && due < start) return false;
      if (end && due > end) return false;
      return true;
    }
    case "open":
    default:          return isOpen;
  }
}

function taskSortValue(t, key) {
  const p = taskProspect(t);
  switch (key) {
    case "dueDate":   return t.dueDate || "";
    case "firstName": return p ? (p.firstName || "") : "";
    case "lastName":  return p ? (p.lastName || "") : "";
    case "company":   return p ? (getCompanyName(p.companyId) || "") : "";
    case "title":     return t.title || "";
    default:          return "";
  }
}

function getTaskHubRows() {
  const rows = (state.tasks || []).filter(t =>
    taskMatchesFilter(t) || (taskFilter !== "completed" && taskStickyCompletedIds.has(t.id))
  );

  const dir = taskSort.dir === "desc" ? -1 : 1;
  rows.sort((a, b) => {
    const av = String(taskSortValue(a, taskSort.key));
    const bv = String(taskSortValue(b, taskSort.key));
    const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
    // Stable secondary key so equal values do not shuffle between renders.
    return (cmp !== 0 ? cmp : String(a.id).localeCompare(String(b.id))) * dir;
  });

  return rows;
}

function renderTasksView() {
  const tbody = document.getElementById("taskhub-body");
  if (!tbody) return;   // panel missing — never let it kill the whole render

  renderTaskHubOrphanChip();
  renderTaskHubFilterStrip();
  renderTaskHubTable();
}

function renderTaskHubFilterStrip() {
  const bar = document.getElementById("taskhub-filter-tabs");
  if (!bar) return;
  bar.innerHTML = "";

  TASKHUB_FILTERS.forEach(f => {
    const btn = document.createElement("button");
    btn.className = "media-status-filter" + (taskFilter === f.key ? " active-filter" : "");
    btn.dataset.filter = f.key;
    btn.textContent = f.label;
    btn.addEventListener("click", () => setTaskHubFilter(f.key));
    bar.appendChild(btn);
  });

  document.getElementById("taskhub-range-group")
    ?.classList.toggle("hidden", taskFilter !== "range");
}

// Changing any filter clears the selection (scope §5) and the sticky-visible
// completed rows, and returns to page 1.
function setTaskHubFilter(key) {
  taskFilter = key;
  taskSelectedIds = new Set();
  taskStickyCompletedIds = new Set();
  taskPage = 1;
  renderTasksView();
}

function renderTaskHubTable() {
  const thead = document.getElementById("taskhub-thead");
  const tbody = document.getElementById("taskhub-body");
  const pageIndicator = document.getElementById("taskhub-page-indicator");
  if (!thead || !tbody) return;

  const rows = getTaskHubRows();
  const total = rows.length;

  const perPage = parseInt(document.getElementById("taskhub-per-page")?.value, 10) || 25;
  taskPerPage = perPage;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (taskPage > totalPages) taskPage = totalPages;
  if (taskPage < 1) taskPage = 1;

  const startIdx = (taskPage - 1) * perPage;
  const pageItems = rows.slice(startIdx, startIdx + perPage);

  if (pageIndicator) pageIndicator.textContent = `Page ${taskPage} of ${totalPages}`;
  taskLastPageInfo = { total, startIdx, shown: pageItems.length, ids: pageItems.map(t => t.id) };

  /* --- Header: every column sorts, both directions --- */
  thead.innerHTML = "";
  const htr = document.createElement("tr");

  // Select-all-on-page (Session 1.6). A checkbox, NOT the Advanced Query
  // row of buttons — Michael, review pass 2026-08-29. There is deliberately
  // no "select all N matching" (plan Assumption 4); Clear Selection in the
  // bulk bar covers a selection spanning pages.
  const checkTh = document.createElement("th");
  checkTh.style.width = "36px";
  checkTh.style.textAlign = "center";
  const selectAll = document.createElement("input");
  selectAll.type = "checkbox";
  selectAll.id = "taskhub-select-page";
  selectAll.title = "Select every task on this page";
  // Unlike a row checkbox, this handler DOES re-render the table: it changes
  // every row, and the element it is attached to is rebuilt with the header
  // rather than under the cursor. The asymmetry is deliberate.
  selectAll.addEventListener("change", (e) => {
    const ids = taskLastPageInfo.ids || [];
    if (e.target.checked) ids.forEach(id => taskSelectedIds.add(id));
    else ids.forEach(id => taskSelectedIds.delete(id));
    renderTaskHubTable();
  });
  checkTh.appendChild(selectAll);
  htr.appendChild(checkTh);

  // Columns come from the C15 resolver, never from TASKHUB_COLUMNS' literal
  // sequence — that is what makes a saved order (and an old backup carrying
  // an unknown or missing key) safe to load. The BODY builds its cells from
  // this same list below, so cells can never drift out of sync with headers.
  const cols = layoutColumns("taskhub");

  cols.forEach(col => {
    const th = document.createElement("th");
    th.className = "taskhub-sortable";
    th.dataset.colKey = col.key;                        // C16 reads this
    th.style.width = layoutColumnWidth("taskhub", col.key) + "px";
    const arrow = taskSort.key === col.key ? (taskSort.dir === "asc" ? " ▲" : " ▼") : "";
    th.textContent = col.label + arrow;
    th.title = `Sort by ${col.label}`;
    th.addEventListener("click", () => {
      // C16 third row: a header click that did NOT become a drag still sorts.
      // A drag sets this flag on mouseup so the click it trails does not also
      // re-sort the column the user was only resizing.
      if (layoutSuppressNextHeaderClick) { layoutSuppressNextHeaderClick = false; return; }
      if (taskSort.key === col.key) {
        taskSort.dir = taskSort.dir === "asc" ? "desc" : "asc";
      } else {
        taskSort = { key: col.key, dir: "asc" };
      }
      taskPage = 1;
      renderTaskHubTable();
    });
    htr.appendChild(th);
  });

  // Trailing spacer column. Carries no width on purpose: under
  // table-layout:fixed it soaks up whatever the real columns do not use, so
  // shrinking one column does not stretch its neighbours — the leftover
  // collects harmlessly at the end. Same trick the email-accounts table uses.
  // It is not sortable, not resizable and not in the C15 record.
  const spacerTh = document.createElement("th");
  spacerTh.className = "taskhub-col-spacer";
  spacerTh.setAttribute("aria-hidden", "true");
  htr.appendChild(spacerTh);

  thead.appendChild(htr);

  // Summary, bulk bar and the header checkbox's three states. Runs here, not
  // at the end, so the empty-page early return below is covered too.
  syncTaskHubSelectionUI();

  /* --- Body --- */
  tbody.innerHTML = "";

  if (pageItems.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = cols.length + 2;   // checkbox column + the trailing spacer
    td.style.cssText = "text-align:center; padding:24px; color:var(--color-text-muted);";
    // §15.4: TaskHub no longer creates tasks, so it must not tell the reader
    // to click a button that is not there.
    td.textContent = taskFilter === "completed"
      ? "No completed tasks yet."
      : "No tasks match this filter. Tasks are created from a contact in the Prospect Hub.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  const today = todayLocalDateStr();

  pageItems.forEach(t => {
    const p = taskProspect(t);
    const due = t.dueDate || "";
    const isDone = t.status === "completed";

    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.title = "Open task";
    tr.dataset.taskId = t.id;

    // Row color, scope §5: overdue red, due today green, otherwise default.
    // Completion wins over both — a completed task is not "overdue".
    if (isDone) tr.classList.add("taskhub-row-done");
    else if (due && due < today) tr.classList.add("taskhub-row-overdue");
    else if (due === today) tr.classList.add("taskhub-row-today");

    // The checkbox is pure selection. It carries no state of its own and
    // changes nothing about the task (scope §5). Session 1.6's bulk action
    // bar is what consumes it.
    const checkTd = document.createElement("td");
    checkTd.style.textAlign = "center";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "taskhub-row-checkbox";
    cb.checked = taskSelectedIds.has(t.id);
    cb.addEventListener("change", (e) => {
      if (e.target.checked) taskSelectedIds.add(t.id);
      else taskSelectedIds.delete(t.id);
      syncTaskHubSelectionUI();   // NOT renderTaskHubTable() — see taskLastPageInfo
    });
    checkTd.appendChild(cb);
    tr.appendChild(checkTd);

    // Cells are built from the SAME resolved column list the header used, so
    // a reordered layout can never produce correct data under wrong labels —
    // the failure mode Session 1.11's drag would otherwise introduce.
    cols.forEach(col => {
      const td = document.createElement("td");
      switch (col.key) {
        case "dueDate":
          td.className = "taskhub-due";
          td.style.whiteSpace = "nowrap";
          td.textContent = due || "—";
          break;
        case "firstName":
          td.textContent = p ? (p.firstName || "—") : "(missing prospect)";
          break;
        case "lastName":
          td.textContent = p ? (p.lastName || "—") : "—";
          break;
        case "company":
          td.textContent = p ? (getCompanyName(p.companyId) || "—") : "—";
          break;
        case "title":
          td.style.lineHeight = "1.4";
          td.textContent = t.title || "(untitled)";
          break;
        default:
          td.textContent = "";
      }
      tr.appendChild(td);
    });

    // Matches the header's trailing spacer <th>. Without it the spacer column
    // has no body cells and the table's last column collapses on some rows.
    const spacerTd = document.createElement("td");
    spacerTd.setAttribute("aria-hidden", "true");
    tr.appendChild(spacerTd);

    tr.addEventListener("click", (e) => {
      if (e.target.closest("input")) return;   // the checkbox is not a row click
      openTaskEditor(t.id);
    });

    tbody.appendChild(tr);
  });
}

/* --------------------------------------------------------------------------
   C16 — one mousedown handler, three hit zones (Session 1.10)

   | mousedown within 5px of the th's right edge        | RESIZE that column |
   | mousedown elsewhere, then movement >= 4px          | REORDER (1.11)     |
   | mousedown elsewhere, released with movement < 4px  | SORT (unchanged)   |

   All three zones are decided HERE even though 1.10 only builds resize, so
   Session 1.11 adds a branch rather than rewriting the handler. A 1.10 that
   grabbed the whole th for resizing would have to be undone.

   The third row is the one that breaks. Sorting is existing, verified
   behaviour and a drag implementation that swallows the click kills it
   silently — so a drag sets layoutSuppressNextHeaderClick and the sort listener
   consumes the flag, rather than the drag calling stopPropagation() on a
   click it cannot see.

   Bound ONCE, delegated to the static #taskhub-thead: the header <tr> and its
   <th>s are rebuilt on every render, so a per-th binding would have to be
   re-made each time and would leak a listener per render.
   -------------------------------------------------------------------------- */

// Session 2B.2: init is now per table id, because a second consumer must be
// able to bind without the first one's flag suppressing it. The suppress flag
// stays a single module-scope boolean on purpose — only one gesture can be in
// flight at a time, and a per-table flag would be a second thing to clear.
let layoutDragInit = {};
let layoutSuppressNextHeaderClick = false;

// The checkbox column and the trailing spacer carry no data-col-key: they are
// structural, and C15 keeps them out of `order` and `widths` for the same
// reason. Returning null for them is what makes them neither resizable nor
// reorderable, with no special case anywhere else.
function layoutHeaderCell(tableId, target) {
  const def = columnTable(tableId);
  if (!def || !target || !target.closest) return null;
  return target.closest("#" + def.theadId + " th[data-col-key]");
}

/* C16 row 1, amended 2026-08-30 (Session 1.8) — the zone STRADDLES the divider.

   It used to be `right - clientX <= EDGE`: a band lying entirely INSIDE the
   left-hand column. That makes half of every divider dead. Overshoot the line
   by one pixel and you are inside the next th, where the test asks "are you
   near MY right edge?" — the answer is no, so nothing happens, and the half
   you overshot into is exactly where a cursor aimed AT the line tends to land.
   Michael reported it as "very difficult to find"; the difficulty was the
   geometry, not the 5px.

   Now: within EDGE px inside a th's right edge resizes THAT column; within
   EDGE px inside a th's LEFT edge resizes its LEFT NEIGHBOUR. Symmetrical
   around the line you can actually see, and the extra half comes from the
   neighbour rather than from the column you are on.

   Returns the th to resize, or null. Two edges stay correctly dead with no
   special case: the first data column's left neighbour is the checkbox th and
   the last one's right neighbour is the trailing spacer, and neither carries
   data-col-key, so the dataset guard below and layoutHeaderCell() reject
   them respectively.

   Zones cannot overlap: LAYOUT_MIN_COL_PX is 60 and 2 * EDGE is 12. */
function layoutResizeTarget(th, clientX) {
  const rect = th.getBoundingClientRect();
  if ((rect.right - clientX) <= LAYOUT_RESIZE_EDGE_PX && th.dataset.colKey) return th;
  if ((clientX - rect.left) <= LAYOUT_RESIZE_EDGE_PX) {
    const prev = th.previousElementSibling;
    if (prev && prev.dataset && prev.dataset.colKey) return prev;
  }
  return null;
}

/* Resize hit-tests against EVERY th, including the two structural ones, while
   sort and reorder keep using layoutHeaderCell() and stay data-columns-only.

   The reason is the LAST column. Its right-hand neighbour is the trailing
   spacer, which carries no data-col-key — so with layoutHeaderCell() as the
   hit test the straddle simply cannot reach across that divider, and the
   widest column on the table ends up the one hardest to grab: 6 live pixels
   against 12 everywhere else. Widening the hit test fixes that without making
   the spacer or the checkbox column resizable in their own right, because
   layoutResizeTarget() returns a th only when it carries a data-col-key. */
function layoutResizeHitCell(tableId, target) {
  const def = columnTable(tableId);
  if (!def || !target || !target.closest) return null;
  return target.closest("#" + def.theadId + " th");
}

/* --------------------------------------------------------------------------
   Reorder support (Session 1.11)

   Live shifting moves the REAL cells rather than painting a preview over
   them, which is what makes "the columns to the right shift to make room"
   (scope §13.4) true rather than simulated — and moving a node keeps the
   listeners on it, so the sort handler bound to a th at render time survives
   being dragged across the table.

   The header row and every body row are moved in the same step, so cells can
   never be left under the wrong label mid-drag. That is the failure mode this
   session's risk note names, and the reason it cannot happen here is
   structural, not careful coding: one function moves both or neither.
   -------------------------------------------------------------------------- */

// Data columns only, in live DOM order. The checkbox th and the trailing
// spacer th carry no data-col-key, so they are excluded by the selector and
// stay pinned at the ends with no special case.
function layoutHeaderCells(tableId) {
  const def = columnTable(tableId);
  const thead = def ? document.getElementById(def.theadId) : null;
  return thead ? Array.from(thead.querySelectorAll("th[data-col-key]")) : [];
}

/* Swap data columns i and i+1 across the header row and every data row.

   Session 2B.2: the leading-cell offset is MEASURED, not assumed. Session
   1.10's version hardcoded `i + 1` because TaskHub's checkbox column is
   always first — true of TaskHub and of nothing else. Reading the position of
   the first th[data-col-key] inside the header row gives 1 for TaskHub and
   the right answer for a table with no checkbox column, which is what the
   ProspectHub tables are. A table whose body rows do not share the header's
   leading-cell count cannot use this machinery; none does. */
function layoutLeadingCellCount(tableId) {
  const def = columnTable(tableId);
  const thead = def ? document.getElementById(def.theadId) : null;
  const htr = thead ? thead.querySelector("tr") : null;
  const first = htr ? htr.querySelector("th[data-col-key]") : null;
  if (!htr || !first) return 0;
  return Math.max(0, Array.from(htr.children).indexOf(first));
}

function layoutSwapAdjacentColumnCells(tableId, i) {
  const def = columnTable(tableId);
  if (!def) return;
  const thead = document.getElementById(def.theadId);
  const table = document.getElementById(def.tableId);
  const tbody = table ? table.querySelector("tbody") : null;
  const offset = layoutLeadingCellCount(tableId);
  const rows = [];
  const htr = thead ? thead.querySelector("tr") : null;
  if (htr) rows.push(htr);
  // The registry's rowSelector only: the empty-state row is a single colSpan
  // cell and has no columns to swap.
  if (tbody) tbody.querySelectorAll(def.rowSelector).forEach(r => rows.push(r));
  rows.forEach(row => {
    const a = row.children[i + offset];
    const b = row.children[i + offset + 1];
    if (a && b) row.insertBefore(b, a);
  });
}

// The drop indicator lives on <body>, not inside the table. A positioned
// child inside #taskhub-table would need a positioned ancestor, and adding
// `position: relative` to the table or its th is exactly what silently
// un-stuck the sticky header in Session 1.10.
// ONE drop line for every table. Only one drag runs at a time, so a second
// element would only be a second thing to hide. The id keeps its Session 1.11
// name because style.css addresses it by that id and renaming it would be a
// CSS change with no behavioural payoff in a session whose whole purpose is
// changing nothing observable.
function layoutDropLine() {
  let el = document.getElementById("taskhub-drop-line");
  if (!el) {
    el = document.createElement("div");
    el.id = "taskhub-drop-line";
    document.body.appendChild(el);
  }
  return el;
}

function showLayoutDropLine(tableId, th) {
  const def = columnTable(tableId);
  const table = def ? document.getElementById(def.tableId) : null;
  // Derived from the table, not a per-view selector: the scroll wrapper is
  // whatever .table-scroll-container the table sits in, which is true of the
  // TaskHub wrap and of both ProspectHub tables.
  const wrap = table ? table.closest(".table-scroll-container") : null;
  const r = th.getBoundingClientRect();
  const box = wrap ? wrap.getBoundingClientRect() : r;
  const el = layoutDropLine();
  el.style.display = "block";
  el.style.left = Math.round(r.left) + "px";
  el.style.top = Math.round(box.top) + "px";
  el.style.height = Math.round(box.height) + "px";
}

function hideLayoutDropLine() {
  const el = document.getElementById("taskhub-drop-line");
  if (el) el.style.display = "none";
}

function initHeaderDrag(tableId) {
  const def = columnTable(tableId);
  if (!def) return;
  const thead = document.getElementById(def.theadId);
  if (!thead || layoutDragInit[tableId]) return;
  layoutDragInit[tableId] = true;

  /* The cursor is the only thing that advertises the resize zone, and a :hover
     rule cannot know the pointer's x — so it is set from mousemove. It reads
     the SAME predicate the mousedown branch below does, which is what stops
     the cursor promising a resize the click will not perform. The cursor goes
     on the th under the pointer even when the column that would resize is its
     left neighbour: the pointer is what the user sees. */
  thead.addEventListener("mousemove", (e) => {
    const hitTh = layoutResizeHitCell(tableId, e.target);
    if (!hitTh) return;
    hitTh.style.cursor = layoutResizeTarget(hitTh, e.clientX) ? "col-resize" : "";
  });

  thead.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    const hitTh = layoutResizeHitCell(tableId, e.target);
    if (!hitTh) return;

    /* A new gesture starting means the previous gesture's trailing click has
       already been and gone — a click always precedes the next mousedown. So
       a flag still standing here did not reach a sort listener at all (the
       click landed on the header row rather than on a th, say). Clearing it
       is the difference between "one dead click after a drag", which is the
       intent, and "every header click dead from now on", which is what a
       leaked flag would mean. */
    layoutSuppressNextHeaderClick = false;

    /* --- Zone 1: resize ---
       Tested FIRST and against the wider hit cell, so a grab on the trailing
       spacer's left edge still resizes the last real column.

       `resizeTh` is NOT always the th under the pointer. On the left-edge half
       of the zone the column being resized is the previous sibling, so every
       line below reads resizeTh — the key it persists, the width it starts
       from, the class it flags and the element it sizes live. Mixing the two
       would resize one column while measuring another. */
    const resizeTh = layoutResizeTarget(hitTh, e.clientX);
    if (resizeTh) {
      e.preventDefault();     // no text selection while dragging
      e.stopPropagation();
      const key = resizeTh.dataset.colKey;
      const startX = e.clientX;
      const startWidth = resizeTh.getBoundingClientRect().width;
      let finalWidth = startWidth;

      resizeTh.classList.add("taskhub-col-resizing");
      document.body.style.cursor = "col-resize";

      const onMove = (ev) => {
        finalWidth = Math.max(LAYOUT_MIN_COL_PX, Math.round(startWidth + (ev.clientX - startX)));
        resizeTh.style.width = finalWidth + "px";   // live and cheap: no render, no save
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        resizeTh.classList.remove("taskhub-col-resizing");
        document.body.style.cursor = "";
        layoutSuppressNextHeaderClick = true;   // a drag is not a sort
        setLayoutColumnWidth(tableId, key, finalWidth);   // persisted ONCE, here
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      return;
    }

    /* --- Zones 2 and 3: distance decides, not the element ---
       Past the resize branch, sort and reorder are data-columns-only again, so
       the wider hit cell is narrowed back to a real column here. A mousedown
       on the checkbox th or the trailing spacer that was not a resize is not a
       sort and not a drag: it ends the gesture. */
    const th = layoutHeaderCell(tableId, e.target);
    if (!th) return;

    const startX = e.clientX;
    const dragTh = th;
    let passedThreshold = false;

    // No preventDefault() on the mousedown: this is also the sort path (C16
    // row 3), and suppressing the default here changes focus behaviour on a
    // plain click. Text selection is killed at the moment the gesture is
    // known to be a drag instead.
    const beginReorder = () => {
      dragTh.classList.add("taskhub-col-dragging");
      document.body.style.userSelect = "none";
      showLayoutDropLine(tableId, dragTh);
    };

    const onMove = (ev) => {
      if (!passedThreshold) {
        if (Math.abs(ev.clientX - startX) < LAYOUT_REORDER_THRESHOLD_PX) return;
        passedThreshold = true;
        beginReorder();
      }

      /* One neighbour at a time, in a loop, so a fast drag that crosses two
         columns between frames still lands correctly.

         The pointer must pass a neighbour's MIDPOINT before the swap. Using
         the neighbour's whole box instead oscillates whenever the dragged
         column is narrower than the one it displaces: the swap puts the
         pointer back inside the neighbour, which immediately swaps it back.
         With the midpoint rule the pointer always finishes on the far side of
         the boundary it just crossed, so nothing re-triggers. */
      let moved = true;
      while (moved) {
        moved = false;
        const cells = layoutHeaderCells(tableId);
        const idx = cells.indexOf(dragTh);
        if (idx === -1) break;

        const next = cells[idx + 1];
        if (next) {
          const r = next.getBoundingClientRect();
          if (ev.clientX > r.left + r.width / 2) {
            layoutSwapAdjacentColumnCells(tableId, idx);
            moved = true;
            continue;
          }
        }
        const prev = cells[idx - 1];
        if (prev) {
          const r = prev.getBoundingClientRect();
          if (ev.clientX < r.left + r.width / 2) {
            layoutSwapAdjacentColumnCells(tableId, idx - 1);
            moved = true;
          }
        }
      }
      showLayoutDropLine(tableId, dragTh);
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (!passedThreshold) return;
      // Under the threshold we fall through untouched and the click sorts.
      // C16 row 3 — the row this session is most able to break.
      layoutSuppressNextHeaderClick = true;   // a drag is not a sort
      dragTh.classList.remove("taskhub-col-dragging");
      document.body.style.userSelect = "";
      hideLayoutDropLine();
      // Persisted ONCE, here, from the order the user can actually see —
      // never per mousemove.
      setLayoutColumnOrder(tableId, layoutHeaderCells(tableId).map(c => c.dataset.colKey));

      /* And deliberately NO renderTaskHubTable() here.
         The live shift already moved the real cells, so the DOM is exactly
         what a re-render would rebuild — same widths, same sort arrow, same
         listeners on the same nodes.
         Re-rendering would also break C16 row 3 in a way that only shows up
         one gesture later: the trailing click is dispatched AFTER this
         handler returns, so replacing the <th> here leaves that click with no
         live target, layoutSuppressNextHeaderClick never gets consumed, and the
         user's NEXT genuine click on a header silently fails to sort.
         Measured, not reasoned about — the harness caught it. */
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}

/* --------------------------------------------------------------------------
   Orphan chip and resolution window (scope §12.2)

   Load-bearing, not a nicety. An orphaned task resolves to no prospect, so
   it appears in NO prospect inspector — without this window it is
   unreachable and scope §3's "tasks are never silently discarded" quietly
   becomes silent loss.

   The chip renders only above zero: no empty state, no permanently visible
   zero. It opens a window, not a table filter.
   -------------------------------------------------------------------------- */

function renderTaskHubOrphanChip() {
  const slot = document.getElementById("taskhub-orphan-chip-slot");
  if (!slot) return;
  slot.innerHTML = "";

  const count = taskOrphanCount();
  if (count === 0) return;   // above zero only — this is the whole rule

  const chip = document.createElement("button");
  chip.type = "button";
  chip.id = "taskhub-orphan-chip";
  chip.className = "taskhub-orphan-chip";
  chip.textContent = `⚠️ ${count} Missing Prospect`;
  chip.title = "These tasks point at a contact that no longer exists. Click to resolve them.";
  chip.addEventListener("click", openTaskOrphanWindow);
  slot.appendChild(chip);
}

function openTaskOrphanWindow() {
  const modal = document.getElementById("modal-task-orphans");
  if (!modal) return;
  renderTaskOrphanWindow();
  modal.classList.remove("hidden");
}

function closeTaskOrphanWindow() {
  document.getElementById("modal-task-orphans")?.classList.add("hidden");
}

/* THE WINDOW IS A LIST AND NOTHING MORE (scope §13.1, Session 1.9).
   §12.2 put Assign and Delete on every row, reasoning that deletion is the
   expected action so the list should do the work. Michael overruled it the
   same day, and the reason is worth keeping: an orphan is a task whose
   CONTENT is the only evidence of what it was for, and a row cannot show
   notes. Deciding whether to reattach or discard means reading the task,
   which means opening it. The old window made the cheap case one click and
   the correct case impossible.

   So: the whole row opens the ordinary task editor — same modal the
   inspector opens, with the contact field revealed as a search (C14) and
   Delete present. Saving or deleting there refreshes this list without
   closing it (refreshAfterTaskChange). When the last orphan is resolved the
   window closes and the chip disappears. */
function renderTaskOrphanWindow() {
  const body = document.getElementById("task-orphans-body");
  if (!body) return;
  body.innerHTML = "";

  const orphans = (state.tasks || []).filter(t => !taskProspect(t));

  if (orphans.length === 0) {
    closeTaskOrphanWindow();
    renderTasksView();
    return;
  }

  orphans.forEach(t => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.title = "Open this task";
    tr.dataset.taskId = t.id;
    tr.addEventListener("click", () => openTaskEditor(t.id));

    const dueTd = document.createElement("td");
    dueTd.style.whiteSpace = "nowrap";
    dueTd.textContent = t.dueDate || "—";
    tr.appendChild(dueTd);

    const titleTd = document.createElement("td");
    titleTd.style.lineHeight = "1.4";
    titleTd.textContent = t.title || "(untitled)";
    tr.appendChild(titleTd);

    // The unresolved id AS STORED — that is the only forensic evidence of
    // where the task came from, so it is shown verbatim, not prettified.
    const idTd = document.createElement("td");
    idTd.style.cssText = "font-family:monospace; font-size:11px; color:var(--color-text-muted); word-break:break-all;";
    idTd.textContent = t.prospectId || "(empty)";
    tr.appendChild(idTd);

    body.appendChild(tr);
  });
}

/* ==========================================================================
   📁 RENDER VIEW: MEDIA MANAGER
   ========================================================================== */

function isDateInFilter(dateStr, filterValue) {
  if (filterValue === "all") return true;
  if (!dateStr) return false; // Not published yet
  
  const itemDate = new Date(dateStr);
  if (isNaN(itemDate.getTime())) return false;
  
  const now = new Date();
  now.setHours(0,0,0,0);
  
  if (filterValue === "this-week") {
    const today = new Date(now);
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - day + (day === 0 ? -6 : 1));
    monday.setHours(0,0,0,0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);
    
    return itemDate >= monday && itemDate <= sunday;
  }
  
  if (filterValue === "last-week") {
    const today = new Date(now);
    const day = today.getDay();
    const mondayThisWeek = new Date(today);
    mondayThisWeek.setDate(today.getDate() - day + (day === 0 ? -6 : 1));
    
    const mondayLastWeek = new Date(mondayThisWeek);
    mondayLastWeek.setDate(mondayThisWeek.getDate() - 7);
    mondayLastWeek.setHours(0,0,0,0);
    
    const sundayLastWeek = new Date(mondayLastWeek);
    sundayLastWeek.setDate(mondayLastWeek.getDate() + 6);
    sundayLastWeek.setHours(23,59,59,999);
    
    return itemDate >= mondayLastWeek && itemDate <= sundayLastWeek;
  }
  
  if (filterValue === "this-month") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return itemDate >= firstDay;
  }
  
  if (filterValue === "last-month") {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return itemDate >= firstDay && itemDate <= lastDay;
  }
  
  if (filterValue === "custom") {
    const startInput = document.getElementById("media-start-date")?.value;
    const endInput = document.getElementById("media-end-date")?.value;
    
    if (!startInput && !endInput) return true; // empty custom acts like all time until filled
    
    if (startInput) {
      const startDate = new Date(startInput);
      startDate.setHours(0,0,0,0);
      if (itemDate < startDate) return false;
    }
    if (endInput) {
      const endDate = new Date(endInput);
      endDate.setHours(23,59,59,999);
      if (itemDate > endDate) return false;
    }
    return true;
  }
  
  return true;
}

function getDragAfterElement(container, x, y) {
  const draggableElements = [...container.querySelectorAll('.media-card:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;
    const distance = Math.hypot(x - centerX, y - centerY);
    
    if (distance < closest.distance) {
      const isBefore = (y < centerY) || (y === centerY && x < centerX);
      return { 
        distance: distance, 
        element: isBefore ? child : child.nextElementSibling 
      };
    } else {
      return closest;
    }
  }, { distance: Number.POSITIVE_INFINITY, element: null }).element;
}

function saveDragOrder() {
  const cardElements = document.querySelectorAll("#media-deck .media-card");
  const newOrderIds = Array.from(cardElements).map(card => {
    const btn = card.querySelector(".btn-edit-media-trig");
    return btn ? btn.getAttribute("data-id") : null;
  }).filter(Boolean);

  const orderMap = new Map(newOrderIds.map((id, index) => [id, index]));
  
  const inOrder = [];
  const notInOrder = [];
  state.media.forEach(m => {
    if (orderMap.has(m.id)) {
      inOrder.push(m);
    } else {
      notInOrder.push(m);
    }
  });
  
  inOrder.sort((a, b) => orderMap.get(a.id) - orderMap.get(b.id));
  state.media = [...inOrder, ...notInOrder];
  saveState();
}

function saveCurrentOrderAsCustom() {
  const cardElements = document.querySelectorAll("#media-deck .media-card");
  const visibleIds = Array.from(cardElements).map(card => {
    const btn = card.querySelector(".btn-edit-media-trig");
    return btn ? btn.getAttribute("data-id") : null;
  }).filter(Boolean);
  
  state.customSortOrder = visibleIds;
  saveState();
  alert("Current visible card order has been saved as 'Custom' sort!");
}

function renderMediaView() {
  // Synchronize status filter buttons active classes. Scoped to the Media
  // Hub's own status bar (#media-status-filters-bar) rather than a bare
  // ".media-status-filter" query — that class is reused as generic pill-
  // button styling by Campaign Hub's sub-tabs, Email Accounts, and Domain
  // Management, and a document-wide query here would clobber their
  // independent active-state tracking too.
  document.querySelectorAll("#media-status-filters-bar .media-status-filter").forEach(btn => {
    if (btn.getAttribute("data-status") === state.activeMediaFilterStatus) {
      btn.classList.add("active-filter");
    } else {
      btn.classList.remove("active-filter");
    }
  });

  // Render Type Filters Row dynamically based on state.mediaTypes
  const typeBar = document.getElementById("media-type-filters-bar");
  if (typeBar) {
    typeBar.innerHTML = "";
    
    // Add "All Types" button
    const allBtn = document.createElement("button");
    allBtn.className = `media-type-filter ${state.activeMediaFilterType === "all" ? "active-filter" : ""}`;
    allBtn.setAttribute("data-type", "all");
    allBtn.textContent = "All Types";
    allBtn.addEventListener("click", () => {
      state.activeMediaFilterType = "all";
      renderMediaView();
    });
    typeBar.appendChild(allBtn);
    
    state.mediaTypes.forEach(t => {
      const typeBtn = document.createElement("button");
      typeBtn.className = `media-type-filter ${state.activeMediaFilterType === t ? "active-filter" : ""}`;
      typeBtn.setAttribute("data-type", t);
      typeBtn.textContent = `${getMediaTypeIcon(t)} ${t}s`;
      typeBtn.addEventListener("click", () => {
        state.activeMediaFilterType = t;
        renderMediaView();
      });
      typeBar.appendChild(typeBtn);
    });
  }

  // Render Right-Side Global Tags Filters List dynamically
  const tagsFilterContainer = document.getElementById("media-tags-filter-list");
  if (tagsFilterContainer) {
    tagsFilterContainer.innerHTML = "";
    
    // Add "All Tags" button
    const allChip = document.createElement("button");
    allChip.className = `tag-filter-btn ${state.activeMediaFilterTags.length === 0 ? "active-filter" : ""}`;
    const allCount = state.media.length;
    allChip.innerHTML = `<span>🏷️ All Tags</span> <span class="query-matched-badge" style="background:rgba(255,255,255,0.1);color:inherit;margin-left:8px;">${allCount}</span>`;
    allChip.addEventListener("click", () => {
      state.activeMediaFilterTags = [];
      renderMediaView();
    });
    tagsFilterContainer.appendChild(allChip);

    // List all dynamic tags managed in state
    state.media_tags.forEach(tag => {
      const chip = document.createElement("button");
      chip.className = `tag-filter-btn ${state.activeMediaFilterTags.includes(tag) ? "active-filter" : ""}`;
      const count = state.media.filter(m => (m.media_tags || []).includes(tag)).length;
      chip.innerHTML = `<span># ${escapeHTML(tag)}</span> <span class="query-matched-badge" style="background:rgba(255,255,255,0.1);color:inherit;margin-left:8px;">${count}</span>`;
      chip.addEventListener("click", () => {
        const index = state.activeMediaFilterTags.indexOf(tag);
        if (index > -1) {
          state.activeMediaFilterTags.splice(index, 1);
        } else {
          state.activeMediaFilterTags.push(tag);
        }
        renderMediaView();
      });
      tagsFilterContainer.appendChild(chip);
    });
  }

  // Get date filter and custom picker display toggle
  const dateFilter = document.getElementById("media-date-filter")?.value || "all";
  const customContainer = document.getElementById("media-custom-date-container");
  if (customContainer) {
    if (dateFilter === "custom") {
      customContainer.style.display = "inline-flex";
    } else {
      customContainer.style.display = "none";
    }
  }

  const query = document.getElementById("media-search").value.toLowerCase().trim();
  const deck = document.getElementById("media-deck");
  deck.innerHTML = "";

  const filtered = state.media.filter(m => {
    // 1. Status Filter check
    if (state.activeMediaFilterStatus !== "all" && m.status !== state.activeMediaFilterStatus) {
      return false;
    }
    // 1b. Type Filter check
    if (state.activeMediaFilterType !== "all" && m.type !== state.activeMediaFilterType) {
      return false;
    }
    // 1c. Tag Filter check (multi-select AND logic)
    if (state.activeMediaFilterTags && state.activeMediaFilterTags.length > 0) {
      const hasAllTags = state.activeMediaFilterTags.every(tag => (m.media_tags || []).includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }
    // 1d. Date Range Filter check
    if (!isDateInFilter(m.publishDate, dateFilter)) {
      return false;
    }
    // 2. Search check
    if (query) {
      const title = m.title.toLowerCase();
      const outline = (m.outline || "").toLowerCase();
      const content = (m.content || "").toLowerCase();
      const tags = (m.media_tags || []).join(" ").toLowerCase();
      return title.includes(query) || outline.includes(query) || content.includes(query) || tags.includes(query);
    }
    return true;
  });

  // Helper for active/expired publish dates
  const getActivePublishDate = (item) => {
    if (!item.publishEvents || item.publishEvents.length === 0) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const active = item.publishEvents.filter(ev => {
      if (!ev.expirationDate) return true;
      const exp = new Date(ev.expirationDate);
      exp.setHours(23, 59, 59, 999);
      return exp >= now;
    });
    if (active.length === 0) return null;
    const sorted = [...active].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted[0].date;
  };

  const getMostRecentExpiredPublishDate = (item) => {
    if (!item.publishEvents || item.publishEvents.length === 0) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expired = item.publishEvents.filter(ev => {
      if (!ev.expirationDate) return false;
      const exp = new Date(ev.expirationDate);
      exp.setHours(23, 59, 59, 999);
      return exp < now;
    });
    if (expired.length === 0) return null;
    const sorted = [...expired].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted[0].date;
  };

  // Sort by Engagement & Views & Clicks & Comments
  const sortBy = document.getElementById("media-sort-by")?.value || "none";
  if (sortBy === "custom") {
    const customOrder = state.customSortOrder || [];
    filtered.sort((a, b) => {
      const idxA = customOrder.indexOf(a.id);
      const idxB = customOrder.indexOf(b.id);
      const hasA = idxA > -1;
      const hasB = idxB > -1;
      
      if (hasA && hasB) return idxA - idxB;
      if (hasA && !hasB) return -1;
      if (!hasA && hasB) return 1;
      return state.media.indexOf(a) - state.media.indexOf(b);
    });
  } else if (sortBy === "title-asc") {
    filtered.sort((a, b) => (a.title || "").toLowerCase().localeCompare((b.title || "").toLowerCase()));
  } else if (sortBy === "title-desc") {
    filtered.sort((a, b) => (b.title || "").toLowerCase().localeCompare((a.title || "").toLowerCase()));
  } else if (sortBy === "publish-date-desc") {
    filtered.sort((a, b) => {
      const dateA = getActivePublishDate(a);
      const dateB = getActivePublishDate(b);
      
      if (dateA && dateB) return new Date(dateB) - new Date(dateA);
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      
      const expA = getMostRecentExpiredPublishDate(a);
      const expB = getMostRecentExpiredPublishDate(b);
      
      if (expA && expB) return new Date(expB) - new Date(expA);
      if (expA && !expB) return -1;
      if (!expA && expB) return 1;
      
      return state.media.indexOf(a) - state.media.indexOf(b);
    });
  } else if (sortBy === "views-desc") {
    filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
  } else if (sortBy === "views-asc") {
    filtered.sort((a, b) => (a.views || 0) - (b.views || 0));
  } else if (sortBy === "clicks-desc") {
    filtered.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
  } else if (sortBy === "comments-desc") {
    filtered.sort((a, b) => (b.comments || b.shares || 0) - (a.comments || a.shares || 0));
  } else if (sortBy === "total-engagement-desc") {
    filtered.sort((a, b) => {
      const engagementA = (a.views || 0) + (a.clicks || 0) + (a.comments || a.shares || 0);
      const engagementB = (b.views || 0) + (b.clicks || 0) + (b.comments || b.shares || 0);
      return engagementB - engagementA;
    });
  }

  if (filtered.length === 0) {
    deck.innerHTML = `<div style="grid-column: span 3; text-align:center; padding:48px; color:var(--color-text-muted);">No media items fit this filter view. Add a content card to begin!</div>`;
  } else {
    filtered.forEach(m => {
      const card = document.createElement("div");
      card.className = "media-card";
      card.setAttribute("draggable", "true");
      
      card.addEventListener("dragstart", (e) => {
        card.classList.add("dragging");
      });
      
      card.addEventListener("dragend", (e) => {
        card.classList.remove("dragging");
        
        // Reset sort dropdown to "none" if we drag/drop
        const sortBySelect = document.getElementById("media-sort-by");
        if (sortBySelect && sortBySelect.value !== "none" && sortBySelect.value !== "custom") {
          sortBySelect.value = "none";
        }
        
        saveDragOrder();
        renderMediaView();
      });
      
      const fileCount = m.files ? m.files.length : 0;
      const fileBadge = fileCount > 0 ? `<span class="media-file-badge" style="font-size: 9px; padding: 2px 6px; border-radius: var(--border-radius-sm);">📎 ${fileCount} file${fileCount > 1 ? 's' : ''}</span>` : '';
      const tagBadges = (m.media_tags || []).map(t => `<span class="tag-badge">${escapeHTML(t)}</span>`).join("");

      const statusOptionsHtml = state.developmentPhases.map(p => {
        const selected = (p === m.status) ? "selected" : "";
        const icon = getDevelopmentPhaseIcon(p);
        return `<option value="${p}" ${selected}>${icon ? icon + " " : ""}${p}</option>`;
      }).join("");

      let displayPlatform = m.platform || "Unassigned";
      let publishDateRow = "";
      if (m.publishEvents && m.publishEvents.length > 0) {
        const sortedEvents = [...m.publishEvents].sort((a, b) => new Date(b.date) - new Date(a.date));
        if (sortedEvents[0]) {
          displayPlatform = sortedEvents[0].platform || "Unassigned";
          if (sortedEvents[0].date) {
            publishDateRow = `<span style="font-size: 10px; color: var(--color-text-muted); margin-top: 2px;">Published on: <strong>${escapeHTML(sortedEvents[0].date)}</strong></span>`;
          }
        }
      }

      card.innerHTML = `
        <div class="media-card-header">
          <span class="media-type-badge">${getMediaTypeIcon(m.type)} ${escapeHTML(m.type)}</span>
          <select class="media-status-select clickable-status-select" data-id="${m.id}">
            ${statusOptionsHtml}
          </select>
        </div>
        
        <div class="media-card-body">
          <h3>${escapeHTML(m.title)}</h3>
          <p class="media-pitch">${escapeHTML(m.outline || "No outline summary added.")}</p>
          <div class="media-tags-list">${tagBadges}</div>
        </div>
        
        <div class="media-card-footer">
          <div class="media-compact-stats">
            <div style="display: flex; flex-direction: column; gap: 1px; align-items: flex-start;">
              <span>Platform: <strong>${escapeHTML(displayPlatform)}</strong></span>
              ${publishDateRow}
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              ${fileBadge}
              <span title="Views" style="font-weight: 700; color: var(--color-secondary); display: inline-flex; align-items: center; gap: 2px;">👁️ ${(m.views || 0).toLocaleString()}</span>
              <span title="Clicks" style="font-weight: 700; color: var(--color-primary); display: inline-flex; align-items: center; gap: 2px;">🖱️ ${(m.clicks || 0).toLocaleString()}</span>
              <span title="Comments & Shares" style="font-weight: 700; color: #10b981; display: inline-flex; align-items: center; gap: 2px;">💬 ${(m.comments || m.shares || 0).toLocaleString()}</span>
            </div>
          </div>
          
          <div class="media-card-actions">
            <button class="header-action-btn secondary-btn btn-edit-media-trig" data-id="${m.id}">✏️ Edit</button>
            <button class="header-action-btn danger-btn btn-delete-media-trig" data-id="${m.id}">🗑️ Delete</button>
          </div>
        </div>
      `;

      const statusSelect = card.querySelector(".media-status-select");
      statusSelect.addEventListener("click", (e) => {
        e.stopPropagation();
      });
      statusSelect.addEventListener("change", (e) => {
        e.stopPropagation();
        const newStatus = e.target.value;
        m.status = newStatus;
        saveState();
        renderMediaView();
        
        if (selectedMediaDashboardId === m.id) {
          const dashStatusSelect = document.getElementById("dash-edit-status");
          if (dashStatusSelect) dashStatusSelect.value = newStatus;
        }
      });

      card.querySelector(".btn-edit-media-trig").addEventListener("click", (e) => {
        e.stopPropagation();
        openContentDashboard(m.id);
      });
      card.querySelector(".btn-delete-media-trig").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteMedia(m.id);
      });

      card.addEventListener("click", (e) => {
        if (e.target.closest("button") || e.target.closest("select")) return;
        openContentDashboard(m.id);
      });

      deck.appendChild(card);
    });
  }
}

function clearMediaFilters() {
  state.activeMediaFilterTags = [];
  state.activeMediaFilterStatus = "all";
  state.activeMediaFilterType = "all";
  
  const searchInput = document.getElementById("media-search");
  if (searchInput) searchInput.value = "";
  
  const dateFilterSelect = document.getElementById("media-date-filter");
  if (dateFilterSelect) dateFilterSelect.value = "all";
  
  const startDateInput = document.getElementById("media-start-date");
  if (startDateInput) startDateInput.value = "";
  
  const endDateInput = document.getElementById("media-end-date");
  if (endDateInput) endDateInput.value = "";
  
  const sortBySelect = document.getElementById("media-sort-by");
  if (sortBySelect) sortBySelect.value = "none";
  
  saveState();
  renderMediaView();
}

function clearProspectsFilters() {
  state.activeProspectFilterCompany = "all";
  state.forceShowAllContacts = false;
  state.forceShowAllCompanies = false;
  const searchInput = document.getElementById("prospect-search");
  if (searchInput) searchInput.value = "";
  const geoSearchInput = document.getElementById("prospect-geo-search");
  if (geoSearchInput) geoSearchInput.value = "";
  const tagSelect = document.getElementById("prospect-tag-chooser");
  if (tagSelect) tagSelect.selectedIndex = -1;
  saveState();
  renderProspectsView();
}

/* ==========================================================================
   🔎 ADVANCED QUERY (Prospect Hub)
   Query any prospect or company field (including "Added to Vantage" and
   "Last Reachout" date ranges), select specific results across paginated
   screens, and bulk-edit the selection (add a tag, add to an audience).
   ========================================================================== */

let aqTarget = "prospect";   // "prospect" | "company"
let aqResults = [];          // full filtered result set for the current query run
let aqSelectedIds = new Set();
let aqPage = 1;
let aqPerPage = 25;
let aqHasRun = false;

// --- Tags / Campaigns / Audiences searchable multi-select pickers ---
// Each picker tracks two sets of selected option labels: "include" (record
// must have ALL of these) and "exclude" (record must have NONE of these).
let aqPickerState = {
  tags: { include: new Set(), exclude: new Set() },
  campaigns: { include: new Set(), exclude: new Set() },
  audiences: { include: new Set(), exclude: new Set() },
  industry: { include: new Set(), exclude: new Set() },
  title: { include: new Set(), exclude: new Set() }
};

const AQ_PICKERS = [
  {
    key: "tags",
    searchId: "aq-p-tags-search",
    dropdownId: "aq-p-tags-dropdown",
    chipsId: "aq-p-tags-chips",
    getOptions: () => {
      const set = new Set();
      state.prospects.forEach(p => (p.tags || []).forEach(t => { if (t) set.add(t); }));
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    }
  },
  {
    key: "campaigns",
    searchId: "aq-p-campaigns-search",
    dropdownId: "aq-p-campaigns-dropdown",
    chipsId: "aq-p-campaigns-chips",
    getOptions: () => Array.from(new Set((state.campaigns || []).map(c => c.title).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
  },
  {
    key: "audiences",
    searchId: "aq-p-audiences-search",
    dropdownId: "aq-p-audiences-dropdown",
    chipsId: "aq-p-audiences-chips",
    getOptions: () => Array.from(new Set((state.audienceLists || []).map(a => a.name).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
  },
  {
    key: "industry",
    searchId: "aq-p-industry-search",
    dropdownId: "aq-p-industry-dropdown",
    chipsId: "aq-p-industry-chips",
    getOptions: () => Array.from(new Set((state.companies || []).map(c => c.industry).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
  },
  {
    key: "title",
    searchId: "aq-p-title-search",
    dropdownId: "aq-p-title-dropdown",
    chipsId: "aq-p-title-chips",
    // Titles are mostly one-off freeform strings (unlike tags/industries), so
    // typing a term that isn't an exact existing title (e.g. "VP") must still
    // be addable as a chip — matching happens via smart substring/synonym
    // comparison at query time (matchesTitleFilter), not exact equality.
    allowFreeText: true,
    getOptions: () => Array.from(new Set((state.prospects || []).map(p => p.title).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
  }
];

// --- Date / text / tag matching helpers ---

// Earliest history entry marking when a prospect was added to Vantage.
function getAddedToVantageDate(p) {
  const entries = (p.history || []).filter(h => h.type === "Added to Vantage" || h.type === "Entered into Vantage");
  let earliest = "";
  entries.forEach(h => { if (h.date && (!earliest || h.date < earliest)) earliest = h.date; });
  return earliest;
}

/* ==========================================================================
   WHAT COUNTS AS A REACHOUT  (single source of truth)

   A reachout is contact with a human: email, DM, phone call. Everything in
   this list is a history entry that is NOT contact — it belongs on the
   prospect's timeline so you can see what happened, but it must never move
   "last reachout", never feed the Advanced Query date filters, and never be
   selectable in the manual "log a reachout" dropdown.

   "Task Completed" is here by Michael's decision, 2026-08-29, which REVERSES
   scope §8 and contract C5 as originally frozen — see scope §14. §8 assumed
   completing a task was reachout. It is not: "Research Jane's company" is
   internal prep, and counting it would quietly walk her last-contact date
   forward while the filters kept returning confident, wrong answers.
   Completing a task that WAS contact logs a real Email/Call/LinkedIn entry
   instead — Session 1.9.

   Read by getLastReachoutDate(), renderDashboardView() and
   openInteractionModal(). Add a non-contact type here and all three follow.
   ========================================================================== */
const NON_REACHOUT_TYPES = ["Added to Vantage", "Entered into Vantage", "Task Completed"];
const isRealReachout = (h) => !NON_REACHOUT_TYPES.includes(h.type);

// Most recent genuine reachout/interaction date.
function getLastReachoutDate(p) {
  const entries = (p.history || []).filter(isRealReachout);
  let latest = "";
  entries.forEach(h => { if (h.date && h.date > latest) latest = h.date; });
  return latest;
}

function matchesDateFilter(dateStr, mode, filterDate) {
  if (!mode || mode === "any" || !filterDate) return true;
  if (!dateStr) return false;
  if (mode === "before") return dateStr < filterDate;
  if (mode === "after") return dateStr > filterDate;
  if (mode === "on") return dateStr === filterDate;
  return true;
}

// Supports simple boolean queries typed straight into any Advanced Query text
// field, e.g. "VP OR Director", "Manager AND Sales", "VP AND Sales OR Director".
// OR splits the query into groups; AND requires every term within a group to
// be present (substring match). No AND/OR keywords = same plain substring
// search as before, so existing single-term searches are unaffected.
function splitBooleanQuery(filterVal) {
  return (filterVal || "")
    .split(/\s+or\s+/i)
    .map(group => group.trim())
    .filter(Boolean)
    .map(group => group.split(/\s+and\s+/i).map(t => t.trim()).filter(Boolean));
}

function matchesTextFilter(fieldVal, filterVal) {
  if (!filterVal) return true;
  const val = (fieldVal || "").toString().toLowerCase();
  const orGroups = splitBooleanQuery(filterVal);
  if (orGroups.length === 0) return true;
  return orGroups.some(andTerms => andTerms.every(term => val.includes(term.toLowerCase())));
}

// US state abbreviation <-> full name lookup, used so a 2-letter search term
// is treated as a state abbreviation rather than a generic substring (which
// often fails to line up with full state names, e.g. "TX" is not a substring
// of "Texas"). Handles data stored either as abbreviations or full names.
const US_STATE_ABBREVIATIONS = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia", PR: "Puerto Rico"
};

const US_STATE_NAME_TO_ABBR = Object.fromEntries(
  Object.entries(US_STATE_ABBREVIATIONS).map(([abbr, name]) => [name.toLowerCase(), abbr])
);

// One state term against one stored value. A 2-letter term is resolved as an
// abbreviation (matches the abbreviation exactly, or the corresponding full
// name); anything else falls back to substring search plus a reverse lookup
// (typing the full name still matches data stored as an abbreviation).
function matchesSingleStateTerm(fieldVal, term) {
  const val = (fieldVal || "").toString().trim();
  const valLower = val.toLowerCase();
  const termTrimmed = term.trim();
  if (!termTrimmed) return true;
  if (!val) return false;

  if (termTrimmed.length === 2) {
    const abbr = termTrimmed.toUpperCase();
    if (val.toUpperCase() === abbr) return true;
    const fullName = US_STATE_ABBREVIATIONS[abbr];
    return !!fullName && valLower === fullName.toLowerCase();
  }

  if (valLower.includes(termTrimmed.toLowerCase())) return true;
  const matchedAbbr = US_STATE_NAME_TO_ABBR[termTrimmed.toLowerCase()];
  return !!matchedAbbr && valLower === matchedAbbr.toLowerCase();
}

// State field filter — same AND/OR boolean parsing as matchesTextFilter, but
// each term is resolved through matchesSingleStateTerm so short codes like
// "TX" or "NY" match correctly regardless of how the state is stored.
function matchesStateFilter(fieldVal, filterVal) {
  if (!filterVal) return true;
  const orGroups = splitBooleanQuery(filterVal);
  if (orGroups.length === 0) return true;
  return orGroups.some(andTerms => andTerms.every(term => matchesSingleStateTerm(fieldVal, term)));
}

function matchesTagsFilter(recordTags, filterVal) {
  if (!filterVal) return true;
  const terms = filterVal.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
  if (terms.length === 0) return true;
  const tags = (recordTags || []).map(t => t.toLowerCase());
  return terms.every(term => tags.some(t => t.includes(term)));
}

// --- Tags / Campaigns / Audiences picker rendering & interaction ---

function renderAqPickerDropdown(picker) {
  const input = document.getElementById(picker.searchId);
  const dropdown = document.getElementById(picker.dropdownId);
  if (!input || !dropdown) return;

  const query = input.value.trim().toLowerCase();
  const options = picker.getOptions();
  const selected = aqPickerState[picker.key];
  const available = options.filter(opt => !selected.include.has(opt) && !selected.exclude.has(opt));
  const matches = query ? available.filter(opt => opt.toLowerCase().includes(query)) : available;

  dropdown.innerHTML = "";

  if (matches.length === 0) {
    const emptyMsg = options.length === 0 ? "No options available yet." : "No matches.";
    dropdown.innerHTML = `<div class="aq-picker-empty">${emptyMsg}</div>`;
  } else {
    matches.slice(0, 50).forEach(opt => {
      const row = document.createElement("div");
      row.className = "aq-picker-option";
      row.innerHTML = `<span>${escapeHTML(opt)}</span>
        <span class="aq-picker-option-actions">
          <button type="button" class="aq-picker-add-btn aq-picker-include-btn" title="Include">+ Include</button>
          <button type="button" class="aq-picker-add-btn aq-picker-exclude-btn" title="Exclude">− Exclude</button>
        </span>`;
      row.querySelector(".aq-picker-include-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        setAqPickerSelection(picker, opt, "include");
      });
      row.querySelector(".aq-picker-exclude-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        setAqPickerSelection(picker, opt, "exclude");
      });
      dropdown.appendChild(row);
    });
  }

  dropdown.classList.remove("hidden");
}

function setAqPickerSelection(picker, value, mode) {
  const selected = aqPickerState[picker.key];
  selected.include.delete(value);
  selected.exclude.delete(value);
  selected[mode].add(value);
  const input = document.getElementById(picker.searchId);
  if (input) input.value = "";
  renderAqPickerChips(picker);
  renderAqPickerDropdown(picker);
}

function toggleAqPickerMode(picker, value) {
  const selected = aqPickerState[picker.key];
  if (selected.include.has(value)) {
    selected.include.delete(value);
    selected.exclude.add(value);
  } else if (selected.exclude.has(value)) {
    selected.exclude.delete(value);
    selected.include.add(value);
  }
  renderAqPickerChips(picker);
}

function removeAqPickerSelection(picker, value) {
  const selected = aqPickerState[picker.key];
  selected.include.delete(value);
  selected.exclude.delete(value);
  renderAqPickerChips(picker);
  renderAqPickerDropdown(picker);
}

function renderAqPickerChips(picker) {
  const container = document.getElementById(picker.chipsId);
  if (!container) return;
  container.innerHTML = "";

  const selected = aqPickerState[picker.key];
  const addChip = (value, mode) => {
    const chip = document.createElement("span");
    chip.className = `aq-picker-chip aq-picker-chip-${mode}`;
    chip.innerHTML = `<span class="aq-picker-chip-mode">${mode === "include" ? "+" : "−"}</span>
      <span class="aq-picker-chip-label">${escapeHTML(value)}</span>
      <button type="button" class="aq-picker-chip-toggle" title="Switch to ${mode === "include" ? "exclude" : "include"}">⇄</button>
      <button type="button" class="aq-picker-chip-remove" title="Remove">✕</button>`;
    chip.querySelector(".aq-picker-chip-toggle").addEventListener("click", () => toggleAqPickerMode(picker, value));
    chip.querySelector(".aq-picker-chip-remove").addEventListener("click", () => removeAqPickerSelection(picker, value));
    container.appendChild(chip);
  };

  Array.from(selected.include).sort((a, b) => a.localeCompare(b)).forEach(v => addChip(v, "include"));
  Array.from(selected.exclude).sort((a, b) => a.localeCompare(b)).forEach(v => addChip(v, "exclude"));
}

function resetAqPicker(picker) {
  aqPickerState[picker.key].include.clear();
  aqPickerState[picker.key].exclude.clear();
  const input = document.getElementById(picker.searchId);
  if (input) input.value = "";
  const dropdown = document.getElementById(picker.dropdownId);
  if (dropdown) {
    dropdown.innerHTML = "";
    dropdown.classList.add("hidden");
  }
  renderAqPickerChips(picker);
}

function resetAllAqPickers() {
  AQ_PICKERS.forEach(resetAqPicker);
}

// Splits a typed boolean expression like `"VP" AND "Director" NOT "Manager"`
// into individual chip terms: the first term and any AND-joined term after
// it become "include" entries; anything after a NOT becomes "exclude".
// Quotes around a term are optional and stripped either way. A plain typed
// term with no AND/NOT keywords (the common case) comes back as a single
// include entry, same as before this existed.
function parseBooleanChipInput(raw) {
  // Pad a leading AND/NOT (e.g. "NOT Manager" with nothing before it) so the
  // split regex's required leading whitespace still matches at position 0.
  const padded = /^(AND|NOT)\s+/i.test(raw) ? " " + raw : raw;
  const tokens = padded.split(/\s+(AND|NOT)\s+/i);
  const stripQuotes = (s) => s.trim().replace(/^["']|["']$/g, "").trim();

  const results = [{ term: stripQuotes(tokens[0]), mode: "include" }];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = (tokens[i] || "").toUpperCase();
    const term = tokens[i + 1];
    if (term === undefined) continue;
    results.push({ term: stripQuotes(term), mode: op === "NOT" ? "exclude" : "include" });
  }
  return results.filter(r => r.term);
}

function initAqPickers() {
  AQ_PICKERS.forEach(picker => {
    const input = document.getElementById(picker.searchId);
    if (!input) return;
    input.addEventListener("focus", () => renderAqPickerDropdown(picker));
    input.addEventListener("input", () => renderAqPickerDropdown(picker));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.getElementById(picker.dropdownId)?.classList.add("hidden");
        input.blur();
      } else if (e.key === "Enter" && picker.allowFreeText) {
        // Let a typed term (e.g. "VP") be added directly as an include chip,
        // even if it doesn't exactly match any existing option. Also accepts
        // a full boolean expression in one go, e.g.
        // "VP" AND "Director" NOT "Manager" — each AND-joined term becomes
        // its own include chip, each NOT-prefixed term becomes an exclude
        // chip (quotes optional either way).
        e.preventDefault();
        const raw = input.value.trim();
        if (!raw) return;
        parseBooleanChipInput(raw).forEach(({ term, mode }) => setAqPickerSelection(picker, term, mode));
      }
    });
    renderAqPickerChips(picker);
  });

  // Close any open dropdown when clicking outside its picker
  document.addEventListener("click", (e) => {
    AQ_PICKERS.forEach(picker => {
      const wrapper = document.getElementById(picker.searchId)?.closest(".aq-picker");
      if (wrapper && !wrapper.contains(e.target)) {
        document.getElementById(picker.dropdownId)?.classList.add("hidden");
      }
    });
  });
}

// Include/exclude matching helper shared by tags/campaigns/audiences filters.
// `itemNames` is the array of names the record actually has (e.g. p.tags);
// the record must have ALL "include" names and NONE of the "exclude" names.
function matchesIncludeExclude(itemNames, includeSet, excludeSet) {
  const names = (itemNames || []).map(n => (n || "").toLowerCase());
  if (includeSet.size > 0) {
    const hasAll = Array.from(includeSet).every(inc => names.includes(inc.toLowerCase()));
    if (!hasAll) return false;
  }
  if (excludeSet.size > 0) {
    const hasAny = Array.from(excludeSet).some(exc => names.includes(exc.toLowerCase()));
    if (hasAny) return false;
  }
  return true;
}

// A prospect "belongs to" a campaign if they're in the audience list that
// campaign targets (campaigns don't store prospect membership directly).
function getProspectCampaignTitles(prospectId) {
  return (state.campaigns || []).filter(c => {
    if (!c.audienceListId) return false;
    const al = (state.audienceLists || []).find(a => a.id === c.audienceListId);
    return al && (al.prospectIds || []).includes(prospectId);
  }).map(c => c.title).filter(Boolean);
}

function getProspectAudienceNames(prospectId) {
  return (state.audienceLists || []).filter(al => (al.prospectIds || []).includes(prospectId)).map(al => al.name);
}

function getProspectIndustry(prospectId) {
  const p = state.prospects.find(x => x.id === prospectId);
  if (!p) return "";
  const c = state.companies.find(x => x.id === p.companyId);
  return c ? (c.industry || "") : "";
}

// Include/exclude matching where each chip term is compared against a single
// text field using a fuzzy matcher (e.g. matchesTitleFilter) rather than
// exact membership in an array — used for the Title picker so a chip like
// "VP" still catches "Vice President", "Senior VP", etc.
function matchesIncludeExcludeSmart(fieldVal, includeSet, excludeSet, matchFn) {
  if (includeSet.size > 0) {
    const matchesAll = Array.from(includeSet).every(term => matchFn(fieldVal, term));
    if (!matchesAll) return false;
  }
  if (excludeSet.size > 0) {
    const matchesAny = Array.from(excludeSet).some(term => matchFn(fieldVal, term));
    if (matchesAny) return false;
  }
  return true;
}

// --- Modal open/close & target toggle ---

function openAdvancedQueryModal() {
  clearAdvancedQueryFilters();
  document.getElementById("modal-advanced-query").classList.remove("hidden");
  setAdvancedQueryTarget(aqTarget);
}

function closeAdvancedQueryModal() {
  document.getElementById("modal-advanced-query").classList.add("hidden");
  closeAqResultsModal();
  clearAdvancedQueryFilters();
}

function openAqResultsModal() {
  document.getElementById("modal-aq-results").classList.remove("hidden");
  if (!aqResultsWinState) {
    const saved = loadAqResultsWinState();
    aqResultsWinState = saved ? { top: saved.top, left: saved.left, width: saved.width, height: saved.height } : defaultAqResultsRect();
    aqResultsWinMaximized = !!(saved && saved.maximized);
  }
  if (aqResultsWinMaximized) {
    applyAqResultsMaximized();
  } else {
    applyAqResultsRect(aqResultsWinState);
  }
  updateAqResultsMaximizeIcon();
}

function closeAqResultsModal() {
  document.getElementById("modal-aq-results").classList.add("hidden");
  closeAqInspectorDrawer();
}

// --- Query Results window: drag / resize / maximize ---
// Position & size persist across sessions in localStorage (like the sidebar
// pinned state) so the window reopens where the user left it.

const AQ_RESULTS_WIN_STORAGE_KEY = "vantage_aq_results_window";
let aqResultsWinState = null;   // {top,left,width,height} in px — the non-maximized rect
let aqResultsWinMaximized = false;
let aqResultsWinDrag = null;    // active drag gesture state, or null
let aqResultsWinResize = null;  // active resize gesture state, or null

function loadAqResultsWinState() {
  try {
    const raw = localStorage.getItem(AQ_RESULTS_WIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.width === "number" && typeof parsed.height === "number") return parsed;
  } catch (e) { /* ignore corrupt/missing storage */ }
  return null;
}

function saveAqResultsWinState() {
  if (!aqResultsWinState) return;
  try {
    localStorage.setItem(AQ_RESULTS_WIN_STORAGE_KEY, JSON.stringify({ ...aqResultsWinState, maximized: aqResultsWinMaximized }));
  } catch (e) { /* ignore quota/availability errors */ }
}

function defaultAqResultsRect() {
  const width = Math.min(980, window.innerWidth - 40);
  const height = Math.min(window.innerHeight * 0.92, window.innerHeight - 40);
  return {
    width, height,
    left: Math.max(8, (window.innerWidth - width) / 2),
    top: Math.max(8, (window.innerHeight - height) / 2)
  };
}

function getAqResultsCard() {
  return document.getElementById("aq-results-card");
}

function applyAqResultsRect(rect) {
  const card = getAqResultsCard();
  if (!card || !rect) return;
  card.classList.add("aq-positioned");
  card.classList.remove("aq-maximized");
  card.style.top = `${rect.top}px`;
  card.style.left = `${rect.left}px`;
  card.style.width = `${rect.width}px`;
  card.style.height = `${rect.height}px`;
}

function applyAqResultsMaximized() {
  const card = getAqResultsCard();
  if (!card) return;
  card.classList.add("aq-positioned", "aq-maximized");
  card.style.top = "16px";
  card.style.left = "16px";
  card.style.width = `${window.innerWidth - 32}px`;
  card.style.height = `${window.innerHeight - 32}px`;
}

function getCurrentAqResultsRect() {
  const card = getAqResultsCard();
  if (!card) return null;
  const rect = card.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

function updateAqResultsMaximizeIcon() {
  const btn = document.getElementById("btn-aq-results-maximize");
  if (!btn) return;
  btn.textContent = aqResultsWinMaximized ? "🗗" : "⛶";
  btn.title = aqResultsWinMaximized ? "Restore" : "Maximize";
}

function toggleAqResultsMaximize() {
  if (!aqResultsWinMaximized) {
    aqResultsWinState = getCurrentAqResultsRect() || aqResultsWinState;
    aqResultsWinMaximized = true;
    applyAqResultsMaximized();
  } else {
    aqResultsWinMaximized = false;
    applyAqResultsRect(aqResultsWinState || defaultAqResultsRect());
  }
  updateAqResultsMaximizeIcon();
  saveAqResultsWinState();
}

const AQ_RESULTS_MIN_WIDTH = 480;
const AQ_RESULTS_MIN_HEIGHT = 320;

function initAqResultsWindowControls() {
  const card = getAqResultsCard();
  const header = document.getElementById("aq-results-header");
  if (!card || !header) return;

  header.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;
    if (aqResultsWinMaximized) return;
    const rect = card.getBoundingClientRect();
    aqResultsWinDrag = { startX: e.clientX, startY: e.clientY, startTop: rect.top, startLeft: rect.left, width: rect.width, height: rect.height };
    card.classList.add("aq-dragging");
    e.preventDefault();
  });

  header.addEventListener("dblclick", (e) => {
    if (e.target.closest("button")) return;
    toggleAqResultsMaximize();
  });

  // Every resize grabber (both side edges, the bottom edge, and both bottom
  // corners) carries a data-dirs attribute like "e", "s", "e s", or "w s"
  // telling the shared resize handler which edges it controls.
  card.querySelectorAll("[data-dirs]").forEach(handle => {
    const dirs = handle.getAttribute("data-dirs").split(" ").filter(Boolean);
    handle.addEventListener("mousedown", (e) => {
      if (aqResultsWinMaximized) return;
      const rect = card.getBoundingClientRect();
      aqResultsWinResize = {
        dirs,
        startX: e.clientX, startY: e.clientY,
        startWidth: rect.width, startHeight: rect.height,
        startTop: rect.top, startLeft: rect.left
      };
      card.classList.add("aq-resizing");
      e.preventDefault();
      e.stopPropagation();
    });
  });

  document.addEventListener("mousemove", (e) => {
    if (aqResultsWinDrag) {
      const dx = e.clientX - aqResultsWinDrag.startX;
      const dy = e.clientY - aqResultsWinDrag.startY;
      const minVisible = 60;
      let newLeft = aqResultsWinDrag.startLeft + dx;
      let newTop = aqResultsWinDrag.startTop + dy;
      newLeft = Math.max(minVisible - aqResultsWinDrag.width, Math.min(newLeft, window.innerWidth - minVisible));
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - minVisible));
      card.style.left = `${newLeft}px`;
      card.style.top = `${newTop}px`;
    } else if (aqResultsWinResize) {
      const r = aqResultsWinResize;
      const dx = e.clientX - r.startX;
      const dy = e.clientY - r.startY;
      const rightEdge = r.startLeft + r.startWidth;

      let newWidth = r.startWidth;
      let newLeft = r.startLeft;
      let newHeight = r.startHeight;

      if (r.dirs.includes("e")) {
        newWidth = Math.max(AQ_RESULTS_MIN_WIDTH, Math.min(r.startWidth + dx, window.innerWidth - r.startLeft - 8));
      }
      if (r.dirs.includes("w")) {
        let proposedLeft = Math.max(8, r.startLeft + dx);
        let proposedWidth = rightEdge - proposedLeft;
        if (proposedWidth < AQ_RESULTS_MIN_WIDTH) {
          proposedWidth = AQ_RESULTS_MIN_WIDTH;
          proposedLeft = rightEdge - AQ_RESULTS_MIN_WIDTH;
        }
        newWidth = proposedWidth;
        newLeft = proposedLeft;
      }
      if (r.dirs.includes("s")) {
        newHeight = Math.max(AQ_RESULTS_MIN_HEIGHT, Math.min(r.startHeight + dy, window.innerHeight - r.startTop - 8));
      }

      card.style.width = `${newWidth}px`;
      card.style.left = `${newLeft}px`;
      card.style.height = `${newHeight}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    if (aqResultsWinDrag) {
      card.classList.remove("aq-dragging");
      aqResultsWinDrag = null;
      aqResultsWinState = getCurrentAqResultsRect();
      saveAqResultsWinState();
    }
    if (aqResultsWinResize) {
      card.classList.remove("aq-resizing");
      aqResultsWinResize = null;
      aqResultsWinState = getCurrentAqResultsRect();
      saveAqResultsWinState();
    }
  });

  window.addEventListener("resize", () => {
    if (document.getElementById("modal-aq-results")?.classList.contains("hidden")) return;
    if (aqResultsWinMaximized) applyAqResultsMaximized();
  });
}

function setAdvancedQueryTarget(target) {
  aqTarget = target;
  document.getElementById("aq-target-prospects").classList.toggle("active-filter", target === "prospect");
  document.getElementById("aq-target-companies").classList.toggle("active-filter", target === "company");
  document.getElementById("aq-fields-prospect").classList.toggle("hidden", target !== "prospect");
  document.getElementById("aq-fields-company").classList.toggle("hidden", target !== "company");
  document.getElementById("aq-bulk-audience-row").classList.toggle("hidden", target !== "prospect");

  // Switching target invalidates the current result set/selection
  aqResults = [];
  aqSelectedIds = new Set();
  aqPage = 1;
  aqHasRun = false;
  renderAdvancedQueryResults();
}

function clearAdvancedQueryFilters() {
  [
    "aq-p-firstname", "aq-p-lastname", "aq-p-email", "aq-p-phone", "aq-p-company", "aq-p-linkedin",
    "aq-p-city", "aq-p-state", "aq-p-location", "aq-p-company-tags",
    "aq-c-name", "aq-c-domain", "aq-c-industry", "aq-c-employees", "aq-c-city", "aq-c-state", "aq-c-hq",
    "aq-c-phone", "aq-c-linkedin", "aq-c-notes", "aq-c-tags"
  ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });

  document.getElementById("aq-p-seniority").value = "any";
  document.getElementById("aq-p-added-mode").value = "any";
  document.getElementById("aq-p-added-date").value = "";
  document.getElementById("aq-p-reachout-mode").value = "any";
  document.getElementById("aq-p-reachout-date").value = "";

  resetAllAqPickers();

  aqResults = [];
  aqSelectedIds = new Set();
  aqPage = 1;
  aqHasRun = false;
  renderAdvancedQueryResults();
}

// --- Running the query ---

function runAdvancedQuery() {
  aqSelectedIds = new Set();
  aqPage = 1;
  aqHasRun = true;
  closeAqInspectorDrawer();

  if (aqTarget === "prospect") {
    const firstName = document.getElementById("aq-p-firstname").value.trim();
    const lastName = document.getElementById("aq-p-lastname").value.trim();
    const email = document.getElementById("aq-p-email").value.trim();
    const phone = document.getElementById("aq-p-phone").value.trim();
    const seniority = document.getElementById("aq-p-seniority").value;
    const companyName = document.getElementById("aq-p-company").value.trim();
    const linkedin = document.getElementById("aq-p-linkedin").value.trim();
    const city = document.getElementById("aq-p-city").value.trim();
    const stateVal = document.getElementById("aq-p-state").value.trim();
    const location = document.getElementById("aq-p-location").value.trim();
    const companyTags = document.getElementById("aq-p-company-tags").value.trim();
    const addedMode = document.getElementById("aq-p-added-mode").value;
    const addedDate = document.getElementById("aq-p-added-date").value;
    const reachoutMode = document.getElementById("aq-p-reachout-mode").value;
    const reachoutDate = document.getElementById("aq-p-reachout-date").value;

    aqResults = state.prospects.filter(p => {
      if (!matchesTextFilter(p.firstName, firstName)) return false;
      if (!matchesTextFilter(p.lastName, lastName)) return false;
      if (!matchesTextFilter(p.email, email)) return false;
      if (!matchesTextFilter(p.phone, phone)) return false;
      if (!matchesIncludeExcludeSmart(p.title, aqPickerState.title.include, aqPickerState.title.exclude, matchesTitleFilter)) return false;
      if (seniority !== "any" && (p.seniority || "") !== seniority) return false;
      if (!matchesTextFilter(getCompanyName(p.companyId), companyName)) return false;
      if (!matchesTextFilter(p.linkedin, linkedin)) return false;
      if (!matchesTextFilter(p.city, city)) return false;
      if (!matchesStateFilter(p.state, stateVal)) return false;
      if (!matchesTextFilter(p.location, location)) return false;
      if (!matchesIncludeExclude(p.tags, aqPickerState.tags.include, aqPickerState.tags.exclude)) return false;
      const comp = state.companies.find(c => c.id === p.companyId);
      if (!matchesTagsFilter(comp ? comp.tags : [], companyTags)) return false;
      if (!matchesIncludeExclude(getProspectCampaignTitles(p.id), aqPickerState.campaigns.include, aqPickerState.campaigns.exclude)) return false;
      if (!matchesIncludeExclude(getProspectAudienceNames(p.id), aqPickerState.audiences.include, aqPickerState.audiences.exclude)) return false;
      if (!matchesIncludeExclude([getProspectIndustry(p.id)], aqPickerState.industry.include, aqPickerState.industry.exclude)) return false;
      if (!matchesDateFilter(getAddedToVantageDate(p), addedMode, addedDate)) return false;
      if (!matchesDateFilter(getLastReachoutDate(p), reachoutMode, reachoutDate)) return false;
      return true;
    });
  } else {
    const name = document.getElementById("aq-c-name").value.trim();
    const domain = document.getElementById("aq-c-domain").value.trim();
    const industry = document.getElementById("aq-c-industry").value.trim();
    const employees = document.getElementById("aq-c-employees").value.trim();
    const city = document.getElementById("aq-c-city").value.trim();
    const stateVal = document.getElementById("aq-c-state").value.trim();
    const hq = document.getElementById("aq-c-hq").value.trim();
    const phone = document.getElementById("aq-c-phone").value.trim();
    const linkedin = document.getElementById("aq-c-linkedin").value.trim();
    const notes = document.getElementById("aq-c-notes").value.trim();
    const tags = document.getElementById("aq-c-tags").value.trim();

    aqResults = state.companies.filter(c => {
      if (!matchesTextFilter(c.name, name)) return false;
      if (!matchesTextFilter(c.domain, domain) && !matchesTextFilter(c.website, domain)) return false;
      if (!matchesTextFilter(c.industry, industry)) return false;
      if (!matchesTextFilter(c.employees, employees) && !matchesTextFilter(c.employeeRange, employees)) return false;
      if (!matchesTextFilter(c.city, city)) return false;
      if (!matchesStateFilter(c.state, stateVal)) return false;
      if (!matchesTextFilter(c.headquarters, hq) && !matchesTextFilter(c.location, hq)) return false;
      if (!matchesTextFilter(c.phone, phone)) return false;
      if (!matchesTextFilter(c.linkedin, linkedin)) return false;
      if (!matchesTextFilter(c.notes, notes)) return false;
      if (!matchesTagsFilter(c.tags, tags)) return false;
      return true;
    });
  }

  renderAdvancedQueryResults();
  openAqResultsModal();
}

// --- Results rendering, pagination & selection ---

function renderResultsSummaryText() {
  const summary = document.getElementById("aq-results-summary");
  const total = aqResults.length;
  if (total === 0) {
    summary.textContent = aqHasRun ? "No results match those filters." : "Run a query to see results.";
    return;
  }
  const startIdx = (aqPage - 1) * aqPerPage;
  const shown = Math.min(aqPerPage, total - startIdx);
  summary.textContent = `Showing ${startIdx + 1}–${startIdx + shown} of ${total} result${total === 1 ? "" : "s"} · ${aqSelectedIds.size} selected`;
}

function renderAdvancedQueryResults() {
  const thead = document.getElementById("aq-results-thead");
  const tbody = document.getElementById("aq-results-body");
  const pageIndicator = document.getElementById("aq-page-indicator");

  const total = aqResults.length;
  const perPage = parseInt(document.getElementById("aq-per-page").value, 10) || 25;
  aqPerPage = perPage;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (aqPage > totalPages) aqPage = totalPages;
  if (aqPage < 1) aqPage = 1;

  const startIdx = (aqPage - 1) * perPage;
  const pageItems = aqResults.slice(startIdx, startIdx + perPage);

  pageIndicator.textContent = `Page ${aqPage} of ${totalPages}`;
  tbody.innerHTML = "";

  if (aqTarget === "prospect") {
    thead.innerHTML = `<tr><th style="width:36px;"></th><th>Name</th><th>Title</th><th>Company</th><th>City/State</th><th>Tags</th></tr>`;
    pageItems.forEach(p => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.dataset.recordId = p.id;
      tr.classList.toggle("active-row", aqInspectorRecordId === p.id && aqInspectorType === "prospect");
      const tagBadges = (p.tags || []).map(t => `<span class="tag-badge">${escapeHTML(t)}</span>`).join("");
      tr.innerHTML = `
        <td style="text-align:center;"><input type="checkbox" class="aq-row-checkbox" ${aqSelectedIds.has(p.id) ? "checked" : ""}></td>
        <td><strong>${escapeHTML(p.firstName)} ${escapeHTML(p.lastName)}</strong></td>
        <td>${escapeHTML(p.title || "—")}</td>
        <td>${escapeHTML(getCompanyName(p.companyId) || "—")}</td>
        <td>${escapeHTML([p.city, p.state].filter(Boolean).join(", ") || "—")}</td>
        <td>${tagBadges}</td>
      `;
      tr.querySelector(".aq-row-checkbox").addEventListener("change", (e) => {
        toggleAdvancedQuerySelection(p.id, e.target.checked);
      });
      tr.addEventListener("click", (e) => {
        if (e.target.closest("input")) return;
        if (aqInspectorRecordId === p.id && aqInspectorType === "prospect") {
          closeAqInspectorDrawer();
        } else {
          openAqInspectorDrawer(p.id, "prospect");
        }
      });
      tbody.appendChild(tr);
    });
  } else {
    thead.innerHTML = `<tr><th style="width:36px;"></th><th>Company Name</th><th>Industry</th><th>Location</th><th>Tags</th></tr>`;
    pageItems.forEach(c => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.dataset.recordId = c.id;
      tr.classList.toggle("active-row", aqInspectorRecordId === c.id && aqInspectorType === "company");
      const tagBadges = (c.tags || []).map(t => `<span class="tag-badge">${escapeHTML(t)}</span>`).join("");
      tr.innerHTML = `
        <td style="text-align:center;"><input type="checkbox" class="aq-row-checkbox" ${aqSelectedIds.has(c.id) ? "checked" : ""}></td>
        <td><strong>${escapeHTML(c.name)}</strong></td>
        <td>${escapeHTML(c.industry || "—")}</td>
        <td>${escapeHTML(c.location || "—")}</td>
        <td>${tagBadges}</td>
      `;
      tr.querySelector(".aq-row-checkbox").addEventListener("change", (e) => {
        toggleAdvancedQuerySelection(c.id, e.target.checked);
      });
      tr.addEventListener("click", (e) => {
        if (e.target.closest("input")) return;
        if (aqInspectorRecordId === c.id && aqInspectorType === "company") {
          closeAqInspectorDrawer();
        } else {
          openAqInspectorDrawer(c.id, "company");
        }
      });
      tbody.appendChild(tr);
    });
  }

  renderResultsSummaryText();
  renderAdvancedQueryBulkBar();
}

// --- Record Inspector drawer ---
// Opens from a click on a results row. Saving here (notes/tags/full edit)
// mutates the actual state.prospects/state.companies record — the same
// object aqResults is already holding a reference to — so the open results
// list reflects the edit immediately without re-filtering. Only an explicit
// Run Query re-derives aqResults from scratch and drops non-matching rows.

let aqInspectorRecordId = null;
let aqInspectorType = null; // "prospect" | "company"

// Toggles the .active-row class directly on the affected <tr> elements
// instead of rebuilding the whole results table on every row click. Clicking
// through records used to tear down and recreate every visible row (with all
// its listeners) just to move a highlight — that's the main reason the
// results table felt sluggish, especially with 50/page. A single row click
// now only ever touches at most two <tr> elements.
function updateAqActiveRowHighlight(id) {
  const tbody = document.getElementById("aq-results-body");
  if (!tbody) return;
  tbody.querySelectorAll("tr.active-row").forEach(tr => tr.classList.remove("active-row"));
  if (id) {
    const row = tbody.querySelector(`tr[data-record-id="${CSS.escape(String(id))}"]`);
    if (row) row.classList.add("active-row");
  }
}

function openAqInspectorDrawer(id, type) {
  aqInspectorRecordId = id;
  aqInspectorType = type;
  if (type === "prospect") {
    state.selectedProspectId = id;
  } else {
    selectedCompanyId = id;
  }
  renderAqInspectorDrawer();
  document.getElementById("aq-inspector-drawer")?.classList.add("open");
  updateAqActiveRowHighlight(id);
}

function closeAqInspectorDrawer() {
  aqInspectorRecordId = null;
  aqInspectorType = null;
  document.getElementById("aq-inspector-drawer")?.classList.remove("open");
  updateAqActiveRowHighlight(null);
}

// Renders the AQ drawer using the same structure/classes as the Prospect
// Hub's inspector card (see renderInspector) — history table, memberships /
// associated contacts, quick actions and all — just targeting a second set
// of "aq-insp-p-*" / "aq-insp-c-*" element ids so the two inspectors can
// coexist without id collisions.
function renderAqInspectorDrawer() {
  const drawer = document.getElementById("aq-inspector-drawer");
  if (!drawer || !aqInspectorRecordId) return;

  const prospectCard = document.getElementById("aq-insp-prospect");
  const companyCard = document.getElementById("aq-insp-company");

  if (aqInspectorType === "prospect") {
    const p = state.prospects.find(x => x.id === aqInspectorRecordId);
    if (!p) { closeAqInspectorDrawer(); return; }

    companyCard.classList.add("hidden");
    prospectCard.classList.remove("hidden");

    document.getElementById("aq-insp-p-name").textContent = `${p.firstName} ${p.lastName}`;
    const compName = getCompanyName(p.companyId);
    document.getElementById("aq-insp-p-subtitle").innerHTML = `${escapeHTML(p.title || "—")} at <a href="#" id="aq-insp-link-to-company" style="color:var(--color-primary);text-decoration:none;">${escapeHTML(compName)}</a>`;
    document.getElementById("aq-insp-link-to-company")?.addEventListener("click", (e) => {
      e.preventDefault();
      if (p.companyId) openAqInspectorDrawer(p.companyId, "company");
    });

    document.getElementById("aq-insp-p-meta").innerHTML = `
      <span>📧 ${p.email ? `<a href="mailto:${escapeHTML(p.email)}" style="color:inherit;text-decoration:none;">${escapeHTML(p.email)}</a>` : "No email"}</span>
      <span>📞 ${p.phone ? `<a href="tel:${escapeHTML(p.phone)}" style="color:inherit;text-decoration:none;">${escapeHTML(p.phone)}</a>` : "No phone"}</span>
      <span>📍 ${escapeHTML([p.city, p.state].filter(Boolean).join(", ") || "—")}</span>
      ${p.linkedin ? `<span>🔗 <a href="${escapeHTML(ensureUrlProtocol(p.linkedin))}" target="_blank" style="color:#0a66c2;">LinkedIn</a></span>` : ""}
    `;
    document.getElementById("aq-insp-p-tags-list").innerHTML = (p.tags || []).map(t => `<span class="tag-badge">${escapeHTML(t)}</span>`).join("")
      || `<span style="color:var(--color-text-muted); font-size:12px;">No tags</span>`;
    document.getElementById("aq-insp-p-notes").value = p.notes || "";
    document.getElementById("btn-aq-insp-p-save-notes")?.classList.add("hidden");

    // Interaction history
    const histBody = document.getElementById("aq-insp-p-history-body");
    histBody.innerHTML = "";
    if (!p.history || p.history.length === 0) {
      histBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--color-text-muted);padding:16px;">No reachout records stored.</td></tr>`;
    } else {
      const historySorted = [...p.history].sort((a, b) => new Date(b.date) - new Date(a.date));
      historySorted.forEach(h => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="font-weight:600;white-space:nowrap;">${h.date}</td>
          <td><span class="feed-type-tag">${h.type}</span></td>
          <td style="line-height:1.4;">${escapeHTML(h.content)}</td>
          <td style="text-align:center;">
            <button class="delete-interaction-btn" data-id="${h.id}" title="Remove reachout log">✕</button>
          </td>
        `;
        tr.querySelector(".delete-interaction-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          deleteInteraction(p.id, h.id);
        });
        histBody.appendChild(tr);
      });
    }

    // Memberships
    const memEl = document.getElementById("aq-insp-p-memberships");
    memEl.innerHTML = "";
    const matchedLists = state.audienceLists.filter(al => al.prospectIds && al.prospectIds.includes(p.id));
    const matchedCampaigns = state.campaigns.filter(c => matchedLists.some(al => al.id === c.audienceListId));
    if (matchedLists.length === 0 && matchedCampaigns.length === 0) {
      memEl.innerHTML = `<div style="color:var(--color-text-muted);font-style:italic;">Not included in any audience lists or outreach campaigns.</div>`;
    } else {
      if (matchedLists.length > 0) {
        memEl.innerHTML += `<div style="font-weight:600;color:var(--color-secondary);margin-bottom:4px;">Audience Lists:</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
            ${matchedLists.map(al => `<span class="tag-badge" style="background:rgba(6,182,212,0.15);color:var(--color-secondary);border:1px solid rgba(6,182,212,0.3);">${escapeHTML(al.name)}</span>`).join("")}
          </div>`;
      }
      if (matchedCampaigns.length > 0) {
        memEl.innerHTML += `<div style="font-weight:600;color:var(--color-primary);margin-bottom:4px;">Outreach Campaigns:</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${matchedCampaigns.map(c => `<span class="tag-badge" style="background:rgba(79,70,229,0.15);color:var(--color-primary);border:1px solid rgba(79,70,229,0.3);">${escapeHTML(c.title)} (${escapeHTML(c.status)})</span>`).join("")}
          </div>`;
      }
    }
  } else {
    const c = state.companies.find(x => x.id === aqInspectorRecordId);
    if (!c) { closeAqInspectorDrawer(); return; }

    prospectCard.classList.add("hidden");
    companyCard.classList.remove("hidden");

    document.getElementById("aq-insp-c-name").textContent = c.name;
    document.getElementById("aq-insp-c-industry").textContent = c.industry || "General";
    document.getElementById("aq-insp-c-meta").innerHTML = `
      <span>📍 ${escapeHTML([c.city, c.state].filter(Boolean).join(", ") || c.location || "—")}</span>
      <span>📞 ${c.phone ? escapeHTML(c.phone) : "No phone"}</span>
      ${c.website ? `<span>🌐 <a href="${escapeHTML(ensureUrlProtocol(c.website))}" target="_blank" style="color:var(--color-primary);">${escapeHTML(c.website)}</a></span>` : ""}
      ${c.linkedin ? `<span>🔗 <a href="${escapeHTML(ensureUrlProtocol(c.linkedin))}" target="_blank" style="color:#0a66c2;">LinkedIn</a></span>` : ""}
    `;
    document.getElementById("aq-insp-c-tags-list").innerHTML = (c.tags || []).map(t => `<span class="tag-badge">${escapeHTML(t)}</span>`).join("")
      || `<span style="color:var(--color-text-muted); font-size:12px;">No tags</span>`;
    document.getElementById("aq-insp-c-notes").value = c.notes || "";
    document.getElementById("btn-aq-insp-c-save-notes")?.classList.add("hidden");

    // Associated contacts
    const contactsBody = document.getElementById("aq-insp-c-contacts-body");
    contactsBody.innerHTML = "";
    const assoc = state.prospects.filter(p => p.companyId === c.id);
    if (assoc.length === 0) {
      contactsBody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--color-text-muted);padding:16px;">No associated contacts.</td></tr>`;
    } else {
      assoc.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${escapeHTML(p.firstName)} ${escapeHTML(p.lastName)}</strong></td>
          <td>${escapeHTML(p.title || "—")}</td>
          <td style="text-align:center;"><button class="text-btn aq-insp-view-contact-btn" data-id="${p.id}">View</button></td>
        `;
        tr.querySelector(".aq-insp-view-contact-btn").addEventListener("click", (e) => {
          e.stopPropagation();
          openAqInspectorDrawer(p.id, "prospect");
        });
        contactsBody.appendChild(tr);
      });
    }
  }
}

function saveAqInspectorNotes() {
  if (!aqInspectorRecordId) return;
  if (aqInspectorType === "prospect") {
    const val = document.getElementById("aq-insp-p-notes").value.trim();
    const p = state.prospects.find(x => x.id === aqInspectorRecordId);
    if (p) p.notes = val;
    document.getElementById("btn-aq-insp-p-save-notes")?.classList.add("hidden");
  } else {
    const val = document.getElementById("aq-insp-c-notes").value.trim();
    const c = state.companies.find(x => x.id === aqInspectorRecordId);
    if (c) c.notes = val;
    document.getElementById("btn-aq-insp-c-save-notes")?.classList.add("hidden");
  }
  saveState();
}

function editAqInspectorTags() {
  if (!aqInspectorRecordId) return;
  if (aqInspectorType === "prospect") {
    openChooseTagsModalForProspectInspector();
  } else {
    openChooseTagsModalForCompanyInspector();
  }
}

function editAqInspectorFull() {
  if (!aqInspectorRecordId) return;
  if (aqInspectorType === "prospect") {
    openProspectModal(aqInspectorRecordId);
  } else {
    openCompanyModal(aqInspectorRecordId);
  }
}

// Deletes the record currently shown in the AQ drawer. Unlike the main
// Prospect Hub delete buttons (deleteProspect/deleteCompany), this also has
// to clean the record out of the live aqResults/aqSelectedIds so the results
// table stops showing a row for something that no longer exists — a plain
// refreshAqAfterEdit() wouldn't catch that since aqResults isn't re-filtered
// from state until the next Run Query.
function deleteAqInspectorRecord() {
  if (!aqInspectorRecordId) return;
  const id = aqInspectorRecordId;

  if (aqInspectorType === "prospect") {
    const p = state.prospects.find(x => x.id === id);
    if (!p) return;
    const ok = confirm(`Are you sure you want to permanently delete contact ${p.firstName} ${p.lastName}?`);
    if (!ok) return;
    state.prospects = state.prospects.filter(x => x.id !== id);
    if (state.selectedProspectId === id) state.selectedProspectId = null;
  } else {
    const c = state.companies.find(x => x.id === id);
    if (!c) return;
    const ok = confirm(`Are you sure you want to permanently delete company ${c.name}? Associated contacts will be unassigned.`);
    if (!ok) return;
    state.companies = state.companies.filter(x => x.id !== id);
    state.prospects.forEach(p => { if (p.companyId === id) p.companyId = ""; });
    if (selectedCompanyId === id) selectedCompanyId = null;
  }

  aqResults = aqResults.filter(x => x.id !== id);
  aqSelectedIds.delete(id);
  closeAqInspectorDrawer();
  saveState();
  renderProspectsView();
  refreshAqAfterEdit();
}

// Called after any edit that might touch a record currently shown in the
// Advanced Query results (full edit modal, tag chooser, notes). No-op when
// the results window isn't open. Re-renders from the existing aqResults
// array (not a fresh filter), so edits show immediately while a genuinely
// re-run query still applies the filters fresh.
function refreshAqAfterEdit() {
  const resultsModal = document.getElementById("modal-aq-results");
  if (!resultsModal || resultsModal.classList.contains("hidden")) return;
  renderAdvancedQueryResults();
  renderAqInspectorDrawer();
}

function toggleAdvancedQuerySelection(id, isChecked) {
  if (isChecked) aqSelectedIds.add(id);
  else aqSelectedIds.delete(id);
  renderResultsSummaryText();
  renderAdvancedQueryBulkBar();
}

function selectAdvancedQueryScreen() {
  const startIdx = (aqPage - 1) * aqPerPage;
  aqResults.slice(startIdx, startIdx + aqPerPage).forEach(item => aqSelectedIds.add(item.id));
  renderAdvancedQueryResults();
}

function selectAdvancedQueryAll() {
  aqResults.forEach(item => aqSelectedIds.add(item.id));
  renderAdvancedQueryResults();
}

function clearAdvancedQuerySelection() {
  aqSelectedIds = new Set();
  renderAdvancedQueryResults();
}

function advancedQueryPrevPage() {
  if (aqPage > 1) {
    aqPage--;
    renderAdvancedQueryResults();
  }
}

function advancedQueryNextPage() {
  const totalPages = Math.max(1, Math.ceil(aqResults.length / aqPerPage));
  if (aqPage < totalPages) {
    aqPage++;
    renderAdvancedQueryResults();
  }
}

function changeAdvancedQueryPerPage() {
  aqPage = 1;
  renderAdvancedQueryResults();
}

// --- CSV export from query results ---

function exportAqRecordsCSV(list, suffix) {
  if (aqTarget === "prospect") {
    const csv = convertToCSV(list,
      ["ID", "First Name", "Last Name", "Email", "Phone", "Title", "LinkedIn", "Company ID", "Company", "Location", "City", "State", "Seniority", "Notes", "Tags", "History"],
      p => [
        p.id, p.firstName, p.lastName, p.email, p.phone || "", p.title || "", p.linkedin || "", p.companyId,
        getCompanyName(p.companyId) || "", p.location || "", p.city || "", p.state || "", p.seniority || "",
        p.notes || "", (p.tags || []).join(";"), p.history ? JSON.stringify(p.history) : ""
      ]
    );
    downloadCSVFile(`vantage_advanced_query_prospects_${suffix}_${getBackupTimestamp()}.csv`, csv);
  } else {
    const csv = convertToCSV(list,
      ["ID", "Name", "Domain", "Website", "Employees", "Employee Range", "Location", "Industry", "Description", "Specialities", "Headquarters", "Address", "City", "State", "Postal", "Phone", "LinkedIn", "Notes", "Tags"],
      co => [
        co.id, co.name, co.domain, co.website || "", co.employees || "", co.employeeRange || "",
        co.location || "", co.industry || "General", co.description || "", co.specialities || "",
        co.headquarters || "", co.address || "", co.city || "", co.state || "", co.postal || "",
        co.phone || "", co.linkedin || "", co.notes || "", (co.tags || []).join(";")
      ]
    );
    downloadCSVFile(`vantage_advanced_query_companies_${suffix}_${getBackupTimestamp()}.csv`, csv);
  }
}

function exportAqSelectedCSV() {
  if (aqSelectedIds.size === 0) { alert("Please select at least one record to export."); return; }
  const source = aqTarget === "prospect" ? state.prospects : state.companies;
  const list = source.filter(item => aqSelectedIds.has(item.id));
  exportAqRecordsCSV(list, "selected");
}

function exportAqAllCSV() {
  if (aqResults.length === 0) { alert("No results to export. Run a query first."); return; }
  exportAqRecordsCSV(aqResults, "all");
}

// --- Bulk actions bar ---

function renderAdvancedQueryBulkBar() {
  const bar = document.getElementById("aq-bulk-actions");
  const count = aqSelectedIds.size;
  document.getElementById("aq-selected-count").textContent = count;
  bar.classList.toggle("hidden", count === 0);
  if (count === 0) return;

  const tagSelect = document.getElementById("aq-bulk-tag-select");
  const availableTags = aqTarget === "prospect" ? state.prospect_tags : state.company_tags;
  const tagCurrentVal = tagSelect.value;
  tagSelect.innerHTML = `<option value="">-- Choose Tag --</option>`;
  (availableTags || []).forEach(t => {
    tagSelect.innerHTML += `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`;
  });
  tagSelect.value = tagCurrentVal || "";

  const audSelect = document.getElementById("aq-bulk-audience-select");
  const audCurrentVal = audSelect.value;
  audSelect.innerHTML = `<option value="">-- Choose Audience --</option>`;
  state.audienceLists.forEach(al => {
    audSelect.innerHTML += `<option value="${al.id}">${escapeHTML(al.name)}</option>`;
  });
  audSelect.value = audCurrentVal || "";
}

// Adds (never replaces) a tag across every selected prospect/company record.
function bulkAddTagToSelected() {
  if (aqSelectedIds.size === 0) { alert("Please select at least one record."); return; }

  const selectEl = document.getElementById("aq-bulk-tag-select");
  const newTagInput = document.getElementById("aq-bulk-tag-new");
  const tag = newTagInput.value.trim() || selectEl.value.trim();
  if (!tag) { alert("Please choose an existing tag or enter a new one."); return; }

  const targetArray = aqTarget === "prospect" ? state.prospects : state.companies;
  const tagListField = aqTarget === "prospect" ? "prospect_tags" : "company_tags";

  let updatedCount = 0;
  aqSelectedIds.forEach(id => {
    const record = targetArray.find(x => x.id === id);
    if (!record) return;
    if (!record.tags) record.tags = [];
    if (!record.tags.includes(tag)) {
      record.tags.push(tag);
      updatedCount++;
    }
  });

  // Register brand-new tags in the managed tag list so they show up in Settings/filters
  if (!state[tagListField].includes(tag)) {
    state[tagListField].push(tag);
  }

  saveState();
  newTagInput.value = "";
  renderAdvancedQueryResults();
  renderProspectsView();
  alert(`Added tag "${tag}" to ${updatedCount} record${updatedCount === 1 ? "" : "s"}.`);
}

function bulkAddSelectedToAudience() {
  if (aqTarget !== "prospect") return;
  if (aqSelectedIds.size === 0) { alert("Please select at least one contact."); return; }

  const audId = document.getElementById("aq-bulk-audience-select").value;
  if (!audId) { alert("Please choose an audience list."); return; }

  const aud = state.audienceLists.find(a => a.id === audId);
  if (!aud) return;

  if (!aud.prospectIds) aud.prospectIds = [];
  let addedCount = 0;
  aqSelectedIds.forEach(id => {
    if (!aud.prospectIds.includes(id)) {
      aud.prospectIds.push(id);
      addedCount++;
    }
  });
  addAudienceTagToProspects(Array.from(aqSelectedIds), aud.name);

  saveState();
  renderAdvancedQueryResults();
  renderProspectsView();
  alert(`Added ${addedCount} contact${addedCount === 1 ? "" : "s"} to audience "${aud.name}".`);
}

function bulkCreateAudienceFromSelected() {
  if (aqTarget !== "prospect") return;
  if (aqSelectedIds.size === 0) { alert("Please select at least one contact."); return; }

  const nameInput = document.getElementById("aq-bulk-new-audience-name");
  const name = nameInput.value.trim();
  if (!name) { alert("Please enter a name for the new audience."); return; }

  const duplicate = state.audienceLists.some(a => a.name.toLowerCase() === name.toLowerCase());
  if (duplicate) { alert("An audience list with this name already exists."); return; }

  const prospectIds = Array.from(aqSelectedIds);
  const audId = `aud-${Date.now()}`;
  state.audienceLists.push({ id: audId, name, prospectIds, status: "active" });
  addAudienceTagToProspects(prospectIds, name);

  saveState();
  nameInput.value = "";
  renderAdvancedQueryResults();
  renderProspectsView();
  alert(`Created audience "${name}" with ${prospectIds.length} contact${prospectIds.length === 1 ? "" : "s"}.`);
}

function clearCampaignsFilters() {
  activeCampaignFilterTags = [];
  activeCampaignFilterPhase = "all";
  renderCampaignsView();
}

/* ==========================================================================
   🎯 RENDER VIEW: CAMPAIGN MANAGER
   ========================================================================== */

let campaignViewSubState = "dashboard"; // "dashboard" or "query" or "audiences" or "emailAccounts"
let activeCampaignFilterPhase = "all";
let activeCampaignFilterTags = [];
let selectedAudienceListId = null;
let audienceListStatusFilter = "active"; // "active" or "archived"

// Email Accounts (Campaign Hub sub-tab)
let activeEmailAccountFilterStatus = "all";
let activeEmailAccountFilterProvider = "all";
let editingEmailAccountId = null;
let visibleEmailAccountPasswordIds = new Set(); // ids currently toggled to plaintext

// Domain Management (Campaign Hub sub-tab)
let activeDomainFilterStatus = "all";
let activeDomainFilterRegistrar = "all";
let editingDomainId = null;
let visibleDomainPasswordIds = new Set(); // ids currently toggled to plaintext
let currentDomainLinkedEmailAccountIds = []; // working selection while the modal is open

let viewingCampaignDetailId = null;
let editingCampaignId = null;
let pendingAudienceImport = null; // { matchedIds: [], unresolvedRows: [] } while the import modal is open

/* --------------------------------------------------------------------------
   Audience <-> Prospect Tag Sync
   Invariant: a prospect's tags array includes an audience's name if and only
   if that prospect's id is in that audience's prospectIds. Keeping this in
   sync means audience membership shows up as a normal tag everywhere in the
   Prospect Hub (filtering, inspector, exports), and deleting/renaming an
   audience cleanly updates every contact that was in it.
   -------------------------------------------------------------------------- */

function addAudienceTagToProspects(prospectIds, audienceName) {
  (prospectIds || []).forEach(pid => {
    const p = state.prospects.find(x => x.id === pid);
    if (!p) return;
    if (!p.tags) p.tags = [];
    if (!p.tags.includes(audienceName)) p.tags.push(audienceName);
  });
}

function removeAudienceTagFromProspects(prospectIds, audienceName) {
  (prospectIds || []).forEach(pid => {
    const p = state.prospects.find(x => x.id === pid);
    if (!p || !p.tags) return;
    p.tags = p.tags.filter(t => t !== audienceName);
  });
}

function renameAudienceTagOnProspects(prospectIds, oldName, newName) {
  (prospectIds || []).forEach(pid => {
    const p = state.prospects.find(x => x.id === pid);
    if (!p || !p.tags) return;
    p.tags = p.tags.map(t => (t === oldName ? newName : t));
  });
}

function switchCampaignSubTab(tab) {
  const cBtn = document.getElementById("subtab-campaigns");
  const aBtn = document.getElementById("subtab-audiences");
  const eBtn = document.getElementById("subtab-emailaccounts");
  const dBtn = document.getElementById("subtab-domains");
  const dash = document.getElementById("campaign-dashboard-view");
  const auds = document.getElementById("audience-lists-view");
  const emailView = document.getElementById("email-accounts-view");
  const domainView = document.getElementById("domain-management-view");
  const queryView = document.getElementById("campaign-query-view");

  // Top action bar buttons that only make sense on some sub-tabs
  const createCampaignBtn = document.getElementById("btn-open-create-campaign");
  const queryEngineBtn = document.getElementById("btn-launch-standalone-query");
  const addEmailAccountBtn = document.getElementById("btn-add-email-account");
  const addDomainBtn = document.getElementById("btn-add-domain");

  cBtn?.classList.remove("active-filter");
  aBtn?.classList.remove("active-filter");
  eBtn?.classList.remove("active-filter");
  dBtn?.classList.remove("active-filter");
  dash?.classList.add("hidden");
  auds?.classList.add("hidden");
  emailView?.classList.add("hidden");
  domainView?.classList.add("hidden");
  queryView?.classList.add("hidden");
  createCampaignBtn?.classList.add("hidden");
  queryEngineBtn?.classList.add("hidden");
  addEmailAccountBtn?.classList.add("hidden");
  addDomainBtn?.classList.add("hidden");

  if (tab === "campaigns") {
    cBtn?.classList.add("active-filter");
    dash?.classList.remove("hidden");
    createCampaignBtn?.classList.remove("hidden");
    queryEngineBtn?.classList.remove("hidden");
    campaignViewSubState = "dashboard";
    renderCampaignDashboard();
  } else if (tab === "audiences") {
    aBtn?.classList.add("active-filter");
    auds?.classList.remove("hidden");
    campaignViewSubState = "audiences";
    renderAudienceListsView();
  } else if (tab === "emailAccounts") {
    eBtn?.classList.add("active-filter");
    emailView?.classList.remove("hidden");
    addEmailAccountBtn?.classList.remove("hidden");
    campaignViewSubState = "emailAccounts";
    renderEmailAccountsView();
  } else if (tab === "domains") {
    dBtn?.classList.add("active-filter");
    domainView?.classList.remove("hidden");
    addDomainBtn?.classList.remove("hidden");
    campaignViewSubState = "domains";
    renderDomainManagementView();
  }
}

function renderCampaignsView() {
  const dash = document.getElementById("campaign-dashboard-view");
  const auds = document.getElementById("audience-lists-view");
  const emailView = document.getElementById("email-accounts-view");
  const domainView = document.getElementById("domain-management-view");
  const queryView = document.getElementById("campaign-query-view");

  if (campaignViewSubState === "query") {
    dash?.classList.add("hidden");
    auds?.classList.add("hidden");
    emailView?.classList.add("hidden");
    domainView?.classList.add("hidden");
    queryView?.classList.remove("hidden");
    renderCampaignQueryView();
  } else if (campaignViewSubState === "audiences") {
    switchCampaignSubTab("audiences");
  } else if (campaignViewSubState === "emailAccounts") {
    switchCampaignSubTab("emailAccounts");
  } else if (campaignViewSubState === "domains") {
    switchCampaignSubTab("domains");
  } else {
    switchCampaignSubTab("campaigns");
  }
}

// Click-and-drag column resizing for a <table>. Adds a thin drag handle to
// the right edge of every header cell except the last. The last column is
// expected to be an empty trailing spacer <th> in the markup (no text, no
// width) — it's deliberately left with no pixel width so table-layout:fixed
// hands it 100% of whatever space the other columns don't use. That way
// shrinking a column doesn't stretch its neighbors to fill the container;
// the leftover space collects harmlessly at the end instead, and real
// columns (including Actions) can sit snug next to each other.
// Only needs to run once per table — the <thead> is static markup that
// isn't rebuilt on re-render, so widths set here survive subsequent calls
// to whatever render function repopulates <tbody>.
function makeTableColumnsResizable(tableId) {
  const table = document.getElementById(tableId);
  if (!table || table.dataset.resizableInit) return;
  table.dataset.resizableInit = "true";

  const headerCells = Array.from(table.querySelectorAll("thead th"));
  const lastIdx = headerCells.length - 1;
  // Capture each real column's current rendered width before switching to
  // table-layout:fixed, so turning on resizing doesn't itself jump/reflow
  // the columns the user already sees. The trailing spacer column is
  // excluded — it must stay width-less to act as the flexible filler.
  const startWidths = headerCells.map(th => th.offsetWidth);

  table.classList.add("col-resizable-table");
  headerCells.forEach((th, idx) => {
    if (idx === lastIdx) return; // leave the spacer column flexible
    th.style.width = startWidths[idx] + "px";
  });

  headerCells.forEach((th, idx) => {
    if (idx === lastIdx) return; // no handle on the trailing spacer column

    const handle = document.createElement("div");
    handle.className = "col-resize-handle";
    th.appendChild(handle);

    let startX = 0;
    let startWidth = 0;

    const onMouseMove = (e) => {
      const newWidth = Math.max(60, startWidth + (e.clientX - startX));
      th.style.width = newWidth + "px";
    };

    const onMouseUp = () => {
      handle.classList.remove("resizing");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation(); // don't let the drag bubble up into row-click handlers
      startX = e.clientX;
      startWidth = th.offsetWidth;
      handle.classList.add("resizing");
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  });
}

/* ==========================================================================
   📧 CAMPAIGN HUB: EMAIL ACCOUNTS MANAGER
   (independent mini-database of sending accounts used with Smart Leads)
   ========================================================================== */

function renderEmailAccountsView() {
  // Set up once the view is actually visible — offsetWidth reads 0 while
  // the panel's ancestor still has the "hidden" (display:none) class, which
  // would lock every column's captured starting width to zero.
  makeTableColumnsResizable("email-accounts-table");

  // Status Filter Row (fixed set)
  const statusRow = document.getElementById("email-account-status-filters-bar");
  if (statusRow) {
    const statuses = ["Active", "Warming", "Paused", "Banned"];
    let statusHtml = `<button class="media-status-filter ${activeEmailAccountFilterStatus === 'all' ? 'active-filter' : ''}" data-status="all">All Statuses</button>`;
    statuses.forEach(s => {
      statusHtml += `<button class="media-status-filter ${activeEmailAccountFilterStatus === s ? 'active-filter' : ''}" data-status="${s}">${getEmailAccountStatusIcon(s)} ${s}</button>`;
    });
    statusRow.innerHTML = statusHtml;
    statusRow.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        activeEmailAccountFilterStatus = btn.getAttribute("data-status");
        renderEmailAccountsView();
      });
    });
  }

  // Provider Filter Row (dynamic, from state.emailProviders)
  const providerRow = document.getElementById("email-account-provider-filters-bar");
  if (providerRow) {
    let providerHtml = `<button class="media-status-filter ${activeEmailAccountFilterProvider === 'all' ? 'active-filter' : ''}" data-provider="all">All Providers</button>`;
    (state.emailProviders || []).forEach(p => {
      providerHtml += `<button class="media-status-filter ${activeEmailAccountFilterProvider === p ? 'active-filter' : ''}" data-provider="${escapeHTML(p)}">${escapeHTML(p)}</button>`;
    });
    providerRow.innerHTML = providerHtml;
    providerRow.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        activeEmailAccountFilterProvider = btn.getAttribute("data-provider");
        renderEmailAccountsView();
      });
    });
  }

  const query = (document.getElementById("email-account-search")?.value || "").toLowerCase().trim();
  const tableBody = document.getElementById("email-accounts-table-body");
  if (!tableBody) return;

  let filtered = (state.emailAccounts || []).filter(a => {
    if (activeEmailAccountFilterStatus !== "all" && (a.status || "Active") !== activeEmailAccountFilterStatus) return false;
    if (activeEmailAccountFilterProvider !== "all" && (a.provider || "") !== activeEmailAccountFilterProvider) return false;
    if (query) {
      const haystack = [a.email, a.provider, a.domain, a.notes].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const sortBy = document.getElementById("email-account-sort-by")?.value || "none";
  if (sortBy === "email-asc") {
    filtered.sort((a, b) => (a.email || "").toLowerCase().localeCompare((b.email || "").toLowerCase()));
  } else if (sortBy === "email-desc") {
    filtered.sort((a, b) => (b.email || "").toLowerCase().localeCompare((a.email || "").toLowerCase()));
  } else if (sortBy === "provider-asc") {
    filtered.sort((a, b) => (a.provider || "").toLowerCase().localeCompare((b.provider || "").toLowerCase()));
  } else if (sortBy === "status") {
    filtered.sort((a, b) => (a.status || "").toLowerCase().localeCompare((b.status || "").toLowerCase()));
  } else if (sortBy === "limit-desc") {
    filtered.sort((a, b) => (Number(b.dailyLimit) || 0) - (Number(a.dailyLimit) || 0));
  } else if (sortBy === "date-added-desc") {
    filtered.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
  } else if (sortBy === "date-added-asc") {
    filtered.sort((a, b) => new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0));
  }

  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--color-text-muted);">No email accounts match this filter. Click "+ Add Email Account" to create one.</td></tr>`;
    return;
  }

  filtered.forEach(a => {
    const tr = document.createElement("tr");
    const isRevealed = visibleEmailAccountPasswordIds.has(a.id);
    const maskedPassword = a.password ? "•".repeat(Math.min(a.password.length, 10)) : "—";
    const statusBadge = `${getEmailAccountStatusIcon(a.status || "Active")} ${a.status || "Active"}`;
    const dashboardCell = a.dashboardUrl
      ? `<a href="${escapeHTML(ensureUrlProtocol(a.dashboardUrl))}" target="_blank" rel="noopener" title="Open dashboard" style="text-decoration:none;">🔗</a>`
      : `<span style="color:var(--color-text-muted);">—</span>`;

    tr.innerHTML = `
      <td>
        <div style="display:flex; align-items:center; gap:6px;">
          <strong class="ea-email-edit-trig" style="cursor:pointer;" title="Click to edit this record">${escapeHTML(a.email || "Untitled Account")}</strong>
          ${a.email ? `<button type="button" class="text-btn btn-ea-copy-email" title="Copy email address" style="padding:2px 4px;">📋</button>` : ""}
        </div>
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="ea-password-display" style="font-family: monospace; font-size:12px;">${a.password ? (isRevealed ? escapeHTML(a.password) : maskedPassword) : "—"}</span>
          ${a.password ? `
            <button type="button" class="text-btn btn-ea-toggle-pw" title="${isRevealed ? "Hide" : "Show"} password" style="padding:2px 4px;">${isRevealed ? "🙈" : "👁️"}</button>
            <button type="button" class="text-btn btn-ea-copy-pw" title="Copy password" style="padding:2px 4px;">📋</button>
          ` : ""}
        </div>
      </td>
      <td>${escapeHTML(a.provider || "—")}</td>
      <td>${statusBadge}</td>
      <td style="text-align:center;">${dashboardCell}</td>
      <td style="text-align:right;">
        <button type="button" class="text-btn btn-ea-edit" style="margin-right:8px;">✏️ Edit</button>
        <button type="button" class="text-btn btn-ea-delete-row" style="color:var(--color-danger);">🗑️</button>
      </td>
      <td></td>
    `;

    if (a.email) {
      tr.querySelector(".btn-ea-copy-email").addEventListener("click", () => {
        navigator.clipboard.writeText(a.email).then(() => {
          alert("Email address copied to clipboard.");
        }).catch(() => {
          alert("Couldn't copy to clipboard — your browser may have blocked it.");
        });
      });
    }

    if (a.password) {
      tr.querySelector(".btn-ea-toggle-pw").addEventListener("click", () => {
        if (visibleEmailAccountPasswordIds.has(a.id)) {
          visibleEmailAccountPasswordIds.delete(a.id);
        } else {
          visibleEmailAccountPasswordIds.add(a.id);
        }
        renderEmailAccountsView();
      });
      tr.querySelector(".btn-ea-copy-pw").addEventListener("click", () => {
        navigator.clipboard.writeText(a.password).then(() => {
          alert("Password copied to clipboard.");
        }).catch(() => {
          alert("Couldn't copy to clipboard — your browser may have blocked it.");
        });
      });
    }

    tr.querySelector(".ea-email-edit-trig").addEventListener("click", () => openEmailAccountModal(a.id));
    tr.querySelector(".btn-ea-edit").addEventListener("click", () => openEmailAccountModal(a.id));
    tr.querySelector(".btn-ea-delete-row").addEventListener("click", () => deleteEmailAccount(a.id));

    tableBody.appendChild(tr);
  });
}

function openEmailAccountModal(id = null) {
  const modal = document.getElementById("modal-email-account");
  const title = document.getElementById("email-account-modal-title");
  const deleteBtn = document.getElementById("btn-ea-delete");

  editingEmailAccountId = id;

  const providerSelect = document.getElementById("ea-provider");
  providerSelect.innerHTML = (state.emailProviders || []).map(p => `<option value="${escapeHTML(p)}">${escapeHTML(p)}</option>`).join("");

  document.getElementById("ea-password").type = "password";
  document.getElementById("btn-ea-toggle-password").textContent = "👁️";

  if (id) {
    title.textContent = "Edit Email Account";
    deleteBtn.classList.remove("hidden");
    const a = state.emailAccounts.find(x => x.id === id);
    if (a) {
      document.getElementById("ea-email").value = a.email || "";
      document.getElementById("ea-password").value = a.password || "";
      providerSelect.value = a.provider || (state.emailProviders[0] || "");
      document.getElementById("ea-status").value = a.status || "Active";
      document.getElementById("ea-dashboard-url").value = a.dashboardUrl || "";
      document.getElementById("ea-daily-limit").value = a.dailyLimit || "";
      document.getElementById("ea-domain").value = a.domain || "";
      document.getElementById("ea-notes").value = a.notes || "";
    }
  } else {
    title.textContent = "Add Email Account";
    deleteBtn.classList.add("hidden");
    document.getElementById("ea-email").value = "";
    document.getElementById("ea-password").value = "";
    providerSelect.value = state.emailProviders[0] || "";
    document.getElementById("ea-status").value = "Active";
    // Pre-fill the dashboard URL from the default Provider selection, same
    // as if the user had just picked it from the dropdown.
    document.getElementById("ea-dashboard-url").value = state.emailProviderDefaultUrls[providerSelect.value] || "";
    document.getElementById("ea-daily-limit").value = "";
    document.getElementById("ea-domain").value = "";
    document.getElementById("ea-notes").value = "";
  }

  modal.classList.remove("hidden");
}

function saveEmailAccountModal() {
  const email = document.getElementById("ea-email").value.trim();
  const password = document.getElementById("ea-password").value;
  const provider = document.getElementById("ea-provider").value;
  const status = document.getElementById("ea-status").value;
  const dashboardUrl = document.getElementById("ea-dashboard-url").value.trim();
  const dailyLimit = document.getElementById("ea-daily-limit").value.trim();
  const domain = document.getElementById("ea-domain").value.trim();
  const notes = document.getElementById("ea-notes").value.trim();

  if (!email) {
    alert("Email Address is required!");
    return;
  }

  if (editingEmailAccountId) {
    const a = state.emailAccounts.find(x => x.id === editingEmailAccountId);
    if (a) {
      a.email = email;
      a.password = password;
      a.provider = provider;
      a.status = status;
      a.dashboardUrl = dashboardUrl;
      a.dailyLimit = dailyLimit;
      a.domain = domain;
      a.notes = notes;
    }
  } else {
    state.emailAccounts.push({
      id: `ea-${Date.now()}`,
      email,
      password,
      provider,
      status,
      dashboardUrl,
      dailyLimit,
      domain,
      notes,
      dateAdded: new Date().toISOString().split("T")[0]
    });
  }

  saveState();
  document.getElementById("modal-email-account").classList.add("hidden");
  renderEmailAccountsView();
}

function deleteEmailAccount(id) {
  const a = state.emailAccounts.find(x => x.id === id);
  if (!a) return;
  const ok = confirm(`Permanently delete email account "${a.email}"? This cannot be undone.`);
  if (!ok) return;
  state.emailAccounts = state.emailAccounts.filter(x => x.id !== id);
  visibleEmailAccountPasswordIds.delete(id);
  // Referential integrity: drop this account from any Domain's linked list
  (state.domains || []).forEach(d => {
    if (d.linkedEmailAccountIds) {
      d.linkedEmailAccountIds = d.linkedEmailAccountIds.filter(eid => eid !== id);
    }
  });
  saveState();
  document.getElementById("modal-email-account").classList.add("hidden");
  renderEmailAccountsView();
}

/* ==========================================================================
   🌐 CAMPAIGN HUB: DOMAIN MANAGEMENT
   (independent mini-database of domains used with Smart Leads sending)
   ========================================================================== */

function renderDomainManagementView() {
  // Set up once the view is actually visible — see the matching note on
  // renderEmailAccountsView() for why this can't run while still hidden.
  makeTableColumnsResizable("domains-table");

  // Status Filter Row (fixed set)
  const statusRow = document.getElementById("domain-status-filters-bar");
  if (statusRow) {
    const statuses = ["Active", "Expiring Soon", "Expired", "Parked"];
    let statusHtml = `<button class="media-status-filter ${activeDomainFilterStatus === 'all' ? 'active-filter' : ''}" data-status="all">All Statuses</button>`;
    statuses.forEach(s => {
      statusHtml += `<button class="media-status-filter ${activeDomainFilterStatus === s ? 'active-filter' : ''}" data-status="${s}">${getDomainStatusIcon(s)} ${s}</button>`;
    });
    statusRow.innerHTML = statusHtml;
    statusRow.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        activeDomainFilterStatus = btn.getAttribute("data-status");
        renderDomainManagementView();
      });
    });
  }

  // Registrar Filter Row (dynamic, from state.domainRegistrars)
  const registrarRow = document.getElementById("domain-registrar-filters-bar");
  if (registrarRow) {
    let registrarHtml = `<button class="media-status-filter ${activeDomainFilterRegistrar === 'all' ? 'active-filter' : ''}" data-registrar="all">All Registrars</button>`;
    (state.domainRegistrars || []).forEach(r => {
      registrarHtml += `<button class="media-status-filter ${activeDomainFilterRegistrar === r ? 'active-filter' : ''}" data-registrar="${escapeHTML(r)}">${escapeHTML(r)}</button>`;
    });
    registrarRow.innerHTML = registrarHtml;
    registrarRow.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        activeDomainFilterRegistrar = btn.getAttribute("data-registrar");
        renderDomainManagementView();
      });
    });
  }

  const query = (document.getElementById("domain-search")?.value || "").toLowerCase().trim();
  const tableBody = document.getElementById("domains-table-body");
  if (!tableBody) return;

  let filtered = (state.domains || []).filter(d => {
    if (activeDomainFilterStatus !== "all" && (d.status || "Active") !== activeDomainFilterStatus) return false;
    if (activeDomainFilterRegistrar !== "all" && (d.registrar || "") !== activeDomainFilterRegistrar) return false;
    if (query) {
      const haystack = [d.url, d.registrar, d.host, d.ip, d.userId, d.notes].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const sortBy = document.getElementById("domain-sort-by")?.value || "none";
  if (sortBy === "url-asc") {
    filtered.sort((a, b) => (a.url || "").toLowerCase().localeCompare((b.url || "").toLowerCase()));
  } else if (sortBy === "url-desc") {
    filtered.sort((a, b) => (b.url || "").toLowerCase().localeCompare((a.url || "").toLowerCase()));
  } else if (sortBy === "registrar-asc") {
    filtered.sort((a, b) => (a.registrar || "").toLowerCase().localeCompare((b.registrar || "").toLowerCase()));
  } else if (sortBy === "status") {
    filtered.sort((a, b) => (a.status || "").toLowerCase().localeCompare((b.status || "").toLowerCase()));
  } else if (sortBy === "expiration-asc") {
    filtered.sort((a, b) => new Date(a.expirationDate || "9999-12-31") - new Date(b.expirationDate || "9999-12-31"));
  } else if (sortBy === "expiration-desc") {
    filtered.sort((a, b) => new Date(b.expirationDate || "0001-01-01") - new Date(a.expirationDate || "0001-01-01"));
  } else if (sortBy === "cost-desc") {
    filtered.sort((a, b) => (Number(b.annualCost) || 0) - (Number(a.annualCost) || 0));
  } else if (sortBy === "date-added-desc") {
    filtered.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
  }

  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:var(--color-text-muted);">No domains match this filter. Click "+ Add Domain" to create one.</td></tr>`;
    return;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  filtered.forEach(d => {
    const tr = document.createElement("tr");
    const statusBadge = `${getDomainStatusIcon(d.status || "Active")} ${d.status || "Active"}`;

    // Highlight the expiration cell independent of the manually-set Status
    // field, so a stale status doesn't hide an approaching renewal.
    let expirationColor = "inherit";
    let expirationSuffix = "";
    if (d.expirationDate) {
      const expDate = new Date(d.expirationDate);
      const daysUntil = Math.round((expDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) {
        expirationColor = "var(--color-danger)";
        expirationSuffix = ` (expired)`;
      } else if (daysUntil <= 30) {
        expirationColor = "#f59e0b";
        expirationSuffix = ` (${daysUntil}d)`;
      }
    }

    const registrarLinkBtn = d.registrarDashboardUrl
      ? `<a href="${escapeHTML(ensureUrlProtocol(d.registrarDashboardUrl))}" target="_blank" rel="noopener" title="Open ${escapeHTML(d.registrar || "registrar")} dashboard" class="text-btn" style="padding:2px 4px; text-decoration:none;">🔗</a>`
      : "";
    const hostLinkBtn = d.hostDashboardUrl
      ? `<a href="${escapeHTML(ensureUrlProtocol(d.hostDashboardUrl))}" target="_blank" rel="noopener" title="Open ${escapeHTML(d.host || "host")} dashboard" class="text-btn" style="padding:2px 4px; text-decoration:none;">🔗</a>`
      : "";
    const urlLinkBtn = d.url
      ? `<a href="${escapeHTML(ensureUrlProtocol(d.url))}" target="_blank" rel="noopener" title="Open ${escapeHTML(d.url)}" class="text-btn" style="padding:2px 4px; text-decoration:none;">🔗</a>`
      : "";

    tr.innerHTML = `
      <td>
        <div style="display:flex; align-items:center; gap:6px;">
          <strong class="dom-url-edit-trig" style="cursor:pointer;" title="Click to edit this record">${escapeHTML(d.url || "Untitled Domain")}</strong>
          ${urlLinkBtn}
        </div>
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:6px;">
          <span>${escapeHTML(d.registrar || "—")}</span>
          ${registrarLinkBtn}
        </div>
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:6px;">
          <span>${escapeHTML(d.host || "—")}</span>
          ${hostLinkBtn}
        </div>
      </td>
      <td>${statusBadge}</td>
      <td style="color:${expirationColor};">${d.expirationDate ? escapeHTML(d.expirationDate) + expirationSuffix : "—"}</td>
      <td style="text-align:right;">
        <button type="button" class="text-btn btn-dom-edit" style="margin-right:8px;">✏️ Edit</button>
        <button type="button" class="text-btn btn-dom-delete-row" style="color:var(--color-danger);">🗑️</button>
      </td>
      <td></td>
    `;

    tr.querySelector(".dom-url-edit-trig").addEventListener("click", () => openDomainModal(d.id));
    tr.querySelector(".btn-dom-edit").addEventListener("click", () => openDomainModal(d.id));
    tr.querySelector(".btn-dom-delete-row").addEventListener("click", () => deleteDomain(d.id));

    tableBody.appendChild(tr);
  });
}

function renderDomainLinkedAccountsChips() {
  const container = document.getElementById("dom-linked-accounts-list");
  if (!container) return;

  if (!state.emailAccounts || state.emailAccounts.length === 0) {
    container.innerHTML = `<span style="font-size:12px; color:var(--color-text-muted);">No email accounts yet — add one in the Email Accounts tab to link it here.</span>`;
    return;
  }

  container.innerHTML = "";
  state.emailAccounts.forEach(a => {
    const chip = document.createElement("button");
    chip.type = "button";
    const isSelected = currentDomainLinkedEmailAccountIds.includes(a.id);
    chip.className = `tag-filter-btn ${isSelected ? "active-filter" : ""}`;
    chip.style.marginRight = "6px";
    chip.style.marginBottom = "6px";
    chip.textContent = `${isSelected ? "✅" : "➕"} ${a.email}`;
    chip.addEventListener("click", () => {
      const idx = currentDomainLinkedEmailAccountIds.indexOf(a.id);
      if (idx > -1) {
        currentDomainLinkedEmailAccountIds.splice(idx, 1);
      } else {
        currentDomainLinkedEmailAccountIds.push(a.id);
      }
      renderDomainLinkedAccountsChips();
    });
    container.appendChild(chip);
  });
}

function openDomainModal(id = null) {
  const modal = document.getElementById("modal-domain");
  const title = document.getElementById("domain-modal-title");
  const deleteBtn = document.getElementById("btn-dom-delete");

  editingDomainId = id;

  const registrarSelect = document.getElementById("dom-registrar");
  registrarSelect.innerHTML = (state.domainRegistrars || []).map(r => `<option value="${escapeHTML(r)}">${escapeHTML(r)}</option>`).join("");
  const hostSelect = document.getElementById("dom-host");
  hostSelect.innerHTML = (state.domainHosts || []).map(h => `<option value="${escapeHTML(h)}">${escapeHTML(h)}</option>`).join("");

  document.getElementById("dom-password").type = "password";
  document.getElementById("btn-dom-toggle-password").textContent = "👁️";

  if (id) {
    title.textContent = "Edit Domain";
    deleteBtn.classList.remove("hidden");
    const d = state.domains.find(x => x.id === id);
    if (d) {
      document.getElementById("dom-url").value = d.url || "";
      registrarSelect.value = d.registrar || (state.domainRegistrars[0] || "");
      hostSelect.value = d.host || (state.domainHosts[0] || "");
      document.getElementById("dom-ip").value = d.ip || "";
      document.getElementById("dom-user-id").value = d.userId || "";
      document.getElementById("dom-password").value = d.password || "";
      document.getElementById("dom-annual-cost").value = d.annualCost || "";
      document.getElementById("dom-expiration-date").value = d.expirationDate || "";
      document.getElementById("dom-status").value = d.status || "Active";
      document.getElementById("dom-auto-renew").value = d.autoRenew || "No";
      document.getElementById("dom-dns-health").value = d.dnsHealth || "Not Configured";
      document.getElementById("dom-registrar-dashboard-url").value = d.registrarDashboardUrl || "";
      document.getElementById("dom-host-dashboard-url").value = d.hostDashboardUrl || "";
      document.getElementById("dom-notes").value = d.notes || "";
      currentDomainLinkedEmailAccountIds = d.linkedEmailAccountIds ? [...d.linkedEmailAccountIds] : [];
    }
  } else {
    title.textContent = "Add Domain";
    deleteBtn.classList.add("hidden");
    document.getElementById("dom-url").value = "";
    registrarSelect.value = state.domainRegistrars[0] || "";
    hostSelect.value = state.domainHosts[0] || "";
    document.getElementById("dom-ip").value = "";
    document.getElementById("dom-user-id").value = "";
    document.getElementById("dom-password").value = "";
    document.getElementById("dom-annual-cost").value = "";
    document.getElementById("dom-expiration-date").value = "";
    document.getElementById("dom-status").value = "Active";
    document.getElementById("dom-auto-renew").value = "No";
    document.getElementById("dom-dns-health").value = "Not Configured";
    // Pre-fill the dashboard URLs from the default Registrar/Host selection,
    // same as if the user had just picked them from the dropdowns.
    document.getElementById("dom-registrar-dashboard-url").value = state.domainRegistrarDefaultUrls[registrarSelect.value] || "";
    document.getElementById("dom-host-dashboard-url").value = state.domainHostDefaultUrls[hostSelect.value] || "";
    document.getElementById("dom-notes").value = "";
    currentDomainLinkedEmailAccountIds = [];
  }

  renderDomainLinkedAccountsChips();
  modal.classList.remove("hidden");
}

function saveDomainModal() {
  const url = document.getElementById("dom-url").value.trim();
  const registrar = document.getElementById("dom-registrar").value;
  const host = document.getElementById("dom-host").value;
  const ip = document.getElementById("dom-ip").value.trim();
  const userId = document.getElementById("dom-user-id").value.trim();
  const password = document.getElementById("dom-password").value;
  const annualCost = document.getElementById("dom-annual-cost").value.trim();
  const expirationDate = document.getElementById("dom-expiration-date").value;
  const status = document.getElementById("dom-status").value;
  const autoRenew = document.getElementById("dom-auto-renew").value;
  const dnsHealth = document.getElementById("dom-dns-health").value;
  const registrarDashboardUrl = document.getElementById("dom-registrar-dashboard-url").value.trim();
  const hostDashboardUrl = document.getElementById("dom-host-dashboard-url").value.trim();
  const notes = document.getElementById("dom-notes").value.trim();

  if (!url) {
    alert("URL is required!");
    return;
  }

  if (editingDomainId) {
    const d = state.domains.find(x => x.id === editingDomainId);
    if (d) {
      d.url = url;
      d.registrar = registrar;
      d.host = host;
      d.ip = ip;
      d.userId = userId;
      d.password = password;
      d.annualCost = annualCost;
      d.expirationDate = expirationDate;
      d.status = status;
      d.autoRenew = autoRenew;
      d.dnsHealth = dnsHealth;
      d.registrarDashboardUrl = registrarDashboardUrl;
      d.hostDashboardUrl = hostDashboardUrl;
      d.notes = notes;
      d.linkedEmailAccountIds = [...currentDomainLinkedEmailAccountIds];
    }
  } else {
    state.domains.push({
      id: `dom-${Date.now()}`,
      url,
      registrar,
      host,
      ip,
      userId,
      password,
      annualCost,
      expirationDate,
      status,
      autoRenew,
      dnsHealth,
      registrarDashboardUrl,
      hostDashboardUrl,
      linkedEmailAccountIds: [...currentDomainLinkedEmailAccountIds],
      notes,
      dateAdded: new Date().toISOString().split("T")[0]
    });
  }

  saveState();
  document.getElementById("modal-domain").classList.add("hidden");
  renderDomainManagementView();
}

function deleteDomain(id) {
  const d = state.domains.find(x => x.id === id);
  if (!d) return;
  const ok = confirm(`Permanently delete domain "${d.url}"? This cannot be undone.`);
  if (!ok) return;
  state.domains = state.domains.filter(x => x.id !== id);
  visibleDomainPasswordIds.delete(id);
  saveState();
  document.getElementById("modal-domain").classList.add("hidden");
  renderDomainManagementView();
}

function renderCampaignDashboard() {
  // Phase Filters Row
  const phaseRow = document.getElementById("campaign-phase-filters-bar");
  if (phaseRow) {
    let phaseHtml = `<button class="media-status-filter ${activeCampaignFilterPhase === 'all' ? 'active-filter' : ''}" data-phase="all">All Phases</button>`;
    state.campaignPhases.forEach(p => {
      phaseHtml += `<button class="media-status-filter ${activeCampaignFilterPhase === p ? 'active-filter' : ''}" data-phase="${p}">${escapeHTML(p)}</button>`;
    });
    phaseRow.innerHTML = phaseHtml;
    phaseRow.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        activeCampaignFilterPhase = btn.getAttribute("data-phase");
        renderCampaignDashboard();
      });
    });
  }

  // Tags filter list
  renderCampaignTagsSidebar();

  // Campaign Deck
  const deck = document.getElementById("campaign-deck");
  if (!deck) return;
  deck.innerHTML = "";

  const filtered = state.campaigns.filter(c => {
    // 1. Phase Filter
    if (activeCampaignFilterPhase !== "all" && c.status !== activeCampaignFilterPhase) return false;
    // 2. Tag Filters (AND search logic)
    if (activeCampaignFilterTags.length > 0) {
      const cTags = c.tags || [];
      const hasAllTags = activeCampaignFilterTags.every(t => cTags.includes(t));
      if (!hasAllTags) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    deck.innerHTML = `<div style="grid-column: span 3; text-align:center; padding:48px; color:var(--color-text-muted);">No campaigns fit this filter view. Create a campaign to begin!</div>`;
  } else {
    filtered.forEach(c => {
      const card = document.createElement("div");
      card.className = "media-card"; // Reuses media card style for identical dashboard feel!
      card.style.height = "auto";
      card.style.minHeight = "210px";

      const audienceList = state.audienceLists.find(al => al.id === c.audienceListId);
      const listName = audienceList ? audienceList.name : "None";
      const contactCount = audienceList ? (audienceList.prospectIds || []).length : 0;
      
      const tagBadges = (c.tags || []).map(t => `<span class="tag-badge">${escapeHTML(t)}</span>`).join("");

      const phaseOptions = state.campaignPhases.map(p => {
        const selected = (p === c.status) ? "selected" : "";
        return `<option value="${p}" ${selected}>${escapeHTML(p)}</option>`;
      }).join("");

      card.innerHTML = `
        <div class="media-card-header">
          <span class="media-type-badge" style="background-color:rgba(16,185,129,0.1); color:#10b981;">Campaign</span>
          <select class="media-status-select clickable-status-select campaign-status-select" data-id="${c.id}">
            ${phaseOptions}
          </select>
        </div>
        
        <div class="media-card-body" style="cursor: pointer;">
          <h3 style="margin-top: 4px;">${escapeHTML(c.title)}</h3>
          <p class="media-pitch" style="-webkit-line-clamp: 2; line-clamp: 2;">${escapeHTML(c.goalSummary || "No campaign goal added.")}</p>
          <div style="font-size: 11px; margin-top: 6px; display:flex; flex-direction:column; gap:2px; color: var(--color-text-muted);">
            <span>Audience List: <strong style="color:var(--color-secondary);">${escapeHTML(listName)}</strong></span>
            <span>Target Contacts: <strong>${contactCount}</strong></span>
          </div>
          <div class="media-tags-list" style="margin-top: 8px;">${tagBadges}</div>
        </div>
        
        <div class="media-card-footer" style="margin-top: auto; border-top: 1px solid var(--color-border); padding-top: 8px;">
          <div class="media-card-actions">
            <button class="header-action-btn secondary-btn btn-edit-campaign-trig" data-id="${c.id}">✏️ Edit</button>
            <button class="header-action-btn danger-btn btn-delete-campaign-trig" data-id="${c.id}">🗑️ Delete</button>
          </div>
        </div>
      `;

      card.querySelector(".media-card-body").addEventListener("click", () => {
        openCampaignDetail(c.id);
      });
      card.querySelector(".campaign-status-select").addEventListener("change", (e) => {
        const oldStatus = c.status;
        c.status = e.target.value;
        if (c.status === "Launch" && oldStatus !== "Launch") {
          c.launchDate = new Date().toISOString().split("T")[0];
          recordCampaignLaunchInteractions(c);
        }
        saveState();
        renderCampaignDashboard();
      });
      card.querySelector(".btn-edit-campaign-trig").addEventListener("click", (e) => {
        e.stopPropagation();
        openCreateCampaignModal(c.id);
      });
      card.querySelector(".btn-delete-campaign-trig").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteCampaign(c.id);
      });

      deck.appendChild(card);
    });
  }
}

function renderCampaignTagsSidebar() {
  const container = document.getElementById("campaign-tags-filter-list");
  if (!container) return;
  container.innerHTML = "";

  const clearBtn = document.getElementById("btn-clear-campaign-tags");
  if (clearBtn) {
    if (activeCampaignFilterTags.length > 0) {
      clearBtn.disabled = false;
      clearBtn.style.opacity = "1";
      clearBtn.style.cursor = "pointer";
    } else {
      clearBtn.disabled = true;
      clearBtn.style.opacity = "0.5";
      clearBtn.style.cursor = "not-allowed";
    }
  }

  state.campaign_tags.forEach(tag => {
    const isSelected = activeCampaignFilterTags.includes(tag);
    const btn = document.createElement("button");
    btn.className = `tag-filter-btn ${isSelected ? 'active-tag' : ''}`;
    btn.innerHTML = `# ${escapeHTML(tag)}`;
    btn.addEventListener("click", () => {
      if (isSelected) {
        activeCampaignFilterTags = activeCampaignFilterTags.filter(t => t !== tag);
      } else {
        activeCampaignFilterTags.push(tag);
      }
      renderCampaignDashboard();
    });
    container.appendChild(btn);
  });
}

function openCampaignDetail(campId) {
  viewingCampaignDetailId = campId;
  const c = state.campaigns.find(x => x.id === campId);
  if (!c) return;

  const audList = state.audienceLists.find(al => al.id === c.audienceListId);
  const listName = audList ? audList.name : "None Assigned";
  const contacts = audList ? (audList.prospectIds || []) : [];

  document.getElementById("campaign-detail-title").textContent = c.title;
  document.getElementById("campaign-detail-audience").textContent = c.intendedAudience || "No description provided.";
  document.getElementById("campaign-detail-list-name").textContent = listName;
  document.getElementById("campaign-detail-goal").textContent = c.goalSummary || "No goal details added.";
  document.getElementById("campaign-detail-contact-count").textContent = `${contacts.length} Contacts`;

  const tbody = document.getElementById("campaign-detail-contacts-body");
  tbody.innerHTML = "";

  if (contacts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--color-text-muted); padding:16px;">This audience list is empty.</td></tr>`;
  } else {
    contacts.forEach(pid => {
      const p = state.prospects.find(x => x.id === pid);
      if (!p) return;
      tbody.innerHTML += `
        <tr>
          <td><strong>${escapeHTML(p.firstName)} ${escapeHTML(p.lastName)}</strong></td>
          <td>${escapeHTML(p.title || "—")}</td>
          <td>${escapeHTML(p.email || "—")}</td>
          <td>${escapeHTML(getCompanyName(p.companyId) || "—")}</td>
        </tr>
      `;
    });
  }

  document.getElementById("modal-campaign-detail").classList.remove("hidden");
}

function renderAudienceListsView() {
  // Render Active / Archived tab toggle
  const tabBar = document.getElementById("audience-status-tabs");
  if (tabBar) {
    tabBar.innerHTML = `
      <button class="media-status-filter ${audienceListStatusFilter === 'active' ? 'active-filter' : ''}" data-status="active">Active</button>
      <button class="media-status-filter ${audienceListStatusFilter === 'archived' ? 'active-filter' : ''}" data-status="archived">Archived</button>
    `;
    tabBar.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        audienceListStatusFilter = btn.dataset.status;
        if (selectedAudienceListId) {
          const sel = state.audienceLists.find(a => a.id === selectedAudienceListId);
          if (sel && (sel.status || "active") !== audienceListStatusFilter) selectedAudienceListId = null;
        }
        renderAudienceListsView();
      });
    });
  }

  const tableBody = document.getElementById("audiences-table-body");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  const filtered = state.audienceLists.filter(al => (al.status || "active") === audienceListStatusFilter);

  if (filtered.length === 0) {
    const msg = audienceListStatusFilter === "archived"
      ? "No archived audience lists."
      : "No audience lists created yet. Run a query or click Create List!";
    tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:24px; color:var(--color-text-muted);">${msg}</td></tr>`;
  } else {
    filtered.forEach(aud => {
      const size = (aud.prospectIds || []).length;
      const isSelected = selectedAudienceListId === aud.id;
      const tr = document.createElement("tr");
      if (isSelected) tr.className = "active-row";

      if (audienceListStatusFilter === "active") {
        tr.innerHTML = `
          <td><strong>${escapeHTML(aud.name)}</strong></td>
          <td>${size} contacts</td>
          <td style="text-align:right;">
            <button class="text-btn btn-aud-inspect-trig" style="margin-right:8px;">👀 View</button>
            <button class="text-btn btn-aud-export-trig" style="margin-right:8px;">⬇️ CSV</button>
            <button class="text-btn btn-aud-archive-trig" style="color:var(--color-text-muted);">📦 Archive</button>
          </td>
        `;
        tr.querySelector(".btn-aud-export-trig").addEventListener("click", (e) => {
          e.stopPropagation();
          exportAudienceContactsCSV(aud.id);
        });
        tr.querySelector(".btn-aud-archive-trig").addEventListener("click", (e) => {
          e.stopPropagation();
          archiveAudienceList(aud.id);
        });
      } else {
        tr.innerHTML = `
          <td><strong>${escapeHTML(aud.name)}</strong> <span style="font-size:11px; color:var(--color-text-muted);">(archived)</span></td>
          <td>${size} contacts</td>
          <td style="text-align:right;">
            <button class="text-btn btn-aud-inspect-trig" style="margin-right:6px;">👀 View</button>
            <button class="text-btn btn-aud-export-trig" style="margin-right:6px;">⬇️ CSV</button>
            <button class="text-btn btn-aud-restore-trig" style="margin-right:6px; color:var(--color-primary);">↩️ Restore</button>
            <button class="text-btn btn-aud-copy-trig" style="margin-right:6px;">📋 Copy</button>
            <button class="text-btn btn-aud-delete-trig" style="color:var(--color-danger);">🗑️ Delete</button>
          </td>
        `;
        tr.querySelector(".btn-aud-export-trig").addEventListener("click", (e) => {
          e.stopPropagation();
          exportAudienceContactsCSV(aud.id);
        });
        tr.querySelector(".btn-aud-restore-trig").addEventListener("click", (e) => {
          e.stopPropagation();
          restoreAudienceList(aud.id);
        });
        tr.querySelector(".btn-aud-copy-trig").addEventListener("click", (e) => {
          e.stopPropagation();
          copyAudienceToNewList(aud.id);
        });
        tr.querySelector(".btn-aud-delete-trig").addEventListener("click", (e) => {
          e.stopPropagation();
          deleteAudienceListById(aud.id);
        });
      }

      tr.querySelector(".btn-aud-inspect-trig").addEventListener("click", (e) => {
        e.stopPropagation();
        selectedAudienceListId = aud.id;
        renderAudienceListsView();
      });
      tr.addEventListener("click", () => {
        selectedAudienceListId = aud.id;
        renderAudienceListsView();
      });

      tableBody.appendChild(tr);
    });
  }

  renderAudienceInspector();
}

function renderAudienceInspector() {
  const inspector = document.getElementById("audience-inspector");
  if (!inspector) return;

  const aud = state.audienceLists.find(x => x.id === selectedAudienceListId);
  
  const inspectName = document.getElementById("aud-inspect-name");
  const inspectSize = document.getElementById("aud-inspect-size");
  const tbody = document.getElementById("aud-inspect-contacts-body");

  // Guard: if any required element is missing, bail out gracefully
  if (!inspectName || !inspectSize || !tbody) return;

  if (!aud) {
    inspectName.textContent = "Select an Audience List";
    inspectSize.textContent = "No audience selected";
    const actionsEl = document.getElementById("aud-inspect-actions");
    if (actionsEl) actionsEl.innerHTML = "";
    const badgeEl = document.getElementById("aud-inspect-status-badge");
    if (badgeEl) badgeEl.textContent = "";
    const notesContainer = document.getElementById("aud-inspect-notes-container");
    if (notesContainer) notesContainer.style.display = "none";
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--color-text-muted); padding:32px;">Click "View" on any audience list to inspect contacts.</td></tr>`;
    return;
  }

  inspectName.textContent = aud.name;
  inspectSize.textContent = `${(aud.prospectIds || []).length} contacts stored`;

  // Inject action buttons based on status
  const actionsEl = document.getElementById("aud-inspect-actions");
  const badgeEl = document.getElementById("aud-inspect-status-badge");
  const isArchived = (aud.status || "active") === "archived";
  if (actionsEl) {
    if (isArchived) {
      actionsEl.innerHTML = `
        <button class="header-action-btn secondary-btn" id="btn-inspector-export-aud" style="padding:4px 8px;font-size:11px;height:auto;">⬇️ Export CSV</button>
        <button class="header-action-btn secondary-btn" id="btn-inspector-restore-aud" style="padding:4px 8px;font-size:11px;height:auto;">↩️ Restore</button>
        <button class="header-action-btn secondary-btn" id="btn-inspector-copy-aud" style="padding:4px 8px;font-size:11px;height:auto;">📋 Copy to New</button>
        <button class="header-action-btn danger-btn" id="btn-inspector-delete-aud" style="padding:4px 8px;font-size:11px;height:auto;background:rgba(239,68,68,0.1);">🗑️ Delete</button>
      `;
      actionsEl.querySelector("#btn-inspector-export-aud").addEventListener("click", () => exportAudienceContactsCSV(aud.id));
      actionsEl.querySelector("#btn-inspector-restore-aud").addEventListener("click", () => restoreAudienceList(aud.id));
      actionsEl.querySelector("#btn-inspector-copy-aud").addEventListener("click", () => copyAudienceToNewList(aud.id));
      actionsEl.querySelector("#btn-inspector-delete-aud").addEventListener("click", () => deleteAudienceListById(aud.id));
    } else {
      actionsEl.innerHTML = `
        <button class="header-action-btn secondary-btn" id="btn-inspector-export-aud" style="padding:4px 8px;font-size:11px;height:auto;">⬇️ Export CSV</button>
        <button class="header-action-btn secondary-btn" id="btn-inspector-tag-all-aud" style="padding:4px 8px;font-size:11px;height:auto;">🏷️ Tag All</button>
        <button class="header-action-btn secondary-btn" id="btn-inspector-popout-aud" style="padding:4px 8px;font-size:11px;height:auto;" title="Pop out contact list">⤢ Pop Out</button>
        <button class="header-action-btn secondary-btn" id="btn-inspector-rename-aud" style="padding:4px 8px;font-size:11px;height:auto;">✏️ Rename</button>
        <button class="header-action-btn secondary-btn" id="btn-inspector-archive-aud" style="padding:4px 8px;font-size:11px;height:auto;">📦 Archive</button>
      `;
      actionsEl.querySelector("#btn-inspector-export-aud").addEventListener("click", () => exportAudienceContactsCSV(aud.id));
      actionsEl.querySelector("#btn-inspector-tag-all-aud").addEventListener("click", () => bulkTagAudienceProspects(aud.id));
      actionsEl.querySelector("#btn-inspector-popout-aud").addEventListener("click", () => openAudiencePopout(aud.id));
      actionsEl.querySelector("#btn-inspector-rename-aud").addEventListener("click", renameSelectedAudienceList);
      actionsEl.querySelector("#btn-inspector-archive-aud").addEventListener("click", () => archiveAudienceList(aud.id));
    }
  }
  if (badgeEl) {
    badgeEl.innerHTML = isArchived
      ? `<span style="color:var(--color-text-muted);">📦 Archived</span>`
      : `<span style="color:#10b981;">● Active</span>`;
  }

  // Notes textarea
  const notesContainer = document.getElementById("aud-inspect-notes-container");
  const notesEl = document.getElementById("aud-inspect-notes");
  if (notesContainer && notesEl) {
    notesContainer.style.display = "block";
    notesEl.value = aud.notes || "";
    const freshNotes = notesEl.cloneNode(true);
    notesEl.parentNode.replaceChild(freshNotes, notesEl);
    freshNotes.addEventListener("input", () => {
      const a = state.audienceLists.find(x => x.id === selectedAudienceListId);
      if (a) { a.notes = freshNotes.value; saveState(); }
    });
  }

  tbody.innerHTML = "";
  const ids = aud.prospectIds || [];

  if (ids.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--color-text-muted); padding:24px;">This audience list is empty.</td></tr>`;
  } else {
    ids.forEach(pid => {
      const p = state.prospects.find(x => x.id === pid);
      if (!p) return;

      const tr = document.createElement("tr");
      const compName = getCompanyName(p.companyId) || "—";
      tr.innerHTML = `
        <td><button class="text-btn btn-aud-open-prospect" style="font-weight:600; text-align:left;">${escapeHTML(p.firstName)} ${escapeHTML(p.lastName)}</button></td>
        <td>${escapeHTML(p.title || "—")}</td>
        <td><button class="text-btn btn-aud-open-company" style="text-align:left; color:var(--color-text-main);">${escapeHTML(compName)}</button></td>
        <td style="text-align:center;">
          <button class="delete-interaction-btn btn-aud-remove-contact" data-pid="${p.id}" title="Remove contact from list">✕</button>
        </td>
      `;

      tr.querySelector(".btn-aud-open-prospect").addEventListener("click", () => openProspectModal(p.id));
      const compBtn = tr.querySelector(".btn-aud-open-company");
      if (p.companyId) {
        compBtn.addEventListener("click", () => openCompanyModal(p.companyId));
      } else {
        compBtn.style.cursor = "default";
        compBtn.disabled = true;
      }
      tr.querySelector(".btn-aud-remove-contact").addEventListener("click", () => {
        removeContactFromAudienceList(aud.id, p.id);
      });

      tbody.appendChild(tr);
    });
  }
}

function deleteAudienceListById(audId) {
  const aud = state.audienceLists.find(x => x.id === audId);
  if (!aud) return;
  const ok = confirm(`Are you sure you want to delete audience list "${aud.name}"?`);
  if (!ok) return;

  // Remove the audience name as a tag from every contact who was in it
  removeAudienceTagFromProspects(aud.prospectIds, aud.name);

  state.audienceLists = state.audienceLists.filter(x => x.id !== audId);
  // Unassign campaigns pointing to it
  state.campaigns.forEach(c => {
    if (c.audienceListId === audId) {
      c.audienceListId = "";
    }
  });

  if (selectedAudienceListId === audId) selectedAudienceListId = null;
  saveState();
  renderAudienceListsView();
}

function removeContactFromAudienceList(audId, prospectId) {
  const aud = state.audienceLists.find(x => x.id === audId);
  if (aud && aud.prospectIds) {
    aud.prospectIds = aud.prospectIds.filter(id => id !== prospectId);
    removeAudienceTagFromProspects([prospectId], aud.name);
    saveState();
    renderAudienceListsView();
  }
}

function addContactToAudienceListDirectly() {
  const aud = state.audienceLists.find(x => x.id === selectedAudienceListId);
  if (!aud) { alert("Please select an audience list first."); return; }

  const searchInput = document.getElementById("aud-add-contact-search");
  const val = searchInput.value.trim();
  if (!val) return;

  // Extract ID from bracket e.g. "John Doe (pros-12345)"
  const idMatch = val.match(/\((pros-[^)]+)\)/);
  if (!idMatch) {
    alert("Please select a contact from the dropdown list.");
    return;
  }

  const pid = idMatch[1];
  const p = state.prospects.find(x => x.id === pid);
  if (!p) {
    alert("Contact not found.");
    return;
  }

  if (!aud.prospectIds) aud.prospectIds = [];
  if (aud.prospectIds.includes(pid)) {
    alert("This contact is already in the list.");
    return;
  }

  aud.prospectIds.push(pid);
  addAudienceTagToProspects([pid], aud.name);
  saveState();
  searchInput.value = "";
  renderAudienceListsView();
}

function createEmptyAudienceList() {
  const name = prompt("Enter a name for the new Audience List:");
  if (!name || !name.trim()) return;

  const duplicate = state.audienceLists.some(a => a.name.toLowerCase() === name.trim().toLowerCase());
  if (duplicate) { alert("An audience list with this name already exists."); return; }

  const audId = `aud-${Date.now()}`;
  state.audienceLists.push({
    id: audId,
    name: name.trim(),
    prospectIds: [],
    status: "active"
  });
  selectedAudienceListId = audId;
  saveState();
  renderAudienceListsView();
}

function renameSelectedAudienceList() {
  const aud = state.audienceLists.find(x => x.id === selectedAudienceListId);
  if (!aud) return;

  const newName = prompt("Rename Audience List:", aud.name);
  if (!newName || !newName.trim() || newName === aud.name) return;

  const duplicate = state.audienceLists.some(a => a.id !== aud.id && a.name.toLowerCase() === newName.trim().toLowerCase());
  if (duplicate) { alert("An audience list with this name already exists."); return; }

  const oldName = aud.name;
  aud.name = newName.trim();
  renameAudienceTagOnProspects(aud.prospectIds, oldName, aud.name);
  saveState();
  renderAudienceListsView();
}

function deleteSelectedAudienceList() {
  if (selectedAudienceListId) {
    deleteAudienceListById(selectedAudienceListId);
  }
}

function archiveAudienceList(audId) {
  const aud = state.audienceLists.find(x => x.id === audId);
  if (!aud) return;
  aud.status = "archived";
  if (selectedAudienceListId === audId) selectedAudienceListId = null;
  audienceListStatusFilter = "active";
  saveState();
  renderAudienceListsView();
}

function restoreAudienceList(audId) {
  const aud = state.audienceLists.find(x => x.id === audId);
  if (!aud) return;
  aud.status = "active";
  audienceListStatusFilter = "active";
  selectedAudienceListId = audId;
  saveState();
  renderAudienceListsView();
}

function copyAudienceToNewList(audId) {
  const aud = state.audienceLists.find(x => x.id === audId);
  if (!aud) return;
  const newName = prompt("Name for the new audience list:", `${aud.name} (Copy)`);
  if (!newName || !newName.trim()) return;
  const duplicate = state.audienceLists.some(a => a.name.toLowerCase() === newName.trim().toLowerCase());
  if (duplicate) { alert("An audience list with this name already exists."); return; }
  const newId = `aud-${Date.now()}`;
  const newList = { id: newId, name: newName.trim(), prospectIds: [...(aud.prospectIds || [])], status: "active" };
  state.audienceLists.push(newList);
  saveState();
  audienceListStatusFilter = "active";
  selectedAudienceListId = newId;
  renderAudienceListsView();
  alert(`Created "${newName.trim()}" with ${newList.prospectIds.length} contacts.`);
}

function bulkTagAudienceProspects(audId) {
  const aud = state.audienceLists.find(x => x.id === audId);
  if (!aud || !(aud.prospectIds || []).length) {
    alert("This audience list has no contacts to tag.");
    return;
  }
  // Build a quick prompt with existing tags listed
  const existingTags = (state.prospect_tags || []).join(", ");
  const hint = existingTags ? `\n\nExisting tags: ${existingTags}` : "";
  const tagInput = prompt(`Enter a tag to apply to all ${aud.prospectIds.length} contacts in "${aud.name}":${hint}`);
  if (!tagInput || !tagInput.trim()) return;
  const tag = tagInput.trim();

  // Register tag globally if new
  if (!state.prospect_tags) state.prospect_tags = [];
  if (!state.prospect_tags.includes(tag)) state.prospect_tags.push(tag);

  // Apply to each prospect in the audience
  let applied = 0;
  aud.prospectIds.forEach(pid => {
    const p = state.prospects.find(x => x.id === pid);
    if (p) {
      if (!p.tags) p.tags = [];
      if (!p.tags.includes(tag)) { p.tags.push(tag); applied++; }
    }
  });

  saveState();
  alert(`Tag "${tag}" added to ${applied} contact${applied === 1 ? "" : "s"}.`);
}

// Popout state persists across refresh calls so position/size aren't reset
// ── Audience Pop-out state (persists across refresh calls) ────────────────
let _popoutInitialized = false;
let _popoutMaximized   = false;
let _popoutSaved       = {};   // saved geometry when maximized
let _popDragging       = false;
let _popDragOffX       = 0, _popDragOffY = 0;

function _popoutToggleMaximize() {
  const panel  = document.getElementById("aud-popout-panel");
  const maxBtn = document.getElementById("btn-aud-popout-maximize");
  if (!panel) return;
  if (_popoutMaximized) {
    panel.style.left          = _popoutSaved.left;
    panel.style.top           = _popoutSaved.top;
    panel.style.right         = _popoutSaved.right  || "auto";
    panel.style.width         = _popoutSaved.width;
    panel.style.height        = _popoutSaved.height;
    panel.style.borderRadius  = "12px";
    panel.style.resize        = "both";
    if (maxBtn) maxBtn.textContent = "⛶";
    _popoutMaximized = false;
  } else {
    const r = panel.getBoundingClientRect();
    _popoutSaved = {
      left:  panel.style.left  || r.left  + "px",
      top:   panel.style.top   || r.top   + "px",
      right: panel.style.right,
      width: panel.style.width  || r.width  + "px",
      height:panel.style.height || r.height + "px"
    };
    panel.style.left         = "2vw";
    panel.style.top          = "2vh";
    panel.style.right        = "auto";
    panel.style.width        = "96vw";
    panel.style.height       = "96vh";
    panel.style.borderRadius = "4px";
    panel.style.resize       = "none";
    if (maxBtn) maxBtn.textContent = "⊡";
    _popoutMaximized = true;
  }
}

function _initPopout() {
  if (_popoutInitialized) return;
  _popoutInitialized = true;

  const panel  = document.getElementById("aud-popout-panel");
  const header = document.getElementById("aud-popout-header");
  if (!panel || !header) return;

  document.getElementById("btn-aud-popout-close").addEventListener("click", () => {
    panel.classList.add("hidden");
    _popoutMaximized = false;
  });

  document.getElementById("btn-aud-popout-maximize").addEventListener("click", _popoutToggleMaximize);

  // Drag — mousedown on header (not buttons)
  header.addEventListener("mousedown", (e) => {
    if (e.target.closest("button") || _popoutMaximized) return;
    _popDragging = true;
    const r = panel.getBoundingClientRect();
    _popDragOffX = e.clientX - r.left;
    _popDragOffY = e.clientY - r.top;
    panel.style.left  = r.left + "px";
    panel.style.top   = r.top  + "px";
    panel.style.right = "auto";
    header.style.cursor = "grabbing";
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!_popDragging) return;
    const newTop = e.clientY - _popDragOffY;
    panel.style.left = (e.clientX - _popDragOffX) + "px";
    panel.style.top  = Math.max(0, newTop) + "px";
    // Snap-to-top glow hint
    panel.style.outline = (newTop < 8) ? "2px solid var(--color-primary)" : "";
  });

  document.addEventListener("mouseup", (e) => {
    if (!_popDragging) return;
    _popDragging = false;
    header.style.cursor = "grab";
    panel.style.outline = "";
    // Snap maximize when released at very top of screen
    if ((e.clientY - _popDragOffY) < 8) _popoutToggleMaximize();
  });
}

function openAudiencePopout(audId) {
  const aud   = state.audienceLists.find(x => x.id === audId);
  const panel = document.getElementById("aud-popout-panel");
  if (!aud || !panel) return;

  // Wire buttons once
  _initPopout();

  // Populate header
  document.getElementById("aud-popout-title").textContent = aud.name;
  document.getElementById("aud-popout-size").textContent =
    `${(aud.prospectIds || []).length} contacts`;
  document.getElementById("btn-aud-popout-maximize").textContent =
    _popoutMaximized ? "⊡" : "⛶";

  // Populate contacts table
  const tbody = document.getElementById("aud-popout-contacts-body");
  tbody.innerHTML = "";
  const ids = aud.prospectIds || [];
  if (ids.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--color-text-muted);padding:24px;">No contacts in this list.</td></tr>`;
  } else {
    ids.forEach(pid => {
      const p = state.prospects.find(x => x.id === pid);
      if (!p) return;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><button class="text-btn" style="font-weight:600;text-align:left;">${escapeHTML(p.firstName)} ${escapeHTML(p.lastName)}</button></td>
        <td>${escapeHTML(p.title || "—")}</td>
        <td><button class="text-btn" style="text-align:left;color:var(--color-text-main);">${escapeHTML(getCompanyName(p.companyId) || "—")}</button></td>
        <td style="text-align:center;"><button class="delete-interaction-btn" title="Remove from list">✕</button></td>
      `;
      const [nameBtn, compBtn, removeBtn] = tr.querySelectorAll("button");
      nameBtn.addEventListener("click", () => openProspectModal(p.id));
      if (p.companyId) {
        compBtn.addEventListener("click", () => openCompanyModal(p.companyId));
      } else {
        compBtn.disabled = true;
        compBtn.style.cursor = "default";
      }
      removeBtn.addEventListener("click", () => {
        removeContactFromAudienceList(audId, p.id);
        openAudiencePopout(audId);
      });
      tbody.appendChild(tr);
    });
  }

  panel.classList.remove("hidden");
}

/* --------------------------------------------------------------------------
   Audience CSV Import
   Upload a CSV/Excel exported from the Prospect Hub and build a new audience
   directly from the contact IDs in that file — no re-matching against the
   database, since these files are assumed to always originate from Vantage's
   own Prospect Hub export. Any row whose ID no longer exists (e.g. the
   contact was deleted since export) is silently skipped and reflected in the
   summary count.
   -------------------------------------------------------------------------- */

// Converts raw parsed rows (rows[0] = headers) into plain objects keyed by
// the original header text plus normalized variants (lowercase, no spaces,
// alnum-only) so lookups are tolerant of header formatting differences.
function csvRowsToObjects(rows) {
  if (!rows || rows.length <= 1) return [];
  const headers = rows[0].map(h => (h || "").toString());
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.length === 0 || cols.every(c => !c?.toString().trim())) continue;
    const obj = {};
    headers.forEach((header, idx) => {
      let cleanHeader = header.trim();
      if (cleanHeader.charCodeAt(0) === 0xFEFF) cleanHeader = cleanHeader.slice(1); // strip UTF-8 BOM if present
      if (!cleanHeader) return;
      const val = cols[idx]?.toString().trim() || "";
      obj[cleanHeader] = val;
      obj[cleanHeader.toLowerCase()] = val;
      obj[cleanHeader.toLowerCase().replace(/\s+/g, "")] = val;
      obj[cleanHeader.toLowerCase().replace(/[^a-z0-9]/g, "")] = val;
    });
    out.push(obj);
  }
  return out;
}

function csvRowLookup(row, keys) {
  for (const key of keys) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (row[cleanKey] !== undefined && row[cleanKey] !== "") return row[cleanKey];
  }
  return "";
}

function openAudienceImportModal() {
  pendingAudienceImport = null;
  document.getElementById("audience-import-name").value = "";
  const tagNewEl = document.getElementById("audience-import-tag-new");
  if (tagNewEl) tagNewEl.value = "";
  const tagSelectEl = document.getElementById("audience-import-tag-select");
  if (tagSelectEl) tagSelectEl.value = "";
  const fileInput = document.getElementById("audience-import-file-input");
  if (fileInput) fileInput.value = "";
  document.getElementById("modal-audience-import").classList.remove("hidden");
  showAudienceImportUploadStep();
}

function closeAudienceImportModal() {
  document.getElementById("modal-audience-import").classList.add("hidden");
  pendingAudienceImport = null;
}

function showAudienceImportUploadStep() {
  document.getElementById("audience-import-upload-section").classList.remove("hidden");
  document.getElementById("audience-import-review-section").classList.add("hidden");
}

function showAudienceImportReviewStep() {
  document.getElementById("audience-import-upload-section").classList.add("hidden");
  document.getElementById("audience-import-review-section").classList.remove("hidden");
}

function handleAudienceCSVFiles(files) {
  const file = files && files[0];
  if (!file) return;
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        if (workbook.SheetNames.length === 0) {
          alert("No sheets found in that Excel file.");
          return;
        }
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        processAudienceImportRows(rows);
      } catch (err) {
        alert("Error parsing Excel file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const rows = parseCSV(evt.target.result);
      processAudienceImportRows(rows);
    };
    reader.readAsText(file);
  }
}

// Reads contact IDs straight out of the CSV's "ID" column (the column
// Vantage's own Prospect Hub export always includes) and builds the review
// list from whichever of those IDs still exist in the database.
function processAudienceImportRows(rows) {
  const objects = csvRowsToObjects(rows);
  if (objects.length === 0) {
    alert("No contact rows found in that file.");
    return;
  }

  const prospectIds = [];
  let skipped = 0;

  objects.forEach(row => {
    const id = csvRowLookup(row, ["id", "prospect id", "prospectid"]);
    const exists = id && state.prospects.some(p => p.id === id);
    if (exists) {
      if (!prospectIds.includes(id)) prospectIds.push(id);
    } else {
      skipped++;
    }
  });

  if (prospectIds.length === 0) {
    alert("No valid Vantage contact IDs were found in that file. Make sure it's a CSV exported from the Prospect Hub.");
    return;
  }

  // Detect which prospects are already in other active audience lists
  const duplicateInAudience = new Set();
  state.audienceLists.forEach(al => {
    (al.prospectIds || []).forEach(pid => {
      if (prospectIds.includes(pid)) duplicateInAudience.add(pid);
    });
  });

  pendingAudienceImport = { prospectIds, skipped, duplicateInAudience };
  showAudienceImportReviewStep();
  populateAudienceImportTagDropdown();
  renderAudienceImportReview();
}

function populateAudienceImportTagDropdown() {
  const sel = document.getElementById("audience-import-tag-select");
  if (!sel) return;
  sel.innerHTML = `<option value="">-- No tag --</option>`;
  (state.prospect_tags || []).forEach(tag => {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    sel.appendChild(opt);
  });
}

function renderAudienceImportReview() {
  if (!pendingAudienceImport) return;
  const { prospectIds, skipped, duplicateInAudience } = pendingAudienceImport;
  const dupSet = duplicateInAudience || new Set();

  const dupCount = [...prospectIds].filter(pid => dupSet.has(pid)).length;

  document.getElementById("audience-import-summary").textContent =
    `${prospectIds.length} contact${prospectIds.length === 1 ? "" : "s"} found` +
    (skipped > 0 ? ` · ${skipped} row${skipped === 1 ? "" : "s"} skipped (no longer in Vantage)` : "");

  const dupNotice = document.getElementById("audience-import-duplicates-notice");
  if (dupNotice) {
    if (dupCount > 0) {
      dupNotice.textContent = `⚠️ ${dupCount} contact${dupCount === 1 ? " is" : "s are"} already in one or more existing audience lists (marked below). You can still include them.`;
      dupNotice.classList.remove("hidden");
    } else {
      dupNotice.classList.add("hidden");
    }
  }

  const body = document.getElementById("audience-import-matched-body");
  body.innerHTML = "";
  if (prospectIds.length === 0) {
    body.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--color-text-muted);padding:12px;">No contacts left — choose a different file.</td></tr>`;
  } else {
    prospectIds.forEach(pid => {
      const p = state.prospects.find(x => x.id === pid);
      if (!p) return;
      const isDup = dupSet.has(pid);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <strong>${escapeHTML(p.firstName)} ${escapeHTML(p.lastName)}</strong>
          ${isDup ? `<span style="margin-left:6px; font-size:10px; background:rgba(251,191,36,0.2); color:#d97706; padding:1px 5px; border-radius:10px;">already in audience</span>` : ""}
        </td>
        <td>${escapeHTML(getCompanyName(p.companyId) || "—")}</td>
        <td style="text-align:center;"><button class="delete-interaction-btn btn-aud-import-exclude" title="Exclude from this audience">✕</button></td>
      `;
      tr.querySelector(".btn-aud-import-exclude").addEventListener("click", () => {
        pendingAudienceImport.prospectIds = pendingAudienceImport.prospectIds.filter(id => id !== pid);
        renderAudienceImportReview();
      });
      body.appendChild(tr);
    });
  }
}

function saveAudienceImport() {
  if (!pendingAudienceImport) {
    alert("Please upload a CSV file first.");
    return;
  }

  const nameInput = document.getElementById("audience-import-name");
  const name = nameInput.value.trim();
  if (!name) { alert("Please enter a name for this audience."); return; }

  const duplicate = state.audienceLists.some(a => a.name.toLowerCase() === name.toLowerCase());
  if (duplicate) { alert("An audience list with this name already exists."); return; }

  const prospectIds = [...pendingAudienceImport.prospectIds];
  if (prospectIds.length === 0) { alert("No contacts to save."); return; }

  // Resolve tag to apply
  const tagSelectEl = document.getElementById("audience-import-tag-select");
  const tagNewEl = document.getElementById("audience-import-tag-new");
  let applyTag = (tagNewEl && tagNewEl.value.trim()) || (tagSelectEl && tagSelectEl.value) || "";
  if (applyTag) {
    applyTag = applyTag.trim();
    if (!state.prospect_tags) state.prospect_tags = [];
    if (!state.prospect_tags.includes(applyTag)) state.prospect_tags.push(applyTag);
    prospectIds.forEach(pid => {
      const p = state.prospects.find(x => x.id === pid);
      if (p) {
        if (!p.tags) p.tags = [];
        if (!p.tags.includes(applyTag)) p.tags.push(applyTag);
      }
    });
  }

  const audId = `aud-${Date.now()}`;
  state.audienceLists.push({ id: audId, name, prospectIds, status: "active", notes: "" });
  addAudienceTagToProspects(prospectIds, name);

  saveState();
  closeAudienceImportModal();

  campaignViewSubState = "audiences";
  selectedAudienceListId = audId;
  renderCampaignsView();

  alert(`Created audience "${name}" with ${prospectIds.length} contact${prospectIds.length === 1 ? "" : "s"}!`);
}

function renderCampaignQueryView() {
  // Populate Exclude Campaign Dropdown
  const excludeSelect = document.getElementById("query-exclude-campaign");
  if (excludeSelect) {
    excludeSelect.innerHTML = `<option value="none">-- Don't exclude any --</option>`;
    state.campaigns.forEach(c => {
      excludeSelect.innerHTML += `<option value="${c.id}">${escapeHTML(c.title)}</option>`;
    });
  }

  // Populate Add to Existing List select
  const existingSelect = document.getElementById("query-add-existing-select");
  if (existingSelect) {
    existingSelect.innerHTML = `<option value="">-- Select Audience List --</option>`;
    state.audienceLists.forEach(al => {
      existingSelect.innerHTML += `<option value="${al.id}">${escapeHTML(al.name)}</option>`;
    });
  }

  runCampaignQuery();
}

function runCampaignQuery() {
  const compQuery = document.getElementById("query-company").value.toLowerCase().trim();
  const rawTitleQuery = document.getElementById("query-title").value;
  const titleTerms = rawTitleQuery.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  
  const seniorityQuery = document.getElementById("query-seniority").value;
  const rawGeoQuery = document.getElementById("query-geography").value;
  const geoTerms = rawGeoQuery.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  
  const prospectTagsQuery = document.getElementById("query-prospect-tags").value.toLowerCase().trim();
  const companyTagsQuery = document.getElementById("query-company-tags").value.toLowerCase().trim();
  const selectedEmployeeRanges = Array.from(document.querySelectorAll(".query-employee-range:checked")).map(cb => cb.value);
  const excludeCampId = document.getElementById("query-exclude-campaign").value;

  let excludeProspectIds = new Set();
  if (excludeCampId !== "none") {
    const excludeCamp = state.campaigns.find(x => x.id === excludeCampId);
    if (excludeCamp && excludeCamp.audienceListId) {
      const al = state.audienceLists.find(x => x.id === excludeCamp.audienceListId);
      if (al && al.prospectIds) {
        al.prospectIds.forEach(id => excludeProspectIds.add(id));
      }
    }
  }

  const matched = state.prospects.filter(p => {
    if (excludeProspectIds.has(p.id)) return false;
    
    if (compQuery) {
      const cName = getCompanyName(p.companyId).toLowerCase();
      if (!cName.includes(compQuery)) return false;
    }
    
    if (titleTerms.length > 0) {
      const pTitle = (p.title || "").toLowerCase();
      const normTitle = normalizeTitle(pTitle);
      const matchTitle = titleTerms.some(term => {
        const normTerm = normalizeTitle(term);
        return pTitle.includes(term) || normTitle.includes(normTerm);
      });
      if (!matchTitle) return false;
    }
    
    if (seniorityQuery !== "any" && p.seniority !== seniorityQuery) return false;
    
    if (geoTerms.length > 0) {
      const loc = (p.location || "").toLowerCase();
      let city = (p.city || "").toLowerCase();
      let stateStr = (p.state || "").toLowerCase();
      if (!city && !stateStr && loc.includes(",")) {
        const parts = loc.split(",").map(s => s.trim());
        if (parts.length === 2) {
          city = parts[0];
          stateStr = parts[1];
        }
      }
      const matchGeo = geoTerms.some(term => {
        return (term.length === 2) 
          ? (stateStr === term)
          : (loc.includes(term) || city.includes(term) || stateStr.includes(term));
      });
      if (!matchGeo) return false;
    }
    
    if (prospectTagsQuery) {
      const tags = (p.tags || []).join(" ").toLowerCase();
      if (!tags.includes(prospectTagsQuery)) return false;
    }
    
    if (companyTagsQuery) {
      const comp = state.companies.find(x => x.id === p.companyId);
      const cTags = comp && comp.tags ? comp.tags.join(" ").toLowerCase() : "";
      if (!cTags.includes(companyTagsQuery)) return false;
    }

    if (selectedEmployeeRanges.length > 0) {
      const comp = state.companies.find(x => x.id === p.companyId);
      const empNum = comp ? parseInt(comp.employees || "0", 10) : 0;
      let bucket = "";
      if (empNum > 0) {
        if (empNum <= 10) bucket = "1-10";
        else if (empNum <= 50) bucket = "11-50";
        else if (empNum <= 200) bucket = "51-200";
        else if (empNum <= 500) bucket = "201-500";
        else bucket = ">500";
      }
      if (!selectedEmployeeRanges.includes(bucket)) return false;
    }

    return true;
  });

  const checkScroller = document.getElementById("query-contacts-checkboxes");
  const countBadge = document.getElementById("query-matched-count");
  
  if (checkScroller) {
    checkScroller.innerHTML = "";
    countBadge.textContent = `${matched.length} Matches`;
    
    if (matched.length === 0) {
      checkScroller.innerHTML = `<div style="text-align:center;padding:16px;font-size:12px;color:var(--color-text-muted);">No contacts match the query.</div>`;
    } else {
      matched.forEach(p => {
        const div = document.createElement("div");
        div.className = "checkbox-row";
        div.innerHTML = `
          <input type="checkbox" id="chk-query-pros-${p.id}" value="${p.id}">
          <label for="chk-query-pros-${p.id}" style="cursor:pointer; flex:1;">
            <strong>${escapeHTML(p.firstName)} ${escapeHTML(p.lastName)}</strong> — ${escapeHTML(p.title || "—")} (${escapeHTML(getCompanyName(p.companyId))})
          </label>
        `;
        checkScroller.appendChild(div);
      });
    }
  }
}

function getSelectedQueryContacts() {
  const checked = document.querySelectorAll("#query-contacts-checkboxes input[type='checkbox']:checked");
  return Array.from(checked).map(c => c.value);
}

function addQueryContactsToExistingList() {
  const pids = getSelectedQueryContacts();
  if (pids.length === 0) { alert("Please select at least one contact."); return; }

  const listId = document.getElementById("query-add-existing-select").value;
  if (!listId) { alert("Please select an existing audience list."); return; }

  const aud = state.audienceLists.find(x => x.id === listId);
  if (!aud) return;

  if (!aud.prospectIds) aud.prospectIds = [];
  let addedCount = 0;
  pids.forEach(id => {
    if (!aud.prospectIds.includes(id)) {
      aud.prospectIds.push(id);
      addedCount++;
    }
  });
  addAudienceTagToProspects(pids, aud.name);

  saveState();
  alert(`Added ${addedCount} new contacts to audience list "${aud.name}"!`);
  // Uncheck all
  document.querySelectorAll("#query-contacts-checkboxes input[type='checkbox']").forEach(c => c.checked = false);
}

function createListFromQueryContacts() {
  const pids = getSelectedQueryContacts();
  if (pids.length === 0) { alert("Please select at least one contact."); return; }

  const nameInput = document.getElementById("query-new-list-name");
  const name = nameInput.value.trim();
  if (!name) { alert("Please enter a name for the new audience list."); return; }

  const duplicate = state.audienceLists.some(a => a.name.toLowerCase() === name.toLowerCase());
  if (duplicate) { alert("An audience list with this name already exists."); return; }

  const audId = `aud-${Date.now()}`;
  state.audienceLists.push({
    id: audId,
    name: name,
    prospectIds: pids,
    status: "active"
  });
  addAudienceTagToProspects(pids, name);

  saveState();
  nameInput.value = "";
  alert(`Created audience list "${name}" with ${pids.length} contacts!`);
  // Uncheck all
  document.querySelectorAll("#query-contacts-checkboxes input[type='checkbox']").forEach(c => c.checked = false);
  
  // Go to audiences tab
  campaignViewSubState = "audiences";
  selectedAudienceListId = audId;
  renderCampaignsView();
}

function clearCampaignQueryFilters() {
  document.getElementById("query-company").value = "";
  document.getElementById("query-title").value = "";
  document.getElementById("query-seniority").value = "any";
  document.getElementById("query-geography").value = "";
  document.getElementById("query-prospect-tags").value = "";
  document.getElementById("query-company-tags").value = "";
  document.querySelectorAll(".query-employee-range").forEach(cb => cb.checked = false);
  document.getElementById("query-exclude-campaign").value = "none";
  runCampaignQuery();
}

function normalizeTitle(title) {
  if (!title) return "";
  let t = title.toLowerCase();
  t = t.replace(/\bsr\.?\b/g, "senior");
  t = t.replace(/\bjr\.?\b/g, "junior");
  t = t.replace(/\bvp\b/g, "vice president");
  t = t.replace(/\bdir\.?\b/g, "director");
  t = t.replace(/\bmgr\.?\b/g, "manager");
  t = t.replace(/\bexec\.?\b/g, "executive");
  t = t.replace(/\badmin\.?\b/g, "administrator");
  t = t.replace(/\bassoc\.?\b/g, "associate");
  t = t.replace(/\bceo\b/g, "chief executive officer");
  t = t.replace(/\bcto\b/g, "chief technology officer");
  t = t.replace(/\bcmo\b/g, "chief marketing officer");
  t = t.replace(/\bcfo\b/g, "chief financial officer");
  t = t.replace(/\bcoo\b/g, "chief operating officer");
  t = t.replace(/\bcio\b/g, "chief information officer");
  t = t.replace(/\bciso\b/g, "chief information security officer");
  t = t.replace(/\bchro\b/g, "chief human resources officer");
  t = t.replace(/\bcpo\b/g, "chief product officer");
  t = t.replace(/\bcro\b/g, "chief revenue officer");
  t = t.replace(/\bhr\b/g, "human resources");
  t = t.replace(/\bpres\.?\b/g, "president");
  return t;
}

// Smart title matching: combines plain substring search with normalizeTitle's
// abbreviation expansion (both sides normalized the same way) so e.g. "VP"
// finds "Vice President", "Executive Vice President", "Senior VP", etc., and
// searching "Chief Executive Officer" finds records stored as just "CEO".
// Also supports the same AND/OR boolean syntax as other Advanced Query text
// fields (splitBooleanQuery), so "VP OR Director" and "VP AND Sales" work.
function matchesTitleFilter(fieldVal, filterVal) {
  if (!filterVal) return true;
  const val = (fieldVal || "").toString().toLowerCase();
  const normVal = normalizeTitle(val);
  const orGroups = splitBooleanQuery(filterVal);
  if (orGroups.length === 0) return true;
  return orGroups.some(andTerms => andTerms.every(term => {
    const t = term.toLowerCase();
    return val.includes(t) || normVal.includes(normalizeTitle(t));
  }));
}


/* ==========================================================================
   🛠️ CRUD STATE OPERATORS & HANDLERS
   ========================================================================== */

// Prospects CRUD
function openProspectModal(id = null) {
  const modal = document.getElementById("modal-prospect");
  const title = document.getElementById("prospect-modal-title");
  
  editingProspectId = id;
  
  if (id) {
    title.textContent = "Edit Prospect Details";
    const p = state.prospects.find(x => x.id === id);
    if (p) {
      document.getElementById("pros-first-name").value = p.firstName || "";
      document.getElementById("pros-last-name").value = p.lastName || "";
      document.getElementById("pros-email").value = p.email || "";
      document.getElementById("pros-phone").value = p.phone || "";
      document.getElementById("pros-title").value = p.title || "";
      document.getElementById("pros-seniority").value = p.seniority || "Individual Contributor";
      document.getElementById("pros-company").value = getCompanyName(p.companyId) || "";
      document.getElementById("pros-city").value = p.city || "";
      document.getElementById("pros-state").value = p.state || "";
      document.getElementById("pros-location").value = p.location || "";
      document.getElementById("pros-notes").value = p.notes || "";
      document.getElementById("pros-linkedin").value = p.linkedin || "";
      document.getElementById("pros-conference-name").value = p.conferenceName || "";
      document.getElementById("pros-conference-start").value = p.conferenceStart || "";
      document.getElementById("pros-conference-end").value = p.conferenceEnd || "";
      document.getElementById("pros-conference-venue").value = p.conferenceVenue || "";
      currentProspectTags = p.tags ? [...p.tags] : [];
      
      const btnEditComp = document.getElementById("btn-pros-edit-company");
      if (p.companyId) {
        btnEditComp.classList.remove("hidden");
        btnEditComp.dataset.compId = p.companyId;
      } else {
        btnEditComp.classList.add("hidden");
      }
    }
  } else {
    title.textContent = "Add New Prospect";
    document.getElementById("pros-first-name").value = "";
    document.getElementById("pros-last-name").value = "";
    document.getElementById("pros-email").value = "";
    document.getElementById("pros-phone").value = "";
    document.getElementById("pros-title").value = "";
    document.getElementById("pros-seniority").value = "Individual Contributor";
    document.getElementById("pros-company").value = "";
    document.getElementById("pros-city").value = "";
    document.getElementById("pros-state").value = "";
    document.getElementById("pros-location").value = "";
    document.getElementById("pros-notes").value = "";
    document.getElementById("pros-linkedin").value = "";
    document.getElementById("pros-conference-name").value = "";
    document.getElementById("pros-conference-start").value = "";
    document.getElementById("pros-conference-end").value = "";
    document.getElementById("pros-conference-venue").value = "";
    currentProspectTags = [];
    document.getElementById("btn-pros-edit-company").classList.add("hidden");
  }
  
  renderProspectTagsPreview();
  modal.classList.remove("hidden");
}

function saveProspect() {
  const first = document.getElementById("pros-first-name").value.trim();
  const last = document.getElementById("pros-last-name").value.trim();
  const email = document.getElementById("pros-email").value.trim();
  const phone = document.getElementById("pros-phone").value.trim();
  const linkedinVal = document.getElementById("pros-linkedin").value.trim();
  const titleVal = document.getElementById("pros-title").value.trim();
  const seniorityVal = document.getElementById("pros-seniority").value;
  const compVal = document.getElementById("pros-company").value.trim();
  const city = document.getElementById("pros-city").value.trim();
  const stateVal = document.getElementById("pros-state").value.trim();
  const loc = document.getElementById("pros-location").value.trim();
  const notesVal = document.getElementById("pros-notes").value.trim();
  const conferenceNameVal = document.getElementById("pros-conference-name").value.trim();
  const conferenceStartVal = document.getElementById("pros-conference-start").value.trim();
  const conferenceEndVal = document.getElementById("pros-conference-end").value.trim();
  const conferenceVenueVal = document.getElementById("pros-conference-venue").value.trim();

  if (!first || !last || !email) {
    alert("First Name, Last Name, and Email are required!");
    return;
  }

  // Handle company allocation dynamically
  let compId = "";
  if (compVal) {
    let comp = state.companies.find(c => c.name.toLowerCase() === compVal.toLowerCase());
    if (!comp) {
      compId = `comp-${Date.now()}`;
      state.companies.push({
        id: compId,
        name: compVal,
        domain: email.split("@")[1] || "domain.com",
        location: loc || "Unknown",
        industry: "General",
        address: "",
        phone: "",
        website: "",
        linkedin: "",
        tags: [],
        employees: "",
        employeeRange: "",
        description: "",
        specialities: "",
        headquarters: ""
      });
    } else {
      compId = comp.id;
    }
  }

  if (editingProspectId) {
    const p = state.prospects.find(x => x.id === editingProspectId);
    if (p) {
      p.firstName = first;
      p.lastName = last;
      p.email = email;
      p.phone = phone;
      p.linkedin = linkedinVal;
      p.title = titleVal;
      p.seniority = seniorityVal;
      p.companyId = compId;
      p.city = city;
      p.state = stateVal;
      p.location = loc;
      p.notes = notesVal;
      p.conferenceName = conferenceNameVal;
      p.conferenceStart = conferenceStartVal;
      p.conferenceEnd = conferenceEndVal;
      p.conferenceVenue = conferenceVenueVal;
      p.tags = currentProspectTags.length ? [...currentProspectTags] : ["No Prospect Tag"];
    }
  } else {
    const newP = {
      id: `pros-${Date.now()}`,
      firstName: first,
      lastName: last,
      email: email,
      phone: phone,
      linkedin: linkedinVal,
      title: titleVal,
      seniority: seniorityVal,
      companyId: compId,
      city: city,
      state: stateVal,
      location: loc,
      notes: notesVal,
      conferenceName: conferenceNameVal,
      conferenceStart: conferenceStartVal,
      conferenceEnd: conferenceEndVal,
      conferenceVenue: conferenceVenueVal,
      tags: currentProspectTags.length ? [...currentProspectTags] : ["No Prospect Tag"],
      history: []
    };
    state.prospects.push(newP);
    state.selectedProspectId = newP.id;
  }

  saveState();
  document.getElementById("modal-prospect").classList.add("hidden");
  renderProspectsView();
  refreshAqAfterEdit();
}

function deleteProspect() {
  if (!state.selectedProspectId) return;
  const p = state.prospects.find(x => x.id === state.selectedProspectId);
  const ok = confirm(`Are you sure you want to permanently delete contact ${p.firstName} ${p.lastName}?`);
  if (!ok) return;

  const deletedId = state.selectedProspectId;
  state.prospects = state.prospects.filter(x => x.id !== deletedId);
  state.selectedProspectId = null;
  // A deleted record needs to disappear from any open Advanced Query results
  // too — those aren't re-filtered from state until the next Run Query, so
  // without this the row would keep showing (just with a closed drawer).
  aqResults = aqResults.filter(x => x.id !== deletedId);
  aqSelectedIds.delete(deletedId);
  if (aqInspectorRecordId === deletedId) closeAqInspectorDrawer();
  saveState();
  renderProspectsView();
  refreshAqAfterEdit();
}

function deleteCompany() {
  if (!selectedCompanyId) return;
  const c = state.companies.find(x => x.id === selectedCompanyId);
  if (!c) return;
  const ok = confirm(`Are you sure you want to permanently delete company ${c.name}? Associated contacts will be unassigned.`);
  if (!ok) return;

  const deletedId = selectedCompanyId;
  state.companies = state.companies.filter(x => x.id !== deletedId);
  state.prospects.forEach(p => {
    if (p.companyId === deletedId) {
      p.companyId = "";
    }
  });
  selectedCompanyId = null;
  aqResults = aqResults.filter(x => x.id !== deletedId);
  aqSelectedIds.delete(deletedId);
  if (aqInspectorRecordId === deletedId) closeAqInspectorDrawer();
  saveState();
  renderProspectsView();
  refreshAqAfterEdit();
}

// Company CRUD
let editingCompanyId = null;

function openCompanyModal(compId) {
  const modal = document.getElementById("modal-company");
  const c = state.companies.find(x => x.id === compId);
  if (!c) {
    alert("Please save the prospect first to create the company record.");
    return;
  }
  
  editingCompanyId = compId;
  document.getElementById("comp-name").value = c.name || "";
  document.getElementById("comp-address").value = c.address || "";
  document.getElementById("comp-city").value = c.city || "";
  document.getElementById("comp-state").value = c.state || "";
  document.getElementById("comp-postal").value = c.postal || "";
  document.getElementById("comp-notes").value = c.notes || "";
  document.getElementById("comp-phone").value = c.phone || "";
  document.getElementById("comp-website").value = c.website || "";
  document.getElementById("comp-linkedin").value = c.linkedin || "";
  document.getElementById("comp-industry").value = c.industry || "";
  document.getElementById("comp-employees").value = c.employees || "";
  document.getElementById("comp-description").value = c.description || "";
  document.getElementById("comp-specialities").value = c.specialities || "";
  document.getElementById("comp-hq").value = c.headquarters || c.location || "";
  currentCompanyTags = c.tags ? [...c.tags] : [];
  
  renderCompanyTagsPreview();
  modal.classList.remove("hidden");
}

function saveCompany() {
  if (!editingCompanyId) return;
  const c = state.companies.find(x => x.id === editingCompanyId);
  if (c) {
    c.name = document.getElementById("comp-name").value.trim();
    c.address = document.getElementById("comp-address").value.trim();
    c.city = document.getElementById("comp-city").value.trim();
    c.state = document.getElementById("comp-state").value.trim();
    c.postal = document.getElementById("comp-postal").value.trim();
    c.location = document.getElementById("comp-hq").value.trim() || [c.city, c.state].filter(Boolean).join(", ");
    c.notes = document.getElementById("comp-notes").value.trim();
    c.phone = document.getElementById("comp-phone").value.trim();
    c.website = document.getElementById("comp-website").value.trim();
    c.linkedin = document.getElementById("comp-linkedin").value.trim();
    c.industry = document.getElementById("comp-industry").value.trim() || "General";
    c.employees = document.getElementById("comp-employees").value.trim();
    c.description = document.getElementById("comp-description").value.trim();
    c.specialities = document.getElementById("comp-specialities").value.trim();
    c.headquarters = document.getElementById("comp-hq").value.trim();
    c.tags = currentCompanyTags.length ? [...currentCompanyTags] : ["No Company Tag"];
    saveState();
    
    // Update the prospect form company field just in case name changed
    document.getElementById("pros-company").value = c.name;
    document.getElementById("modal-company").classList.add("hidden");
    renderProspectsView();
    refreshAqAfterEdit();
  }
}

// Interaction Logs Table Actions
function openInteractionModal() {
  if (!state.selectedProspectId) return;
  document.getElementById("int-date").value = new Date().toISOString().split("T")[0];
  
  // Only real contact types are offered here. The auto-stamped types stay
  // registered in state.reachoutTypes — removing one would change what CSV
  // restore does — but hand-logging "Task Completed" or "Added to Vantage"
  // as a reachout is never the intent, so they are filtered out of the list.
  const selectable = (state.reachoutTypes || []).filter(t => !NON_REACHOUT_TYPES.includes(t));
  const typeSelect = document.getElementById("int-type");
  typeSelect.innerHTML = "";
  selectable.forEach(t => {
    typeSelect.innerHTML += `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`;
  });

  document.getElementById("int-type").value = selectable[0] || "";
  document.getElementById("int-content").value = "";
  document.getElementById("modal-interaction").classList.remove("hidden");
}

function recordInteraction() {
  const date = document.getElementById("int-date").value;
  const type = document.getElementById("int-type").value;
  const content = document.getElementById("int-content").value.trim();

  if (!date || !content) {
    alert("Please select a date and enter reachout logs content!");
    return;
  }

  const p = state.prospects.find(x => x.id === state.selectedProspectId);
  if (p) {
    if (!p.history) p.history = [];
    p.history.push({
      id: `hist-${Date.now()}`,
      date,
      type,
      content
    });
    saveState();
  }

  document.getElementById("modal-interaction").classList.add("hidden");
  renderProspectsView();
  refreshAqAfterEdit();
}

function deleteInteraction(prosId, histId) {
  const p = state.prospects.find(x => x.id === prosId);
  if (p && p.history) {
    p.history = p.history.filter(h => h.id !== histId);
    saveState();
    renderProspectsView();
    refreshAqAfterEdit();
  }
}

// Media Cards CRUD

function deleteMedia(id) {
  const ok = confirm("Delete this media content outline permanently?");
  if (!ok) return;
  state.media = state.media.filter(x => x.id !== id);
  saveState();
  renderMediaView();
}

// Campaign Creator Modal Logic
function openCreateCampaignModal(id = null) {
  editingCampaignId = id;
  const modal = document.getElementById("modal-create-campaign");
  const title = document.getElementById("campaign-modal-title");

  // Populate Audience List dropdown
  const audSelect = document.getElementById("new-campaign-audience-list");
  if (audSelect) {
    audSelect.innerHTML = `<option value="">-- Select Audience List --</option>`;
    state.audienceLists.forEach(al => {
      audSelect.innerHTML += `<option value="${al.id}">${escapeHTML(al.name)}</option>`;
    });
  }

  // Populate media select — Sequence Media only makes sense as a "Sequence"
  // type piece of content, and shouldn't offer content that's been archived.
  const mediaSelect = document.getElementById("new-campaign-media");
  if (mediaSelect) {
    mediaSelect.innerHTML = `<option value="">-- Choose Finished content sequence --</option>`;
    state.media
      .filter(m => m.type === "Sequence" && m.status !== "Archive")
      .forEach(m => {
        mediaSelect.innerHTML += `<option value="${m.id}">${escapeHTML(m.title)}</option>`;
      });
  }

  if (id) {
    title.textContent = "Edit Campaign";
    const c = state.campaigns.find(x => x.id === id);
    if (c) {
      document.getElementById("new-campaign-title").value = c.title || "";
      document.getElementById("new-campaign-audience").value = c.intendedAudience || "";
      document.getElementById("new-campaign-goal").value = c.goalSummary || "";
      document.getElementById("new-campaign-audience-list").value = c.audienceListId || "";
      document.getElementById("new-campaign-media").value = c.sequenceMediaId || "";
      currentCampaignTags = c.tags ? [...c.tags] : [];
    }
  } else {
    title.textContent = "Create New Campaign";
    document.getElementById("new-campaign-title").value = "";
    document.getElementById("new-campaign-audience").value = "";
    document.getElementById("new-campaign-goal").value = "";
    document.getElementById("new-campaign-audience-list").value = "";
    document.getElementById("new-campaign-media").value = "";
    currentCampaignTags = [];
  }

  renderCampaignTagsPreview();
  modal.classList.remove("hidden");
}

function saveNewCampaign() {
  const title = document.getElementById("new-campaign-title").value.trim();
  const intendedAudience = document.getElementById("new-campaign-audience").value.trim();
  const goalSummary = document.getElementById("new-campaign-goal").value.trim();
  const audienceListId = document.getElementById("new-campaign-audience-list").value;
  const mediaId = document.getElementById("new-campaign-media").value;

  if (!title) {
    alert("Please provide a Campaign Name!");
    return;
  }

  if (editingCampaignId) {
    const c = state.campaigns.find(x => x.id === editingCampaignId);
    if (c) {
      const oldStatus = c.status;
      c.title = title;
      c.intendedAudience = intendedAudience;
      c.goalSummary = goalSummary;
      c.audienceListId = audienceListId;
      c.sequenceMediaId = mediaId;
      c.tags = [...currentCampaignTags];
      
      if (c.status === "Launch" && oldStatus !== "Launch") {
        c.launchDate = new Date().toISOString().split("T")[0];
        recordCampaignLaunchInteractions(c);
      }
    }
  } else {
    const defaultPhase = state.campaignPhases[0] || "Development";
    const newCamp = {
      id: `camp-${Date.now()}`,
      title,
      intendedAudience,
      goalSummary,
      audienceListId,
      sequenceMediaId: mediaId,
      launchDate: "",
      status: defaultPhase,
      tags: [...currentCampaignTags]
    };
    
    state.campaigns.push(newCamp);
    if (defaultPhase === "Launch") {
      newCamp.launchDate = new Date().toISOString().split("T")[0];
      recordCampaignLaunchInteractions(newCamp);
    }
  }

  currentCampaignTags = [];
  saveState();
  
  document.getElementById("modal-create-campaign").classList.add("hidden");
  editingCampaignId = null;

  renderCampaignsView();
}

function recordCampaignLaunchInteractions(c) {
  const al = state.audienceLists.find(x => x.id === c.audienceListId);
  if (!al || !al.prospectIds) return;

  state.prospects.forEach(p => {
    if (al.prospectIds.includes(p.id)) {
      if (!p.history) p.history = [];
      p.history.push({
        id: `hist-${Date.now()}-${p.id}`,
        date: c.launchDate || new Date().toISOString().split("T")[0],
        type: "Campaign",
        content: `Launched outreach sequence: ${c.title} (${getMediaTitle(c.sequenceMediaId)})`
      });
    }
  });
}

function deleteCampaign(id) {
  const ok = confirm("Remove this campaign program record from history?");
  if (!ok) return;
  state.campaigns = state.campaigns.filter(x => x.id !== id);
  saveState();
  renderCampaignsView();
}

/* ==========================================================================
   📦 DATA UTILITIES: EXPORT, RESTORE, AND CSV PARSING
   ========================================================================== */

// Export complete PRM JSON
function exportJSONBackup() {
  // snapshotHealth is excluded from every backup by design — see C13.
  const { snapshotHealth, ...exportable } = state;
  const json = JSON.stringify(exportable, null, 2);
  saveBackupFile(`vantage_prm_backup_${new Date().toISOString().split("T")[0]}.json`, json);
}

// The full-state JSON restore engine. Shared by the manual .json restore and
// by "Restore from snapshot" — a snapshot is a state JSON, so it restores
// through exactly the same path rather than a second one.
function applyJSONBackupText(text, sourceLabel) {
  try {
    const parsed = JSON.parse(text);
    if (parsed.prospects && parsed.companies && parsed.media) {
      const liveHealth = state.snapshotHealth;   // never adopt a health object
      state = parsed;                            // from a file — see C13.
      state.snapshotHealth = liveHealth || freshSnapshotHealth();
      ensureStateDefaults();
      saveState();
      alert(`Database restored successfully from ${sourceLabel}!`);
      renderApp();
      evaluateSnapshotHealth();
      return true;
    }
    alert("Invalid backup format. Missing core PRM keys.");
    return false;
  } catch (err) {
    console.error("[Restore] JSON parse failed:", err);
    alert("Error parsing backup file.");
    return false;
  }
}

// Restore PRM JSON
function restoreJSONBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.name.toLowerCase().endsWith(".zip")) {
    importCSVContacts(e);
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    applyJSONBackupText(evt.target.result, file.name);
  };
  reader.readAsText(file);
}

function downloadCSVTemplate() {
  const headers = "First Name,Last,Email,Title,Mobile,LinkedIn,Company,Website,Employees,Employee Range,Company Industry,Company Description,Company Specialities,Metro,City,State,Company Headquarters\n";
  const row1 = "Jane,Smith,jane.smith@stripe.com,Developer Advocate,+1 (555) 321-4567,https://linkedin.com/in/janesmith,Stripe,stripe.com,8500,5000-10000,Fintech,Financial infrastructure for the internet.,Payments;Billing;Infrastructure,Bay Area,San Francisco,CA,San Francisco, CA\n";
  const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + row1);
  const dlAnchor = document.createElement("a");
  dlAnchor.setAttribute("href", csvContent);
  dlAnchor.setAttribute("download", "vantage_prospects_template.csv");
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
}

function downloadApolloTemplate() {
  const headers = [
    "First Name",
    "Last Name",
    "Title",
    "Company Name",
    "Email",
    "IGNORE",
    "IGNORE",
    "Seniority",
    "Phone (Mobile)",
    "IGNORE",
    "Employees",
    "Industry",
    "LinkedIn",
    "Company Webiste",
    "Company LinkedIn",
    "City",
    "State",
    "IGNORE",
    "IGNORE",
    "Reachout Interaction (Filled by Vantage)"
  ];
  
  const sampleRow = [
    "Jane",
    "Smith",
    "Developer Advocate",
    "Stripe",
    "jane.smith@stripe.com",
    "Verified",
    "95",
    "Individual Contributor",
    "+1 (555) 321-4567",
    `${new Date().toISOString().split("T")[0]}`,
    "8500",
    "Fintech",
    "https://linkedin.com/in/janesmith",
    "stripe.com",
    "https://linkedin.com/company/stripe",
    "San Francisco",
    "CA",
    "Developer Relations Team lead",
    "Yes",
    `${new Date().toISOString().split("T")[0]}-Added to Vantage`
  ];

  const wsData = [headers, sampleRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  headers.forEach((h, idx) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
    const cell = ws[cellAddress];
    if (cell) {
      cell.s = {
        font: {
          name: "Arial",
          sz: 10,
          bold: true,
          color: (h.toUpperCase() === "IGNORE" || h.toLowerCase().includes("ignore") || h === "Reachout Interaction (Filled by Vantage)" || h.toLowerCase().includes("reachout interaction")) ? { rgb: "FF0000" } : { rgb: "000000" }
        },
        fill: {
          fgColor: { rgb: "EAEAEA" }
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        }
      };
    }
  });

  ws["!cols"] = headers.map(h => ({ wch: Math.max(h.length + 4, 15) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Apollo Template");
  XLSX.writeFile(wb, "Apollo Import Tempalate w/phone.xls");
}

function downloadApolloNoPhoneTemplate() {
  const headers = [
    "First Name",
    "Last Name",
    "Title",
    "Company Name",
    "Email",
    "IGNORE",
    "IGNORE",
    "Seniority",
    "IGNORE",
    "Employees",
    "Industry",
    "LinkedIn",
    "Company Webiste",
    "Company LinkedIn",
    "City",
    "State",
    "IGNORE",
    "IGNORE",
    "Reachout Interaction (Filled by Vantage)"
  ];
  
  const sampleRow = [
    "Jane",
    "Smith",
    "Developer Advocate",
    "Stripe",
    "jane.smith@stripe.com",
    "Verified",
    "95",
    "Individual Contributor",
    `${new Date().toISOString().split("T")[0]}`,
    "8500",
    "Fintech",
    "https://linkedin.com/in/janesmith",
    "stripe.com",
    "https://linkedin.com/company/stripe",
    "San Francisco",
    "CA",
    "Developer Relations Team lead",
    "Yes",
    `${new Date().toISOString().split("T")[0]}-Added to Vantage`
  ];

  const wsData = [headers, sampleRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  headers.forEach((h, idx) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: idx });
    const cell = ws[cellAddress];
    if (cell) {
      cell.s = {
        font: {
          name: "Arial",
          sz: 10,
          bold: true,
          color: (h.toUpperCase() === "IGNORE" || h.toLowerCase().includes("ignore") || h === "Reachout Interaction (Filled by Vantage)" || h.toLowerCase().includes("reachout interaction")) ? { rgb: "FF0000" } : { rgb: "000000" }
        },
        fill: {
          fgColor: { rgb: "EAEAEA" }
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        }
      };
    }
  });

  ws["!cols"] = headers.map(h => ({ wch: Math.max(h.length + 4, 15) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Apollo Template");
  XLSX.writeFile(wb, "Apollo Import Template-NO PHONE.xls");
}

// Merge newly-imported records into an existing array, skipping duplicates.
// keyFn(record) should return a stable dedupe key string, or null/"" if no
// reliable key can be derived (in which case the record is always added,
// since we can't safely assume it's a duplicate).
function mergeImportedRecords(existingArray, newRecords, keyFn) {
  const seen = new Set();
  (existingArray || []).forEach(r => {
    const k = keyFn(r);
    if (k) seen.add(k);
  });
  let added = 0;
  let duplicates = 0;
  const toAdd = [];
  (newRecords || []).forEach(r => {
    const k = keyFn(r);
    if (k && seen.has(k)) {
      duplicates++;
    } else {
      toAdd.push(r);
      added++;
      if (k) seen.add(k);
    }
  });
  return { merged: (existingArray || []).concat(toAdd), added, duplicates };
}

function mergeSummaryLabel(count) {
  return count ? `, ${count} duplicate${count === 1 ? "" : "s"} skipped` : "";
}

function importCSVContacts(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  let loadedTables = [];
  let filesProcessed = 0;
  let totalFilesExpected = files.length;

  Array.from(files).forEach(file => {
    const fileName = file.name.toLowerCase();

    // A. HANDLE ZIP FILES
    if (fileName.endsWith(".zip")) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        JSZip.loadAsync(evt.target.result).then(function(zip) {
          const promises = [];

          zip.forEach(function (relativePath, zipEntry) {
            if (zipEntry.dir) return;
            const entryName = zipEntry.name.toLowerCase();
            const baseName = zipEntry.name.replace(/\\/g, "/").split("/").pop().toLowerCase();
            
            if (entryName.endsWith(".csv")) {
              promises.push(
                zipEntry.async("string").then(text => {
                  return { type: "csv", name: baseName, content: text };
                })
              );
            } else if (entryName.endsWith(".xlsx") || entryName.endsWith(".xls")) {
              promises.push(
                zipEntry.async("arraybuffer").then(buf => {
                  return { type: "excel", name: baseName, content: buf };
                })
              );
            }
          });

          if (promises.length === 0) {
            alert("No CSV or Excel files found inside the selected ZIP archive!");
            filesProcessed++;
            checkCompletion();
            return;
          }

          Promise.all(promises).then(function(results) {
            results.forEach(res => {
              if (res.type === "csv") {
                processSingleCSVContent(res.name, res.content);
              } else if (res.type === "excel") {
                try {
                  const workbook = XLSX.read(res.content, { type: "array" });
                  if (workbook.SheetNames.length > 0) {
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
                    const cleanBaseName = res.name.toLowerCase().replace(/\.xlsx$/, "").replace(/\.xls$/, "");
                    processParsedRows(cleanBaseName, rows);
                  }
                } catch(err) {
                  console.error("Error reading Excel inside zip (" + res.name + "):", err);
                }
              }
            });
            filesProcessed++;
            checkCompletion();
          }).catch(err => {
            alert("Error reading files inside zip: " + err);
            filesProcessed++;
            checkCompletion();
          });
        }).catch(err => {
          alert("Error parsing ZIP archive: " + err);
          filesProcessed++;
          checkCompletion();
        });
      };
      reader.readAsArrayBuffer(file);
    } 
    
    // B. HANDLE DIRECT EXCEL FILES
    else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          if (workbook.SheetNames.length === 0) {
            alert("No sheets found in Excel file: " + file.name);
            filesProcessed++;
            checkCompletion();
            return;
          }
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
          const baseName = fileName.toLowerCase().replace(/^prm_/, "").replace(/\.csv$/, "").replace(/\.xlsx$/, "").replace(/\.xls$/, "");
          processParsedRows(baseName, rows);
        } catch(err) {
          alert("Error parsing Excel file (" + file.name + "): " + err.message);
        }
        filesProcessed++;
        checkCompletion();
      };
      reader.readAsArrayBuffer(file);
    }
    
    // C. HANDLE DIRECT CSV FILES
    else {
      const reader = new FileReader();
      reader.onload = function(evt) {
        processSingleCSVContent(fileName, evt.target.result);
        filesProcessed++;
        checkCompletion();
      };
      reader.readAsText(file);
    }
  });

  function processSingleCSVContent(fileName, text) {
    const rows = parseCSV(text);
    const baseName = fileName.toLowerCase().replace(/^prm_/, "").replace(/\.csv$/, "");
    processParsedRows(baseName, rows);
  }

  function processParsedRows(baseName, rows) {
    if (rows.length <= 1) return;
    const headers = rows[0];

    // Parse into generic array of objects mapping columns to headers
    const genericRows = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (cols.length === 0 || cols.every(c => !c?.toString().trim())) continue;
      const obj = {};
      headers.forEach((header, idx) => {
        // Clean UTF-8 BOM if present
        const cleanHeader = header.trim().replace(/^\ufeff/, "");
        if (cleanHeader) {
          const val = cols[idx]?.toString().trim() || "";
          obj[cleanHeader] = val;
          // Store lowercase and stripped variants for maximum mapping compatibility
          obj[cleanHeader.toLowerCase()] = val;
          obj[cleanHeader.toLowerCase().replace(/\s+/g, "")] = val;
          obj[cleanHeader.toLowerCase().replace(/[^a-z0-9]/g, "")] = val;
        }
      });
      genericRows.push(obj);
    }

    // 1. Companies File Route
    if (baseName.includes("compan")) {
      const importedCompanies = genericRows.map((row, idx) => {
        const domain = row.domain || row.websiteurl || row.website || "";
        const city = row.hqcity || "";
        const stateVal = row.hqstate || "";
        const country = row.hqcountry || "";
        const locationParts = [city, stateVal, country].filter(Boolean).join(", ");
        
        let tags = [];
        const rawTags = row.companytags || row.tags || "";
        if (rawTags) tags = rawTags.split(/[;,]/).map(t => t.trim()).filter(Boolean);
        if (tags.length === 0) tags = ["No Company Tag"];

        return {
          id: domain.toLowerCase() || row.id || `comp-${Date.now()}-${idx}`,
          name: row.name || row.companyname || row.company || "Unnamed Company",
          domain: domain || "stripe.com",
          website: row.website || row.websiteurl || "",
          employees: row.employees || "",
          employeeRange: row.employeerange || "",
          industry: row.companyindustry || row.industry || row.companynotes || "General",
          description: row.companydescription || row.description || "",
          specialities: row.companyspecialities || row.specialties || "",
          headquarters: row.companyheadquarters || row.headquarters || locationParts || row.location || "Unknown",
          location: row.companyheadquarters || locationParts || row.location || "Unknown",
          tags
        };
      });
      if (importedCompanies.length > 0) {
        if (!state.companies) state.companies = [];
        const result = mergeImportedRecords(state.companies, importedCompanies, c => (c.id || "").toLowerCase().trim() || null);
        state.companies = result.merged;
        loadedTables.push(`Companies 🏢 (${result.added} added${mergeSummaryLabel(result.duplicates)})`);
      }
    }
    
    // 2. Prospects File Route
    else if (baseName.includes("prospect") || baseName.includes("apollo") || baseName.includes("apolllo") || headers.some(h => {
      const nh = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      return nh === "firstname" || nh === "email" || nh === "personlinkedinurl" || nh === "linkedin";
    })) {
      const importedProspects = genericRows.map((row, idx) => {
        const lookup = (keys) => {
          for (const key of keys) {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (row[cleanKey] !== undefined) {
              return row[cleanKey];
            }
          }
          return "";
        };

        const firstName = lookup(["first name", "firstname", "first"]);
        const lastName = lookup(["last name", "lastname", "last"]);
        const email = lookup(["email", "email address", "work email"]);
        const title = lookup(["title", "job title"]);
        const seniority = lookup(["seniority", "seniority level"]) || deriveSeniority(title);

        // Check if phone or mobile headers are present in the import columns
        const hasPhoneHeader = headers.some(h => {
          const nh = h.toLowerCase().replace(/[^a-z0-9]/g, "");
          return nh.includes("phone") || nh === "mobile";
        });
        const phone = hasPhoneHeader ? lookup(["mobile phone", "phone (mobile)", "phone", "work direct phone", "mobile", "work phone", "direct phone", "contact phone"]) : "";

        // Company mapping details
        const companyName = lookup(["company name", "company", "companyname", "organization"]);
        const websiteVal = lookup(["company website", "website", "companywebsiteurl", "domain", "companyurl", "company website url", "companywebiste"]);
        
        let domainVal = websiteVal.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
        
        let compTags = [];
        const rawCompTags = lookup(["company tags", "companytags"]);
        if (rawCompTags) compTags = rawCompTags.split(/[;,]/).map(t => t.trim()).filter(Boolean);
        
        if (!domainVal && companyName) {
          domainVal = companyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          if (!compTags.includes("No URL")) compTags.push("No URL");
        }
        if (compTags.length === 0) compTags = ["No Company Tag"];

        // Tags
        let tags = [];
        const rawTags = lookup(["prospect tags", "tags", "prospecttags", "target tier", "targettier", "status", "shows"]);
        if (rawTags) tags = rawTags.split(/[;,]/).map(t => t.trim()).filter(Boolean);
        if (tags.length === 0) tags = ["No Prospect Tag"];

        // History & notes setup
        let history = [];
        const notes = lookup(["contact notes", "history", "contactnotes", "notes"]);
        if (notes) {
          try {
            history = JSON.parse(notes);
          } catch(e) {
            if (notes.trim()) {
              history = [{
                id: `hist-${Date.now()}-${idx}-note`,
                date: new Date().toISOString().split("T")[0],
                type: "Note",
                content: notes.trim()
              }];
            }
          }
        }
        
        // Auto-add "Added to Vantage" reachout transaction
        history.push({
          id: `hist-${Date.now()}-${idx}-init`,
          date: new Date().toISOString().split("T")[0],
          type: "Added to Vantage",
          content: "Added to Vantage"
        });

        const city = lookup(["city", "company city"]);
        const stateVal = lookup(["state", "region", "company state"]);
        const location = lookup(["location", "metro", "company location"]);
        const linkedin = lookup(["person linkedin url", "linkedin url", "linkedin", "personlinkedinurl"]);

        return {
          id: row.id || email.toLowerCase() || `pros-${Date.now()}-${idx}`,
          firstName,
          lastName,
          email,
          phone,
          title,
          seniority,
          companyId: domainVal,
          city,
          state: stateVal,
          location: location || [city, stateVal].filter(Boolean).join(", "),
          linkedin,
          tags,
          history,
          _tempCompTags: compTags
        };
      });
      
      // Auto-create missing companies
      importedProspects.forEach((p, idx) => {
        const rawRow = genericRows[idx];
        const lookupVal = (keys) => {
          for (const key of keys) {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (rawRow[cleanKey] !== undefined) {
              return rawRow[cleanKey];
            }
          }
          return "";
        };

        const companyName = lookupVal(["company name", "company", "companyname", "organization"]);
        if (p.companyId && companyName) {
          const existing = state.companies.find(c => c.id === p.companyId);
          
          const employees = lookupVal(["employees", "# employees", "employeecount", "employees (company)"]);
          const employeeRange = lookupVal(["employee range", "employeerange", "employees"]);
          const industry = lookupVal(["industry", "company industry"]) || "General";
          const description = lookupVal(["company description", "description"]);
          const specialities = lookupVal(["company specialities", "company specialties", "specialties", "specialities"]);
          const headquarters = lookupVal(["company headquarters", "headquarters", "location"]);
          const website = lookupVal(["company website", "website", "companywebsiteurl", "domain", "companyurl", "company website url", "companywebiste"]) || p.companyId;
          const companyLinkedin = lookupVal(["company linkedin url", "company linkedin", "companylinkedinurl"]);

          if (!existing) {
            state.companies.push({
              id: p.companyId,
              name: companyName,
              domain: p.companyId,
              website: website,
              location: headquarters || [p.city, p.state, p.location].filter(Boolean).join(", "),
              industry: industry,
              employees: employees,
              employeeRange: employeeRange,
              description: description,
              specialities: specialities,
              headquarters: headquarters,
              address: "",
              phone: "",
              linkedin: companyLinkedin,
              tags: p._tempCompTags
            });
          } else {
            // Update existing company fields if not set
            if (!existing.employees && employees) existing.employees = employees;
            if (!existing.employeeRange && employeeRange) existing.employeeRange = employeeRange;
            if ((!existing.industry || existing.industry === "General") && industry !== "General") existing.industry = industry;
            if (!existing.description && description) existing.description = description;
            if (!existing.specialities && specialities) existing.specialities = specialities;
            if (!existing.linkedin && companyLinkedin) existing.linkedin = companyLinkedin;
            if (!existing.headquarters && headquarters) {
              existing.headquarters = headquarters;
              existing.location = headquarters;
            }
            // If existing company has only default tag or no tags, upgrade it
            if (!existing.tags || existing.tags.length === 0 || (existing.tags.length === 1 && existing.tags[0] === "No Company Tag")) {
               existing.tags = p._tempCompTags;
            }
          }
        }
        delete p._tempCompTags; // cleanup
      });
      
      if (importedProspects.length > 0) {
        if (!state.prospects) state.prospects = [];
        const prospectKey = (p) => {
          const email = (p.email || "").trim().toLowerCase();
          if (email) return "email:" + email;
          const first = (p.firstName || "").trim().toLowerCase();
          const last = (p.lastName || "").trim().toLowerCase();
          const company = (p.companyId || "").trim().toLowerCase();
          if (!first && !last) return null; // not enough info to safely call it a duplicate
          return "name:" + first + "|" + last + "|" + company;
        };
        const result = mergeImportedRecords(state.prospects, importedProspects, prospectKey);
        state.prospects = result.merged;
        loadedTables.push(`Prospects 👥 (${result.added} added${mergeSummaryLabel(result.duplicates)})`);
      }
    }
    
    // 3. Campaigns File Route (prm_campaigns.csv or legacy prm_media_log.csv)
    else if (baseName.includes("campaign") || baseName.includes("media_log") || baseName.includes("social_log")) {
      const importedCampaigns = genericRows.map((row, idx) => {
        const tags = (row.tags || row["tags"] || "").split(";").map(t => t.trim()).filter(Boolean);
        const headline = row.title || row.headline || "Untitled Campaign";
        const contentId = row["sequence media id"] || row.sequencemediaid || row.contentid || "";
        const defaultPhase = state.campaignPhases?.[0] || "Development";

        return {
          id: row.id || row.logid || `camp-${Date.now()}-${idx}`,
          title: headline,
          sequenceMediaId: contentId,
          launchDate: row["launch date"] || row.launchdate || row.date || "",
          status: row.status || defaultPhase,
          tags,
          audienceListId: row["audience list id"] || row.audiencelistid || "",
          intendedAudience: row["intended audience"] || row.intendedaudience || "",
          goalSummary: row["goal summary"] || row.goalsummary || ""
        };
      });
      if (importedCampaigns.length > 0) {
        if (!state.campaigns) state.campaigns = [];
        const campaignKey = (c) => {
          if (c.id) return "id:" + c.id;
          const title = (c.title || "").trim().toLowerCase();
          const launch = (c.launchDate || "").trim().toLowerCase();
          if (!title) return null;
          return "t:" + title + "|" + launch;
        };
        const result = mergeImportedRecords(state.campaigns, importedCampaigns, campaignKey);
        state.campaigns = result.merged;
        loadedTables.push(`Campaigns 🎯 (${result.added} added${mergeSummaryLabel(result.duplicates)})`);
      }
    }
    
    // 3b. Audience Lists File Route
    else if (baseName.includes("audience")) {
      const importedAudiences = genericRows.map((row, idx) => {
        let prospectIds = [];
        const rawIds = row.prospectids || row.prospectid || "";
        if (rawIds) prospectIds = rawIds.split(/[;,]/).map(t => t.trim()).filter(Boolean);
        return {
          id: row.id || `aud-${Date.now()}-${idx}`,
          name: row.name || row.title || "Untitled Audience List",
          prospectIds
        };
      });
      if (importedAudiences.length > 0) {
        if (!state.audienceLists) state.audienceLists = [];
        const audienceKey = (a) => {
          if (a.id) return "id:" + a.id;
          const name = (a.name || "").trim().toLowerCase();
          return name ? "n:" + name : null;
        };
        const result = mergeImportedRecords(state.audienceLists, importedAudiences, audienceKey);
        state.audienceLists = result.merged;
        loadedTables.push(`Audience Lists 👥 (${result.added} added${mergeSummaryLabel(result.duplicates)})`);
      }
    }
    
    // 3c. Settings File Route
    else if (baseName.includes("setting")) {
      restoreSettingsFromCSV(text);
      loadedTables.push("Media Hub Settings ⚙️");
    }
    
    // 4. Media File Route (prm_media_content.csv or prm_social_content.csv)
    else if (baseName.includes("media") && !baseName.includes("media_log")) {
      const importedMedia = genericRows.map((row, idx) => {
        const rawTags = row.mediatags || row.media_tags || row.tags || row.mediatag || row.tag || "";
        const tags = rawTags.split(/[;,]/).map(t => t.trim()).filter(Boolean);
        
        let statusVal = row.status || "";
        if (!statusVal) {
          statusVal = "Idea";
          if (rawTags.toLowerCase().includes("published")) {
            statusVal = "Published";
          } else if (rawTags.toLowerCase().includes("draft")) {
            statusVal = "Draft";
          }
        }
        
        let publishEvents = [];
        if (row.publishevents) {
          try { publishEvents = JSON.parse(row.publishevents); } catch(e) {}
        }
        let masterFiles = [];
        if (row.masterfiles) {
          try { masterFiles = JSON.parse(row.masterfiles); } catch(e) {}
        }
        let files = [];
        if (row.files) {
          try { files = JSON.parse(row.files); } catch(e) {}
        }
        
        const outlineVal = row.outline || "";
        let contentVal = row.content || row.summary || "";
        let finalOutline = outlineVal;
        let finalContent = contentVal;
        if (!outlineVal && contentVal) {
          finalOutline = contentVal;
          finalContent = "";
        }

        return {
          id: row.id || row.contentid || `med-${Date.now()}-${idx}`,
          title: row.title || "Untitled Media",
          status: statusVal,
          type: row.type || row.format || "Article",
          platform: row.platform || row.contentlink || "",
          outline: finalOutline,
          content: finalContent,
          media_tags: tags,
          tags: tags,
          views: parseInt(row.views || row.reactions) || 0,
          clicks: parseInt(row.clicks || row.comments) || 0,
          shares: parseInt(row.shares) || 0,
          comments: parseInt(row.comments || row.shares || 0) || 0,
          publishDate: row.publishdate || row.publishDate || "",
          files,
          publishEvents,
          masterFiles
        };
      });
      if (importedMedia.length > 0) {
        if (!state.media) state.media = [];
        const mediaKey = (m) => {
          if (m.id) return "id:" + m.id;
          const title = (m.title || "").trim().toLowerCase();
          return title ? "t:" + title : null;
        };
        const result = mergeImportedRecords(state.media, importedMedia, mediaKey);
        state.media = result.merged;
        loadedTables.push(`Media Hub 📁 (${result.added} added${mergeSummaryLabel(result.duplicates)})`);
      }
    }

    // 5. Dynamic Custom Table Route (content_versions, countries, shows)
    else {
      if (!state[baseName]) state[baseName] = [];
      const result = mergeImportedRecords(state[baseName], genericRows, r => r.id ? ("id:" + r.id) : ("j:" + JSON.stringify(r)));
      state[baseName] = result.merged;
      const label = baseName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      loadedTables.push(`${label} (Custom) 📊 (${result.added} added${mergeSummaryLabel(result.duplicates)})`);
    }
  }

  function checkCompletion() {
    if (filesProcessed === totalFilesExpected) {
      ensureStateDefaults();
      saveState();
      alert(`Import Complete!\n\nExisting records were kept — duplicates were skipped and only new records were added:\n- ${[...new Set(loadedTables)].join("\n- ")}`);
      
      e.target.value = "";
      renderApp();
    }
  }
}

// Standard-compliant RFC-4180 CSV character parser (Globally accessible)
function parseCSV(text) {
  let lines = [];
  let currentLine = [];
  let currentField = "";
  let insideQuote = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentField += '"';
        i++; // Skip next quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentLine.push(currentField);
      currentField = "";
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentLine.push(currentField);
      lines.push(currentLine);
      currentLine = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField);
    lines.push(currentLine);
  }
  return lines;
}

function parseCSVRow(rowText) {
  let result = [];
  let current = "";
  let insideQuote = false;

  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === ',' && !insideQuote) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/* ==========================================================================
   🔗 RELATION AND NAMES HELPERS
   ========================================================================== */

function getCompanyName(compId) {
  const c = state.companies.find(x => x.id === compId);
  return c ? c.name : "";
}

// Today as a LOCAL "YYYY-MM-DD" string (Phase 1 / Session 1.4).
// Deliberately not `new Date().toISOString().split("T")[0]`, the older
// convention elsewhere in this file: toISOString() is UTC, so in
// America/New_York every task created after 8pm would be stamped with
// tomorrow's date. DECLARATIONS stores dates as local YYYY-MM-DD strings.
// Reuse this for task dates (1.5's "due today", 1.6's completedDate).
function todayLocalDateStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function getMediaTitle(medId) {
  const m = state.media.find(x => x.id === medId);
  return m ? m.title : "None";
}

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

/* ==========================================================================
   👂 CENTRALIZED REGISTER EVENT LISTENERS
   ========================================================================== */

function setupEventListeners() {
  // Navigation Tabs switching
  document.querySelectorAll(".nav-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      switchView(tab.getAttribute("data-view"));
    });
  });

  // Dashboard Stat Card Shortcuts
  document.getElementById("shortcut-prospects")?.addEventListener("click", () => switchView("prospects"));
  document.getElementById("shortcut-campaigns")?.addEventListener("click", () => switchView("campaigns"));
  document.getElementById("shortcut-media")?.addEventListener("click", () => switchView("media"));

  // Mobile hamburger Sidebar Toggle
  document.getElementById("sidebar-toggle-btn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("sidebar-visible");
  });

  // Initialize Sidebar Pin State and Toggle Switch
  const sidebar = document.getElementById("sidebar");
  const pinToggle = document.getElementById("sidebar-pin-toggle");
  if (sidebar && pinToggle) {
    const isPinned = localStorage.getItem("vantage_sidebar_pinned") !== "false";
    if (isPinned) {
      pinToggle.checked = true;
      sidebar.classList.add("sidebar-pinned");
    } else {
      pinToggle.checked = false;
      sidebar.classList.remove("sidebar-pinned");
    }

    pinToggle.addEventListener("change", (e) => {
      if (e.target.checked) {
        sidebar.classList.add("sidebar-pinned");
        localStorage.setItem("vantage_sidebar_pinned", "true");
      } else {
        sidebar.classList.remove("sidebar-pinned");
        localStorage.setItem("vantage_sidebar_pinned", "false");
      }
    });
  }

  // Theme Toggler
  document.getElementById("theme-toggle-btn").addEventListener("click", toggleTheme);

  // Developer Sandbox & Wipe Tools
  document.getElementById("sandbox-reset-btn").addEventListener("click", resetSandbox);
  document.getElementById("sandbox-make-btn").addEventListener("click", makeNewSandbox);
  document.getElementById("sandbox-wipe-btn").addEventListener("click", wipeAllData);

  // 1. Prospect Database Views listeners
  document.getElementById("prospect-search").addEventListener("input", renderProspectsView);
  document.getElementById("prospect-geo-search").addEventListener("input", renderProspectsView);
  document.getElementById("prospect-tag-chooser")?.addEventListener("input", renderProspectsView);
  document.getElementById("btn-clear-prospects-filters")?.addEventListener("click", clearProspectsFilters);
  document.getElementById("btn-prospects-settings")?.addEventListener("click", openSettingsModal);
  document.getElementById("btn-close-inspector-panel")?.addEventListener("click", closeInspectorPanel);
  document.getElementById("btn-export-contacts-filtered")?.addEventListener("click", exportFilteredContactsCSV);
  document.getElementById("btn-export-companies-filtered")?.addEventListener("click", exportFilteredCompaniesCSV);

  // Advanced Query modal wiring
  initAqPickers();
  document.getElementById("btn-open-advanced-query")?.addEventListener("click", openAdvancedQueryModal);
  document.getElementById("btn-advanced-query-close-x")?.addEventListener("click", closeAdvancedQueryModal);
  // Enter runs the query from any filter field (buttons/textareas handle
  // their own Enter behavior natively, so they're excluded here).
  document.getElementById("modal-advanced-query")?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const tag = e.target.tagName;
    if (tag === "BUTTON" || tag === "TEXTAREA") return;
    e.preventDefault();
    runAdvancedQuery();
  });
  document.getElementById("aq-target-prospects")?.addEventListener("click", () => setAdvancedQueryTarget("prospect"));
  document.getElementById("aq-target-companies")?.addEventListener("click", () => setAdvancedQueryTarget("company"));
  document.getElementById("btn-run-advanced-query")?.addEventListener("click", runAdvancedQuery);
  document.getElementById("btn-clear-advanced-query")?.addEventListener("click", clearAdvancedQueryFilters);
  document.getElementById("aq-per-page")?.addEventListener("change", changeAdvancedQueryPerPage);
  document.getElementById("btn-aq-select-screen")?.addEventListener("click", selectAdvancedQueryScreen);
  document.getElementById("btn-aq-select-all")?.addEventListener("click", selectAdvancedQueryAll);
  document.getElementById("btn-aq-clear-selection")?.addEventListener("click", clearAdvancedQuerySelection);
  document.getElementById("btn-aq-prev-page")?.addEventListener("click", advancedQueryPrevPage);
  document.getElementById("btn-aq-next-page")?.addEventListener("click", advancedQueryNextPage);
  document.getElementById("btn-aq-results-close-x")?.addEventListener("click", closeAqResultsModal);
  document.getElementById("btn-aq-results-maximize")?.addEventListener("click", toggleAqResultsMaximize);
  initAqResultsWindowControls();
  document.getElementById("btn-aq-export-selected")?.addEventListener("click", exportAqSelectedCSV);
  document.getElementById("btn-aq-export-all")?.addEventListener("click", exportAqAllCSV);
  document.getElementById("btn-aq-insp-close")?.addEventListener("click", closeAqInspectorDrawer);
  document.getElementById("btn-aq-insp-p-edit-tags")?.addEventListener("click", editAqInspectorTags);
  document.getElementById("btn-aq-insp-c-edit-tags")?.addEventListener("click", editAqInspectorTags);
  document.getElementById("btn-aq-insp-p-edit-full")?.addEventListener("click", editAqInspectorFull);
  document.getElementById("btn-aq-insp-c-edit-full")?.addEventListener("click", editAqInspectorFull);
  document.getElementById("btn-aq-insp-p-delete")?.addEventListener("click", deleteAqInspectorRecord);
  document.getElementById("btn-aq-insp-c-delete")?.addEventListener("click", deleteAqInspectorRecord);
  document.getElementById("btn-aq-insp-add-interaction")?.addEventListener("click", openInteractionModal);
  document.getElementById("aq-insp-p-notes")?.addEventListener("input", () => {
    document.getElementById("btn-aq-insp-p-save-notes")?.classList.remove("hidden");
  });
  document.getElementById("aq-insp-c-notes")?.addEventListener("input", () => {
    document.getElementById("btn-aq-insp-c-save-notes")?.classList.remove("hidden");
  });
  document.getElementById("btn-aq-insp-p-save-notes")?.addEventListener("click", saveAqInspectorNotes);
  document.getElementById("btn-aq-insp-c-save-notes")?.addEventListener("click", saveAqInspectorNotes);
  document.getElementById("btn-aq-bulk-add-tag")?.addEventListener("click", bulkAddTagToSelected);
  document.getElementById("btn-aq-bulk-add-audience")?.addEventListener("click", bulkAddSelectedToAudience);
  document.getElementById("btn-aq-bulk-create-audience")?.addEventListener("click", bulkCreateAudienceFromSelected);
  document.getElementById("btn-show-all-contacts")?.addEventListener("click", () => {
    state.forceShowAllContacts = true;
    state.forceShowAllCompanies = false;
    document.getElementById("prospect-search").value = "";
    document.getElementById("prospect-geo-search").value = "";
    const tagSelect = document.getElementById("prospect-tag-chooser");
    if (tagSelect) tagSelect.selectedIndex = -1;
    renderProspectsView();
  });
  document.getElementById("btn-show-all-companies")?.addEventListener("click", () => {
    state.forceShowAllCompanies = true;
    state.forceShowAllContacts = false;
    document.getElementById("prospect-search").value = "";
    document.getElementById("prospect-geo-search").value = "";
    const tagSelect = document.getElementById("prospect-tag-chooser");
    if (tagSelect) tagSelect.selectedIndex = -1;
    renderProspectsView();
  });
  document.getElementById("add-prospect-btn").addEventListener("click", () => openProspectModal());
  document.getElementById("pros-modal-cancel").addEventListener("click", () => {
    document.getElementById("modal-prospect").classList.add("hidden");
  });
  document.getElementById("pros-modal-confirm").addEventListener("click", saveProspect);
  document.getElementById("btn-edit-prospect").addEventListener("click", () => {
    openProspectModal(state.selectedProspectId);
  });
  document.getElementById("btn-delete-prospect").addEventListener("click", deleteProspect);
  document.getElementById("btn-delete-company")?.addEventListener("click", deleteCompany);
  document.getElementById("btn-edit-inspector-tags")?.addEventListener("click", openChooseTagsModalForProspectInspector);
  document.getElementById("btn-edit-inspector-comp-tags")?.addEventListener("click", openChooseTagsModalForCompanyInspector);
  
  document.getElementById("btn-pros-edit-company").addEventListener("click", (e) => {
    e.preventDefault();
    if (e.target.dataset.compId) {
      openCompanyModal(e.target.dataset.compId);
    }
  });

  document.getElementById("comp-modal-cancel").addEventListener("click", () => {
    document.getElementById("modal-company").classList.add("hidden");
  });
  document.getElementById("comp-modal-confirm").addEventListener("click", saveCompany);
  document.getElementById("btn-comp-edit-tags").addEventListener("click", (e) => {
    e.preventDefault();
    openCompanyChooseTagsModal();
  });

  // Backup & Import listeners (Safely guarded for older elements)
  const expBackupBtn = document.getElementById("export-backup-btn");
  if (expBackupBtn) expBackupBtn.addEventListener("click", exportJSONBackup);
  const restoreBackupInput = document.getElementById("restore-backup-input");
  if (restoreBackupInput) restoreBackupInput.addEventListener("change", restoreJSONBackup);
  
  document.getElementById("download-csv-template").addEventListener("click", () => {
    document.getElementById("modal-template-options").classList.remove("hidden");
  });
  document.getElementById("btn-template-options-close-x").addEventListener("click", () => {
    document.getElementById("modal-template-options").classList.add("hidden");
  });
  document.getElementById("btn-template-options-close").addEventListener("click", () => {
    document.getElementById("modal-template-options").classList.add("hidden");
  });
  document.getElementById("btn-download-vantage-template").addEventListener("click", () => {
    downloadCSVTemplate();
    document.getElementById("modal-template-options").classList.add("hidden");
  });
  document.getElementById("btn-download-apollo-template").addEventListener("click", () => {
    downloadApolloTemplate();
    document.getElementById("modal-template-options").classList.add("hidden");
  });
  document.getElementById("btn-download-apollo-nophone-template").addEventListener("click", () => {
    downloadApolloNoPhoneTemplate();
    document.getElementById("modal-template-options").classList.add("hidden");
  });
  document.getElementById("upload-csv-input").addEventListener("change", importCSVContacts);

  // Data Management Hub event listeners
  document.getElementById("btn-open-backup-window").addEventListener("click", () => {
    document.getElementById("modal-backup-options").classList.remove("hidden");
  });
  document.getElementById("btn-backup-options-close-x").addEventListener("click", () => {
    document.getElementById("modal-backup-options").classList.add("hidden");
  });
  document.getElementById("btn-backup-options-close").addEventListener("click", () => {
    document.getElementById("modal-backup-options").classList.add("hidden");
  });

  document.getElementById("btn-export-all-zip").addEventListener("click", exportZIPBackup);
  document.getElementById("btn-export-prospects-csv").addEventListener("click", exportProspectsCSV);
  document.getElementById("btn-export-media-csv").addEventListener("click", exportMediaCSV);
  document.getElementById("btn-export-campaigns-csv").addEventListener("click", exportCampaignsCSV);
  document.getElementById("btn-export-audiences-csv").addEventListener("click", exportAudienceListsCSV);
  document.getElementById("btn-export-tasks-csv")?.addEventListener("click", exportTasksCSV);
  document.getElementById("btn-export-companies-csv").addEventListener("click", exportCompaniesCSV);
  document.getElementById("btn-export-email-accounts-csv").addEventListener("click", exportEmailAccountsCSV);
  document.getElementById("btn-export-domains-csv").addEventListener("click", exportDomainsCSV);
  document.getElementById("btn-export-settings-csv").addEventListener("click", exportSettingsCSV);

  document.getElementById("data-restore-input").addEventListener("change", handleRestoreFile);

  const chooseFolderBtn = document.getElementById("btn-choose-backup-folder");
  if (chooseFolderBtn) chooseFolderBtn.addEventListener("click", chooseBackupFolder);
  const restoreFromFolderBtn = document.getElementById("btn-restore-from-folder");
  if (restoreFromFolderBtn) restoreFromFolderBtn.addEventListener("click", restoreFromBackupFolder);
  const snapRestoreBtn = document.getElementById("btn-restore-from-snapshot");
  if (snapRestoreBtn) snapRestoreBtn.addEventListener("click", handleRestoreFromSnapshotClick);
  const snapNowBtn = document.getElementById("btn-snapshot-now");
  if (snapNowBtn) snapNowBtn.addEventListener("click", handleSnapshotChipClick);
  const mirrorNowBtn = document.getElementById("btn-mirror-now");
  if (mirrorNowBtn) mirrorNowBtn.addEventListener("click", handleMirrorNowClick);

  const restoreDropzone = document.getElementById("data-restore-dropzone");
  const restoreInput = document.getElementById("data-restore-input");
  if (restoreDropzone && restoreInput) {
    setupDragDropHandlers(restoreDropzone, (files) => {
      if (files && files.length > 0) {
        // Create an artificial event to reuse handleRestoreFile
        const fakeEvent = { target: { files: files, value: "" } };
        handleRestoreFile(fakeEvent);
      }
    });
  }

  // Interaction logs Modal triggers
  document.getElementById("btn-add-interaction").addEventListener("click", openInteractionModal);
  document.getElementById("int-modal-cancel").addEventListener("click", () => {
    document.getElementById("modal-interaction").classList.add("hidden");
  });
  document.getElementById("int-modal-confirm").addEventListener("click", recordInteraction);

  // Task Editor Modal triggers (Phase 1 / Session 1.4, contract C8).
  // The "+ New Task" button and the task rows live inside the inspector and
  // are wired at render time in renderProspectInspectorTasks(); only the
  // modal's own static controls are bound here.
  document.getElementById("task-modal-cancel").addEventListener("click", closeTaskEditor);
  document.getElementById("task-modal-save").addEventListener("click", saveTaskFromEditor);
  document.getElementById("task-modal-delete").addEventListener("click", () => {
    if (editingTaskId) deleteTask(editingTaskId);
  });

  /* Contact search, contract C14 (Session 1.9). Rows are built and wired in
     renderTaskProspectResults(); only the field's own controls are here. */
  document.getElementById("task-prospect-search").addEventListener("input", renderTaskProspectResults);
  document.getElementById("task-prospect-search").addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown")      { e.preventDefault(); highlightTaskSearchRow(taskSearchActive + 1); }
    else if (e.key === "ArrowUp")   { e.preventDefault(); highlightTaskSearchRow(taskSearchActive - 1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      // Enter with nothing highlighted takes the first match — the common
      // case is typing a name until one row is left.
      const pick = taskSearchMatches[taskSearchActive >= 0 ? taskSearchActive : 0];
      if (pick) chooseTaskProspect(pick);
    } else if (e.key === "Escape") {
      // Clears the query, and stops there: Escape inside a search field
      // should not also close the modal behind it.
      e.stopPropagation();
      e.target.value = "";
      renderTaskProspectResults();
    }
  });
  document.getElementById("task-prospect-change").addEventListener("click", clearTaskProspectChoice);

  // §13.5 / §14.4: the completion checkbox governs whether transposition is
  // even offered, so both boxes repaint the same block.
  document.getElementById("task-complete").addEventListener("change", syncTaskReachoutBlock);
  document.getElementById("task-log-reachout").addEventListener("change", syncTaskReachoutBlock);

  /* §13.8: the prospect name is a link to that contact. SAVE FIRST — the
     click comes from inside the editor, so committing what was typed and then
     going to look is the natural reading, and it means nothing has to be
     stashed and reconciled on the way back. If validation rejects, its alert
     stands and we do not navigate. Phase 2 changes what the destination looks
     like, not that there is one. */
  document.getElementById("task-prospect-fixed").addEventListener("click", () => {
    const id = document.getElementById("task-prospect").value;
    const p = (state.prospects || []).find(x => x.id === id);
    if (!p) return;                        // "(missing prospect)" has nowhere to go
    if (saveTaskFromEditor() !== true) return;
    switchView("prospects");
    selectProspect(p.id);
  });

  // TaskHub view listeners (Phase 1 / Session 1.5). Filter chips, sortable
  // headers, row checkboxes and orphan rows are all wired at render time in
  // renderTasksView() and its helpers; only the panel's static controls are
  // bound here.
  // §15.4 (Session 1.10): "+ New Task" and this listener were removed
  // together. Tasks are created in the Prospect Hub inspector only — a task
  // exists because of a person, and choosing that person as a form field is
  // the step most likely to be got wrong and the hardest to notice
  // afterwards. Do not re-add a create control here.
  //
  // C16 (Session 1.10): one delegated mousedown on the STATIC <thead> named
  // by the COLUMN_TABLES entry, bound once. The header <tr> is rebuilt on
  // every render, so a per-row binding would have to be re-made each time.
  // Session 2B.2 parameterised it by table id; "taskhub" is still the only
  // registered consumer, and Session 2B.8 adds the other two calls here.
  initHeaderDrag("taskhub");
  document.getElementById("taskhub-per-page").addEventListener("change", () => {
    taskPage = 1;
    renderTaskHubTable();
  });
  document.getElementById("taskhub-range-start").addEventListener("change", () => {
    taskPage = 1;
    renderTaskHubTable();
  });
  document.getElementById("taskhub-range-end").addEventListener("change", () => {
    taskPage = 1;
    renderTaskHubTable();
  });
  document.getElementById("btn-taskhub-prev-page").addEventListener("click", () => {
    if (taskPage > 1) { taskPage--; renderTaskHubTable(); }
  });
  document.getElementById("btn-taskhub-next-page").addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(getTaskHubRows().length / taskPerPage));
    if (taskPage < totalPages) { taskPage++; renderTaskHubTable(); }
  });
  document.getElementById("task-orphans-close").addEventListener("click", closeTaskOrphanWindow);
  // Bulk action bar (Session 1.6). The header select-all checkbox is bound
  // inside renderTaskHubTable(), because the thead is rebuilt every render.
  document.getElementById("btn-taskhub-bulk-complete").addEventListener("click", () => bulkCompleteTasks(taskSelectedIds));
  document.getElementById("btn-taskhub-bulk-duedate").addEventListener("click", openBulkDueDateModal);
  document.getElementById("btn-taskhub-clear-selection").addEventListener("click", clearTaskSelection);
  document.getElementById("btn-tasks-settings").addEventListener("click", openSettingsModal);

  // Bulk due-date modal (Session 1.7). The two mode radios only repaint the
  // modal; nothing is committed until Apply, which confirms with the count.
  document.getElementById("bulk-due-mode-shift").addEventListener("change", syncBulkDueDateModal);
  document.getElementById("bulk-due-mode-set").addEventListener("change", syncBulkDueDateModal);
  document.getElementById("btn-bulk-due-apply").addEventListener("click", applyBulkDueDate);
  document.getElementById("btn-bulk-due-cancel").addEventListener("click", closeBulkDueDateModal);
  document.getElementById("btn-bulk-due-close-x").addEventListener("click", closeBulkDueDateModal);

  // Global due-date counting mode, in Application Settings. Writing it is
  // NEVER retroactive — no existing task moves (scope §7).
  document.getElementById("setting-task-date-mode").addEventListener("change", (e) => {
    if (!state.taskSettings || typeof state.taskSettings !== "object") state.taskSettings = {};
    state.taskSettings.dateMode = e.target.value === "all" ? "all" : "business";
    saveState();
  });

  // 2. Media Manager View listeners
  document.getElementById("media-search").addEventListener("input", renderMediaView);
  document.getElementById("btn-add-media").addEventListener("click", () => {
    const newMedia = {
      id: `med-${Date.now()}`,
      title: "Untitled Content",
      type: state.mediaTypes[0] || "Article",
      status: state.developmentPhases[0] || "Priority",
      platform: "",
      outline: "",
      content: "",
      media_tags: [],
      views: 0,
      clicks: 0,
      shares: 0,
      files: [],
      publishEvents: [],
      masterFiles: []
    };
    state.media.push(newMedia);
    saveState();
    renderMediaView();
    openContentDashboard(newMedia.id);
    setTimeout(() => {
      const titleInput = document.getElementById("dash-edit-title");
      if (titleInput) {
        titleInput.focus();
        titleInput.select();
      }
    }, 100);
  });
  document.getElementById("btn-clear-media-filters").addEventListener("click", clearMediaFilters);

  // Content Dashboard inline edits
  document.getElementById("dash-edit-title").addEventListener("input", saveActiveMediaChanges);
  document.getElementById("dash-edit-type").addEventListener("change", saveActiveMediaChanges);
  document.getElementById("dash-edit-status").addEventListener("change", saveActiveMediaChanges);
  document.getElementById("dash-edit-outline").addEventListener("input", saveActiveMediaChanges);
  document.getElementById("dash-edit-content").addEventListener("input", saveActiveMediaChanges);

  // Date Filter & Custom pickers event wiring
  document.getElementById("media-date-filter").addEventListener("change", renderMediaView);
  document.getElementById("media-start-date").addEventListener("change", renderMediaView);
  document.getElementById("media-end-date").addEventListener("change", renderMediaView);
  document.getElementById("btn-apply-custom-date").addEventListener("click", renderMediaView);

  // Sorting engagement event wiring
  document.getElementById("media-sort-by").addEventListener("change", renderMediaView);
  document.getElementById("btn-save-custom-sort").addEventListener("click", saveCurrentOrderAsCustom);

  // Drag over handler for media deck container
  const deck = document.getElementById("media-deck");
  if (deck) {
    deck.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggingCard = document.querySelector(".media-card.dragging");
      if (!draggingCard) return;
      
      const afterElement = getDragAfterElement(deck, e.clientX, e.clientY);
      if (afterElement === draggingCard) return;
      
      if (afterElement) {
        deck.insertBefore(draggingCard, afterElement);
      } else {
        deck.appendChild(draggingCard);
      }
    });
  }

  // Media Status filter row — scoped to #media-status-filters-bar, see note
  // on the matching sync loop in renderMediaView() for why this can't be a
  // bare ".media-status-filter" document-wide query.
  document.querySelectorAll("#media-status-filters-bar .media-status-filter").forEach(btn => {
    btn.addEventListener("click", () => {
      state.activeMediaFilterStatus = btn.getAttribute("data-status");
      renderMediaView();
    });
  });


  // 3. Campaign Manager View listeners
  document.getElementById("btn-campaigns-settings")?.addEventListener("click", openSettingsModal);

  // Sub-tabs switching
  document.getElementById("subtab-campaigns")?.addEventListener("click", () => {
    switchCampaignSubTab("campaigns");
  });
  document.getElementById("subtab-audiences")?.addEventListener("click", () => {
    switchCampaignSubTab("audiences");
  });
  document.getElementById("subtab-emailaccounts")?.addEventListener("click", () => {
    switchCampaignSubTab("emailAccounts");
  });
  document.getElementById("subtab-domains")?.addEventListener("click", () => {
    switchCampaignSubTab("domains");
  });

  // Email Accounts Manager listeners
  document.getElementById("btn-add-email-account")?.addEventListener("click", () => openEmailAccountModal());
  document.getElementById("email-account-search")?.addEventListener("input", renderEmailAccountsView);
  document.getElementById("email-account-sort-by")?.addEventListener("change", renderEmailAccountsView);
  document.getElementById("ea-modal-cancel")?.addEventListener("click", () => {
    document.getElementById("modal-email-account").classList.add("hidden");
  });
  document.getElementById("ea-modal-confirm")?.addEventListener("click", saveEmailAccountModal);
  document.getElementById("btn-ea-delete")?.addEventListener("click", () => {
    if (editingEmailAccountId) deleteEmailAccount(editingEmailAccountId);
  });
  document.getElementById("btn-ea-toggle-password")?.addEventListener("click", () => {
    const pwInput = document.getElementById("ea-password");
    const btn = document.getElementById("btn-ea-toggle-password");
    if (pwInput.type === "password") {
      pwInput.type = "text";
      btn.textContent = "🙈";
    } else {
      pwInput.type = "password";
      btn.textContent = "👁️";
    }
  });
  // Auto-fill the dashboard URL from the known default for whatever
  // Provider is picked. Always overwrites on an actual selection change —
  // switching providers means the old URL belonged to the old provider
  // anyway, so it should be replaced with the new one's default (or cleared
  // if that provider has none configured). A manual edit only survives as
  // long as the dropdown isn't touched again; re-picking a different
  // provider intentionally replaces it.
  document.getElementById("ea-provider")?.addEventListener("change", (e) => {
    const urlInput = document.getElementById("ea-dashboard-url");
    if (urlInput) {
      urlInput.value = state.emailProviderDefaultUrls[e.target.value] || "";
    }
  });

  // Domain Management listeners
  document.getElementById("btn-add-domain")?.addEventListener("click", () => openDomainModal());
  document.getElementById("domain-search")?.addEventListener("input", renderDomainManagementView);
  document.getElementById("domain-sort-by")?.addEventListener("change", renderDomainManagementView);
  document.getElementById("dom-modal-cancel")?.addEventListener("click", () => {
    document.getElementById("modal-domain").classList.add("hidden");
  });
  document.getElementById("dom-modal-confirm")?.addEventListener("click", saveDomainModal);
  document.getElementById("btn-dom-delete")?.addEventListener("click", () => {
    if (editingDomainId) deleteDomain(editingDomainId);
  });
  document.getElementById("btn-dom-toggle-password")?.addEventListener("click", () => {
    const pwInput = document.getElementById("dom-password");
    const btn = document.getElementById("btn-dom-toggle-password");
    if (pwInput.type === "password") {
      pwInput.type = "text";
      btn.textContent = "🙈";
    } else {
      pwInput.type = "password";
      btn.textContent = "👁️";
    }
  });
  // Auto-fill the dashboard URL fields from the known default for whatever
  // Registrar/Host is picked. Always overwrites on an actual selection
  // change — see the matching note on the Email Accounts Provider listener
  // above for why this shouldn't be guarded on "field is currently empty".
  document.getElementById("dom-registrar")?.addEventListener("change", (e) => {
    const urlInput = document.getElementById("dom-registrar-dashboard-url");
    if (urlInput) {
      urlInput.value = state.domainRegistrarDefaultUrls[e.target.value] || "";
    }
  });
  document.getElementById("dom-host")?.addEventListener("change", (e) => {
    const urlInput = document.getElementById("dom-host-dashboard-url");
    if (urlInput) {
      urlInput.value = state.domainHostDefaultUrls[e.target.value] || "";
    }
  });

  // Standalone Query Launch
  document.getElementById("btn-launch-standalone-query")?.addEventListener("click", () => {
    campaignViewSubState = "query";
    renderCampaignsView();
  });

  // Dashboard / Modals
  document.getElementById("btn-open-create-campaign")?.addEventListener("click", () => openCreateCampaignModal());
  document.getElementById("btn-clear-campaign-filters")?.addEventListener("click", clearCampaignsFilters);
  document.getElementById("btn-clear-campaign-tags")?.addEventListener("click", () => {
    activeCampaignFilterTags = [];
    renderCampaignDashboard();
  });
  document.getElementById("create-campaign-cancel")?.addEventListener("click", () => document.getElementById("modal-create-campaign").classList.add("hidden"));
  document.getElementById("create-campaign-confirm")?.addEventListener("click", saveNewCampaign);

  // Campaign Detail Modal Listeners
  document.getElementById("btn-campaign-detail-close-x")?.addEventListener("click", () => document.getElementById("modal-campaign-detail").classList.add("hidden"));
  document.getElementById("btn-campaign-detail-close")?.addEventListener("click", () => document.getElementById("modal-campaign-detail").classList.add("hidden"));
  document.getElementById("btn-campaign-detail-edit")?.addEventListener("click", () => {
    document.getElementById("modal-campaign-detail").classList.add("hidden");
    openCreateCampaignModal(viewingCampaignDetailId);
  });

  // Query View Listeners
  document.getElementById("btn-back-to-campaign-dash")?.addEventListener("click", () => {
    campaignViewSubState = "dashboard";
    renderCampaignsView();
  });
  document.getElementById("btn-clear-query")?.addEventListener("click", clearCampaignQueryFilters);
  document.getElementById("btn-run-query")?.addEventListener("click", runCampaignQuery);

  document.getElementById("query-company")?.addEventListener("keyup", (e) => { if(e.key === "Enter") runCampaignQuery(); });
  document.getElementById("query-title")?.addEventListener("keyup", (e) => { if(e.key === "Enter") runCampaignQuery(); });
  document.getElementById("query-seniority")?.addEventListener("change", runCampaignQuery);
  document.getElementById("query-geography")?.addEventListener("keyup", (e) => { if(e.key === "Enter") runCampaignQuery(); });
  document.getElementById("query-prospect-tags")?.addEventListener("keyup", (e) => { if(e.key === "Enter") runCampaignQuery(); });
  document.getElementById("query-company-tags")?.addEventListener("keyup", (e) => { if(e.key === "Enter") runCampaignQuery(); });
  document.getElementById("query-exclude-campaign")?.addEventListener("change", runCampaignQuery);

  document.getElementById("query-select-all-btn")?.addEventListener("click", () => {
    document.querySelectorAll("#query-contacts-checkboxes input[type='checkbox']").forEach(c => c.checked = true);
  });
  document.getElementById("query-deselect-all-btn")?.addEventListener("click", () => {
    document.querySelectorAll("#query-contacts-checkboxes input[type='checkbox']").forEach(c => c.checked = false);
  });

  // Standalone Query Actions (Save to list / Create new list)
  document.getElementById("btn-query-add-existing")?.addEventListener("click", addQueryContactsToExistingList);
  document.getElementById("btn-query-create-list")?.addEventListener("click", createListFromQueryContacts);

  // Audience Lists View Actions
  document.getElementById("btn-create-empty-audience")?.addEventListener("click", createEmptyAudienceList);
  // Note: audience inspector buttons (rename/archive/restore/copy/delete) are wired dynamically in renderAudienceInspector()

  // Audience CSV Import modal wiring
  document.getElementById("btn-open-audience-import")?.addEventListener("click", openAudienceImportModal);
  document.getElementById("btn-save-audience-import")?.addEventListener("click", saveAudienceImport);
  document.getElementById("btn-cancel-audience-import")?.addEventListener("click", closeAudienceImportModal);
  document.getElementById("btn-audience-import-close-x")?.addEventListener("click", closeAudienceImportModal);
  document.getElementById("btn-audience-import-choose-different")?.addEventListener("click", showAudienceImportUploadStep);

  const audienceImportDropzone = document.getElementById("audience-import-dropzone");
  const audienceImportFileInput = document.getElementById("audience-import-file-input");
  if (audienceImportDropzone && audienceImportFileInput) {
    audienceImportDropzone.addEventListener("click", () => audienceImportFileInput.click());
    audienceImportFileInput.addEventListener("change", (e) => {
      handleAudienceCSVFiles(e.target.files);
      e.target.value = ""; // allow re-selecting the same file later
    });
    setupDragDropHandlers(audienceImportDropzone, (files) => handleAudienceCSVFiles(files));
  }

  // Tags Choose Campaign modal trigger
  document.getElementById("btn-campaign-edit-tags")?.addEventListener("click", (e) => {
    e.preventDefault();
    openCampaignChooseTagsModal();
  });
  document.getElementById("campaign-display-tags")?.addEventListener("click", (e) => {
    e.preventDefault();
    openCampaignChooseTagsModal();
  });

  // Settings triggers
  document.getElementById("btn-media-settings").addEventListener("click", openSettingsModal);
  document.getElementById("btn-settings-close").addEventListener("click", () => {
    document.getElementById("modal-media-settings").classList.add("hidden");
  });
  document.getElementById("btn-settings-close-x").addEventListener("click", () => {
    document.getElementById("modal-media-settings").classList.add("hidden");
  });

  // Settings Add inline handlers
  document.getElementById("btn-add-type-opt").addEventListener("click", () => addSettingOption('mediaTypes', 'input-add-type'));
  document.getElementById("btn-add-phase-opt").addEventListener("click", () => addSettingOption('developmentPhases', 'input-add-phase'));
  document.getElementById("btn-add-platform-opt").addEventListener("click", () => addSettingOption('platforms', 'input-add-platform'));
  document.getElementById("btn-add-tag-opt").addEventListener("click", () => addSettingOption('media_tags', 'input-add-tag'));
  document.getElementById("btn-add-prospect-tag-opt")?.addEventListener("click", () => addSettingOption('prospect_tags', 'input-add-prospect-tag'));
  document.getElementById("btn-add-campaign-tag-opt")?.addEventListener("click", () => addSettingOption('campaign_tags', 'input-add-campaign-tag'));
  document.getElementById("btn-add-company-tag-opt")?.addEventListener("click", () => addSettingOption('company_tags', 'input-add-company-tag'));
  document.getElementById("btn-add-campaign-phase-opt")?.addEventListener("click", () => addSettingOption('campaignPhases', 'input-add-campaign-phase'));
  document.getElementById("btn-add-reachout-type-opt")?.addEventListener("click", () => addSettingOption('reachoutTypes', 'input-add-reachout-type'));
  document.getElementById("btn-add-email-provider-opt")?.addEventListener("click", () => addSettingOption('emailProviders', 'input-add-email-provider'));
  document.getElementById("btn-add-domain-registrar-opt")?.addEventListener("click", () => addSettingOption('domainRegistrars', 'input-add-domain-registrar'));
  document.getElementById("btn-add-domain-host-opt")?.addEventListener("click", () => addSettingOption('domainHosts', 'input-add-domain-host'));

  // Inspector Notes Saves
  document.getElementById("inspector-notes")?.addEventListener("input", () => {
    document.getElementById("btn-save-pros-notes").classList.remove("hidden");
  });
  document.getElementById("btn-save-pros-notes")?.addEventListener("click", () => {
    if (state.selectedProspectId) {
      const p = state.prospects.find(x => x.id === state.selectedProspectId);
      if (p) {
        p.notes = document.getElementById("inspector-notes").value.trim();
        saveState();
        document.getElementById("btn-save-pros-notes").classList.add("hidden");
      }
    }
  });

  document.getElementById("inspector-comp-notes")?.addEventListener("input", () => {
    document.getElementById("btn-save-comp-notes").classList.remove("hidden");
  });
  document.getElementById("btn-save-comp-notes")?.addEventListener("click", () => {
    if (selectedCompanyId) {
      const c = state.companies.find(x => x.id === selectedCompanyId);
      if (c) {
        c.notes = document.getElementById("inspector-comp-notes").value.trim();
        saveState();
        document.getElementById("btn-save-comp-notes").classList.add("hidden");
      }
    }
  });

  // Content Dashboard triggers
  document.getElementById("btn-dashboard-close").addEventListener("click", () => {
    document.getElementById("modal-content-dashboard").classList.add("hidden");
    selectedMediaDashboardId = null;
  });
  document.getElementById("btn-dashboard-close-x").addEventListener("click", () => {
    document.getElementById("modal-content-dashboard").classList.add("hidden");
    selectedMediaDashboardId = null;
  });

  // File Upload Drag & Drop triggers for Content Dashboard
  const dashDropzone = document.getElementById("dash-file-dropzone");
  const dashInput = document.getElementById("dash-file-input");
  dashDropzone.addEventListener("click", () => dashInput.click());
  dashInput.addEventListener("change", (e) => handleFilesSelect(e.target.files, "dash-files-list", "dash-files-container", true, "immediate"));
  setupDragDropHandlers(dashDropzone, (files) => handleFilesSelect(files, "dash-files-list", "dash-files-container", true, "immediate"));

  // Publish Event Modals triggers
  document.getElementById("btn-add-publish-event").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openPublishEventModal();
  });
  document.getElementById("pub-modal-cancel").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById("modal-publish-event").classList.add("hidden");
    editingPublishEventId = null;
  });
  document.getElementById("pub-modal-confirm").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    savePublishEvent();
  });

  // Associated Tags click & choose triggers
  // 1. Prospect Modal
  const btnProsEditTags = document.getElementById("btn-pros-edit-tags");
  if (btnProsEditTags) btnProsEditTags.addEventListener("click", (e) => { e.preventDefault(); openProspectChooseTagsModal(); });
  const prosDisplayTags = document.getElementById("pros-display-tags");
  if (prosDisplayTags) prosDisplayTags.addEventListener("click", (e) => { e.preventDefault(); openProspectChooseTagsModal(); });

  // 2. Campaign Form
  const btnCampEditTags = document.getElementById("btn-campaign-edit-tags");
  if (btnCampEditTags) btnCampEditTags.addEventListener("click", (e) => { e.preventDefault(); openCampaignChooseTagsModal(); });
  const campDisplayTags = document.getElementById("campaign-display-tags");
  if (campDisplayTags) campDisplayTags.addEventListener("click", (e) => { e.preventDefault(); openCampaignChooseTagsModal(); });

  // 3. Media Dashboard
  document.getElementById("dash-display-tags").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openChooseTagsModal();
  });
  document.getElementById("btn-dash-edit-tags").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openChooseTagsModal();
  });
  document.getElementById("btn-tags-close-x").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById("modal-choose-tags").classList.add("hidden");
  });
  document.getElementById("tags-modal-cancel").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById("modal-choose-tags").classList.add("hidden");
  });
  document.getElementById("tags-modal-confirm").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveChosenTags();
  });
  document.getElementById("btn-dash-add-tag").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    addChooseTagsNewTag();
  });

  // Link Master Files triggers
  document.getElementById("btn-add-master-file").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openLinkMasterFileModal();
  });
  document.getElementById("master-modal-cancel").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById("modal-master-file").classList.add("hidden");
    editingMasterFileId = null;
  });
  document.getElementById("master-modal-confirm").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveMasterFile();
  });
  document.getElementById("btn-master-paste-link")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    pasteMasterLinkFromClipboard();
  });

  // Link Master File file selector drag & drop triggers
  const masterDropzone = document.getElementById("master-file-dropzone");
  const masterInput = document.getElementById("master-file-input");
  masterDropzone.addEventListener("click", () => masterInput.click());
  masterInput.addEventListener("change", (e) => handleMasterFileSelect(e.target.files));
  setupDragDropHandlers(masterDropzone, (files) => handleMasterFileSelect(files));
}

// Dynamic Settings Modal Controller
function openSettingsModal() {
  renderSettingsLists();
  document.getElementById("modal-media-settings").classList.remove("hidden");
}

function renderSettingsLists() {
  // Helper to build a settings row with up/down move controls
  function buildRow(field, idx, label, totalLen) {
    const upDisabled = idx === 0 ? 'style="opacity:0.25;pointer-events:none;"' : '';
    const downDisabled = idx === totalLen - 1 ? 'style="opacity:0.25;pointer-events:none;"' : '';
    return `
      <div class="settings-item-row">
        <span onclick="editSettingOption('${field}', ${idx})" style="cursor: pointer; flex: 1;">${label}</span>
        <button onclick="moveSettingOption('${field}', ${idx}, -1)" title="Move Up" ${upDisabled}>↑</button>
        <button onclick="moveSettingOption('${field}', ${idx}, 1)" title="Move Down" ${downDisabled}>↓</button>
        <button onclick="deleteSettingOption('${field}', ${idx})">✕</button>
      </div>`;
  }

  // Same as buildRow, but with an inline "Default URL" input — used for the
  // three lists whose entries also carry a lookup URL (Email Providers,
  // Domain Registrars, Domain Hosts) that auto-fills the matching Dashboard
  // URL field when that entry is selected elsewhere in the app. The input's
  // "change" listener is wired separately after each section is built, via
  // the shared .settings-default-url-input class.
  function buildRowWithUrl(field, idx, label, totalLen, urlMapField) {
    const upDisabled = idx === 0 ? 'style="opacity:0.25;pointer-events:none;"' : '';
    const downDisabled = idx === totalLen - 1 ? 'style="opacity:0.25;pointer-events:none;"' : '';
    const rawName = state[field][idx];
    const currentUrl = (state[urlMapField] && state[urlMapField][rawName]) || "";
    return `
      <div class="settings-item-row" style="flex-wrap: wrap; row-gap: 6px;">
        <span onclick="editSettingOption('${field}', ${idx})" style="cursor: pointer; flex: 1 1 auto; min-width: 80px;">${label}</span>
        <input type="url" class="settings-default-url-input" data-map="${urlMapField}" data-name="${escapeHTML(rawName)}"
          value="${escapeHTML(currentUrl)}" placeholder="Default dashboard URL, editable"
          style="flex: 1 1 160px; min-width: 140px; font-size: 12px; background: rgba(0,0,0,0.2); border: 1px solid var(--color-border); color: var(--color-text-main); padding: 5px 8px; border-radius: 6px; outline: none;">
        <button onclick="moveSettingOption('${field}', ${idx}, -1)" title="Move Up" ${upDisabled}>↑</button>
        <button onclick="moveSettingOption('${field}', ${idx}, 1)" title="Move Down" ${downDisabled}>↓</button>
        <button onclick="deleteSettingOption('${field}', ${idx})">✕</button>
      </div>`;
  }

  // Wires the "change" (blur/commit) listener for every .settings-default-url-input
  // inside a just-rebuilt container. Called once per section after its rows
  // are added, since innerHTML += doesn't retain any previously-attached
  // listeners.
  function wireDefaultUrlInputs(container) {
    container.querySelectorAll(".settings-default-url-input").forEach(input => {
      input.addEventListener("change", () => {
        const mapField = input.dataset.map;
        const name = input.dataset.name;
        if (!state[mapField]) state[mapField] = {};
        state[mapField][name] = input.value.trim();
        saveState();
      });
      // Typing/selecting text inside the input shouldn't trigger the row's
      // click-to-rename handler on the sibling <span>.
      input.addEventListener("click", (e) => e.stopPropagation());
    });
  }

  // 1. Media Types
  const typeContainer = document.getElementById("list-settings-types");
  typeContainer.innerHTML = "";
  state.mediaTypes.forEach((t, idx) => {
    typeContainer.innerHTML += buildRow('mediaTypes', idx, escapeHTML(t), state.mediaTypes.length);
  });

  // 2. Development Phases
  const phaseContainer = document.getElementById("list-settings-phases");
  phaseContainer.innerHTML = "";
  state.developmentPhases.forEach((p, idx) => {
    phaseContainer.innerHTML += buildRow('developmentPhases', idx, escapeHTML(p), state.developmentPhases.length);
  });

  // 3. Platforms
  const platContainer = document.getElementById("list-settings-platforms");
  platContainer.innerHTML = "";
  state.platforms.forEach((pl, idx) => {
    platContainer.innerHTML += buildRow('platforms', idx, escapeHTML(pl), state.platforms.length);
  });

  // 4. Media Tags (referred to as "Tags" in the front-end)
  const tagContainer = document.getElementById("list-settings-tags");
  tagContainer.innerHTML = "";
  state.media_tags.forEach((tg, idx) => {
    tagContainer.innerHTML += buildRow('media_tags', idx, `# ${escapeHTML(tg)}`, state.media_tags.length);
  });

  // 5. Prospect Tags
  const pTagContainer = document.getElementById("list-settings-prospect-tags");
  if (pTagContainer) {
    pTagContainer.innerHTML = "";
    state.prospect_tags.forEach((tg, idx) => {
      pTagContainer.innerHTML += buildRow('prospect_tags', idx, `# ${escapeHTML(tg)}`, state.prospect_tags.length);
    });
  }

  // 6. Campaign Tags
  const cTagContainer = document.getElementById("list-settings-campaign-tags");
  if (cTagContainer) {
    cTagContainer.innerHTML = "";
    state.campaign_tags.forEach((tg, idx) => {
      cTagContainer.innerHTML += buildRow('campaign_tags', idx, `# ${escapeHTML(tg)}`, state.campaign_tags.length);
    });
  }

  // 7. Company Tags
  const compTagContainer = document.getElementById("list-settings-company-tags");
  if (compTagContainer) {
    compTagContainer.innerHTML = "";
    state.company_tags.forEach((tg, idx) => {
      compTagContainer.innerHTML += buildRow('company_tags', idx, `# ${escapeHTML(tg)}`, state.company_tags.length);
    });
  }

  // 8. Reachout Types
  const reachoutTypeContainer = document.getElementById("list-settings-reachout-types");
  if (reachoutTypeContainer) {
    reachoutTypeContainer.innerHTML = "";
    state.reachoutTypes.forEach((t, idx) => {
      reachoutTypeContainer.innerHTML += buildRow('reachoutTypes', idx, escapeHTML(t), state.reachoutTypes.length);
    });
  }

  // 9. Campaign Phases
  const campaignPhasesContainer = document.getElementById("list-settings-campaign-phases");
  if (campaignPhasesContainer) {
    campaignPhasesContainer.innerHTML = "";
    state.campaignPhases.forEach((t, idx) => {
      campaignPhasesContainer.innerHTML += buildRow('campaignPhases', idx, escapeHTML(t), state.campaignPhases.length);
    });
  }

  // 10. Email Providers (each with an editable Default URL, used to
  // auto-fill an Email Account's Dashboard URL when this provider is picked)
  const emailProvidersContainer = document.getElementById("list-settings-email-providers");
  if (emailProvidersContainer) {
    emailProvidersContainer.innerHTML = "";
    (state.emailProviders || []).forEach((t, idx) => {
      emailProvidersContainer.innerHTML += buildRowWithUrl('emailProviders', idx, escapeHTML(t), state.emailProviders.length, 'emailProviderDefaultUrls');
    });
    wireDefaultUrlInputs(emailProvidersContainer);
  }

  // 11. Domain Registrars (each with an editable Default URL, used to
  // auto-fill a Domain's Registrar Dashboard URL when this registrar is picked)
  const domainRegistrarsContainer = document.getElementById("list-settings-domain-registrars");
  if (domainRegistrarsContainer) {
    domainRegistrarsContainer.innerHTML = "";
    (state.domainRegistrars || []).forEach((t, idx) => {
      domainRegistrarsContainer.innerHTML += buildRowWithUrl('domainRegistrars', idx, escapeHTML(t), state.domainRegistrars.length, 'domainRegistrarDefaultUrls');
    });
    wireDefaultUrlInputs(domainRegistrarsContainer);
  }

  // 12. Domain Hosts (each with an editable Default URL, used to auto-fill
  // a Domain's Host Dashboard URL when this host is picked)
  const domainHostsContainer = document.getElementById("list-settings-domain-hosts");
  if (domainHostsContainer) {
    domainHostsContainer.innerHTML = "";
    (state.domainHosts || []).forEach((t, idx) => {
      domainHostsContainer.innerHTML += buildRowWithUrl('domainHosts', idx, escapeHTML(t), state.domainHosts.length, 'domainHostDefaultUrls');
    });
    wireDefaultUrlInputs(domainHostsContainer);
  }

  // 13. TaskHub due-date counting mode (Session 1.7). Not a list — a scalar
  // setting, so it is a <select> rather than an item list + inline add. Its
  // backup coverage is contract C4: the ["Task Date Mode", value] row in
  // prm_settings.csv, already written by Session 1.3.
  const taskDateModeSelect = document.getElementById("setting-task-date-mode");
  if (taskDateModeSelect) {
    taskDateModeSelect.value = (state.taskSettings && state.taskSettings.dateMode === "all") ? "all" : "business";
  }
}

function editSettingOption(field, idx) {
  const containerId = `list-settings-${field === 'mediaTypes' ? 'types' : field === 'developmentPhases' ? 'phases' : field === 'media_tags' ? 'tags' : field === 'prospect_tags' ? 'prospect-tags' : field === 'campaign_tags' ? 'campaign-tags' : field === 'company_tags' ? 'company-tags' : field === 'reachoutTypes' ? 'reachout-types' : field === 'campaignPhases' ? 'campaign-phases' : field === 'emailProviders' ? 'email-providers' : field === 'domainRegistrars' ? 'domain-registrars' : field === 'domainHosts' ? 'domain-hosts' : field}`;
  const container = document.getElementById(containerId);
  if (!container) return;
  const row = container.children[idx];
  if (!row) return;
  const span = row.querySelector('span');
  if (!span) return;
  const original = state[field][idx];

  const input = document.createElement('input');
  input.type = 'text';
  input.value = original;
  input.className = 'settings-edit-input';
  input.style.flex = '1';

  let finished = false;

  function commit() {
    if (finished) return;
    const newVal = input.value.trim();
    if (!newVal || newVal === original) {
      cancel();
      return;
    }
    const duplicate = state[field].some((v, i) => i !== idx && v.toLowerCase() === newVal.toLowerCase());
    if (duplicate) {
      input.classList.add('duplicate-error');
      setTimeout(() => input.classList.remove('duplicate-error'), 500);
      return;
    }
    finished = true;
    state[field][idx] = newVal;

    const cleanOrig = original.trim().toLowerCase();

    // Propagate rename to all database records
    if (field === "media_tags") {
      state.media.forEach(m => {
        if (m.media_tags) {
          m.media_tags = m.media_tags.map(t => t.trim().toLowerCase() === cleanOrig ? newVal : t);
        }
        if (m.tags) {
          m.tags = m.tags.map(t => t.trim().toLowerCase() === cleanOrig ? newVal : t);
        }
      });
    } else if (field === "prospect_tags") {
      state.prospects.forEach(p => {
        if (p.tags) {
          p.tags = p.tags.map(t => t.trim().toLowerCase() === cleanOrig ? newVal : t);
        }
      });
    } else if (field === "company_tags") {
      state.companies.forEach(c => {
        if (c.tags) {
          c.tags = c.tags.map(t => t.trim().toLowerCase() === cleanOrig ? newVal : t);
        }
      });
    } else if (field === "campaign_tags") {
      state.campaigns.forEach(c => {
        if (c.tags) {
          c.tags = c.tags.map(t => t.trim().toLowerCase() === cleanOrig ? newVal : t);
        }
      });
    } else if (field === "mediaTypes") {
      state.media.forEach(m => {
        if (m.type && m.type.trim().toLowerCase() === cleanOrig) {
          m.type = newVal;
        }
      });
    } else if (field === "developmentPhases") {
      state.media.forEach(m => {
        if (m.status && m.status.trim().toLowerCase() === cleanOrig) {
          m.status = newVal;
        }
      });
    } else if (field === "platforms") {
      state.media.forEach(m => {
        if (m.platform && m.platform.trim().toLowerCase() === cleanOrig) {
          m.platform = newVal;
        }
      });
    } else if (field === "reachoutTypes") {
      state.prospects.forEach(p => {
        if (p.history) {
          p.history.forEach(h => {
            if (h.type && h.type.trim().toLowerCase() === cleanOrig) {
              h.type = newVal;
            }
          });
        }
      });
    } else if (field === "campaignPhases") {
      state.campaigns.forEach(c => {
        if (c.status && c.status.trim().toLowerCase() === cleanOrig) {
          c.status = newVal;
        }
      });
    } else if (field === "emailProviders") {
      (state.emailAccounts || []).forEach(a => {
        if (a.provider && a.provider.trim().toLowerCase() === cleanOrig) {
          a.provider = newVal;
        }
      });
    } else if (field === "domainRegistrars") {
      (state.domains || []).forEach(d => {
        if (d.registrar && d.registrar.trim().toLowerCase() === cleanOrig) {
          d.registrar = newVal;
        }
      });
    } else if (field === "domainHosts") {
      (state.domains || []).forEach(d => {
        if (d.host && d.host.trim().toLowerCase() === cleanOrig) {
          d.host = newVal;
        }
      });
    }

    // For the three lists that carry a Default URL lookup keyed by name
    // (see buildRowWithUrl), move that entry over to the new name so a
    // rename doesn't silently orphan the URL the user configured.
    const urlMapFieldByList = { emailProviders: "emailProviderDefaultUrls", domainRegistrars: "domainRegistrarDefaultUrls", domainHosts: "domainHostDefaultUrls" };
    const urlMapField = urlMapFieldByList[field];
    if (urlMapField && state[urlMapField] && Object.prototype.hasOwnProperty.call(state[urlMapField], original)) {
      state[urlMapField][newVal] = state[urlMapField][original];
      delete state[urlMapField][original];
    }

    saveState();
    renderSettingsLists();
    renderMediaView();
    renderApp();
  }

  function cancel() {
    if (finished) return;
    finished = true;
    if (row.contains(input)) {
      row.replaceChild(span, input);
    }
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      commit();
    } else if (e.key === 'Escape') {
      cancel();
    }
  });

  input.addEventListener('blur', () => {
    const newVal = input.value.trim();
    const duplicate = state[field].some((v, i) => i !== idx && v.toLowerCase() === newVal.toLowerCase());
    if (duplicate) {
      cancel();
    } else {
      commit();
    }
  });

  row.replaceChild(input, span);
  input.focus();
  input.select();
}

window.editSettingOption = editSettingOption;

function addSettingOption(field, inputId) {
  const input = document.getElementById(inputId);
  const val = input.value.trim();
  if (!val) return;
  if (state[field].includes(val)) {
    alert("This option already exists!");
    return;
  }
  state[field].push(val);
  input.value = "";
  saveState();
  renderSettingsLists();
  renderMediaView();
}

function deleteSettingOption(field, idx) {
  const item = state[field][idx];
  if (!item) return;
  const ok = confirm(`Delete "${item}" from managed list?`);
  if (!ok) return;
  state[field].splice(idx, 1);

  const cleanItem = item.trim().toLowerCase();

  // Clean up references in database records to prevent resurrection on backup/restore
  if (field === "media_tags") {
    state.media.forEach(m => {
      if (m.media_tags) {
        m.media_tags = m.media_tags.filter(t => t.trim().toLowerCase() !== cleanItem);
      }
      if (m.tags) {
        m.tags = m.tags.filter(t => t.trim().toLowerCase() !== cleanItem);
      }
    });
  } else if (field === "prospect_tags") {
    state.prospects.forEach(p => {
      if (p.tags) {
        p.tags = p.tags.filter(t => t.trim().toLowerCase() !== cleanItem);
        if (p.tags.length === 0) p.tags = ["No Prospect Tag"];
      }
    });
  } else if (field === "company_tags") {
    state.companies.forEach(c => {
      if (c.tags) {
        c.tags = c.tags.filter(t => t.trim().toLowerCase() !== cleanItem);
        if (c.tags.length === 0) c.tags = ["No Company Tag"];
      }
    });
  } else if (field === "campaign_tags") {
    state.campaigns.forEach(c => {
      if (c.tags) {
        c.tags = c.tags.filter(t => t.trim().toLowerCase() !== cleanItem);
      }
    });
  } else if (field === "mediaTypes") {
    const fallbackType = state.mediaTypes[0] || "Article";
    state.media.forEach(m => {
      if (m.type && m.type.trim().toLowerCase() === cleanItem) {
        m.type = fallbackType;
      }
    });
  } else if (field === "developmentPhases") {
    const fallbackPhase = state.developmentPhases[0] || "Idea";
    state.media.forEach(m => {
      if (m.status && m.status.trim().toLowerCase() === cleanItem) {
        m.status = fallbackPhase;
      }
    });
  } else if (field === "platforms") {
    state.media.forEach(m => {
      if (m.platform && m.platform.trim().toLowerCase() === cleanItem) {
        m.platform = "";
      }
    });
  } else if (field === "reachoutTypes") {
    state.prospects.forEach(p => {
      if (p.history) {
        p.history.forEach(h => {
          if (h.type && h.type.trim().toLowerCase() === cleanItem) {
            h.type = "Note";
          }
        });
      }
    });
  } else if (field === "campaignPhases") {
    const fallbackPhase = state.campaignPhases[0] || "Development";
    state.campaigns.forEach(c => {
      if (c.status && c.status.trim().toLowerCase() === cleanItem) {
        c.status = fallbackPhase;
      }
    });
  } else if (field === "emailProviders") {
    const fallbackProvider = state.emailProviders[0] || "";
    (state.emailAccounts || []).forEach(a => {
      if (a.provider && a.provider.trim().toLowerCase() === cleanItem) {
        a.provider = fallbackProvider;
      }
    });
  } else if (field === "domainRegistrars") {
    const fallbackRegistrar = state.domainRegistrars[0] || "";
    (state.domains || []).forEach(d => {
      if (d.registrar && d.registrar.trim().toLowerCase() === cleanItem) {
        d.registrar = fallbackRegistrar;
      }
    });
  } else if (field === "domainHosts") {
    const fallbackHost = state.domainHosts[0] || "";
    (state.domains || []).forEach(d => {
      if (d.host && d.host.trim().toLowerCase() === cleanItem) {
        d.host = fallbackHost;
      }
    });
  }

  // Clean up the matching Default URL entry (see buildRowWithUrl) so it
  // doesn't linger as an orphaned, unreachable key in state.
  const urlMapFieldByListForDelete = { emailProviders: "emailProviderDefaultUrls", domainRegistrars: "domainRegistrarDefaultUrls", domainHosts: "domainHostDefaultUrls" };
  const deleteUrlMapField = urlMapFieldByListForDelete[field];
  if (deleteUrlMapField && state[deleteUrlMapField]) {
    delete state[deleteUrlMapField][item];
  }

  saveState();
  renderSettingsLists();
  renderMediaView();
  renderApp(); // Ensure all SPA components refresh
}

// Expose deleteSettingOption globally for inline HTML onclick calls
window.deleteSettingOption = deleteSettingOption;

function moveSettingOption(field, idx, direction) {
  const arr = state[field];
  if (!arr) return;
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= arr.length) return;
  // Swap elements
  const temp = arr[idx];
  arr[idx] = arr[newIdx];
  arr[newIdx] = temp;
  saveState();
  renderSettingsLists();
  renderMediaView();
}

window.moveSettingOption = moveSettingOption;

// Global variable tracking open dashboard
let selectedMediaDashboardId = null;

// Collapsible text toggle
function toggleDashboardContent() {
  const wrapperEl = document.getElementById("dash-display-content-wrapper");
  const btn = document.getElementById("btn-dash-toggle-content");
  if (wrapperEl.classList.contains("retracted")) {
    wrapperEl.classList.remove("retracted");
    btn.textContent = "Show Less ↑";
  } else {
    wrapperEl.classList.add("retracted");
    btn.textContent = "Show More ↓";
  }
}

// Drag & Drop handlers helper
function setupDragDropHandlers(dropzone, onFilesDropped) {
  ["dragenter", "dragover"].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("drag-active");
    }, false);
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("drag-active");
    }, false);
  });

  dropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      onFilesDropped(files);
    }
  }, false);
}

// Multi-file Selection & Listing Controller
async function handleFilesSelect(files, listId, containerId, isEditable, mode = "pending") {
  if (!files || files.length === 0) return;
  
  if (mode === "immediate") {
    // Save directly to IndexedDB & sync to media
    const m = state.media.find(x => x.id === selectedMediaDashboardId);
    if (!m) return;
    if (!m.files) m.files = [];
    
    for (const file of files) {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await saveFileBlob(fileId, file).catch(err => console.error("Error saving file:", err));
      m.files.push({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
    saveState();
    renderFilesList(containerId, listId, m.files, isEditable);
    renderMediaView();
  } else {
    // Save to pendingAttachedFiles memory array
    for (const file of files) {
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      pendingAttachedFiles.push({
        id: fileId,
        file: file,
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
    
    // Gather both saved m.files and pending memory files for rendering
    const existingFiles = (editingMediaId && state.media.find(x => x.id === editingMediaId)?.files) || [];
    const allFiles = [...existingFiles, ...pendingAttachedFiles];
    renderFilesList(containerId, listId, allFiles, isEditable);
  }
}

function renderFilesList(containerId, listId, filesArray, isEditable) {
  const container = document.getElementById(containerId);
  const list = document.getElementById(listId);
  
  list.innerHTML = "";
  
  if (filesArray.length === 0) {
    container.classList.add("hidden");
    return;
  }
  
  container.classList.remove("hidden");
  
  filesArray.forEach(file => {
    const row = document.createElement("div");
    row.className = "file-item-row";
    
    let fileIcon = "📄";
    const ext = file.name.split(".").pop().toLowerCase();
    if (["mp4", "avi", "mov", "mkv", "webm"].includes(ext)) fileIcon = "🎥";
    else if (["mp3", "wav", "ogg", "m4a", "flac"].includes(ext)) fileIcon = "🎵";
    else if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) fileIcon = "🖼️";
    else if (["pdf"].includes(ext)) fileIcon = "📕";
    else if (["zip", "rar", "tar", "gz"].includes(ext)) fileIcon = "📦";
    
    row.innerHTML = `
      <div class="file-item-left">
        <span class="file-item-icon">${fileIcon}</span>
        <span class="file-item-name" title="${escapeHTML(file.name)}">${escapeHTML(file.name)}</span>
        <span class="file-item-size">(${formatFileSize(file.size)})</span>
      </div>
      <div class="file-item-actions">
        <button type="button" class="file-action-btn download-btn" title="Download file">📥</button>
        ${isEditable ? `<button type="button" class="file-action-btn delete-btn" title="Delete file">🗑️</button>` : ""}
      </div>
    `;
    
    row.querySelector(".download-btn").addEventListener("click", () => {
      triggerFileDownload(file);
    });
    
    if (isEditable) {
      row.querySelector(".delete-btn").addEventListener("click", () => {
        triggerFileDeletion(file, containerId, listId);
      });
    }
    
    list.appendChild(row);
  });
}

async function triggerFileDownload(fileMetadata) {
  const pending = pendingAttachedFiles.find(x => x.id === fileMetadata.id);
  if (pending && pending.file) {
    downloadBlob(pending.name, pending.file);
    return;
  }
  
  try {
    const blob = await getFileBlob(fileMetadata.id);
    if (blob) {
      downloadBlob(fileMetadata.name, blob);
    } else {
      alert("File not found in local browser storage cache.");
    }
  } catch (err) {
    console.error("Error retrieving file:", err);
    alert("Error downloading file.");
  }
}

function downloadBlob(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function triggerFileDeletion(fileMetadata, containerId, listId) {
  const ok = confirm(`Are you sure you want to permanently delete file "${fileMetadata.name}"?`);
  if (!ok) return;
  
  const pendingIndex = pendingAttachedFiles.findIndex(x => x.id === fileMetadata.id);
  if (pendingIndex > -1) {
    pendingAttachedFiles.splice(pendingIndex, 1);
    const existingFiles = (editingMediaId && state.media.find(x => x.id === editingMediaId)?.files) || [];
    const allFiles = [...existingFiles, ...pendingAttachedFiles];
    renderFilesList(containerId, listId, allFiles, true);
    return;
  }
  
  const mediaId = editingMediaId || selectedMediaDashboardId;
  const m = state.media.find(x => x.id === mediaId);
  if (m && m.files) {
    m.files = m.files.filter(x => x.id !== fileMetadata.id);
    await deleteFileBlob(fileMetadata.id).catch(err => console.error("Error deleting from IndexedDB:", err));
    saveState();
    
    const allFiles = [...(m.files || []), ...pendingAttachedFiles];
    renderFilesList(containerId, listId, allFiles, true);
    renderMediaView();
  }
}

// Content Dashboard Controller
function openContentDashboard(id) {
  selectedMediaDashboardId = id;
  const m = state.media.find(x => x.id === id);
  if (!m) return;

  // Database Migration for Master Files
  if (!m.masterFiles) {
    m.masterFiles = [];
  }

  // Database Migration for Publish Events if not present
  if (!m.publishEvents) {
    m.publishEvents = [];
    if (m.publishDate || m.platform) {
      m.publishEvents.push({
        id: `pub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: m.publishDate || new Date().toISOString().split("T")[0],
        platform: m.platform || "General",
        url: "",
        views: m.views || 0,
        clicks: m.clicks || 0,
        comments: m.comments || m.shares || 0
      });
    }
  }

  // Populate form fields for inline editing
  document.getElementById("dash-edit-title").value = m.title || "";

  const typeSelect = document.getElementById("dash-edit-type");
  typeSelect.innerHTML = "";
  state.mediaTypes.forEach(t => {
    const selected = (t === m.type) ? "selected" : "";
    typeSelect.innerHTML += `<option value="${t}" ${selected}>${t}</option>`;
  });

  const statusSelect = document.getElementById("dash-edit-status");
  statusSelect.innerHTML = "";
  state.developmentPhases.forEach(p => {
    const selected = (p === m.status) ? "selected" : "";
    const icon = getDevelopmentPhaseIcon(p);
    statusSelect.innerHTML += `<option value="${p}" ${selected}>${icon ? icon + " " : ""}${p}</option>`;
  });

  document.getElementById("dash-edit-outline").value = m.outline || "";
  document.getElementById("dash-edit-content").value = m.content || "";
  
  // Render tags badges
  const tagsContainer = document.getElementById("dash-display-tags");
  tagsContainer.innerHTML = "";
  if (m.media_tags && m.media_tags.length > 0) {
    m.media_tags.forEach(t => {
      tagsContainer.innerHTML += `<span class="tag-badge"># ${escapeHTML(t)}</span>`;
    });
  } else {
    tagsContainer.innerHTML = `<span style="color:var(--color-text-muted);font-size:12px;">No tags linked.</span>`;
  }

  // Render master files list for Content Dashboard
  renderMasterFilesList(m);

  // Render files list for Content Dashboard
  renderFilesList("dash-files-container", "dash-files-list", m.files || [], true);

  // Render publish events table listing
  renderPublishEventsList(m);

  // Open the Dashboard Modal
  document.getElementById("modal-content-dashboard").classList.remove("hidden");
}

function saveActiveMediaChanges() {
  if (!selectedMediaDashboardId) return;
  const m = state.media.find(x => x.id === selectedMediaDashboardId);
  if (!m) return;

  m.title = document.getElementById("dash-edit-title").value.trim() || "Untitled Content";
  m.type = document.getElementById("dash-edit-type").value;
  m.status = document.getElementById("dash-edit-status").value;
  m.outline = document.getElementById("dash-edit-outline").value.trim();
  m.content = document.getElementById("dash-edit-content").value.trim();

  saveState();
  renderMediaView();
}

// Publish Events Rendering & CRUD Controllers
function renderPublishEventsList(m) {
  const tbody = document.getElementById("publish-events-list-body");
  tbody.innerHTML = "";
  
  if (!m.publishEvents || m.publishEvents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--color-text-muted);padding:16px;">No publish events recorded yet.</td></tr>`;
    return;
  }
  
  const sortedEvents = [...m.publishEvents].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  sortedEvents.forEach(ev => {
    const tr = document.createElement("tr");
    const linkBadge = ev.url ? `<a href="${escapeHTML(ev.url)}" target="_blank" class="media-file-badge" style="display:inline-flex; align-items:center; gap:4px; font-size:11px; text-decoration:none;">🔗 View ↗</a>` : `<span style="color:var(--color-text-muted);">—</span>`;
    
    const expirationText = ev.expirationDate ? ev.expirationDate : `<span style="color:var(--color-text-muted);">—</span>`;
    const isExpired = ev.expirationDate && new Date(ev.expirationDate).setHours(23, 59, 59, 999) < new Date();
    const expirationStyled = isExpired ? `<span class="tag-badge" style="background:#ef4444; color:#fff; border-color:#ef4444; font-size:11px; padding:2px 6px; border-radius:4px;">Expired (${ev.expirationDate})</span>` : expirationText;

    const evCampaign = ev.campaignId ? state.campaigns.find(c => c.id === ev.campaignId) : null;
    const campaignCell = evCampaign
      ? `<span class="tag-badge" style="font-size:11px;">${escapeHTML(evCampaign.title)}</span>`
      : `<span style="color:var(--color-text-muted);">—</span>`;

    tr.innerHTML = `
      <td style="font-weight:600; cursor:pointer; color:var(--color-primary); text-decoration:underline; white-space:nowrap;" class="pub-date-link">${ev.date}</td>
      <td>${expirationStyled}</td>
      <td><strong>${escapeHTML(ev.platform)}</strong></td>
      <td>${campaignCell}</td>
      <td>${linkBadge}</td>
      <td>${(ev.views || 0).toLocaleString()}</td>
      <td>${(ev.clicks || 0).toLocaleString()}</td>
      <td>${(ev.comments || 0).toLocaleString()}</td>
      <td style="text-align:center;">
        <button class="delete-interaction-btn delete-pub-btn" title="Delete publish event">✕</button>
      </td>
    `;
    
    tr.querySelector(".pub-date-link").addEventListener("click", () => {
      openPublishEventModal(m.id, ev.id);
    });
    
    tr.querySelector(".delete-pub-btn").addEventListener("click", () => {
      deletePublishEvent(m.id, ev.id);
    });
    
    tbody.appendChild(tr);
  });
}

function openPublishEventModal(mediaId = null, eventId = null) {
  const modal = document.getElementById("modal-publish-event");
  const title = document.getElementById("publish-event-modal-title");
  
  if (!mediaId) mediaId = selectedMediaDashboardId;
  
  editingPublishEventId = eventId;
  selectedMediaDashboardId = mediaId;
  
  const m = state.media.find(x => x.id === mediaId);
  if (!m) return;
  
  // Populate platform select (ensure "Campaign" is always an option)
  const platformSelect = document.getElementById("pub-platform");
  platformSelect.innerHTML = "";
  const platformOptions = state.platforms.includes("Campaign")
    ? state.platforms
    : ["Campaign", ...state.platforms];
  platformOptions.forEach(pl => {
    platformSelect.innerHTML += `<option value="${pl}">${pl}</option>`;
  });

  // Populate campaign select with Launch-status campaigns
  const campaignSelect = document.getElementById("pub-campaign");
  campaignSelect.innerHTML = `<option value="">-- No Campaign --</option>`;
  (state.campaigns || []).filter(c => c.status === "Launch").forEach(c => {
    campaignSelect.innerHTML += `<option value="${c.id}">${escapeHTML(c.title)}</option>`;
  });

  if (eventId) {
    title.textContent = "Edit Publish Event";
    const ev = m.publishEvents.find(x => x.id === eventId);
    if (ev) {
      document.getElementById("pub-date").value = ev.date;
      document.getElementById("pub-platform").value = ev.platform;
      document.getElementById("pub-url").value = ev.url || "";
      document.getElementById("pub-views").value = ev.views || 0;
      document.getElementById("pub-clicks").value = ev.clicks || 0;
      document.getElementById("pub-comments").value = ev.comments || 0;
      document.getElementById("pub-expiration-date").value = ev.expirationDate || "";
      campaignSelect.value = ev.campaignId || "";
    }
  } else {
    title.textContent = "Add Publish Event";
    document.getElementById("pub-date").value = new Date().toISOString().split("T")[0];
    document.getElementById("pub-platform").value = state.platforms[0] || "";
    document.getElementById("pub-url").value = "";
    document.getElementById("pub-views").value = 0;
    document.getElementById("pub-clicks").value = 0;
    document.getElementById("pub-comments").value = 0;
    document.getElementById("pub-expiration-date").value = "";
    campaignSelect.value = "";
  }

  // Selecting a campaign → auto-set platform to "Campaign"
  campaignSelect.addEventListener("change", () => {
    if (campaignSelect.value) {
      platformSelect.value = "Campaign";
    }
  });

  // Changing platform away from "Campaign" → clear campaign selection
  platformSelect.addEventListener("change", () => {
    if (platformSelect.value !== "Campaign") {
      campaignSelect.value = "";
    }
  });

  modal.classList.remove("hidden");
}

function savePublishEvent() {
  if (!selectedMediaDashboardId) return;
  
  const m = state.media.find(x => x.id === selectedMediaDashboardId);
  if (!m) return;
  
  const date = document.getElementById("pub-date").value;
  const expirationDate = document.getElementById("pub-expiration-date").value;
  const platform = document.getElementById("pub-platform").value;
  const url = document.getElementById("pub-url").value.trim();
  const views = parseInt(document.getElementById("pub-views").value) || 0;
  const clicks = parseInt(document.getElementById("pub-clicks").value) || 0;
  const comments = parseInt(document.getElementById("pub-comments").value) || 0;
  const campaignId = document.getElementById("pub-campaign").value || "";

  if (!date) {
    alert("Publish Date is required!");
    return;
  }

  if (!m.publishEvents) m.publishEvents = [];

  if (editingPublishEventId) {
    const ev = m.publishEvents.find(x => x.id === editingPublishEventId);
    if (ev) {
      ev.date = date;
      ev.expirationDate = expirationDate;
      ev.platform = platform;
      ev.url = url;
      ev.views = views;
      ev.clicks = clicks;
      ev.comments = comments;
      ev.campaignId = campaignId;
    }
  } else {
    m.publishEvents.push({
      id: `pub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date,
      expirationDate,
      platform,
      url,
      views,
      clicks,
      comments,
      campaignId
    });
  }
  
  // Aggregate stats across all publish events
  let totalViews = 0;
  let totalClicks = 0;
  let totalComments = 0;
  
  m.publishEvents.forEach(ev => {
    totalViews += ev.views || 0;
    totalClicks += ev.clicks || 0;
    totalComments += ev.comments || 0;
  });
  
  m.views = totalViews;
  m.clicks = totalClicks;
  m.comments = totalComments;
  m.shares = totalComments;
  
  // Set main platform/date to the most recent publish event
  if (m.publishEvents.length > 0) {
    const sorted = [...m.publishEvents].sort((a, b) => new Date(b.date) - new Date(a.date));
    m.platform = sorted[0].platform;
    m.publishDate = sorted[0].date;
  }
  
  saveState();
  document.getElementById("modal-publish-event").classList.add("hidden");
  editingPublishEventId = null;
  
  openContentDashboard(m.id);
  renderMediaView();
}

function deletePublishEvent(mediaId, eventId) {
  const ok = confirm("Are you sure you want to permanently delete this publish event?");
  if (!ok) return;
  
  const m = state.media.find(x => x.id === mediaId);
  if (m && m.publishEvents) {
    m.publishEvents = m.publishEvents.filter(x => x.id !== eventId);
    
    // Re-aggregate
    let totalViews = 0;
    let totalClicks = 0;
    let totalComments = 0;
    
    m.publishEvents.forEach(ev => {
      totalViews += ev.views || 0;
      totalClicks += ev.clicks || 0;
      totalComments += ev.comments || 0;
    });
    
    m.views = totalViews;
    m.clicks = totalClicks;
    m.comments = totalComments;
    m.shares = totalComments;
    
    if (m.publishEvents.length > 0) {
      const sorted = [...m.publishEvents].sort((a, b) => new Date(b.date) - new Date(a.date));
      m.platform = sorted[0].platform;
      m.publishDate = sorted[0].date;
    } else {
      m.platform = "";
      m.publishDate = "";
    }
    
    saveState();
    openContentDashboard(m.id);
    renderMediaView();
  }
}

/* ==========================================================================
   ✏️ CHOOSE ASSOCIATED TAGS CONTROLLER
   ========================================================================== */

function renderProspectTagsPreview() {
  const container = document.getElementById("pros-display-tags");
  if (!container) return;
  container.innerHTML = "";
  if (currentProspectTags.length > 0) {
    currentProspectTags.forEach(t => {
      container.innerHTML += `<span class="tag-badge"># ${escapeHTML(t)}</span>`;
    });
  } else {
    container.innerHTML = `<span style="color:var(--color-text-muted);font-size:12px;">No tags linked.</span>`;
  }
}

function openProspectChooseTagsModal() {
  tagSelectionTarget = "prospect";
  renderTagsChecklistGrid(state.prospect_tags, currentProspectTags);
  document.getElementById("modal-choose-tags").classList.remove("hidden");
}

function renderCompanyTagsPreview() {
  const container = document.getElementById("comp-display-tags");
  if (!container) return;
  container.innerHTML = "";
  if (currentCompanyTags.length > 0) {
    currentCompanyTags.forEach(t => {
      container.innerHTML += `<span class="tag-badge"># ${escapeHTML(t)}</span>`;
    });
  } else {
    container.innerHTML = `<span style="color:var(--color-text-muted);font-size:12px;">No tags linked.</span>`;
  }
}

function openCompanyChooseTagsModal() {
  tagSelectionTarget = "company";
  renderTagsChecklistGrid(state.company_tags, currentCompanyTags);
  document.getElementById("modal-choose-tags").classList.remove("hidden");
}

function renderCampaignTagsPreview() {
  const container = document.getElementById("campaign-display-tags");
  if (!container) return;
  container.innerHTML = "";
  if (currentCampaignTags.length > 0) {
    currentCampaignTags.forEach(t => {
      container.innerHTML += `<span class="tag-badge"># ${escapeHTML(t)}</span>`;
    });
  } else {
    container.innerHTML = `<span style="color:var(--color-text-muted);font-size:12px;">No tags linked.</span>`;
  }
}

function openCampaignChooseTagsModal() {
  tagSelectionTarget = "campaign";
  renderTagsChecklistGrid(state.campaign_tags, currentCampaignTags);
  document.getElementById("modal-choose-tags").classList.remove("hidden");
}

function renderTagsChecklistGrid(availableTags, selectedTags) {
  const checklistGrid = document.getElementById("tags-checklist-grid");
  checklistGrid.innerHTML = "";
  document.getElementById("input-dash-new-tag").value = "";

  availableTags.forEach((tag) => {
    const isChecked = selectedTags.includes(tag);
    checklistGrid.innerHTML += `
      <label class="tag-checkbox-row">
        <input type="checkbox" value="${escapeHTML(tag)}" ${isChecked ? "checked" : ""}>
        <span class="tag-checkbox-label"># ${escapeHTML(tag)}</span>
      </label>
    `;
  });
}

function openChooseTagsModalForProspectInspector() {
  const p = state.prospects.find(x => x.id === state.selectedProspectId);
  if (!p) return;
  tagSelectionTarget = "prospect-inspector";
  renderTagsChecklistGrid(state.prospect_tags, p.tags || []);
  document.getElementById("modal-choose-tags").classList.remove("hidden");
}

function openChooseTagsModalForCompanyInspector() {
  const c = state.companies.find(x => x.id === selectedCompanyId);
  if (!c) return;
  tagSelectionTarget = "company-inspector";
  renderTagsChecklistGrid(state.company_tags, c.tags || []);
  document.getElementById("modal-choose-tags").classList.remove("hidden");
}

function openChooseTagsModal(mediaId = null) {
  tagSelectionTarget = "media";
  if (!mediaId) mediaId = selectedMediaDashboardId;
  selectedMediaDashboardId = mediaId;
  const m = state.media.find(x => x.id === mediaId);
  if (!m) return;

  renderTagsChecklistGrid(state.media_tags, m.media_tags || []);
  document.getElementById("modal-choose-tags").classList.remove("hidden");
}

function saveChosenTags() {
  const checkedCheckboxes = document.querySelectorAll("#tags-checklist-grid input[type='checkbox']:checked");
  const selectedTags = Array.from(checkedCheckboxes).map(cb => cb.value);

  if (tagSelectionTarget === "prospect") {
    currentProspectTags = selectedTags;
    renderProspectTagsPreview();
    document.getElementById("modal-choose-tags").classList.add("hidden");
    return;
  }
  
  if (tagSelectionTarget === "company") {
    currentCompanyTags = selectedTags;
    renderCompanyTagsPreview();
    document.getElementById("modal-choose-tags").classList.add("hidden");
    return;
  }
  
  if (tagSelectionTarget === "campaign") {
    currentCampaignTags = selectedTags;
    renderCampaignTagsPreview();
    document.getElementById("modal-choose-tags").classList.add("hidden");
    return;
  }

  if (tagSelectionTarget === "prospect-inspector") {
    const p = state.prospects.find(x => x.id === state.selectedProspectId);
    if (p) {
      p.tags = selectedTags.length ? selectedTags : ["No Prospect Tag"];
      saveState();
      renderInspector();
      renderProspectsView();
      refreshAqAfterEdit();
    }
    document.getElementById("modal-choose-tags").classList.add("hidden");
    return;
  }

  if (tagSelectionTarget === "company-inspector") {
    const c = state.companies.find(x => x.id === selectedCompanyId);
    if (c) {
      c.tags = selectedTags.length ? selectedTags : ["No Company Tag"];
      saveState();
      renderInspector();
      renderProspectsView();
      refreshAqAfterEdit();
    }
    document.getElementById("modal-choose-tags").classList.add("hidden");
    return;
  }

  if (!selectedMediaDashboardId) return;
  const m = state.media.find(x => x.id === selectedMediaDashboardId);
  if (!m) return;

  m.media_tags = selectedTags;
  if (m.tags) {
    delete m.tags;
  }

  saveState();
  document.getElementById("modal-choose-tags").classList.add("hidden");
  openContentDashboard(m.id);
  renderMediaView();
}

function addChooseTagsNewTag() {
  const input = document.getElementById("input-dash-new-tag");
  const val = input.value.trim();
  if (!val) return;

  let tagList;
  if (tagSelectionTarget === "prospect") tagList = state.prospect_tags;
  else if (tagSelectionTarget === "company") tagList = state.company_tags;
  else if (tagSelectionTarget === "campaign") tagList = state.campaign_tags;
  else tagList = state.media_tags;

  const exists = tagList.some(t => t.toLowerCase() === val.toLowerCase());
  if (exists) {
    alert("This tag already exists!");
    return;
  }

  tagList.push(val);
  input.value = "";
  saveState();

  const checkedCheckboxes = document.querySelectorAll("#tags-checklist-grid input[type='checkbox']:checked");
  const checkedVals = Array.from(checkedCheckboxes).map(cb => cb.value);
  checkedVals.push(val);

  renderTagsChecklistGrid(tagList, checkedVals);
}

/* ==========================================================================
   📂 MASTER FILES CRUD & RENDER CONTROLLERS
   ========================================================================== */

function renderMasterFilesList(m) {
  const tbody = document.getElementById("master-files-list-body");
  tbody.innerHTML = "";

  if (!m.masterFiles || m.masterFiles.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:16px;">No master files linked. Click "+ Add Master File" to link one!</td></tr>`;
    return;
  }

  m.masterFiles.forEach(file => {
    const tr = document.createElement("tr");

    let fileIcon = "📄";
    const ext = file.name.split(".").pop().toLowerCase();
    if (["mp4", "avi", "mov", "mkv", "webm"].includes(ext)) fileIcon = "🎥";
    else if (["mp3", "wav", "ogg", "m4a", "flac"].includes(ext)) fileIcon = "🎵";
    else if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) fileIcon = "🖼️";
    else if (["doc", "docx", "txt", "rtf", "odt"].includes(ext)) fileIcon = "📝";
    else if (["pdf"].includes(ext)) fileIcon = "📕";
    else if (["zip", "rar", "tar", "gz"].includes(ext)) fileIcon = "📦";

    let referenceHTML = "";
    let sourceText = "";
    let metaHTML = "";

    // Decide openability from the actual stored string, not just the saved
    // `type` field — entries linked before the smarter URL detection was
    // added may have been saved as "path" even though they're really a web
    // link (e.g. a bare "docs.google.com/..." paste), which used to mean
    // they'd never get a working open link. Re-checking here self-heals
    // those without needing to re-edit each one.
    const isOpenableLink = file.type === "cloud" || (file.type !== "upload" && looksLikeUrl(file.pathOrUrl));

    if (isOpenableLink) {
      const href = ensureUrlProtocol(file.pathOrUrl);
      sourceText = "☁️ Cloud Link";
      referenceHTML = `<a href="${escapeHTML(href)}" target="_blank" rel="noopener" class="media-file-badge" style="display:inline-flex; align-items:center; gap:4px; text-decoration:none; font-size:12px;" title="Opens in a new tab">${fileIcon} ${escapeHTML(file.name)} ↗</a>`;
      metaHTML = `<span style="color:var(--color-text-muted); font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; max-width:120px;" title="${escapeHTML(file.pathOrUrl)}">${escapeHTML(file.pathOrUrl)}</span>`;
    } else if (file.type === "path") {
      sourceText = "🗂️ Hard Drive";
      referenceHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-weight:600; color:var(--color-text-main); font-size:12px;" class="cursor-pointer" title="Double click to copy path">${fileIcon} ${escapeHTML(file.name)}</span>
          <button class="copy-path-btn" title="Copy exact path to clipboard">Copy Path</button>
        </div>
      `;
      metaHTML = `<span style="color:var(--color-text-muted); font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; max-width:120px;" title="${escapeHTML(file.pathOrUrl)}">${escapeHTML(file.pathOrUrl)}</span>`;
    } else if (file.type === "upload") {
      sourceText = "💻 Local Upload";
      referenceHTML = `<span style="font-weight:600; color:var(--color-secondary); text-decoration:underline; cursor:pointer; font-size:12px;" class="trigger-download-btn">${fileIcon} ${escapeHTML(file.name)}</span>`;
      metaHTML = `<span style="color:var(--color-text-muted); font-size:11px;">${formatFileSize(file.size || 0)}</span>`;
    }

    tr.innerHTML = `
      <td>${referenceHTML}</td>
      <td><strong>${sourceText}</strong></td>
      <td>${metaHTML}</td>
      <td style="text-align:center;">
        <button class="file-action-btn download-btn edit-master-btn" style="color:var(--color-primary);" title="Change file mapping/link">✏️</button>
      </td>
      <td style="text-align:center;">
        <button class="delete-interaction-btn unlink-master-btn" title="Unlink and remove listing">✕</button>
      </td>
    `;

    // Wire up events. Uses the same isOpenableLink check as the rendering
    // above (not just file.type) so a "path"-typed row that actually
    // rendered as a clickable link (self-healed) doesn't try to wire up a
    // Copy Path button that was never rendered.
    if (!isOpenableLink && file.type === "path") {
      tr.querySelector(".copy-path-btn").addEventListener("click", () => {
        navigator.clipboard.writeText(file.pathOrUrl).then(() => {
          alert(`Copied local file path to clipboard:\n"${file.pathOrUrl}"\n\nYou can now paste it into Windows Explorer or the Win+R Run dialog to open the file.`);
        }).catch(err => {
          console.error("Clipboard copy failed:", err);
          alert(`Exact Path: ${file.pathOrUrl}`);
        });
      });
      tr.querySelector("span.cursor-pointer").addEventListener("dblclick", () => {
        navigator.clipboard.writeText(file.pathOrUrl).then(() => {
          alert(`Copied path to clipboard: ${file.pathOrUrl}`);
        });
      });
    } else if (file.type === "upload") {
      tr.querySelector(".trigger-download-btn").addEventListener("click", () => {
        triggerFileDownload({ id: file.fileId, name: file.name });
      });
    }

    tr.querySelector(".edit-master-btn").addEventListener("click", () => {
      openLinkMasterFileModal(m.id, file.id);
    });

    tr.querySelector(".unlink-master-btn").addEventListener("click", () => {
      unlinkMasterFile(m.id, file.id);
    });

    tbody.appendChild(tr);
  });
}

function openLinkMasterFileModal(mediaId = null, masterFileId = null) {
  const modal = document.getElementById("modal-master-file");
  const title = document.getElementById("master-file-modal-title");

  if (!mediaId) mediaId = selectedMediaDashboardId;
  selectedMediaDashboardId = mediaId;
  editingMasterFileId = masterFileId;

  // Reset form
  document.getElementById("master-file-name").value = "";
  document.getElementById("master-local-path").value = "";
  document.getElementById("master-file-input").value = "";

  const m = state.media.find(x => x.id === mediaId);
  if (!m) return;

  if (masterFileId) {
    title.textContent = "Modify Link Master File";
    const file = m.masterFiles.find(x => x.id === masterFileId);
    if (file) {
      document.getElementById("master-file-name").value = file.name;
      // Legacy "upload" entries (from before this became link-only) have no
      // path/URL to show — leave the location field blank; saving will
      // convert them to a plain link reference and drop the stored blob.
      document.getElementById("master-local-path").value = file.type === "upload" ? "" : (file.pathOrUrl || "");
    }
  } else {
    title.textContent = "Link Master File";
  }

  modal.classList.remove("hidden");
}

// Choosing a file here never uploads or stores its bytes anywhere — it only
// reads the file's name to help fill in the name/location fields, since
// browsers don't expose a real filesystem path from a picker for security
// reasons. The user can still type/paste a full path if they want one that's
// directly pasteable into Explorer.
function handleMasterFileSelect(files) {
  if (!files || files.length === 0) return;
  const file = files[0];

  const nameInput = document.getElementById("master-file-name");
  if (!nameInput.value.trim()) {
    nameInput.value = file.name;
  }
  const locationInput = document.getElementById("master-local-path");
  if (!locationInput.value.trim()) {
    locationInput.value = file.name;
  }
}

// Reads whatever the user last copied (e.g. a Google Drive/Docs "Get link"
// share URL) straight into the Location field, so they don't have to click
// into the field and hit Ctrl+V manually. Clipboard reads require a secure
// context (https/localhost) and a user gesture — clicking this button
// counts — but some browsers still block it outright, so this fails
// gracefully with a message rather than a silent no-op.
async function pasteMasterLinkFromClipboard() {
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    alert("This browser doesn't support reading the clipboard directly — paste into the field manually with Ctrl+V (or Cmd+V on Mac) instead.");
    return;
  }
  try {
    const text = (await navigator.clipboard.readText()).trim();
    if (!text) {
      alert("Clipboard is empty — copy a link (e.g. Google Drive's \"Get link\") first, then click Paste.");
      return;
    }
    const locationInput = document.getElementById("master-local-path");
    locationInput.value = text;
    locationInput.dispatchEvent(new Event("input"));

    // Best-effort name auto-fill from the pasted link, same as picking a
    // file does — only if the Name field is still blank. Vantage has no way
    // to fetch the real document title from a link (that would need Google's
    // API), so this is just a readable fallback derived from the URL itself.
    const nameInput = document.getElementById("master-file-name");
    if (!nameInput.value.trim() && looksLikeUrl(text)) {
      const guessedName = guessNameFromUrl(text);
      if (guessedName) nameInput.value = guessedName;
    }
  } catch (err) {
    console.error("Clipboard read failed:", err);
    alert("Couldn't read the clipboard (the browser may have blocked it) — paste into the field manually with Ctrl+V (or Cmd+V on Mac) instead.");
  }
}

// Pulls a rough, readable name out of a URL for auto-fill purposes only.
// Skips generic trailing segments Google Docs/Drive links commonly end in
// ("edit", "view", "preview", etc.) and file IDs, since those aren't
// meaningful names — falls back to null (leave the Name field for the user
// to fill in) rather than showing something like "edit" or a raw doc ID.
function guessNameFromUrl(url) {
  try {
    const clean = url.split(/[?#]/)[0].replace(/\/+$/, "");
    const segments = clean.split("/").filter(Boolean);
    const genericSegments = new Set(["edit", "view", "preview", "share", "d", "file", "folders", "document", "spreadsheets", "presentation"]);
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = decodeURIComponent(segments[i]);
      // Skip generic path words and long opaque IDs (Drive file IDs are
      // long alphanumeric strings with no spaces/readable words in them).
      if (genericSegments.has(seg.toLowerCase())) continue;
      if (/^[a-zA-Z0-9_-]{15,}$/.test(seg)) continue;
      if (seg.includes(".")) return seg; // looks like an actual filename
      if (seg.length > 2) return seg.replace(/[-_]+/g, " ");
    }
  } catch (err) {
    // fall through
  }
  return null;
}

async function saveMasterFile() {
  if (!selectedMediaDashboardId) return;
  const m = state.media.find(x => x.id === selectedMediaDashboardId);
  if (!m) return;

  let name = document.getElementById("master-file-name").value.trim();
  let pathOrUrl = document.getElementById("master-local-path").value.trim();

  if (!pathOrUrl) {
    alert("Please paste a link or file location!");
    return;
  }

  // No more manual type picker — a link is a "cloud" reference if it looks
  // like a URL (even without "http(s)://" typed in front — people often
  // paste a bare "docs.google.com/..." straight from the address bar), and
  // gets normalized with a protocol so it actually opens when clicked.
  // Otherwise it's treated as a local filesystem path reference.
  const type = looksLikeUrl(pathOrUrl) ? "cloud" : "path";
  if (type === "cloud") {
    pathOrUrl = ensureUrlProtocol(pathOrUrl);
  }

  if (!name) {
    name = pathOrUrl.split(/[\\/]/).pop() || (type === "cloud" ? "Cloud Master File Reference" : "Local Master Reference");
  }

  if (!m.masterFiles) m.masterFiles = [];

  if (editingMasterFileId) {
    const file = m.masterFiles.find(x => x.id === editingMasterFileId);
    if (file) {
      // Converting a legacy uploaded file to a link reference — clean up
      // its stored blob since we're dropping the upload path entirely.
      if (file.type === "upload" && file.fileId) {
        await deleteFileBlob(file.fileId).catch(err => console.error("Error cleaning up legacy Master File blob:", err));
      }
      file.name = name;
      file.type = type;
      file.pathOrUrl = pathOrUrl;
      file.fileId = "";
      file.size = 0;
      file.dateAdded = new Date().toISOString().split("T")[0];
    }
  } else {
    m.masterFiles.push({
      id: `mfile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      pathOrUrl,
      fileId: "",
      size: 0,
      dateAdded: new Date().toISOString().split("T")[0]
    });
  }

  saveState();
  document.getElementById("modal-master-file").classList.add("hidden");
  editingMasterFileId = null;

  openContentDashboard(m.id);
  renderMediaView();
}

async function unlinkMasterFile(mediaId, masterFileId) {
  const ok = confirm("Are you sure you want to remove this linked master file? Stored uploads will be permanently removed.");
  if (!ok) return;

  const m = state.media.find(x => x.id === mediaId);
  if (m && m.masterFiles) {
    const file = m.masterFiles.find(x => x.id === masterFileId);
    if (file && file.type === "upload" && file.fileId) {
      // Delete IndexedDB binary stably
      await deleteFileBlob(file.fileId).catch(err => console.error("Error cleaning up Master File blob:", err));
    }

    m.masterFiles = m.masterFiles.filter(x => x.id !== masterFileId);
    saveState();
    openContentDashboard(m.id);
    renderMediaView();
  }
}
