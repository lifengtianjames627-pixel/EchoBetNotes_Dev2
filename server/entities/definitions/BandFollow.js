export default {
  "name": "BandFollow",
  "policy": {
    "read": "public",
    "create": "authenticated",
    "update": "ownerOrAdmin",
    "delete": "ownerOrAdmin"
  }
};
