
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** vibe-olympics
- **Date:** 2025-12-10
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** User login with valid credentials via Email/Password
- **Test Code:** [TC001_User_login_with_valid_credentials_via_EmailPassword.py](./TC001_User_login_with_valid_credentials_via_EmailPassword.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/78f8f630-edd2-4734-94ac-fee8e5e6154d
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** User login failure with invalid credentials
- **Test Code:** [TC002_User_login_failure_with_invalid_credentials.py](./TC002_User_login_failure_with_invalid_credentials.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/8597cfb2-6645-45f6-91b4-4df9d0c1ec34
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** User login via GitHub OAuth
- **Test Code:** [TC003_User_login_via_GitHub_OAuth.py](./TC003_User_login_via_GitHub_OAuth.py)
- **Test Error:** The task to verify GitHub OAuth authentication cannot proceed because the login page is inaccessible. The '로그인' button does not navigate to the login page, blocking the OAuth flow. This issue has been reported. Task is now complete.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/6c88a343-fc9e-495c-a079-ffb9167c33b7
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** User login via Google OAuth
- **Test Code:** [TC004_User_login_via_Google_OAuth.py](./TC004_User_login_via_Google_OAuth.py)
- **Test Error:** Google OAuth login flow could not be completed due to OAuthSignin error. The login button does not trigger the OAuth process and no error messages or retry options are available. Further testing is stopped due to this blocking issue.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Warning: Extra attributes from the server: %s%s style 
    at input
    at div
    at eval (webpack-internal:///(app-pages-browser)/./src/components/ui/input.tsx:14:11)
    at div
    at form
    at div
    at _c8 (webpack-internal:///(app-pages-browser)/./src/components/ui/card.tsx:80:11)
    at div
    at _c (webpack-internal:///(app-pages-browser)/./src/components/ui/card.tsx:18:11)
    at div
    at MotionDOMComponent (webpack-internal:///(app-pages-browser)/./node_modules/framer-motion/dist/es/motion/index.mjs:62:65)
    at div
    at LoginContent (webpack-internal:///(app-pages-browser)/./src/app/auth/login/login-content.tsx:36:78)
    at LoginPage (Server)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at Suspense
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at main
    at SessionProvider (webpack-internal:///(app-pages-browser)/./node_modules/next-auth/react/index.js:365:24)
    at AuthProvider (webpack-internal:///(app-pages-browser)/./src/components/providers/auth-provider.tsx:11:11)
    at QueryClientProvider (webpack-internal:///(app-pages-browser)/./node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js:27:11)
    at QueryProvider (webpack-internal:///(app-pages-browser)/./src/components/providers/query-provider.tsx:17:11)
    at IntlProvider (webpack-internal:///(app-pages-browser)/./node_modules/use-intl/dist/esm/development/react.js:24:3)
    at NextIntlClientProvider (webpack-internal:///(app-pages-browser)/./node_modules/next-intl/dist/esm/development/shared/NextIntlClientProvider.js:10:11)
    at NextIntlClientProviderServer (Server)
    at body
    at html
    at RootLayout (Server)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at DevRootNotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/dev-root-not-found-boundary.js:33:11)
    at ReactDevOverlay (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/ReactDevOverlay.js:87:9)
    at HotReload (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/hot-reloader-client.js:321:11)
    at Router (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:207:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at AppRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:585:13)
    at ServerRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:112:27)
    at Root (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:117:11) (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/bd2f6e0a-fb86-4419-acdd-0cdbe372c6dc
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** Product listing with keyword search and category filter
- **Test Code:** [TC005_Product_listing_with_keyword_search_and_category_filter.py](./TC005_Product_listing_with_keyword_search_and_category_filter.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/7c0101ce-15d8-4b11-9a8f-40dcaa79bac3
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** Digital product multi-step registration for sellers
- **Test Code:** [TC006_Digital_product_multi_step_registration_for_sellers.py](./TC006_Digital_product_multi_step_registration_for_sellers.py)
- **Test Error:** Login failed repeatedly with error 'Email or password is incorrect'. Unable to proceed with product registration flow testing. Reporting issue and stopping further actions.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/auth/callback/credentials:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/4915adfc-6f6b-4c51-9f0b-419fc0789837
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** Payment processing for product purchase using Bootpay Card method
- **Test Code:** [TC007_Payment_processing_for_product_purchase_using_Bootpay_Card_method.py](./TC007_Payment_processing_for_product_purchase_using_Bootpay_Card_method.py)
- **Test Error:** Login attempts failed with both email/password and GitHub login. Unable to proceed with purchase test due to authentication issues. Reporting issue and stopping further actions.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/auth/callback/credentials:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/c47aff04-afd1-45c3-92ca-ced3e6b8a851
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** Failed payment handling with Bootpay (e.g., payment cancellation)
- **Test Code:** [TC008_Failed_payment_handling_with_Bootpay_e.g._payment_cancellation.py](./TC008_Failed_payment_handling_with_Bootpay_e.g._payment_cancellation.py)
- **Test Error:** Testing stopped due to navigation issue after login. Cannot proceed with payment cancellation/failure verification as the product page is inaccessible.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Warning: In HTML, %s cannot be a descendant of <%s>.
This will cause a hydration error.%s <a> a 
    at a
    at LinkComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/link.js:121:19)
    at div
    at div
    at div
    at _c8 (webpack-internal:///(app-pages-browser)/./src/components/ui/card.tsx:80:11)
    at div
    at _c (webpack-internal:///(app-pages-browser)/./src/components/ui/card.tsx:18:11)
    at a
    at LinkComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/link.js:121:19)
    at ProductCard (webpack-internal:///(app-pages-browser)/./src/app/marketplace/marketplace-content.tsx:1194:11)
    at div
    at MotionDOMComponent (webpack-internal:///(app-pages-browser)/./node_modules/framer-motion/dist/es/motion/index.mjs:62:65)
    at div
    at main
    at div
    at div
    at div
    at MarketplaceContent (webpack-internal:///(app-pages-browser)/./src/app/marketplace/marketplace-content.tsx:90:90)
    at MarketplacePage (Server)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at Suspense
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at Suspense
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at main
    at SessionProvider (webpack-internal:///(app-pages-browser)/./node_modules/next-auth/react/index.js:365:24)
    at AuthProvider (webpack-internal:///(app-pages-browser)/./src/components/providers/auth-provider.tsx:11:11)
    at QueryClientProvider (webpack-internal:///(app-pages-browser)/./node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js:27:11)
    at QueryProvider (webpack-internal:///(app-pages-browser)/./src/components/providers/query-provider.tsx:17:11)
    at IntlProvider (webpack-internal:///(app-pages-browser)/./node_modules/use-intl/dist/esm/development/react.js:24:3)
    at NextIntlClientProvider (webpack-internal:///(app-pages-browser)/./node_modules/next-intl/dist/esm/development/shared/NextIntlClientProvider.js:10:11)
    at NextIntlClientProviderServer (Server)
    at body
    at html
    at RootLayout (Server)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at DevRootNotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/dev-root-not-found-boundary.js:33:11)
    at ReactDevOverlay (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/ReactDevOverlay.js:87:9)
    at HotReload (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/hot-reloader-client.js:321:11)
    at Router (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:207:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at AppRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:585:13)
    at ServerRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:112:27)
    at Root (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:117:11) (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/2116ea79-9362-4aea-9ed6-4c0c995e0d5f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** Community forum post creation, editing, and deletion
- **Test Code:** [TC009_Community_forum_post_creation_editing_and_deletion.py](./TC009_Community_forum_post_creation_editing_and_deletion.py)
- **Test Error:** Testing stopped due to inability to authenticate via email/password or GitHub OAuth login. Authentication is required to access community forum and perform post operations. Please resolve login issues first.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/auth/callback/credentials:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/auth/callback/credentials:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/b228fabe-77de-4c67-b785-394892650a3e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010
- **Test Name:** Community forum comment threading and reactions
- **Test Code:** [TC010_Community_forum_comment_threading_and_reactions.py](./TC010_Community_forum_comment_threading_and_reactions.py)
- **Test Error:** Testing stopped due to community page loading failure after login. Unable to access posts to test threaded comments and reactions.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/auth/callback/credentials:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/ffca07f6-5973-448b-91f6-f0ac073d0867
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011
- **Test Name:** AI-based personalized recommendation display
- **Test Code:** [TC011_AI_based_personalized_recommendation_display.py](./TC011_AI_based_personalized_recommendation_display.py)
- **Test Error:** Automated login via GitHub OAuth is blocked due to inability to input credentials on the GitHub login page. Therefore, the task to verify personalized recommendations for authenticated users cannot be fully completed. Manual intervention is required to complete login and verify recommendations. The issue has been reported.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/auth/callback/credentials:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/auth/callback/credentials:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/a3f65d61-1d4c-4874-b258-41a5e9b44665
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012
- **Test Name:** Multi-language interface switching and URL localization
- **Test Code:** [TC012_Multi_language_interface_switching_and_URL_localization.py](./TC012_Multi_language_interface_switching_and_URL_localization.py)
- **Test Error:** Language toggle functionality is broken. The language does not switch from Korean to English and the URL does not update accordingly. Stopping further testing.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/cf587a0f-e36e-457c-869d-fad93e751b72
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013
- **Test Name:** User notification subscription lifecycle
- **Test Code:** [TC013_User_notification_subscription_lifecycle.py](./TC013_User_notification_subscription_lifecycle.py)
- **Test Error:** Testing stopped due to inability to access user settings dashboard and notification settings after login. Persistent loading spinner blocks further testing of push notification subscription and preferences. Issue reported to development team.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/auth/callback/credentials:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/e7e6be6b-daf5-4366-ba46-88c16f7c7c2f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014
- **Test Name:** API health check endpoint response
- **Test Code:** [TC014_API_health_check_endpoint_response.py](./TC014_API_health_check_endpoint_response.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/559351bd-83f0-441b-8f95-f76876cb4454
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015
- **Test Name:** Admin user management operations
- **Test Code:** [TC015_Admin_user_management_operations.py](./TC015_Admin_user_management_operations.py)
- **Test Error:** Administrator login failed due to incorrect email or password error message. Cannot proceed to verify user management features. Please verify administrator credentials and try again.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/a3b1a17b-2378-4a5d-a21d-3e3717fa4617
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016
- **Test Name:** Responsive UI layout across different screen sizes
- **Test Code:** [TC016_Responsive_UI_layout_across_different_screen_sizes.py](./TC016_Responsive_UI_layout_across_different_screen_sizes.py)
- **Test Error:** Verified the marketplace page on mobile viewport (360x640) with all key UI components visible, legible, and accessible. No horizontal scroll or layout breakage was observed. However, the testing for tablet (768x1024), desktop (1366x768), and large screen (1920x1080) viewports for marketplace, community, and dashboard pages has not been completed yet. Therefore, the task is not fully finished.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Warning: In HTML, %s cannot be a descendant of <%s>.
This will cause a hydration error.%s <a> a 
    at a
    at LinkComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/link.js:121:19)
    at div
    at div
    at div
    at _c8 (webpack-internal:///(app-pages-browser)/./src/components/ui/card.tsx:80:11)
    at div
    at _c (webpack-internal:///(app-pages-browser)/./src/components/ui/card.tsx:18:11)
    at a
    at LinkComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/link.js:121:19)
    at ProductCard (webpack-internal:///(app-pages-browser)/./src/app/marketplace/marketplace-content.tsx:1194:11)
    at div
    at MotionDOMComponent (webpack-internal:///(app-pages-browser)/./node_modules/framer-motion/dist/es/motion/index.mjs:62:65)
    at div
    at main
    at div
    at div
    at div
    at MarketplaceContent (webpack-internal:///(app-pages-browser)/./src/app/marketplace/marketplace-content.tsx:90:90)
    at MarketplacePage (Server)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at Suspense
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at Suspense
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at main
    at SessionProvider (webpack-internal:///(app-pages-browser)/./node_modules/next-auth/react/index.js:365:24)
    at AuthProvider (webpack-internal:///(app-pages-browser)/./src/components/providers/auth-provider.tsx:11:11)
    at QueryClientProvider (webpack-internal:///(app-pages-browser)/./node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js:27:11)
    at QueryProvider (webpack-internal:///(app-pages-browser)/./src/components/providers/query-provider.tsx:17:11)
    at IntlProvider (webpack-internal:///(app-pages-browser)/./node_modules/use-intl/dist/esm/development/react.js:24:3)
    at NextIntlClientProvider (webpack-internal:///(app-pages-browser)/./node_modules/next-intl/dist/esm/development/shared/NextIntlClientProvider.js:10:11)
    at NextIntlClientProviderServer (Server)
    at body
    at html
    at RootLayout (Server)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at DevRootNotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/dev-root-not-found-boundary.js:33:11)
    at ReactDevOverlay (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/ReactDevOverlay.js:87:9)
    at HotReload (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/hot-reloader-client.js:321:11)
    at Router (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:207:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at AppRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:585:13)
    at ServerRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:112:27)
    at Root (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:117:11) (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Warning: In HTML, %s cannot be a descendant of <%s>.
This will cause a hydration error.%s <a> a 
    at a
    at LinkComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/link.js:121:19)
    at div
    at div
    at div
    at _c8 (webpack-internal:///(app-pages-browser)/./src/components/ui/card.tsx:80:11)
    at div
    at _c (webpack-internal:///(app-pages-browser)/./src/components/ui/card.tsx:18:11)
    at a
    at LinkComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/link.js:121:19)
    at ProductCard (webpack-internal:///(app-pages-browser)/./src/app/marketplace/marketplace-content.tsx:1194:11)
    at div
    at MotionDOMComponent (webpack-internal:///(app-pages-browser)/./node_modules/framer-motion/dist/es/motion/index.mjs:62:65)
    at div
    at main
    at div
    at div
    at div
    at MarketplaceContent (webpack-internal:///(app-pages-browser)/./src/app/marketplace/marketplace-content.tsx:90:90)
    at MarketplacePage (Server)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at Suspense
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at Suspense
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at main
    at SessionProvider (webpack-internal:///(app-pages-browser)/./node_modules/next-auth/react/index.js:365:24)
    at AuthProvider (webpack-internal:///(app-pages-browser)/./src/components/providers/auth-provider.tsx:11:11)
    at QueryClientProvider (webpack-internal:///(app-pages-browser)/./node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js:27:11)
    at QueryProvider (webpack-internal:///(app-pages-browser)/./src/components/providers/query-provider.tsx:17:11)
    at IntlProvider (webpack-internal:///(app-pages-browser)/./node_modules/use-intl/dist/esm/development/react.js:24:3)
    at NextIntlClientProvider (webpack-internal:///(app-pages-browser)/./node_modules/next-intl/dist/esm/development/shared/NextIntlClientProvider.js:10:11)
    at NextIntlClientProviderServer (Server)
    at body
    at html
    at RootLayout (Server)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at DevRootNotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/dev-root-not-found-boundary.js:33:11)
    at ReactDevOverlay (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/ReactDevOverlay.js:87:9)
    at HotReload (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/hot-reloader-client.js:321:11)
    at Router (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:207:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at AppRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:585:13)
    at ServerRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:112:27)
    at Root (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:117:11) (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Warning: In HTML, %s cannot be a descendant of <%s>.
This will cause a hydration error.%s <a> a 
    at a
    at LinkComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/link.js:121:19)
    at div
    at div
    at div
    at _c8 (webpack-internal:///(app-pages-browser)/./src/components/ui/card.tsx:80:11)
    at div
    at _c (webpack-internal:///(app-pages-browser)/./src/components/ui/card.tsx:18:11)
    at a
    at LinkComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/link.js:121:19)
    at ProductCard (webpack-internal:///(app-pages-browser)/./src/app/marketplace/marketplace-content.tsx:1194:11)
    at div
    at MotionDOMComponent (webpack-internal:///(app-pages-browser)/./node_modules/framer-motion/dist/es/motion/index.mjs:62:65)
    at div
    at main
    at div
    at div
    at div
    at MarketplaceContent (webpack-internal:///(app-pages-browser)/./src/app/marketplace/marketplace-content.tsx:90:90)
    at MarketplacePage (Server)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at Suspense
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at Suspense
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at main
    at SessionProvider (webpack-internal:///(app-pages-browser)/./node_modules/next-auth/react/index.js:365:24)
    at AuthProvider (webpack-internal:///(app-pages-browser)/./src/components/providers/auth-provider.tsx:11:11)
    at QueryClientProvider (webpack-internal:///(app-pages-browser)/./node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js:27:11)
    at QueryProvider (webpack-internal:///(app-pages-browser)/./src/components/providers/query-provider.tsx:17:11)
    at IntlProvider (webpack-internal:///(app-pages-browser)/./node_modules/use-intl/dist/esm/development/react.js:24:3)
    at NextIntlClientProvider (webpack-internal:///(app-pages-browser)/./node_modules/next-intl/dist/esm/development/shared/NextIntlClientProvider.js:10:11)
    at NextIntlClientProviderServer (Server)
    at body
    at html
    at RootLayout (Server)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at DevRootNotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/dev-root-not-found-boundary.js:33:11)
    at ReactDevOverlay (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/ReactDevOverlay.js:87:9)
    at HotReload (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/hot-reloader-client.js:321:11)
    at Router (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:207:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at AppRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:585:13)
    at ServerRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:112:27)
    at Root (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:117:11) (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Warning: In HTML, %s cannot be a descendant of <%s>.
This will cause a hydration error.%s <a> a 
    at a
    at LinkComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/link.js:121:19)
    at div
    at div
    at div
    at _c8 (webpack-internal:///(app-pages-browser)/./src/components/ui/card.tsx:80:11)
    at div
    at _c (webpack-internal:///(app-pages-browser)/./src/components/ui/card.tsx:18:11)
    at a
    at LinkComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/link.js:121:19)
    at ProductCard (webpack-internal:///(app-pages-browser)/./src/app/marketplace/marketplace-content.tsx:1194:11)
    at div
    at MotionDOMComponent (webpack-internal:///(app-pages-browser)/./node_modules/framer-motion/dist/es/motion/index.mjs:62:65)
    at div
    at main
    at div
    at div
    at div
    at MarketplaceContent (webpack-internal:///(app-pages-browser)/./src/app/marketplace/marketplace-content.tsx:90:90)
    at MarketplacePage (Server)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at Suspense
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at Suspense
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at main
    at SessionProvider (webpack-internal:///(app-pages-browser)/./node_modules/next-auth/react/index.js:365:24)
    at AuthProvider (webpack-internal:///(app-pages-browser)/./src/components/providers/auth-provider.tsx:11:11)
    at QueryClientProvider (webpack-internal:///(app-pages-browser)/./node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js:27:11)
    at QueryProvider (webpack-internal:///(app-pages-browser)/./src/components/providers/query-provider.tsx:17:11)
    at IntlProvider (webpack-internal:///(app-pages-browser)/./node_modules/use-intl/dist/esm/development/react.js:24:3)
    at NextIntlClientProvider (webpack-internal:///(app-pages-browser)/./node_modules/next-intl/dist/esm/development/shared/NextIntlClientProvider.js:10:11)
    at NextIntlClientProviderServer (Server)
    at body
    at html
    at RootLayout (Server)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at DevRootNotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/dev-root-not-found-boundary.js:33:11)
    at ReactDevOverlay (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/ReactDevOverlay.js:87:9)
    at HotReload (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/hot-reloader-client.js:321:11)
    at Router (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:207:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at AppRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:585:13)
    at ServerRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:112:27)
    at Root (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:117:11) (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: net::ERR_INCOMPLETE_CHUNKED_ENCODING (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/7968baca-d877-49bc-bf0e-0ee5521d16e3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017
- **Test Name:** File upload validation and Cloudinary integration
- **Test Code:** [TC017_File_upload_validation_and_Cloudinary_integration.py](./TC017_File_upload_validation_and_Cloudinary_integration.py)
- **Test Error:** Stopped further actions due to persistent loading issue on the upload page. Unable to perform file upload validation and testing as required.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Warning: In HTML, %s cannot be a descendant of <%s>.
This will cause a hydration error.%s <a> a 
    at a
    at LinkComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/link.js:121:19)
    at div
    at div
    at div
    at _c8 (webpack-internal:///(app-pages-browser)/./src/components/ui/card.tsx:80:11)
    at div
    at _c (webpack-internal:///(app-pages-browser)/./src/components/ui/card.tsx:18:11)
    at a
    at LinkComponent (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/link.js:121:19)
    at ProductCard (webpack-internal:///(app-pages-browser)/./src/app/marketplace/marketplace-content.tsx:1194:11)
    at div
    at MotionDOMComponent (webpack-internal:///(app-pages-browser)/./node_modules/framer-motion/dist/es/motion/index.mjs:62:65)
    at div
    at main
    at div
    at div
    at div
    at MarketplaceContent (webpack-internal:///(app-pages-browser)/./src/app/marketplace/marketplace-content.tsx:90:90)
    at MarketplacePage (Server)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at Suspense
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at InnerLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:243:11)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at Suspense
    at LoadingBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:349:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at InnerScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:153:9)
    at ScrollAndFocusHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:228:11)
    at RenderFromTemplateContext (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js:16:44)
    at OuterLayoutRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js:370:11)
    at main
    at SessionProvider (webpack-internal:///(app-pages-browser)/./node_modules/next-auth/react/index.js:365:24)
    at AuthProvider (webpack-internal:///(app-pages-browser)/./src/components/providers/auth-provider.tsx:11:11)
    at QueryClientProvider (webpack-internal:///(app-pages-browser)/./node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js:27:11)
    at QueryProvider (webpack-internal:///(app-pages-browser)/./src/components/providers/query-provider.tsx:17:11)
    at IntlProvider (webpack-internal:///(app-pages-browser)/./node_modules/use-intl/dist/esm/development/react.js:24:3)
    at NextIntlClientProvider (webpack-internal:///(app-pages-browser)/./node_modules/next-intl/dist/esm/development/shared/NextIntlClientProvider.js:10:11)
    at NextIntlClientProviderServer (Server)
    at body
    at html
    at RootLayout (Server)
    at RedirectErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:74:9)
    at RedirectBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/redirect-boundary.js:82:11)
    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:76:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/not-found-boundary.js:84:11)
    at DevRootNotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/dev-root-not-found-boundary.js:33:11)
    at ReactDevOverlay (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/ReactDevOverlay.js:87:9)
    at HotReload (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/react-dev-overlay/app/hot-reloader-client.js:321:11)
    at Router (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:207:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:113:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/error-boundary.js:160:11)
    at AppRouter (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/components/app-router.js:585:13)
    at ServerRoot (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:112:27)
    at Root (webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:117:11) (at webpack-internal:///(app-pages-browser)/./node_modules/next/dist/client/app-index.js:32:21)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/ece2c459-9e08-4ee6-bc1e-5af9f4091d3b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018
- **Test Name:** Search autocomplete and popular suggestions
- **Test Code:** [TC018_Search_autocomplete_and_popular_suggestions.py](./TC018_Search_autocomplete_and_popular_suggestions.py)
- **Test Error:** The search input field required for testing autocomplete suggestions and popular searches is not accessible or visible on the platform homepage or login page. Testing cannot proceed without this functionality. Please fix the search input visibility or accessibility issue.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/3fe03954-46d5-4942-8163-3ecbc2328367
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019
- **Test Name:** Error handling and user messages on API failures
- **Test Code:** [TC019_Error_handling_and_user_messages_on_API_failures.py](./TC019_Error_handling_and_user_messages_on_API_failures.py)
- **Test Error:** Completed simulation of failures in key APIs. Issues found: 1) No user-friendly error message on login API failure. 2) Missing checkout page for payment API failure simulation. 3) No fallback UI or error message on product listing API failure. Task stopped due to these blockers.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/auth/callback/credentials:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 404 (Not Found) (at http://localhost:3000/checkout:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/1e888389-129e-4c6f-bd38-28449721c0b1
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC020
- **Test Name:** Seller analytics dashboard data accuracy
- **Test Code:** [TC020_Seller_analytics_dashboard_data_accuracy.py](./TC020_Seller_analytics_dashboard_data_accuracy.py)
- **Test Error:** Login attempts as seller failed using both email/password and GitHub login methods. The page remains on the login form with error messages indicating incorrect credentials. Without successful login, it is impossible to access the seller dashboard and verify sales analytics. Reporting this issue and stopping further testing until login issues are resolved.
Browser Console Logs:
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/auth/callback/credentials:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=1&unreadOnly=false:0:0)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) (at http://localhost:3000/api/notifications?page=1&limit=10&unreadOnly=false:0:0)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/5fe45f74-e122-4c71-aa49-bdf8de4fa4b8/8502091f-9c6a-4f74-8b35-3d557fc1d574
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **20.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---