/*
 * Global script for LYRN unified website
 * Includes Theme Engine, ScrollSpy Navigation, and RWI Builder Demo
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollSpy();
  initRWIBuilder();
});

// --- Theme Engine ---
function initTheme() {
  const body = document.body;
  const themeButton = document.getElementById('themeButton'); // Keeping if it exists, though moving to nav
  const themeToggle = document.getElementById('themeToggle'); // Footer toggle
  
  // Also support the RWI builder toggle if present
  const rwiThemeToggle = document.getElementById('rwi-theme-toggle'); 

  function applyTheme(theme) {
    body.setAttribute('data-theme', theme);
    localStorage.setItem('lyrn-theme', theme);
    if (themeButton) themeButton.textContent = theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE';
    if (themeToggle) themeToggle.checked = (theme === 'light');
    if (rwiThemeToggle) rwiThemeToggle.checked = (theme === 'light');
  }

  let savedTheme = localStorage.getItem('lyrn-theme') || 'dark';
  applyTheme(savedTheme);

  if (themeButton) {
    themeButton.addEventListener('click', () => {
        applyTheme(body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  [themeToggle, rwiThemeToggle].forEach(el => {
      if(el) el.addEventListener('change', () => applyTheme(el.checked ? 'light' : 'dark'));
  });
}

// --- ScrollSpy Navigation ---
function initScrollSpy() {
  const navLinks = document.querySelectorAll('#sticky-nav .nav-link');
  const sections = document.querySelectorAll('section');
  const navHeight = 70; // Offset for sticky header

  window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (scrollY >= sectionTop - navHeight - 50) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      // Check if href is an anchor link
      if (href && href.startsWith('#')) {
          if (href.substring(1) === current) {
            link.classList.add('active');
          }
      } else if (href === 'index.html' && current === '') {
          // Home case
          link.classList.add('active');
      }
    });
  });
}

// --- RWI Builder Demo (Client-Side Logic) ---
function initRWIBuilder() {
    // Only run if elements exist
    if (!document.getElementById('components-list')) return;

    let components = [
        { name: "System_Core", pinned: true, active: true, order: 0, content: "You are LYRN, an advanced cognitive architecture.", config: { begin_bracket: "###SYSTEM_START###", end_bracket: "###_END###", rwi_text: "Core system definitions." } },
        { name: "Personality", pinned: true, active: true, order: 1, content: "Tone: Professional, Concise, Helpful.\nStyle: Technical but accessible.", config: { begin_bracket: "###PERSONA_START###", end_bracket: "###_END###", rwi_text: "Personality injection." } },
        { name: "World_State", pinned: false, active: true, order: 2, content: "Location: Local Server\nTime: {CURRENT_TIME}\nStatus: Online", config: { begin_bracket: "###WORLD_START###", end_bracket: "###_END###", rwi_text: "World context updates." } },
        { name: "User_Profile", pinned: false, active: true, order: 3, content: "User Level: Admin\nPermissions: Full", config: { begin_bracket: "###USER_START###", end_bracket: "###_END###", rwi_text: "User metadata." } }
    ];
    let selectedComponent = null;

    // --- Render List ---
    function renderList() {
        const listEl = document.getElementById('components-list');
        listEl.innerHTML = '';

        // Sort: Pinned first, then order
        components.sort((a, b) => {
            if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
            return (a.order || 0) - (b.order || 0);
        });

        components.forEach((comp, index) => {
            // Update order index
            comp.order = index; 

            const item = document.createElement('div');
            item.className = `component-item ${selectedComponent === comp.name ? 'selected' : ''}`;
            
            item.innerHTML = `
                <span class="component-handle">::</span>
                <button class="pin-btn" data-name="${comp.name}" title="${comp.pinned ? 'Unpin' : 'Pin'}">
                    ${comp.pinned ? '📌' : '📍'}
                </button>
                <span class="component-name">${comp.name}</span>
                <label class="switch component-toggle" onclick="event.stopPropagation()">
                    <input type="checkbox" ${comp.active ? 'checked' : ''} data-name="${comp.name}">
                    <span class="slider"></span>
                </label>
            `;

            item.onclick = () => selectComponent(comp.name);
            
            // Pin handler
            item.querySelector('.pin-btn').onclick = (e) => {
                e.stopPropagation();
                togglePin(comp.name);
            };

            // Toggle handler
            item.querySelector('input').onchange = (e) => {
                toggleActive(comp.name, e.target.checked);
            };

            listEl.appendChild(item);
        });
    }

    function togglePin(name) {
        const c = components.find(x => x.name === name);
        if(c) { c.pinned = !c.pinned; renderList(); }
    }

    function toggleActive(name, val) {
        const c = components.find(x => x.name === name);
        if(c) c.active = val;
    }

    function selectComponent(name) {
        selectedComponent = name;
        renderList();
        
        const titleEl = document.getElementById('editor-title');
        const container = document.getElementById('editor-container');
        
        titleEl.innerText = name === '_NEW_' ? 'New Component' : `Editing: ${name}`;
        
        if (name === '_NEW_') {
             container.innerHTML = `
                <div class="form-group">
                    <label>Component Name</label>
                    <input type="text" id="edit-name" placeholder="e.g., memory_buffer">
                </div>
                <div class="form-group"><label>Begin Bracket</label><input type="text" id="edit-begin" value="###_START###"></div>
                <div class="form-group"><label>End Bracket</label><input type="text" id="edit-end" value="###_END###"></div>
                <div class="form-group"><label>Content</label><textarea id="edit-content"></textarea></div>
             `;
        } else {
            const c = components.find(x => x.name === name);
            if(!c) return;
            container.innerHTML = `
                <div class="form-group"><label>Begin Bracket</label><input type="text" id="edit-begin" value="${escapeHtml(c.config.begin_bracket)}"></div>
                <div class="form-group"><label>End Bracket</label><input type="text" id="edit-end" value="${escapeHtml(c.config.end_bracket)}"></div>
                <div class="form-group"><label>RWI Instructions</label><textarea id="edit-rwi">${escapeHtml(c.config.rwi_text)}</textarea></div>
                <div class="form-group"><label>Main Content</label><textarea id="edit-content" style="height: 300px;">${escapeHtml(c.content)}</textarea></div>
            `;
        }
        
        // Update button visibility
        const delBtn = document.getElementById('delete-btn');
        if(delBtn) delBtn.style.display = (name === '_NEW_' || name === 'System_Core') ? 'none' : 'block';
    }

    // --- Actions ---
    window.rwiAddNew = () => {
        selectComponent('_NEW_');
    };

    window.rwiSave = () => {
        const isNew = selectedComponent === '_NEW_';
        let name = selectedComponent;
        
        if (isNew) {
            name = document.getElementById('edit-name').value.trim();
            if(!name) { showToast("Name required", true); return; }
            if(components.find(c => c.name === name)) { showToast("Name exists", true); return; }
            
            components.push({
                name: name, pinned: false, active: true, order: components.length,
                config: { begin_bracket: document.getElementById('edit-begin').value, end_bracket: document.getElementById('edit-end').value, rwi_text: "" },
                content: document.getElementById('edit-content').value
            });
            selectedComponent = name;
        } else {
            const c = components.find(x => x.name === name);
            if(c) {
                c.config.begin_bracket = document.getElementById('edit-begin').value;
                c.config.end_bracket = document.getElementById('edit-end').value;
                c.config.rwi_text = document.getElementById('edit-rwi').value;
                c.content = document.getElementById('edit-content').value;
            }
        }
        showToast("Component Saved");
        renderList();
        if(isNew) selectComponent(name);
    };

    window.rwiDelete = () => {
        if(!selectedComponent || selectedComponent === '_NEW_') return;
        if(confirm(`Delete ${selectedComponent}?`)) {
            components = components.filter(c => c.name !== selectedComponent);
            selectedComponent = null;
            document.getElementById('editor-container').innerHTML = '<p style="padding:20px; color:var(--text-dim)">Select a component.</p>';
            renderList();
            showToast("Deleted");
        }
    };

    window.rwiBuild = () => {
        const btn = document.getElementById('rebuild-btn');
        const origText = btn.innerText;
        btn.innerText = "Building...";
        setTimeout(() => {
            btn.innerText = origText;
            showToast("Master Prompt Rebuilt (Simulation)");
        }, 800);
    };
    
    window.rwiPreview = () => {
        let text = "";
        components.filter(c => c.active).forEach(c => {
            text += `${c.config.begin_bracket}\nENABLED=true\n\n${c.content}\n${c.config.end_bracket}\n\n`;
        });
        const win = window.open("", "_blank");
        win.document.write(`<pre style="font-family:monospace; padding:20px;">${text}</pre>`);
    };

    // Initial render
    renderList();
}

function showToast(msg, error=false) {
    const t = document.getElementById('rwi-toast');
    if(!t) return;
    t.innerText = msg;
    t.style.borderColor = error ? 'var(--error-color)' : 'var(--brand-purple)';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
