import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import App from './App';
import { store } from './app/store';

jest.mock('./services/adminApi', () => {
  const actual = jest.requireActual('./services/adminApi');

  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      refreshToken: () => Promise.reject(new Error('Không có phiên kiểm thử')),
    },
  };
});

test('hiển thị màn hình đăng nhập admin', async () => {
  window.localStorage.clear();

  render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  expect(await screen.findByText(/đăng nhập admin/i)).toBeInTheDocument();
});
