import { EyeOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Image,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { ensureArray, formatCurrency, ordersApi } from '../services/adminApi';
import { orderStatusLabel, paymentStatusLabel } from '../services/displayLabels';
import type { AdminUser, Order, OrderListResult } from '../services/types';

function getCustomerName(order: Order) {
  const user = order.user as AdminUser | undefined;
  return user?.full_name || user?.name || user?.email || '-';
}

function getCustomerEmail(order: Order) {
  const user = order.user as AdminUser | undefined;
  return user?.email || '-';
}

function formatDateTime(value?: string) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function DetailText({ children }: { children: React.ReactNode }) {
  return <Typography.Text className="text-slate-700">{children || '-'}</Typography.Text>;
}

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [detail, setDetail] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [messageApi, contextHolder] = message.useMessage();

  const loadOrders = async (nextPage = page, nextLimit = limit) => {
    setLoading(true);

    try {
      const result = await ordersApi.list({ page: nextPage, limit: nextLimit });
      const orderList = ensureArray<Order>(result, ['orders', 'data']);
      const meta = result as OrderListResult;

      setOrders(orderList);
      setTotal(meta.totalOrders || orderList.length);
      setPage(meta.currentPage || nextPage);
    } catch {
      messageApi.error('Không tải được danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (record: Order) => {
    setDetail(record);
    setDetailLoading(true);

    try {
      setDetail(await ordersApi.detail(record._id || record.orderCode || ''));
    } catch {
      messageApi.error('Không tải được chi tiết đơn hàng');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: ColumnsType<Order> = [
      {
        title: 'Mã đơn',
        dataIndex: 'orderCode',
        key: 'orderCode',
        render: (value, record) => value || record._id,
      },
      {
        title: 'Khách hàng',
        key: 'user',
        render: (_, record) => getCustomerName(record),
      },
      {
        title: 'Thanh toán',
        dataIndex: 'paymentStatus',
        key: 'paymentStatus',
        render: (value) => {
          const color = value === 'paid' ? 'green' : value === 'failed' ? 'red' : 'gold';
          return <Tag color={color}>{paymentStatusLabel(value || 'unpaid')}</Tag>;
        },
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (value) => <Tag>{orderStatusLabel(value || 'pending')}</Tag>,
      },
      {
        title: 'Tổng tiền',
        dataIndex: 'totalPrice',
        key: 'totalPrice',
        align: 'right',
        render: (value) => formatCurrency(value),
      },
      {
        title: '',
        key: 'actions',
        align: 'right',
        render: (_, record) => (
          <Button icon={<EyeOutlined />} onClick={() => openDetail(record)}>
            Chi tiết
          </Button>
        ),
      },
  ];

  return (
    <div className="space-y-4">
      {contextHolder}
      <Space className="w-full justify-between" align="start">
        <div>
          <Typography.Title level={2} className="!mb-1">
            Đơn hàng
          </Typography.Title>
          <Typography.Text type="secondary">Theo dõi tất cả đơn hàng trong hệ thống.</Typography.Text>
        </div>
        <Button onClick={() => loadOrders()}>Tải lại</Button>
      </Space>

      <Card variant="borderless" className="shadow-admin" styles={{ body: { padding: 0 } }}>
        <Table
          rowKey={(record) => record._id || record.orderCode || ''}
          columns={columns}
          dataSource={orders}
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: true,
            onChange: (nextPage, nextLimit) => {
              setPage(nextPage);
              setLimit(nextLimit);
              loadOrders(nextPage, nextLimit);
            },
          }}
        />
      </Card>

      <Modal
        title="Chi tiết đơn hàng"
        open={Boolean(detail)}
        onCancel={() => setDetail(null)}
        width={1080}
        footer={null}
        confirmLoading={detailLoading}
        styles={{ body: { maxHeight: '78vh', overflowY: 'auto' } }}
      >
        {detailLoading && !detail ? (
          <Typography.Text>Đang tải chi tiết đơn hàng...</Typography.Text>
        ) : null}

        {detail && (
          <Space orientation="vertical" size={18} className="w-full">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card size="small" title="Thông tin đơn hàng" variant="borderless" className="bg-slate-50">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Mã đơn">
                      <DetailText>{detail.orderCode || detail._id}</DetailText>
                    </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag>{orderStatusLabel(detail.status)}</Tag>
                </Descriptions.Item>
                    <Descriptions.Item label="Đã thanh toán">
                      <DetailText>{detail.isPaid ? 'Có' : 'Chưa'}</DetailText>
                    </Descriptions.Item>
                    <Descriptions.Item label="Đã giao">
                      <DetailText>{detail.isDelivered ? 'Có' : 'Chưa'}</DetailText>
                    </Descriptions.Item>
                    <Descriptions.Item label="Lý do hủy">
                      <DetailText>{detail.cancellationReason || '-'}</DetailText>
                    </Descriptions.Item>
                <Descriptions.Item label="Thời gian đặt">
                  <DetailText>{formatDateTime(detail.createdAt)}</DetailText>
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật gần nhất">
                  <DetailText>{formatDateTime(detail.updatedAt)}</DetailText>
                </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card size="small" title="Khách hàng & giao hàng" variant="borderless" className="bg-slate-50">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Khách hàng">
                      <DetailText>{getCustomerName(detail)}</DetailText>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      <DetailText>{getCustomerEmail(detail)}</DetailText>
                    </Descriptions.Item>
                    <Descriptions.Item label="Người nhận">
                      <DetailText>{detail.shippingAddress?.fullName}</DetailText>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                      <DetailText>{detail.shippingAddress?.phone}</DetailText>
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ">
                      <DetailText>{detail.shippingAddress?.address}</DetailText>
                    </Descriptions.Item>
                    <Descriptions.Item label="Tỉnh/Thành phố">
                      <DetailText>{detail.shippingAddress?.city}</DetailText>
                    </Descriptions.Item>
                    <Descriptions.Item label="Quận/Huyện">
                      <DetailText>{detail.shippingAddress?.district}</DetailText>
                    </Descriptions.Item>
                    <Descriptions.Item label="Phường/Xã">
                      <DetailText>{detail.shippingAddress?.ward}</DetailText>
                    </Descriptions.Item>
                    <Descriptions.Item label="Chi tiết">
                      <DetailText>{detail.shippingAddress?.detail}</DetailText>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <Card size="small" title="Thanh toán" variant="borderless" className="bg-slate-50">
              <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small">
                <Descriptions.Item label="Phương thức">
                  <DetailText>{detail.paymentMethod || '-'}</DetailText>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái thanh toán">
                  <Tag color={detail.paymentStatus === 'paid' ? 'green' : 'gold'}>
                    {paymentStatusLabel(detail.paymentStatus)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền cần thu">
                  <Typography.Text strong>{formatCurrency(detail.totalPrice)}</Typography.Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="Sản phẩm theo cửa hàng" variant="borderless" className="bg-slate-50">
              <Space orientation="vertical" size={16} className="w-full">
                {(detail.shopOrders || []).map((shopOrder, index) => (
                  <Card
                    key={shopOrder._id || `${shopOrder.shopName}-${index}`}
                    size="small"
                    title={shopOrder.shopName || shopOrder.shop?.name || `Cửa hàng ${index + 1}`}
                  >
                    <Row gutter={[12, 12]} className="mb-3">
                      {shopOrder.shop?.cover_image ? (
                        <Col flex="64px">
                          <Image
                            width={64}
                            height={64}
                            src={shopOrder.shop.cover_image}
                            preview={false}
                            className="rounded object-cover"
                          />
                        </Col>
                      ) : null}
                      <Col flex="auto">
                        <Typography.Text strong>
                          {shopOrder.shop?.name || shopOrder.shopName || '-'}
                        </Typography.Text>
                        <Typography.Text className="block text-sm text-slate-500">
                          {shopOrder.shop?.address || '-'}
                        </Typography.Text>
                        <Typography.Text className="block text-xs text-slate-500">
                          {shopOrder.shop?.slug || shopOrder.shop?._id || '-'}
                        </Typography.Text>
                      </Col>
                    </Row>

                    <Table
                      size="small"
                      rowKey={(item, itemIndex) => item.product?._id || `${item.name}-${itemIndex}`}
                      pagination={false}
                      dataSource={shopOrder.items || []}
                      columns={[
                        {
                          title: 'Sản phẩm',
                          key: 'product',
                          render: (_, item) => (
                            <Space>
                              {item.image || item.product?.image_url ? (
                                <Image
                                  width={46}
                                  height={46}
                                  src={item.image || item.product?.image_url}
                                  preview={false}
                                  className="rounded object-cover"
                                />
                              ) : (
                                <div className="h-11 w-11 rounded bg-slate-200" />
                              )}
                              <div>
                                <Typography.Text strong>
                                  {item.name || item.product?.name || '-'}
                                </Typography.Text>
                              </div>
                            </Space>
                          ),
                        },
                        {
                          title: 'Đơn giá',
                          dataIndex: 'price',
                          key: 'price',
                          align: 'right',
                          render: (value) => formatCurrency(value),
                        },
                        {
                          title: 'Số lượng',
                          dataIndex: 'quantity',
                          key: 'quantity',
                          align: 'right',
                        },
                        {
                          title: 'Thành tiền',
                          dataIndex: 'itemTotal',
                          key: 'itemTotal',
                          align: 'right',
                          render: (value) => formatCurrency(value),
                        },
                      ]}
                    />

                    <Divider className="my-3" />
                    <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small">
                      <Descriptions.Item label="Phương thức giao">
                        <DetailText>{shopOrder.shippingLabel || shopOrder.shippingMethod || '-'}</DetailText>
                      </Descriptions.Item>
                      <Descriptions.Item label="Tiền hàng">
                        <DetailText>{formatCurrency(shopOrder.productTotal)}</DetailText>
                      </Descriptions.Item>
                      <Descriptions.Item label="Phí giao hàng">
                        <DetailText>{formatCurrency(shopOrder.shippingPrice)}</DetailText>
                      </Descriptions.Item>
                      <Descriptions.Item label="Tổng shop">
                        <Typography.Text strong>{formatCurrency(shopOrder.shopTotal)}</Typography.Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Ghi chú">
                        <DetailText>{shopOrder.note || '-'}</DetailText>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                ))}
              </Space>
            </Card>

            <Card size="small" title="Tổng kết đơn hàng" variant="borderless" className="bg-slate-50">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Tạm tính">
                  <DetailText>{formatCurrency(detail.subtotal)}</DetailText>
                </Descriptions.Item>
                <Descriptions.Item label="Phí giao hàng">
                  <DetailText>{formatCurrency(detail.shippingTotal)}</DetailText>
                </Descriptions.Item>
                <Descriptions.Item label="Tổng thanh toán">
                  <Typography.Title level={4} className="!m-0 !text-brand-600">
                    {formatCurrency(detail.totalPrice)}
                  </Typography.Title>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  );
}

export default OrdersPage;
