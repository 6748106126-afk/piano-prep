/* Piano Prep dashboard — vanilla JS, no build step, no external deps. */
(function(){
  "use strict";

  const DATA = window.APP_DATA || { songs: [], technique: {}, schedule: [] };
  const SONGS = DATA.songs || [];
  const TECH = DATA.technique || {};
  const SCHEDULE = DATA.schedule || [];

  const STORAGE_KEY = "piano-prep-progress-v1";
  const STATUS_ORDER = ["not-started","learning","comfortable","mastered"];
  const STATUS_LABEL = {
    "not-started":"Not started","learning":"Learning","comfortable":"Comfortable","mastered":"Mastered"
  };

  function loadProgress(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return { songStatus:{}, log:[], lastVisit:null };
      const parsed = JSON.parse(raw);
      return Object.assign({ songStatus:{}, log:[], lastVisit:null }, parsed);
    }catch(e){
      console.warn("progress load failed", e);
      return { songStatus:{}, log:[], lastVisit:null };
    }
  }
  function saveProgress(p){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
    catch(e){ console.warn("progress save failed", e); }
  }
  let progress = loadProgress();

  function setSongStatus(id, status){
    progress.songStatus[id] = status;
    progress.log.push({ date: new Date().toISOString().slice(0,10), songId: id, status });
    saveProgress(progress);
  }
  function getSongStatus(id){
    return progress.songStatus[id] || "not-started";
  }

  // ---------- routing / tabs ----------
  const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
  const panels = {
    dashboard: document.getElementById("tab-dashboard"),
    library: document.getElementById("tab-library"),
    technique: document.getElementById("tab-technique"),
    schedule: document.getElementById("tab-schedule"),
    "song-detail": document.getElementById("tab-song-detail"),
  };
  function showTab(name){
    tabButtons.forEach(b=> b.classList.toggle("active", b.dataset.tab===name));
    Object.entries(panels).forEach(([k,el])=> el.classList.toggle("active", k===name));
    if(name==="dashboard") renderDashboard();
    if(name==="library") renderLibrary();
    if(name==="technique") renderTechnique();
    if(name==="schedule") renderSchedule();
  }
  tabButtons.forEach(btn=>{
    btn.addEventListener("click", ()=> showTab(btn.dataset.tab));
  });
  document.getElementById("back-to-library").addEventListener("click", ()=> showTab("library"));

  // ---------- helpers ----------
  function songById(id){ return SONGS.find(s=>s.id===id); }
  function familyName(famId){
    const f = (TECH.progression_families||[]).find(x=>x.id===famId);
    return f ? f.name : famId;
  }
  function ytSearchUrl(song){
    const q = encodeURIComponent((song.artist||"") + " " + (song.title_en||song.title||""));
    return "https://www.youtube.com/results?search_query=" + q;
  }

  // ---------- Dashboard ----------
  function renderDashboard(){
    const total = SONGS.length;
    const counts = { "not-started":0,"learning":0,"comfortable":0,"mastered":0 };
    SONGS.forEach(s=> counts[getSongStatus(s.id)]++ );
    const mastered = counts["mastered"];
    const inProgress = counts["learning"] + counts["comfortable"];

    // streak: consecutive days with at least one log entry, ending today or yesterday
    const days = Array.from(new Set(progress.log.map(l=>l.date))).sort();
    let streak = 0;
    if(days.length){
      let cursor = new Date();
      for(;;){
        const iso = cursor.toISOString().slice(0,10);
        if(days.includes(iso)){ streak++; cursor.setDate(cursor.getDate()-1); }
        else break;
      }
    }

    const statsEl = document.getElementById("dash-stats");
    statsEl.innerHTML = [
      tile(total, "Total songs cataloged"),
      tile(mastered, "Mastered"),
      tile(inProgress, "In progress"),
      tile(streak, "Day streak"),
    ].join("");

    function tile(num,label){
      return `<div class="stat-tile"><div class="num">${num}</div><div class="label">${label}</div></div>`;
    }

    // today's suggestion: first foundation song that's not mastered, preferring "learning" over "not-started"
    const foundation = SONGS.filter(s=>s.tier==="foundation");
    let candidate = foundation.find(s=>getSongStatus(s.id)==="learning")
      || foundation.find(s=>getSongStatus(s.id)==="not-started")
      || foundation.find(s=>getSongStatus(s.id)==="comfortable");
    const todayEl = document.getElementById("dash-today");
    if(candidate){
      todayEl.innerHTML = `
        <div class="sc-title">${esc(candidate.title)}</div>
        <div class="sc-artist">${esc(candidate.artist||"")}</div>
        <p style="color:var(--text-dim);font-size:0.88rem;">Key: ${esc(candidate.key||"?")} · Pattern: ${esc(candidate.pattern||"?")} · Family: ${esc(familyName(candidate.progression_family))}</p>
        <button class="back-btn" style="margin-top:6px;" onclick="window.__openSong('${candidate.id}')">Open song &rarr;</button>
      `;
    } else {
      todayEl.innerHTML = `<div class="empty-state">All foundation songs mastered — nice. Pull one from Stretch tier in the Library tab.</div>`;
    }

    // current unlocked skills: based on schedule, find current week by date span isn't tracked;
    // instead show the first 2 weeks' skill unlocks as a static ramp, plus anything logged as "comfortable"/"mastered" pattern-wise.
    const unlockedEl = document.getElementById("dash-unlocked");
    const learnedFamilies = new Set(
      SONGS.filter(s=> ["comfortable","mastered"].includes(getSongStatus(s.id))).map(s=>s.progression_family)
    );
    if(learnedFamilies.size===0){
      unlockedEl.innerHTML = `<div class="empty-state">Nothing marked comfortable yet. Start with Week 1 in the Schedule tab.</div>`;
    } else {
      unlockedEl.innerHTML = `<ul>${Array.from(learnedFamilies).map(f=>`<li>${esc(familyName(f))} <span style="color:var(--text-dim);">— unlocks ${SONGS.filter(s=>s.progression_family===f).length} songs</span></li>`).join("")}</ul>`;
    }

    // progress by tier
    const tiersEl = document.getElementById("dash-tiers");
    const tiers = ["foundation","stretch","reference"];
    tiersEl.innerHTML = tiers.map(t=>{
      const list = SONGS.filter(s=>s.tier===t);
      const done = list.filter(s=>["mastered"].includes(getSongStatus(s.id))).length;
      const pct = list.length ? Math.round(done/list.length*100) : 0;
      return `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:0.9rem;">
            <span style="text-transform:capitalize;">${t}</span>
            <span style="color:var(--text-dim);">${done}/${list.length} mastered</span>
          </div>
          <div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${pct}%"></div></div>
        </div>`;
    }).join("");
  }

  // ---------- Library ----------
  function renderLibrary(){
    const familySel = document.getElementById("lib-filter-family");
    if(familySel.options.length<=1){
      const fams = Array.from(new Set(SONGS.map(s=>s.progression_family))).filter(Boolean);
      fams.forEach(f=>{
        const opt = document.createElement("option");
        opt.value = f; opt.textContent = familyName(f);
        familySel.appendChild(opt);
      });
    }
    applyLibraryFilters();
  }
  function applyLibraryFilters(){
    const q = document.getElementById("lib-search").value.trim().toLowerCase();
    const tier = document.getElementById("lib-filter-tier").value;
    const fam = document.getElementById("lib-filter-family").value;
    const status = document.getElementById("lib-filter-status").value;

    const filtered = SONGS.filter(s=>{
      if(tier && s.tier!==tier) return false;
      if(fam && s.progression_family!==fam) return false;
      if(status && getSongStatus(s.id)!==status) return false;
      if(q){
        const hay = ((s.title||"")+" "+(s.title_en||"")+" "+(s.artist||"")).toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    });

    document.getElementById("lib-count").textContent = `${filtered.length} of ${SONGS.length} songs`;
    const grid = document.getElementById("song-grid");
    if(!filtered.length){
      grid.innerHTML = `<div class="empty-state">No songs match those filters.</div>`;
      return;
    }
    grid.innerHTML = filtered.map(s=>{
      const st = getSongStatus(s.id);
      return `
        <div class="song-card" onclick="window.__openSong('${s.id}')">
          <div class="sc-title">${esc(s.title)}</div>
          <div class="sc-artist">${esc(s.artist||"")}</div>
          <div class="sc-tags">
            <span class="tag tier-${s.tier}">${s.tier}</span>
            <span class="tag">${esc(s.key||"?")}</span>
            <span class="tag">${"★".repeat(s.difficulty||1)}</span>
            <span class="tag status-${st}">${STATUS_LABEL[st]}</span>
          </div>
        </div>`;
    }).join("");
  }
  ["lib-search","lib-filter-tier","lib-filter-family","lib-filter-status"].forEach(id=>{
    document.getElementById(id).addEventListener("input", applyLibraryFilters);
    document.getElementById(id).addEventListener("change", applyLibraryFilters);
  });

  // ---------- Song detail ----------
  window.__openSong = function(id){
    const s = songById(id);
    if(!s) return;
    const el = document.getElementById("song-detail-content");
    const st = getSongStatus(id);
    el.innerHTML = `
      <div class="detail-header">
        <h1>${esc(s.title)}${s.title_en && s.title_en!==s.title ? ` <span style="color:var(--text-dim);font-weight:400;font-size:1rem;">(${esc(s.title_en)})</span>`:""}</h1>
        <div class="detail-meta">${esc(s.artist||"Unknown artist")} · ${esc(s.language==="th"?"Thai":"English")} · Difficulty ${"★".repeat(s.difficulty||1)}</div>
      </div>
      <div class="sc-tags" style="margin-bottom:12px;">
        <span class="tag tier-${s.tier}">${s.tier}</span>
        <span class="tag">Key: ${esc(s.key||"?")}</span>
        <span class="tag">${esc(s.time_signature||"4/4")}</span>
        <span class="tag">${esc(s.tempo_feel||"")}</span>
        <span class="tag">${s.confidence==="verified"?"✓ verified chords":"~ estimated chords"}</span>
      </div>

      <div class="card">
        <h2>Progression family</h2>
        <p>${esc(familyName(s.progression_family))}</p>
        <p style="color:var(--text-dim);font-size:0.88rem;">Suggested left-hand pattern: <strong>${esc(s.pattern||"block-chords")}</strong></p>
      </div>

      <div class="card">
        <h2>Chords</h2>
        ${chordBlock("Verse", s.verse_chords)}
        ${chordBlock("Chorus", s.chorus_chords)}
        ${s.bridge_chords && s.bridge_chords.length ? chordBlock("Bridge / notes", s.bridge_chords) : ""}
        <p style="color:var(--text-dim);font-size:0.8rem;margin-top:8px;">Source: ${esc(s.source||"estimated")}</p>
      </div>

      <div class="card">
        <h2>Practice status</h2>
        <div class="status-buttons" id="status-buttons"></div>
      </div>

      <div class="card">
        <h2>Listen / sing along</h2>
        <a class="yt-link" target="_blank" rel="noopener" href="${ytSearchUrl(s)}">Find on YouTube &#8599;</a>
      </div>
    `;
    const btnWrap = document.getElementById("status-buttons");
    btnWrap.innerHTML = STATUS_ORDER.map(k=>`<button data-status="${k}" class="${st===k?'selected':''}">${STATUS_LABEL[k]}</button>`).join("");
    btnWrap.querySelectorAll("button").forEach(b=>{
      b.addEventListener("click", ()=>{
        setSongStatus(s.id, b.dataset.status);
        window.__openSong(s.id);
      });
    });

    document.getElementById("song-detail-tab-btn").hidden = false;
    showTab("song-detail");
  };
  function chordBlock(label, chords){
    if(!chords || !chords.length) return "";
    return `<div class="chord-block"><span class="section-label">${label}</span>${chords.map(esc).join("  –  ")}</div>`;
  }

  // ---------- Technique ----------
  function renderTechnique(){
    const el = document.getElementById("technique-content");
    if(el.dataset.rendered) return;
    el.dataset.rendered = "1";
    const t = TECH;
    let html = "";

    html += `<div class="tech-section"><h2>Fundamentals</h2>`;
    (t.fundamentals||[]).forEach(f=>{
      html += `<div class="tech-item"><h3>${esc(f.title)}</h3><p>${esc(f.body)}</p></div>`;
    });
    html += `</div>`;

    html += `<div class="tech-section"><h2>Chord shapes</h2>`;
    (t.chord_shapes||[]).forEach(c=>{
      html += `<div class="tech-item">
        <h3>${esc(c.title)}</h3>
        <div class="meta-line">${esc(c.formula||"")}</div>
        <p>${esc(c.example||"")}</p>
        <p style="color:var(--text-dim);">${esc(c.feel||"")}</p>
        <div class="meta-line">LH fingering: ${esc(c.fingering_lh||"")} &nbsp;|&nbsp; RH fingering: ${esc(c.fingering_rh||"")}</div>
      </div>`;
    });
    html += `</div>`;

    html += `<div class="tech-section"><h2>Left-hand accompaniment patterns</h2>`;
    (t.lh_patterns||[]).sort((a,b)=>a.difficulty-b.difficulty).forEach(p=>{
      html += `<div class="tech-item">
        <h3>${esc(p.title)} <span style="color:var(--text-dim);font-weight:400;font-size:0.85rem;">— ${esc(p.when_to_learn||"")}</span></h3>
        <p>${esc(p.how)}</p>
        <p style="color:var(--text-dim);font-size:0.88rem;">${esc(p.practice_tip||"")}</p>
      </div>`;
    });
    html += `</div>`;

    html += `<div class="tech-section"><h2>Chord progression families</h2>`;
    (t.progression_families||[]).sort((a,b)=>a.priority-b.priority).forEach(f=>{
      const count = SONGS.filter(s=>s.progression_family===f.id).length;
      html += `<div class="tech-item">
        <h3>${esc(f.name)} <span style="color:var(--text-dim);font-weight:400;font-size:0.85rem;">— ${count} songs in your list</span></h3>
        <div class="meta-line">Example in C: ${esc(f.example_in_C||"")}</div>
        <p style="color:var(--text-dim);">${esc(f.feel||"")}</p>
      </div>`;
    });
    html += `</div>`;

    if(t.practice_method){
      html += `<div class="tech-section"><h2>${esc(t.practice_method.title)}</h2><div class="tech-item"><ul>`;
      (t.practice_method.steps||[]).forEach(s=> html += `<li>${esc(s)}</li>`);
      html += `</ul></div></div>`;
    }

    el.innerHTML = html;
  }

  // ---------- Schedule ----------
  function renderSchedule(){
    const el = document.getElementById("schedule-content");
    if(el.dataset.rendered) return;
    el.dataset.rendered = "1";
    if(!SCHEDULE.length){
      el.innerHTML = `<div class="empty-state">Schedule not generated yet.</div>`;
      return;
    }
    el.innerHTML = SCHEDULE.map(w=>{
      const songsHtml = (w.song_ids||[]).map(id=>{
        const s = songById(id);
        if(!s) return "";
        return `<span class="song-chip" onclick="window.__openSong('${id}')">${esc(s.title)}</span>`;
      }).join("");
      return `
        <div class="week-block">
          <h3>Week ${w.week} — ${esc(w.title)}</h3>
          <div class="week-focus">${esc(w.focus)}</div>
          <ul>${(w.goals||[]).map(g=>`<li>${esc(g)}</li>`).join("")}</ul>
          ${songsHtml ? `<div class="song-chip-row">${songsHtml}</div>` : ""}
        </div>`;
    }).join("");
  }

  function esc(str){
    if(str===undefined || str===null) return "";
    return String(str).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  // init
  renderDashboard();
})();
