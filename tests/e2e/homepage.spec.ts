import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/')

    // Check page title
    await expect(page).toHaveTitle(/OnChain Analytics/)

    // Check main heading exists
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })

  test('should display gas tracker', async ({ page }) => {
    await page.goto('/')

    // Wait for gas prices to load
    await page.waitForSelector('[data-testid="gas-price"], .gas-price, text=/GWEI/i', {
      timeout: 10000
    })

    // Check that we have gas price data
    const gasPrices = page.locator('text=/\\d+\\.?\\d*\\s*(GWEI|gwei)/i')
    await expect(gasPrices.first()).toBeVisible()
  })

  test('should display Fear & Greed gauge', async ({ page }) => {
    await page.goto('/')

    // Wait for Fear & Greed to load
    await page.waitForSelector('[data-testid="fear-greed-gauge"], .gauge-simple, text=/FEAR|GREED/i', {
      timeout: 10000
    })

    // Check that gauge value is displayed
    const gaugeValue = page.locator('text=/\\d+/')
    await expect(gaugeValue.first()).toBeVisible()
  })

  test('should display multiple chains', async ({ page }) => {
    await page.goto('/')

    // Check for multiple chain names
    const chains = ['ETHEREUM', 'BASE', 'ARBITRUM', 'OPTIMISM', 'POLYGON']

    for (const chain of chains.slice(0, 3)) { // Check at least 3 chains
      const chainText = page.locator(`text=/${chain}/i`).first()
      await expect(chainText).toBeVisible({ timeout: 10000 })
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto('/')

    // Check that content is still visible
    const content = page.locator('body')
    await expect(content).toBeVisible()

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const clientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1) // +1 for rounding
  })

  test('should have working navigation', async ({ page }) => {
    await page.goto('/')

    // Check if there's a link to events page
    const eventsLink = page.locator('a[href="/events"], text=/Events/i')

    if (await eventsLink.count() > 0) {
      await eventsLink.first().click()
      await expect(page).toHaveURL(/\/events/)
    }
  })
})
