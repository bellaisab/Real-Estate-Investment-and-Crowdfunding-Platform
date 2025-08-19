import { describe, it, expect, beforeEach } from "vitest"

describe("Property Registry Contract", () => {
  let propertyRegistry
  const mockTxSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  const mockInvestor = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
  
  beforeEach(() => {
    // Mock contract initialization
    propertyRegistry = {
      nextPropertyId: 1,
      properties: new Map(),
      propertyShareholders: new Map(),
      investorProperties: new Map(),
    }
  })
  
  describe("Property Registration", () => {
    it("should register a new property successfully", () => {
      const propertyData = {
        address: "123 Main St, City, State",
        totalValue: 1000000,
        totalShares: 100,
        minimumInvestment: 10000,
      }
      
      const result = registerProperty(propertyData)
      
      expect(result.success).toBe(true)
      expect(result.propertyId).toBe(1)
      expect(propertyRegistry.properties.get(1)).toEqual({
        ...propertyData,
        availableShares: 100,
        owner: mockTxSender,
        status: "active",
        createdAt: expect.any(Number),
      })
    })
    
    it("should reject property with zero value", () => {
      const propertyData = {
        address: "123 Main St",
        totalValue: 0,
        totalShares: 100,
        minimumInvestment: 10000,
      }
      
      const result = registerProperty(propertyData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe("ERR-INVALID-VALUE")
    })
    
    it("should reject property with zero shares", () => {
      const propertyData = {
        address: "123 Main St",
        totalValue: 1000000,
        totalShares: 0,
        minimumInvestment: 10000,
      }
      
      const result = registerProperty(propertyData)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe("ERR-INVALID-SHARES")
    })
  })
  
  describe("Share Purchase", () => {
    beforeEach(() => {
      // Setup a property for testing
      registerProperty({
        address: "123 Main St",
        totalValue: 1000000,
        totalShares: 100,
        minimumInvestment: 10000,
      })
    })
    
    it("should allow valid share purchase", () => {
      const result = purchaseShares(1, 10, mockInvestor)
      
      expect(result.success).toBe(true)
      expect(result.investmentAmount).toBe(100000) // 10 shares * 10000 per share
      
      const property = propertyRegistry.properties.get(1)
      expect(property.availableShares).toBe(90)
      
      const shareholderInfo = propertyRegistry.propertyShareholders.get(`1-${mockInvestor}`)
      expect(shareholderInfo.shares).toBe(10)
      expect(shareholderInfo.investmentAmount).toBe(100000)
    })
    
    it("should reject purchase exceeding available shares", () => {
      const result = purchaseShares(1, 150, mockInvestor)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe("ERR-INSUFFICIENT-SHARES")
    })
    
    it("should reject purchase below minimum investment", () => {
      const result = purchaseShares(1, 0.5, mockInvestor) // 5000 < 10000 minimum
      
      expect(result.success).toBe(false)
      expect(result.error).toBe("ERR-INVALID-VALUE")
    })
  })
  
  describe("Share Transfer", () => {
    beforeEach(() => {
      registerProperty({
        address: "123 Main St",
        totalValue: 1000000,
        totalShares: 100,
        minimumInvestment: 10000,
      })
      purchaseShares(1, 20, mockTxSender)
    })
    
    it("should transfer shares successfully", () => {
      const result = transferShares(1, mockInvestor, 10, mockTxSender)
      
      expect(result.success).toBe(true)
      expect(result.sharesTransferred).toBe(10)
      
      const senderInfo = propertyRegistry.propertyShareholders.get(`1-${mockTxSender}`)
      const recipientInfo = propertyRegistry.propertyShareholders.get(`1-${mockInvestor}`)
      
      expect(senderInfo.shares).toBe(10)
      expect(recipientInfo.shares).toBe(10)
    })
    
    it("should reject transfer of more shares than owned", () => {
      const result = transferShares(1, mockInvestor, 25, mockTxSender)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe("ERR-INSUFFICIENT-SHARES")
    })
  })
  
  // Helper functions for testing
  function registerProperty(data) {
    if (data.totalValue <= 0) return { success: false, error: "ERR-INVALID-VALUE" }
    if (data.totalShares <= 0) return { success: false, error: "ERR-INVALID-SHARES" }
    if (data.minimumInvestment <= 0) return { success: false, error: "ERR-INVALID-VALUE" }
    
    const propertyId = propertyRegistry.nextPropertyId++
    propertyRegistry.properties.set(propertyId, {
      ...data,
      availableShares: data.totalShares,
      owner: mockTxSender,
      status: "active",
      createdAt: Date.now(),
    })
    
    return { success: true, propertyId }
  }
  
  function purchaseShares(propertyId, shares, investor) {
    const property = propertyRegistry.properties.get(propertyId)
    if (!property) return { success: false, error: "ERR-PROPERTY-NOT-FOUND" }
    
    const sharePrice = property.totalValue / property.totalShares
    const investmentAmount = shares * sharePrice
    
    if (property.availableShares < shares) return { success: false, error: "ERR-INSUFFICIENT-SHARES" }
    if (investmentAmount < property.minimumInvestment) return { success: false, error: "ERR-INVALID-VALUE" }
    
    property.availableShares -= shares
    
    const key = `${propertyId}-${investor}`
    const existing = propertyRegistry.propertyShareholders.get(key) || { shares: 0, investmentAmount: 0 }
    propertyRegistry.propertyShareholders.set(key, {
      shares: existing.shares + shares,
      investmentAmount: existing.investmentAmount + investmentAmount,
      investedAt: Date.now(),
    })
    
    return { success: true, investmentAmount }
  }
  
  function transferShares(propertyId, recipient, shares, sender) {
    const senderKey = `${propertyId}-${sender}`
    const recipientKey = `${propertyId}-${recipient}`
    
    const senderInfo = propertyRegistry.propertyShareholders.get(senderKey)
    if (!senderInfo || senderInfo.shares < shares) {
      return { success: false, error: "ERR-INSUFFICIENT-SHARES" }
    }
    
    const property = propertyRegistry.properties.get(propertyId)
    const sharePrice = property.totalValue / property.totalShares
    const transferAmount = shares * sharePrice
    
    senderInfo.shares -= shares
    senderInfo.investmentAmount -= transferAmount
    
    const recipientInfo = propertyRegistry.propertyShareholders.get(recipientKey) || { shares: 0, investmentAmount: 0 }
    recipientInfo.shares += shares
    recipientInfo.investmentAmount += transferAmount
    recipientInfo.investedAt = Date.now()
    
    propertyRegistry.propertyShareholders.set(recipientKey, recipientInfo)
    
    return { success: true, sharesTransferred: shares }
  }
})
