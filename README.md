# WallVerse Backend

Backend API for **WallVerse**, a full-stack wallpaper platform with Flutter mobile and Next.js web applications.

Built with **NestJS, TypeScript, PostgreSQL, and Prisma**, the backend handles authentication, wallpapers, favourites, likes, community uploads, AI wallpaper generation, media storage, pagination, rate limiting, and client-specific API endpoints.

---

## 🚀 Features

* 🔐 JWT authentication with access and refresh tokens
* 🖼️ Wallpaper search and browsing using the Pexels API
* 📱 Dedicated mobile API endpoints
* ❤️ Wallpaper likes
* 🔖 User favourites
* 👥 Community wallpaper uploads
* 🗑️ Delete uploaded wallpapers
* 👤 User profiles and personalized data
* ☁️ Cloudinary image storage
* 🔍 SHA-256 image hashing for duplicate upload prevention
* 🤖 AI wallpaper generation using the Pollinations API
* 📄 Pagination
* 🛡️ API rate limiting / throttling
* 📚 Swagger / OpenAPI documentation
* 🗄️ PostgreSQL database with Prisma ORM

---

## 🏗️ Architecture

Flutter Mobile App ───────┐
                          │
                          ▼
                    NestJS REST API
                          │
          ┌───────────────┼────────────────┐
          │               │                │
       Auth &          Services &       Controllers
       Users           Business Logic       │
          │               │                 │
          └───────────────┼─────────────────┘
                          │
                       Prisma
                          │
                          ▼
                    PostgreSQL

External Services:
├── Pexels API
├── Cloudinary
└── Pollinations API


## 📱 Mobile API

The backend provides a dedicated set of **mobile-specific endpoints** under the `/mobile` route prefix.

These endpoints are designed specifically for the Flutter application and keep mobile client operations separated from the general API structure.

Examples include:


/mobile/wallpaper
/mobile/community
/mobile/favourite
/mobile/wallpaper/generate
/mobile/...


This separation allows the mobile application to use client-specific endpoints and response handling without tightly coupling the Flutter app to the web API structure.

---

## 🔐 Authentication

WallVerse uses JWT-based authentication with access and refresh tokens.

### Authentication flow


Login / Register
       ↓
Backend validates credentials
       ↓
Access + Refresh Tokens
       ↓
Mobile/Web stores tokens
       ↓
Access token used for API requests
       ↓
Access token expires
       ↓
Refresh endpoint
       ↓
New access token


Protected endpoints use authenticated user information to provide personalized data such as favourites, likes, uploads, and profile information.

---

## 🖼️ Wallpaper System

The backend integrates the **Pexels API** for wallpaper discovery.

Supported functionality includes:

* Search wallpapers
* Paginated results
* Wallpaper metadata
* User-specific favourite state
* Mobile-specific wallpaper endpoints

The backend also processes wallpaper-related requests for both the Flutter mobile application and Next.js web application.

---

## 👥 Community System

Authenticated users can contribute wallpapers to the WallVerse community.

Features include:

* Upload wallpapers
* Store images using Cloudinary
* Like community wallpapers
* Favourite community wallpapers
* Delete owned uploads
* View community wallpapers
* User-specific `isLiked` and `isFavourite` states
* User profile information

Example community response data:


{
  "id": 12,
  "userId": 6,
  "userName": "User",
  "imageUrl": "...",
  "likes": 10,
  "isLiked": true,
  "isFavourite": false
}

## 🔍 Duplicate Upload Prevention

WallVerse uses **SHA-256 hashing** to prevent duplicate image uploads.


Image Upload
     ↓
Generate SHA-256 hash
     ↓
Check existing imageHash
     ↓
Already exists?
   ↙        ↘
 YES        NO
  ↓          ↓
409       Continue
Conflict    Upload


The generated hash is stored in the database with the uploaded wallpaper.

This prevents the same image from being uploaded multiple times.

---

## ❤️ Like System

Likes are stored as relationships between users and wallpapers.

The database uses a composite unique constraint:


@@unique([userId, postId])


This prevents duplicate likes for the same user and wallpaper, including duplicate records caused by concurrent requests.

---

## 🤖 AI Wallpaper Generation

WallVerse integrates the **Pollinations API** for prompt-based AI wallpaper generation.

Users can provide a prompt and request an AI-generated wallpaper.

The platform also supports plan-based generation limits.


FREE
PRO
PREMIUM


The generated image is returned through the backend to the client application.

---

## ☁️ Media Storage

Uploaded community wallpapers are stored using **Cloudinary**.


Client
  ↓
NestJS Backend
  ↓
Validate Upload
  ↓
Generate SHA-256 Hash
  ↓
Check Duplicate
  ↓
Cloudinary
  ↓
Store Image URL + Metadata
  ↓
PostgreSQL


---

## 📄 Pagination

Wallpaper and community APIs support pagination to avoid loading large datasets in a single request.

Typical request parameters include:

?page=1&perPage=16

Pagination is used across the mobile and web clients where applicable.

---

## 🛡️ Rate Limiting

The backend uses request throttling to help protect API endpoints from excessive requests.

This provides an additional layer of protection for authentication and other API operations.

---

## ⚠️ Error Handling

The API uses appropriate HTTP status codes for different failure scenarios.

| Status | Meaning               |
| ------ | --------------------- |
| `400`  | Bad Request           |
| `401`  | Unauthorized          |
| `404`  | Resource Not Found    |
| `409`  | Conflict / Duplicate  |
| `429`  | Too Many Requests     |
| `500`  | Internal Server Error |

For example, attempting to upload an image that already exists can result in a `409 Conflict`.

---

## 📚 API Documentation

Swagger / OpenAPI documentation is available through the backend API.

When running locally:


http://localhost:3001/api


---

## 🗄️ Database

The project uses:

* PostgreSQL
* Prisma ORM

The database manages entities such as:

* Users
* Uploaded wallpapers
* Likes
* Favourites
* Authentication-related data

Relationships are enforced using Prisma schema constraints and database-level uniqueness where required.

---

## 🔗 API Integrations

### Pexels

Used for wallpaper discovery and search.

### Cloudinary

Used for storing community-uploaded wallpaper images.

### Pollinations

Used for AI-generated wallpapers from user prompts.

---

## 🛠️ Tech Stack

| Technology       | Purpose              |
| ---------------- | -------------------- |
| NestJS           | Backend framework    |
| TypeScript       | Programming language |
| Prisma           | ORM                  |
| PostgreSQL       | Database             |
| JWT              | Authentication       |
| Cloudinary       | Image storage        |
| Pexels API       | Wallpaper discovery  |
| Pollinations API | AI image generation  |
| Swagger          | API documentation    |
| Render           | Backend deployment   |

---

## 📁 Project Structure

src/
├── auth/
├── users/
├── wallpaper/
├── favourites/
├── likes/
├── community/
├── ai/
└── ...


The backend is organized into feature-based modules to keep authentication, wallpaper operations, community functionality, and other business logic separated.

---

## ⚙️ Getting Started

### 1. Clone the repository


git clone https://github.com/Prakash777-code/WallVerse-Backend.git
cd WallVerse-Backend


### 2. Install dependencies


npm install


### 3. Configure environment variables

Create a `.env` file with the required database, authentication, Cloudinary, and external API configuration.

Example:


DATABASE_URL=your_database_url

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

PEXELS_API_KEY=your_pexels_key


### 4. Generate Prisma Client


npx prisma generate


### 5. Run the development server


npm run start:dev


The API will run on:


http://localhost:3001


---

## 🔗 Related Repositories

### Flutter Mobile App

https://github.com/Prakash777-code/WallverseApp

### Next.js Web App

https://github.com/Prakash777-code/Wallpaper

### Live Web Application

https://wallverse-eight.vercel.app/

---

## 📖 What I Learned

Building the WallVerse backend helped me gain practical experience with:

* Designing REST APIs with NestJS
* JWT authentication and refresh-token flows
* Prisma and PostgreSQL relationships
* Database constraints
* Pagination
* File uploads and Cloudinary
* SHA-256 hashing for duplicate detection
* Third-party API integration
* Mobile-specific API design
* Rate limiting
* API documentation with Swagger
* Deploying backend services with Render
* Connecting multiple clients to a shared backend

---

## 📄 License

This project was built for learning and portfolio purposes.
