import { EyeOutlined, StopOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Image,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { ensureArray, formatCurrency, shopsApi } from '../services/adminApi';
import { shopStatusLabel } from '../services/displayLabels';
import type { Product, Shop } from '../services/types';

function getNumericField(record: Product, fieldNames: string[]) {
  const source = record as Product & Record<string, unknown>;

  for (const fieldName of fieldNames) {
    const value = source[fieldName];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return undefined;
}

function getProductRating(record: Product) {
  const directRating = getNumericField(record, [
    'rating',
    'averageRating',
    'avgRating',
    'ratingAverage',
  ]);

  if (typeof directRating === 'number') {
    return directRating;
  }

  const source = record as Product & {
    ratingSummary?: { averageRating?: number };
    reviews?: Array<{ rating?: number }>;
  };

  if (typeof source.ratingSummary?.averageRating === 'number') {
    return source.ratingSummary.averageRating;
  }

  if (Array.isArray(source.reviews) && source.reviews.length > 0) {
    const ratings = source.reviews
      .map((review) => review.rating)
      .filter((rating): rating is number => typeof rating === 'number' && Number.isFinite(rating));

    if (ratings.length > 0) {
      return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    }
  }

  return undefined;
}

function renderRating(value: number | undefined) {
  return typeof value === 'number' ? `${value.toFixed(1)}/5` : 'Chưa có đánh giá';
}

function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [status, setStatus] = useState<'active' | 'inactive' | undefined>();
  const [ownerId, setOwnerId] = useState('');
  const [detail, setDetail] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const loadShops = async (
    nextStatus = status,
    nextOwnerId = ownerId.trim() || undefined
  ) => {
    setLoading(true);

    try {
      const result = await shopsApi.list({ status: nextStatus, owner_id: nextOwnerId });
      setShops(ensureArray<Shop>(result, ['shops', 'data']));
    } catch {
      messageApi.error('Không tải được danh sách cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (record: Shop) => {
    setDetail(record);
    setProducts([]);
    setDetailLoading(true);

    try {
      const [shopDetail, shopProducts] = await Promise.all([
        shopsApi.detail(record.slug),
        shopsApi.products(record._id || record.owner_id || ''),
      ]);
      setDetail(shopDetail);
      setProducts(ensureArray<Product>(shopProducts, ['products', 'data']));
    } catch {
      messageApi.error('Không tải được chi tiết cửa hàng');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBlock = (record: Shop) => {
    let reason = '';

    Modal.confirm({
      title: 'Chặn cửa hàng',
      content: (
        <Input.TextArea
          autoSize={{ minRows: 3 }}
          placeholder="Lý do chặn"
          onChange={(event) => {
            reason = event.target.value;
          }}
        />
      ),
      okText: 'Chặn',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!reason.trim()) {
          messageApi.warning('Cần nhập lý do chặn');
          return Promise.reject();
        }

        await shopsApi.block(record._id, reason.trim());
        messageApi.success('Đã chặn cửa hàng');
        loadShops();
      },
    });
  };

  const columns: ColumnsType<Shop> = [
      {
        title: 'Cửa hàng',
        dataIndex: 'name',
        key: 'name',
        render: (value, record) => (
          <Space>
            {record.cover_image ? (
              <Image
                width={42}
                height={42}
                src={record.cover_image}
                preview={false}
                className="rounded object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded bg-slate-200" />
            )}
            <div>
              <Typography.Text strong>{value}</Typography.Text>
              <Typography.Text className="block text-xs text-slate-500">
                {record.slug}
              </Typography.Text>
            </div>
          </Space>
        ),
      },
      {
        title: 'Chủ cửa hàng',
        dataIndex: 'owner_id',
        key: 'owner_id',
      },
      {
        title: 'Điện thoại',
        dataIndex: 'phone',
        key: 'phone',
        render: (value) => value || '-',
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (value) => (
          <Tag color={value === 'inactive' ? 'red' : 'green'}>
            {shopStatusLabel(value || 'active')}
          </Tag>
        ),
      },
      {
        title: '',
        key: 'actions',
        align: 'right',
        render: (_, record) => (
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => openDetail(record)}>
              Chi tiết
            </Button>
            <Button danger icon={<StopOutlined />} onClick={() => handleBlock(record)}>
              Chặn
            </Button>
          </Space>
        ),
      },
  ];

  const productColumns: ColumnsType<Product> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      width: 360,
      render: (value, record) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-slate-200">
            {record.image_url ? (
              <Image
                width={48}
                height={48}
                src={record.image_url}
                preview={false}
                className="h-12 w-12 object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <Typography.Text strong className="block truncate">
              {value || '-'}
            </Typography.Text>
            <Typography.Text className="block text-xs text-slate-500">
              {record.slug || '-'}
            </Typography.Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      align: 'right',
      width: 150,
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      align: 'right',
      width: 120,
      render: (_, record) => renderRating(getProductRating(record)),
    },
  ];

  return (
    <div className="space-y-4">
      {contextHolder}
      <Space className="w-full justify-between" align="start">
        <div>
          <Typography.Title level={2} className="!mb-1">
            Cửa hàng
          </Typography.Title>
          <Typography.Text type="secondary">Quản lý cửa hàng và xem sản phẩm của cửa hàng.</Typography.Text>
        </div>
        <Space wrap>
          <Input
            placeholder="ID chủ cửa hàng"
            value={ownerId}
            onChange={(event) => setOwnerId(event.target.value)}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            className="w-36"
            value={status}
            options={[
              { value: 'active', label: 'Đang hoạt động' },
              { value: 'inactive', label: 'Ngưng hoạt động' },
            ]}
            onChange={(value) => setStatus(value)}
          />
          <Button type="primary" onClick={() => loadShops()}>
            Lọc
          </Button>
        </Space>
      </Space>

      <Card variant="borderless" className="shadow-admin" styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={shops}
          loading={loading}
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        title="Chi tiết cửa hàng"
        open={Boolean(detail)}
        onCancel={() => setDetail(null)}
        width={1080}
        footer={null}
        confirmLoading={detailLoading}
        styles={{ body: { maxHeight: '78vh', overflowY: 'auto' } }}
      >
        {detailLoading && !detail ? (
          <Typography.Text>Đang tải chi tiết cửa hàng...</Typography.Text>
        ) : null}

        {detail && (
          <Space orientation="vertical" size={18} className="w-full">
            <Card variant="borderless" className="overflow-hidden bg-slate-50" styles={{ body: { padding: 0 } }}>
              <Row>
                <Col xs={24} md={8}>
                  {detail.cover_image ? (
                    <Image
                      src={detail.cover_image}
                      preview={false}
                      className="h-full min-h-52 w-full object-cover"
                    />
                  ) : (
                    <div className="grid min-h-52 place-items-center bg-slate-200 text-slate-500">
                      Chưa có ảnh bìa
                    </div>
                  )}
                </Col>
                <Col xs={24} md={16}>
                  <div className="space-y-3 p-4">
                    <Space className="w-full justify-between" align="start">
                      <div>
                        <Typography.Title level={3} className="!mb-1">
                          {detail.name}
                        </Typography.Title>
                        <Typography.Text type="secondary">{detail.slug}</Typography.Text>
                      </div>
                      <Tag color={detail.status === 'inactive' ? 'red' : 'green'}>
                        {shopStatusLabel(detail.status)}
                      </Tag>
                    </Space>
                    <Typography.Paragraph className="!mb-0 text-slate-600">
                      {detail.description || 'Chưa có mô tả cửa hàng.'}
                    </Typography.Paragraph>
                  </div>
                </Col>
              </Row>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card size="small" title="Thông tin liên hệ" variant="borderless" className="bg-slate-50">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Chủ cửa hàng">{detail.owner_id || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Điện thoại">{detail.phone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">{shopStatusLabel(detail.status)}</Descriptions.Item>
                    <Descriptions.Item label="Lý do chặn">{detail.block_reason || '-'}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card size="small" title="Địa chỉ" variant="borderless" className="bg-slate-50">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Địa chỉ hiển thị">
                      {detail.formatted_address || detail.address || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tỉnh/Thành ID">{detail.province_id ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Quận/Huyện ID">{detail.district_id ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Mã phường/xã">{detail.ward_code || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Tọa độ">
                      {typeof detail.latitude === 'number' && typeof detail.longitude === 'number'
                        ? `${detail.latitude}, ${detail.longitude}`
                        : '-'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <Card
              size="small"
              title={`Sản phẩm của cửa hàng (${products.length})`}
              variant="borderless"
              className="overflow-hidden bg-slate-50"
              styles={{ body: { padding: 0 } }}
            >
              <Table
                size="small"
                rowKey="_id"
                dataSource={products}
                loading={detailLoading}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                columns={productColumns}
                tableLayout="fixed"
                scroll={{ x: 870 }}
              />
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  );
}

export default ShopsPage;
