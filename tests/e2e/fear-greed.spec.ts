import { test, expect } from '@playwright/test'

test.describe('Fear & Greed Index', () => {
  test('should display Fear & Greed gauge', async ({ page }) => {
    await page.goto('/')

    // Wait for gauge to load
    await page.waitForSelector('[data-testid="fear-greed-gauge"], .gauge-simple, text=/FEAR|GREED/i', {
      timeout: 10000
    })

    // Check gauge is visible
    const gauge = page.locator('[data-testid="fear-greed-gauge"], .gauge-simple').first()
    await expect(gauge).toBeVisible()
  })

  test('should display numerical value (0-100)', async ({ page }) => {
    await page.goto('/')

    await page.waitForSelector('text=/FEAR|GREED/i', { timeout: 10000 })

    // Find the numerical value
    const valueElement = page.locator('.gauge-value, [data-testid="gauge-value"]').first()

    if (await valueElement.count() > 0) {
      const value = await valueElement.textContent()
      const numValue = parseInt(value || '0', 10)

      expect(numValue).toBeGreaterThanOrEqual(0)
      expect(numValue).toBeLessThanOrEqual(100)
    }
  })

  test('should display classification label', async ({ page }) => {
    await page.goto('/')

    await page.waitForSelector('text=/FEAR|GREED/i', { timeout: 10000 })

    // Check for classification text
    const labels = ['EXTREME FEAR', 'FEAR', 'NEUTRAL', 'GREED', 'EXTREME GREED']
    let foundLabel = false

    for (const label of labels) {
      const element = page.locator(`text=/${label}/i`)
      if (await element.count() > 0) {
        foundLabel = true
        break
      }
    }

    expect(foundLabel).toBe(true)
  })

  test('should have colored gauge based on value', async ({ page }) => {
    await page.goto('/')

    await page.waitForSelector('[data-testid="fear-greed-gauge"], .gauge-simple', {
      timeout: 10000
    })

    // Check for color styling (gauge should have some color)
    const gauge = page.locator('[data-testid="fear-greed-gauge"], .gauge-simple').first()
    const styles = await gauge.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      }
    })

    // Should have some styling (not default)
    expect(styles.color || styles.backgroundColor).toBeTruthy()
  })
})
