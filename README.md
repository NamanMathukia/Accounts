📘 Accounts App – Inventory, Sales & Financial Management

A complete mini-ERP built with Next.js 14, Supabase, and Tailwind CSS, designed specifically for small businesses that manage products in 250g / 500g packets.

This app is optimized for mobile use, supports real-world store workflows, and ensures secure user-based data separation using Supabase Row-Level Security.

🚀 Features
🔐 1. Authentication (Email + Phone Login)

Login with email OR phone number (phone uses a virtual email system)

Stores full name in user metadata

Sidebar shows avatar initials + user name

All data is isolated per user via RLS

📦 2. Product & Inventory Management

Each product stores:

Product name

Default packet size

Stock of 250g packets

Stock of 500g packets

Includes:

Add product page

Live inventory dashboard

Auto-updated stock on transactions

No inventory table — fully packet-based stock system

🔄 3. Transactions (Purchase & Sale)
Purchase Page

Fields:

Product

Packet size

Number of packets

Price per KG
✔ App auto-calculates price per packet
✔ Inventory increases

Sale Page

Fields:

Product

Packet size

Number of packets

Price per KG

Payment mode: Cash / GPay / Credit

Customer (only for credit sales)

✔ Sale reduces packet stock
✔ Credit increases customer balance
✔ If stock is insufficient, user is prompted:

Convert larger packets to smaller ones?

Conversion is handled safely in Supabase so inventory never mismatches.

💰 4. Expense Management

Add daily/monthly expenses

Category, amount, notes

Fully included in profit calculations

Listed on the Financials page

👥 5. Customer Management

Add customers (name, phone)

Track customer credit balance

Used during credit sales

📊 6. Financial Dashboard

Shows:

Total Revenue

Total Cost

Total Expenses

Net Profit

Profit by product

Expense list

Credit summary (optional)

All numbers are synced with the updated transaction + customer system.

🛡 Supabase Backend Implementation
✔ Tables

products

transactions

expenses

customers

All tables include:

user_id UUID DEFAULT auth.uid()

✔ Row-Level Security (RLS)

On every table:

user_id = auth.uid()

✔ RPC Functions

All updated to use user_id + new stock system:

insert_transaction_and_update_inventory

convert_packets

delete_transaction

These handle all stock mutations safely.

🎨 UI / UX

Full white + blue modern business theme

Smooth animations via fade, slide, tap-scale classes

Mobile-first responsive layout

Redesigned Login page

Redesigned Sidebar with avatar + email/name

Toast notifications (no browser alert spam)

Clean spacing & card design across all pages

📁 Project Structure
app/
  login/
  dashboard/
  add-product/
  add-transaction/
      purchase/
      sale/
  expenses/
  financials/
  transactions/
  customers/
  components/
      Sidebar.tsx
      MobileMenuButton.tsx
      Toast.tsx
      ConfirmButton.tsx
  api/
      transaction.ts
      convert.ts
      delete-transaction.ts

supabase/
  (rpc functions + policies)

🛠 Tech Stack

Next.js 14 (App Router)

React

TypeScript

Tailwind CSS

Supabase (Auth + DB + RLS + RPC)

Vercel (deployment)

🚀 Deployment

Push to GitHub

Deploy on Vercel

Add ENV variables:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=


Apply SQL schema (RPCs + RLS policies)

App will fully run from mobile & desktop

🧪 Testing Checklist

✔ Purchases update inventory
✔ Sales reduce packets
✔ Conversion logic works
✔ Credit customers work
✔ Expenses included in profit
✔ Dashboard inventory correct
✔ Sidebar responsive
✔ Login secure
✔ All RLS rules enforced
