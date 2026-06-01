import { CheckOutlined, DeleteOutlined, EditOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Image,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { ensureArray, specialtiesApi } from '../services/adminApi';
import { approvalStatusLabel, shopStatusLabel } from '../services/displayLabels';
import type { Specialty } from '../services/types';

type SpecialtyFilters = {
  approval_status?: 'pending' | 'approved' | 'rejected';
  status?: 'active' | 'inactive';
};

function SpecialtiesPage() {
  const [items, setItems] = useState<Specialty[]>([]);
  const [filters, setFilters] = useState<SpecialtyFilters>({});
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<Partial<Specialty>>();
  const [messageApi, contextHolder] = message.useMessage();

  const loadItems = async (nextFilters = filters) => {
    setLoading(true);

    try {
      const result = await specialtiesApi.list(nextFilters);
      setItems(ensureArray<Specialty>(result, ['specialties', 'data']));
    } catch {
      messageApi.error('Không tải được danh sách đặc sản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: Specialty) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);

    try {
      if (editing) {
        await specialtiesApi.update(editing._id, values);
        messageApi.success('Đã cập nhật đặc sản');
      } else {
        await specialtiesApi.create(values);
        messageApi.success('Đã tạo đặc sản');
      }

      setModalOpen(false);
      loadItems();
    } catch {
      messageApi.error('Lưu đặc sản thất bại');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      messageApi.success(success);
      loadItems();
    } catch {
      messageApi.error('Thao tác thất bại');
    }
  };

  const handleReject = (record: Specialty) => {
    let reason = '';

    Modal.confirm({
      title: 'Từ chối đặc sản',
      content: (
        <Input.TextArea
          autoSize={{ minRows: 3 }}
          placeholder="Lý do từ chối"
          onChange={(event) => {
            reason = event.target.value;
          }}
        />
      ),
      okText: 'Từ chối',
      okButtonProps: { danger: true },
      onOk: async () => {
        await specialtiesApi.reject(record._id, reason.trim());
        messageApi.success('Đã từ chối đặc sản');
        loadItems();
      },
    });
  };

  const columns: ColumnsType<Specialty> = [
      {
        title: 'Đặc sản',
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
        title: 'Nguồn',
        dataIndex: 'created_by_role',
        key: 'created_by_role',
        render: (value) => value || '-',
      },
      {
        title: 'Duyệt',
        dataIndex: 'approval_status',
        key: 'approval_status',
        render: (value) => {
          const color = value === 'approved' ? 'green' : value === 'rejected' ? 'red' : 'gold';
          return <Tag color={color}>{approvalStatusLabel(value || 'pending')}</Tag>;
        },
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
            <Button
              icon={<CheckOutlined />}
              onClick={() =>
                runAction(() => specialtiesApi.approve(record._id), 'Đã duyệt đặc sản')
              }
            />
            <Button danger icon={<StopOutlined />} onClick={() => handleReject(record)} />
            <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                Modal.confirm({
                  title: 'Xóa đặc sản này?',
                  okText: 'Xóa',
                  okButtonProps: { danger: true },
                  onOk: () =>
                    runAction(() => specialtiesApi.delete(record._id), 'Đã xóa đặc sản'),
                })
              }
            />
          </Space>
        ),
      },
  ];

  return (
    <div className="space-y-4">
      {contextHolder}
      <Space className="w-full justify-between" align="start">
        <div>
          <Typography.Title level={2} className="!mb-1">
            Đặc sản
          </Typography.Title>
          <Typography.Text type="secondary">Tạo, duyệt và quản lý đặc sản.</Typography.Text>
        </div>
        <Space wrap>
          <Select
            allowClear
            placeholder="Duyệt"
            className="w-36"
            value={filters.approval_status}
            options={[
              { value: 'pending', label: 'Chờ duyệt' },
              { value: 'approved', label: 'Đã duyệt' },
              { value: 'rejected', label: 'Đã từ chối' },
            ]}
            onChange={(value) => setFilters((current) => ({ ...current, approval_status: value }))}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            className="w-36"
            value={filters.status}
            options={[
              { value: 'active', label: 'Đang hoạt động' },
              { value: 'inactive', label: 'Ngưng hoạt động' },
            ]}
            onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
          />
          <Button onClick={() => loadItems()}>Lọc</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo mới
          </Button>
        </Space>
      </Space>

      <Card variant="borderless" className="shadow-admin" styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={items}
          loading={loading}
          scroll={{ x: 980 }}
        />
      </Card>

      <Modal
        title={editing ? 'Cập nhật đặc sản' : 'Tạo đặc sản'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="Lưu"
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug">
            <Input />
          </Form.Item>
          <Form.Item name="image_url" label="Ảnh">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea autoSize={{ minRows: 4 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default SpecialtiesPage;
