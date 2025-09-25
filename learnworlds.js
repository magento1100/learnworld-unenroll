const axios = require('axios');
const { learnworldsConfig } = require('./config');

class LearnWorldsAPI {
  constructor(config = learnworldsConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${config.authToken}`,
        'Lw-Client': config.clientId,
        'Content-Type': 'application/json'
      }
    });
  }

  // Get user by email
  async getUser(email) {
    try {
      const response = await this.client.get(`/users/${encodeURIComponent(email)}?include_suspended=true`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // User not found
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Get user's assigned courses
  async getUserCourses(email) {
    try {
      const response = await this.client.get(`/users/${encodeURIComponent(email)}/courses`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user courses: ${error.message}`);
    }
  }

  // Get user's products (courses/bundles)
  async getUserProducts(email) {
    try {
      const response = await this.client.get(`/users/${encodeURIComponent(email)}/products`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user products: ${error.message}`);
    }
  }

  // Unenroll user from a product
  async unenrollUser(email, productId, productType) {
    try {
      const response = await this.client.delete(`/users/${encodeURIComponent(email)}/enrollment`, {
        data: { productId, productType }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to unenroll user: ${error.message}`);
    }
  }

  // Enroll user in a product
  async enrollUser(email, productId, productType, price = 0, sendEmail = true) {
    try {
      const data = {
        productId,
        productType,
        justification: 'Shopify order enrollment',
        price,
        send_enrollment_email: sendEmail
      };
      const response = await this.client.post(`/users/${encodeURIComponent(email)}/enrollment`, data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to enroll user: ${error.message}`);
    }
  }

  // Get all courses (for admin interface)
  async getAllCourses() {
    try {
      const response = await this.client.get('/courses');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get courses: ${error.message}`);
    }
  }

  // Get all bundles (for admin interface)
  async getAllBundles() {
    try {
      const response = await this.client.get('/bundles');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get bundles: ${error.message}`);
    }
  }

  // Bulk unenroll users from multiple products
  async bulkUnenrollUsers(unenrollments) {
    const results = [];
    for (const enrollment of unenrollments) {
      try {
        const result = await this.unenrollUser(
          enrollment.email,
          enrollment.productId,
          enrollment.productType
        );
        results.push({
          success: true,
          email: enrollment.email,
          productId: enrollment.productId,
          result
        });
      } catch (error) {
        results.push({
          success: false,
          email: enrollment.email,
          productId: enrollment.productId,
          error: error.message
        });
      }
    }
    return results;
  }
}

module.exports = LearnWorldsAPI;