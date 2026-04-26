/**
 * HTTP API Endpoints
 * Constantes para los endpoints del backend Django REST Framework
 */
export class HttpApi {
  // ========================================
  // AUTH & SECURITY
  // ========================================
  static authLogin = 'auth/login/';
  static authLogout = 'auth/logout/';
  static authMe = 'auth/me/';
  static authMenu = 'auth/menu/';
  static authUsers = 'auth/users/';
  static authRoles = 'auth/roles/';
  static authResources = 'auth/resources/';
  static authPermissions = 'auth/permissions/';

  // ========================================
  // CATALOG
  // ========================================
  static catalogCategories = 'catalog/categories/';
  static catalogCategoriesRoot = 'catalog/categories/root/';
  static catalogAttributes = 'catalog/attributes/';
  static catalogProducts = 'catalog/products/';
  static catalogProductsFeatured = 'catalog/products/featured/';

  // ========================================
  // INVENTORY
  // ========================================
  static inventoryWarehouses = 'inventory/warehouses/';
  static inventoryInventory = 'inventory/inventory/';

  // ========================================
  // SALES
  // ========================================
  static salesCustomers = 'sales/customers/';
  static salesAddresses = 'sales/addresses/';
  static salesCarts = 'sales/carts/';
  static salesOrders = 'sales/orders/';

  // ========================================
  // ANALYTICS
  // ========================================
  static analyticsSales = 'analytics/sales/';
  static analyticsSalesDashboard = 'analytics/sales/dashboard/';
  static analyticsSalesGenerateReport = 'analytics/sales/generate_report/';
  static analyticsForecasts = 'analytics/forecasts/';
  static analyticsReports = 'analytics/reports/';

  // ========================================
  // SYSTEM
  // ========================================
  static healthCheck = 'healthz/';
  static apiSchema = 'schema/';
}

