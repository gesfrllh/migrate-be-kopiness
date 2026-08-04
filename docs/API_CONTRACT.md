# API Contract

Base URL: `/api`. Authenticated routes use encrypted `access_token` HTTP-only cookie set by `POST /auth/login`. Browser writes with this cookie require allowed `Origin`. All request DTOs reject unknown fields.

Roles: `SUPERADMIN`, `STOREOWNER`, `CUSTOMER`, `COURIER`.

| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/` | Public | Health/app response |
| POST | `/auth/register` | Public | Create `CUSTOMER` |
| POST | `/auth/login` | Public | Sets `access_token` cookie |
| POST | `/auth/logout` | Public | Clears cookie |
| POST | `/auth/storeowners` | SUPERADMIN | Create owner, optional store |
| POST | `/auth/couriers` | SUPERADMIN | Create courier |
| GET | `/auth/users` | SUPERADMIN | List users |
| GET | `/auth/couriers` | SUPERADMIN, STOREOWNER | List couriers |
| GET | `/auth/google` | Public | OAuth redirect |
| GET | `/auth/google/callback` | Public | OAuth callback |
| GET | `/auth/me` | JWT | Current session user |
| POST | `/auth/forgot-password` | Public | Request reset |
| POST | `/auth/reset-password` | Public | Reset password |
| GET | `/stores` | Public | Optional `lat`, `lng` |
| GET | `/stores/mine` | STOREOWNER | Owner stores; literal route |
| GET | `/stores/:slug` | Public | Optional `lat`, `lng` |
| POST | `/stores` | STOREOWNER | Create store |
| PATCH | `/stores/:id` | STOREOWNER | Update owned store |
| DELETE | `/stores/:id` | STOREOWNER | Delete/deactivate owned store |
| GET | `/products` | JWT | Optional pagination/search query |
| POST | `/products` | SUPERADMIN, STOREOWNER | Create product |
| GET | `/products/:id` | JWT | Product detail |
| PATCH | `/products/:id` | SUPERADMIN, STOREOWNER | Update product |
| DELETE | `/products/:id` | SUPERADMIN, STOREOWNER | Delete product |
| GET | `/cart` | JWT | Current cart |
| POST | `/cart/items` | JWT | Add item |
| PATCH | `/cart/items/:productId` | JWT | Update quantity |
| DELETE | `/cart/items/:productId` | JWT | Remove item |
| DELETE | `/cart` | JWT | Clear cart |
| POST | `/transactions` | CUSTOMER | Create from cart |
| GET | `/transactions` | SUPERADMIN, STOREOWNER | Cashier queue |
| POST | `/transactions/payment` | SUPERADMIN, STOREOWNER | Pay multiple |
| POST | `/transactions/history` | CUSTOMER, SUPERADMIN | History query in body |
| POST | `/transactions/:id/cancel` | JWT | Cancel transaction |
| GET | `/transactions/admin/summary` | SUPERADMIN | Admin summary |
| GET | `/transactions/store/orders` | STOREOWNER | Optional `page`, `limit`, `status` |
| GET | `/transactions/courier/orders` | COURIER | Assigned orders |
| GET | `/transactions/:id` | JWT | Detail |
| PATCH | `/transactions/:id/status` | STOREOWNER, COURIER | Update status |
| PATCH | `/transactions/:id/courier` | STOREOWNER | Assign courier |
| PATCH | `/transactions/:id/courier-location` | COURIER | Update location |
| GET | `/transactions/:id/tracking` | JWT | Tracking timeline |
| GET | `/payment-methods` | JWT | List payment methods |
| GET | `/payment-methods/:id` | JWT | Payment method detail |
| POST | `/file/upload` | JWT | Multipart field: `file` |
| POST | `/coffee-assistant/generate` | JWT | Local brew guide |
| GET | `/coffee-assistant/options` | JWT | Brew form options |
| POST | `/ai/coffe-assistant` | JWT | Validated AI adjustment; max 5/minute/client; provider timeout default 10s |
| GET | `/dashboard/overview` | SUPERADMIN, STOREOWNER | Dashboard overview |
| POST | `/chats` | JWT | Create chat |
| GET | `/chats` | JWT | List chats |
| GET | `/chats/:id` | JWT | Chat detail |
| POST | `/chats/:id/messages` | JWT | Send message |
| POST | `/chats/:id/typing` | JWT | Typing event |
| PATCH | `/chats/:id/messages/:messageId/read` | JWT | Mark read |
| DELETE | `/chats/:id` | JWT | Delete chat |
