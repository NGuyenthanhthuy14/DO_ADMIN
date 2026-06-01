import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Drawer,
  Form,
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
import { ensureArray, getRecordId, usersApi, vendorsApi } from '../services/adminApi';
import { accountStatusLabel, approvalStatusLabel } from '../services/displayLabels';
import type { AdminUser, VendorStatus } from '../services/types';

function VendorsPage() {
  const [vendors, setVendors] = useState<AdminUser[]>([]);
  const [status, setStatus] = useState<VendorStatus | undefined>();
  const [loading, setLoading] = useState(false);
  const [editingVendor, setEditingVendor] = useState<AdminUser | null>(null);
  const [form] = Form.useForm<Partial<AdminUser>>();
  const [messageApi, contextHolder] = message.useMessage();

  const loadVendors = async (nextStatus = status) => {
    setLoading(true);

    try {
      const result = await vendorsApi.list(nextStatus);
      setVendors(ensureArray<AdminUser>(result, ['vendors', 'data']));
    } catch {
      messageApi.error('Không tải được danh sách nhà bán');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      messageApi.success(success);
      loadVendors();
    } catch {
      messageApi.error('Thao tác thất bại');
    }
  };

  const handleBlock = (record: AdminUser) => {
    let reason = '';

    Modal.confirm({
      title: 'Khóa nhà bán',
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
        messageApi.success('Đã khóa nhà bán');
        loadVendors();
      },
    });
  };

  const handleUnblock = async (record: AdminUser) => {
    try {
      await usersApi.unblock(getRecordId(record));
      messageApi.success('Đã mở khóa nhà bán');
      loadVendors();
    } catch {
      messageApi.error('Mở khóa nhà bán thất bại');
    }
  };

  const columns: ColumnsType<AdminUser> = [
      {
        title: 'Nhà bán',
        dataIndex: 'full_name',
        key: 'full_name',
        render: (_, record) => record.full_name || record.name || record.email,
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
        title: 'Duyệt',
        dataIndex: 'vendor_status',
        key: 'vendor_status',
        render: (value) => {
          const color = value === 'approved' ? 'green' : value === 'rejected' ? 'red' : 'gold';
          return <Tag color={color}>{approvalStatusLabel(value || 'pending')}</Tag>;
        },
      },
      {
        title: 'Tài khoản',
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
        render: (_, record) => {
          const canReview = !record.vendor_status || record.vendor_status === 'pending';

          return (
            <Space>
              {canReview ? (
                <>
                  <Button
                    icon={<CheckOutlined />}
                    onClick={() =>
                      runAction(() => vendorsApi.approve(getRecordId(record)), 'Đã duyệt nhà bán')
                    }
                  />
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={() =>
                      runAction(() => vendorsApi.reject(getRecordId(record)), 'Đã từ chối nhà bán')
                    }
                  />
                </>
              ) : null}
              <Button
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingVendor(record);
                  form.setFieldsValue(record);
                }}
              />
              {record.status === 'blocked' ? (
                <Button icon={<UnlockOutlined />} onClick={() => handleUnblock(record)} />
              ) : (
                <Button danger icon={<LockOutlined />} onClick={() => handleBlock(record)} />
              )}
            </Space>
          );
        },
      },
  ];

  return (
    <div className="space-y-4">
      {contextHolder}
      <Space className="w-full justify-between" align="start">
        <div>
          <Typography.Title level={2} className="!mb-1">
            Nhà bán
          </Typography.Title>
          <Typography.Text type="secondary">Duyệt và cập nhật tài khoản nhà bán.</Typography.Text>
        </div>
        <Space>
          <Select
            allowClear
            placeholder="Trạng thái duyệt"
            value={status}
            className="w-44"
            options={[
              { value: 'pending', label: 'Chờ duyệt' },
              { value: 'approved', label: 'Đã duyệt' },
              { value: 'rejected', label: 'Đã từ chối' },
            ]}
            onChange={(value) => {
              setStatus(value);
              loadVendors(value);
            }}
          />
          <Button onClick={() => loadVendors()}>Tải lại</Button>
        </Space>
      </Space>

      <Card variant="borderless" className="shadow-admin" styles={{ body: { padding: 0 } }}>
        <Table
          rowKey={(record) => getRecordId(record)}
          columns={columns}
          dataSource={vendors}
          loading={loading}
          scroll={{ x: 900 }}
        />
      </Card>

      <Drawer
        title="Cập nhật nhà bán"
        open={Boolean(editingVendor)}
        onClose={() => setEditingVendor(null)}
        extra={
          <Button
            type="primary"
            onClick={async () => {
              if (!editingVendor) return;
              await runAction(
                () => vendorsApi.update(getRecordId(editingVendor), form.getFieldsValue()),
                'Đã cập nhật nhà bán'
              );
              setEditingVendor(null);
            }}
          >
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

export default VendorsPage;
