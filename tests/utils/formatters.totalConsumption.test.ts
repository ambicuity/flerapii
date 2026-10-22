import { describe, expect, it } from "vitest"

import { UI_CONSTANTS } from "~/constants/ui"
import {
  calculateTotalBalance,
  calculateTotalConsumption,
  calculateTotalConsumptionForSites,
} from "~/utils/core/formatters"

const CONVERSION_FACTOR = UI_CONSTANTS.EXCHANGE_RATE.CONVERSION_FACTOR

const createAccount = (
  overrides: {
    consumption?: number
    exchangeRate?: number
    disabled?: boolean
    excludeFromTotalBalance?: boolean
  } = {},
) => ({
  account_info: {
    today_quota_consumption: overrides.consumption ?? 500_000,
  },
  exchange_rate: overrides.exchangeRate ?? 7.2,
  disabled: overrides.disabled === true,
  excludeFromTotalBalance: overrides.excludeFromTotalBalance === true,
})

describe("calculateTotalConsumption account set consistency", () => {
  it("uses the same account set for USD and CNY when an account is disabled", () => {
    const enabled = createAccount({ consumption: 500_000, exchangeRate: 7.2 })
    const disabled = createAccount({ consumption: 500_000, exchangeRate: 7.2 })
    disabled.disabled = true

    const result = calculateTotalConsumption([enabled, disabled])

    // Only the enabled account may be counted, in both currencies.
    expect(result.USD).toBeCloseTo(500_000 / CONVERSION_FACTOR, 10)
    expect(result.CNY).toBeCloseTo((500_000 / CONVERSION_FACTOR) * 7.2, 10)
  })

  it("uses the same account set for USD and CNY when an account is excluded from the total balance", () => {
    const included = createAccount({ consumption: 500_000, exchangeRate: 7.2 })
    const excluded = createAccount({ consumption: 500_000, exchangeRate: 7.2 })
    excluded.excludeFromTotalBalance = true

    const result = calculateTotalConsumption([included, excluded])

    expect(result.USD).toBeCloseTo(500_000 / CONVERSION_FACTOR, 10)
    expect(result.CNY).toBeCloseTo((500_000 / CONVERSION_FACTOR) * 7.2, 10)
  })

  it("keeps the CNY total proportional to the USD total across exchange rates", () => {
    const accounts = [
      createAccount({ consumption: 500_000, exchangeRate: 7.2 }),
      createAccount({ consumption: 250_000, exchangeRate: 6.8 }),
    ]

    const result = calculateTotalConsumption(accounts)

    const expectedUsd = (500_000 + 250_000) / CONVERSION_FACTOR
    const expectedCny =
      (500_000 / CONVERSION_FACTOR) * 7.2 + (250_000 / CONVERSION_FACTOR) * 6.8

    expect(result.USD).toBeCloseTo(expectedUsd, 10)
    expect(result.CNY).toBeCloseTo(expectedCny, 10)
  })
})

describe("calculateTotalConsumptionForSites inclusion rules", () => {
  it("excludes the same sites as calculateTotalBalance", () => {
    const sites = [
      {
        balance: { USD: 1, CNY: 7.2 },
        todayConsumption: { USD: 1, CNY: 7.2 },
        disabled: false,
        excludeFromTotalBalance: false,
      },
      {
        balance: { USD: 100, CNY: 720 },
        todayConsumption: { USD: 100, CNY: 720 },
        disabled: false,
        excludeFromTotalBalance: true,
      },
      {
        balance: { USD: 100, CNY: 720 },
        todayConsumption: { USD: 100, CNY: 720 },
        disabled: true,
        excludeFromTotalBalance: false,
      },
    ] as any

    const balance = calculateTotalBalance(sites)
    const consumption = calculateTotalConsumptionForSites(sites)

    expect(consumption.USD).toBe(balance.USD)
    expect(consumption.CNY).toBe(balance.CNY)
  })
})
