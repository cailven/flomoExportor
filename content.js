/**
 * 为每条笔记添加复选框的主函数
 */
console.log('Content script is running'); // 确认脚本是否被执行

// 创建导出面板
function createExportPanel() {
    const panel = document.createElement('div');
    panel.className = 'flomo-export-panel';
    panel.innerHTML = `
        <button class="flomo-export-panel-toggle">⇄</button>
        <div class="flomo-export-panel-header">
            <h2 class="flomo-export-panel-title">已选择的笔记</h2>
            <span class="flomo-export-panel-count">0 条笔记</span>
        </div>
        <div class="flomo-export-panel-list"></div>
        <button class="flomo-export-panel-export" disabled>导出选中的笔记</button>
    `;
    
    // 添加面板切换功能
    const toggleBtn = panel.querySelector('.flomo-export-panel-toggle');
    toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
        // 保存面板状态
        chrome.storage.local.set({ panelCollapsed: panel.classList.contains('collapsed') });
    });
    
    // 添加导出按钮功能
    const exportBtn = panel.querySelector('.flomo-export-panel-export');
    exportBtn.addEventListener('click', exportSelectedNotes);
    
    document.body.appendChild(panel);
    
    // 恢复面板状态
    chrome.storage.local.get(['panelCollapsed'], function(result) {
        if (result.panelCollapsed) {
            panel.classList.add('collapsed');
        }
    });
    
    return panel;
}

// 更新面板内容
function updateExportPanel() {
    const panel = document.querySelector('.flomo-export-panel');
    if (!panel) return;
    
    chrome.storage.local.get(['selectedNotes'], function(result) {
        const selectedNotes = result.selectedNotes || {};
        const noteCount = Object.values(selectedNotes).filter(Boolean).length;
        
        // 更新笔记数量
        panel.querySelector('.flomo-export-panel-count').textContent = `${noteCount} 条笔记`;
        
        // 更新笔记列表
        const noteList = panel.querySelector('.flomo-export-panel-list');
        noteList.innerHTML = '';
        
        if (noteCount === 0) {
            noteList.innerHTML = '<div class="flomo-export-panel-empty">还没有选择任何笔记</div>';
            panel.querySelector('.flomo-export-panel-export').disabled = true;
            return;
        }
        
        // 启用导出按钮
        panel.querySelector('.flomo-export-panel-export').disabled = false;
        
        // 添加选中的笔记
        document.querySelectorAll('.mainContent').forEach(noteContainer => {
            const noteId = noteContainer.getAttribute('data-id');
            if (selectedNotes[noteId]) {
                const content = noteContainer.querySelector('.richText').textContent.trim();
                const noteElement = document.createElement('div');
                noteElement.className = 'flomo-export-panel-item';
                noteElement.textContent = content;
                noteList.appendChild(noteElement);
            }
        });
    });
}

function addCheckboxesToNotes() {
    // 获取所有笔记元素
    const notes = document.querySelectorAll('.richText');
    
    console.log('找到的笔记数量:', notes.length);
    
    notes.forEach(note => {
        // 检查是否已经添加过复选框
        if (!note.querySelector('.flomo-export-checkbox')) {
            // 创建复选框容器
            const checkboxContainer = document.createElement('label');
            checkboxContainer.className = 'flomo-export-checkbox';
            
            // 创建复选框
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.addEventListener('change', function() {
                // 保存选中状态
                saveNoteSelection(note, this.checked);
                // 更新面板
                updateExportPanel();
            });
            
            // 创建自定义复选框样式元素
            const checkmark = document.createElement('span');
            checkmark.className = 'checkmark';
            
            // 组装复选框
            checkboxContainer.appendChild(checkbox);
            checkboxContainer.appendChild(checkmark);
            
            // 将复选框添加到笔记标题栏
            const titleBar = note.closest('.mainContent');
            if (titleBar) {
                titleBar.appendChild(checkboxContainer);
            }
            
            // 恢复之前的选中状态
            restoreNoteSelection(note, checkbox);
        }
    });
}

/**
 * 保存笔记的选中状态
 * @param {Element} note - 笔记元素
 * @param {boolean} isSelected - 是否选中
 */
function saveNoteSelection(note, isSelected) {
    const noteId = note.closest('.mainContent').getAttribute('data-id');
    chrome.storage.local.get(['selectedNotes'], function(result) {
        const selectedNotes = result.selectedNotes || {};
        selectedNotes[noteId] = isSelected;
        chrome.storage.local.set({ selectedNotes: selectedNotes });
    });
}

/**
 * 恢复笔记的选中状态
 * @param {Element} note - 笔记元素
 * @param {Element} checkbox - 复选框元素
 */
function restoreNoteSelection(note, checkbox) {
    const noteId = note.closest('.mainContent').getAttribute('data-id');
    chrome.storage.local.get(['selectedNotes'], function(result) {
        const selectedNotes = result.selectedNotes || {};
        if (noteId in selectedNotes) {
            checkbox.checked = selectedNotes[noteId];
        }
    });
}

/**
 * 获取选中笔记的内容
 * @returns {Array} 选中的笔记数组
 */
function getSelectedNotesContent() {
    const selectedNotes = [];
    document.querySelectorAll('.mainContent').forEach(noteContainer => {
        const checkbox = noteContainer.querySelector('.flomo-export-checkbox input');
        if (checkbox && checkbox.checked) {
            selectedNotes.push({
                id: noteContainer.getAttribute('data-id'),
                content: noteContainer.querySelector('.richText').textContent.trim()
            });
        }
    });
    return selectedNotes;
}

/**
 * 导出选中的笔记
 */
function exportSelectedNotes() {
    const notes = getSelectedNotesContent();
    if (notes.length === 0) {
        alert('请先选择要导出的笔记');
        return;
    }

    // 创建导出内容
    const exportContent = notes.map(note => note.content).join('\n\n---\n\n');
    
    // 使用 chrome.downloads API 下载文件
    const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    chrome.runtime.sendMessage({
        type: 'downloadFile',
        url: url,
        filename: `flomo_export_${new Date().toISOString().slice(0, 10)}.txt`
    }, () => {
        URL.revokeObjectURL(url);
    });
}

// 监听来自扩展图标的点击事件
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'togglePanel') {
        const panel = document.querySelector('.flomo-export-panel');
        if (panel) {
            panel.classList.toggle('collapsed');
        }
    }
    return true;
});

// 初始化
setTimeout(() => {
    createExportPanel();
    addCheckboxesToNotes();
}, 2000);

// 监听页面变化，动态添加复选框
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && node.classList.contains('richText')) {
                addCheckboxesToNotes();
                updateExportPanel();
            }
        });
    });
});

// 启动监听
observer.observe(document.body, {
    childList: true,
    subtree: true
}); 