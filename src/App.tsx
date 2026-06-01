import { ConfigProvider, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './app/hooks';
import { setCredentials } from './features/auth/authSlice';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/LoginPage';
import { authApi } from './services/adminApi';
import type { AdminUser } from './services/types';

function getAccessToken(payload: unknown) {
  const data = payload as Record<string, unknown>;
  return (
    (data.accessToken as string | undefined) ||
    (data.access_token as string | undefined) ||
    (data.token as string | undefined)
  );
}

function getUser(payload: unknown): AdminUser {
  const data = payload as Record<string, unknown>;
  return (
    (data.user as AdminUser | undefined) ||
    (data.admin as AdminUser | undefined) || {
      email: 'admin@example.com',
      role: 'admin',
      full_name: 'Quản trị viên',
    }
  );
}

function App() {
  const [bootstrapping, setBootstrapping] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (accessToken) {
      return;
    }

    let cancelled = false;
    setBootstrapping(true);

    authApi
      .refreshToken()
      .then((result) => {
        const token = getAccessToken(result);

        if (!cancelled && token) {
          dispatch(setCredentials({ accessToken: token, user: getUser(result) }));
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setBootstrapping(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, authVersion, dispatch]);

  const content = bootstrapping ? (
    <div className="grid min-h-screen place-items-center bg-slate-100">
      <Spin size="large" />
    </div>
  ) : accessToken ? (
    <AdminLayout onLoggedOut={() => setAuthVersion((value) => value + 1)} />
  ) : (
    <LoginPage onLoggedIn={() => setAuthVersion((value) => value + 1)} />
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 8,
          colorPrimary: '#1677ff',
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
      }}
    >
      {content}
    </ConfigProvider>
  );
}

export default App;
