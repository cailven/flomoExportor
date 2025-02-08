/**
 * Service Worker 后台脚本
 * 用于处理扩展的后台任务和消息通信
 */

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener(() => {
    // 初始化存储
    chrome.storage.local.set({
        selectedNotes: {},
        panelCollapsed: false
    });
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
    if (tab.url.includes('flomoapp.com')) {
        chrome.tabs.sendMessage(tab.id, { type: 'togglePanel' });
    }
});

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getSelectedNotes') {
        chrome.storage.local.get(['selectedNotes'], function(result) {
            sendResponse(result.selectedNotes || {});
        });
        return true; // 保持消息通道开启
    } else if (request.type === 'downloadFile') {
        chrome.downloads.download({
            url: request.url,
            filename: request.filename,
            saveAs: true
        }, () => {
            sendResponse();
        });
        return true;
    }
}); 