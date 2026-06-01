import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { useAppDispatch } from '../app/hooks';
import { setCredentials } from '../features/auth/authSlice';
import { authApi } from '../services/adminApi';
import type { AdminUser, LoginPayload } from '../services/types';

type LoginPageProps = {
  onLoggedIn: () => void;
};

function getAccessToken(payload: unknown) {
  const data = payload as Record<string, unknown>;
  return (
    (data.accessToken as string | undefined) ||
    (data.access_token as string | undefined) ||
    (data.token as string | undefined)
  );
}

function getUser(payload: unknown, email: string): AdminUser {
  const data = payload as Record<string, unknown>;
  return (
    (data.user as AdminUser | undefined) ||
    (data.admin as AdminUser | undefined) || {
      email,
      role: 'admin',
      full_name: 'Quản trị viên',
    }
  );
}

function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const dispatch = useAppDispatch();

  const handleSubmit = async (values: LoginPayload) => {
    setLoading(true);

    try {
      const result = await authApi.login(values);
      const accessToken = getAccessToken(result);

      if (!accessToken) {
        throw new Error('Máy chủ không trả accessToken.');
      }

      dispatch(setCredentials({ accessToken, user: getUser(result, values.email) }));
      messageApi.success('Đăng nhập thành công');
      onLoggedIn();
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Không thể đăng nhập';
      messageApi.error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4">
      {contextHolder}
      <Card className="w-full max-w-md shadow-admin" variant="borderless">
        <div className="mb-8">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-brand-500 text-base font-bold text-white">
            DA
          </div>
          <Typography.Title level={2} className="!mb-1">
            Đăng nhập admin
          </Typography.Title>
          <Typography.Text type="secondary">
            Sử dụng tài khoản admin để quản lý hệ thống.
          </Typography.Text>
        </div>

        <Form<LoginPayload>
          layout="vertical"
          
          onFinish={handleSubmit}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Nhập email admin' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="email" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Nhập mật khẩu' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
          </Form.Item>

          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            Đăng nhập
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default LoginPage;
