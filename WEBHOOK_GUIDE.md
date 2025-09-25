# Shopify Webhook Configuration Guide

## 🎯 Your App's Webhook Endpoints

Your Shopify-LearnWorlds integration app automatically registers these webhooks:

### 📋 **Available Webhook Endpoints:**

1. **Order Refunded** 
   - **Topic**: `orders/refunded`
   - **Endpoint**: `POST https://your-app.vercel.app/webhooks/orders/refunded`
   - **Purpose**: Unenroll users when orders are fully refunded

2. **Order Partially Refunded**
   - **Topic**: `orders/partially_refunded` 
   - **Endpoint**: `POST https://your-app.vercel.app/webhooks/orders/partially_refunded`
   - **Purpose**: Handle partial refunds (configurable behavior)

3. **Order Cancelled**
   - **Topic**: `orders/cancelled`
   - **Endpoint**: `POST https://your-app.vercel.app/webhooks/orders/cancelled` 
   - **Purpose**: Unenroll users when orders are cancelled

## 🔗 **Webhook URLs for Your Production App:**

Once deployed to Vercel, your webhook URLs will be:
```
https://your-app.vercel.app/webhooks/orders/refunded
https://your-app.vercel.app/webhooks/orders/partially_refunded
https://your-app.vercel.app/webhooks/orders/cancelled
```

Replace `your-app.vercel.app` with your actual Vercel domain.

## ⚙️ **How Webhooks Are Registered:**

Your app automatically registers these webhooks during the Shopify app installation process in the `registerWebhooks()` function in **<mcfile name=