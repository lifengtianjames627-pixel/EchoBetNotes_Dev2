export default {
  "name": "Band",
  "policy": {
    "read": "public",
    "create": "authenticated",
    "update": "ownerOrAdmin",
    "delete": "ownerOrAdmin"
  }
};
