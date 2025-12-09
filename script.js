/*
 * Global script for LYRN unified website
 * Includes Theme Engine, ScrollSpy Navigation, and RWI Builder Demo
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollSpy();
  initRWIBuilder();
  initBackToTop(); 
  initFloatingMenu();
  initFloatingToggle(); 
});

// --- Floating Dock Logic (Drag, Snap to Grid, Persist) ---
function initFloatingToggle() {
    const dock = document.getElementById('floating-dock');
    const handle = document.getElementById('dock-handle');
    const content = document.getElementById('dock-content');
    
    if (!dock || !handle) return;

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let hasMoved = false;

    // Load saved position from LocalStorage
    const savedPos = localStorage.getItem('lyrn-dock-pos');
    if (savedPos) {
        try {
            const { left, top } = JSON.parse(savedPos);
            dock.style.bottom = 'auto';
            dock.style.right = 'auto';
            
            // Validate boundaries on load to prevent off-screen issues
            const maxLeft = window.innerWidth - 60; 
            const maxTop = window.innerHeight - 40;
            
            let safeLeft = Math.min(Math.max(20, left), maxLeft);
            let safeTop = Math.min(Math.max(20, top), maxTop);
            
            dock.style.left = `${safeLeft}px`;
            dock.style.top = `${safeTop}px`;
        } catch (e) {
            console.error("Failed to load dock position", e);
        }
    }

    // 1. Drag Functionality
    handle.addEventListener('mousedown', startDrag);
    handle.addEventListener('touchstart', startDrag, {passive: false});

    function startDrag(e) {
        // Prepare drag
        isDragging = true;
        hasMoved = false; 
        
        // Disable transition for snappy drag
        dock.classList.add('is-dragging');

        // Get mouse/touch position
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        startX = clientX;
        startY = clientY;

        // Get current element position
        const rect = dock.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        // Switch to absolute positioning
        dock.style.bottom = 'auto';
        dock.style.right = 'auto';
        dock.style.left = `${initialLeft}px`;
        dock.style.top = `${initialTop}px`;

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', onDrag, {passive: false});
        document.addEventListener('touchend', stopDrag);
    }

    function onDrag(e) {
        if (!isDragging) return;
        e.preventDefault(); 

        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        const dx = clientX - startX;
        const dy = clientY - startY;

        // 2. Click vs Drag Threshold (5px)
        // Only consider it a drag if moved more than 5px total
        if (Math.abs(dx) + Math.abs(dy) > 5) {
            hasMoved = true;
        }

        // 3. Constrain to Viewport during drag
        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        const maxLeft = window.innerWidth - dock.offsetWidth;
        const maxTop = window.innerHeight - dock.offsetHeight;

        // Clamp
        if (newLeft < 0) newLeft = 0;
        if (newLeft > maxLeft) newLeft = maxLeft;
        if (newTop < 0) newTop = 0;
        if (newTop > maxTop) newTop = maxTop;

        dock.style.left = `${newLeft}px`;
        dock.style.top = `${newTop}px`;
        
        repositionNavOverlay();
    }

    function stopDrag() {
        isDragging = false;
        dock.classList.remove('is-dragging'); // Re-enable transition for snap

        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('touchend', stopDrag);

        if (hasMoved) {
            // 4. Snap Behavior (GRID PATTERN)
            // Instead of snapping to sides, we snap to a grid so it stays inside
            const rect = dock.getBoundingClientRect();
            const gridSize = 40; // 40px grid squares
            const safeMargin = 20; // Keep at least 20px from edge

            // Get current raw position
            let currentLeft = rect.left;
            let currentTop = rect.top;

            // Round to nearest grid line
            let finalLeft = Math.round(currentLeft / gridSize) * gridSize;
            let finalTop = Math.round(currentTop / gridSize) * gridSize;

            // Enforce Safe Boundaries (User request: "stay inside of the page vertical")
            const maxLeft = window.innerWidth - rect.width - safeMargin;
            const maxTop = window.innerHeight - rect.height - safeMargin;

            // Clamp left
            if (finalLeft < safeMargin) finalLeft = safeMargin;
            if (finalLeft > maxLeft) finalLeft = maxLeft;

            // Clamp top
            if (finalTop < safeMargin) finalTop = safeMargin;
            if (finalTop > maxTop) finalTop = maxTop;

            // Apply Snap
            dock.style.left = `${finalLeft}px`;
            dock.style.top = `${finalTop}px`;
            
            // 5. Remember Position
            localStorage.setItem('lyrn-dock-pos', JSON.stringify({
                left: finalLeft,
                top: finalTop
            }));
            
            // Wait for transition, then update overlay
            setTimeout(repositionNavOverlay, 300);
        }
    }

    // Toggle Functionality (Only if NOT dragged)
    handle.addEventListener('click', (e) => {
        if (!hasMoved) {
            dock.classList.toggle('dock-collapsed');
            if (dock.classList.contains('dock-collapsed')) {
                 closeFloatingNav();
            }
        }
    });
}

// --- Floating Menu Logic ---
function initFloatingMenu() {
    const menuBtn = document.getElementById('floating-menu-btn');
    const navOverlay = document.getElementById('floating-nav-overlay');
    const dock = document.getElementById('floating-dock');
    
    if (!menuBtn || !navOverlay) return;

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        const isVisible = navOverlay.classList.contains('visible');
        
        if (isVisible) {
            navOverlay.classList.remove('visible');
            menuBtn.innerText = '☰';
        } else {
            repositionNavOverlay();
            navOverlay.classList.add('visible');
            menuBtn.innerText = '✕';
        }
    });

    window.addEventListener('click', (e) => {
        if (!navOverlay.contains(e.target) && e.target !== menuBtn && !dock.contains(e.target)) {
            navOverlay.classList.remove('visible');
            menuBtn.innerText = '☰';
        }
    });
}

// Helper: Smartly position the overlay based on which side the dock is on
function repositionNavOverlay() {
    const dock = document.getElementById('floating-dock');
    const navOverlay = document.getElementById('floating-nav-overlay');
    
    if(dock && navOverlay) {
        const rect = dock.getBoundingClientRect();
        
        navOverlay.style.position = 'fixed';
        navOverlay.style.bottom = 'auto';
        navOverlay.style.right = 'auto';
        navOverlay.style.left = 'auto';

        // Check if dock is on the right side of the screen
        const isOnRight = rect.left > window.innerWidth / 2;

        // Position Logic:
        // Because dock content expands UP, we want the menu to align with the handle's vertical position
        
        if (isOnRight) {
            // Position Menu to the LEFT of the dock
            // 200px width + 15px gap
            navOverlay.style.left = `${rect.left - 215}px`;
        } else {
            // Position Menu to the RIGHT of the dock
            navOverlay.style.left = `${rect.right + 15}px`;
        }
        
        // Align bottom of menu with bottom of dock handle
        // We know the dock handle is at rect.bottom.
        // We want navOverlay.bottom = rect.bottom.
        // But we are setting 'top'.
        
        const overlayHeight = navOverlay.offsetHeight || 380; // approximate if hidden
        let topPos = rect.bottom - overlayHeight;

        // Constraint: Don't go off top of screen
        if (topPos < 20) topPos = 20;
        
        navOverlay.style.top = `${topPos}px`;
    }
}

window.closeFloatingNav = () => {
    const navOverlay = document.getElementById('floating-nav-overlay');
    const menuBtn = document.getElementById('floating-menu-btn');
    if (navOverlay) navOverlay.classList.remove('visible');
    if (menuBtn) menuBtn.innerText = '☰';
};

// --- Back To Top Logic ---
function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// --- Theme Engine ---
function initTheme() {
  const body = document.body;
  const themeButton = document.getElementById('themeButton'); 
  
  const storedTheme = localStorage.getItem('lyrn-theme');
  let currentTheme = storedTheme || 'dark';
  applyTheme(currentTheme);

  if (themeButton) {
    themeButton.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(currentTheme);
    });
  }

  function applyTheme(theme) {
    body.setAttribute('data-theme', theme);
    if(themeButton) {
        themeButton.innerText = theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE';
    }
    localStorage.setItem('lyrn-theme', theme);
  }
}

// --- ScrollSpy Navigation ---
function initScrollSpy() {
  const navLinks = document.querySelectorAll('.nav-link');
  if (!navLinks.length) return;

  const sections = Array.from(navLinks)
    .map(link => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return null;
      const id = href.substring(1);
      const section = document.getElementById(id);
      return section ? { link, section } : null;
    })
    .filter(Boolean);

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const target = document.getElementById(targetId);
        if (target) {
          const yOffset = -20; 
          const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    });
  });

  let lastActive = null;
  function onScroll() {
    const scrollPos = window.scrollY || window.pageYOffset;
    const offset = 120; 

    let current = null;
    for (const { link, section } of sections) {
      const top = section.offsetTop - offset;
      const bottom = top + section.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) {
        current = link;
        break;
      }
    }

    if (current !== lastActive) {
      if (lastActive) lastActive.classList.remove('active');
      if (current) current.classList.add('active');
      lastActive = current;
    }
  }

  window.addEventListener('scroll', onScroll);
  onScroll(); 
}

// --- RWI Builder Demo ---
function initRWIBuilder() {
    if (!document.getElementById('components-list')) return;

    let components = [
        {
            name: "rwi",
            pinned: true,
            active: true,
            order: 0,
            config: {
                begin_bracket: "###RWI_INSTRUCTIONS_START###",
                end_bracket: "###RWI_INSTRUCTIONS_END###",
                rwi_text: "Relational Web Index header."
            },
            content: "" 
        },
        {
            name: "system_instructions",
            pinned: true,
            active: true,
            order: 1,
            config: {
                begin_bracket: "###SYSTEM_INSTRUCTIONS_START###",
                end_bracket: "###SYSTEM_INSTRUCTIONS_END###",
                rwi_text: "Core system instructions."
            },
            content: `This model operates as part of the LYRN cognitive architecture...`
        },
        {
            name: "system_rules",
            pinned: true,
            active: true,
            order: 2,
            config: {
                begin_bracket: "###SYSTEM_RULES_START###",
                end_bracket: "###SYSTEM_RULES_END###",
                rwi_text: "Hard constraints."
            },
            content: `PRIORITY_OVERRIDES:\n- Follow user directives...`
        },
        {
            name: "ai_preferences",
            pinned: false,
            active: true,
            order: 3,
            config: {
                begin_bracket: "###AI_PREFERENCES_START###",
                end_bracket: "###AI_PREFERENCES_END###",
                rwi_text: "AI-specific preferences."
            },
            content: `Name: Greg\nBirthday: March 11, 1976`
        },
        {
            name: "personality",
            pinned: false,
            active: true,
            order: 4,
            config: {
                begin_bracket: "###PERSONALITY_START###",
                end_bracket: "###PERSONALITY_END###",
                rwi_text: "AI identity."
            },
            content: `"Creativity = 0700"\n"Consistency = 0800"`
        },
        {
            name: "user_preferences",
            pinned: false,
            active: true,
            order: 5,
            config: {
                begin_bracket: "###USER_PREFERENCES_START###",
                end_bracket: "###USER_PREFERENCES_END###",
                rwi_text: "User knobs."
            },
            content: `Reserved for user-specific preferences...`
        }
    ];

    let selectedComponent = null;

    function updateRWITableOfContents() {
        const rwiComp = components.find(c => c.name === 'rwi');
        if(!rwiComp) return;
        let txt = "RWI Header: active components list...\n\n";
        components.forEach(c => {
            if (c.name !== 'rwi' && c.active) {
                txt += `- ${c.name}: [${c.config.begin_bracket}]...[${c.config.end_bracket}] ${c.config.rwi_text}\n\n`;
            }
        });
        rwiComp.content = txt;
        if(selectedComponent === 'rwi') {
             const editContent = document.getElementById('edit-content');
             if(editContent) editContent.value = txt;
        }
    }
    updateRWITableOfContents();

    function renderList() {
        const listEl = document.getElementById('components-list');
        listEl.innerHTML = '';
        components.sort((a, b) => {
            if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
            return (a.order || 0) - (b.order || 0);
        });

        components.forEach((comp, index) => {
            comp.order = index;
            const item = document.createElement('div');
            item.className = `component-item ${selectedComponent === comp.name ? 'selected' : ''}`;
            item.title = comp.config.rwi_text || comp.name;

            let pinStatusHtml = comp.name === 'rwi' 
                ? `<span style="font-size:10px; color:var(--brand-purple); margin-right:8px; font-weight:bold;">SYSTEM</span>`
                : `<button class="pin-btn" data-name="${comp.name}" title="${comp.pinned ? 'Unpin' : 'Pin'}">${comp.pinned ? '📌' : '📍'}</button>`;

            let toggleHtml = comp.name !== 'rwi' 
                ? `<label class="switch component-toggle" onclick="event.stopPropagation()"><input type="checkbox" ${comp.active ? 'checked' : ''} data-name="${comp.name}"><span class="slider"></span></label>`
                : '';

            item.innerHTML = `${pinStatusHtml}<span class="component-name">${comp.name}</span>${toggleHtml}`;
            item.onclick = () => selectComponent(comp.name);

            if (comp.name !== 'rwi') {
                item.querySelector('.pin-btn').onclick = (e) => { e.stopPropagation(); togglePin(comp.name); };
                item.querySelector('input').onchange = (e) => { toggleActive(comp.name, e.target.checked); };
            }
            listEl.appendChild(item);
        });
    }

    window.moveSelected = (direction) => {
        if (!selectedComponent) { showToast("No component selected", true); return; }
        const index = components.findIndex(c => c.name === selectedComponent);
        if (index === -1) return;
        const currentComp = components[index];
        if (currentComp.pinned) { showToast("Pinned items cannot be reordered", true); return; }
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= components.length) return;
        const targetComp = components[targetIndex];
        if (targetComp.pinned) { showToast("Cannot move into pinned section", true); return; }
        
        const tempOrder = currentComp.order;
        currentComp.order = targetComp.order;
        targetComp.order = tempOrder;
        renderList();
    };

    function togglePin(name) {
        const c = components.find(x => x.name === name);
        if (c) { c.pinned = !c.pinned; renderList(); }
    }

    function toggleActive(name, val) {
        const c = components.find(x => x.name === name);
        if (c) { c.active = val; updateRWITableOfContents(); showToast(val ? `${name} Activated` : `${name} Deactivated`); }
    }

    function selectComponent(name) {
        selectedComponent = name;
        renderList();
        const titleEl = document.getElementById('editor-title');
        const container = document.getElementById('editor-container');
        titleEl.innerText = name === '_NEW_' ? 'New Component' : `Editing: ${name}`;

        if (name === '_NEW_') {
            container.innerHTML = `
                <div class="form-group"><label>Component Name</label><input type="text" id="edit-name" placeholder="e.g., memory_buffer"></div>
                <div class="form-group"><label>Begin Bracket</label><input type="text" id="edit-begin" value="###_START###"></div>
                <div class="form-group"><label>End Bracket</label><input type="text" id="edit-end" value="###_END###"></div>
                <div class="form-group"><label>RWI Instructions</label><textarea id="edit-rwi" placeholder="Description..."></textarea></div>
                <div class="form-group"><label>Content</label><textarea id="edit-content"></textarea></div>
            `;
        } else {
            const c = components.find(x => x.name === name);
            if (!c) return;
            container.innerHTML = `
                <div class="form-group"><label>Begin Bracket</label><input type="text" id="edit-begin" value="${escapeHtml(c.config.begin_bracket)}"></div>
                <div class="form-group"><label>End Bracket</label><input type="text" id="edit-end" value="${escapeHtml(c.config.end_bracket)}"></div>
                <div class="form-group"><label>RWI Instructions</label><textarea id="edit-rwi">${escapeHtml(c.config.rwi_text)}</textarea></div>
                <div class="form-group"><label>Main Content</label><textarea id="edit-content" style="height: 300px;">${escapeHtml(c.content)}</textarea></div>
            `;
        }
        const delBtn = document.getElementById('delete-btn');
        if (delBtn) delBtn.style.display = (name === '_NEW_' || name === 'rwi') ? 'none' : 'block';
    }

    window.rwiAddNew = () => selectComponent('_NEW_');

    window.rwiSave = () => {
        const isNew = selectedComponent === '_NEW_';
        let name = selectedComponent;
        if (isNew) {
            name = document.getElementById('edit-name').value.trim();
            if (!name || components.find(c => c.name === name)) { showToast("Invalid Name", true); return; }
            components.push({
                name: name, pinned: false, active: true, order: components.length,
                config: {
                    begin_bracket: document.getElementById('edit-begin').value,
                    end_bracket: document.getElementById('edit-end').value,
                    rwi_text: document.getElementById('edit-rwi').value
                },
                content: document.getElementById('edit-content').value
            });
            selectedComponent = name;
        } else {
            const c = components.find(x => x.name === name);
            if (c) {
                c.config.begin_bracket = document.getElementById('edit-begin').value;
                c.config.end_bracket = document.getElementById('edit-end').value;
                c.config.rwi_text = document.getElementById('edit-rwi').value;
                c.content = document.getElementById('edit-content').value;
            }
        }
        updateRWITableOfContents();
        showToast("Component Saved");
        renderList();
        if (isNew) selectComponent(name);
    };

    window.rwiDelete = () => {
        if (!selectedComponent || selectedComponent === '_NEW_') return;
        if (confirm(`Delete ${selectedComponent}?`)) {
            components = components.filter(c => c.name !== selectedComponent);
            selectedComponent = null;
            document.getElementById('editor-container').innerHTML = '<p style="padding:20px; color:var(--text-dim)">Select a component.</p>';
            updateRWITableOfContents();
            renderList();
            showToast("Deleted");
        }
    };

    window.rwiBuild = () => {
        const btn = document.getElementById('rebuild-btn');
        if (!btn) return;
        const origText = btn.innerText;
        btn.innerText = "Building...";
        setTimeout(() => { btn.innerText = origText; showToast("Master Prompt Rebuilt"); }, 800);
    };
    
    window.rwiSaveSNS = () => { window.rwiPreview(); document.getElementById('modal-title').innerText = "Review Snapshot (.SNS)"; document.getElementById('download-btn').classList.remove('btn-hidden'); };
    
    window.rwiDownloadSNS = () => {
         let filename = prompt("Enter filename:", "lyrn_snapshot");
        if (!filename) return;
        if (!filename.endsWith('.sns')) filename += '.sns';
        const blob = new Blob([JSON.stringify(components, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Snapshot Downloaded");
        closeModal();
    }

    window.rwiLoadSNS = (input) => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                components = JSON.parse(e.target.result);
                selectedComponent = 'rwi'; 
                updateRWITableOfContents(); renderList(); selectComponent('rwi');
                showToast("Snapshot Loaded");
            } catch (err) { showToast("Error Parsing File", true); }
        };
        reader.readAsText(file); input.value = '';
    };

    window.rwiPreview = () => {
        let text = "";
        components.filter(c => c.active).forEach(c => { text += `${c.config.begin_bracket}\n${c.content}\n${c.config.end_bracket}\n\n`; });
        document.getElementById('modal-title').innerText = "Final RWI Prompt";
        document.getElementById('modal-content').value = text;
        document.getElementById('modal-content').classList.remove('hidden');
        document.getElementById('modal-html-content').classList.add('hidden');
        document.getElementById('copy-btn').classList.remove('btn-hidden');
        document.getElementById('download-btn').classList.add('btn-hidden');
        document.getElementById('preview-modal').classList.remove('hidden');
    };
    
    window.rwiShowHelp = () => {
        document.getElementById('modal-title').innerText = "RWI Builder Guide";
        document.getElementById('modal-html-content').innerHTML = `<p><strong>RWI Builder v1.1 Guide</strong></p><ul><li>Edit, reorder, and toggle components.</li><li>Export .sns files for the dashboard.</li></ul>`;
        document.getElementById('modal-content').classList.add('hidden');
        document.getElementById('modal-html-content').classList.remove('hidden');
        document.getElementById('copy-btn').classList.add('btn-hidden'); 
        document.getElementById('download-btn').classList.add('btn-hidden');
        document.getElementById('preview-modal').classList.remove('hidden');
    };
    
    window.closeModal = () => document.getElementById('preview-modal').classList.add('hidden');
    window.copyModalContent = () => { document.getElementById('modal-content').select(); document.execCommand('copy'); showToast("Copied!"); }
    window.onclick = (event) => { if (event.target == document.getElementById('preview-modal')) closeModal(); }
    selectComponent("rwi");
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