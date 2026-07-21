import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App shell', () => {
  it('shows the four workflow steps in order', () => {
    render(<App />);
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      expect.stringContaining('数据编辑'), expect.stringContaining('图表制作'),
      expect.stringContaining('分析与标注'), expect.stringContaining('导出'),
    ]);
  });
  it('provides an accessible top bar and project save status', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '产品上架图' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('已保存');
  });
  it('prompts the user to import data in the initial empty state', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: '导入产品数据' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '选择 Excel 文件' })).toBeInTheDocument();
  });
});
