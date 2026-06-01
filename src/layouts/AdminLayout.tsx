import {
  BellOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProductOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Layout, Menu, Space, Typography, message } from 'antd';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authSlice';
import Dashboard from '../pages/Dashboard';
import OrdersPage from '../pages/OrdersPage';
import ProductsPage from '../pages/ProductsPage';
import ShopsPage from '../pages/ShopsPage';
import SpecialtiesPage from '../pages/SpecialtiesPage';
import UsersPage from '../pages/UsersPage';
import VendorsPage from '../pages/VendorsPage';
import { authApi } from '../services/adminApi';
import type { AdminUser } from '../services/types';

const { Header, Sider, Content } = Layout;

const menuItems = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: 'Tổng quan',
  },
  {
    key: 'orders',
    icon: <ShoppingCartOutlined />,
    label: 'Đơn hàng',
  },
  {
    key: 'products',
    icon: <ProductOutlined />,
    label: 'Sản phẩm',
  },
  {
    key: 'users',
    icon: <TeamOutlined />,
    label: 'Người dùng',
  },
  {
    key: 'vendors',
    icon: <UserOutlined />,
    label: 'Nhà bán',
  },
  {
    key: 'shops',
    icon: <ShopOutlined />,
    label: 'Cửa hàng',
  },
  {
    key: 'specialties',
    icon: <TagsOutlined />,
    label: 'Đặc sản',
  },
];

type AdminLayoutProps = {
  onLoggedOut: () => void;
};

function getUserDisplayName(user: AdminUser | null) {
  return user?.full_name || user?.name || user?.email || 'Quản trị viên';
}

function renderContent(activeKey: string) {
  switch (activeKey) {
    case 'orders':
      return <OrdersPage />;
    case 'products':
      return <ProductsPage />;
    case 'users':
      return <UsersPage />;
    case 'vendors':
      return <VendorsPage />;
    case 'shops':
      return <ShopsPage />;
    case 'specialties':
      return <SpecialtiesPage />;
    default:
      return <Dashboard />;
  }
}

function AdminLayout({ onLoggedOut }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeKey, setActiveKey] = useState('dashboard');
  const [messageApi, contextHolder] = message.useMessage();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const displayName = getUserDisplayName(user);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      messageApi.warning('Máy chủ không phản hồi khi đăng xuất, đã xóa phiên local');
    } finally {
      dispatch(logout());
      onLoggedOut();
    }
  };

  return (
    <Layout className="min-h-screen bg-slate-100">
      {contextHolder}
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="!bg-slate-950"
      >
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            DA
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <Typography.Text className="block !text-sm !font-semibold !text-white">
                DA Admin
              </Typography.Text>
              <Typography.Text className="block !text-xs !text-slate-400">
                Quản trị
              </Typography.Text>
            </div>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          className="!bg-slate-950"
          onClick={({ key }) => setActiveKey(key)}
        />
      </Sider>

      <Layout>
        <Header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
          <Space>
            <Button
              type="text"
              aria-label="Thu gọn menu"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((value) => !value)}
            />
            <Typography.Text strong>Bảng quản trị</Typography.Text>
          </Space>

          <Space size={18}>
            <Badge dot>
              <Button type="text" aria-label="Thông báo" icon={<BellOutlined />} />
            </Badge>
            <Space>
              <Avatar className="bg-emerald-600">
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
              <div className="hidden leading-tight sm:block">
                <Typography.Text className="block !text-sm !font-medium">
                  {displayName}
                </Typography.Text>
                <Typography.Text className="block !text-xs !text-slate-500">
                  {user?.role || 'Quản trị viên'}
                </Typography.Text>
              </div>
            </Space>
            <Button type="text" aria-label="Đăng xuất" icon={<LogoutOutlined />} onClick={handleLogout} />
          </Space>
        </Header>

        <Content className="p-4 md:p-6">
          {renderContent(activeKey)}
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
