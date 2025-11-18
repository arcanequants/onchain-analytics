#!/usr/bin/env python3
"""
Apply Wallet Tracking Migration to Supabase
"""

import os
import sys

# Read the migration SQL file
migration_file = 'supabase/migrations/20251117234118_create_wallet_tracking_tables.sql'

if not os.path.exists(migration_file):
    print(f"❌ Migration file not found: {migration_file}")
    sys.exit(1)

with open(migration_file, 'r') as f:
    sql_content = f.read()

print("🔧 Wallet Tracking Migration")
print("=" * 50)
print()
print("📋 This migration will create:")
print("  ✓ wallet_balances table")
print("  ✓ wallet_nfts table")
print("  ✓ wallet_history table")
print("  ✓ tracked_wallets table")
print("  ✓ Indexes for performance")
print("  ✓ RLS policies")
print("  ✓ Helper functions")
print()
print("⚠️  MANUAL APPLICATION REQUIRED:")
print()
print("Option 1: Supabase Dashboard (Recommended)")
print("-" * 50)
print("1. Go to: https://supabase.com/dashboard/project/fjxbuyxephlfoivcpckd/sql/new")
print(f"2. Copy the contents of: {migration_file}")
print("3. Paste into SQL Editor")
print("4. Click 'Run' (or press Cmd/Ctrl + Enter)")
print()
print("Option 2: Copy SQL to clipboard (macOS)")
print("-" * 50)
print(f"pbcopy < {migration_file}")
print()
print("✅ Migration file ready!")
print()

# Offer to copy to clipboard on macOS
response = input("📋 Copy SQL to clipboard now? (y/n): ").strip().lower()
if response == 'y':
    os.system(f"cat {migration_file} | pbcopy")
    print("✅ SQL copied to clipboard!")
    print("Now paste it into the Supabase SQL Editor and run it.")
else:
    print(f"📄 Migration SQL available at: {migration_file}")
