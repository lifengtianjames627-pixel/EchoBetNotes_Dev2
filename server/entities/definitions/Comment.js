export default {
  "name": "Comment",
  "policy": {
    "read": "moderated",
    "create": "owner",
    "update": "admin",
    "delete": "ownerOrAdmin"
  }
};
