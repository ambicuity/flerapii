import { describe, expect, it } from "vitest"

import { getFeedbackDestinationUrls } from "~/utils/navigation/feedbackLinks"
import {
  getDocsBaseUrl,
  getHomepage,
  getPkgVersion,
  getRepository,
} from "~/utils/navigation/packageMeta"

describe("packageMeta", () => {
  describe("getHomepage", () => {
    it("returns homepage from package.json", () => {
      const homepage = getHomepage()
      expect(homepage).toBeTruthy()
      expect(typeof homepage).toBe("string")
    })

    it("builds single locale homepage URLs without subdirectory", () => {
      expect(getHomepage("en")).toBe(`${getDocsBaseUrl().replace(/\/+$/, "")}/`)
      expect(getHomepage("ja")).toBe(`${getDocsBaseUrl().replace(/\/+$/, "")}/`)
      expect(getHomepage("zh_CN")).toBe(
        `${getDocsBaseUrl().replace(/\/+$/, "")}/`,
      )
    })
  })

  describe("getRepository", () => {
    it("returns repository URL", () => {
      const repo = getRepository()
      expect(repo).toBeTruthy()
      expect(typeof repo).toBe("string")
    })
  })

  describe("getPkgVersion", () => {
    it("returns version for existing dependency", () => {
      const version = getPkgVersion("react")
      expect(version).not.toBe("—")
      expect(version).toBeTruthy()
    })

    it("returns dash for non-existent dependency", () => {
      const version = getPkgVersion("non-existent-package-xyz")
      expect(version).toBe("—")
    })

    it("strips version prefixes", () => {
      const version = getPkgVersion("react")
      expect(version).not.toMatch(/^[~^><= ]/)
    })
  })

  describe("getFeedbackDestinationUrls", () => {
    it("builds the repository feedback destinations from the repository url", () => {
      expect(getFeedbackDestinationUrls()).toEqual({
        repository: "https://github.com/ambicuity/flerapii",
        bugReport:
          "https://github.com/ambicuity/flerapii/issues/new?template=bug_report.yml",
        featureRequest:
          "https://github.com/ambicuity/flerapii/issues/new?template=feature_request.yml",
        discussions: "https://github.com/ambicuity/flerapii/discussions",
      })
    })
  })
})
