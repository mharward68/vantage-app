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
  developmentPhases: ["Priority", "Idea", "Draft", "In Review", "Finished", "Published", "Archive"],
  platforms: ["YouTube", "Substack", "Medium", "LinkedIn", "Twitter", "General"],
  media_tags: ["Frontend", "React", "Fintech", "Developer", "General"],
  company_tags: ["Enterprise", "SMB", "Agency", "Startup"],
  theme: "dark"
};

// Global Modals tracking variables
let editingProspectId = null;
let editingMediaId = null;
let pendingAttachedFiles = []; // Memory tracker for files during media modal session
let editingPublishEventId = null; // Track current publish event being edited
let editingMasterFileId = null; // Track master file being edited/linked
let pendingMasterFile = null; // Memory tracker for local file uploaded in master file modal

// Tag selection globals
let currentProspectTags = [];
let currentCompanyTags = [];
let currentCampaignTags = [];
let tagSelectionTarget = "media"; // "media", "prospect", "company", or "campaign"

/* ==========================================================================
   💾 INDEXEDDB MANAGER (VantageDB) FOR MULTI-FILE BINARY STORAGE
   ========================================================================== */
let fileDB;

function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VantagePRMFiles", 1);
    request.onupgradeneeded = function(e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id" });
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
  if (!state.companies) state.companies = [];
  if (!state.prospects) state.prospects = [];
  if (!state.media) state.media = [];
  if (!state.campaigns) state.campaigns = [];
  if (!state.audienceLists) state.audienceLists = [];
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
  const targetPhases = ["Priority", "Idea", "Draft", "In Review", "Finished", "Published", "Archive"];
  
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
    
    // Ensure all standard target phases are present in the list
    targetPhases.forEach(tp => {
      if (!state.developmentPhases.includes(tp)) {
        state.developmentPhases.push(tp);
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
    state.reachoutTypes = ["Email", "Call", "Campaign", "LinkedIn", "In-Person", "Entered into Vantage", "Added to Vantage"];
  } else {
    if (!state.reachoutTypes.includes("Entered into Vantage")) {
      state.reachoutTypes.push("Entered into Vantage");
    }
    if (!state.reachoutTypes.includes("Added to Vantage")) {
      state.reachoutTypes.push("Added to Vantage");
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
          prospectIds: c.prospectIds || []
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
  downloadCSVFile(`vantage_data_backup_prospects_${getBackupTimestamp()}.csv`, csv);
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
  downloadCSVFile(`vantage_data_backup_media_${getBackupTimestamp()}.csv`, csv);
}

function exportCampaignsCSV() {
  const csv = convertToCSV(state.campaigns,
    ["ID", "Title", "Sequence Media ID", "Launch Date", "Status", "Tags", "Audience List ID", "Intended Audience", "Goal Summary"],
    c => [c.id, c.title, c.sequenceMediaId, c.launchDate, c.status, (c.tags || []).join(";"), c.audienceListId || "", c.intendedAudience || "", c.goalSummary || ""]
  );
  downloadCSVFile(`vantage_data_backup_campaigns_${getBackupTimestamp()}.csv`, csv);
}

function exportAudienceListsCSV() {
  const csv = convertToCSV(state.audienceLists || [],
    ["ID", "Name", "Prospect IDs"],
    al => [al.id, al.name, (al.prospectIds || []).join(";")]
  );
  downloadCSVFile(`vantage_data_backup_audience_lists_${getBackupTimestamp()}.csv`, csv);
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
  downloadCSVFile(`vantage_data_backup_companies_${getBackupTimestamp()}.csv`, csv);
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
  if (state.customSortOrder && state.customSortOrder.length > 0) {
    rows.push(["Custom Sort Order", state.customSortOrder.join(";")]);
  }
  
  return convertToCSV(rows, ["Option Type", "Option Value"], r => r);
}

function exportSettingsCSV() {
  const csv = generateSettingsCSV();
  downloadCSVFile(`vantage_data_backup_settings_${getBackupTimestamp()}.csv`, csv);
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
    ["ID", "Name", "Prospect IDs"],
    al => [al.id, al.name, (al.prospectIds || []).join(";")]
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
  
  const settingsCSV = generateSettingsCSV();
  
  zip.file("prm_prospects.csv", prospectsCSV);
  zip.file("prm_media_content.csv", mediaCSV);
  zip.file("prm_campaigns.csv", campaignsCSV);
  zip.file("prm_audience_lists.csv", audienceListsCSV);
  zip.file("prm_companies.csv", companiesCSV);
  zip.file("prm_settings.csv", settingsCSV);
  
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
    downloadBlob(`vantage_data_backup_${getBackupTimestamp()}.zip`, content);
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
      prospectIds: prospectIds
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

  let sawMediaTypes = false;
  let sawDevelopmentPhases = false;
  let sawPlatforms = false;
  let sawMediaTags = false;
  let sawProspectTags = false;
  let sawCampaignTags = false;
  let sawCampaignPhases = false;
  let sawCompanyTags = false;
  let sawReachoutTypes = false;
  
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
    } else if (typeLower === "custom sort order") {
      state.customSortOrder = val ? val.split(";").map(id => id.trim()).filter(Boolean) : [];
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
}

function handleRestoreFile(e) {
  const file = e.target.files[0];
  if (!file) return;
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
          alert(`Successfully cleared and restored tables from ZIP:\n- ${restoredModules.join("\n- ")}`);
          e.target.value = "";
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
      } else if (fileName.includes("setting")) {
        restoreSettingsFromCSV(text);
        restoredName = "Media Hub Settings ⚙️";
      } else {
        alert("Unable to detect target table from CSV filename. Name file 'prospects.csv', 'media.csv', 'campaigns.csv', 'audience_lists.csv', 'companies.csv', or 'settings.csv'.");
        return;
      }
      
      ensureStateDefaults();
      saveState();
      alert(`Successfully cleared and restored table: ${restoredName}`);
      e.target.value = "";
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
        } else if (fileName.includes("setting")) {
          restoreSettingsFromCSV(csvText);
          restoredName = "Media Hub Settings ⚙️";
        } else {
          alert("Unable to detect target table from Excel filename. Name file 'prospects.xlsx', 'media.xlsx', 'campaigns.xlsx', 'audience_lists.xlsx', 'companies.xlsx', or 'settings.xlsx'.");
          return;
        }
        
        ensureStateDefaults();
        saveState();
        alert(`Successfully cleared and restored table: ${restoredName}`);
        e.target.value = "";
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
    "data-management": "Data Management"
  };
  
  const subtitles = {
    "dashboard": "",
    "prospects": "",
    "media": "Formulate articles, videos, and newsletters from raw ideas to finished, published resources.",
    "campaigns": "",
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
  
  let totalReach = 0;
  state.prospects.forEach(p => totalReach += (p.history ? p.history.length : 0));
  document.getElementById("stat-reachouts-count").textContent = totalReach;

  // Recent reachouts feed (flatten and sort chronologically)
  let reachouts = [];
  state.prospects.forEach(p => {
    if (p.history) {
      p.history.forEach(h => {
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
          <span class="rank-platform">${m.type} • ${escapeHTML(m.platform || "Not Published")}</span>
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

function populateTagChooser() {
  const select = document.getElementById("prospect-tag-chooser");
  if (!select || select.tagName !== "SELECT") return;
  
  // Save current selection
  const selected = Array.from(select.selectedOptions).map(opt => opt.value);
  
  const allCompanyTagsStr = Array.from(new Set(state.companies.flatMap(c => c.tags || []))).map(t => t.trim()).filter(Boolean);
  const allProspectTagsStr = Array.from(new Set(state.prospects.flatMap(p => p.tags || []))).map(t => t.trim()).filter(Boolean);
  
  const allTags = Array.from(new Set([...allCompanyTagsStr, ...allProspectTagsStr])).sort();
  
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
        selectCompany(c.id);
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

        matchQuery = fullName.includes(query) || 
               companyName.includes(query) || 
               title.includes(query) || 
               tags.includes(query);
      }
      return matchGeo && matchProsTags && matchCompTagsForPros && matchQuery;
    });
    }
  }

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
        selectProspect(p.id);
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

function renderInspector(isBlankState = false) {
  const emptyCard = document.getElementById("prospect-inspector-empty");
  const prospectCard = document.getElementById("prospect-inspector");
  const companyCard = document.getElementById("company-inspector");

  // Hide all initially
  emptyCard.classList.add("hidden");
  prospectCard.classList.add("hidden");
  companyCard.classList.add("hidden");
  
  if (isBlankState) {
    emptyCard.classList.remove("hidden");
    return;
  }

  if (state.selectedProspectId) {
    const current = state.prospects.find(p => p.id === state.selectedProspectId);
    if (!current) {
      emptyCard.classList.remove("hidden");
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

    // Render memberships
    const memEl = document.getElementById("inspector-memberships");
    if (memEl) {
      memEl.innerHTML = "";
      const matchedLists = state.audienceLists.filter(al => al.prospectIds && al.prospectIds.includes(current.id));
      const matchedCampaigns = state.campaigns.filter(c => {
        return matchedLists.some(al => al.id === c.audienceListId);
      });
      if (matchedLists.length === 0 && matchedCampaigns.length === 0) {
        memEl.innerHTML = `<div style="color:var(--color-text-muted);font-style:italic;">Not included in any audience lists or outreach campaigns.</div>`;
      } else {
        if (matchedLists.length > 0) {
          const listTitle = document.createElement("div");
          listTitle.style.fontWeight = "600";
          listTitle.style.color = "var(--color-secondary)";
          listTitle.style.marginBottom = "4px";
          listTitle.textContent = "Audience Lists:";
          memEl.appendChild(listTitle);
          const listContainer = document.createElement("div");
          listContainer.style.display = "flex";
          listContainer.style.flexWrap = "wrap";
          listContainer.style.gap = "6px";
          listContainer.style.marginBottom = "10px";
          matchedLists.forEach(al => {
            const span = document.createElement("span");
            span.className = "tag-badge";
            span.style.background = "rgba(6, 182, 212, 0.15)";
            span.style.color = "var(--color-secondary)";
            span.style.border = "1px solid rgba(6, 182, 212, 0.3)";
            span.textContent = al.name;
            listContainer.appendChild(span);
          });
          memEl.appendChild(listContainer);
        }
        if (matchedCampaigns.length > 0) {
          const campTitle = document.createElement("div");
          campTitle.style.fontWeight = "600";
          campTitle.style.color = "var(--color-primary)";
          campTitle.style.marginBottom = "4px";
          campTitle.textContent = "Outreach Campaigns:";
          memEl.appendChild(campTitle);
          const campContainer = document.createElement("div");
          campContainer.style.display = "flex";
          campContainer.style.flexWrap = "wrap";
          campContainer.style.gap = "6px";
          matchedCampaigns.forEach(c => {
            const span = document.createElement("span");
            span.className = "tag-badge";
            span.style.background = "rgba(79, 70, 229, 0.15)";
            span.style.color = "var(--color-primary)";
            span.style.border = "1px solid rgba(79, 70, 229, 0.3)";
            span.textContent = `${c.title} (${c.status})`;
            campContainer.appendChild(span);
          });
          memEl.appendChild(campContainer);
        }
      }
    }
  } else if (selectedCompanyId) {
    const c = state.companies.find(x => x.id === selectedCompanyId);
    if (!c) {
      emptyCard.classList.remove("hidden");
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
    
  } else {
    emptyCard.classList.remove("hidden");
  }
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
  // Synchronize status filter buttons active classes
  document.querySelectorAll(".media-status-filter").forEach(btn => {
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
    
    // Icons mapping
    const typeIcons = {
      "Article": "📄 Articles",
      "Video": "🎥 Videos",
      "Newsletter": "✉️ Newsletters"
    };
    
    state.mediaTypes.forEach(t => {
      const typeBtn = document.createElement("button");
      typeBtn.className = `media-type-filter ${state.activeMediaFilterType === t ? "active-filter" : ""}`;
      typeBtn.setAttribute("data-type", t);
      typeBtn.textContent = typeIcons[t] || `📁 ${t}`;
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

      // Status indicator icons
      const statusIcons = { 
        "Priority": "🌟 Priority", 
        "Idea": "💡 Idea", 
        "Draft": "📝 Draft", 
        "In Review": "🔍 In Review", 
        "Finished": "✅ Finished", 
        "Published": "📢 Published",
        "Archive": "📦 Archive"
      };

      const statusOptionsHtml = state.developmentPhases.map(p => {
        const selected = (p === m.status) ? "selected" : "";
        return `<option value="${p}" ${selected}>${statusIcons[p] || p}</option>`;
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
          <span class="media-type-badge">${m.type}</span>
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

function clearCampaignsFilters() {
  activeCampaignFilterTags = [];
  activeCampaignFilterPhase = "all";
  renderCampaignsView();
}

/* ==========================================================================
   🎯 RENDER VIEW: CAMPAIGN MANAGER
   ========================================================================== */

let campaignViewSubState = "dashboard"; // "dashboard" or "query" or "audiences"
let activeCampaignFilterPhase = "all";
let activeCampaignFilterTags = [];
let selectedAudienceListId = null;
let viewingCampaignDetailId = null;
let editingCampaignId = null;

function switchCampaignSubTab(tab) {
  const cBtn = document.getElementById("subtab-campaigns");
  const aBtn = document.getElementById("subtab-audiences");
  const dash = document.getElementById("campaign-dashboard-view");
  const auds = document.getElementById("audience-lists-view");
  const queryView = document.getElementById("campaign-query-view");
  
  if (tab === "campaigns") {
    cBtn?.classList.add("active-filter");
    aBtn?.classList.remove("active-filter");
    dash?.classList.remove("hidden");
    auds?.classList.add("hidden");
    queryView?.classList.add("hidden");
    campaignViewSubState = "dashboard";
    renderCampaignDashboard();
  } else if (tab === "audiences") {
    cBtn?.classList.remove("active-filter");
    aBtn?.classList.add("active-filter");
    dash?.classList.add("hidden");
    auds?.classList.remove("hidden");
    queryView?.classList.add("hidden");
    campaignViewSubState = "audiences";
    renderAudienceListsView();
  }
}

function renderCampaignsView() {
  const dash = document.getElementById("campaign-dashboard-view");
  const auds = document.getElementById("audience-lists-view");
  const queryView = document.getElementById("campaign-query-view");

  if (campaignViewSubState === "query") {
    dash?.classList.add("hidden");
    auds?.classList.add("hidden");
    queryView?.classList.remove("hidden");
    renderCampaignQueryView();
  } else if (campaignViewSubState === "audiences") {
    switchCampaignSubTab("audiences");
  } else {
    switchCampaignSubTab("campaigns");
  }
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
  const tableBody = document.getElementById("audiences-table-body");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  if (state.audienceLists.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:24px; color:var(--color-text-muted);">No audience lists created yet. Run a query or click Create List!</td></tr>`;
  } else {
    state.audienceLists.forEach(aud => {
      const size = (aud.prospectIds || []).length;
      const isActive = selectedAudienceListId === aud.id;
      const tr = document.createElement("tr");
      if (isActive) tr.className = "active-row";
      
      tr.innerHTML = `
        <td><strong>${escapeHTML(aud.name)}</strong></td>
        <td>${size} contacts</td>
        <td style="text-align:right;">
          <button class="text-btn btn-aud-inspect-trig" style="margin-right:8px;">👀 View</button>
          <button class="text-btn btn-aud-delete-trig" style="color:var(--color-danger);">🗑️ Delete</button>
        </td>
      `;

      tr.querySelector(".btn-aud-inspect-trig").addEventListener("click", (e) => {
        e.stopPropagation();
        selectedAudienceListId = aud.id;
        renderAudienceListsView();
      });
      tr.querySelector(".btn-aud-delete-trig").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteAudienceListById(aud.id);
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

  // Re-populate prospect datalist inside inspector
  const dl = document.getElementById("prospects-datalist");
  if (dl) {
    dl.innerHTML = "";
    state.prospects.forEach(p => {
      dl.innerHTML += `<option value="${escapeHTML(p.firstName)} ${escapeHTML(p.lastName)} (${escapeHTML(p.id)})"></option>`;
    });
  }

  if (!aud) {
    inspectName.textContent = "Select an Audience List";
    inspectSize.textContent = "No audience selected";
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--color-text-muted); padding:32px;">Click "View" on any audience list to inspect and edit contacts.</td></tr>`;
    return;
  }

  inspectName.textContent = aud.name;
  inspectSize.textContent = `${(aud.prospectIds || []).length} contacts stored`;

  tbody.innerHTML = "";
  const ids = aud.prospectIds || [];

  if (ids.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--color-text-muted); padding:24px;">This audience list is empty. Add a contact above.</td></tr>`;
  } else {
    ids.forEach(pid => {
      const p = state.prospects.find(x => x.id === pid);
      if (!p) return;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${escapeHTML(p.firstName)} ${escapeHTML(p.lastName)}</strong></td>
        <td>${escapeHTML(p.title || "—")}</td>
        <td>${escapeHTML(getCompanyName(p.companyId) || "—")}</td>
        <td style="text-align:center;">
          <button class="delete-interaction-btn btn-aud-remove-contact" data-pid="${p.id}" title="Remove contact from list">✕</button>
        </td>
      `;

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
    prospectIds: []
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

  aud.name = newName.trim();
  saveState();
  renderAudienceListsView();
}

function deleteSelectedAudienceList() {
  if (selectedAudienceListId) {
    deleteAudienceListById(selectedAudienceListId);
  }
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
    prospectIds: pids
  });

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
  t = t.replace(/\bceo\b/g, "chief executive officer");
  t = t.replace(/\bcto\b/g, "chief technology officer");
  t = t.replace(/\bcmo\b/g, "chief marketing officer");
  t = t.replace(/\bcfo\b/g, "chief financial officer");
  t = t.replace(/\bcoo\b/g, "chief operating officer");
  t = t.replace(/\bpres\.?\b/g, "president");
  return t;
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
      tags: currentProspectTags.length ? [...currentProspectTags] : ["No Prospect Tag"],
      history: []
    };
    state.prospects.push(newP);
    state.selectedProspectId = newP.id;
  }

  saveState();
  document.getElementById("modal-prospect").classList.add("hidden");
  renderProspectsView();
}

function deleteProspect() {
  if (!state.selectedProspectId) return;
  const p = state.prospects.find(x => x.id === state.selectedProspectId);
  const ok = confirm(`Are you sure you want to permanently delete contact ${p.firstName} ${p.lastName}?`);
  if (!ok) return;

  state.prospects = state.prospects.filter(x => x.id !== state.selectedProspectId);
  state.selectedProspectId = null;
  saveState();
  renderProspectsView();
}

function deleteCompany() {
  if (!selectedCompanyId) return;
  const c = state.companies.find(x => x.id === selectedCompanyId);
  if (!c) return;
  const ok = confirm(`Are you sure you want to permanently delete company ${c.name}? Associated contacts will be unassigned.`);
  if (!ok) return;

  state.companies = state.companies.filter(x => x.id !== selectedCompanyId);
  state.prospects.forEach(p => {
    if (p.companyId === selectedCompanyId) {
      p.companyId = "";
    }
  });
  selectedCompanyId = null;
  saveState();
  renderProspectsView();
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
  }
}

// Interaction Logs Table Actions
function openInteractionModal() {
  if (!state.selectedProspectId) return;
  document.getElementById("int-date").value = new Date().toISOString().split("T")[0];
  
  const typeSelect = document.getElementById("int-type");
  typeSelect.innerHTML = "";
  state.reachoutTypes.forEach(t => {
    typeSelect.innerHTML += `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`;
  });
  
  document.getElementById("int-type").value = state.reachoutTypes[0] || "";
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
}

function deleteInteraction(prosId, histId) {
  const p = state.prospects.find(x => x.id === prosId);
  if (p && p.history) {
    p.history = p.history.filter(h => h.id !== histId);
    saveState();
    renderProspectsView();
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

  // Populate media select
  const mediaSelect = document.getElementById("new-campaign-media");
  if (mediaSelect) {
    mediaSelect.innerHTML = `<option value="">-- Choose Finished content sequence --</option>`;
    state.media.forEach(m => {
      mediaSelect.innerHTML += `<option value="${m.id}">${escapeHTML(m.title)} (${m.type})</option>`;
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
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const dlAnchor = document.createElement("a");
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `vantage_prm_backup_${new Date().toISOString().split("T")[0]}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
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
    try {
      const parsed = JSON.parse(evt.target.result);
      if (parsed.prospects && parsed.companies && parsed.media) {
        state = parsed;
        ensureStateDefaults();
        saveState();
        alert("Database restored successfully!");
        renderApp();
      } else {
        alert("Invalid backup format. Missing core PRM keys.");
      }
    } catch (err) {
      alert("Error parsing backup file.");
    }
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
        state.companies = importedCompanies;
        loadedTables.push("Companies 🏢");
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
        state.prospects = importedProspects;
        loadedTables.push("Prospects 👥");
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
        state.campaigns = importedCampaigns;
        loadedTables.push("Campaigns 🎯");
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
        state.audienceLists = importedAudiences;
        loadedTables.push("Audience Lists 👥");
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
        state.media = importedMedia;
        loadedTables.push("Media Hub 📁");
      }
    }

    // 5. Dynamic Custom Table Route (content_versions, countries, shows)
    else {
      state[baseName] = genericRows;
      loadedTables.push(`${baseName.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} (Custom) 📊`);
    }
  }

  function checkCompletion() {
    if (filesProcessed === totalFilesExpected) {
      ensureStateDefaults();
      saveState();
      alert(`Vantage Database Restore Finished!\n\nSuccessfully Restored/Synced modules:\n- ${[...new Set(loadedTables)].join("\n- ")}`);
      
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
  document.getElementById("btn-export-companies-csv").addEventListener("click", exportCompaniesCSV);
  document.getElementById("btn-export-settings-csv").addEventListener("click", exportSettingsCSV);

  document.getElementById("data-restore-input").addEventListener("change", handleRestoreFile);
  
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

  // Media Status filter row
  document.querySelectorAll(".media-status-filter").forEach(btn => {
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

  // Standalone Query Launch
  document.getElementById("btn-launch-standalone-query")?.addEventListener("click", () => {
    campaignViewSubState = "query";
    renderCampaignsView();
  });

  // Dashboard / Modals
  document.getElementById("btn-open-create-campaign")?.addEventListener("click", () => openCreateCampaignModal());
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
  document.getElementById("btn-rename-audience")?.addEventListener("click", renameSelectedAudienceList);
  document.getElementById("btn-delete-audience")?.addEventListener("click", deleteSelectedAudienceList);
  document.getElementById("btn-add-contact-to-aud")?.addEventListener("click", addContactToAudienceListDirectly);

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
  document.getElementById("master-link-type").addEventListener("change", toggleMasterLinkSubforms);
  document.getElementById("master-modal-cancel").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById("modal-master-file").classList.add("hidden");
    editingMasterFileId = null;
    pendingMasterFile = null;
  });
  document.getElementById("master-modal-confirm").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveMasterFile();
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
}

function editSettingOption(field, idx) {
  const containerId = `list-settings-${field === 'mediaTypes' ? 'types' : field === 'developmentPhases' ? 'phases' : field === 'media_tags' ? 'tags' : field === 'prospect_tags' ? 'prospect-tags' : field === 'campaign_tags' ? 'campaign-tags' : field === 'company_tags' ? 'company-tags' : field === 'reachoutTypes' ? 'reachout-types' : field === 'campaignPhases' ? 'campaign-phases' : field}`;
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
    statusSelect.innerHTML += `<option value="${p}" ${selected}>${p}</option>`;
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

    tr.innerHTML = `
      <td style="font-weight:600; cursor:pointer; color:var(--color-primary); text-decoration:underline; white-space:nowrap;" class="pub-date-link">${ev.date}</td>
      <td>${expirationStyled}</td>
      <td><strong>${escapeHTML(ev.platform)}</strong></td>
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
  
  const platformSelect = document.getElementById("pub-platform");
  platformSelect.innerHTML = "";
  state.platforms.forEach(pl => {
    platformSelect.innerHTML += `<option value="${pl}">${pl}</option>`;
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
  }
  
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
      comments
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

    if (file.type === "cloud") {
      sourceText = "☁️ Cloud Link";
      referenceHTML = `<a href="${escapeHTML(file.pathOrUrl)}" target="_blank" class="media-file-badge" style="display:inline-flex; align-items:center; gap:4px; text-decoration:none; font-size:12px;">${fileIcon} ${escapeHTML(file.name)} ↗</a>`;
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

    // Wire up events
    if (file.type === "path") {
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
  pendingMasterFile = null;

  // Reset Sub-forms
  document.getElementById("master-file-name").value = "";
  document.getElementById("master-cloud-url").value = "";
  document.getElementById("master-local-path").value = "";
  document.getElementById("master-file-input").value = "";
  document.getElementById("master-file-upload-preview").classList.add("hidden");
  document.getElementById("master-file-upload-preview").innerHTML = "";

  const m = state.media.find(x => x.id === mediaId);
  if (!m) return;

  if (masterFileId) {
    title.textContent = "Modify Link Master File";
    const file = m.masterFiles.find(x => x.id === masterFileId);
    if (file) {
      document.getElementById("master-link-type").value = file.type;
      document.getElementById("master-file-name").value = file.name;
      if (file.type === "cloud") {
        document.getElementById("master-cloud-url").value = file.pathOrUrl || "";
      } else if (file.type === "path") {
        document.getElementById("master-local-path").value = file.pathOrUrl || "";
      } else if (file.type === "upload") {
        // Render existing file upload preview info
        const preview = document.getElementById("master-file-upload-preview");
        preview.classList.remove("hidden");
        preview.innerHTML = `
          <div class="file-item-left">
            <span class="file-item-icon">📁</span>
            <span class="file-item-name">${escapeHTML(file.name)}</span>
            <span class="file-item-size">(${formatFileSize(file.size || 0)})</span>
          </div>
          <span style="font-size:11px; color:var(--color-secondary); font-weight:600;">Stored Stably</span>
        `;
      }
    }
  } else {
    title.textContent = "Link Master File";
    document.getElementById("master-link-type").value = "cloud";
  }

  // Trigger form visibility refresh
  toggleMasterLinkSubforms();
  modal.classList.remove("hidden");
}

function toggleMasterLinkSubforms() {
  const type = document.getElementById("master-link-type").value;
  document.getElementById("master-subform-cloud").classList.add("hidden");
  document.getElementById("master-subform-path").classList.add("hidden");
  document.getElementById("master-subform-upload").classList.add("hidden");

  if (type === "cloud") {
    document.getElementById("master-subform-cloud").classList.remove("hidden");
  } else if (type === "path") {
    document.getElementById("master-subform-path").classList.remove("hidden");
  } else if (type === "upload") {
    document.getElementById("master-subform-upload").classList.remove("hidden");
  }
}

function handleMasterFileSelect(files) {
  if (!files || files.length === 0) return;
  const file = files[0]; // Single master file upload only

  pendingMasterFile = {
    id: `masterfile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    file: file,
    name: file.name,
    size: file.size,
    type: file.type
  };

  // Populate File Name field automatically if currently blank
  const nameInput = document.getElementById("master-file-name");
  if (!nameInput.value.trim()) {
    nameInput.value = file.name;
  }

  // Render preview row
  const preview = document.getElementById("master-file-upload-preview");
  preview.classList.remove("hidden");
  preview.innerHTML = `
    <div class="file-item-left">
      <span class="file-item-icon">📁</span>
      <span class="file-item-name">${escapeHTML(file.name)}</span>
      <span class="file-item-size">(${formatFileSize(file.size)})</span>
    </div>
    <span style="font-size:11px; color:var(--color-primary); font-weight:600;">Pending Link</span>
  `;
}

async function saveMasterFile() {
  if (!selectedMediaDashboardId) return;
  const m = state.media.find(x => x.id === selectedMediaDashboardId);
  if (!m) return;

  const type = document.getElementById("master-link-type").value;
  let name = document.getElementById("master-file-name").value.trim();
  let pathOrUrl = "";
  let fileId = "";
  let size = 0;

  if (type === "cloud") {
    pathOrUrl = document.getElementById("master-cloud-url").value.trim();
    if (!pathOrUrl) {
      alert("Cloud Document URL is required!");
      return;
    }
    if (!name) {
      // Parse a clean name from URL if possible
      name = "Cloud Master File Reference";
    }
  } else if (type === "path") {
    pathOrUrl = document.getElementById("master-local-path").value.trim();
    if (!pathOrUrl) {
      alert("Full Local path is required!");
      return;
    }
    if (!name) {
      name = pathOrUrl.split(/[\\/]/).pop() || "Local Master Reference";
    }
  } else if (type === "upload") {
    // Requires either a newly selected pending file OR modifying an existing upload record
    if (editingMasterFileId) {
      const existing = m.masterFiles.find(x => x.id === editingMasterFileId);
      if (existing && existing.type === "upload") {
        fileId = existing.fileId;
        size = existing.size;
        if (!name) name = existing.name;
      }
    }

    if (pendingMasterFile) {
      fileId = pendingMasterFile.id;
      size = pendingMasterFile.size;
      if (!name) name = pendingMasterFile.name;
      
      // Save binary blob stably in IndexedDB
      await saveFileBlob(pendingMasterFile.id, pendingMasterFile.file)
        .catch(err => console.error("Error saving Master File blob to IndexedDB:", err));
    }

    if (!fileId) {
      alert("Please select a file to upload!");
      return;
    }
  }

  if (!name) {
    alert("File Name is required!");
    return;
  }

  if (!m.masterFiles) m.masterFiles = [];

  if (editingMasterFileId) {
    const file = m.masterFiles.find(x => x.id === editingMasterFileId);
    if (file) {
      file.name = name;
      file.type = type;
      file.pathOrUrl = pathOrUrl;
      file.fileId = fileId;
      file.size = size;
      file.dateAdded = new Date().toISOString().split("T")[0];
    }
  } else {
    m.masterFiles.push({
      id: `mfile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      pathOrUrl,
      fileId,
      size,
      dateAdded: new Date().toISOString().split("T")[0]
    });
  }

  saveState();
  document.getElementById("modal-master-file").classList.add("hidden");
  editingMasterFileId = null;
  pendingMasterFile = null;

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
