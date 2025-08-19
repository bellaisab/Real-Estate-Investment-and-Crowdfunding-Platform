# Real Estate Investment and Crowdfunding Platform

A comprehensive blockchain-based platform built on Stacks that enables fractional ownership of commercial and residential properties through smart contracts.

## Overview

This platform revolutionizes real estate investment by allowing multiple investors to own fractions of properties, receive proportional rental income, and participate in property management decisions. All transactions and ownership records are transparently recorded on the blockchain.

## Key Features

### 🏢 Fractional Property Ownership
- Tokenized property shares with transparent ownership tracking
- Minimum investment thresholds and maximum ownership caps
- Secure transfer of ownership shares between investors

### 💰 Automated Income Distribution
- Proportional rental income distribution to all shareholders
- Transparent fee deduction for property management
- Automated monthly distributions with detailed reporting

### 📊 Investment Management
- Real-time property performance tracking
- Investment portfolio management across multiple properties
- Tax documentation and reporting for all investors

### 🗳️ Governance & Decision Making
- Shareholder voting on major property decisions
- Transparent proposal and voting system
- Quorum requirements for important decisions

### 🚪 Exit Strategy Planning
- Property liquidation mechanisms
- Fair market value assessments
- Proportional distribution of sale proceeds

## Smart Contract Architecture

### Core Contracts

1. **Property Registry (`property-registry.clar`)**
    - Property registration and metadata management
    - Ownership structure and share allocation
    - Property status and lifecycle management

2. **Investment Manager (`investment-manager.clar`)**
    - Investor onboarding and KYC tracking
    - Investment limits and compliance
    - Portfolio management across properties

3. **Income Distributor (`income-distributor.clar`)**
    - Rental income collection and distribution
    - Fee calculation and management
    - Distribution history and reporting

4. **Governance System (`governance.clar`)**
    - Proposal creation and voting mechanisms
    - Shareholder rights and responsibilities
    - Decision execution and implementation

5. **Exit Strategy (`exit-strategy.clar`)**
    - Property sale initiation and approval
    - Valuation and price discovery
    - Proceeds distribution to shareholders

## Getting Started

### Prerequisites
- Clarinet CLI installed
- Node.js 18+ for testing
- Stacks wallet for interaction

### Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd real-estate-crowdfunding

# Install dependencies
npm install

# Run tests
npm test

# Deploy contracts (testnet)
clarinet deploy --testnet
\`\`\`

### Testing

The platform includes comprehensive test coverage using Vitest:

\`\`\`bash
# Run all tests
npm test

# Run specific test file
npm test property-registry.test.js

# Run tests with coverage
npm run test:coverage
\`\`\`

## Usage Examples

### Property Registration
```clarity
;; Register a new property
(contract-call? .property-registry register-property
  "123 Main St, City, State"
  u1000000  ;; Total value in microSTX
  u100      ;; Total shares
  u10000    ;; Minimum investment
)
