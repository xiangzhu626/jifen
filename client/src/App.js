import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Spin, message } from 'antd';
import { checkAuth } from './services/api';

// 导入页面组件
import Login from './pages/Login';
import Members from './pages/Members';
import MemberDetail from './pages/MemberDetail';
import Points from './pages/Points';
import PointsRanking from './pages/PointsRanking';
import PublicRanking from './pages/PublicRanking';
import AppHeader from './components/AppHeader';
import AppSidebar from './components/AppSidebar';

// 导入上下文
import { AuthProvider } from './context/AuthContext';

const { Content } = Layout;

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const [initialLoading, setInitialLoading] = useState(true);
  
  useEffect(() => {
    // 简单检查token是否存在，不做实际验证
    // 实际验证在AuthProvider中进行
    const token = localStorage.getItem('token');
    if (!token) {
      setInitialLoading(false);
    } else {
      // 给一点时间让用户看到加载动画
      setTimeout(() => {
        setInitialLoading(false);
      }, 500);
    }
  }, []);
  
  if (initialLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* 公开的排行榜路由 */}
          <Route path="/public/ranking" element={<PublicRanking />} />
          
          {/* 将根路径重定向到会员管理页面 */}
          <Route path="/" element={<Navigate to="/members" replace />} />
          
          <Route path="/members" element={
            <ProtectedRoute>
              <Layout style={{ minHeight: '100vh' }}>
                <AppSidebar />
                <Layout>
                  <AppHeader />
                  <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <Members />
                  </Content>
                </Layout>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/members/:id" element={
            <ProtectedRoute>
              <Layout style={{ minHeight: '100vh' }}>
                <AppSidebar />
                <Layout>
                  <AppHeader />
                  <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <MemberDetail />
                  </Content>
                </Layout>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/points" element={
            <ProtectedRoute>
              <Layout style={{ minHeight: '100vh' }}>
                <AppSidebar />
                <Layout>
                  <AppHeader />
                  <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <Points />
                  </Content>
                </Layout>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/points/ranking" element={
            <ProtectedRoute>
              <Layout style={{ minHeight: '100vh' }}>
                <AppSidebar />
                <Layout>
                  <AppHeader />
                  <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
                    <PointsRanking />
                  </Content>
                </Layout>
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/members" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 