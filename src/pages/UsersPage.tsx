import { EditOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { ensureArray, getRecordId, usersApi } from '../services/adminApi';
import { accountStatusLabel, roleLabel } from '../services/displayLabels';
import type { AdminUser } from '../services/types';

function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [form] = Form.useForm<Partial<AdminUser>>();
  const [messageApi, contextHolder] = message.useMessage();

  const loadUsers = async () => {
    setLoading(true);

    try {
      const result = await usersApi.list();
      setUsers(ensureArray<AdminUser>(result, ['users', 'data']));
    } catch {
      messageApi.error('Không tải được danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (record: AdminUser) => {
    setEditingUser(record);
    form.setFieldsValue(record);
  };

  const handleSave = async () => {
    if (!editingUser) {
      return;
    }

    setSaving(true);
    try {
      await usersApi.update(getRecordId(editingUser), form.getFieldsValue());
      messageApi.success('Đã cập nhật người dùng');
      setEditingUser(null);
      loadUsers();
    } catch {
      messageApi.error('Cập nhật người dùng thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleBlock = (record: AdminUser) => {
    let reason = '';

    Modal.confirm({
      title: 'Khóa người dùng',
      content: (
        <Input.TextArea
          autoSize={{ minRows: 3 }}
          placeholder="Lý do khóa"
          onChange={(event) => {
            reason = event.target.value;
          }}
        />
      ),
      okText: 'Khóa',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!reason.trim()) {
          messageApi.warning('Cần nhập lý do khóa');
          return Promise.reject();
        }

        await usersApi.block(getRecordId(record), reason.trim());
        messageApi.success('Đã khóa người dùng');
        loadUsers();
      },
    });
  };

  const handleUnblock = async (record: AdminUser) => {
    try {
      await usersApi.unblock(getRecordId(record));
      messageApi.success('Đã mở khóa người dùng');
      loadUsers();
    } catch {
      messageApi.error('Mở khóa người dùng thất bại');
    }
  };

  const columns: ColumnsType<AdminUser> = [
      {
        title: 'Họ tên',
        dataIndex: 'full_name',
        key: 'full_name',
        render: (_, record) => record.full_name || record.name || '-',
      },
      {
        title: 'Email',
        dataIndex: 'email',
        key: 'email',
      },
      {
        title: 'Điện thoại',
        dataIndex: 'phone',
        key: 'phone',
        render: (value) => value || '-',
      },
      {
        title: 'Vai trò',
        dataIndex: 'role',
        key: 'role',
        render: (value) => <Tag>{roleLabel(value)}</Tag>,
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        key: 'status',
        render: (value) => (
          <Tag color={value === 'blocked' ? 'red' : 'green'}>
            {accountStatusLabel(value || 'active')}
          </Tag>
        ),
      },
      {
        title: '',
        key: 'actions',
        align: 'right',
        render: (_, record) => (
          <Space>
            <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
            {record.status === 'blocked' ? (
              <Button icon={<UnlockOutlined />} onClick={() => handleUnblock(record)} />
            ) : (
              <Button danger icon={<LockOutlined />} onClick={() => handleBlock(record)} />
            )}
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
            Người dùng
          </Typography.Title>
          <Typography.Text type="secondary">Quản lý tài khoản người dùng.</Typography.Text>
        </div>
        <Space>
          <Button onClick={loadUsers}>Tải lại</Button>
        </Space>
      </Space>

      <Card variant="borderless" className="shadow-admin" styles={{ body: { padding: 0 } }}>
        <Table
          rowKey={(record) => getRecordId(record)}
          columns={columns}
          dataSource={users}
          loading={loading}
          scroll={{ x: 900 }}
        />
      </Card>

      <Drawer
        title="Cập nhật người dùng"
        open={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        extra={
          <Button type="primary" loading={saving} onClick={handleSave}>
            Lưu
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="full_name" label="Họ tên">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea autoSize={{ minRows: 3 }} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default UsersPage;
