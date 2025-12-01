/**
 * Card Component Stories
 * Phase 4, Week 8 - Internal Tools & DX Checklist
 */

import type { Meta, StoryObj } from '@storybook/react';

// Card components for Storybook demo
const Card = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`rounded-lg border border-gray-700 bg-gray-900 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
);

const CardTitle = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight text-white ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => <p className={`text-sm text-gray-400 ${className}`}>{children}</p>;

const CardContent = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;

const CardFooter = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300">Card content area</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Make changes to your account here</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300">Your account settings and preferences</p>
      </CardContent>
      <CardFooter>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Save Changes
        </button>
      </CardFooter>
    </Card>
  ),
};

export const StatsCard: Story = {
  render: () => (
    <Card className="w-64">
      <CardHeader className="pb-2">
        <CardDescription>Total Revenue</CardDescription>
        <CardTitle className="text-3xl">$45,231.89</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-green-500">+20.1% from last month</p>
      </CardContent>
    </Card>
  ),
};

export const PricingCard: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Pro Plan</CardTitle>
        <CardDescription>For growing businesses</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold text-white">$29</span>
          <span className="text-gray-400">/month</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Unlimited analyses
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> API access
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Priority support
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Custom reports
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          Get Started
        </button>
      </CardFooter>
    </Card>
  ),
};

export const AlertCard: Story = {
  render: () => (
    <Card className="w-96 border-yellow-500/50 bg-yellow-500/10">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className="text-yellow-500 text-xl">⚠️</span>
          <CardTitle className="text-yellow-500">Warning</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300">
          Your API usage is approaching the monthly limit. Consider upgrading your plan.
        </p>
      </CardContent>
    </Card>
  ),
};

export const GridOfCards: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Card className="w-48">
        <CardHeader className="pb-2">
          <CardDescription>Users</CardDescription>
          <CardTitle>1,234</CardTitle>
        </CardHeader>
      </Card>
      <Card className="w-48">
        <CardHeader className="pb-2">
          <CardDescription>Analyses</CardDescription>
          <CardTitle>56,789</CardTitle>
        </CardHeader>
      </Card>
      <Card className="w-48">
        <CardHeader className="pb-2">
          <CardDescription>Accuracy</CardDescription>
          <CardTitle>98.5%</CardTitle>
        </CardHeader>
      </Card>
    </div>
  ),
};
