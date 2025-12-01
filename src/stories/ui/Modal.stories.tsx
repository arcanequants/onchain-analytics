/**
 * Modal Component Stories
 * Phase 4, Week 8 - Internal Tools & DX Checklist
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

// Modal components for Storybook demo
const Modal = ({
  isOpen,
  onClose,
  children,
  size = 'md',
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${sizes[size]} rounded-lg border border-gray-700 bg-gray-900 shadow-xl`}
      >
        {children}
      </div>
    </div>
  );
};

const ModalHeader = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) => (
  <div className="flex items-center justify-between border-b border-gray-700 p-4">
    <h2 className="text-lg font-semibold text-white">{children}</h2>
    {onClose && (
      <button
        onClick={onClose}
        className="rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
);

const ModalBody = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 text-gray-300">{children}</div>
);

const ModalFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-end gap-2 border-t border-gray-700 p-4">
    {children}
  </div>
);

// Wrapper component to manage state for stories
const ModalDemo = ({
  title,
  content,
  size = 'md',
  showFooter = true,
}: {
  title: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showFooter?: boolean;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Open Modal
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size={size}>
        <ModalHeader onClose={() => setIsOpen(false)}>{title}</ModalHeader>
        <ModalBody>{content}</ModalBody>
        {showFooter && (
          <ModalFooter>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Confirm
            </button>
          </ModalFooter>
        )}
      </Modal>
    </div>
  );
};

const meta: Meta<typeof ModalDemo> = {
  title: 'UI/Modal',
  component: ModalDemo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Modal Title',
    content: 'This is the modal content. You can put any content here.',
  },
};

export const Small: Story = {
  args: {
    title: 'Small Modal',
    content: 'A smaller modal for simple confirmations.',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    title: 'Large Modal',
    content: 'A larger modal for more complex content and forms.',
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    title: 'Extra Large Modal',
    content: 'An extra large modal for data tables or detailed views.',
    size: 'xl',
  },
};

export const FullWidth: Story = {
  args: {
    title: 'Full Width Modal',
    content: 'A full-width modal for maximum content space.',
    size: 'full',
  },
};

export const WithoutFooter: Story = {
  args: {
    title: 'Information',
    content: 'This modal has no footer actions.',
    showFooter: false,
  },
};

export const DeleteConfirmation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <div>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Delete Item
        </button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="sm">
          <ModalHeader onClose={() => setIsOpen(false)}>Delete Confirmation</ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-full bg-red-500/10 p-4">
                <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p className="text-center">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Delete
            </button>
          </ModalFooter>
        </Modal>
      </div>
    );
  },
};

export const FormModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <div>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add New Item
        </button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md">
          <ModalHeader onClose={() => setIsOpen(false)}>Add New Item</ModalHeader>
          <ModalBody>
            <form className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-200">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Enter name"
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-200">
                  Description
                </label>
                <textarea
                  placeholder="Enter description"
                  rows={3}
                  className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-200">
                  Category
                </label>
                <select className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white">
                  <option>Select category</option>
                  <option>Category A</option>
                  <option>Category B</option>
                  <option>Category C</option>
                </select>
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </ModalFooter>
        </Modal>
      </div>
    );
  },
};
