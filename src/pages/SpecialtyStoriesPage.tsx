import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  InboxOutlined,
  PlusOutlined,
} from '@ant-design/icons';
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
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import {
  ensureArray,
  getRecordId,
  specialtiesApi,
  specialtyStoriesApi,
} from '../services/adminApi';
import { storyStatusLabel } from '../services/displayLabels';
import type {
  Specialty,
  SpecialtyStory,
  SpecialtyStoryPayload,
  SpecialtyStoryStatus,
} from '../services/types';

type SpecialtyStoryFilters = {
  status?: SpecialtyStoryStatus;
  specialty_id?: string;
};

function getSpecialty(record: SpecialtyStory): Specialty | undefined {
  return typeof record.specialty_id === 'object' ? record.specialty_id : undefined;
}

function getSpecialtyId(record: SpecialtyStory) {
  if (typeof record.specialty_id === 'string') {
    return record.specialty_id;
  }

  return record.specialty_id?._id;
}

function cleanPayload(values: SpecialtyStoryPayload): SpecialtyStoryPayload {
  return {
    ...values,
    summary: values.summary?.trim() || undefined,
    cover_image_url: values.cover_image_url?.trim() || undefined,
    seo_title: values.seo_title?.trim() || undefined,
    seo_description: values.seo_description?.trim() || undefined,
    images: values.images
      ?.filter((image) => image.url?.trim())
      .map((image) => ({
        url: image.url?.trim(),
        caption: image.caption?.trim() || undefined,
      })),
    tags: values.tags?.map((tag) => tag.trim()).filter(Boolean),
  };
}

function SpecialtyStoriesPage() {
  const [items, setItems] = useState<SpecialtyStory[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [filters, setFilters] = useState<SpecialtyStoryFilters>({});
  const [editing, setEditing] = useState<SpecialtyStory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<SpecialtyStoryPayload>();
  const [messageApi, contextHolder] = message.useMessage();

  const specialtyOptions = useMemo(
    () =>
      specialties.map((specialty) => ({
        value: specialty._id,
        label: specialty.name,
      })),
    [specialties]
  );

  const loadItems = async (nextFilters = filters) => {
    setLoading(true);

    try {
      const [storyResult, specialtyResult] = await Promise.all([
        specialtyStoriesApi.list(nextFilters),
        specialtiesApi.list({ approval_status: 'approved', status: 'active' }),
      ]);

      setItems(ensureArray<SpecialtyStory>(storyResult, ['stories', 'data']));
      setSpecialties(ensureArray<Specialty>(specialtyResult, ['specialties', 'data']));
    } catch {
      messageApi.error('Không tải được danh sách câu chuyện đặc sản');
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
    form.setFieldsValue({ status: 'draft', images: [] });
    setModalOpen(true);
  };

  const openEdit = (record: SpecialtyStory) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      specialty_id: getSpecialtyId(record),
      tags: record.tags || [],
      images: record.images || [],
      status: record.status || 'draft',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);

    try {
      const payload = cleanPayload(values);

      if (editing) {
        await specialtyStoriesApi.update(editing._id, payload);
        messageApi.success('Đã cập nhật câu chuyện đặc sản');
      } else {
        await specialtyStoriesApi.create(payload);
        messageApi.success('Đã tạo câu chuyện đặc sản');
      }

      setModalOpen(false);
      loadItems();
    } catch {
      messageApi.error('Lưu câu chuyện đặc sản thất bại');
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

  const columns: ColumnsType<SpecialtyStory> = [
    {
      title: 'Câu chuyện',
      dataIndex: 'title',
      key: 'title',
      render: (value, record) => (
        <Space>
          {record.cover_image_url ? (
            <Image
              width={48}
              height={48}
              src={record.cover_image_url}
              preview={false}
              className="rounded object-cover"
            />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded bg-slate-100 text-slate-400">
              <FileTextOutlined />
            </div>
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
      title: 'Đặc sản',
      key: 'specialty',
      render: (_, record) => {
        const specialty = getSpecialty(record);
        return specialty?.name || getSpecialtyId(record) || '-';
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (value) => {
        const color = value === 'published' ? 'green' : value === 'archived' ? 'red' : 'gold';
        return <Tag color={color}>{storyStatusLabel(value || 'draft')}</Tag>;
      },
    },
    {
      title: 'Tag',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[] | undefined) =>
        tags?.length ? tags.slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>) : '-',
    },
    {
      title: 'Xuất bản',
      dataIndex: 'published_at',
      key: 'published_at',
      render: (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '-'),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xuất bản">
            <Button
              aria-label="Xuất bản câu chuyện"
              icon={<CheckCircleOutlined />}
              disabled={record.status === 'published'}
              onClick={() =>
                runAction(
                  () => specialtyStoriesApi.publish(getRecordId(record)),
                  'Đã xuất bản câu chuyện'
                )
              }
            />
          </Tooltip>
          <Tooltip title="Lưu trữ">
            <Button
              aria-label="Lưu trữ câu chuyện"
              icon={<InboxOutlined />}
              disabled={record.status === 'archived'}
              onClick={() =>
                runAction(
                  () => specialtyStoriesApi.archive(getRecordId(record)),
                  'Đã lưu trữ câu chuyện'
                )
              }
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              aria-label="Chỉnh sửa câu chuyện"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              danger
              aria-label="Xóa câu chuyện"
              icon={<DeleteOutlined />}
              onClick={() =>
                Modal.confirm({
                  title: 'Xóa câu chuyện này?',
                  okText: 'Xóa',
                  okButtonProps: { danger: true },
                  onOk: () =>
                    runAction(
                      () => specialtyStoriesApi.delete(getRecordId(record)),
                      'Đã xóa câu chuyện'
                    ),
                })
              }
            />
          </Tooltip>
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
            Câu chuyện đặc sản
          </Typography.Title>
          <Typography.Text type="secondary">
            Tạo, xuất bản và lưu trữ bài viết cho từng đặc sản.
          </Typography.Text>
        </div>
        <Space wrap>
          <Select
            allowClear
            showSearch
            placeholder="Đặc sản"
            className="w-56"
            value={filters.specialty_id}
            options={specialtyOptions}
            optionFilterProp="label"
            onChange={(value) => setFilters((current) => ({ ...current, specialty_id: value }))}
          />
          <Select
            allowClear
            placeholder="Trạng thái"
            className="w-40"
            value={filters.status}
            options={[
              { value: 'draft', label: 'Bản nháp' },
              { value: 'published', label: 'Đã xuất bản' },
              { value: 'archived', label: 'Đã lưu trữ' },
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
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title={editing ? 'Cập nhật câu chuyện đặc sản' : 'Tạo câu chuyện đặc sản'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="Lưu"
        width={860}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="specialty_id"
            label="Đặc sản"
            rules={[{ required: true, message: 'Chọn đặc sản' }]}
          >
            <Select
              showSearch
              placeholder="Chọn đặc sản chưa có câu chuyện"
              options={specialtyOptions}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Nhập tiêu đề' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="summary" label="Mô tả ngắn">
            <Input.TextArea autoSize={{ minRows: 2 }} />
          </Form.Item>
          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: 'Nhập nội dung' }]}
          >
            <Input.TextArea autoSize={{ minRows: 8 }} />
          </Form.Item>
          <Form.Item name="cover_image_url" label="Ảnh đại diện">
            <Input />
          </Form.Item>
          <Form.Item name="tags" label="Tag">
            <Select mode="tags" tokenSeparators={[',']} placeholder="Nhập tag rồi Enter" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select
              options={[
                { value: 'draft', label: 'Bản nháp' },
                { value: 'published', label: 'Đã xuất bản' },
                { value: 'archived', label: 'Đã lưu trữ' },
              ]}
            />
          </Form.Item>

          <Typography.Text strong>Ảnh phụ</Typography.Text>
          <Form.List name="images">
            {(fields, { add, remove }) => (
              <div className="mt-2 space-y-3">
                {fields.map((field) => (
                  <Space key={field.key} className="flex w-full items-start" align="baseline">
                    <Form.Item {...field} name={[field.name, 'url']} className="mb-0 flex-1">
                      <Input placeholder="URL ảnh" />
                    </Form.Item>
                    <Form.Item {...field} name={[field.name, 'caption']} className="mb-0 flex-1">
                      <Input placeholder="Chú thích" />
                    </Form.Item>
                    <Button danger onClick={() => remove(field.name)}>
                      Xóa
                    </Button>
                  </Space>
                ))}
                <Button onClick={() => add()} icon={<PlusOutlined />}>
                  Thêm ảnh phụ
                </Button>
              </div>
            )}
          </Form.List>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Form.Item name="seo_title" label="Tiêu đề SEO">
              <Input />
            </Form.Item>
            <Form.Item name="seo_description" label="Mô tả SEO">
              <Input />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default SpecialtyStoriesPage;
