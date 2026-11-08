export default {
  "name": "Review",
  "policy": {
    "read": "moderated",
    "create": "owner",
    "update": "functionOnly",
    "delete": "ownerOrAdmin"
  }
};
