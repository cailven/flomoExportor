# Flomo Export Helper

这是一个 Chrome 扩展，用于增强 Flomo 网页版的导出功能。

## 功能特性

- 在每条 Flomo 笔记的标题栏添加美观的复选框
- 复选框具有悬停效果和绿色对勾选中状态
- 支持通过复选框选择要导出的笔记
- 简单直观的操作界面

## 安装说明

1. 克隆或下载本项目到本地
2. 打开 Chrome 浏览器，进入扩展管理页面 (chrome://extensions/)
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"，选择本项目目录

## 使用方法

1. 安装扩展后访问 Flomo 网页版
2. 在每条笔记旁会出现复选框
3. 勾选需要导出的笔记
4. 使用导出功能批量导出所选笔记

## 技术栈

- Chrome Extension Manifest V3
- JavaScript
- CSS

## 开发说明

本项目使用 Chrome Extension Manifest V3 开发，主要包含以下文件：

- manifest.json: 扩展配置文件
- content.js: 注入页面的脚本
- content.css: 样式文件
- background.js: Service Worker 后台脚本 