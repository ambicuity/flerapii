#!/usr/bin/env node
// Upload (and optionally submit for review) a Chrome zip to the Chrome Web Store
// using a Google Cloud service account instead of an OAuth refresh token.
//
// The service account's email must be added to the Chrome Web Store developer
// account (Developer Dashboard → Account → Service accounts).
//
// Usage: node scripts/publish-chrome-webstore.mjs <chrome-zip>
// Env:
//   CHROME_SERVICE_ACCOUNT_JSON  service-account key file contents (required)
//   CHROME_EXTENSION_ID          store item id (required)
//   CHROME_SKIP_SUBMIT_REVIEW    "true" to upload the draft without publishing
import { createSign } from "node:crypto"
import { readFile } from "node:fs/promises"

const SCOPE = "https://www.googleapis.com/auth/chromewebstore"
const API_BASE = "https://www.googleapis.com/chromewebstore/v1.1/items"
const UPLOAD_BASE =
  "https://www.googleapis.com/upload/chromewebstore/v1.1/items"
const UPLOAD_POLL_INTERVAL_MS = 5_000
const UPLOAD_POLL_ATTEMPTS = 24
const PUBLISH_OK_STATUSES = new Set(["OK", "ITEM_PENDING_REVIEW"])

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

function base64url(input) {
  return Buffer.from(input).toString("base64url")
}

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claims = base64url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: SCOPE,
      aud: serviceAccount.token_uri,
      iat: now,
      exp: now + 3600,
    }),
  )
  const signature = createSign("RSA-SHA256")
    .update(`${header}.${claims}`)
    .sign(serviceAccount.private_key, "base64url")

  const response = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  })
  const body = await response.json()
  if (!response.ok || !body.access_token) {
    throw new Error(
      `Token exchange failed (${response.status}): ${JSON.stringify(body)}`,
    )
  }
  return body.access_token
}

async function callApi(url, token, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      "x-goog-api-version": "2",
    },
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `${init.method ?? "GET"} ${url} failed (${response.status}): ${text}`,
    )
  }
  return text ? JSON.parse(text) : {}
}

async function waitForUpload(extensionId, token) {
  for (let attempt = 0; attempt < UPLOAD_POLL_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, UPLOAD_POLL_INTERVAL_MS))
    const item = await callApi(
      `${API_BASE}/${extensionId}?projection=DRAFT`,
      token,
    )
    if (item.uploadState !== "IN_PROGRESS") return item
  }
  throw new Error(
    "Upload still IN_PROGRESS after polling; check the developer dashboard",
  )
}

// The upload response omits crxVersion; the DRAFT projection carries it.
// Only used for logging, so a lookup failure must not fail the publish.
async function fetchDraftVersion(extensionId, token) {
  try {
    const item = await callApi(
      `${API_BASE}/${extensionId}?projection=DRAFT`,
      token,
    )
    return item.crxVersion
  } catch (error) {
    console.warn(
      `Could not read draft version: ${error instanceof Error ? error.message : error}`,
    )
    return undefined
  }
}

async function main() {
  const zipPath = process.argv[2]
  if (!zipPath)
    throw new Error("Usage: publish-chrome-webstore.mjs <chrome-zip>")

  const serviceAccount = JSON.parse(requireEnv("CHROME_SERVICE_ACCOUNT_JSON"))
  const extensionId = requireEnv("CHROME_EXTENSION_ID")
  const skipReview = process.env.CHROME_SKIP_SUBMIT_REVIEW === "true"

  const token = await getAccessToken(serviceAccount)
  const zip = await readFile(zipPath)

  console.log(
    `Uploading ${zipPath} (${zip.length} bytes) to item ${extensionId}`,
  )
  let item = await callApi(
    `${UPLOAD_BASE}/${extensionId}?uploadType=media`,
    token,
    {
      method: "PUT",
      body: zip,
    },
  )
  if (item.uploadState === "IN_PROGRESS")
    item = await waitForUpload(extensionId, token)
  if (item.uploadState !== "SUCCESS") {
    throw new Error(`Upload failed: ${JSON.stringify(item.itemError ?? item)}`)
  }
  const draftVersion =
    item.crxVersion ?? (await fetchDraftVersion(extensionId, token))
  console.log(`Upload succeeded: draft version ${draftVersion ?? "(unknown)"}`)

  if (skipReview) {
    console.log("CHROME_SKIP_SUBMIT_REVIEW=true, leaving the upload as a draft")
    return
  }

  const result = await callApi(`${API_BASE}/${extensionId}/publish`, token, {
    method: "POST",
    body: "",
  })
  const statuses = result.status ?? []
  console.log(`Publish status: ${statuses.join(", ")}`)
  if (!statuses.some((status) => PUBLISH_OK_STATUSES.has(status))) {
    throw new Error(`Publish rejected: ${JSON.stringify(result)}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
