import type { Meta, StoryObj } from '@storybook/react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { useState } from 'react';

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  revenue: number;
}

const mockUsers: MockUser[] = Array.from({ length: 50 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: ['Admin', 'Editor', 'Viewer'][i % 3],
  status: (['active', 'inactive', 'pending'] as const)[i % 3],
  lastLogin: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  revenue: Math.floor(Math.random() * 10000),
}));

const columns: Column<MockUser>[] = [
  { key: 'name', header: 'Name', sortable: true, filterable: true },
  { key: 'email', header: 'Email', sortable: true, filterable: true },
  { key: 'role', header: 'Role', sortable: true, filterable: true, filterType: 'select',
    filterOptions: [
      { label: 'Admin', value: 'Admin' },
      { label: 'Editor', value: 'Editor' },
      { label: 'Viewer', value: 'Viewer' },
    ]
  },
  { key: 'status', header: 'Status', sortable: true,
    render: (value) => {
      const colors = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        pending: 'bg-yellow-100 text-yellow-800',
      };
      return (
        <span className={`px-2 py-1 text-xs rounded-full ${colors[value as keyof typeof colors]}`}>
          {String(value)}
        </span>
      );
    }
  },
  { key: 'revenue', header: 'Revenue', sortable: true, align: 'right',
    render: (value) => `$${(value as number).toLocaleString()}`
  },
];

const meta: Meta<typeof DataTable<MockUser>> = {
  title: 'Admin/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DataTable<MockUser>>;

export const Default: Story = {
  args: {
    data: mockUsers,
    columns,
    getRowId: (row) => row.id,
  },
};

export const WithSelection: Story = {
  args: {
    data: mockUsers.slice(0, 10),
    columns,
    getRowId: (row) => row.id,
    selectable: true,
    bulkActions: (
      <div className="flex gap-2">
        <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded">Delete</button>
        <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">Export</button>
      </div>
    ),
  },
};

export const Loading: Story = {
  args: {
    data: [],
    columns,
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns,
    emptyState: (
      <div className="text-center py-8">
        <p className="text-gray-500">No users found</p>
        <button className="mt-2 text-blue-600">Add your first user</button>
      </div>
    ),
  },
};

export const Compact: Story = {
  args: {
    data: mockUsers.slice(0, 10),
    columns,
    compact: true,
    getRowId: (row) => row.id,
  },
};

export const WithRowActions: Story = {
  args: {
    data: mockUsers.slice(0, 10),
    columns,
    getRowId: (row) => row.id,
    rowActions: (row) => (
      <div className="flex gap-2">
        <button className="text-blue-600 text-sm hover:underline">Edit</button>
        <button className="text-red-600 text-sm hover:underline">Delete</button>
      </div>
    ),
  },
};
