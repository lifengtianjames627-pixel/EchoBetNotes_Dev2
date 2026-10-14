export default {
  "name": "Album",
  "policy": {
    "read": "public",
    "create": "authenticated",
    "update": "authenticated",
    "delete": "admin"
  }
};
