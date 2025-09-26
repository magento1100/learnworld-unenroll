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
      console.log(`LearnWorlds API: Attempting to unenroll ${email} from ${productType} ${productId}`);
      console.log(`API Request: DELETE /users/${encodeURIComponent(email)}/enrollment`);
      console.log(`Request data:`, { productId, productType });
      console.log(`API Config:`, { baseURL: this.config.baseURL, clientId: this.config.clientId });
      
      const response = await this.client.delete(`/users/${encodeURIComponent(email)}/enrollment`, {
        data: { productId, productType }
      });
      
      console.log(`LearnWorlds API: Unenrollment successful`, response.data);
      return response.data;
    } catch (error) {
      console.error(`LearnWorlds API Error:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        // Check if user is enrolled first
        try {
          const userProducts = await this.getUserProducts(email);
          const isEnrolled = userProducts?.data?.some(p => 
            p.id === productId || p.productId === productId
          );
          
          if (!isEnrolled) {
            console.log(`User ${email} is not enrolled in ${productType} ${productId}`);
            return { 
              success: true, 
              message: 'User not enrolled in this product',
              alreadyUnenrolled: true 
            };
          }
        } catch (checkError) {
          console.log(`Could not verify enrollment status: ${checkError.message}`);
        }
        
        throw new Error(`LearnWorlds API endpoint not found. User may not exist or endpoint is incorrect.`);
      }
      
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