const fs = require('fs');

const filePath = "app.js";
let content = fs.readFileSync(filePath, "utf-8");

// 1. Add Global Variables
content = content.replace(
    "let selectedMediaDashboardId = null;",
    "let selectedMediaDashboardId = null;\nlet pendingProspectTags = [];\nlet pendingCampaignTags = [];\nlet currentTagChooserContext = null;"
);

// 2. Update openProspectModal
const oldOpenProspect = `      document.getElementById("pros-location").value = p.location || "";
      document.getElementById("pros-tags").value = (p.tags || []).join(", ");
    }
  } else {
    title.textContent = "Add New Prospect";
    document.getElementById("pros-first-name").value = "";
    document.getElementById("pros-last-name").value = "";
    document.getElementById("pros-email").value = "";
    document.getElementById("pros-phone").value = "";
    document.getElementById("pros-title").value = "";
    document.getElementById("pros-company").value = "";
    document.getElementById("pros-location").value = "";
    document.getElementById("pros-tags").value = "";
  }
  
  modal.classList.remove("hidden");`;

const newOpenProspect = `      document.getElementById("pros-location").value = p.location || "";
      pendingProspectTags = p.tags || [];
    }
  } else {
    title.textContent = "Add New Prospect";
    document.getElementById("pros-first-name").value = "";
    document.getElementById("pros-last-name").value = "";
    document.getElementById("pros-email").value = "";
    document.getElementById("pros-phone").value = "";
    document.getElementById("pros-title").value = "";
    document.getElementById("pros-company").value = "";
    document.getElementById("pros-location").value = "";
    pendingProspectTags = [];
  }
  
  renderPendingTags('pros-display-tags', pendingProspectTags);
  modal.classList.remove("hidden");`;

content = content.replace(oldOpenProspect, newOpenProspect);

// 3. Update saveProspect
const oldSaveProspect = `  const loc = document.getElementById("pros-location").value.trim();
  const tagsVal = document.getElementById("pros-tags").value.trim();`;

const newSaveProspect = `  const loc = document.getElementById("pros-location").value.trim();`;
content = content.replace(oldSaveProspect, newSaveProspect);

const oldSaveProspectTags = `  const tags = tagsVal ? tagsVal.split(",").map(t => t.trim()).filter(Boolean) : [];`;
const newSaveProspectTags = `  const tags = [...pendingProspectTags];`;
content = content.replace(oldSaveProspectTags, newSaveProspectTags);

// 4. Update launchCampaign
const oldLaunchCampaign = `  const tagsVal = document.getElementById("campaign-tags").value.trim();
  const mediaId = document.getElementById("campaign-media-select").value;

  if (!title || !mediaId) {
    alert("Campaign Name and Sequence Media are required!");
    return;
  }

  const selectedCheckboxes = document.querySelectorAll("#campaign-contacts-checkboxes input[type='checkbox']:checked");
  if (selectedCheckboxes.length === 0) {
    alert("Please select at least one prospect to target.");
    return;
  }

  const targetProspectIds = Array.from(selectedCheckboxes).map(cb => cb.value);
  const tags = tagsVal ? tagsVal.split(",").map(t => t.trim()).filter(Boolean) : [];`;

const newLaunchCampaign = `  const mediaId = document.getElementById("campaign-media-select").value;

  if (!title || !mediaId) {
    alert("Campaign Name and Sequence Media are required!");
    return;
  }

  const selectedCheckboxes = document.querySelectorAll("#campaign-contacts-checkboxes input[type='checkbox']:checked");
  if (selectedCheckboxes.length === 0) {
    alert("Please select at least one prospect to target.");
    return;
  }

  const targetProspectIds = Array.from(selectedCheckboxes).map(cb => cb.value);
  const tags = [...pendingCampaignTags];`;

content = content.replace(oldLaunchCampaign, newLaunchCampaign);

// 5. Clear pendingCampaignTags at the end of launchCampaign
const oldLaunchCampaignEnd = `  document.querySelectorAll("#campaign-contacts-checkboxes input[type='checkbox']").forEach(cb => cb.checked = false);

  renderCampaignsView();
}`;
const newLaunchCampaignEnd = `  document.querySelectorAll("#campaign-contacts-checkboxes input[type='checkbox']").forEach(cb => cb.checked = false);

  pendingCampaignTags = [];
  renderPendingTags('campaign-display-tags', pendingCampaignTags);
  renderCampaignsView();
}`;
content = content.replace(oldLaunchCampaignEnd, newLaunchCampaignEnd);

// 6. Rewrite Choose Tags Controller
const oldChooseTagsCtrl = `/* ==========================================================================
   ✏️ CHOOSE ASSOCIATED TAGS CONTROLLER
   ========================================================================== */

function openChooseTagsModal(mediaId = null) {
  if (!mediaId) mediaId = selectedMediaDashboardId;
  selectedMediaDashboardId = mediaId;
  const m = state.media.find(x => x.id === mediaId);
  if (!m) return;

  const checklistGrid = document.getElementById("tags-checklist-grid");
  checklistGrid.innerHTML = "";
  document.getElementById("input-dash-new-tag").value = "";

  state.media_tags.forEach((tag, idx) => {
    const isChecked = (m.media_tags || []).includes(tag);
    checklistGrid.innerHTML += \`
      <label class="tag-checkbox-row">
        <input type="checkbox" value="\${escapeHTML(tag)}" \${isChecked ? "checked" : ""}>
        <span class="tag-checkbox-label"># \${escapeHTML(tag)}</span>
      </label>
    \`;
  });

  document.getElementById("modal-choose-tags").classList.remove("hidden");
}

function saveChosenTags() {
  if (!selectedMediaDashboardId) return;
  const m = state.media.find(x => x.id === selectedMediaDashboardId);
  if (!m) return;

  const checkedCheckboxes = document.querySelectorAll("#tags-checklist-grid input[type='checkbox']:checked");
  const selectedTags = Array.from(checkedCheckboxes).map(cb => cb.value);

  m.media_tags = selectedTags;

  saveState();
  document.getElementById("modal-choose-tags").classList.add("hidden");
  openContentDashboard(m.id);
  renderMediaView();
}

function addChooseTagsNewTag() {
  const input = document.getElementById("input-dash-new-tag");
  const val = input.value.trim();
  if (!val) return;

  const exists = state.media_tags.some(t => t.toLowerCase() === val.toLowerCase());
  if (exists) {
    alert("This tag already exists!");
    return;
  }

  state.media_tags.push(val);
  input.value = "";
  saveState();

  // Re-render checklist grid while preserving already checked ones
  const checklistGrid = document.getElementById("tags-checklist-grid");
  const checkedCheckboxes = document.querySelectorAll("#tags-checklist-grid input[type='checkbox']:checked");
  const checkedVals = Array.from(checkedCheckboxes).map(cb => cb.value);
  checkedVals.push(val); // Auto-check the newly created tag!

  checklistGrid.innerHTML = "";
  state.media_tags.forEach(tag => {
    const isChecked = checkedVals.includes(tag);
    checklistGrid.innerHTML += \`
      <label class="tag-checkbox-row">
        <input type="checkbox" value="\${escapeHTML(tag)}" \${isChecked ? "checked" : ""}>
        <span class="tag-checkbox-label"># \${escapeHTML(tag)}</span>
      </label>
    \`;
  });
}`;

const newChooseTagsCtrl = `/* ==========================================================================
   ✏️ CHOOSE ASSOCIATED TAGS CONTROLLER
   ========================================================================== */

function renderPendingTags(containerId, tagsArray) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!tagsArray || tagsArray.length === 0) {
    container.innerHTML = \`<span style="font-size:11px; color:var(--color-text-muted);">No tags selected. Click to choose...</span>\`;
  } else {
    container.innerHTML = tagsArray.map(t => \`<span class="tag-badge" style="font-size:11px; padding:4px 8px; border-radius:12px; background:var(--color-primary); color:#fff;"># \${escapeHTML(t)}</span>\`).join("");
  }
}

function openChooseTagsModal(context = 'media', mediaId = null) {
  currentTagChooserContext = context;
  let currentTags = [];
  let availableTags = [];

  if (context === 'media') {
    if (!mediaId) mediaId = selectedMediaDashboardId;
    selectedMediaDashboardId = mediaId;
    const m = state.media.find(x => x.id === mediaId);
    if (!m) return;
    currentTags = m.media_tags || [];
    availableTags = state.media_tags;
  } else if (context === 'prospect') {
    currentTags = pendingProspectTags || [];
    availableTags = state.prospect_tags || [];
  } else if (context === 'campaign') {
    currentTags = pendingCampaignTags || [];
    availableTags = state.campaign_tags || [];
  }

  const checklistGrid = document.getElementById("tags-checklist-grid");
  checklistGrid.innerHTML = "";
  document.getElementById("input-dash-new-tag").value = "";

  availableTags.forEach((tag, idx) => {
    const isChecked = currentTags.includes(tag);
    checklistGrid.innerHTML += \`
      <label class="tag-checkbox-row">
        <input type="checkbox" value="\${escapeHTML(tag)}" \${isChecked ? "checked" : ""}>
        <span class="tag-checkbox-label"># \${escapeHTML(tag)}</span>
      </label>
    \`;
  });

  document.getElementById("modal-choose-tags").classList.remove("hidden");
}

function saveChosenTags() {
  const checkedCheckboxes = document.querySelectorAll("#tags-checklist-grid input[type='checkbox']:checked");
  const selectedTags = Array.from(checkedCheckboxes).map(cb => cb.value);

  if (currentTagChooserContext === 'media') {
    if (!selectedMediaDashboardId) return;
    const m = state.media.find(x => x.id === selectedMediaDashboardId);
    if (!m) return;
    m.media_tags = selectedTags;
    saveState();
    openContentDashboard(m.id);
    renderMediaView();
  } else if (currentTagChooserContext === 'prospect') {
    pendingProspectTags = selectedTags;
    renderPendingTags('pros-display-tags', pendingProspectTags);
  } else if (currentTagChooserContext === 'campaign') {
    pendingCampaignTags = selectedTags;
    renderPendingTags('campaign-display-tags', pendingCampaignTags);
  }

  document.getElementById("modal-choose-tags").classList.add("hidden");
}

function addChooseTagsNewTag() {
  const input = document.getElementById("input-dash-new-tag");
  const val = input.value.trim();
  if (!val) return;

  let availableTags = [];
  if (currentTagChooserContext === 'media') availableTags = state.media_tags;
  else if (currentTagChooserContext === 'prospect') availableTags = state.prospect_tags;
  else if (currentTagChooserContext === 'campaign') availableTags = state.campaign_tags;

  const exists = availableTags.some(t => t.toLowerCase() === val.toLowerCase());
  if (exists) {
    alert("This tag already exists!");
    return;
  }

  availableTags.push(val);
  input.value = "";
  saveState();

  // Re-render checklist grid while preserving already checked ones
  const checklistGrid = document.getElementById("tags-checklist-grid");
  const checkedCheckboxes = document.querySelectorAll("#tags-checklist-grid input[type='checkbox']:checked");
  const checkedVals = Array.from(checkedCheckboxes).map(cb => cb.value);
  checkedVals.push(val); // Auto-check the newly created tag!

  checklistGrid.innerHTML = "";
  availableTags.forEach(tag => {
    const isChecked = checkedVals.includes(tag);
    checklistGrid.innerHTML += \`
      <label class="tag-checkbox-row">
        <input type="checkbox" value="\${escapeHTML(tag)}" \${isChecked ? "checked" : ""}>
        <span class="tag-checkbox-label"># \${escapeHTML(tag)}</span>
      </label>
    \`;
  });
}`;
content = content.replace(oldChooseTagsCtrl, newChooseTagsCtrl);

// 7. Add Event Listeners for new tag choosers
const oldDashTags = `  // Associated Tags click & choose triggers
  document.getElementById("dash-display-tags").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openChooseTagsModal();
  });
  document.getElementById("btn-dash-edit-tags").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openChooseTagsModal();
  });`;

const newDashTags = `  // Associated Tags click & choose triggers
  // 1. Prospect Modal
  const btnProsEditTags = document.getElementById("btn-pros-edit-tags");
  if (btnProsEditTags) btnProsEditTags.addEventListener("click", (e) => { e.preventDefault(); openChooseTagsModal('prospect'); });
  const prosDisplayTags = document.getElementById("pros-display-tags");
  if (prosDisplayTags) prosDisplayTags.addEventListener("click", (e) => { e.preventDefault(); openChooseTagsModal('prospect'); });

  // 2. Campaign Form
  const btnCampEditTags = document.getElementById("btn-campaign-edit-tags");
  if (btnCampEditTags) btnCampEditTags.addEventListener("click", (e) => { e.preventDefault(); openChooseTagsModal('campaign'); });
  const campDisplayTags = document.getElementById("campaign-display-tags");
  if (campDisplayTags) campDisplayTags.addEventListener("click", (e) => { e.preventDefault(); openChooseTagsModal('campaign'); });

  // 3. Media Dashboard
  document.getElementById("dash-display-tags").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openChooseTagsModal('media');
  });
  document.getElementById("btn-dash-edit-tags").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openChooseTagsModal('media');
  });`;
content = content.replace(oldDashTags, newDashTags);

// 8. Initialize Campaign Tags Display on view load
const oldSwitchView = `  if (viewId === "prospects") renderProspectsView();
  else if (viewId === "media") renderMediaView();
  else if (viewId === "campaigns") renderCampaignsView();
  else renderDashboardView();`;

const newSwitchView = `  if (viewId === "prospects") renderProspectsView();
  else if (viewId === "media") renderMediaView();
  else if (viewId === "campaigns") {
    pendingCampaignTags = [];
    renderPendingTags('campaign-display-tags', pendingCampaignTags);
    renderCampaignsView();
  }
  else renderDashboardView();`;
content = content.replace(oldSwitchView, newSwitchView);

fs.writeFileSync(filePath, content, "utf-8");
console.log("Patch applied.");
