const fallback = '-';

export function accountStatusLabel(value?: string | null) {
  const labels: Record<string, string> = {
    active: 'Đang hoạt động',
    blocked: 'Đã khóa',
  };

  return labels[value || ''] || value || fallback;
}

export function approvalStatusLabel(value?: string | null) {
  const labels: Record<string, string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Đã từ chối',
  };

  return labels[value || ''] || value || fallback;
}

export function shopStatusLabel(value?: string | null) {
  const labels: Record<string, string> = {
    active: 'Đang hoạt động',
    inactive: 'Ngưng hoạt động',
  };

  return labels[value || ''] || value || fallback;
}

export function storyStatusLabel(value?: string | null) {
  const labels: Record<string, string> = {
    draft: 'Bản nháp',
    published: 'Đã xuất bản',
    archived: 'Đã lưu trữ',
  };

  return labels[value || ''] || value || fallback;
}

export function orderStatusLabel(value?: string | null) {
  const labels: Record<string, string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
  };

  return labels[value || ''] || value || fallback;
}

export function paymentStatusLabel(value?: string | null) {
  const labels: Record<string, string> = {
    unpaid: 'Chưa thanh toán',
    pending: 'Đang xử lý',
    paid: 'Đã thanh toán',
    failed: 'Thất bại',
  };

  return labels[value || ''] || value || fallback;
}

export function roleLabel(value?: string | null) {
  const labels: Record<string, string> = {
    admin: 'Quản trị viên',
    user: 'Người dùng',
    vendor: 'Nhà bán',
  };

  return labels[value || ''] || value || fallback;
}
