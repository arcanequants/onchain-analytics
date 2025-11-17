import { test, expect } from '@playwright/test'

test.describe('Gas Tracker', () => {
  test('should display gas prices for all chains', async ({ page }) => {
    await page.goto('/')

    // Wait for gas data to load
    await page.waitForSelector('text=/GWEI/i', { timeout: 10000 })

    // Check for gas price cards
    const gasPriceCards = page.locator('[data-testid="gas-card"], .gas-card, .info-card')
    const count = await gasPriceCards.count()

    expect(count).toBeGreaterThan(0)
  })

  test('should show gas status (low/medium/high)', async ({ page }) => {
    await page.goto('/')

    await page.waitForSelector('text=/GWEI/i', { timeout: 10000 })

    // Look for status indicators
    const statusText = page.locator('text=/LOW|MEDIUM|HIGH/i')
    const statusCount = await statusText.count()

    expect(statusCount).toBeGreaterThan(0)
  })

  test('should display gas chart if available', async ({ page }) => {
    await page.goto('/')

    // Check if chart component exists
    const chart = page.locator('[data-testid="gas-chart"], .recharts-wrapper, canvas')

    if (await chart.count() > 0) {
      await expect(chart.first()).toBeVisible()
    }
  })

  test('should update gas prices on refresh', async ({ page }) => {
    await page.goto('/')

    await page.waitForSelector('text=/GWEI/i', { timeout: 10000 })

    // Get initial gas price
    const gasPriceElement = page.locator('text=/\\d+\\.?\\d*\\s*GWEI/i').first()
    const initialPrice = await gasPriceElement.textContent()

    // Wait a bit and reload
    await page.waitForTimeout(2000)
    await page.reload()

    await page.waitForSelector('text=/GWEI/i', { timeout: 10000 })

    // Gas prices should still be present (may or may not have changed)
    const newGasPriceElement = page.locator('text=/\\d+\\.?\\d*\\s*GWEI/i').first()
    const newPrice = await newGasPriceElement.textContent()

    expect(newPrice).toBeTruthy()
  })
})
