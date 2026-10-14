export default {
  "name": "Review",
  "policy": {
    "read": "moderated",
    "create": "owner",
    "update": "ownerOrAdmin",
    "delete": "ownerOrAdmin"
  }
};
