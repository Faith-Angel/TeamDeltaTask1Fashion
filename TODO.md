# Integration Progress

## Part 1: apiClient.ts — Mock Removal & Response Shape Fixes ✅
- [x] `designersApi.getDesigners` → `{ designers }` 
- [x] `designersApi.getDesigner` → `{ designer }`
- [x] `designersApi.toggleAvailability` → PATCH `/designers/:id/availability`
- [x] `marketplaceApi.getListings` → `{ listings }`
- [x] `marketplaceApi.getListing` → `{ listing }`
- [x] `ordersApi.createOrder` → `{ order }`
- [x] `ordersApi.getOrders` → `{ orders }`
- [x] `ordersApi.getOrder` → `{ order }`
- [x] `ordersApi.updateDeliveryStatus` → body `{ deliveryStatus }`
- [x] `paymentsApi.initiatePayment` → `{ clientSecret, transactionId }`
- [x] `notificationsApi.getNotifications` → `{ notifications, unreadCount }`
- [x] `notificationsApi.markRead` → PATCH `/notifications/:id/read`
- [x] `appointmentsApi.getAppointments` → `{ appointments }`, URL `/designers/:id/appointments`
- [x] `appointmentsApi.updateAppointmentStatus` → PATCH `/appointments/:id`
- [x] `marketersApi.getMarketers` → `{ marketers }`
- [x] `marketersApi.createBooking` → `{ booking }`
- [x] `marketersApi.respondToBooking` → signature: `decision: 'accept'|'decline'`, body `{ decision }`
- [x] `vendorApi.createListing` → `{ listing }`
- [x] `vendorApi.getVendorListings` → `{ listings }`
- [x] `vendorApi.getVendorOrders` → `{ orders }`
- [x] Keep `chatApi`, `trainingApi`, `plannerApi`, `collaborationsApi` mocked

## Part 2: respondToBooking Caller Update ✅
- [x] `app/(marketer)/marketer/bookings/page.tsx` → mutationFn uses `decision: 'accept'|'decline'`, buttons pass correct values

## Part 3: ML Proxy Routes ✅
- [x] `app/api/ml/style-chat/route.ts` — POST proxy with X-API-Key header, error handling
- [x] `app/api/ml/similar-search/route.ts` — POST proxy with X-API-Key header, error handling

## Part 4: mlApi in apiClient.ts ✅
- [x] `mlApi.styleChat()` — POST to `/api/ml/style-chat` with USE_MOCKS fallback
- [x] `mlApi.similarSearch()` — POST to `/api/ml/similar-search` with USE_MOCKS fallback

## Part 5: Frontend ML Wiring ✅
- [x] `src/hooks/useFeed.ts` — `useOutfitGenerator` uses `mlApi.styleChat()` instead of `feedApi.generateOutfit()`
- [x] `app/(client)/feed/page.tsx` — AIOutfitModal displays `reply` field from style chat response
