export default {
  "name": "PinnedPeer",
  "policy": {
    "read": "ownerByEmail",
    "create": "ownerByEmail",
    "update": "admin",
    "delete": "ownerByEmailOrAdmin"
  }
};
