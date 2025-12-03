import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Mock Pagination component
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  siblingCount = 1,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  siblingCount?: number;
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const left = Math.max(1, currentPage - siblingCount);
    const right = Math.min(totalPages, currentPage + siblingCount);

    if (showFirstLast && left > 1) {
      pages.push(1);
      if (left > 2) pages.push('...');
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (showFirstLast && right < totalPages) {
      if (right < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeftIcon className="h-5 w-5" />
      </button>

      {getPageNumbers().map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`min-w-[40px] h-10 px-3 rounded-lg font-medium
              ${currentPage === page
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </nav>
  );
};

// Wrapper for interactive stories
const PaginationWrapper = ({ totalPages = 10, initialPage = 1, ...props }: Omit<React.ComponentProps<typeof Pagination>, 'currentPage' | 'onPageChange'> & { initialPage?: number }) => {
  const [page, setPage] = useState(initialPage);
  return <Pagination {...props} totalPages={totalPages} currentPage={page} onPageChange={setPage} />;
};

const meta: Meta<typeof Pagination> = {
  title: 'UI/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  render: () => <PaginationWrapper totalPages={10} />,
};

export const FirstPage: Story = {
  render: () => <PaginationWrapper totalPages={10} initialPage={1} />,
};

export const MiddlePage: Story = {
  render: () => <PaginationWrapper totalPages={10} initialPage={5} />,
};

export const LastPage: Story = {
  render: () => <PaginationWrapper totalPages={10} initialPage={10} />,
};

export const FewPages: Story = {
  render: () => <PaginationWrapper totalPages={3} />,
};

export const ManyPages: Story = {
  render: () => <PaginationWrapper totalPages={50} initialPage={25} />,
};

export const WithoutFirstLast: Story = {
  render: () => <PaginationWrapper totalPages={20} initialPage={10} showFirstLast={false} />,
};

export const InTable: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;
    const totalItems = 47;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
      <div className="border rounded-lg overflow-hidden w-96">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Name</th>
              <th className="text-left p-3 text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: itemsPerPage }, (_, i) => {
              const itemNum = (page - 1) * itemsPerPage + i + 1;
              if (itemNum > totalItems) return null;
              return (
                <tr key={i}>
                  <td className="p-3 text-sm">Item {itemNum}</td>
                  <td className="p-3 text-sm text-green-600">Active</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-3 border-t flex items-center justify-between bg-gray-50">
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, totalItems)} of {totalItems}
          </span>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    );
  },
};
