# Xeno Shopify Insights

A multi-tenant Shopify Data Ingestion & Insights Service that helps enterprise retailers onboard, integrate, and analyze their customer data.

![Dashboard Preview](docs/dashboard-preview.png)

## 🚀 Features

- **Multi-tenant Architecture**: Isolated data for each Shopify store with tenant identifiers
- **Shopify Data Ingestion**: Sync customers, orders, and products from Shopify stores
- **Real-time Webhooks**: Receive instant updates when data changes in Shopify
- **Scheduled Sync**: Automatic data synchronization every 6 hours
- **Analytics Dashboard**: Beautiful visualizations for business insights
- **Email Authentication**: Secure login system for tenant onboarding
- **Date Filtering**: Filter orders and revenue by custom date ranges

## 📊 Dashboard Metrics

- Total customers, orders, and revenue
- Orders by date with date range filtering
- Top 5 customers by spend
- Monthly trends (orders & revenue)
- Fulfillment status distribution
- Payment status breakdown

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: Next.js 14 + React
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Authentication**: JWT tokens

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database (or Prisma Postgres)
- Shopify Partner account with a development store
- Shopify Admin API access token

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/xeno-shopify-insights.git
cd xeno-shopify-insights
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# Shopify Configuration (Default store - can be overridden per tenant)
SHOPIFY_STORE_URL="your-store.myshopify.com"
SHOPIFY_ACCESS_TOKEN="shpat_xxxxx"
SHOPIFY_API_VERSION="2024-01"

# JWT Secret for Authentication
JWT_SECRET="your-super-secret-jwt-key"

# NextAuth Configuration
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Backend Configuration
BACKEND_PORT=5000
FRONTEND_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

### 4. Set Up Database

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 5. Run the Application

```bash
# Development mode (runs both frontend and backend)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
│                    (Next.js Frontend)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express.js Backend                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Auth API   │  │  Sync API   │  │    Analytics API        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Webhooks    │  │ Scheduler   │  │    Shopify Service      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                          │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Tenants │ │ Customers│ │ Orders │ │ Products │ │ SyncLogs │ │
│  └─────────┘ └──────────┘ └────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Shopify Admin API                            │
│           (Customers, Orders, Products endpoints)                │
└─────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
xeno-shopify-insights/
├── backend/
│   ├── lib/
│   │   └── prisma.js         # Prisma client instance
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── analytics.js      # Dashboard analytics
│   │   ├── customers.js      # Customer management
│   │   ├── orders.js         # Order management
│   │   ├── products.js       # Product management
│   │   ├── sync.js           # Data sync endpoints
│   │   └── webhooks.js       # Shopify webhooks
│   ├── services/
│   │   ├── shopify.js        # Shopify API service
│   │   └── sync.js           # Data sync service
│   ├── jobs/
│   │   └── scheduler.js      # Cron job scheduler
│   └── server.js             # Express server entry
├── src/
│   ├── app/
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── login/            # Login page
│   │   └── register/         # Registration page
│   ├── components/           # React components
│   ├── context/              # React context providers
│   ├── lib/                  # API utilities
│   └── styles/               # Global styles
├── prisma/
│   └── schema.prisma         # Database schema
├── .env                      # Environment variables
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new tenant & user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user |

### Data Sync
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sync/all` | Sync all data from Shopify |
| POST | `/api/sync/customers` | Sync customers only |
| POST | `/api/sync/orders` | Sync orders only |
| POST | `/api/sync/products` | Sync products only |
| GET | `/api/sync/logs` | Get sync history |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Dashboard stats |
| GET | `/api/analytics/orders-by-date` | Orders grouped by date |
| GET | `/api/analytics/top-customers` | Top spending customers |
| GET | `/api/analytics/monthly-trends` | Monthly trends |

### Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List customers |
| GET | `/api/customers/:id` | Get customer details |
| GET | `/api/orders` | List orders |
| GET | `/api/orders/:id` | Get order details |
| GET | `/api/products` | List products |
| GET | `/api/products/:id` | Get product details |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/customers/create` | Customer created/updated |
| POST | `/api/webhooks/orders/create` | Order created |
| POST | `/api/webhooks/products/create` | Product created/updated |
| POST | `/api/webhooks/events` | Custom events tracking |

## 📊 Database Schema

### Tenant (Multi-tenancy)
```sql
- id: UUID (Primary Key)
- name: String
- shopifyStoreUrl: String (Unique)
- shopifyAccessToken: String
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

### Customer
```sql
- id: UUID (Primary Key)
- shopifyCustomerId: String
- email: String
- firstName: String
- lastName: String
- phone: String
- ordersCount: Integer
- totalSpent: Decimal
- tenantId: UUID (Foreign Key)
```

### Order
```sql
- id: UUID (Primary Key)
- shopifyOrderId: String
- orderNumber: String
- email: String
- financialStatus: String
- fulfillmentStatus: String
- totalPrice: Decimal
- currency: String
- customerId: UUID (Foreign Key)
- tenantId: UUID (Foreign Key)
```

### Product
```sql
- id: UUID (Primary Key)
- shopifyProductId: String
- title: String
- description: Text
- vendor: String
- price: Decimal
- inventoryQuantity: Integer
- status: String
- tenantId: UUID (Foreign Key)
```

## 🔐 Shopify App Setup

1. Go to your Shopify Partner Dashboard
2. Create a new app or use existing development app
3. Configure the required scopes:
   - `read_customers`
   - `read_orders`
   - `read_products`
4. Generate Admin API access token
5. Copy the token to your `.env` file

### Webhook Configuration (Optional)

In your Shopify app settings, configure webhooks pointing to:
- `https://your-domain.com/api/webhooks/customers/create`
- `https://your-domain.com/api/webhooks/orders/create`
- `https://your-domain.com/api/webhooks/products/create`

## 🚀 Deployment

### Deploy to Vercel (Frontend)

```bash
npm run build
vercel deploy
```

### Deploy to Railway/Render (Backend)

1. Connect your GitHub repository
2. Set environment variables
3. Deploy

## 📝 Known Limitations

- Shopify API rate limits (2 requests/second for standard plan)
- Webhook signature verification disabled in development
- No real-time sync - scheduled every 6 hours (configurable)
- Single database connection pool

## 🔮 Next Steps to Productionize

1. **Security**
   - Enable webhook signature verification
   - Implement rate limiting
   - Add CORS restrictions
   - Use HTTPS everywhere

2. **Scalability**
   - Add Redis for caching
   - Implement message queues (RabbitMQ/SQS) for async processing
   - Database connection pooling
   - Horizontal scaling with load balancer

3. **Monitoring**
   - Add logging (Winston/Pino)
   - Set up error tracking (Sentry)
   - Performance monitoring (New Relic/DataDog)
   - Health check endpoints

4. **Features**
   - Real-time updates with WebSockets
   - Export data to CSV/Excel
   - Email notifications
   - Custom event tracking (cart abandoned, etc.)
   - Multi-currency support

## 📄 License

MIT License

## 👨‍💻 Author

Built for Xeno FDE Internship Assignment 2025
