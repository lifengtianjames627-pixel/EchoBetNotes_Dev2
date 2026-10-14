export default {
  "name": "User",
  "policy": {
    "read": "selfOrAdmin",
    "create": "functionOnly",
    "update": "selfOrAdmin",
    "delete": "admin"
  }
};
