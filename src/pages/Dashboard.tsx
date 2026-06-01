import {
  ArrowUpOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Card, Col, Progress, Row, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import {
  ensureArray,
  formatCurrency,
  ordersApi,
  productsApi,
  usersApi,
  vendorsApi,
} from '../services/adminApi';
import { orderStatusLabel } from '../services/displayLabels';
import type { AdminUser, Order, OrderListResult, Product, ProductListResult } from '../services/types';

type OrderRow = {
  key: string;
  code: string;
  customer: string;
  status: string;
  total: string;
};

const orderColumns: ColumnsType<OrderRow> = [
  {
    title: 'Mã đơn',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: 'Khách hàng',
    dataIndex: 'customer',
    key: 'customer',
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: (status) => {
      const color = status === 'delivered' ? 'green' : status === 'cancelled' ? 'red' : 'blue';
      return <Tag color={color}>{orderStatusLabel(status)}</Tag>;
    },
  },
  {
    title: 'Tổng tiền',
    dataIndex: 'total',
    key: 'total',
    align: 'right',
  },
];

function Dashboard() {
  const [orderRows, setOrderRows] = useState<OrderRow[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pendingVendors, setPendingVendors] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    Promise.allSettled([
      ordersApi.list({ page: 1, limit: 5 }),
      productsApi.list({ page: 1, limit: 1 }),
      usersApi.list(),
      vendorsApi.list('pending'),
    ])
      .then(([ordersResult, productsResult, usersResult, vendorsResult]) => {
        if (ordersResult.status === 'fulfilled') {
          const payload = ordersResult.value;
          const list = ensureArray<Order>(payload, ['orders', 'data']);
          const meta = payload as OrderListResult;

          setOrderRows(
            list.map((order) => ({
              key: order._id || order.orderCode || '',
              code: order.orderCode || order._id,
              customer:
                (order.user as AdminUser | undefined)?.full_name ||
                (order.user as AdminUser | undefined)?.email ||
                '-',
              status: order.status || 'pending',
              total: formatCurrency(order.totalPrice),
            }))
          );
          setTotalOrders(meta.totalOrders || list.length);
        }

        if (productsResult.status === 'fulfilled') {
          const payload = productsResult.value;
          const list = ensureArray<Product>(payload, ['products', 'data']);
          const meta = payload as ProductListResult;
          setTotalProducts(meta.totalProduts || meta.totalProducts || list.length);
        }

        if (usersResult.status === 'fulfilled') {
          setTotalUsers(ensureArray<AdminUser>(usersResult.value, ['users', 'data']).length);
        }

        if (vendorsResult.status === 'fulfilled') {
          setPendingVendors(
            ensureArray<AdminUser>(vendorsResult.value, ['vendors', 'data']).length
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(
    () => [
      {
        title: 'Doanh thu',
        value: '-',
        caption: 'chờ API thống kê doanh thu',
        icon: <ArrowUpOutlined />,
      },
      {
        title: 'Đơn hàng',
        value: totalOrders.toLocaleString('vi-VN'),
        caption: 'tổng đơn hàng',
        icon: <ShoppingCartOutlined />,
      },
      {
        title: 'Người dùng',
        value: totalUsers.toLocaleString('vi-VN'),
        caption: 'tài khoản trong hệ thống',
        icon: <TeamOutlined />,
      },
      {
        title: 'Vendor chờ duyệt',
        value: pendingVendors.toLocaleString('vi-VN'),
        caption: `${totalProducts.toLocaleString('vi-VN')} sản phẩm`,
        icon: <WarningOutlined />,
      },
    ],
    [pendingVendors, totalOrders, totalProducts, totalUsers]
  );

  return (
    <div className="space-y-6">
      <div>
        <Typography.Title level={2} className="!mb-1">
          Tổng quan quản trị
        </Typography.Title>
        <Typography.Text type="secondary">
          Theo dõi vận hành, đơn hàng và các đầu việc cần xử lý.
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        {stats.map((item) => (
          <Col xs={24} sm={12} xl={6} key={item.title}>
            <Card className="h-full shadow-admin" variant="borderless">
              <Space align="start" className="w-full justify-between">
                <div>
                  <Typography.Text type="secondary">{item.title}</Typography.Text>
                  <Typography.Title level={3} className="!mb-1 !mt-2">
                    {item.value}
                  </Typography.Title>
                  <Typography.Text className="text-sm text-slate-500">
                    {item.caption}
                  </Typography.Text>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-lg text-brand-600">
                  {item.icon}
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card
            title="Đơn hàng gần đây"
            variant="borderless"
            className="shadow-admin"
            styles={{ body: { padding: 0 } }}
          >
            <Table
              columns={orderColumns}
              dataSource={orderRows}
              loading={loading}
              pagination={false}
              scroll={{ x: 640 }}
            />
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Tình trạng hệ thống" variant="borderless" className="shadow-admin">
            <Space orientation="vertical" size={18} className="w-full">
              <div>
                <Space className="mb-2 w-full justify-between">
                  <Typography.Text>Hoàn thành đơn</Typography.Text>
                  <Typography.Text strong>72%</Typography.Text>
                </Space>
                <Progress percent={72} showInfo={false} strokeColor="#16a34a" />
              </div>
              <Space>
                <CheckCircleOutlined className="text-green-600" />
                <Typography.Text>API đang hoạt động ổn định</Typography.Text>
              </Space>
              <Space>
                <ClockCircleOutlined className="text-amber-500" />
                <Typography.Text>3 tác vụ đang chờ duyệt</Typography.Text>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
