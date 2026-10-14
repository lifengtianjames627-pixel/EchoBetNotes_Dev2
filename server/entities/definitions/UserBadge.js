export default {
  "name": "UserBadge",
  "policy": {
    "read": "public",
    "create": "authenticated",
    "update": "admin",
    "delete": "ownerOrAdmin"
  }
};
