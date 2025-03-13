import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import './index.css';

// 确保 DOM 完全加载后再执行渲染
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ConfigProvider locale={zhCN}>
          <App />
        </ConfigProvider>
      </React.StrictMode>
    );
  } else {
    console.error('找不到id为"root"的DOM元素，请检查index.html文件');
  }
}); 