import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Image,
  Input,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { ensureArray, formatCurrency, productsApi } from '../services/adminApi';
import type { Product, ProductListResult } from '../services/types';

type ProductFilters = {
  searchName?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
};

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [detail, setDetail] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<ProductFilters>();

  const loadProducts = async (nextPage = page, nextLimit = limit, nextFilters = filters) => {
    setLoading(true);

    try {
      const params: Record<string, unknown> = {
        page: nextPage,
        limit: nextLimit,
      };

      if (nextFilters.searchName?.trim()) {
        params.filter = ['name', nextFilters.searchName.trim()];
      }

      if (nextFilters.sortField && nextFilters.sortOrder) {
        params.sort = [nextFilters.sortOrder, nextFilters.sortField];
      }

      const result = await productsApi.list(params);
      const productList = ensureArray<Product>(result, ['products', 'data']);
      const meta = result as ProductListResult;

      setProducts(productList);
      setTotal(meta.totalProduts || meta.totalProducts || productList.length);
      setPage(meta.currentPage || nextPage);
    } catch {
      messageApi.error('Không tải được danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (record: Product) => {
    setDetail(record);
    setDetailLoading(true);

    try {
      setDetail(await productsApi.detail(record._id));
    } catch {
      messageApi.error('Không tải được chi tiết sản phẩm');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: ColumnsType<Product> = [
      {
        title: 'Sản phẩm',
        dataIndex: 'name',
        key: 'name',
        render: (value, record) => (
          <Space>
            {record.image_url ? (
              <Image
                width={42}
                height={42}
                src={record.image_url}
                preview={false}
                className="rounded object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded bg-slate-200" />
            )}
            <div>
              <Typography.Text strong>{value}</Typography.Text>
              <Typography.Text className="block text-xs text-slate-500">
                {record.slug || record._id}
              </Typography.Text>
            </div>
          </Space>
        ),
      },
      {
        title: 'Giá',
        dataIndex: 'price',
        key: 'price',
        align: 'right',
        render: (value) => formatCurrency(value),
      },
      {
        title: 'Rating',
        dataIndex: 'rating',
        key: 'rating',
        align: 'right',
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
      <div>
        <Typography.Title level={2} className="!mb-1">
          Sản phẩm
        </Typography.Title>
        <Typography.Text type="secondary">Tìm kiếm sản phẩm theo tên và sắp xếp danh sách.</Typography.Text>
      </div>

      <Card variant="borderless" className="shadow-admin">
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            setFilters(values);
            setPage(1);
            loadProducts(1, limit, values);
          }}
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_160px_170px_auto_auto] lg:items-end">
            <Form.Item name="searchName" label="Tên sản phẩm" className="!mb-0">
              <Input
                allowClear
                size="large"
                placeholder="Nhập tên sản phẩm"
                prefix={<SearchOutlined />}
              />
            </Form.Item>

            <Form.Item name="sortOrder" label="Thứ tự" className="!mb-0">
              <Select
                allowClear
                size="large"
                placeholder="Thứ tự"
                options={[
                  { value: 'desc', label: 'Giảm dần' },
                  { value: 'asc', label: 'Tăng dần' },
                ]}
              />
            </Form.Item>

            <Form.Item name="sortField" label="Sắp xếp theo" className="!mb-0">
              <Select
                allowClear
                size="large"
                placeholder="Sắp xếp"
                options={[
                  { value: 'price', label: 'Giá' },
                  { value: 'rating', label: 'Rating' },
                ]}
              />
            </Form.Item>

            <Button type="primary" htmlType="submit" size="large" className="w-full lg:w-auto">
              Áp dụng
            </Button>
            <Button
              size="large"
              className="w-full lg:w-auto"
              onClick={() => {
                form.resetFields();
                setFilters({});
                setPage(1);
                loadProducts(1, limit, {});
              }}
            >
              Xóa lọc
            </Button>
          </div>
        </Form>
      </Card>

      <Card variant="borderless" className="shadow-admin" styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={products}
          loading={loading}
          scroll={{ x: 980 }}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: true,
            onChange: (nextPage, nextLimit) => {
              setPage(nextPage);
              setLimit(nextLimit);
              loadProducts(nextPage, nextLimit);
            },
          }}
        />
      </Card>

      <Drawer
        title="Chi tiết sản phẩm"
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        width={560}
        loading={detailLoading}
      >
        {detail && (
          <Space orientation="vertical" size={16} className="w-full">
            {detail.image_url && <Image src={detail.image_url} className="rounded" />}
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Tên">{detail.name}</Descriptions.Item>
              <Descriptions.Item label="Slug">{detail.slug || '-'}</Descriptions.Item>
              <Descriptions.Item label="Giá">{formatCurrency(detail.price)}</Descriptions.Item>
              <Descriptions.Item label="Rating">{detail.rating ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Discount">{detail.discount ?? 0}%</Descriptions.Item>
              <Descriptions.Item label="Shop ID">{detail.shop_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="Đặc sản ID">{detail.specialty_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="Mô tả">{detail.description || '-'}</Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Drawer>
    </div>
  );
}

export default ProductsPage;
