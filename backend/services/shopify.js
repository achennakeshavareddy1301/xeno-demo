const axios = require('axios');

class ShopifyService {
  constructor(storeUrl, accessToken, apiVersion = '2024-01') {
    this.storeUrl = storeUrl.replace('https://', '').replace('http://', '').replace(/\/$/, '');
    this.accessToken = accessToken;
    this.apiVersion = apiVersion;
    this.baseUrl = `https://${this.storeUrl}/admin/api/${this.apiVersion}`;
  }

  getHeaders() {
    return {
      'X-Shopify-Access-Token': this.accessToken,
      'Content-Type': 'application/json',
    };
  }

  async fetchAllPages(endpoint, resourceKey) {
    let allData = [];
    let url = `${this.baseUrl}/${endpoint}`;
    
    while (url) {
      try {
        const response = await axios.get(url, { headers: this.getHeaders() });
        const data = response.data[resourceKey] || [];
        allData = allData.concat(data);
        
        // Check for pagination
        const linkHeader = response.headers['link'];
        url = this.getNextPageUrl(linkHeader);
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error.message);
        throw error;
      }
    }
    
    return allData;
  }

  getNextPageUrl(linkHeader) {
    if (!linkHeader) return null;
    
    const links = linkHeader.split(',');
    for (const link of links) {
      const match = link.match(/<([^>]+)>;\s*rel="next"/);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  // Fetch all customers
  async getCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `customers.json?${queryString}` : 'customers.json?limit=250';
    return this.fetchAllPages(endpoint, 'customers');
  }

  // Fetch all orders
  async getOrders(params = {}) {
    const defaultParams = { status: 'any', limit: 250, ...params };
    const queryString = new URLSearchParams(defaultParams).toString();
    const endpoint = `orders.json?${queryString}`;
    return this.fetchAllPages(endpoint, 'orders');
  }

  // Fetch all draft orders
  async getDraftOrders(params = {}) {
    const queryString = new URLSearchParams({ limit: 250, ...params }).toString();
    const endpoint = `draft_orders.json?${queryString}`;
    return this.fetchAllPages(endpoint, 'draft_orders');
  }

  // Fetch all products
  async getProducts(params = {}) {
    const queryString = new URLSearchParams({ limit: 250, ...params }).toString();
    const endpoint = `products.json?${queryString}`;
    return this.fetchAllPages(endpoint, 'products');
  }

  // Fetch single customer
  async getCustomer(customerId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/customers/${customerId}.json`,
        { headers: this.getHeaders() }
      );
      return response.data.customer;
    } catch (error) {
      console.error(`Error fetching customer ${customerId}:`, error.message);
      throw error;
    }
  }

  // Fetch single order
  async getOrder(orderId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/orders/${orderId}.json`,
        { headers: this.getHeaders() }
      );
      return response.data.order;
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error.message);
      throw error;
    }
  }

  // Fetch single product
  async getProduct(productId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/products/${productId}.json`,
        { headers: this.getHeaders() }
      );
      return response.data.product;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error.message);
      throw error;
    }
  }

  // Fetch shop info
  async getShopInfo() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/shop.json`,
        { headers: this.getHeaders() }
      );
      return response.data.shop;
    } catch (error) {
      console.error('Error fetching shop info:', error.message);
      throw error;
    }
  }

  // Count resources
  async getCustomersCount() {
    const response = await axios.get(
      `${this.baseUrl}/customers/count.json`,
      { headers: this.getHeaders() }
    );
    return response.data.count;
  }

  async getOrdersCount(params = {}) {
    const queryString = new URLSearchParams({ status: 'any', ...params }).toString();
    const response = await axios.get(
      `${this.baseUrl}/orders/count.json?${queryString}`,
      { headers: this.getHeaders() }
    );
    return response.data.count;
  }

  async getProductsCount() {
    const response = await axios.get(
      `${this.baseUrl}/products/count.json`,
      { headers: this.getHeaders() }
    );
    return response.data.count;
  }

  async getDraftOrdersCount() {
    const response = await axios.get(
      `${this.baseUrl}/draft_orders/count.json`,
      { headers: this.getHeaders() }
    );
    return response.data.count;
  }
}

module.exports = ShopifyService;
