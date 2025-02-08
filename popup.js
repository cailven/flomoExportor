/**
 * 初始化弹出面板
 */
document.addEventListener('DOMContentLoaded', async () => {
    updateSelectedNotes();
});

/**
 * 更新选中的笔记列表
 */
async function updateSelectedNotes() {
    // 获取当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('flomoapp.com')) {
        showEmptyState('请在 Flomo 页面使用此扩展');
        return;
    }

    // 获取存储的选中笔记
    chrome.storage.local.get(['selectedNotes'], function(result) {
        const selectedNotes = result.selectedNotes || {};
        const noteCount = Object.values(selectedNotes).filter(Boolean).length;
        
        // 更新笔记数量
        document.querySelector('.note-count').textContent = `${noteCount} 条笔记`;
        
        // 获取笔记列表容器
        const noteList = document.querySelector('.note-list');
        noteList.innerHTML = '';
        
        if (noteCount === 0) {
            showEmptyState('还没有选择任何笔记');
            return;
        }

        // 启用导出按钮
        document.getElementById('exportBtn').disabled = false;
        
        // 向页面发送消息获取笔记内容
        chrome.tabs.sendMessage(tab.id, { type: 'getSelectedNotesContent' }, function(response) {
            if (response && response.notes) {
                response.notes.forEach(note => {
                    if (selectedNotes[note.id]) {
                        const noteElement = createNoteElement(note);
                        noteList.appendChild(noteElement);
                    }
                });
            }
        });
    });
}

/**
 * 创建笔记元素
 * @param {Object} note 笔记数据
 * @returns {HTMLElement}
 */
function createNoteElement(note) {
    const div = document.createElement('div');
    div.className = 'note-item';
    div.textContent = note.content;
    return div;
}

/**
 * 显示空状态
 * @param {string} message 显示的消息
 */
function showEmptyState(message) {
    const noteList = document.querySelector('.note-list');
    noteList.innerHTML = `<div class="empty-state">${message}</div>`;
    document.getElementById('exportBtn').disabled = true;
}

// 导出按钮点击事件
document.getElementById('exportBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { type: 'exportSelectedNotes' });
}); 